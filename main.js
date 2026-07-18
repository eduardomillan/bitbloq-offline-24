'use strict';
const electron = require('electron');
const ipcMain = electron.ipcMain;
const Menu = electron.Menu;
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

// Build the application menu template
function createMenuTemplate() {
    var template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'new-project');
                        }
                    }
                },
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'open-project');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'save-project');
                        }
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'save-project-as');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export Arduino Code',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'export-arduino-code');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Change Language',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'change-language');
                        }
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Copy Code to Clipboard',
                    accelerator: 'CmdOrCtrl+Shift+C',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'copy-code');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'undo', label: 'Undo' },
                { role: 'redo', label: 'Redo' },
                { type: 'separator' },
                { role: 'cut', label: 'Cut' },
                { role: 'copy', label: 'Copy' },
                { role: 'paste', label: 'Paste' },
                { role: 'selectall', label: 'Select All' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Open Logs Folder',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'open-logs');
                        }
                    }
                },
                {
                    label: 'Clear Logs',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'clear-logs');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'reload', label: 'Reload' },
                { role: 'forcereload', label: 'Force Reload' },
                { role: 'toggledevtools', label: 'Toggle Developer Tools' },
                { type: 'separator' },
                { role: 'resetzoom', label: 'Actual Size' },
                { role: 'zoomin', label: 'Zoom In' },
                { role: 'zoomout', label: 'Zoom Out' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Toggle Full Screen' }
            ]
        },
        {
            label: 'Zoom',
            submenu: [
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'zoom-in');
                        }
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'zoom-out');
                        }
                    }
                },
                {
                    label: 'Reset Zoom',
                    accelerator: 'CmdOrCtrl+0',
                    click: function() {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu-action', 'zoom-reset');
                        }
                    }
                }
            ]
        }
    ];

    // On macOS, add the standard application menu
    if (process.platform === 'darwin') {
        template.unshift({
            label: PRODUCT_NAME,
            submenu: [
                { role: 'about', label: 'About ' + PRODUCT_NAME },
                { type: 'separator' },
                { role: 'services', label: 'Services', submenu: [] },
                { type: 'separator' },
                { role: 'hide', label: 'Hide ' + PRODUCT_NAME },
                { role: 'hideothers', label: 'Hide Others' },
                { role: 'unhide', label: 'Show All' },
                { type: 'separator' },
                { role: 'quit', label: 'Quit ' + PRODUCT_NAME }
            ]
        });

        // Window menu for macOS
        template.push({
            label: 'Window',
            role: 'window',
            submenu: [
                { role: 'minimize', label: 'Minimize' },
                { role: 'close', label: 'Close' }
            ]
        });
    }

    return template;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    // Create the application menu
    var menuTemplate = createMenuTemplate();
    var menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

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

    // Abre la carpeta de logs en el gestor de archivos del sistema. Se hace en
    // el proceso principal porque shell.openExternal funciona de forma fiable
    // aquí (vía remote shell en el renderer era unreliable en Electron 4).
    // Actualiza la barra de título de la ventana con el nombre del proyecto
    // abierto y un asterisco (*) si hay cambios sin guardar (estilo LibreOffice).
    ipcMain.on('update-window-title', function (event, title) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.setTitle(title);
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
        if (process.platform === 'darwin') {
            app.quit();
        }
    });
    // mainWindow.setMenu(null);
});