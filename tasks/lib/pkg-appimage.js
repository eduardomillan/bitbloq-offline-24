'use strict';
// Assembles an AppImage for Bitbloq Offline or Web2Board using appimagetool.
// Usage: node tasks/lib/pkg-appimage.js [bitbloq|web2board]
//
// Layout produced (AppDir):
//   dist/pkg/<name>-appdir/
//     <name>            (the launcher binary, renamed to AppRun target name)
//     AppRun
//     <name>.desktop
//     <name>.png        (icon)
//     resources/...     (only for bitbloq: full app)
// Then: appimagetool dist/pkg/<name>-appdir dist/<Name>-<version>.AppImage

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var which = process.argv[2];
if (which !== 'bitbloq' && which !== 'web2board') {
    console.error('Usage: node tasks/lib/pkg-appimage.js [bitbloq|web2board]');
    process.exit(1);
}

var root = path.resolve(__dirname, '..', '..');
var dist = path.join(root, 'dist');
var pkg = path.join(root, 'pkg', 'linux', which);
var appdir = path.join(dist, 'pkg', which + '-appdir');

function rimraf(p) {
    if (fs.existsSync(p)) cp.execSync('rm -rf ' + p);
}
function copyRecursive(src, dest) {
    cp.execSync('mkdir -p "' + dest + '" && cp -r "' + src + '/." "' + dest + '"');
}

rimraf(appdir);
fs.mkdirSync(appdir, { recursive: true });

// AppRun + desktop from pkg/linux/<name>/AppDir
fs.copyFileSync(path.join(pkg, 'AppDir', 'AppRun'), path.join(appdir, 'AppRun'));
cp.execSync('chmod 755 "' + path.join(appdir, 'AppRun') + '"');
fs.copyFileSync(path.join(pkg, 'AppDir', which + '.desktop'), path.join(appdir, which + '.desktop'));

if (which === 'bitbloq') {
    var srcBuild = path.join(dist, 'BitbloqOfflineLinux');
    if (!fs.existsSync(srcBuild)) {
        console.error('Missing build: ' + srcBuild + ' (run `grunt build:linux` first)');
        process.exit(1);
    }
    copyRecursive(srcBuild, appdir);
    // ensure AppRun is executable (already copied as Bitbloq)
    cp.execSync('chmod 755 "' + path.join(appdir, 'Bitbloq') + '"');
    var iconSrc = path.join(root, 'app', 'images', 'bitbloq_ico.png');
    if (fs.existsSync(iconSrc)) fs.copyFileSync(iconSrc, path.join(appdir, 'bitbloq-offline.png'));
} else {
    var srcW2b = path.join(root, 'app', 'res', 'web2board', 'linux');
    if (!fs.existsSync(srcW2b)) {
        console.error('Missing web2board bundle: ' + srcW2b);
        process.exit(1);
    }
    copyRecursive(srcW2b, appdir);
    cp.execSync('chmod 755 "' + path.join(appdir, 'web2boardLauncher') + '"');
    var iconSrc2 = path.join(root, 'app', 'res', 'web2board', 'linux32', 'res', 'icons', 'settings.png');
    if (fs.existsSync(iconSrc2)) fs.copyFileSync(iconSrc2, path.join(appdir, 'web2board.png'));
}

// version (from control of the .deb metadata, or hard-coded fallback)
var ctrlPath = path.join(pkg, 'control');
var version = '1.0.0';
if (fs.existsSync(ctrlPath)) {
    var ctrl = fs.readFileSync(ctrlPath, 'utf8');
    version = ((ctrl.match(/Version:\s*(.+)/) || [])[1] || '1.0.0').trim();
}

// appimagetool must be on PATH (downloaded to /tmp/opencode/appimagetool or installed)
var tool = 'appimagetool';
try {
    cp.execSync('which appimagetool >/dev/null 2>&1 || ls /tmp/opencode/appimagetool >/dev/null 2>&1');
    if (!fs.existsSync('/usr/local/bin/appimagetool') && fs.existsSync('/tmp/opencode/appimagetool')) {
        cp.execSync('sudo cp /tmp/opencode/appimagetool /usr/local/bin/appimagetool && sudo chmod +x /usr/local/bin/appimagetool');
    }
} catch (e) { /* ignore */ }

var pretty = which === 'bitbloq' ? 'BitbloqOffline' : 'Web2Board';
var outApp = path.join(dist, pretty + '-' + version + '.AppImage');

console.log('Building AppImage: ' + outApp);
var env = Object.assign({}, process.env, { ARCH: 'x86_64' });
cp.execSync('appimagetool "' + appdir + '" "' + outApp + '"', { stdio: 'inherit', env: env });
console.log('Done: ' + outApp);
