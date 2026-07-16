#!/usr/bin/env bash
# Build & package Bitbloq Offline release assets (bitbloq-offline 1.4.2)
#
# Web2Board is NO LONGER bundled. It is downloaded on demand by the app from
# https://github.com/eduardomillan/web2board (see app/res/web2board-download.json).
#
# This script documents / automates the steps to produce every release asset
# from a clean checkout. Run it ON THE TARGET OS (Linux here, Windows/macOS on
# their own machines), then collect the produced files and upload them to the
# GitHub release `v1.4.2`.
#
# ---------------------------------------------------------------------------
# 0. Prerequisites (all platforms)
# ---------------------------------------------------------------------------
#   npm install            # provides node_modules + electron bin via postinstall
#   npm install -g grunt-cli   # if you prefer a global grunt
#
# ---------------------------------------------------------------------------
# 1. Linux  (run on a 64-bit Linux box: Ubuntu 22.04+ / Lliurex 23+)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:linux          # -> dist/BitbloqOfflineLinux/
#   ./node_modules/.bin/grunt package-linux        # -> dist/bitbloq_1.4.2_amd64.deb
#                                                 #    dist/BitbloqOffline-1.4.2.AppImage
#   cd dist && zip -r -q bitbloq-offline-linux-1.4.2.zip BitbloqOfflineLinux/ && cd ..
#   # required tools: dpkg-deb, fakeroot, appimagetool (on PATH)
#
# ---------------------------------------------------------------------------
# 2. Windows  (run on Windows with NSIS installed)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:windows        # -> dist/BitbloqOfflineWin/
#   ./node_modules/.bin/grunt pkg-nsis-win         # -> dist/bitbloq-offline-setup-1.4.2.exe
#   cd dist && 7z a -r bitbloq-offline-windows-1.4.2.zip BitbloqOfflineWin/ && cd ..
#   # required tools: makensis (NSIS) on PATH; 7z for the zip
#
# ---------------------------------------------------------------------------
# 3. macOS  (run on macOS)
# ---------------------------------------------------------------------------
#   ./node_modules/.bin/grunt build:mac            # -> dist/BitbloqOfflineMac/
#   cd dist && zip -r -q bitbloq-offline-mac-1.4.2.zip BitbloqOfflineMac/ && cd ..
#
# ---------------------------------------------------------------------------
# 4. Upload  (once all assets are collected)
# ---------------------------------------------------------------------------
#   gh release upload v1.4.2 \
#     dist/bitbloq-offline-linux-1.4.2.zip \
#     dist/bitbloq_1.4.2_amd64.deb \
#     dist/BitbloqOffline-1.4.2.AppImage \
#     dist/bitbloq-offline-windows-1.4.2.zip \
#     dist/bitbloq-offline-setup-1.4.2.exe \
#     dist/bitbloq-offline-mac-1.4.2.zip
#
# NOTE: Web2Board (v3.0.0) assets are published SEPARATELY under
# https://github.com/eduardomillan/web2board/releases (tag web2board-v3.0.0).
# After those are published, set the real SHA-256 values in
# app/res/web2board-download.json (currently TODO placeholders).
