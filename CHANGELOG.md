# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Current version: **2.0.4**

## [2.0.4] - 2026-07-21

### Fixed
- **Window title now shows the application name and version correctly.** The
  project filename (with dirty `*` marker) is sent from the renderer, while the
  main process appends `Bitbloq Offline <version>` — matching the convention
  used by the rest of the app. Previously the renderer sent the full title
  including a hardcoded product name, which duplicated the version string.
- **"Exportar código Arduino" now uses the project name from the window title.**
  The exported `.ino` file is named after the saved `.bitbloq` project (or
  "new-project" when unsaved), instead of always defaulting to "new-project".
  This keeps the downloaded filename consistent with what the user sees in the
  title bar.
- **Opening a project from disk now switches to the blocks tab automatically.**
  When a `.bitbloq` file is opened, the application switches to the "Bloques"
  (software) tab (index 1) so the blocks are visible immediately, regardless of
  which tab (Hardware, Bloques, or Código) was active before. This is done via
  a `select-tab` event broadcast from `ActionBarCtrl` and handled by the
  `tabset` directive's new `selectByIndex` method.

## [2.0.3] - 2026-07-21

### Changed
- **Hide "Ver" (View) menu for arduino-cli backend.** This removes the
  obsolete Web2Board-related menu entries ("Ver"/"View" menu). The "Mostrar"
  menu is now simplified with only *Mostrar Serial Monitor* and *Abrir carpeta
  de logs*.
- **Added connection status bar to the robot board interface.** The status bar
  now displays real-time connection status to the robot board, showing when the
  connection is active or when there are connection issues.

## [2.0.2] - 2026-07-17

### Fixed
- **Cleaned up the "Ver" (View) menu for the arduino-cli backend.** Removed the
  dead `Mostrar web2board`, `Ver plotter` (duplicate of the serial monitor) and
  `Configurar Web2Board` entries. The menu now only has *Mostrar Serial Monitor*
  and *Abrir carpeta de logs*.
- **"Mostrar Serial Monitor" now actually opens the monitor.** It was only
  reserving the port (`startApp` no-op) and never showed a window. It now opens
  the plotter window, which connects to the board via `arduino-cli monitor`.
- **"Abrir carpeta de logs" is more robust.** It creates the `logs/` folder if
  missing and opens the folder (or the log file when present) instead of relying
  on a possibly non-existent file path.
- `launchWeb2BoardSettingsModal` is now a no-op (the Web2Board path setting is
  obsolete).

## [2.0.1] - 2026-07-17

### Fixed
- **Graceful shutdown when the local compiler port (9877) is already in use.**
  If another instance of Bitbloq Offline is already running, `localCompilerServer`
  now catches the `EADDRINUSE`/`EACCES` listen error and the app shows a clear
  error dialog ("already running") before quitting, instead of crashing with an
  uncaught `listen` exception at runtime.

## [2.0.0] - 2026-07-17

### Changed
- **No longer depends on the external Web2Board project.** This is the major
  change that drives the 2.0.0 bump. Bitbloq Offline now compiles and uploads to
  Arduino boards by itself, with no separate Web2Board install required.
- **Compile/upload now uses `arduino-cli` instead of Web2Board (PlatformIO).**
  Web2Board bundled PlatformIO 2.6.3 whose registry API
  (`http://api.platformio.org`) is defunct, causing `[API] Not Found` on every
  compile. Bitbloq Offline now runs a local WebSocket service
  (`localCompilerServer.js`, started from `main.js` on `ws://127.0.0.1:9877`)
  that speaks the same WS-Hubs protocol the frontend expects, but delegates
  compile/upload to the system `arduino-cli` (tested with v1.5.1, core
  `arduino:avr` 1.8.8). The Bitbloq libraries under `res/libs/v1_1_3` are passed
  via `--libraries`, so sketches using `#include <BitbloqZowi.h>` etc. compile.
  Board tokens map to FQBNs: `uno`/`bt328` → `arduino:avr:uno`,
  `nanoatmega168` → `arduino:avr:nano:cpu=atmega168`, `mega` → `arduino:avr:mega`.
  The serial monitor uses `arduino-cli monitor`. Web2Board is no longer spawned
  (`startWeb2board`/`launchWeb2board` in `web2board.js` are now no-ops). See
  `MIGRATE_ARDUINO_CLI.md` for details.
- **Removed Web2Board auto-download and locator.** The on-demand download
  (`web2boardInstaller.js`, `web2board-download.json`) and the
  `web2boardLocator` resolution logic are no longer used; the *Configurar
  Web2Board* settings dialog is obsolete for compilation.
- **Electron binary is generated at build time.** The `build` task copies the
  Electron executable from `node_modules/electron/dist` into `res/*-prebuilt`
  (as `Bitbloq` / `Bitbloq.exe` / `Bitbloq.app`), so the ~114 MB binary is no
  longer versioned or uploaded; `npm install` provides it. The generated binary
  is git-ignored.

### Added
- `localCompilerServer.js`: local WebSocket compiler service (arduino-cli backend).
- `MIGRATE_ARDUINO_CLI.md`: migration notes and architecture.

## [Unreleased]

## [1.4.3] - 2026-07-16

- **Fix upload: replace bundled libtinfo.so.5 with system version.** web2board
  bundles `libncurses.so.5` that requires `NCURSES_TINFO_6.2.20211010` from
  `libtinfo.so.5`, but the bundled `libtinfo.so.5` is too old and lacks that
  symbol. Bitbloq now automatically replaces the bundled `libtinfo.so.5` with
  the system version before launching web2board.
- Create system-level symlink for `libusb-0.1.so.4` (needed by avrdude64)
  in `.deb` postinst, AppImage AppRun, and zip launcher.
- Fix `LD_LIBRARY_PATH` when spawning web2board to include `res/` and
  `toolchain-atmelavr/lib` paths (for avrdude64 / libusb).

## [1.4.2] - 2026-07-16

- **Fix upload on Linux.** Bitbloq now adds web2board's `res/` and
  `res/pp/packages/toolchain-atmelavr/lib` folders to `LD_LIBRARY_PATH` when
  launching Web2Board, so `avrdude64` can find `libusb-0.1.so.4` and the board
  port is detected (fixes `alert-web2board-no-port-found`).

## [1.4.1] - 2026-07-16

- Bump version to 1.4.1.

## [1.4.0] - 2026-07-16

- **Web2Board split into its own repository.** Bitbloq Offline no longer bundles
  Web2Board (the ~976 MB `app/res/web2board` tree was removed). Web2Board is now
  developed and released at https://github.com/eduardomillan/web2board (bumped to
  **3.0.0**). On first use Bitbloq downloads the matching Web2Board package from
  that repository, verifies its SHA-256 (see `web2board-download.json`) and runs
  it.
- **Slim release artifacts.** All release builds are now slim: no bundled
  Web2Board, no separate Web2Board `.deb`/AppImage. Only Bitbloq Offline zips,
  `.deb`, AppImage and Windows installer are published.
- `grunt package-web2board`, `web2board-manifest.js`, the `release-web2board.yml`
  workflow and the `pkg/linux/web2board` metadata were removed; `pkg-deb.js` and
  `pkg-appimage.js` now build only Bitbloq Offline.

## [1.2.3] - Deprecated / Obsolete

> **Deprecated.** This was the last release of the original `bq/bitbloq-offline`
> lineage, used as the baseline before this fork. It does **not** work on modern
> systems (Ubuntu 22.04 / Lliurex 23+, current Electron/glibc) and is kept only
> for historical reference. Use `1.3.0-rc.1` or later instead.

## [1.3.0-rc.1] - 2026-07-16

> First release candidate of the maintained fork. This is the first build
> intended to be functional on modern systems (Ubuntu 22.04 / Lliurex 23-25,
> current Electron and glibc). Please test and report issues.

### Added
- **Bulgarian (bg-BG) language.** New locale `app/res/locales/bg-BG.json`
  (1427 keys, translated from `es-ES`). Registered in the language selector
  (`commonModals.js` `modaloptions`) and in `tasks/poeditor.js` (`langKeys`).
  The `bg-BG` language name is added to every existing locale file so the
  selector is self-describing. (Fork branches `bg-BG`.)
- **Web2Board released as a separate, versioned package.** Added
  `grunt package-web2board`, the download descriptor
  `app/res/web2board-download.json` (version 2.1.3, per-platform zip + SHA-256),
  the on-demand installer factory `app/scripts/factories/web2boardInstaller.js`,
  the manifest generator `tasks/lib/web2board-manifest.js`, and the CI workflow
  `.github/workflows/release-web2board.yml` that builds and publishes the
  `web2board-vX.Y.Z` release assets automatically.
- **Slim builds.** `grunt dist-slim` / `build:*-slim` produce distributables
  without a bundled Web2Board; Web2Board is fetched and checksum-verified on
  first use.

### Changed
- **Linux port to modern distributions.** Adapted to run on Ubuntu 22.04 /
  Lliurex 23-25: `main.js` launches Electron with `--no-sandbox` and
  `--disable-dev-shm-usage`; added required system libraries (libusb, pango).
- **Build tooling.** Switched SCSS compilation to Dart Sass (`grunt sass`);
  fixed `bower`/`grunt` installation issues (certificate workaround, forced
  `--legacy-peer-deps` in CI); added a Linux launch helper script.
- **README** rewritten in English with accurate, current platform, build,
  Web2Board and i18n documentation (replaces the discontinued upstream text).

### Removed
- **Linux 32-bit support.** Deleted `res/linux32-prebuilt` and the
  `copy:linux32`, `copy:prebuiltLinux32` and `clean:linux32` grunt targets;
  removed the corresponding exclusions and the Linux 32-bit Web2Board launcher
  fallback in `web2board.js` (non-x64 Linux now uses the on-demand download).
  Removed the "Linux 32" links from the README. Only 64-bit Linux is built.
- **Redundant bundled `libusb`.** Removed `res/linux-prebuilt/libusb/` (the
  legacy `libusb-0.1.so.4` copy). The Electron app does not use libusb directly
  on Linux; board flashing is handled by Web2Board, which ships its own libusb
  inside its toolchain and runs with `LD_LIBRARY_PATH` set to its own folder.
  USB/serial access on Linux relies on the kernel + `udev` (add the user to the
  `dialout` group), not on this file.

### Fixed
- Board flashing and USB detection issues on current Linux kernels/glibc.

### Added
- **Zowi example projects at the build root.** The `zowi_samples/` folder is
  copied to the root of each unpacked build (next to the `Bitbloq` launcher, as
  `zowi_samples/`), so kids can open the examples directly from the unzipped
  folder. Wired into `build:*` via new `copy:zowiSamples*` targets (and removed
  from the app bundle in `getCopySrc`).

---

## Versioning policy

- **MAJOR** — incompatible changes to the build/runtime contract or removal of
  a supported platform.
- **MINOR** — new features (languages, boards, build modes) in a
  backwards-compatible way.
- **PATCH** — bug fixes and platform adaptations that do not change behavior.

Web2Board is versioned independently and referenced by its own `web2board-vX.Y.Z`
release tag; the application pins the Web2Board version in
`app/res/web2board-download.json`.
