'use strict';
// Assembles the Bitbloq Offline AppImage using appimagetool.
// Usage: node tasks/lib/pkg-appimage.js
//
// Layout produced (AppDir):
//   dist/pkg/bitbloq-appdir/
//     Bitbloq            (the Electron launcher)
//     AppRun
//     bitbloq.desktop
//     bitbloq-offline.png (icon)
//     resources/...      (full app)
// Then: appimagetool dist/pkg/bitbloq-appdir dist/BitbloqOffline-<version>.AppImage
//
// Note: Web2Board is packaged in its own repository
// (https://github.com/eduardomillan/web2board) and is NOT bundled in this AppImage (install it separately).

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var root = path.resolve(__dirname, '..', '..');
var dist = path.join(root, 'dist');
var pkg = path.join(root, 'pkg', 'linux', 'bitbloq');
var appdir = path.join(dist, 'pkg', 'bitbloq-appdir');

function rimraf(p) {
    if (fs.existsSync(p)) cp.execSync('rm -rf ' + p);
}
function copyRecursive(src, dest) {
    cp.execSync('mkdir -p "' + dest + '" && cp -r "' + src + '/." "' + dest + '"');
}

rimraf(appdir);
fs.mkdirSync(appdir, { recursive: true });

// AppRun + desktop from pkg/linux/bitbloq/AppDir
fs.copyFileSync(path.join(pkg, 'AppDir', 'AppRun'), path.join(appdir, 'AppRun'));
cp.execSync('chmod 755 "' + path.join(appdir, 'AppRun') + '"');
fs.copyFileSync(path.join(pkg, 'AppDir', 'bitbloq.desktop'), path.join(appdir, 'bitbloq.desktop'));

var srcBuild = path.join(dist, 'BitbloqOfflineLinux');
if (!fs.existsSync(srcBuild)) {
    console.error('Missing build: ' + srcBuild + ' (run `grunt build:linux` first)');
    process.exit(1);
}
copyRecursive(srcBuild, appdir);
cp.execSync('chmod 755 "' + path.join(appdir, 'Bitbloq') + '"');
var iconSrc = path.join(root, 'app', 'images', 'bitbloq_ico.png');
if (fs.existsSync(iconSrc)) fs.copyFileSync(iconSrc, path.join(appdir, 'bitbloq-offline.png'));

// version from package.json
var version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

// ensure appimagetool is on PATH
try {
    cp.execSync('which appimagetool >/dev/null 2>&1 || ls /tmp/opencode/appimagetool >/dev/null 2>&1');
    if (!fs.existsSync('/usr/local/bin/appimagetool') && fs.existsSync('/tmp/opencode/appimagetool')) {
        cp.execSync('sudo cp /tmp/opencode/appimagetool /usr/local/bin/appimagetool && sudo chmod +x /usr/local/bin/appimagetool');
    }
} catch (e) { /* ignore */ }

var outApp = path.join(dist, 'BitbloqOffline-' + version + '.AppImage');

console.log('Building AppImage: ' + outApp);
var env = Object.assign({}, process.env, { ARCH: 'x86_64' });
cp.execSync('appimagetool "' + appdir + '" "' + outApp + '"', { stdio: 'inherit', env: env });
console.log('Done: ' + outApp);
