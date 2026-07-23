#!/usr/bin/env node
'use strict';

var child = require('child_process');
var path = require('path');
var pkg = require(path.join('..', '..', 'package.json'));

var version = pkg.version;
var nsiScript = path.join('pkg', 'windows', 'bitbloq-offline.nsi');

console.log('Building NSIS installer for Bitbloq Offline v' + version);

var args = [
    '-DAPPVERSION=' + version,
    nsiScript
];

var result = child.spawnSync('makensis', args, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..')
});

if (result.error) {
    if (result.error.code === 'ENOENT') {
        console.error('ERROR: makensis not found on PATH. Install NSIS (https://nsis.sourceforge.io/).');
    } else {
        console.error('ERROR: ' + result.error.message);
    }
    process.exit(1);
}

process.exit(result.status || 0);
