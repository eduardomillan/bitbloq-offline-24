module.exports = function(grunt) {
    //load grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.loadTasks('tasks');

    function getCopySrc(os, includeWeb2board) {
        includeWeb2board = includeWeb2board !== false;
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
            'LICENSE',
            'main.js',
            'package.json',
            'bower.json'
        ];
        if (includeWeb2board) {
            array = array.concat([
                '!app/res/web2board/{osValue}/**/info.log',
                '!app/res/web2board/{osValue}/**/info.log.*',
                '!app/res/web2board/{osValue}/**/config.json',
                '!app/res/web2board/{osValue}/**/web2boardLauncher.log',
                '!app/res/web2board/{osValue}/**/platformioWS*/**',
                '!app/res/web2board/web2board-config.json'
            ]);
        } else {
            array = array.concat([
                '!app/res/web2board/**'
            ]);
        }
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
                    src: getCopySrc("win32").concat(['!app/res/web2board/linux/**', '!app/res/web2board/darwin/**']),
                    dest: 'dist/BitbloqOfflineWin/data/resources/app/'
                }]
            },
            linux: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("linux").concat(['!app/res/web2board/win32/**', '!app/res/web2board/darwin/**']),
                    dest: 'dist/BitbloqOfflineLinux/resources/app/'
                }]
            },
            mac: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("darwin").concat(['!app/res/web2board/linux/**', '!app/res/web2board/win32/**']),
                    dest: 'dist/BitbloqOfflineMac/Bitbloq.app/Contents/Resources/app/'
                }]
            },
            windowsSlim: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("win32", false),
                    dest: 'dist/BitbloqOfflineWinSlim/data/resources/app/'
                }]
            },
            linuxSlim: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("linux", false),
                    dest: 'dist/BitbloqOfflineLinuxSlim/resources/app/'
                }]
            },
            windows: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: getCopySrc("win32").concat(['!app/res/web2board/linux/**', '!app/res/web2board/darwin/**']),
                    dest: 'dist/BitbloqOfflineWin/data/resources/app/'
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
            }
        },
        clean: {
            windows: ['dist/BitbloqOfflineWin/'],
            linux: ['dist/BitbloqOfflineLinux/'],
            mac: ['dist/BitbloqOfflineMac/'],
            windowsSlim: ['dist/BitbloqOfflineWinSlim/'],
            linuxSlim: ['dist/BitbloqOfflineLinuxSlim/'],
            web2board: ['dist/web2board/'],
            all: ['dist/'],
            i18n: 'i18n/*'
        },
        exec: {
            electron: 'electron .',
            stop_electron: 'killall electron || killall Electron || true',
            mac_copy_python: 'cp -rp app/res/web2board/darwin/Web2Board.app/Contents/MacOS/python \'dist/BitbloqOfflineMac/Bitbloq.app/Contents/Resources/app/app/res/web2board/darwin/Web2Board.app/Contents/MacOS/python\'',
            mac_python_symbolic_link: 'ln -sf /usr/bin/python \'dist/BitbloqOfflineMac/Bitbloq.app/Contents/Resources/app/app/res/web2board/darwin/Web2Board.app/Contents/MacOS/python\''
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
            'zip-web2board-linux': {
                command: 'mkdir -p dist/web2board && cd app/res/web2board && zip -r -q -X ../../../dist/web2board/web2board-linux-x64.zip linux ' +
                    '-x "linux/**/info.log" "linux/**/info.log.*" "linux/**/config.json" "linux/**/web2boardLauncher.log" "linux/**/platformioWS*/*"'
            },
            'zip-web2board-win': {
                command: 'mkdir -p dist/web2board && cd app/res/web2board && zip -r -q -X ../../../dist/web2board/web2board-win32.zip win32 ' +
                    '-x "win32/**/info.log" "win32/**/info.log.*" "win32/**/config.json" "win32/**/web2boardLauncher.log" "win32/**/platformioWS*/*"'
            },
            'gen-web2board-manifest': {
                command: 'node tasks/lib/web2board-manifest.js'
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

    // Build de la app SIN web2board empaquetado (este se descarga bajo demanda).
    grunt.registerTask('dist-slim', function() {
        grunt.task.run([
            'build:windows-slim',
            'build:linux-slim'
        ]);
    });

    // Empaqueta web2board por separado en dist/web2board/*.zip + manifest.
    // Se publican como assets en GitHub Releases de eduardomillan/bitbloq-offline-24.
    grunt.registerTask('package-web2board', [
        'clean:web2board',
        'shell:zip-web2board-linux',
        'shell:zip-web2board-win',
        'shell:gen-web2board-manifest'
    ]);

    // Default task(s).
    grunt.registerTask('build', function(os) {
        switch (os) {
            case 'windows':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:windows',
                    'copy:prebuiltWindows',
                    'copy:windows',
                    'shell:target'
                ]);
                break;
            case 'windows-slim':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:windowsSlim',
                    'copy:prebuiltWindowsSlim',
                    'copy:windowsSlim',
                    'shell:target'
                ]);
                break;
            case 'mac':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:mac',
                    'copy:prebuiltMac',
                    'copy:mac',
                    'exec:mac_python_symbolic_link',
                    'shell:target'
                ]);
                break;
            case 'linux':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:linux',
                    'copy:prebuiltLinux',
                    'copy:linux',
                    'shell:target'
                ]);
                break;
            case 'linux-slim':
                grunt.task.run([
                    'sass',
                    'svgstore',
                    'clean:linuxSlim',
                    'copy:prebuiltLinuxSlim',
                    'copy:linuxSlim',
                    'shell:target'
                ]);
                break;
            default:
                grunt.log.error('No OS selected, usage: grunt build:[mac|linux|windows|linux-slim|windows-slim]');
        }
    });
};
