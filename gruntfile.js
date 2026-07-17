module.exports = function(grunt) {
    //load grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.loadTasks('tasks');

    // Web2Board is developed and released in its own repository
    // (https://github.com/eduardomillan/web2board) and is NOT bundled inside
    // Bitbloq Offline nor downloaded on demand. The user installs it separately;
    // Bitbloq locates it in the standard paths or via a configurable path.
    function getCopySrc(os) {
        var array = ['app/**',
            'bower_components/**',
            'node_modules/**',
            'node_modules/angular/**',
            'node_modules/universal-analytics/**',
            'node_modules/ws/**',
            'node_modules/ultron/**',
            'node_modules/options/**',
            '!node_modules/electron*/**',
            '!node_modules/grunt*/**',
            '!node_modules/@*/**',
            '!app/res/web2board/**',
            'LICENSE',
            'main.js',
            'localCompilerServer.js',
            'res/libs/**',
            'package.json',
            'bower.json'
        ];
        array = array.map(function(src) {
            return src.replace("{osValue}", os);
        });

        return array;
    }

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    'app/**/*.js'
                ]
            }
        },
        wiredep: {
            task: {
                // Point to the files that should be updated when
                // you run `grunt wiredep`
                src: ['app/index.html'],
                exclude: ['bower_components/jquery/dist/jquery.js', 'bower_components/angular/angular.js']
            }
        },
        svgstore: {
            options: {
                svg: {
                    viewBox: '0 0 100 100',
                    xmlns: 'http://www.w3.org/2000/svg'
                },
                includedemo: false,
                formatting: {
                    indent_size: 2
                },
                cleanup: true
            },
            all: {
                files: [{
                    src: 'app/images/icons/{,*/}*.svg',
                    dest: 'app/images/sprite.svg'
                }]
            }
        },

        copy: {
            windows: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("win32"),
                    dest: 'dist/BitbloqOfflineWin/data/resources/app/'
                }]
            },
            linux: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("linux"),
                    dest: 'dist/BitbloqOfflineLinux/resources/app/'
                }]
            },
            mac: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("darwin"),
                    dest: 'dist/BitbloqOfflineMac/Bitbloq.app/Contents/Resources/app/'
                }]
            },
            windowsSlim: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("win32"),
                    dest: 'dist/BitbloqOfflineWinSlim/data/resources/app/'
                }]
            },
            linuxSlim: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("linux"),
                    dest: 'dist/BitbloqOfflineLinuxSlim/resources/app/'
                }]
            },
            prebuiltWindows: {
                files: [{
                    expand: true,
                    cwd: 'res/windows32-prebuilt',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineWin/'
                }]
            },
            prebuiltLinux: {
                files: [{
                    expand: true,
                    cwd: 'res/linux-prebuilt',
                    src: ['**', '!pango/**'],
                    dest: 'dist/BitbloqOfflineLinux/'
                }]
            },
            prebuiltMac: {
                files: [{
                    expand: true,
                    cwd: 'res/mac-prebuilt',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineMac/'
                }]
            },
            prebuiltWindowsSlim: {
                files: [{
                    expand: true,
                    cwd: 'res/windows32-prebuilt',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineWinSlim/'
                }]
            },
            prebuiltLinuxSlim: {
                files: [{
                    expand: true,
                    cwd: 'res/linux-prebuilt',
                    src: ['**', '!pango/**'],
                    dest: 'dist/BitbloqOfflineLinuxSlim/'
                }]
            },
            zowiSamples: {
                files: [{
                    expand: true,
                    cwd: 'zowi_samples',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineLinux/zowi_samples/'
                }]
            },
            zowiSamplesWin: {
                files: [{
                    expand: true,
                    cwd: 'zowi_samples',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineWin/zowi_samples/'
                }]
            },
            zowiSamplesMac: {
                files: [{
                    expand: true,
                    cwd: 'zowi_samples',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineMac/zowi_samples/'
                }]
            },
            zowiSamplesSlim: {
                files: [{
                    expand: true,
                    cwd: 'zowi_samples',
                    src: ['**'],
                    dest: 'dist/BitbloqOfflineLinuxSlim/zowi_samples/'
                }]
            }
        },
        clean: {
            windows: ['dist/BitbloqOfflineWin/'],
            linux: ['dist/BitbloqOfflineLinux/'],
            mac: ['dist/BitbloqOfflineMac/'],
            windowsSlim: ['dist/BitbloqOfflineWinSlim/'],
            linuxSlim: ['dist/BitbloqOfflineLinuxSlim/'],
            all: ['dist/'],
            i18n: 'i18n/*'
        },
        exec: {
            electron: 'electron .',
            stop_electron: 'killall electron || killall Electron || true'
        },
        watch: {
            sass: {
                files: ['app/styles/{,**/}*.{scss}', '!app/styles/main.css'],
                tasks: ['sass', 'svgstore']
            },
            scripts: {
                files: ['app/**/*.*', 'bower.json', '!app/styles/main.css', '!app/res/config.json', '!app/res/web2board/**/*.*'],
                tasks: ['exec:stop_electron', 'sass', 'exec:electron'],
                options: {
                    atBegin: true,
                    interrupt: true
                }
            }
        },
        shell: {
            options: {
                stderr: false
            },
            target: {
                command: 'chmod -R 755 dist/'
            },
            // --- Native packages (.deb / AppImage / NSIS) ---
            'pkg-deb-bitbloq': {
                command: 'node tasks/lib/pkg-deb.js bitbloq'
            },
            'pkg-appimage-bitbloq': {
                command: 'node tasks/lib/pkg-appimage.js bitbloq'
            },
            'pkg-nsis-win': {
                command: 'makensis pkg/windows/bitbloq-offline.nsi'
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', function() {
        grunt.task.run([
            'jshint:all',
            'dist'
        ]);
    });

    // Tarea 'sass' propia (Dart Sass puro JS, sin node-sass nativo) para
    // mantener las referencias existentes en 'watch' y 'build'.
    grunt.registerTask('sass', 'Compila SCSS con Dart Sass', function() {
        var done = this.async();
        var sass = require('sass');
        var fs = require('fs');
        var path = require('path');
        var src = 'app/styles/main.scss';
        var dest = 'app/styles/main.css';
        try {
            var result = sass.renderSync({
                file: src,
                outputStyle: 'expanded',
                sourceMap: false
            });
            fs.mkdirSync(path.dirname(dest), {recursive: true});
            fs.writeFileSync(dest, result.css);
            grunt.log.writeln('Generado ' + dest + ' (' + result.css.length + ' bytes)');
            done();
        } catch (e) {
            grunt.log.error(e.message);
            done(false);
        }
    });

    // Copia el ejecutable de Electron (node_modules/electron/dist) al prebuilt
    // de cada SO con el nombre que espera el empaquetado (Bitbloq / Bitbloq.exe /
    // Bitbloq.app). Así el binario NO se versiona ni se sube: se regenera en cada
    // build desde la instalación local de Electron (presente tras `npm install`).
    grunt.registerTask('electron-bin', 'Copy Electron binary into res/*-prebuilt', function(os) {
        var fs = require('fs');
        var path = require('path');
        var electronDist = path.join('node_modules', 'electron', 'dist');

        if (!fs.existsSync(electronDist)) {
            grunt.log.error('node_modules/electron/dist not found. Run `npm install` first.');
            return false;
        }

        if (os === 'linux' || os === 'linux-slim' || os === undefined) {
            var srcLinux = path.join(electronDist, 'electron');
            var dstLinux = path.join('res', 'linux-prebuilt', 'Bitbloq');
            if (!fs.existsSync(srcLinux)) {
                grunt.log.error('Electron binary not found at ' + srcLinux);
                return false;
            }
            fs.writeFileSync(dstLinux, fs.readFileSync(srcLinux));
            fs.chmodSync(dstLinux, 0o755);
            grunt.log.writeln('Electron -> ' + dstLinux);
        }

        if (os === 'win' || os === 'windows' || os === 'windows-slim' || os === undefined) {
            var srcWin = path.join(electronDist, 'electron.exe');
            var dstWin = path.join('res', 'windows32-prebuilt', 'Bitbloq.exe');
            if (!fs.existsSync(srcWin)) {
                grunt.log.writeln('Skipping Windows binary (electron.exe not found in this platform).');
            } else {
                fs.writeFileSync(dstWin, fs.readFileSync(srcWin));
                grunt.log.writeln('Electron -> ' + dstWin);
            }
        }

        if (os === 'mac' || os === undefined) {
            var srcMac = path.join(electronDist, 'Electron.app');
            var dstMac = path.join('res', 'mac-prebuilt', 'Bitbloq.app');
            if (!fs.existsSync(srcMac)) {
                grunt.log.writeln('Skipping macOS binary (Electron.app not found in this platform).');
            } else {
                // Electron.app es un bundle; cópialo completo.
                grunt.file.delete(dstMac, { force: true });
                grunt.file.copy(srcMac, dstMac);
                grunt.log.writeln('Electron -> ' + dstMac);
            }
        }
    });

    grunt.registerTask('i18n', 'get all file of i18n', function() {
        grunt.task.run([
            'clean:i18n',
            'getpoeditorfiles:38967',
            'poeditor2bitbloq'
        ]);
    });

    grunt.registerTask('dist', function() {
        grunt.task.run([
            'build:windows',
            'build:mac',
            'build:linux'
        ]);
    });

    // Build de la app sin web2board empaquetado (web2board se instala por
    // separado por el usuario, no se descarga bajo demanda).
    grunt.registerTask('dist-slim', function() {
        grunt.task.run([
            'build:windows-slim',
            'build:linux-slim'
        ]);
    });

    // --- Native packages: .deb, AppImage and Windows installer ---
    // These produce installable artifacts from the already-built dist/ folders.
    //   - bitbloq .deb / AppImage    -> from dist/BitbloqOfflineLinux
    //   - windows installer (.exe)   -> from dist/BitbloqOfflineWin (via NSIS)
    // Web2Board is packaged in its own repository (eduardomillan/web2board).
    grunt.registerTask('pkg-deb-bitbloq', ['shell:pkg-deb-bitbloq']);
    grunt.registerTask('pkg-appimage-bitbloq', ['shell:pkg-appimage-bitbloq']);
    grunt.registerTask('pkg-nsis-win', ['shell:pkg-nsis-win']);

    grunt.registerTask('package-linux', [
        'pkg-deb-bitbloq',
        'pkg-appimage-bitbloq'
    ]);

    grunt.registerTask('package-all', [
        'package-linux',
        'pkg-nsis-win'
    ]);

    // Default task(s).
    grunt.registerTask('build', function(os) {
        switch (os) {
            case 'windows':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:windows',
                    'electron-bin:win',
                    'copy:prebuiltWindows',
                    'copy:windows',
                    'copy:zowiSamplesWin',
                    'shell:target'
                ]);
                break;
            case 'windows-slim':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:windowsSlim',
                    'electron-bin:win',
                    'copy:prebuiltWindowsSlim',
                    'copy:windowsSlim',
                    'copy:zowiSamplesWin',
                    'shell:target'
                ]);
                break;
            case 'mac':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:mac',
                    'electron-bin:mac',
                    'copy:prebuiltMac',
                    'copy:mac',
                    'copy:zowiSamplesMac',
                    'shell:target'
                ]);
                break;
            case 'linux':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:linux',
                    'electron-bin:linux',
                    'copy:prebuiltLinux',
                    'copy:linux',
                    'copy:zowiSamples',
                    'shell:target'
                ]);
                break;
            case 'linux-slim':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:linuxSlim',
                    'electron-bin:linux',
                    'copy:prebuiltLinuxSlim',
                    'copy:linuxSlim',
                    'copy:zowiSamplesSlim',
                    'shell:target'
                ]);
                break;
            default:
                grunt.log.error('No OS selected, usage: grunt build:[mac|linux|windows|linux-slim|windows-slim]');
        }
    });
};
