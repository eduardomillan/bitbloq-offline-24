'use strict';

/**
 * Genera dist/web2board/web2board-manifest.json con la versión, nombre de
 * archivo, tamaño y SHA-256 de cada ZIP de web2board previamente generado.
 * Este manifest es el que la app slim consulta para descargar web2board
 * bajo demanda desde GitHub Releases.
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var WEB2BOARD_VERSION = '2.1.3';
var distDir = path.join(__dirname, '..', '..', 'dist', 'web2board');

var targets = {
    linux: 'web2board-linux-x64.zip',
    win32: 'web2board-win32.zip'
};

function sha256(filePath) {
    var hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

var manifest = {
    version: WEB2BOARD_VERSION,
    generatedAt: new Date().toISOString(),
    platforms: {}
};

Object.keys(targets).forEach(function (os) {
    var fileName = targets[os];
    var filePath = path.join(distDir, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn('[web2board-manifest] No encontrado: ' + fileName + ' (se omite)');
        return;
    }
    var stat = fs.statSync(filePath);
    manifest.platforms[os] = {
        file: fileName,
        size: stat.size,
        sha256: sha256(filePath)
    };
    console.log('[web2board-manifest] ' + fileName + ' (' + stat.size + ' bytes)');
});

var out = path.join(distDir, 'web2board-manifest.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log('[web2board-manifest] Escrito ' + out);
