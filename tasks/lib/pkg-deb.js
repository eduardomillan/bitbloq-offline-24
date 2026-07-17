'use strict';
// Assembles the Bitbloq Offline .deb package.
// Usage: node tasks/lib/pkg-deb.js
//
// Layout produced:
//   dist/pkg/bitbloq-deb/DEBIAN/control
//   dist/pkg/bitbloq-deb/opt/bitbloq-offline/...   (app payload)
//   dist/pkg/bitbloq-deb/usr/bin/bitbloq-offline   (launcher wrapper)
//   dist/pkg/bitbloq-deb/usr/share/applications/bitbloq.desktop
//   dist/pkg/bitbloq-deb/usr/share/icons/hicolor/.../bitbloq-offline.png
// Then: fakeroot dpkg-deb --build -> dist/bitbloq_<version>_amd64.deb
//
// Note: Web2Board is packaged in its own repository
// (https://github.com/eduardomillan/web2board) and is NOT bundled in this .deb (install it separately).
// so it is not bundled in this .deb.

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var root = path.resolve(__dirname, '..', '..');
var dist = path.join(root, 'dist');
var pkg = path.join(root, 'pkg', 'linux', 'bitbloq');
var outBase = path.join(dist, 'pkg', 'bitbloq-deb');

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

// DEBIAN/postinst & postrm (create/remove libusb symlink for avrdude64)
['postinst', 'postrm'].forEach(function(script) {
    var src = path.join(pkg, script);
    var dst = path.join(outBase, 'DEBIAN', script);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        cp.execSync('chmod 755 "' + dst + '"');
    }
});

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

// desktop entry
var appDir = path.join(outBase, 'usr', 'share', 'applications');
fs.mkdirSync(appDir, { recursive: true });
fs.copyFileSync(path.join(pkg, 'bitbloq.desktop'), path.join(appDir, 'bitbloq.desktop'));
cp.execSync('chmod 644 "' + path.join(appDir, 'bitbloq.desktop') + '"');

// read version from control
var ctrl = fs.readFileSync(path.join(outBase, 'DEBIAN', 'control'), 'utf8');
var version = (ctrl.match(/Version:\s*(.+)/) || [])[1].trim();
var arch = (ctrl.match(/Architecture:\s*(.+)/) || [])[1].trim();
var outDeb = path.join(dist, 'bitbloq_' + version + '_' + arch + '.deb');

console.log('Building .deb: ' + outDeb);
cp.execSync('fakeroot dpkg-deb --build "' + outBase + '" "' + outDeb + '"', { stdio: 'inherit' });
console.log('Done: ' + outDeb);
