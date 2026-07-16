# Bitbloq Offline

**Bitbloq Offline** is the desktop (Electron) build of [Bitbloq](https://bitbloq.bq.com), a
visual programming environment for Arduino and a wide range of educational
maker boards and robots (Zowi, mBot, Makeblock, BQ ZUM, eBotics, and many more).

It bundles the **Bitbloq editor** (Angular + Blockly-based "bloqs" blocks)
together with **Web2Board**, the companion service that flashes compiled
programs to the physical boards over USB.

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
- [Web2Board and the "slim" build](#web2board-and-the-slim-build)
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

Web2Board is shipped **separately** and downloaded on demand by the application
on first use (see [Web2Board and the "slim" build](#web2board-and-the-slim-build)).
The Web2Board packages are published as release assets tagged
`web2board-vX.Y.Z`.

- **Installation & Web2Board setup:** see [`INSTALL.md`](INSTALL.md).

---

## Quick start (run from source)

Requirements:

- **Node.js 8.x** and the matching **npm 5.x** (the legacy `grunt` toolchain
  and `bower` dependencies are not compatible with newer Node majors).
- **Electron 4.x** (installed locally as a dev dependency).
- On Linux, the system libraries pulled in by `bower install` / build
  (e.g. `libusb`, `pango`) and the board USB drivers in `app/res/drivers`.

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
| `grunt dist`                         | App for Windows, macOS and Linux. Web2Board is **not** bundled — it is downloaded on demand from its own repository. |
| `grunt dist-slim`                    | Alias for the same on-demand behavior (no bundled Web2Board). |
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

> **Web2Board is a separate project.** Bitbloq Offline no longer bundles
> Web2Board. On first use it downloads the correct Web2Board package from
> [eduardomillan/web2board](https://github.com/eduardomillan/web2board) and
> verifies its SHA-256 (see `app/res/web2board-download.json`). Web2Board
> development (including the system tray feature) happens in that repository.

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

## Web2Board and on-demand download

**Web2Board** is the service that compiles Bitbloq programs and flashes them to
the board. It is a **separate project**
(https://github.com/eduardomillan/web2board) and is **no longer bundled** in
Bitbloq Offline. Instead:

- Bitbloq Offline ships **without** Web2Board. The first time the user flashes a
  program, the app fetches the correct package for the platform from the
  `eduardomillan/web2board` GitHub releases, verifies its SHA-256 checksum and
  runs it. An internet connection is needed only for that one-time download.

The download descriptor lives at `app/res/web2board-download.json` and records
the Web2Board `version`, the `releaseTag`, the `baseUrl` and per-platform
`file` / `rootDir` / `sha256`. Update this file (and republish the
`web2board-vX.Y.Z` release in the web2board repo) when Web2Board changes.

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
`Zowi`) to be available in the compile environment (Web2Board/Arduino). The
blocks are illustrative only — editing them regenerates the `code` field, so the
factory firmware is preserved as-is in the embedded `code`.

---

## Debug logs (compile / upload errors)

When code is compiled or uploaded to a board, any error returned by Web2Board
(including the Arduino `stdErr`) is:

1. **Written to a log file** at:
   - Linux: `~/.config/BitbloqOffline/logs/bitbloq-offline.log`
   - macOS: `~/Library/Application Support/BitbloqOffline/logs/bitbloq-offline.log`
   - Windows: `%APPDATA%/BitbloqOffline/logs/bitbloq-offline.log`
2. **Shown in a toast** that displays only the **first line** of the error (with
   scrollbars if it is long) and a **"Copiar"** (Copy) button. Clicking the
   button copies the **complete** error text to the clipboard, so you can paste
   it into an issue or debugger.

WebSocket and Web2Board launch/connection errors are also appended to the same
log file (they are not shown as toasts to avoid being intrusive).

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
│   ├── web2board    # Web2Board nested app (per-OS launchers)
│   └── drivers      # USB drivers for boards
├── scripts          # Angular app (controllers, directives, factories, services)
├── styles           # SCSS / compiled CSS
└── views            # HTML views
main.js              # Electron entry point / window + launch switches
res                  # Per-OS prebuilt Electron runtimes (linux, mac, windows32, …)
tasks                # Custom grunt tasks (e.g. web2board manifest generator)
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
- **Web2Board releases:** Web2Board is built and published in its own repo
  (https://github.com/eduardomillan/web2board). `app/res/web2board-download.json`
  points to those releases; update it when Web2Board is bumped.
- **Contributing:** pull requests that add board/robot definitions or fix
  platform issues are welcome. Please run `grunt jshint` before submitting.
- **Versioning:** this project follows [Semantic Versioning](https://semver.org/)
  (see `package.json` `version` and `CHANGELOG.md`).

---

## Troubleshooting

- **Board not detected although it is connected?** Check the board
  troubleshooting guide in `docs/` and make sure the USB drivers from
  `app/res/drivers` are installed.
- **App won't start on Linux:** ensure you are not running as root and that
  `/dev/shm` is available; the app already passes `--no-sandbox` and
  `--disable-dev-shm-usage`.
- **Web2Board download fails:** verify internet access on first flash, or
  pre-place the Web2Board package. The integrity of each download is verified
  against the SHA-256 in `app/res/web2board-download.json`.

---

## License

See the license file shipped with the repository. Bitbloq is free/open-source
software; board definitions and assets may carry their own licenses.
