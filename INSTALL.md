# Installation guide

This document explains how to install **Bitbloq Offline** on Linux and Windows,
and how to compile and upload programs to your board (Arduino, Zowi, PrintBot,
etc.).

> **Versions covered:** Starting from version 2.0,
> Bitbloq Offline is **self-contained**: it compiles and uploads by itself using
> **arduino-cli** and no longer needs the separate Web2Board project. See
> [`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md).

---

## 1. Download

Get the build for your platform from the
[Releases page](https://github.com/eduardomillan/bitbloq-offline-24/releases):

| Platform | File |
|----------|------|
| Linux (64-bit) | `bitbloq-offline-linux-x.y.zip` |
| Windows (64/32-bit) | `bitbloq-offline-windows-x.y.zip` |

In addition to the zips, the following **native installers** are published for
this release:

| Format | Bitbloq Offline |
|--------|-----------------|
| Linux `.deb` | `bitbloq_x.y_amd64.deb` |
| Linux AppImage | `BitbloqOffline-x.y.AppImage` |
| Windows installer | `bitbloq-offline-setup-x.y.exe` |

- **Bitbloq `.deb`** installs to `/opt/bitbloq-offline` and adds
  `/usr/bin/bitbloq-offline` plus a menu entry.
- **arduino-cli** must be installed on the system (see section 4) — it is the
  compilation backend used since v2.0.0.
- The **Windows installer** puts Bitbloq in `C:\Program Files\BitbloqOffline`
  and creates Start Menu and Desktop shortcuts. Board drivers are no longer
  bundled — see section 3.4.

Unzip it anywhere you like. You do **not** need administrator rights to run the
app — just unzip and launch.

After unzipping you will see, at the **root of the folder**:

```
BitbloqOfflineLinux/          (or BitbloqOfflineWin/ on Windows)
├── Bitbloq               # app launcher (Linux)
├── Bitbloq.exe           # app launcher (Windows)
├── bitbloq.sh            # Linux helper launch script
├── zowi_samples/         # Zowi example projects (.bitbloq) for kids
└── resources/
```

---

## 2. Install on Linux

### 2.1 Requirements

- A 64-bit Linux distribution (tested on Ubuntu 22.04 / Lliurex 23–25).
- Your user must belong to the `dialout` group so the board's serial port
  (`/dev/ttyACM*`, `/dev/ttyUSB*`) is accessible without `root`.

### 2.2 Run

Open a terminal in the unzipped folder and run:

```bash
./bitbloq.sh
```

or just double-click `Bitbloq`. The `bitbloq.sh` script sets the environment
variables needed on modern distributions (`NO_AT_BRIDGE=1`, no forced old
`pango`) so the interface renders correctly.

### 2.3 Install from the `.deb` package (recommended on Debian/Ubuntu)

Download `bitbloq_x.y_amd64.deb` and install it:

```bash
sudo dpkg -i bitbloq_x.y_amd64.deb
sudo apt-get install -f   # only if dpkg reports missing dependencies
```

This installs the app under `/opt/bitbloq-offline` and a launcher at
`/usr/bin/bitbloq-offline`. After that you can start it from the applications
menu or by running `bitbloq-offline` in a terminal. arduino-cli must be
installed separately (see section 4).

To remove it:

```bash
sudo dpkg -r bitbloq-offline
```

### 2.4 Run from the AppImage

The AppImage is a single self-contained file — no installation needed:

```bash
chmod +x BitbloqOffline-x.y.AppImage
./BitbloqOffline-x.y.AppImage
```

It needs FUSE to mount itself; on a normal desktop that is already available.

### 2.5 Give your user access to the board (serial port)

If the board is not detected when you plug it in, add your user to the
`dialout` group and log out/in (or reboot):

```bash
sudo adduser "$USER" dialout
```

Then unplug and replug the board. No extra USB drivers are needed on Linux.

> **Note:** `libusb` is **not** required and is not shipped by this app. Board
> communication on Linux goes through the kernel + `udev` (serial port). The
> compilation backend is arduino-cli, installed separately (see section 4).

---

## 3. Install on Windows

Tested on **Windows 10** (also works on Windows 7 and newer, 32-bit or 64-bit).

### 3.1 Requirements

- Windows 7 or newer (32-bit or 64-bit). ARM editions of Windows are **not**
  supported.
- **arduino-cli** installed and on the `PATH`, with the `arduino:avr` core — this
  is the compilation backend and is **mandatory** (see section 4). It is the only
  external requirement.
- The correct board USB driver (see section 3.4). Modern Windows installs most
  of them automatically; when you first flash a program, Windows may ask for
  administrator rights to install a driver — allow it.

### 3.2 Install Bitbloq Offline

**Option A — Setup executable (recommended).** Download
`bitbloq-offline-setup-x.y.exe` and double-click it. The installer:

- installs Bitbloq in `C:\Program Files\BitbloqOffline`,
- creates **Start Menu** and **Desktop** shortcuts,
- adds an **Uninstall** entry in the Start Menu and in *Programs and Features*.

**Option B — Portable zip.** Download `bitbloq-offline-windows-x.y.zip`,
unzip it anywhere (no administrator rights needed) and double-click
`Bitbloq.exe`.

In both cases, on first launch Windows may show a SmartScreen / "unknown
publisher" warning — choose **More info → Run anyway** (the app is not
code-signed).

### 3.3 Install arduino-cli (mandatory)

Bitbloq Offline compiles and uploads by itself using **arduino-cli**; without it
compilation fails with a "command not found"-type error. Full details are in
section 4, but the short version for Windows is:

1. Download `arduino-cli` for Windows from the
   [arduino-cli releases](https://github.com/arduino/arduino-cli/releases).
2. Put `arduino-cli.exe` in a folder that is on your `PATH` (or add its folder to
   the `PATH`). Alternatively, set the `ARDUINO_CLI` environment variable to the
   absolute path of `arduino-cli.exe` before launching Bitbloq.
3. Install the AVR core and verify:
   ```
   arduino-cli core install arduino:avr
   arduino-cli version
   arduino-cli board list
   ```

### 3.4 Board drivers

Bitbloq Offline **no longer bundles** board USB drivers. On modern Windows
(10/11) the required serial drivers are provided automatically via Windows
Update or by the platform packages that **arduino-cli** installs
(`arduino-cli core install arduino:avr`), so most boards are recognized as soon
as you plug them in.

If a board is still not detected (it does not appear in Bitbloq or in
`arduino-cli board list`), install the driver for its USB-serial chip from the
manufacturer:

| Board / chip | Official driver |
|--------------|-----------------|
| Boards with **Silicon Labs CP210x** (many mBot, BQ ZUM) | [Silicon Labs CP210x VCP](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers) |
| Boards with **FTDI FT232** | [FTDI VCP](https://ftdichip.com/drivers/vcp-drivers/) |
| Clones with **WCH CH340/CH341** (cheap Uno/Nano clones) | [WCH CH340](https://www.wch-ic.com/downloads/CH341SER_EXE.html) |
| Genuine **Arduino** boards | installed by the Arduino AVR core / Windows Update |

Download the installer for your chip, run it (accept the admin prompt), then
unplug and replug the board.

---

## 4. arduino-cli: the compilation backend (new in v2.0.0)

Since **v2.0.0** Bitbloq Offline compiles and uploads programs by itself using
[arduino-cli](https://arduino.github.io/arduino-cli/). The Electron main process
starts a local WebSocket service (`localCompilerServer.js` on
`127.0.0.1:9877`) that talks to arduino-cli. **No separate Web2Board install is
required.**

### 4.1 Install arduino-cli

- **Linux / macOS:**
  ```bash
  # one of:
  curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
  # or via the packaged release from GitHub, then put it on your PATH
  arduino-cli core install arduino:avr
  ```
- **Windows:** download `arduino-cli` from the
  [arduino-cli releases](https://github.com/arduino/arduino-cli/releases) and put
  `arduino-cli.exe` on your `PATH`; then run `arduino-cli core install arduino:avr`.

Verify it works:

```bash
arduino-cli version
arduino-cli board list
```

The Bitbloq Arduino libraries (for Zowi, etc.) are bundled inside the app under
`resources/app/res/libs/v1_1_3` and passed to arduino-cli automatically, so
`#include <BitbloqZowi.h>` and friends compile out of the box.

### 4.2 Using a custom arduino-cli binary

If `arduino-cli` is not on the `PATH`, set the `ARDUINO_CLI` environment variable
to its absolute path before launching Bitbloq Offline:

```bash
ARDUINO_CLI=/ruta/a/arduino-cli bitbloq-offline
```

---

## 5. How compilation/upload works

When you flash/upload a program, Bitbloq connects to its own local service on
`127.0.0.1:9877` (started automatically by the app) which:

1. Checks the board is connected (via `arduino-cli board list`).
2. Compiles with `arduino-cli compile --fqbn <board> --libraries <bitbloq-libs> ...`.
3. Uploads with `arduino-cli upload -b <board> -p <port> ...`.

This is automatic — you do not configure anything. If you need to debug, see the
logs in section 7.

If compilation/upload fails, check the following:

1. **Is arduino-cli installed and on the PATH?** Run `arduino-cli version`. If
   the command is not found, install it (section 4.1) or set `ARDUINO_CLI`.
2. **Is the AVR core installed?** `arduino-cli core list` should show
   `arduino:avr`. If not, `arduino-cli core install arduino:avr`.
3. **Firewall.** Local loopback connections to `127.0.0.1:9877` must be allowed
   (they are, by default).
4. **Board not detected?** That is a *serial port* permission problem:
    - Linux: add your user to `dialout` (see §2.5).
    - Windows: install the board's USB-serial driver (see §3.4).

---

## 6. Quick troubleshooting table

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App does not start (Linux) | missing libs / old pango | use `./bitbloq.sh`; ensure a modern distro |
| Compile fails / "command not found" | arduino-cli missing or not on PATH | install arduino-cli; see §4.1; or set `ARDUINO_CLI` |
| Port 9877 closed | local compiler service not running | it is started by the app; if blocked, check firewall for loopback |
| "arduino:avr not found" | AVR core not installed | `arduino-cli core install arduino:avr` |
| Board not listed | no serial permission | Linux: add user to `dialout`; Windows: install drivers |
| Upload fails / board unrecognized | wrong board selected or driver missing | select correct board in Bitbloq; install drivers |

---

## 7. Logs (when something goes wrong)

The most useful diagnostics are in the Bitbloq Offline log, written by the app
itself:

- `~/.config/bitbloq-offline/logs/bitbloq-offline.log` (Linux) /
  `%APPDATA%\bitbloq-offline\logs\bitbloq-offline.log` (Windows).

It records arduino-cli compile/upload errors and the WebSocket traffic with the
local compiler service on `127.0.0.1:9877`.

For low-level arduino-cli output, run `arduino-cli` from a terminal with
`--verbose` or increase its logging; Bitbloq passes arduino-cli's stderr through
to the app log.

**To open them from the UI:** in the top menu, go to **Ver → Abrir carpeta de
logs** ("Open logs folder"). This opens the logs folder in your file manager so
you can inspect `bitbloq-offline.log`.

If a toast error appears without enough detail, use its **Copiar** button to
copy the message and paste it when asking for support.

---

## 8. Where things live (reference)

```
BitbloqOffline<OS>/
├── Bitbloq / Bitbloq.exe     # the app
├── bitbloq.sh                # Linux launcher
├── zowi_samples/             # example projects at the build root
└── resources/app/app/res/libs/v1_1_3/   # Bitbloq Arduino libraries (bundled)
```

The compilation backend is **arduino-cli**, installed on the system (see section
4). Bitbloq starts its own local service (`localCompilerServer.js`) on port
`127.0.0.1:9877` when the app launches, so no separate download is needed.
