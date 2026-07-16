'use strict';
// Assembles a .deb package for Bitbloq Offline or Web2Board.
// Usage: node tasks/lib/pkg-deb.js [bitbloq|web2board]
//
// Layout produced:
//   dist/pkg/<name>-deb/DEBIAN/control
//   dist/pkg/<name>-deb/opt/<name>/...        (app payload)
//   dist/pkg/<name>-deb/usr/bin/<name>        (launcher wrapper)
//   dist/pkg/<name>-deb/usr/share/applications/<name>.desktop
//   dist/pkg/<name>-deb/usr/share/icons/hicolor/.../<name>.png
// Then: fakeroot dpkg-deb --build -> dist/<name>_<version>_amd64.deb

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var which = process.argv[2];
if (which !== 'bitbloq' && which !== 'web2board') {
    console.error('Usage: node tasks/lib/pkg-deb.js [bitbloq|web2board]');
    process.exit(1);
}

var root = path.resolve(__dirname, '..', '..');
var dist = path.join(root, 'dist');
var pkg = path.join(root, 'pkg', 'linux', which);
var outBase = path.join(dist, 'pkg', which + '-deb');

function rimraf(p) {
    if (fs.existsSync(p)) cp.execSync('rm -rf ' + p);
}

function copyRecursive(src, dest) {
    cp.execSync('mkdir -p "' + dest + '" && cp -r "' + src + '/." "' + dest + '"');
}

rimraf(outBase);
fs.mkdirSync(outBase, { recursive: true });

// DEBIAN/control
fs.mkdirSync(path.join(outBase, 'DEBIAN'), { recursive: true });
fs.copyFileSync(path.join(pkg, 'control'), path.join(outBase, 'DEBIAN', 'control'));

if (which === 'bitbloq') {
    var srcBuild = path.join(dist, 'BitbloqOfflineLinux');
    if (!fs.existsSync(srcBuild)) {
        console.error('Missing build: ' + srcBuild + ' (run `grunt build:linux` first)');
        process.exit(1);
    }
    // payload in /opt/bitbloq-offline
    copyRecursive(srcBuild, path.join(outBase, 'opt', 'bitbloq-offline'));
    // launcher in /usr/bin
    var binDir = path.join(outBase, 'usr', 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    var sh = path.join(pkg, 'bitbloq-offline.sh');
    fs.copyFileSync(sh, path.join(binDir, 'bitbloq-offline'));
    cp.execSync('chmod 755 "' + path.join(binDir, 'bitbloq-offline') + '"');
    // icon
    var iconSrc = path.join(root, 'app', 'images', 'bitbloq_ico.png');
    var iconDir = path.join(outBase, 'usr', 'share', 'icons', 'hicolor', '64x64', 'apps');
    fs.mkdirSync(iconDir, { recursive: true });
    if (fs.existsSync(iconSrc)) fs.copyFileSync(iconSrc, path.join(iconDir, 'bitbloq-offline.png'));
} else {
    var srcW2b = path.join(root, 'app', 'res', 'web2board', 'linux');
    if (!fs.existsSync(srcW2b)) {
        console.error('Missing web2board bundle: ' + srcW2b);
        process.exit(1);
    }
    copyRecursive(srcW2b, path.join(outBase, 'opt', 'web2board'));
    var binDir2 = path.join(outBase, 'usr', 'bin');
    fs.mkdirSync(binDir2, { recursive: true });
    fs.copyFileSync(path.join(pkg, 'web2board.sh'), path.join(binDir2, 'web2board'));
    cp.execSync('chmod 755 "' + path.join(binDir2, 'web2board') + '"');
    // icon from bundled web2board linux32 res (png)
    var iconSrc2 = path.join(root, 'app', 'res', 'web2board', 'linux32', 'res', 'icons', 'settings.png');
    var iconDir2 = path.join(outBase, 'usr', 'share', 'icons', 'hicolor', '64x64', 'apps');
    fs.mkdirSync(iconDir2, { recursive: true });
    if (fs.existsSync(iconSrc2)) fs.copyFileSync(iconSrc2, path.join(iconDir2, 'web2board.png'));
}

// desktop entry
var appDir = path.join(outBase, 'usr', 'share', 'applications');
fs.mkdirSync(appDir, { recursive: true });
fs.copyFileSync(path.join(pkg, which + '.desktop'), path.join(appDir, which + '.desktop'));
cp.execSync('chmod 644 "' + path.join(appDir, which + '.desktop') + '"');

// read version from control
var ctrl = fs.readFileSync(path.join(outBase, 'DEBIAN', 'control'), 'utf8');
var version = (ctrl.match(/Version:\s*(.+)/) || [])[1].trim();
var arch = (ctrl.match(/Architecture:\s*(.+)/) || [])[1].trim();
var outDeb = path.join(dist, which + '_' + version + '_' + arch + '.deb');

console.log('Building .deb: ' + outDeb);
cp.execSync('fakeroot dpkg-deb --build "' + outBase + '" "' + outDeb + '"', { stdio: 'inherit' });
console.log('Done: ' + outDeb);
