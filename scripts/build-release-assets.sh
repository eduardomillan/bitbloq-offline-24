#!/usr/bin/env bash
# Build & package Bitbloq Offline release assets (bitbloq-offline 2.0.0)
#
# IMPORTANT (v2.0.0): Bitbloq Offline NO LONGER depends on the external
# Web2Board project. Compilation and upload are now handled by a local
# WebSocket service (localCompilerServer.js) that delegates to `arduino-cli`,
# started automatically from main.js. See MIGRATE_ARDUINO_CLI.md.
#
# New runtime requirement: `arduino-cli` must be installed and on the PATH of
# the user running Bitbloq Offline (core `arduino:avr` is used; install it with
# `arduino-cli core install arduino:avr`). On the build machine it is only
# needed if you want to smoke-test compilation; packaging does not bundle it.
#
# This script documents / automates the steps to produce every release asset
# from a clean checkout. Run it ON THE TARGET OS (Linux here, Windows/macOS on
# their own machines), then collect the produced files and upload them to the
# GitHub release `v2.0.0`.
#
# ---------------------------------------------------------------------------
# 0. Prerequisites (all platforms)
# ---------------------------------------------------------------------------
#   npm install            # provides node_modules + electron bin via postinstall
#   npm install -g grunt-cli   # if you prefer a global grunt
#   # Optional (for smoke-testing compile/upload):
#   arduino-cli core install arduino:avr
#
# ---------------------------------------------------------------------------
# 1. Linux  (run on a 64-bit Linux box: Ubuntu 22.04+ / Lliurex 23+)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:linux          # -> dist/BitbloqOfflineLinux/
#   ./node_modules/.bin/grunt package-linux        # -> dist/bitbloq_2.0.0_amd64.deb
#                                                 #    dist/BitbloqOffline-2.0.0.AppImage
#   cd dist && zip -r -q bitbloq-offline-linux-2.0.0.zip BitbloqOfflineLinux/ && cd ..
#   # required tools: dpkg-deb, fakeroot, appimagetool (on PATH)
#
# ---------------------------------------------------------------------------
# 2. Windows  (run on Windows with NSIS installed)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:windows        # -> dist/BitbloqOfflineWin/
#   ./node_modules/.bin/grunt pkg-nsis-win         # -> dist/bitbloq-offline-setup-2.0.0.exe
#   cd dist && 7z a -r bitbloq-offline-windows-2.0.0.zip BitbloqOfflineWin/ && cd ..
#   # required tools: makensis (NSIS) on PATH; 7z for the zip
#
# ---------------------------------------------------------------------------
# 3. macOS  (run on macOS)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:mac            # -> dist/BitbloqOfflineMac/
#   cd dist && zip -r -q bitbloq-offline-mac-2.0.0.zip BitbloqOfflineMac/ && cd ..
#
# ---------------------------------------------------------------------------
# 4. Upload  (once all assets are collected)
# ---------------------------------------------------------------------------
#   gh release create v2.0.0 -t "Bitbloq Offline 2.0.0" -n "..." \
#     dist/bitbloq-offline-linux-2.0.0.zip \
#     dist/bitbloq_2.0.0_amd64.deb \
#     dist/BitbloqOffline-2.0.0.AppImage \
#     dist/bitbloq-offline-windows-2.0.0.zip \
#     dist/bitbloq-offline-setup-2.0.0.exe \
#     dist/bitbloq-offline-mac-2.0.0.zip
#
# NOTE: There is no Web2Board asset to publish. Starting from v2.0.0 Bitbloq
# Offline is self-contained for compilation/upload via arduino-cli.
