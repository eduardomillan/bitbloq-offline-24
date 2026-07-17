'use strict';

/**
 * @ngdoc service
 * @name bitbloqOffline.web2board
 * @description
 * # web2board
 * Service in the bitbloqOffline.
 */
angular.module('bitbloqOffline')
    .factory('web2board', function ($rootScope, $log, $q, _, $timeout, common, alertsService, WSHubsAPI, OpenWindow, $location, nodeFs, nodeRemote, ngDialog, commonModals, web2boardLocator) {

        /** Variables */
        var web2board = this,
            api,
            inProgress = false,
            usingPort = null,
            TIME_FOR_WEB2BOARD_TO_START = 700,
            w2bToast = null,
            plotterWin = null, //ms
            nodePath = require('path'),
            nodeClipboard = require('electron').clipboard,
            LOG_DIR = nodePath.join(nodeRemote.app.getPath('userData'), 'logs'),
            LOG_FILE = nodePath.join(LOG_DIR, 'bitbloq-offline.log');

        /**
         * Persist compile/upload/websocket errors to a file so they can be
         * inspected later. The full payload (including Arduino stdErr) is saved.
         */
        function logError(tag, payload) {
            try {
                if (!nodeFs.existsSync(LOG_DIR)) {
                    nodeFs.mkdirSync(LOG_DIR);
                }
                var line = new Date().toISOString() + ' [' + tag + '] ' +
                    (typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)) + '\n';
                nodeFs.appendFileSync(LOG_FILE, line);
            } catch (e) {
                // Never break the UI because of a logging failure
            }
        }

        /**
         * Show an error toast that only displays the first part of the message
         * (with scrollbars via the alert--error-detail CSS class) while keeping
         * the complete text available to copy through the "Copiar" button.
         */
        function showErrorWithCopy(tag, fullError) {
            logError(tag, fullError);
            var text = (fullError && fullError.stdErr) ? fullError.stdErr
                : (typeof fullError === 'string' ? fullError : JSON.stringify(fullError));
            var preview = text.split('\n')[0].slice(0, 200);
            alertsService.add('alert-web2board-error-detail', 'alert-web2board-error-detail', 'warning', undefined, preview, false, false,
                'alert-copy-error', function () {
                    try {
                        if (nodeClipboard && nodeClipboard.writeText) {
                            nodeClipboard.writeText(text);
                        }
                    } catch (e) {
                        // clipboard may be unavailable in some contexts
                    }
                });
        }

        /**
         * Show a board-related error toast (e.g. "board not found") that also
         * offers a "Copiar" button so the user can copy the message when asking
         * for support. `key` is the locale key; `message` is the text copied.
         */
        function showBoardErrorWithCopy(key, message) {
            alertsService.add(key, 'web2board', 'warning', undefined, undefined, false, false,
                'alert-copy-error', function () {
                    try {
                        if (nodeClipboard && nodeClipboard.writeText) {
                            nodeClipboard.writeText(message || key);
                        }
                    } catch (e) {
                        // clipboard may be unavailable in some contexts
                    }
                });
        }

        web2board.config = {
            wsHost: '127.0.0.1',
            wsPort: 9877,
            serialPort: ''
        };

        // Web2Board is a separate project (https://github.com/eduardomillan/web2board)
        // and is NOT downloaded by Bitbloq Offline. The user must install it
        // somewhere on the system and (optionally) tell Bitbloq Offline where it is
        // through the configurable path in common.settings.web2boardPath.
        //

        /**
         * Candidate directories where Web2Board may be installed, in priority
         * order:
         *   1. Path configured by the user in Bitbloq Offline settings.
         *   2. Already running locally (only the port check matters; nothing to
         *      launch). This is implicit: if Web2Board is up we don't need a path.
         *   3. /opt/web2board (or similar) on the system.
         *   4. The directory the application is executed from.
         *   5. The execution directory's resources/web2board folder.
         *   6. ~/.config/bitbloq-offline/web2board (legacy / manual install).
         */
        function getCandidateDirs() {
            var path = require('path'),
                dirs = [];

            // 1. User-configured path (a folder or the launcher itself).
            var cfg = (common.settings && common.settings.web2boardPath) || '';
            cfg = (cfg || '').trim();
            if (cfg) {
                dirs.push(cfg);
            }

            // 3. /opt on the system.
            dirs.push('/opt/web2board');
            dirs.push('/opt');

            // 4. Execution directory (main module folder).
            var execDir = process.mainModule ? path.dirname(process.mainModule.filename) : __dirname;
            dirs.push(execDir);

            // 5. Execution directory's resources/web2board.
            dirs.push(path.join(execDir, 'resources', 'web2board'));
            if (process.resourcesPath) {
                dirs.push(path.join(process.resourcesPath, 'web2board'));
            }

            // 6. User data directory (legacy manual install).
            dirs.push(path.join(nodeRemote.app.getPath('userData'), 'web2board'));

            return dirs;
        }

        /**
         * Normalize a candidate entry to a launcher path. Delegates to the shared
         * web2boardLocator so detection and settings validation agree.
         */
        function candidateToLauncher(candidate) {
            return web2boardLocator.resolve(candidate);
        }

        var cachedCommand = null;

        function getWeb2boardCommand() {
            if (cachedCommand && require('fs').existsSync(cachedCommand)) {
                return cachedCommand;
            }
            var dirs = getCandidateDirs(),
                fs = require('fs');
            for (var i = 0; i < dirs.length; i++) {
                var launcher = candidateToLauncher(dirs[i]);
                if (launcher && fs.existsSync(launcher)) {
                    cachedCommand = launcher;
                    return launcher;
                }
            }
            return null;
        }

        function isWeb2boardAvailable() {
            return !!getWeb2boardCommand();
        }

        /**
         * If Web2Board cannot be found anywhere, inform the user that it must be
         * installed and point them to the configured (and editable) path.
         */
        function notifyWeb2boardMissing() {
            logError('W2B_NOT_FOUND', 'Web2Board not found in any known location');
            var cfg = (common.settings && common.settings.web2boardPath) || '';
            var detail = cfg ? (' (' + cfg + ')') : '';
            alertsService.add('alert-web2board-not-found', 'web2board', 'warning', undefined, detail, false, false,
                'web2board-settings-open', function () {
                    commonModals.launchWeb2BoardSettingsModal();
                });
        }

        function showUpdateModal() {
            logError('W2B_NOT_DETECTED', 'W2b not detected');
            alert("W2b not detected");
        }

        // La compilación/subida ahora la gestiona el servicio local
        // (localCompilerServer.js en el proceso principal de Electron, que usa
        // arduino-cli). Ya no se arranca el binario Python de Web2board.
        // Ver MIGRATE_ARDUINO_CLI.md.
        function startWeb2board() {
            console.log('[web2board] Usando servicio local (arduino-cli) en lugar de Web2board Python.');
        }

        function launchWeb2board() {
            // No-op: el servicio local ya está corriendo en ws://127.0.0.1:9877
        }

        function openCommunication(callback, showUpdateModalFlag, tryCount) {
            // Prioridad 1: si ya hay un web2board corriendo en el puerto, conectamos.
            // Solo si la conexión falla (tryCount > 0) y no se encontró el binario,
            // avisamos al usuario.
            doOpenCommunication(callback, showUpdateModalFlag, tryCount);
        }

        function doOpenCommunication(callback, showUpdateModalFlag, tryCount) {
            tryCount = tryCount || 0;
            tryCount++;
            if (tryCount === 1) {
                w2bToast = alertsService.add('web2board_toast_startApp', 'web2board', 'loading');
            }

            showUpdateModalFlag = showUpdateModalFlag === true && tryCount >= 20;
            callback = callback || function () {
                };

            if (!api.wsClient || (api.wsClient.readyState !== WebSocket.CONNECTING && api.wsClient.readyState !== WebSocket.OPEN)) {
                api.connect().done(function () {
                        api.wsClient.couldSuccessfullyConnect = true;
                        alertsService.close(w2bToast);
                        api.UtilsAPIHub.server.setId("Bitbloq").done(callback);
                    },
                    function () { //on error
                        if (showUpdateModalFlag) {
                            alertsService.close(w2bToast);
                            showUpdateModal();
                        } else {
                            if (tryCount === 1) {
                                // we only need to start web2board once
                                startWeb2board();
                            }
                            $timeout(function () {
                                openCommunication(callback, true, tryCount);
                            }, TIME_FOR_WEB2BOARD_TO_START);
                        }
                    }
                );
            } else {
                api.UtilsAPIHub.server.getId().done(callback, function () {
                    api.wsClient = null;
                    startWeb2board();
                    openCommunication(callback, showUpdateModalFlag, 0);
                }, 2000);
            }
        }

        function handleUploadError(error) {
            if (error.title === 'COMPILE_ERROR') {
                showErrorWithCopy('UPLOAD', error.stdErr);
            } else if (error.title === 'BOARD_NOT_READY') {
                showBoardErrorWithCopy('alert-web2board-no-port-found');
            } else {
                showErrorWithCopy('UPLOAD', error);
            }
        }

        function removeInProgressFlag() {
            $rootScope.$apply(function () {
                inProgress = false;
            });
        }

        function isBoardReady(board) {
            if (!board) {
                showBoardErrorWithCopy('alert-web2board-boardNotReady');
            }
            return board;
        }

        function openPlotter(board, port) {
            port = port.split("/").join("_");
            var windowArguments = {
                url: 'plotter/' + port + '/' + board.mcu,
                title: 'Plotter',
                width: 800,
                height: 600,
                'min-width': 500,
                'min-height': 200
            };

            plotterWin = OpenWindow.open(windowArguments, function () {
                $timeout(function () {
                    // api.SerialMonitorHub.server.closeConnection(port);
                    api.SerialMonitorHub.server.unsubscribeFromHub();
                }, 0);
            });
        }

        function closePlotter() {
            try {
                plotterWin.close();
            } catch (e) {
                // catching error if plotterWin is already closed
            }
        }

        function closeUsingPort(cb) {
            closePlotter();
            if (usingPort) {
                console.log("closing port", usingPort);
                api.SerialMonitorHub.server.closeConnection(usingPort)
                    .done(cb, cb, 2000);
            } else {
                cb()
            }
        }

        api = WSHubsAPI.construct('ws://' + web2board.config.wsHost + ':' + web2board.config.wsPort, 45);

        api.defaultErrorHandler = function (error) {
            $log.error('Error receiving message: ' + error);
            logError('WS', error);
        };

        api.callbacks.onClose = function (error) {
            $log.error('web2board disconnected with error: ' + error.reason);
            logError('WS_CLOSE', error && error.reason);
            api.clearTriggers();
            inProgress = false;
            if (api.wsClient.couldSuccessfullyConnect) {
                alertsService.add('web2board_toast_closedUnexpectedly', 'web2board', 'warning');
            }
        };

        api.callbacks.onMessageError = function (error) {
            $log.error('Error receiving message: ' + error);
            logError('WS_MESSAGE', error);
            api.wsClient.close();
        };

        api.CodeHub.client.isCompiling = function () {
            alertsService.add('alert-web2board-compiling', 'web2board', 'loading', undefined);
        };

        api.CodeHub.client.isUploading = function (port) {
            alertsService.add('alert-web2board-uploading', 'web2board', 'loading', undefined, port);
        };

        api.CodeHub.client.isSettingPort = function (port) {
            $log.debug('is setting port in: ' + port);
            web2board.serialPort = port;
        };

        web2board.verify = function (code) {
            //It is not mandatory to have a board connected to verify the code
            if (!inProgress) {
                inProgress = true;
                openCommunication(function () {
                    api.CodeHub.server.compile(code).done(function () {
                        alertsService.add('alert-web2board-compile-verified', 'web2board', 'ok', 5000);
                    }, function (error) {
                        showErrorWithCopy('VERIFY', error);
                    }).finally(removeInProgressFlag);
                });
            }
        };

        web2board.upload = function (board, code) {
            if (!inProgress) {
                closePlotter();
                if (!code || !board) {
                    showBoardErrorWithCopy('alert-web2board-boardNotReady');
                    return;
                }
                inProgress = true;
                openCommunication(function () {
                    alertsService.add('alert-web2board-settingBoard', 'web2board', 'loading');
                    api.CodeHub.server.upload(code, board.mcu).done(function () {
                        alertsService.add('alert-web2board-code-uploaded', 'web2board', 'ok', 5000);
                    }, handleUploadError).finally(removeInProgressFlag);
                });
            }
        };

        web2board.serialMonitor = function (board) {
            if (!inProgress && isBoardReady(board)) {
                inProgress = true;
                openCommunication(function () {
                    closeUsingPort(function () {
                        var serialMonitorAlert = alertsService.add('alert-web2board-openSerialMonitor', 'web2board', 'loading');
                        api.SerialMonitorHub.server.findBoardPort(board.mcu).done(function (port) {
                            usingPort = port;
                            api.SerialMonitorHub.server.startApp(port, board.mcu).done(function () {
                                alertsService.close(serialMonitorAlert);
                            }, function () {
                                showBoardErrorWithCopy('alert-web2board-no-port-found');
                            }).finally(removeInProgressFlag);
                        }, function () {
                            showBoardErrorWithCopy('alert-web2board-no-port-found');
                        }).finally(removeInProgressFlag);
                    });
                });
            }
        };

        web2board.version = function () {
            openCommunication();
        };

        web2board.uploadHex = function (boardMcu, hexText) {
            closePlotter();
            openCommunication(function () {
                alertsService.add('alert-web2board-settingBoard', 'web2board', 'loading');
                api.CodeHub.server.uploadHex(hexText, boardMcu).done(function (port) {
                    alertsService.add('alert-web2board-code-uploaded', 'web2board', 'ok', 5000, port);
                }, handleUploadError).finally(removeInProgressFlag);
            });
        };

        web2board.showApp = function () {
            openCommunication(function () {
                alertsService.add('web2board_toast_showingApp', 'web2board', 'loading');
                api.WindowHub.server.showApp().done(function () {
                    alertsService.add('web2board_toast_successfullyOpened', 'web2board', 'ok', 3000);
                });
            });
        };

        web2board.showPlotter = function (board) {
            if (!inProgress && isBoardReady(board)) {
                openCommunication(function () {
                    closeUsingPort(function () {
                        var chartMonitorAlert = alertsService.add('alert-web2board-openPlotter', 'web2board', 'loading');
                        api.SerialMonitorHub.server.findBoardPort(board.mcu).done(function (port) {
                            usingPort = port;
                            alertsService.close(chartMonitorAlert);
                            openPlotter(board, port);
                        }, function () {
                            alertsService.close(chartMonitorAlert);
                            showBoardErrorWithCopy('alert-web2board-no-port-found');
                        }).finally(removeInProgressFlag);
                    });
                });
            }
        };

        return {
            verify: web2board.verify,
            upload: web2board.upload,
            serialMonitor: web2board.serialMonitor,
            version: web2board.version,
            uploadHex: web2board.uploadHex,
            showWeb2board: web2board.showApp,
            showPlotter: web2board.showPlotter,
            isInProcess: function () {
                return inProgress;
            },
            api: api
        };

    });