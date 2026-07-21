'use strict';
const electron = require('electron');
const ipcMain = electron.ipcMain;
const globalShortcut = electron.globalShortcut;
const fs = require('fs');
const path = require('path');
const pjson = require('./package.json');
const PRODUCT_NAME = 'Bitbloq Offline';
const PRODUCT_NAME_WITH_VERSION = PRODUCT_NAME + ' v' + pjson.version;

// Servicio local de compilación/subida que reemplaza a Web2board (Python +
// PlatformIO) usando arduino-cli. Ver MIGRATE_ARDUINO_CLI.md.
const localCompilerServer = require('./localCompilerServer');
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.

// En distros modernas (glibc 2.35 / kernels 5.x) Electron 0.36 necesita
// estos switches para arrancar sin privilegios de sandbox y sin /dev/shm.
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Libera los atajos globales al cerrar la app por completo.
app.on('will-quit', function() {
    globalShortcut.unregisterAll();
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Nota: NO se crea un menú nativo de Electron (Menu.setApplicationMenu). La
    // aplicación usa su propio menú HTML en app/views/components/action-bar.html
    // (controlado por ActionBarCtrl). Un menú nativo duplicaría la barra de la
    // app y, en Linux, no se muestra dentro de la ventana.

    // Arranca el servicio local de compilación (arduino-cli) en ws://127.0.0.1:9877
    var compilerStarted = localCompilerServer.startServer(function(err) {
        // El puerto 9877 ya está en uso: casi siempre hay otra instancia de
        // Bitbloq Offline ejecutándose. Avisamos al usuario y cerramos de forma
        // controlada en lugar de dejar que el error de "listen" caiga en tiempo
        // de ejecución.
        var ocupado = err && (err.code === 'EADDRINUSE' || err.code === 'EACCES');
        var mensaje = ocupado
            ? 'No se puede iniciar Bitbloq Offline porque ya hay otra instancia ' +
              'en ejecución (el puerto 9877 está ocupado). Ciérrala y vuelve a ' +
              'intentarlo.'
            : 'No se pudo iniciar el servicio de compilación local:\n' +
              (err && err.message ? err.message : err);
        console.error('[localCompilerServer] fallo al arrancar:', err);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.destroy();
        }
        require('electron').dialog.showErrorBox('Bitbloq Offline', mensaje);
        app.quit();
    });

    if (!compilerStarted) {
        // startServer ya invocó el callback de error para avisar y cerrar.
        return;
    }

    // Create the browser window.
    mainWindow = new BrowserWindow({
        show: false,
        minWidth: 800,
        minHeight: 600,
        width: 1440,
        height: 800,
        center: true,
        minimizable: true,
        maximizable: true,
        movable: true,
        closable: true,
        fullscreen: false,
        fullscreenable: true,
        title: PRODUCT_NAME_WITH_VERSION,
        icon: __dirname + '/app/images/bitbloq_ico.png'
    });
    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    // mainWindow.center();
    mainWindow.show();

    // Atajos de teclado. Al haber quitado el menú nativo de Electron, sus
    // accelerators dejaron de funcionar; los registramos aquí y los reenviamos
    // al renderer vía el mismo canal IPC 'menu-action' que usaba el menú nativo.
    // Cada entrada [accelerator, acción] debe coincidir con menuTree en
    // actionBar.js y con los 'menu-action' que escucha el ActionBarCtrl.
    var appShortcuts = [
        ['CommandOrControl+N', 'new-project'],
        ['CommandOrControl+O', 'open-project'],
        ['CommandOrControl+S', 'save-project'],
        ['CommandOrControl+Shift+S', 'save-project-as'],
        ['CommandOrControl+Shift+C', 'copy-code'],
        ['CommandOrControl+Plus', 'zoom-in'],
        ['CommandOrControl+=', 'zoom-in'],
        ['CommandOrControl+-', 'zoom-out'],
        ['CommandOrControl+0', 'zoom-reset']
    ];
    appShortcuts.forEach(function(pair) {
        try {
            globalShortcut.register(pair[0], function() {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('menu-action', pair[1]);
                }
            });
        } catch (e) {
            console.error('[shortcut] no se pudo registrar', pair[0], e.message);
        }
    });

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.setTitle(PRODUCT_NAME_WITH_VERSION);
    });

    // Abre la carpeta de logs en el gestor de archivos del sistema. Se hace en
    // el proceso principal porque shell.openExternal funciona de forma fiable
    // aquí (vía remote shell en el renderer era unreliable en Electron 4).
    // Actualiza la barra de título de la ventana con el nombre del proyecto
    // abierto y un asterisco (*) si hay cambios sin guardar (estilo LibreOffice).
    ipcMain.on('update-window-title', function (event, title) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (title) {
                // Mostrar nombre del archivo/abierto o proyecto sin título + versión
                mainWindow.setTitle(title + ' - ' + PRODUCT_NAME_WITH_VERSION);
            } else {
                // Mostrar solo la versión (cuando no hay archivo/abierto o proyecto sin título)
                mainWindow.setTitle(PRODUCT_NAME_WITH_VERSION);
            }
        }
    });

    ipcMain.on('open-logs-folder', function () {
        try {
            var logsDir = path.join(app.getPath('userData'), 'logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir);
            }
            electron.shell.openExternal('file://' + logsDir);
        } catch (e) {
            console.error('[open-logs-folder]', e);
        }
    });

    // Borra el contenido de la carpeta de logs (no la carpeta en sí, para poder
    // seguir registrando). Se ejecuta en el proceso principal por robustez.
    ipcMain.on('clear-logs-folder', function () {
        try {
            var logsDir = path.join(app.getPath('userData'), 'logs');
            if (fs.existsSync(logsDir)) {
                fs.readdirSync(logsDir).forEach(function (entry) {
                    var entryPath = path.join(logsDir, entry);
                    try {
                        var stat = fs.statSync(entryPath);
                        if (stat.isDirectory()) {
                            fs.rmdirSync(entryPath, { recursive: true });
                        } else {
                            fs.unlinkSync(entryPath);
                        }
                    } catch (e) {
                        console.error('[clear-logs-folder] entry', entry, e.message);
                    }
                });
            }
        } catch (e) {
            console.error('[clear-logs-folder]', e);
        }
    });


    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null;
        globalShortcut.unregisterAll();
        if (process.platform === 'darwin') {
            app.quit();
        }
    });
    // mainWindow.setMenu(null);

});