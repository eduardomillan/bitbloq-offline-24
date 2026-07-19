# Bitbloq Offline

**Bitbloq Offline** is the desktop (Electron) build of [Bitbloq](https://bitbloq.bq.com), a
visual programming environment for Arduino and a wide range of educational
maker boards and robots (Zowi, mBot, Makeblock, BQ ZUM, eBotics, and many more).

It bundles the **Bitbloq editor** (Angular + Blockly-based "bloqs" blocks)
and compiles/flashes programs to the physical boards over USB by itself, using
**arduino-cli** as its compilation backend (no separate Web2Board install needed
since v2.0.0 — see [`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md)).

This repository is a maintained fork (originally from bq) adapted for modern
Linux distributions (Ubuntu 22.04 / Lliurex 23-25 and similar) and for
offline, air-gapped deployments.

> **Note on status:** the upstream `bq/bitbloq-offline` project is no longer
> actively developed. This fork keeps the application working on current
> operating systems and fixes board-flashing issues. It is **not** a
> reimplementation and does not track the online bitbloq.bq.com service.

---

## Table of contents

- [Supported platforms](#supported-platforms)
- [Downloads](#downloads)
- [Quick start (run from source)](#quick-start-run-from-source)
- [Building distributables](#building-distributables)
- [Compilation backend (arduino-cli)](#compilation-backend-arduino-cli)
- [Internationalization](#internationalization)
- [Project structure](#project-structure)
- [Developer notes](#developer-notes)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Supported platforms

| Platform            | Architectures        | Notes                                              |
|---------------------|----------------------|----------------------------------------------------|
| Linux (64-bit)      | x86_64               | Tested on Ubuntu 22.04 / Lliurex 23-25.            |
| Windows             | 32-bit and 64-bit    | ARM edition of Windows is **not** supported.       |
| macOS               | 64-bit (Intel)       |                                                    |

**Linux 32-bit builds have been removed** (see `CHANGELOG.md`). Only 64-bit
Linux is produced.

### Supported hardware

Bitbloq programs run on a large set of boards and robots. The editor supports,
among others:

- Arduino UNO / MEGA 2560 / Leonardo / Nano
- Freaduino UNO, BQ ZUM, BQ ZUM Box
- Makeblock: mBot, mCore, Me Auriga, Me Orion, mRanger, Elecfreak kits
- eBotics 4in1, FreaksCar, Ranger kits, Arduino starter kits
- Robots: Zowi, and many PrintBots

Need a board or robot that is not listed? Contributions that add correct board
definitions are welcome (see [Developer notes](#developer-notes)).

---

## Downloads

Pre-built binaries are published as GitHub Releases on
[eduardomillan/bitbloq-offline-24](https://github.com/eduardomillan/bitbloq-offline-24/releases):

- **Linux (64-bit)** — `linux.zip`
- **Windows (32/64-bit)** — `windows.zip`
- **macOS** — `mac.zip`

Since **v2.0.0**, Bitbloq Offline is **self-contained**: it compiles and uploads
programs using **arduino-cli**, so no separate Web2Board install is required. The
only external requirement is that `arduino-cli` (with the `arduino:avr` core) is
available on the user's `PATH` — see
[Compilation backend (arduino-cli)](#compilation-backend-arduino-cli).

---

## Quick start (run from source)

Requirements:

- **Node.js 8.x** and the matching **npm 5.x** (the legacy `grunt` toolchain
  and `bower` dependencies are not compatible with newer Node majors).
- **Electron 4.x** (installed locally as a dev dependency).
- **arduino-cli** (on the `PATH`) with the `arduino:avr` core installed
  (`arduino-cli core install arduino:avr`). This is the compilation backend used
  by Bitbloq Offline since v2.0.0.
- On Linux, the system libraries pulled in by `bower install` / build
  (e.g. `libusb`, `pango`). Board USB drivers are not bundled: on Linux they are
  handled by the kernel/udev, and on Windows via Windows Update / arduino-cli or
  a manual install (see `INSTALL.md`).

```bash
# 1. Clone
git clone https://github.com/eduardomillan/bitbloq-offline-24.git
cd bitbloq-offline-24

# 2. Install npm + bower components (bower runs automatically via postinstall)
npm install

# 3. Launch the app (Electron)
npm start
```

`npm start` runs `electron .`. For development with live reload of styles:

```bash
# regenerate the SVG sprite + compile SCSS, then watch
grunt svgstore
grunt sass
grunt watch
```

---

## Building distributables

The build is driven by `grunt`. Available high-level targets:

| Command                              | What it produces                                              |
|--------------------------------------|---------------------------------------------------------------|
| `grunt dist`                         | App for Windows, macOS and Linux. Self-contained (uses arduino-cli for compile/upload). |
| `grunt dist-slim`                    | Alias for the same self-contained build (no bundled Web2Board). |
| `grunt build:windows`                | Windows build only.                                           |
| `grunt build:linux`                  | Linux build only.                                             |
| `grunt build:mac`                    | macOS build only.                                             |
| `grunt build:windows-slim`           | Slim Windows build.                                           |
| `grunt build:linux-slim`             | Slim Linux build.                                             |
| `grunt package-linux`                | Builds `.deb` + AppImage for Bitbloq Offline.                 |
| `grunt pkg-nsis-win`                 | Builds the Windows installer `.exe` (needs `makensis`).       |
| `grunt package-all`                  | `package-linux` + `pkg-nsis-win`.                             |
| `grunt jshint`                       | Lint `Gruntfile.js` and `app/**/*.js`.                        |

Each build writes to `dist/BitbloqOffline{OS}/`, ready to run or package.

> **Native packages** (`.deb`, AppImage, Windows installer) are produced from
> those `dist/` folders by the `package-*` tasks. They require a few external
> tools on the build machine: `dpkg-deb` + `fakeroot` (`.deb`), `appimagetool`
> (AppImage), and `makensis` from NSIS (Windows `.exe`). The packaging scripts
> live in `tasks/lib/pkg-deb.js`, `tasks/lib/pkg-appimage.js` and
> `pkg/windows/bitbloq-offline.nsi`; metadata and launchers in `pkg/linux/*`.
> See [`INSTALL.md`](INSTALL.md) for what each artifact contains and how end
> users install them.

> **Self-contained since v2.0.0.** Bitbloq Offline compiles and uploads by
> itself via arduino-cli. The separate Web2Board project is no longer required
> (see [`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md)).

> **Electron binary is generated automatically.** The `build` task copies the
> Electron executable from the local `node_modules/electron/dist` into the
> matching `res/*-prebuilt` directory (as `Bitbloq` / `Bitbloq.exe` /
> `Bitbloq.app`) before packaging. You do **not** need to download or commit the
> binary: a plain `npm install` provides it. The generated binary is git-ignored.

> **Linux note:** modern distributions use glibc 2.35+ / kernel 5.x. `main.js`
> launches Electron with `--no-sandbox` and `--disable-dev-shm-usage` so the app
> starts without root and without a large `/dev/shm`. A helper script to launch
> the app on Linux is provided as well.

---

## Compilation backend (arduino-cli)

Since **v2.0.0** Bitbloq Offline does **not** depend on the external Web2Board
project. Instead, the Electron main process starts a small local WebSocket
service (`localCompilerServer.js` on `ws://127.0.0.1:9877`) that speaks the same
hub protocol the frontend already used, but delegates the actual work to
[arduino-cli](https://arduino.github.io/arduino-cli/):

- **Compile** → `arduino-cli compile --fqbn <board> --libraries res/libs/v1_1_3 ...`
- **Upload**  → `arduino-cli upload -b <board> -p <port> --input-dir <build> ...`
- **Serial monitor** → `arduino-cli monitor -p <port> -c baudrate=<n> ...`

Board tokens from the editor map to arduino-cli FQBNs:

| Editor token (`board.mcu`) | arduino-cli FQBN |
|----------------------------|------------------|
| `uno` / `bt328`            | `arduino:avr:uno` |
| `nanoatmega168`            | `arduino:avr:nano:cpu=atmega168` |
| `nano`                     | `arduino:avr:nano` |
| `mega`                     | `arduino:avr:mega` |
| `diemilanove`              | `arduino:avr:diecimila` |

The Bitbloq libraries under `res/libs/v1_1_3` are passed via `--libraries`, so
sketches using `#include <BitbloqZowi.h>` (and friends) compile out of the box.

**User requirement:** `arduino-cli` must be installed and on the `PATH` of the
user running Bitbloq Offline, with the AVR core present:

```bash
arduino-cli core install arduino:avr
```

To use a non-default `arduino-cli` binary, set the `ARDUINO_CLI` environment
variable before launching Bitbloq Offline. See
[`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md) for the full architecture and
migration rationale.

---

## Zowi example projects

The `zowi_samples/` folder at the repository root contains ready-to-open
Bitbloq project files for the **Zowi** robot (a starting point for kids). On
every `build:*`, these files are copied to the **root of the unpacked build
directory** (next to the `Bitbloq` launcher), e.g.:

```
BitbloqOfflineLinux/
├── Bitbloq              # app launcher
├── bitbloq.sh           # Linux helper script
├── zowi_samples/        # ← Zowi examples, at the build root
│   ├── simple_smile.bitbloq        # Minimal Zowi blocks example (smile)
│   ├── zowi_factory_base.bitbloq   # Factory firmware (ZOWI_BASE_v2)
│   ├── zowi_factory_hello.bitbloq  # Factory/Hello config (factoryZowi)
│   ├── zowi_game_alarm.bitbloq     # Game: Alarm v2
│   └── zowi_game_adivinawi.bitbloq # Game: Adivinawi v2
└── resources/...
```

This keeps the examples easy to find for children: just open the unzipped
folder and double-click any `.bitbloq` inside `zowi_samples/`.

### Factory firmware samples (hybrid format)

The samples named `zowi_*` contain the **real Zowi factory firmware** (the
`.ino` programs shipped on the robot) embedded in the project's Arduino `code`
field. They use a hybrid format: a minimal Zowi block model (`zowiHome` in
`setup`, `zowiMouth` in `loop`) so the project opens as a valid Zowi project in
bitbloq-offline, while the full factory firmware lives in the **Code** tab and
is what gets flashed to the robot.

These come from `../zowiLibs/code/`:

| `.bitbloq`                   | Source `.ino`                                  |
|------------------------------|-----------------------------------------------|
| `zowi_factory_base.bitbloq`  | `base/ZOWI_BASE_v2.ino`                       |
| `zowi_factory_hello.bitbloq` | `factoryZowi/factoryZowi.ino`                 |
| `zowi_game_alarm.bitbloq`    | `games/ZOWI_Alarm_v2/ZOWI_Alarm_v2.ino`       |
| `zowi_game_adivinawi.bitbloq`| `games/ZOWI_Adivinawi_v2/ZOWI_Adivinawi_v2.ino`|

Note: the firmware requires the Zowi Arduino libraries (`Servo`, `Oscillator`,
`EEPROM`, `BatReader`, `US`, `LedMatrix`, `EnableInterrupt`, `ZowiSerialCommand`,
`Zowi`) to be available in the compile environment (arduino-cli + Bitbloq libs). The
blocks are illustrative only — editing them regenerates the `code` field, so the
factory firmware is preserved as-is in the embedded `code`.

---

## Debug logs (compile / upload errors)

When code is compiled or uploaded to a board, any error returned by the
compiler backend (including the Arduino `stdErr` from arduino-cli) is:

1. **Written to a log file** at:
   - Linux: `~/.config/BitbloqOffline/logs/bitbloq-offline.log`
   - macOS: `~/Library/Application Support/BitbloqOffline/logs/bitbloq-offline.log`
   - Windows: `%APPDATA%/BitbloqOffline/logs/bitbloq-offline.log`
2. **Shown in a toast** that displays only the **first line** of the error (with
   scrollbars if it is long) and a **"Copiar"** (Copy) button. Clicking the
   button copies the **complete** error text to the clipboard, so you can paste
   it into an issue or debugger.

WebSocket and compiler-backend launch/connection errors are also appended to
the same log file (they are not shown as toasts to avoid being intrusive).

---

## Internationalization

UI strings live under `app/res/locales/*.json` (one file per language code).
Translation is handled by **angular-translate** with a static file loader
(`res/locales/<code>.json`).

Supported languages (selector order is alphabetical by language code):

`bg-BG`, `ca-ES`, `de-DE`, `en-GB`, `es-ES`, `eu-ES`, `fr-FR`, `gl`, `it-IT`,
`nl-NL`, `pt-PT`, `ru-RU`, `zh-CN`.

To add a language:

1. Copy `app/res/locales/en-GB.json` to `app/res/locales/<code>.json` and
   translate the values.
2. Add the language name entry (`"<code>": "<Native name>"`) to **every** existing
   locale file so the selector shows the new language in all languages.
3. Register the code in `app/scripts/services/commonModals.js`
   (`modaloptions`) and in `tasks/poeditor.js` (`langKeys`).

> **Block names are translated by a separate system.** The block editor ("bloqs")
> keeps its own translation tables; adding a UI language does not automatically
> translate block labels.

---

## Project structure

```
app
├── fonts            # App fonts
├── images           # App images (boards, components, robots, svgstore icons)
├── res              # Common resources
│   ├── locales      # Language translations (angular-translate)
│   ├── menus        # JSON files for generating menus
│   └── libs         # Bitbloq Arduino libraries (v1_1_3) passed to arduino-cli
├── scripts          # Angular app (controllers, directives, factories, services)
├── styles           # SCSS / compiled CSS
└── views            # HTML views
main.js              # Electron entry point / window + launch switches
localCompilerServer.js # Local WebSocket compiler service (arduino-cli backend)
res                  # Per-OS prebuilt Electron runtimes (linux, mac, windows32, …)
tasks                # Custom grunt tasks
```

---

## Developer notes

- **Node toolchain:** the project targets **Node 8 / npm 5**. A `postinstall`
  script runs `bower install`. Newer Node versions break the legacy `grunt`
  plugins; if `npm install` fails on peer deps, install with
  `npm install --legacy-peer-deps`.
- **Theming:** styles are SCSS compiled to `app/styles/main.css` via
  `grunt sass` (Dart Sass).
- **SVG icons:** `grunt svgstore` builds a sprite from `app/images/icons`.
- **Compilation backend:** since v2.0.0 the app uses arduino-cli via
  `localCompilerServer.js` (started from `main.js`). Board→FQBN mapping and
  library paths live there; see [`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md).
- **Contributing:** pull requests that add board/robot definitions or fix
  platform issues are welcome. Please run `grunt jshint` before submitting.
- **Versioning:** this project follows [Semantic Versioning](https://semver.org/)
  (see `package.json` `version` and `CHANGELOG.md`).

---

## Troubleshooting

- **Board not detected although it is connected?** Check the board
  troubleshooting guide in `docs/` and make sure the correct USB-serial driver
  for the board is installed (on Windows via Windows Update / arduino-cli or a
  manual install; see `INSTALL.md`).
- **App won't start on Linux:** ensure you are not running as root and that
  `/dev/shm` is available; the app already passes `--no-sandbox` and
  `--disable-dev-shm-usage`.
- **Compile fails with "command not found" / no output:** ensure `arduino-cli`
  is installed and on the `PATH` of the user running Bitbloq Offline, and that
  the AVR core is present (`arduino-cli core install arduino:avr`). To point at a
  custom binary set `ARDUINO_CLI=/ruta/a/arduino-cli` before launching.
- **Board not found on upload:** check that the board is connected and that the
  user has permission to access the serial port (e.g. add the user to the
  `dialout` group on Linux). Bitbloq detects ports via `arduino-cli board list`.

---

## License

See the license file shipped with the repository. Bitbloq is free/open-source
software; board definitions and assets may carry their own licenses.
