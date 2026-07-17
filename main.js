'use strict';
const electron = require('electron');
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
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

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.setTitle(PRODUCT_NAME_WITH_VERSION);
    });


    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        mainWindow = null;
        if (process.platform === 'darwin') {
            app.quit();
        }
    });
    // mainWindow.setMenu(null);
});