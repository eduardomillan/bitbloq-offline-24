#!/usr/bin/env bash
#
# Build & package Bitbloq Offline release assets.
#
# IMPORTANT: Bitbloq Offline NO LONGER depends on the external Web2Board project.
# Compilation and upload are handled by a local WebSocket service
# (localCompilerServer.js) that delegates to `arduino-cli`, started automatically
# from main.js. See MIGRATE_ARDUINO_CLI.md.
#
# Runtime requirement for END USERS (not the build): `arduino-cli` must be on the
# PATH with the `arduino:avr` core (`arduino-cli core install arduino:avr`).
#
# Each target must be built ON ITS OWN OS (Electron binaries and native packaging
# tools differ). Run this script with the target OS as the first argument:
#
#   scripts/build-release-assets.sh linux      # on 64-bit Linux (Ubuntu 22.04+)
#   scripts/build-release-assets.sh windows    # on Windows with NSIS installed
#   scripts/build-release-assets.sh mac        # on macOS
#   scripts/build-release-assets.sh all        # build every target available here
#
# The version is read from package.json so filenames never drift.
#
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version")"
PRODUCT="bitbloq-offline"

if [ -z "${VERSION}" ]; then
    echo "ERROR: could not read version from package.json" >&2
    exit 1
fi

echo "Building Bitbloq Offline v${VERSION}"

build_linux() {
    echo "==> Linux build"
    ./node_modules/.bin/grunt build:linux
    ./node_modules/.bin/grunt package-linux   # -> dist/${PRODUCT}_${VERSION}_amd64.deb + BitbloqOffline-${VERSION}.AppImage
    ( cd dist && zip -r -q "${PRODUCT}-linux-${VERSION}.zip" BitbloqOfflineLinux/ )
    echo "Linux assets: ${PRODUCT}_${VERSION}_amd64.deb, BitbloqOffline-${VERSION}.AppImage, ${PRODUCT}-linux-${VERSION}.zip"
}

build_windows() {
    echo "==> Windows build"
    ./node_modules/.bin/grunt build:windows
    ./node_modules/.bin/grunt pkg-nsis-win   # -> dist/${PRODUCT}-setup-${VERSION}.exe
    ( cd dist && 7z a -r "${PRODUCT}-windows-${VERSION}.zip" BitbloqOfflineWin/ )
    echo "Windows assets: ${PRODUCT}-setup-${VERSION}.exe, ${PRODUCT}-windows-${VERSION}.zip"
}

build_mac() {
    echo "==> macOS build"
    ./node_modules/.bin/grunt build:mac
    ( cd dist && zip -r -q "${PRODUCT}-mac-${VERSION}.zip" BitbloqOfflineMac/ )
    echo "macOS asset: ${PRODUCT}-mac-${VERSION}.zip"
}

TARGET="${1:-linux}"

case "$TARGET" in
    linux)  build_linux ;;
    windows) build_windows ;;
    mac)    build_mac ;;
    all)
        build_linux
        if command -v makensis >/dev/null 2>&1 && command -v 7z >/dev/null 2>&1; then
            build_windows
        else
            echo "SKIP windows: makensis/7z not available on this machine" >&2
        fi
        build_mac
        ;;
    *)
        echo "Usage: $0 {linux|windows|mac|all}" >&2
        exit 1
        ;;
esac

echo "Done. Collect the produced files from dist/ and upload them to the GitHub release v${VERSION}."
