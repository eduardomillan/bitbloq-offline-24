'use strict';

/**
 * @ngdoc function
 * @name bitbloqOffline.controller:ActionBarCtrl
 * @description
 * # ActionBarCtrl
 * Controller of the bitbloqOffline
 */
angular.module('bitbloqOffline')
    .controller('ActionBarCtrl', function($rootScope, $scope, $route, bloqs, $log, web2board, _, clipboard, bloqsUtils, utils, hw2Bloqs, projectApi, nodeDialog, nodeFs, nodeUtils, common, commonModals, alertsService) {
        $log.debug('ActionBarCtrl', $scope.$parent.$id);

        // Setup IPC listeners for native Electron menu actions
        var ipcRenderer = require('electron').ipcRenderer;
        ipcRenderer.on('menu-action', function(event, action) {
            $log.debug('Menu action received:', action);
            switch (action) {
                case 'new-project':
                    newProject();
                    break;
                case 'open-project':
                    openProject();
                    break;
                case 'save-project':
                    $scope.saveProject($scope.getCurrentProject());
                    break;
                case 'save-project-as':
                    $scope.saveProjectAs($scope.getCurrentProject());
                    break;
                case 'export-arduino-code':
                    $scope.saveIno($scope.getCurrentProject());
                    break;
                case 'change-language':
                    changeLanguage();
                    break;
                case 'copy-code':
                    copyCodeToClipboard();
                    break;
                case 'open-logs':
                    openLogsFolder();
                    break;
                case 'clear-logs':
                    clearLogsFolder();
                    break;
                case 'zoom-in':
                    zoomIn();
                    break;
                case 'zoom-out':
                    zoomOut();
                    break;
                case 'zoom-reset':
                    resetZoom();
                    break;
                default:
                    $log.warn('Unknown menu action:', action);
            }
            // Ensure AngularJS applies the changes
            utils.apply($scope);
        });

        $scope.actions = {
            newProject: newProject,
            openProject: openProject,
            changeLanguage: changeLanguage,
            copyCodeToClipboard: copyCodeToClipboard,
            verifyCode: verifyCode,
            loadToBoard: loadToBoard
        };


        $scope.isInProcess = web2board.isInProcess;

        function newProject() {
            if (projectApi.hasChanged($scope.getCurrentProject())) {
                commonModals.launchNotSavedModal(function(confirmed) {
                    if (confirmed === 0) {
                        $scope.saveProject($scope.getCurrentProject());
                        $route.reload();
                    } else if (confirmed === -1) {
                        projectApi.projectChanged = false;
                        projectApi.savedProjectPath = false;
                        $route.reload();
                    }
                });

                // WARN THE USER.
                // If continues, newProject(), else, cancel
            } else {
                projectApi.savedProjectPath = false;
                $route.reload();
            }
        }

        function redirect(url) {
            var BrowserWindow = require('electron').remote.BrowserWindow;

            var win = new BrowserWindow({
                width: 800,
                height: 600,
                show: false
            });
            win.on('closed', function() {
                win = null;
            });

            win.loadURL(url);
            win.show();
        }

        function isANewerVersion(projectVersion, currentVersion) {
            projectVersion = projectVersion || "0.0.0";
            currentVersion = currentVersion || "0.0.0";
            projectVersion = projectVersion.split('.');
            currentVersion = currentVersion.split('.');
            for (var i = 0; i < projectVersion.length; i++) {
                if (parseInt(projectVersion[i]) > parseInt(currentVersion[i])) {
                    return true;
                }
            }
            return false;
        }

        function openProject(force) {
            if (projectApi.hasChanged($scope.getCurrentProject()) && !force) {
                commonModals.launchNotSavedModal(function(confirmed) {
                    if (confirmed === 0) {
                        projectApi.save($scope.getCurrentProject(), function() {
                            console.log('saved');
                            openProject(true);
                        });
                    } else if (confirmed === -1) {
                        openProject(true);
                    }
                });
            } else {
                var filePath = nodeDialog.showOpenDialog({
                    properties: ['openFile', 'createDirectory'],
                    filters: [{
                        name: 'Bitbloq',
                        extensions: ['json', 'bitbloq']
                    }, {
                        name: 'All Files',
                        extensions: ['*']
                    }]
                });

                if (filePath) {
                    nodeFs.readFile(filePath[0], function(err, data) {
                        if (err) {
                            throw err;
                        } else {
                            var project = JSON.parse(data);
                            //console.log(project.bloqsVersion, common.bloqsVersion);
                            //console.log(project.bitbloqOfflineVersion, common.version);

                            if (isANewerVersion(project.bloqsVersion, common.bloqsVersion)) {
                                alertsService.add('bigger-bloqs-version-detected', 'warning', 'warning', 5000, null, false, false);
                            }
                            if (isANewerVersion(project.bitbloqOfflineVersion, common.version)) {
                                alertsService.add('offline-new-version-available', 'info', 'info', 5000, null, false, false);
                            }
                            $scope.setProject(project);
                            projectApi.savedProjectPath = filePath[0];
                            projectApi.projectChanged = false;
                            hw2Bloqs.repaint();
                            $scope.refreshCode();
                            $scope.refreshComponentsArray();
                            utils.apply($scope);
                            projectApi.save(project);
                            $rootScope.$emit('refreshScroll');
                            bloqs.updateDropdowns();
                        }
                    });
                }
            }
        }

        function changeLanguage() {
            commonModals.launchChangeLanguageModal();
        }

        function copyCodeToClipboard() {
            var pretty = utils.prettyCode($scope.getCurrentProject().code);
            alertsService.add('make-code-clipboard', 'code-clipboard', 'ok', 3000);
            clipboard.copyText(pretty);
        }

        function loadToBoard() {
            var pretty = utils.prettyCode($scope.getCurrentProject().code);
            var boardReference = _.find($scope.hardware.boardList, function(b) {
                return b.name === $scope.project.hardware.board;
            });
            web2board.upload(boardReference, pretty);
        }

        function verifyCode() {
            var pretty = utils.prettyCode($scope.getCurrentProject().code);
            web2board.verify(pretty);
        }

        /**
         * Open the folder that holds the Bitbloq Offline log so the user can
         * inspect it when something goes wrong (e.g. the board is not detected
         * or a compile/upload fails). Uses the OS file manager via Electron's
         * shell. Since v2.0.0 compilation is handled locally by arduino-cli,
         * there is no separate Web2Board log.
         */
        function openLogsFolder() {
            // La apertura real la hace el proceso principal (main.js) vía IPC,
            // donde shell.openExternal funciona de forma fiable en Electron 4.
            try {
                require('electron').ipcRenderer.send('open-logs-folder');
            } catch (e) {
                console.error('[openLogsFolder]', e);
                alertsService.add('alert-open-logs-failed', 'web2board', 'warning');
            }
        }

        function clearLogsFolder() {
            commonModals.launchClearLogsModal(function(confirmed) {
                if (confirmed === 0) {
                    try {
                        require('electron').ipcRenderer.send('clear-logs-folder');
                    } catch (e) {
                        console.error('[clearLogsFolder]', e);
                        alertsService.add('alert-open-logs-failed', 'web2board', 'warning');
                    }
                }
            });
        }

        require('electron').webFrame.setZoomFactor(common.settings.zoomFactor);

        function zoomIn() {
            common.settings.zoomFactor += 0.1;
            require('electron').webFrame.setZoomFactor(common.settings.zoomFactor)
            common.saveSettings();
        }

        function zoomOut() {
            common.settings.zoomFactor -= 0.1;
            require('electron').webFrame.setZoomFactor(common.settings.zoomFactor)
            common.saveSettings();
        }

        function resetZoom() {
            common.settings.zoomFactor = 1;
            require('electron').webFrame.setZoomFactor(common.settings.zoomFactor)
            common.saveSettings();
        }

        $scope.$watch(function() {
                return $scope.isInProcess();
            },
            function(newValue) {
                $scope.menuTree.viewMenuItems.items.forEach(function(item) {
                    item.disabled = newValue;
                })
            }
        );

        $scope.menuTree = {
            fileMenuItems: {
                name: 'file',
                items: [{
                    name: 'create-new-project',
                    icon: '#nuevoProyecto',
                    action: newProject,
                    disabled: false
                }, {
                    name: 'open-project',
                    icon: '#abrirProyecto',
                    action: openProject,
                    disabled: false
                }, {
                    name: 'save',
                    icon: '#guardar',
                    action: $scope.saveProject,
                    disabled: false
                }, {
                    name: 'offline-save-as',
                    icon: '#guardar',
                    action: $scope.saveProjectAs,
                    disabled: false
                }, {
                    name: 'export-arduino-code',
                    icon: '#exportcode',
                    action: $scope.saveIno,
                    disabled: false
                }, {
                    name: 'change-language',
                    icon: '#cambiarIdioma',
                    action: changeLanguage,
                    disabled: false
                }]
            },
            editMenuItems: {
                name: 'edit',
                items: [{
                    name: 'makeActions_copyCode',
                    icon: '#copiarTexto',
                    action: copyCodeToClipboard,
                    disabled: false
                }]
            },
            viewMenuItems: {
                name: 'see',
                items: [{
                    name: 'open-logs',
                    icon: '#web2board',
                    action: openLogsFolder,
                    disabled: false
                }, {
                    name: 'clear-logs',
                    icon: '#web2board',
                    action: clearLogsFolder,
                    disabled: false
                }]
            },
            zoomMenuItems: {
                name: 'Zoom',
                items: [{
                        name: 'more-zoom',
                        icon: '#zoomin',
                        action: zoomIn,
                        disabled: false
                    }, {
                        name: 'less-zoom',
                        icon: '#zoomout',
                        action: zoomOut,
                        disabled: false
                    },
                    {
                        name: 'reset-zoom',
                        icon: '#versionAnterior',
                        action: resetZoom,
                        disabled: false
                    }
                ]
            }

        };
    });