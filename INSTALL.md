# Installation guide

This document explains how to install **Bitbloq Offline** on Linux and Windows,
how Web2Board is installed, and how to make Bitbloq and Web2Board talk to each
other so you can compile and upload programs to your board (Arduino, Zowi,
PrintBot, etc.).

> **Versions covered:** Bitbloq Offline `1.4.0`. Web2Board `3.1.0` is a
> **separate** project (https://github.com/eduardomillan/web2board) and is
> **not** downloaded by Bitbloq — you must install it yourself.

---

## 1. Download

Get the build for your platform from the
[Releases page](https://github.com/eduardomillan/bitbloq-offline-24/releases):

| Platform | File |
|----------|------|
| Linux (64-bit) | `bitbloq-offline-linux-1.4.0.zip` |
| Windows (64/32-bit) | `bitbloq-offline-windows-1.4.0.zip` |

In addition to the zips, the following **native installers** are published for
this release:

| Format | Bitbloq Offline |
|--------|-----------------|
| Linux `.deb` | `bitbloq_1.4.0_amd64.deb` |
| Linux AppImage | `BitbloqOffline-1.4.0.AppImage` |
| Windows installer | `bitbloq-offline-setup-1.4.0.exe` |

- **Bitbloq `.deb`** installs to `/opt/bitbloq-offline` and adds
  `/usr/bin/bitbloq-offline` plus a menu entry. Web2Board is **not** bundled;
  you must install it separately (see section 4).
- **Web2Board** is a separate project that must be installed on the system
  before Bitbloq can use it. Bitbloq searches for it in several locations
  (see section 4.1) and launches it automatically when needed.
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

Download `bitbloq_1.3.0-rc.1_amd64.deb` and install it:

```bash
sudo dpkg -i bitbloq_1.3.0-rc.1_amd64.deb
sudo apt-get install -f   # only if dpkg reports missing dependencies
```

This installs the app under `/opt/bitbloq-offline` and a launcher at
`/usr/bin/bitbloq-offline`. After that you can start it from the applications
menu or by running `bitbloq-offline` in a terminal. Web2Board must be installed
separately (see section 4).

To remove it:

```bash
sudo dpkg -r bitbloq-offline
```

### 2.4 Run from the AppImage

The AppImage is a single self-contained file — no installation needed:

```bash
chmod +x BitbloqOffline-1.4.0.AppImage
./BitbloqOffline-1.4.0.AppImage
```

It needs FUSE to mount itself; on a normal desktop that is already available.
Web2Board must be installed separately (see section 4).

### 2.5 Give your user access to the board (serial port)

If the board is not detected when you plug it in, add your user to the
`dialout` group and log out/in (or reboot):

```bash
sudo adduser "$USER" dialout
```

Then unplug and replug the board. No extra USB drivers are needed on Linux.

> **Note:** `libusb` is **not** required and is not shipped by this app. Board
> communication on Linux goes through the kernel + `udev` (serial port). If
> Web2Board (the flashing service) needs any of its own libraries, they are
> bundled inside Web2Board itself and used automatically.

---

## 3. Install on Windows

### 3.1 Requirements

- Windows 7 or newer (32-bit or 64-bit).
- When you first flash a program, Windows may ask for administrator rights to
  install the board drivers. Allow it.

### 3.2 Install from the setup executable (recommended)

Download `bitbloq-offline-setup-1.3.0-rc.1.exe` and double-click it. The
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

## 4. Web2Board: what it is and how it is installed

**Web2Board** is the background service that compiles your Bitbloq program and
uploads it to the board over USB. The Bitbloq app talks to Web2Board through a
local WebSocket on **`127.0.0.1:9877`**.

Web2Board is a **separate project** (https://github.com/eduardomillan/web2board)
and is **not downloaded by Bitbloq**. You must install it yourself on the system
and Bitbloq will look for it in the usual locations (see section 5). No Internet
connection is used by Bitbloq to obtain Web2Board.

> **You must install Web2Board yourself.** Bitbloq only *launches* and *talks to*
> an already installed Web2Board. If it cannot be found, Bitbloq shows a warning
> and offers to open the settings so you can point it at the install location.

### 4.1 Where to install Web2Board

Bitbloq searches for Web2Board (the `web2boardLauncher` / `web2boardLauncher.exe`
executable, or a folder containing it) in this order:

1. **A running Web2Board** on `127.0.0.1:9877` — if it is already started,
   Bitbloq just connects to it. This is the fastest path and requires no
   binary detection.
2. **The path configured in Bitbloq** (menu *Ver → Configurar Web2Board*). Use
   this when Web2Board is installed somewhere non-standard.
3. **`/opt/web2board`** (or `/opt`) on the system.
4. **The directory Bitbloq is executed from.**
5. **`<execution dir>/resources/web2board`** (or `<resourcesPath>/web2board`).
6. **The user-data folder** `~/.config/bitbloq-offline/web2board/` (Linux) /
   `%APPDATA%\bitbloq-offline\web2board\` (Windows), as a manual fallback.

If Web2Board is not found in any of these places, Bitbloq shows the warning
*“Web2Board no encontrado”* with a button to open the settings, where you can
enter its real path (a folder or the launcher executable). The path is saved in
`config.json` and reused on every launch.

---

## 5. Make Bitbloq and Web2Board communicate

In the normal workflow **this is automatic**: when you flash/upload a program,
Bitbloq first checks if Web2Board is already running on `127.0.0.1:9877` and
connects to it. If not, it searches for the Web2Board binary in the standard
locations (see section 4.1), launches it, and connects. You do not normally need
to configure anything — unless Web2Board is installed in a non-standard
location, in which case set its path from *Ver → Configurar Web2Board*.

If they are not communicating, check the following:

1. **Is Web2Board running?**
   - Linux: `ps aux | grep web2board`
   - Windows: look for `web2board.exe` in Task Manager.
   - Or test the port directly:
     ```bash
     # Linux / macOS
     (exec 3<>/dev/tcp/127.0.0.1/9877) && echo "Web2Board port open" || echo "port closed"
     ```
     On Windows use a port-checker or `Test-NetConnection 127.0.0.1 -Port 9877`
     in PowerShell.

2. **Restart Web2Board.** If Web2Board is running but not responding, kill it
   and start it manually, or let Bitbloq relaunch it on the next operation.

3. **Firewall.** Make sure your firewall allows local connections to `127.0.0.1`
   on port `9877`. This is loopback (your own machine), so it should be allowed
   by default; if you use a strict firewall, allow the `Bitbloq` / `web2board`
   executables for local communication.

4. **Reinstall Web2Board.** If Web2Board is missing or corrupted,
   reinstall it from the official release
   (https://github.com/eduardomillan/web2board) and place it in a standard
   location (see §4.1) or configure the path in *Ver → Configurar Web2Board*.

5. **Board not detected even though Web2Board is up?** That is a *serial port*
   permission problem, not a Web2Board/Bitbloq link problem:
   - Linux: add your user to `dialout` (see §2.5).
   - Windows: install the board drivers (see §3.3).

---

## 6. Quick troubleshooting table

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App does not start (Linux) | missing libs / old pango | use `./bitbloq.sh`; ensure a modern distro |
| "Web2Board not found" | Web2Board not installed or path wrong | install Web2Board; check §4.1; use *Ver → Configurar Web2Board* |
| Port 9877 closed | Web2Board not running | start Web2Board manually or let Bitbloq launch it; check §5 |
| Board not listed | no serial permission | Linux: add user to `dialout`; Windows: install drivers |
| Upload fails / board unrecognized | wrong board selected or driver missing | select correct board in Bitbloq; install drivers |

---

## 7. Logs (when something goes wrong)

When Web2Board cannot be reached (e.g. "board not found", port 9877 closed),
the most useful diagnostics are in two log files:

- **Bitbloq Offline log** — written by the app itself:
  `~/.config/bitbloq-offline/logs/bitbloq-offline.log` (Linux) /
  `%APPDATA%\bitbloq-offline\logs\bitbloq-offline.log` (Windows).
  It records WebSocket/compile/upload errors and the `W2B_NOT_FOUND` event.
- **Web2Board log** — written by the Web2Board process itself:
  `<web2board-dir>/info.log` (where `<web2board-dir>` is the folder containing
  the Web2Board binary).

**To open them from the UI:** in the top menu, go to **Ver → Abrir carpeta de
logs** ("Open logs folder"). This opens the logs folder in your file manager so
you can inspect `bitbloq-offline.log`. If Web2Board is not starting, check its
`info.log` in the Web2Board directory for errors (missing libraries,
`LD_LIBRARY_PATH`, etc.).

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
└── resources/app/app/res/   # Web2Board is NOT bundled; install it separately
```

Web2Board is **not** bundled inside the app. You must install it separately
(see section 4) and Bitbloq will locate it by checking for a running instance
on port 9877 first, then searching the standard paths or the path you configure
in *Ver → Configurar Web2Board*. It does **not** download Web2Board from the
Internet.
