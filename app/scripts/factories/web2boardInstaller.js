'use strict';

/**
 * @ngdoc service
 * @name bitbloqOffline.web2boardInstaller
 * @description
 * # web2boardInstaller
 * Descarga bajo demanda de web2board en las builds "slim" (sin web2board
 * empaquetado). Descarga el ZIP correspondiente al sistema operativo desde
 * GitHub Releases, verifica su SHA-256 (si está definido), lo descomprime en
 * la carpeta de datos de usuario y deja el launcher listo para ejecutarse.
 */
angular.module('bitbloqOffline')
    .factory('web2boardInstaller', function ($q, $log, common, nodeRemote) {

        var fs = require('fs'),
            path = require('path'),
            https = require('https'),
            crypto = require('crypto');

        var installer = {},
            downloadConfig = null,
            downloading = null;

        function getConfig() {
            if (!downloadConfig) {
                downloadConfig = JSON.parse(
                    fs.readFileSync(common.appPath + '/app/res/web2board-download.json', 'utf8')
                );
            }
            return downloadConfig;
        }

        function getPlatformKey() {
            if (process.platform === 'win32') {
                return 'win32';
            }
            if (process.platform === 'linux') {
                return 'linux';
            }
            return process.platform;
        }

        function getPlatformConfig() {
            var config = getConfig();
            return config.platforms[getPlatformKey()];
        }

        installer.getInstallDir = function () {
            return path.join(nodeRemote.app.getPath('userData'), 'web2board');
        };

        /**
         * Ruta al launcher descargado (bajo la carpeta de datos de usuario).
         * Devuelve null si el SO no está soportado para descarga.
         */
        installer.getLauncherPath = function () {
            var platformConfig = getPlatformConfig();
            if (!platformConfig) {
                return null;
            }
            var launcherName = process.platform === 'win32' ? 'web2boardLauncher.exe' : 'web2boardLauncher';
            return path.join(installer.getInstallDir(), platformConfig.rootDir, launcherName);
        };

        installer.isInstalled = function () {
            var launcher = installer.getLauncherPath();
            return !!launcher && fs.existsSync(launcher);
        };

        function mkdirp(dir) {
            if (!fs.existsSync(dir)) {
                mkdirp(path.dirname(dir));
                try {
                    fs.mkdirSync(dir);
                } catch (e) {
                    if (e.code !== 'EEXIST') {
                        throw e;
                    }
                }
            }
        }

        function download(url, dest, onProgress) {
            var deferred = $q.defer();

            function request(currentUrl, redirects) {
                if (redirects > 5) {
                    deferred.reject(new Error('Too many redirects'));
                    return;
                }
                https.get(currentUrl, function (response) {
                    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                        response.resume();
                        request(response.headers.location, redirects + 1);
                        return;
                    }
                    if (response.statusCode !== 200) {
                        response.resume();
                        deferred.reject(new Error('Unexpected status code: ' + response.statusCode));
                        return;
                    }
                    var total = parseInt(response.headers['content-length'], 10) || 0,
                        received = 0,
                        file = fs.createWriteStream(dest);

                    response.on('data', function (chunk) {
                        received += chunk.length;
                        if (onProgress && total) {
                            onProgress(received, total);
                        }
                    });
                    response.pipe(file);
                    file.on('finish', function () {
                        file.close(function () {
                            deferred.resolve(dest);
                        });
                    });
                    file.on('error', function (err) {
                        fs.unlink(dest, function () {});
                        deferred.reject(err);
                    });
                }).on('error', function (err) {
                    deferred.reject(err);
                });
            }

            request(url, 0);
            return deferred.promise;
        }

        function verifyChecksum(filePath, expected) {
            var deferred = $q.defer();
            if (!expected) {
                deferred.resolve(filePath);
                return deferred.promise;
            }
            var hash = crypto.createHash('sha256'),
                stream = fs.createReadStream(filePath);
            stream.on('data', function (data) {
                hash.update(data);
            });
            stream.on('end', function () {
                var digest = hash.digest('hex');
                if (digest.toLowerCase() === expected.toLowerCase()) {
                    deferred.resolve(filePath);
                } else {
                    deferred.reject(new Error('Checksum mismatch'));
                }
            });
            stream.on('error', function (err) {
                deferred.reject(err);
            });
            return deferred.promise;
        }

        function extract(zipPath, destDir) {
            var deferred = $q.defer(),
                extractZip = require('extract-zip');
            extractZip(zipPath, { dir: destDir }, function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(destDir);
                }
            });
            return deferred.promise;
        }

        function makeExecutable() {
            if (process.platform === 'win32') {
                return;
            }
            var launcher = installer.getLauncherPath();
            try {
                fs.chmodSync(launcher, 493); // 0755
                // El binario real de web2board también necesita permisos de ejecución.
                var realBinary = path.join(path.dirname(launcher), 'web2board');
                if (fs.existsSync(realBinary)) {
                    fs.chmodSync(realBinary, 493);
                }
            } catch (e) {
                $log.warn('web2boardInstaller: no se pudieron ajustar permisos: ' + e.message);
            }
        }

        /**
         * Asegura que web2board esté instalado. Si ya lo está, resuelve de
         * inmediato. Si no, lo descarga, verifica, descomprime y prepara.
         * @param {Function} onProgress callback(received, total)
         * @returns {Promise}
         */
        installer.ensureInstalled = function (onProgress) {
            if (installer.isInstalled()) {
                return $q.when(true);
            }
            if (downloading) {
                return downloading;
            }

            var platformConfig = getPlatformConfig();
            if (!platformConfig) {
                return $q.reject(new Error('Unsupported platform: ' + process.platform));
            }

            var config = getConfig(),
                url = config.baseUrl + platformConfig.file,
                installDir = installer.getInstallDir(),
                tmpZip = path.join(nodeRemote.app.getPath('temp'), platformConfig.file);

            mkdirp(installDir);

            downloading = download(url, tmpZip, onProgress)
                .then(function () {
                    return verifyChecksum(tmpZip, platformConfig.sha256);
                })
                .then(function () {
                    return extract(tmpZip, installDir);
                })
                .then(function () {
                    makeExecutable();
                    try {
                        fs.unlinkSync(tmpZip);
                    } catch (e) {
                        // ignore
                    }
                    if (!installer.isInstalled()) {
                        throw new Error('web2board launcher not found after extraction');
                    }
                    return true;
                })
                .finally(function () {
                    downloading = null;
                });

            return downloading;
        };

        return installer;
    });
