# Installation guide

This document explains how to install **Bitbloq Offline** on Linux and Windows,
how Web2Board is installed, and how to make Bitbloq and Web2Board talk to each
other so you can compile and upload programs to your board (Arduino, Zowi,
PrintBot, etc.).

> **Versions covered:** Bitbloq Offline `1.3.0-rc.1` and the separate
> Web2Board `2.1.3`. These two versions are matched: do not mix other versions
> unless you know what you are doing.

---

## 1. Download

Get the build for your platform from the
[Releases page](https://github.com/eduardomillan/bitbloq-offline-24/releases):

| Platform | File |
|----------|------|
| Linux (64-bit) | `bitbloq-offline-linux-1.3.0-rc.1.zip` |
| Windows (64/32-bit) | `bitbloq-offline-windows-1.3.0-rc.1.zip` |

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

### 2.3 Give your user access to the board (serial port)

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

### 3.2 Run

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

There are two ways Web2Board gets installed, and **you normally do not have to
do anything** — Bitbloq handles it:

1. **Bundled (default full build).** Web2Board is already inside the app at
   `resources/app/app/res/web2board/<platform>/web2boardLauncher`. Bitbloq
   starts it automatically on launch. This is the recommended setup.

2. **Downloaded on demand (slim build).** If you used a "slim" build (no
   bundled Web2Board), the first time you flash a program Bitbloq downloads the
   correct Web2Board package for your platform from the GitHub release, verifies
   its SHA-256 checksum (see `web2board-download.json`), and runs it. An
   internet connection is needed only for this one-time download.

### 4.1 Manual Web2Board install (advanced)

You only need this if you want to run Web2Board standalone or repair it.
Download the matching zip from the release:

- Linux 64-bit: `web2board-linux-x64-2.1.3.zip`
- Windows: `web2board-win32-2.1.3.zip`

Unzip it and run `web2boardLauncher` (Linux) or `web2boardLauncher.exe`
(Windows). It will listen on port `9877`.

---

## 5. Make Bitbloq and Web2Board communicate

In the normal workflow **this is automatic**: when Bitbloq starts, it launches
Web2Board and connects to `ws://127.0.0.1:9877`. You do not need to configure
anything.

If they are not communicating, check the following:

1. **Is Web2Board running?**
   - Linux: `ps aux | grep web2boardLauncher`
   - Windows: look for `web2boardLauncher.exe` in Task Manager.
   - Or test the port directly:
     ```bash
     # Linux / macOS
     (exec 3<>/dev/tcp/127.0.0.1/9877) && echo "Web2Board port open" || echo "port closed"
     ```
     On Windows use a port-checker or `Test-NetConnection 127.0.0.1 -Port 9877`
     in PowerShell.

2. **Restart Web2Board from Bitbloq.** In Bitbloq, go to the board/connection
   area and choose to restart or reconnect Web2Board. Bitbloq will relaunch it.

3. **Firewall.** Make sure your firewall allows local connections to `127.0.0.1`
   on port `9877`. This is loopback (your own machine), so it should be allowed
   by default; if you use a strict firewall, allow the `Bitbloq` / `web2board`
   executables for local communication.

4. **Reinstall / redownload Web2Board.** If the bundled or downloaded Web2Board
   is missing or corrupted, delete the downloaded copy
   (`~/.config/bitbloq-offline/web2board/` on Linux, or the app's user-data
   folder on Windows) and let Bitbloq fetch it again (slim build) or
   reinstall the full build.

5. **Board not detected even though Web2Board is up?** That is a *serial port*
   permission problem, not a Web2Board/Bitbloq link problem:
   - Linux: add your user to `dialout` (see §2.3).
   - Windows: install the board drivers (see §3.3).

---

## 6. Quick troubleshooting table

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| App does not start (Linux) | missing libs / old pango | use `./bitbloq.sh`; ensure a modern distro |
| "Web2Board not found" | slim build, no download yet / offline | connect to internet once, or use full build |
| Port 9877 closed | Web2Board not running | restart from Bitbloq; check §5.1 |
| Board not listed | no serial permission | Linux: add user to `dialout`; Windows: install drivers |
| Upload fails / board unrecognized | wrong board selected or driver missing | select correct board in Bitbloq; install drivers |

---

## 7. Where things live (reference)

```
BitbloqOffline<OS>/
├── Bitbloq / Bitbloq.exe     # the app
├── bitbloq.sh                # Linux launcher
├── zowi_samples/             # example projects at the build root
├── drivers/                  # Windows board drivers
└── resources/app/app/res/web2board/<platform>/   # bundled Web2Board (full build)
```

Web2Board download descriptor: `resources/app/app/res/web2board-download.json`
(records the version, release tag, per-platform file and SHA-256).
