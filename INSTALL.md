# Installation guide

This document explains how to install **Bitbloq Offline** on Linux and Windows,
and how to compile and upload programs to your board (Arduino, Zowi, PrintBot,
etc.).

> **Versions covered:** Bitbloq Offline `2.0.0`. Starting from this version
> Bitbloq Offline is **self-contained**: it compiles and uploads by itself using
> **arduino-cli** and no longer needs the separate Web2Board project. See
> [`MIGRATE_ARDUINO_CLI.md`](MIGRATE_ARDUINO_CLI.md).

---

## 1. Download

Get the build for your platform from the
[Releases page](https://github.com/eduardomillan/bitbloq-offline-24/releases):

| Platform | File |
|----------|------|
| Linux (64-bit) | `bitbloq-offline-linux-2.0.0.zip` |
| Windows (64/32-bit) | `bitbloq-offline-windows-2.0.0.zip` |

In addition to the zips, the following **native installers** are published for
this release:

| Format | Bitbloq Offline |
|--------|-----------------|
| Linux `.deb` | `bitbloq_2.0.0_amd64.deb` |
| Linux AppImage | `BitbloqOffline-2.0.0.AppImage` |
| Windows installer | `bitbloq-offline-setup-2.0.0.exe` |

- **Bitbloq `.deb`** installs to `/opt/bitbloq-offline` and adds
  `/usr/bin/bitbloq-offline` plus a menu entry.
- **arduino-cli** must be installed on the system (see section 4) — it is the
  compilation backend used since v2.0.0.
- The **Windows installer** puts Bitbloq in `C:\Program Files\BitbloqOffline`,
  creates Start Menu and Desktop shortcuts, and leaves the board drivers in the
  `drivers\` folder for manual install.

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

Download `bitbloq_2.0.0_amd64.deb` and install it:

```bash
sudo dpkg -i bitbloq_2.0.0_amd64.deb
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
chmod +x BitbloqOffline-2.0.0.AppImage
./BitbloqOffline-2.0.0.AppImage
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

### 3.1 Requirements

- Windows 7 or newer (32-bit or 64-bit).
- When you first flash a program, Windows may ask for administrator rights to
  install the board drivers. Allow it.

### 3.2 Install from the setup executable (recommended)

Download `bitbloq-offline-setup-2.0.0.exe` and double-click it. The
installer:

- installs Bitbloq in `C:\Program Files\BitbloqOffline`,
- creates **Start Menu** and **Desktop** shortcuts,
- leaves the board drivers in the `drivers\` folder (install them if the board
  is not detected),
- adds an **Uninstall** entry in the Start Menu and in *Programs and Features*.

On first launch Windows may show a SmartScreen / "unknown publisher" warning —
choose **Run anyway** (the app is not code-signed).

### 3.3 Run from the zip (portable)

Unzip the file and double-click `Bitbloq.exe`. On first launch Windows might
show a SmartScreen / "unknown publisher" warning — choose **Run anyway**
(the app is not code-signed).

### 3.3 Board drivers

If your board is not detected, install the drivers that ship with the app:

```
BitbloqOfflineWin/
└── drivers/        # Windows .inf drivers for the boards
```

Right-click the appropriate `.inf` file → **Install**, or let Windows install
the driver automatically when you plug the board in.

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
    - Windows: install the board drivers (see §3.3).

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
├── drivers/                  # Windows board drivers
└── resources/app/app/res/libs/v1_1_3/   # Bitbloq Arduino libraries (bundled)
```

The compilation backend is **arduino-cli**, installed on the system (see section
4). Bitbloq starts its own local service (`localCompilerServer.js`) on port
`127.0.0.1:9877` when the app launches, so no separate download is needed.
