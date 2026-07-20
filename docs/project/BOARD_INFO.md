# Board detection and info with arduino-cli (Zowi)

Documentation of what information `arduino-cli` can obtain about the connected
board (Zowi), equivalent to what Arduino IDE shows.

## Test environment

- `arduino-cli` Version: 1.5.1 (Commit `01f3d4f2b`, 2026-06-05)
- Board: Zowi (ATmega328, CP210x USB-to-serial chip from Silicon Labs)

## Commands equivalent to Arduino IDE

### 1. Detect connected port and board (port selector)

```
arduino-cli board list
```

Shows: Port, Protocol, Type, Board name, FQBN and Core.

JSON format (useful for integrating over WS, as `localCompilerServer.js` does):

```
arduino-cli board list --format json
```

### 2. View board details / info ("Get Board Info")

```
arduino-cli board details -b arduino:avr:uno
arduino-cli board details -b arduino:avr:uno --format json
```

### 3. List all boards supported by a core

```
arduino-cli board listall
```

## Results with the Zowi connected

### `arduino-cli board list`

```
Port         Protocol  Type              Board Name FQBN Core
/dev/ttyS0   serial    Serial Port       Unknown
/dev/ttyS1   serial    Serial Port       Unknown
/dev/ttyS4   serial    Serial Port       Unknown
/dev/ttyUSB0 serial    Serial Port (USB) Unknown
```

### `arduino-cli board list --format json` (Zowi port)

```json
{
  "port": {
    "address": "/dev/ttyUSB0",
    "label": "/dev/ttyUSB0",
    "protocol": "serial",
    "protocol_label": "Serial Port (USB)",
    "properties": {
      "pid": "0xEA60",
      "serialNumber": "00E3596A",
      "vid": "0x10C4"
    },
    "hardware_id": "00E3596A"
  }
}
```

Zowi's USB-to-serial chip is a **Silicon Labs CP210x** (VID `0x10C4`,
PID `0xEA60`).

### `arduino-cli board details -b arduino:avr:uno`

```
Board name:                Arduino UNO
FQBN:                      arduino:avr:uno
Board version:             1.8.8
Official Arduino board:    ✔

Identification properties: pid=0x0043 vid=0x2341
                           pid=0x0001 vid=0x2341
                           pid=0x0043 vid=0x2A03
                           pid=0x0243 vid=0x2341
                           pid=0x006A vid=0x2341
                           board=uno

Package name:              arduino
Platform name:             Arduino AVR Boards
Platform architecture:     avr

Required tool: arduino:arduinoOTA     1.3.0
Required tool: arduino:avr-gcc        7.3.0-atmel3.6.1-arduino7
Required tool: arduino:avrdude        8.0.0-arduino1
```

## Conclusions

- **Port**: reliably detected (`/dev/ttyUSB0`), including VID/PID and serial
  number.
- **Board info**: fully shown with `board details` (same as the IDE's
  "Get Board Info").
- **Board type (auto-detection)**: **does not work automatically**.
  `board list` reports `Unknown` and `arduino-cli board search 10C4:EA60` returns
  nothing, because the CP210x chip (VID `0x10C4`) is not registered with any FQBN.
  The official UNO is identified by VID `0x2341` / `0x2A03`.

In other words: arduino-cli provides port + detailed info like the IDE, but the
**Zowi FQBN must be assigned manually** (the *board token → FQBN* mapping that
already exists in `localCompilerServer.js`), because there is no automatic
identification via VID/PID.
