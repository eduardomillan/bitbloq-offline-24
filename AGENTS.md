# AGENTS.md

Bitbloq Offline — Electron desktop app (AngularJS 1.4 + Blockly "bloqs") that
compiles/flashes Arduino-family boards. Maintained fork (bq upstream is dead).

## Toolchain (non-obvious, easy to get wrong)
- **Node 8 / npm 5 only.** Newer Node breaks the legacy grunt/bower plugins.
  If `npm install` fails on peer deps: `npm install --legacy-peer-deps`.
- `npm install` runs `bower install` via `postinstall`. Bower components go to
  `bower_components/` and are copied into builds.
- `npm test` = `grunt jshint` (lints `Gruntfile.js` and `app/**/*.js` only).
- `npm start` = `electron .`. Linux launch also needs `--no-sandbox` /
  `--disable-dev-shm-usage`, already set in `main.js`.

## Build commands
- `grunt build:[linux|windows|mac|linux-slim|windows-slim]` — build one target.
  `grunt dist` builds all; `grunt dist-slim` = windows+linux slim.
- `grunt package-linux` (needs `dpkg-deb`+`fakeroot`, `appimagetool`) and
  `grunt pkg-nsis-win` (needs `makensis`) produce native installers from `dist/`.
- `grunt watch` — live-reload styles (runs `grunt sass` + `svgstore` + restarts Electron).

## Generated artifacts (do NOT edit by hand, do NOT commit)
- `app/styles/main.css` — compiled from `app/styles/main.scss` by `grunt sass`
  (Dart Sass, not node-sass).
- `app/images/sprite.svg` — built from `app/images/icons/*.svg` by `grunt svgstore`.
- `res/*-prebuilt/Bitbloq` (and `.exe`/`.app`) — Electron binary copied from
  `node_modules/electron/dist` during `build` via the `electron-bin` task. It is
  gitignored and regenerated on every build. Do not download/commit it.

## Architecture
- `main.js` (Electron main) starts a local WebSocket server on `ws://127.0.0.1:9877`
  (`localCompilerServer.js`) that speaks the legacy WS-Hubs protocol
  (`CodeHub`, `SerialMonitorHub`, `WindowHub`, `UtilsAPIHub`).
- The renderer (AngularJS) does NOT call arduino-cli directly — it talks to that
  WS service, which spawns `arduino-cli`. Board token → FQBN mapping lives in
  `localCompilerServer.js` (see `MIGRATE_ARDUINO_CLI.md`).
- Compile/upload requires **arduino-cli on PATH** + `arduino:avr` core
  (`arduino-cli core install arduino:avr`). Override binary with `ARDUINO_CLI`.
- Bitbloq Arduino libs (for Zowi etc.) are under `res/libs/v1_1_3`, passed to
  arduino-cli via `--libraries`. Do not touch `!app/res/web2board/**` (excluded
  from builds).

## Conventions
- Lint via `.jshintrc`: 4-space indent, single quotes, `strict`, `undef`.
  Run `grunt jshint` before any PR.
- i18n: UI strings in `app/res/locales/<code>.json` (angular-translate). To add a
  language, copy `en-GB.json`, add the name to EVERY locale file, and register in
  `app/scripts/services/commonModals.js` + `tasks/poeditor.js`. Block labels use a
  separate translation system (not auto-translated).
- Logs (compile/upload/WS errors) at `~/.config/BitbloqOffline/logs/bitbloq-offline.log`.

## Release / assets
- `scripts/build-release-assets.sh` builds the GitHub Release artifacts.
- Semantic versioning; bump `package.json` `version` and update `CHANGELOG.md`.
- `zowi_samples/` is copied to the build root on every `build:*`.
