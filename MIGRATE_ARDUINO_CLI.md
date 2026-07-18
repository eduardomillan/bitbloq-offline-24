# Plan: Replace Web2board (PlatformIO) with arduino-cli in Bitbloq Offline

## Context

Bitbloq Offline compiles and uploads code to Arduino boards through **Web2board**, an
external Python app that runs as a child process and listens on `ws://127.0.0.1:9877`.
Web2board uses **PlatformIO 2.6.3** (2015), whose registry API
(`http://api.platformio.org`) no longer exists → `[API] Not Found` error when trying to
download packages.

Agreed decision: **implement the layer inside Bitbloq Offline** (do not modify the
Web2board repo). We replace Web2board's Python WebSocket server with a **local WebSocket
service in the Electron main process** that uses `arduino-cli` (already installed,
v1.5.1, core `arduino:avr` 1.8.8) to compile/upload, and `arduino-cli monitor` for the
serial monitor.

Key advantage: the frontend (AngularJS) already speaks the **WS-Hubs** protocol
(`WSHubsApi.js`). If the new service implements the same hubs (`CodeHub`,
`SerialMonitorHub`, `WindowHub`, `UtilsAPIHub`) with the same serialization,
`web2board.js` and `plotter.js` **change minimally**.

---

## Target architecture

```
 Bitbloq Offline (renderer, AngularJS)
   │  api.CodeHub.server.compile(code)   ← UNCHANGED (WSHubsApi.js)
   │  api.SerialMonitorHub.server.*      ← UNCHANGED
   ▼
 WebSocket ws://127.0.0.1:9877  (existing WS-Hubs protocol)
   │
 main.js (Electron main process)  ← NEW: WS server + arduino-cli
   ├── CodeHub.compile / upload   → spawn arduino-cli compile/upload
   ├── SerialMonitorHub.*         → spawn arduino-cli monitor
   ├── WindowHub.showApp          → no longer opens anything (noop or log)
   └── UtilsAPIHub.setId          → ack
```

---

## Implementation steps

### 1. WebSocket server in `main.js`
- Add `require('ws')` and create `new WebSocket.Server({ port: 9877 })` at startup.
- Keep the `45s` timeout that `WSHubsApi.construct(url, 45)` expects.
- WS-Hubs message router: parse `{hub, function (snake_case), args, ID}`, dispatch to the
  handler, respond `{ID, result}` / `{ID, error}`.
  Server→client pushes use `{hub, function, args}` (see `WSHubsApi.js:104-116`).

### 2. `CodeHub` hub (compile / upload / uploadHex)
- **compile(code)**: write `code` to `<tmp>/sketch/<name>.ino`, run
  `arduino-cli compile --fqbn <FQBN> --build-path <tmp>/build <tmp>/sketch`.
  Return `{success, {out, err}}`.
- **upload(code, board)**: `compile` then
  `arduino-cli upload -b <FQBN> -p <port> --input-dir <tmp>/build <tmp>/sketch`.
- **uploadHex(hexText, board)**: write the hex and upload with `--input-file`.
- Push `isCompiling()` / `isUploading(port)` during the process.

### 3. `SerialMonitorHub` hub
- **findBoardPort(mcu)**: `arduino-cli board list` or list `/dev/tty*`.
- **startConnection(port, baudrate)**: `arduino-cli monitor -p <port> -c <baud>`,
  forward each line as a `SerialMonitorHub.client.received(port, data)` push.
- **write / changeBaudrate / closeConnection**: proxy to the serial process.

### 4. `WindowHub` hub
- `showApp()` → noop (there is no longer a Web2board window).

### 5. `UtilsAPIHub` hub
- `setId("Bitbloq")` → ack; `getId()` → return the id.

### 6. Board → FQBN mapping
| Client token | arduino-cli FQBN |
|---|---|
| `uno` | `arduino:avr:uno` |
| `nano` | `arduino:avr:nano` |
| `mega` | `arduino:avr:mega` |
| `diemilanove` | `arduino:avr:diecimila` |
| `bt328` | `arduino:avr:uno` |

### 7. Minimal frontend changes
- **`web2board.js`**: remove `startWeb2board()` / `launchWeb2board()` (186-265, 298) and
  the `LD_LIBRARY_PATH` / `libtinfo` logic. The `wsPort` stays 9877.
- **`WSHubsApi.js` / `plotter.js`**: no changes.

### 8. Dependencies
- `ws` is already in `package.json`. Use `arduino-cli monitor` (no need to add
  `serialport`).

---

## Files to create / modify
| File | Action |
|---|---|
| `main.js` | WS server + hub handlers + spawn arduino-cli |
| `app/scripts/factories/web2board.js` | Remove Web2board Python spawn |
| `app/scripts/factories/web2boardLocator.js` | Simplify / mark obsolete |
| `app/scripts/WSHubsApi.js` | No changes |
| `app/scripts/controllers/plotter.js` | No changes |
| `MIGRATE_ARDUINO_CLI.md` | This document |

---

## Verification (end-to-end)
1. `npm start` → Bitbloq starts, `main.js` brings up the WS on 9877.
2. Verify Uno → "code verified" (no `[API] Not Found`).
3. Upload to board → it uploads and blinks.
4. Serial monitor / Plotter → live data.
5. `userData/logs/bitbloq-offline.log` without WS/compile errors.

## Risks / notes
- `arduino-cli` must be on the Electron process's PATH.
- Write sketch to tmp per request to avoid race conditions.
- `get_hex_data` (return the .hex to the client) can be implemented by reading
  `<build>/<name>.ino.hex`.
