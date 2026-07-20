'use strict';

/**
 * localCompilerServer.js
 *
 * Reemplaza el servidor WebSocket de Web2board (Python + PlatformIO) por un
 * servicio local que usa `arduino-cli` para compilar y subir código a placas
 * Arduino, y `arduino-cli monitor` para el monitor serie.
 *
 * Habla el mismo protocolo WS-Hubs que espera el frontend (WSHubsApi.js), por
 * lo que web2board.js / plotter.js no necesitan cambios de protocolo.
 *
 * Ver MIGRATE_ARDUINO_CLI.md para más detalles.
 */

var fs = require('fs');
var os = require('os');
var path = require('path');
var spawn = require('child_process').spawn;
var wsLib = require('ws');

var WS_PORT = 9877;

// Bibliotecas de Bitbloq (equivalente a las que Web2board empaquetaba en su
// workspace). Se pasan a arduino-cli con --libraries para que los #include
// <BitbloqZowi.h> etc. se resuelvan.
var BITBLOQ_LIBS_DIR = path.join(__dirname, 'res', 'libs', 'v1_1_3');

// ---------------------------------------------------------------------------
// Configuración de placas: token (board.mcu) -> FQBN de arduino-cli
// ---------------------------------------------------------------------------
var BOARD_MAP = {
    uno: 'arduino:avr:uno',
    bt328: 'arduino:avr:uno',            // bq ZUM BT-328 (atmega328p)
    nanoatmega168: 'arduino:avr:nano:cpu=atmega168',
    nano: 'arduino:avr:nano',
    mega: 'arduino:avr:mega',
    diemilanove: 'arduino:avr:diecimila'
};

function fqbnFor(token) {
    if (!token) {
        return BOARD_MAP.uno;
    }
    return BOARD_MAP[token] || BOARD_MAP.uno;
}

function arduinoCli() {
    return process.env.ARDUINO_CLI || 'arduino-cli';
}

// ---------------------------------------------------------------------------
// Utilidades de ejecución de procesos
// ---------------------------------------------------------------------------
function runCommand(cmd, args, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
        var child = spawn(cmd, args, { cwd: opts.cwd, env: process.env });
        var out = '';
        var err = '';
        child.stdout.on('data', function (d) { out += d.toString(); });
        child.stderr.on('data', function (d) { err += d.toString(); });
        child.on('close', function (code) {
            resolve({ code: code, out: out, err: err });
        });
        child.on('error', function (e) {
            resolve({ code: -1, out: out, err: err + '\n' + e.message });
        });
    });
}

// Directorio temporal por petición para evitar condiciones de carrera
function makeSketchDir() {
    var base = fs.mkdtempSync(path.join(os.tmpdir(), 'bitbloq-sketch-'));
    var sketch = path.join(base, 'sketch');
    fs.mkdirSync(sketch);
    return { base: base, sketch: sketch };
}

// ---------------------------------------------------------------------------
// CodeHub: compile / upload / uploadHex
// ---------------------------------------------------------------------------
function writeSketch(sketchDir, code) {
    fs.writeFileSync(path.join(sketchDir, 'sketch.ino'), code);
}

function doCompile(token, code) {
    var dirs = makeSketchDir();
    var buildPath = path.join(dirs.base, 'build');
    writeSketch(dirs.sketch, code);
    var fqbn = fqbnFor(token);
    var compileArgs = [
        'compile',
        '--fqbn', fqbn,
        '--build-path', buildPath
    ];
    if (fs.existsSync(BITBLOQ_LIBS_DIR)) {
        compileArgs.push('--libraries', BITBLOQ_LIBS_DIR);
    }
    compileArgs.push(dirs.sketch);
    return runCommand(arduinoCli(), compileArgs).then(function (result) {
        return {
            result: result,
            buildPath: buildPath,
            sketch: dirs.sketch,
            hexPath: path.join(buildPath, 'sketch.ino.hex')
        };
    });
}

function doUpload(token, code, port) {
    return doCompile(token, code).then(function (compiled) {
        if (compiled.result.code !== 0) {
            return { ok: false, out: compiled.result.out, err: compiled.result.err };
        }
        var fqbn = fqbnFor(token);
        return runCommand(arduinoCli(), [
            'upload',
            '-b', fqbn,
            '-p', port,
            '--input-dir', compiled.buildPath,
            compiled.sketch
        ]).then(function (result) {
            return { ok: result.code === 0, out: result.out, err: result.err };
        });
    });
}

function doUploadHex(token, hexText, port) {
    var dirs = makeSketchDir();
    var hexPath = path.join(dirs.base, 'factory.hex');
    fs.writeFileSync(hexPath, hexText);
    var fqbn = fqbnFor(token);
    return runCommand(arduinoCli(), [
        'upload',
        '-b', fqbn,
        '-p', port,
        '--input-file', hexPath
    ]).then(function (result) {
        return { ok: result.code === 0, out: result.out, err: result.err };
    });
}

// ---------------------------------------------------------------------------
// SerialMonitorHub
// ---------------------------------------------------------------------------
var monitorProcesses = {};  // port -> child process

function listPorts() {
    return runCommand(arduinoCli(), ['board', 'list', '--json']).then(function (r) {
        try {
            var parsed = JSON.parse(r.out);
            // arduino-cli >= 0.20 usa "detected_ports"; versiones antiguas "ports"
            var detectedKey = 'detected_ports';
            var rawList = parsed[detectedKey] || parsed.ports || [];
            var addresses = [];
            rawList.forEach(function (entry) {
                // Cada entrada puede ser { port: { address } } o { address }
                var portObj = entry.port || entry;
                if (portObj && portObj.address) {
                    addresses.push(portObj.address);
                }
            });
            return addresses;
        } catch (e) {
            return [];
        }
    });
}

function findBoardPort() {
    return runCommand(arduinoCli(), ['board', 'list', '--json']).then(function (r) {
        try {
            var parsed = JSON.parse(r.out);
            // arduino-cli >= 0.20 usa "detected_ports"; versiones antiguas "ports"
            var rawList = parsed.detected_ports || parsed.ports || [];
            var usbCandidates = [];
            var anyCandidate = null;
            rawList.forEach(function (entry) {
                var portObj = entry.port || entry;
                var address = portObj && portObj.address;
                if (!address) {
                    return;
                }
                // Un Zowi (o placa real conectada) expone "serialNumber" en
                // properties y "hardware_id"; los puertos serie ficticios de
                // placa base (ttyS*) no los tienen. Usamos ambos como señal de
                // que hay un dispositivo real conectado.
                var serial = (portObj.properties && portObj.properties.serialNumber) || portObj.hardware_id;
                if (!serial) {
                    return;
                }
                if (/tty(USB|ACM)/.test(address)) {
                    usbCandidates.push(address);
                } else if (!anyCandidate) {
                    anyCandidate = address;
                }
            });
            var candidate = usbCandidates.length ? usbCandidates[0] : anyCandidate;
            if (candidate) {
                return { found: true, port: candidate };
            }
            return { found: false, port: null };
        } catch (e) {
            return { found: false, port: null };
        }
    });
}

// Busca el puerto reintentando durante un tiempo, para dar margen a que el
// usuario conecte la placa DESPUÉS de haber abierto el programa. Sin esto, la
// carga fallaba de inmediato con BOARD_NOT_READY si el robot no estaba conectado
// en el momento de pulsar "Cargar".
function findBoardPortWithRetry(tries, intervalMs) {
    tries = tries || 10;
    intervalMs = intervalMs || 1000;
    function attempt(n) {
        return findBoardPort().then(function (portInfo) {
            if (portInfo.found) {
                return portInfo;
            }
            if (n <= 1) {
                return { found: false, port: null };
            }
            return new Promise(function (resolve) {
                setTimeout(function () {
                    attempt(n - 1).then(resolve);
                }, intervalMs);
            });
        });
    }
    return attempt(tries);
}

function startMonitor(port, baudrate, push) {
    stopMonitor(port);
    var args = ['monitor', '-p', port, '-c', 'baudrate=' + (baudrate || 9600)];
    var child = spawn(arduinoCli(), args, { env: process.env });
    monitorProcesses[port] = child;
    child.stdout.on('data', function (d) {
        pushLines(push, port, d.toString());
    });
    child.stderr.on('data', function (d) {
        pushLines(push, port, d.toString());
    });
    child.on('close', function () {
        delete monitorProcesses[port];
    });
}

function pushLines(push, port, text) {
    text.split('\n').forEach(function (line) {
        if (line.length) {
            push('SerialMonitorHub', 'received', [port, line]);
        }
    });
}

function stopMonitor(port) {
    var child = monitorProcesses[port];
    if (child) {
        try { child.kill(); } catch (e) { /* ignore */ }
        delete monitorProcesses[port];
    }
}

// ---------------------------------------------------------------------------
// Servidor WebSocket (protocolo WS-Hubs)
// ---------------------------------------------------------------------------
function startServer(onError) {
    // Creamos el server HTTP nosotros mismos para poder capturar el error de
    // "listen" (EADDRINUSE/EACCES) antes de que se propague como excepción no
    // controlada. En versiones antiguas de `ws` (1.x) el server interno no
    // re-emite el error, así que enganchamos el listener en el server de Node.
    var http = require('http');
    var httpServer = http.createServer();
    var wss;

    httpServer.on('error', function (e) {
        if (typeof onError === 'function') {
            onError(e);
        }
    });

    try {
        wss = new wsLib.Server({ server: httpServer });
    } catch (e) {
        if (typeof onError === 'function') {
            onError(e);
        }
        return null;
    }

    // Si el puerto ya está en uso (p.ej. otra instancia de Bitbloq Offline
    // corriendo) el server emite 'error' y lo capturamos arriba para no dejar
    // que la excepción no controlada cierre la aplicación.
    wss.on('error', function (e) {
        if (typeof onError === 'function') {
            onError(e);
        }
        try { wss.close(); } catch (err) { /* ignore */ }
    });

    try {
        httpServer.listen(WS_PORT, '127.0.0.1');
    } catch (e) {
        if (typeof onError === 'function') {
            onError(e);
        }
        return null;
    }

    httpServer.on('listening', function () {
        console.log('[localCompilerServer] WebSocket escuchando en ws://127.0.0.1:' + WS_PORT);
    });

    function send(ws, msg) {
        if (ws.readyState === wsLib.OPEN) {
            ws.send(JSON.stringify(msg));
        }
    }

    // Push servidor -> cliente (no lleva ID de respuesta)
    function push(ws, hub, func, args) {
        send(ws, { hub: hub, function: func, args: args });
    }

    function reply(ws, ID, success, result) {
        send(ws, { ID: ID, success: success, reply: result });
    }

    wss.on('connection', function (ws) {
        ws.on('message', function (raw) {
            var msg;
            try {
                msg = JSON.parse(raw);
            } catch (e) {
                return;
            }
            handleMessage(ws, msg.hub, msg.function, msg.args || [], msg.ID, push, reply);
        });
    });

    return wss;
}

// ---------------------------------------------------------------------------
// Enrutado de mensajes
// ---------------------------------------------------------------------------
function handleMessage(ws, hub, func, args, ID, push, reply) {
    try {
        if (hub === 'UtilsAPIHub') {
            if (func === 'set_id') { return reply(ws, ID, true, 'ok'); }
            if (func === 'get_id') { return reply(ws, ID, true, 'Bitbloq'); }
            return reply(ws, ID, true, true);
        }

        if (hub === 'WindowHub') {
            // Ya no hay ventana de Web2board; noop
            return reply(ws, ID, true, 'ok');
        }

        if (hub === 'CodeHub') {
            return handleCodeHub(ws, func, args, ID, push, reply);
        }

        if (hub === 'SerialMonitorHub') {
            return handleSerialMonitorHub(ws, func, args, ID, push, reply);
        }

        return reply(ws, ID, true, null);
    } catch (e) {
        return reply(ws, ID, false, { title: 'INTERNAL_ERROR', stdErr: e.message });
    }
}

function handleCodeHub(ws, func, args, ID, push, reply) {
    if (func === 'compile') {
        var code = args[0];
        push(ws, 'CodeHub', 'isCompiling', []);
        return doCompile(null, code).then(function (compiled) {
            if (compiled.result.code === 0) {
                return reply(ws, ID, true, { success: true, out: compiled.result.out });
            }
            return reply(ws, ID, false,
                { title: 'COMPILE_ERROR', stdErr: compiled.result.err || compiled.result.out });
        });
    }

    if (func === 'upload') {
        var upCode = args[0];
        var token = args[1];
        push(ws, 'CodeHub', 'isUploading', ['uploading']);
        return findBoardPortWithRetry().then(function (portInfo) {
            if (!portInfo.found) {
                return reply(ws, ID, false, { title: 'BOARD_NOT_READY', stdErr: 'No port found' });
            }
            push(ws, 'CodeHub', 'isUploading', [portInfo.port]);
            return doUpload(token, upCode, portInfo.port).then(function (res) {
                if (res.ok) {
                    return reply(ws, ID, true, portInfo.port);
                }
                return reply(ws, ID, false, { title: 'UPLOAD_ERROR', stdErr: res.err || res.out });
            });
        });
    }

    if (func === 'upload_hex') {
        var hexText = args[0];
        var hexToken = args[1];
        return findBoardPortWithRetry().then(function (portInfo) {
            if (!portInfo.found) {
                return reply(ws, ID, false, { title: 'BOARD_NOT_READY', stdErr: 'No port found' });
            }
            return doUploadHex(hexToken, hexText, portInfo.port).then(function (res) {
                if (res.ok) {
                    return reply(ws, ID, true, portInfo.port);
                }
                return reply(ws, ID, false, { title: 'UPLOAD_ERROR', stdErr: res.err || res.out });
            });
        });
    }

    return reply(ws, ID, true, null);
}

function handleSerialMonitorHub(ws, func, args, ID, push, reply) {
    if (func === 'find_board_port') {
        return findBoardPort().then(function (portInfo) {
            if (portInfo.found) {
                return reply(ws, ID, true, portInfo.port);
            }
            return reply(ws, ID, false, { title: 'BOARD_NOT_READY', stdErr: 'No port found' });
        });
    }

    if (func === 'start_app') {
        // Preparar/abrir monitor (noop de apertura de ventana)
        return reply(ws, ID, true, 'ok');
    }

    if (func === 'start_connection') {
        var port = args[0];
        var baudrate = args[1] || 9600;
        startMonitor(port, baudrate, function (h, f, a) { push(ws, h, f, a); });
        push(ws, 'SerialMonitorHub', 'baudrateChanged', [port, baudrate]);
        return reply(ws, ID, true, 'ok');
    }

    if (func === 'write') {
        var wPort = args[0];
        var data = args[1];
        var child = monitorProcesses[wPort];
        if (child && child.stdin) {
            child.stdin.write(data);
            push(ws, 'SerialMonitorHub', 'written', [wPort, data]);
        }
        return reply(ws, ID, true, 'ok');
    }

    if (func === 'change_baudrate') {
        var cbPort = args[0];
        var cbBaud = args[1];
        startMonitor(cbPort, cbBaud, function (h, f, a) { push(ws, h, f, a); });
        push(ws, 'SerialMonitorHub', 'baudrateChanged', [cbPort, cbBaud]);
        return reply(ws, ID, true, 'ok');
    }

    if (func === 'close_connection') {
        stopMonitor(args[0]);
        return reply(ws, ID, true, 'ok');
    }

    if (func === 'is_port_connected') {
        return reply(ws, ID, true, !!monitorProcesses[args[0]]);
    }

    if (func === 'get_available_ports') {
        return listPorts().then(function (ports) {
            return reply(ws, ID, true, ports);
        });
    }

    return reply(ws, ID, true, null);
}

module.exports = { startServer: startServer };
