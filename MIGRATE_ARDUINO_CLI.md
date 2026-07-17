# Plan: Reemplazar Web2board (PlatformIO) con arduino-cli en Bitbloq Offline

## Contexto

Bitbloq Offline compila y sube código a placas Arduino a través de **Web2board**, una
app Python externa que corre como proceso hijo y escucha en `ws://127.0.0.1:9877`.
Web2board usa **PlatformIO 2.6.3** (2015), cuya API de registro (`http://api.platformio.org`)
ya no existe → error `[API] Not Found` al intentar descargar paquetes.

Decisión acordada: **implementar la capa en Bitbloq Offline** (no modificar el repo de
Web2board). Reemplazamos el servidor WebSocket de Web2board Python por un **servicio
WebSocket local en el proceso principal de Electron** que usa `arduino-cli` (ya instalado,
v1.5.1, core `arduino:avr` 1.8.8) para compilar/subir, y `arduino-cli monitor` para el
monitor serie.

Ventaja clave: el frontend (AngularJS) ya habla el protocolo **WS-Hubs** (`WSHubsApi.js`).
Si el nuevo servicio implementa los mismos hubs (`CodeHub`, `SerialMonitorHub`,
`WindowHub`, `UtilsAPIHub`) con la misma serialización, `web2board.js` y `plotter.js`
**cambian mínimo**.

---

## Arquitectura objetivo

```
 Bitbloq Offline (renderer, AngularJS)
   │  api.CodeHub.server.compile(code)   ← SIN CAMBIOS (WSHubsApi.js)
   │  api.SerialMonitorHub.server.*      ← SIN CAMBIOS
   ▼
 WebSocket ws://127.0.0.1:9877  (protocolo WS-Hubs existente)
   │
 main.js (Electron main process)  ← NUEVO: servidor WS + arduino-cli
   ├── CodeHub.compile / upload   → spawn arduino-cli compile/upload
   ├── SerialMonitorHub.*         → spawn arduino-cli monitor
   ├── WindowHub.showApp          → ya no abre nada (noop o log)
   └── UtilsAPIHub.setId          → ack
```

---

## Pasos de implementación

### 1. Servidor WebSocket en `main.js`
- Añadir `require('ws')` y crear `new WebSocket.Server({ port: 9877 })` en el arranque.
- Mantener el `45s` de timeout que espera `WSHubsApi.construct(url, 45)`.
- Router de mensajes WS-Hubs: parsear `{hub, function (snake_case), args, ID}`,
  despachar al handler, responder `{ID, result}` / `{ID, error}`.
  Pushes servidor→cliente con `{hub, function, args}` (ver `WSHubsApi.js:104-116`).

### 2. Hub `CodeHub` (compile / upload / uploadHex)
- **compile(code)**: escribir `code` a `<tmp>/sketch/<name>.ino`, ejecutar
  `arduino-cli compile --fqbn <FQBN> --build-path <tmp>/build <tmp>/sketch`.
  Devolver `{success, {out, err}}`.
- **upload(code, board)**: `compile` + luego
  `arduino-cli upload -b <FQBN> -p <port> --input-dir <tmp>/build <tmp>/sketch`.
- **uploadHex(hexText, board)**: escribir hex y subir con `--input-file`.
- Pushes `isCompiling()` / `isUploading(port)` durante el proceso.

### 3. Hub `SerialMonitorHub`
- **findBoardPort(mcu)**: `arduino-cli board list` o listar `/dev/tty*`.
- **startConnection(port, baudrate)**: `arduino-cli monitor -p <port> -c <baud>`,
  reenviar cada línea como push `SerialMonitorHub.client.received(port, data)`.
- **write / changeBaudrate / closeConnection**: proxy al proceso serie.

### 4. Hub `WindowHub`
- `showApp()` → noop (ya no hay ventana de Web2board).

### 5. Hub `UtilsAPIHub`
- `setId("Bitbloq")` → ack; `getId()` → devolver id.

### 6. Mapeo de boards → FQBN
| Token cliente | FQBN arduino-cli |
|---|---|
| `uno` | `arduino:avr:uno` |
| `nano` | `arduino:avr:nano` |
| `mega` | `arduino:avr:mega` |
| `diemilanove` | `arduino:avr:diecimila` |
| `bt328` | `arduino:avr:uno` |

### 7. Cambios mínimos en el frontend
- **`web2board.js`**: quitar `startWeb2board()` / `launchWeb2board()` (186-265, 298) y
  la lógica de `LD_LIBRARY_PATH` / `libtinfo`. El `wsPort` sigue siendo 9877.
- **`WSHubsApi.js` / `plotter.js`**: sin cambios.

### 8. Dependencias
- `ws` ya está en `package.json`. Usar `arduino-cli monitor` (sin añadir `serialport`).

---

## Archivos a crear / modificar
| Archivo | Acción |
|---|---|
| `main.js` | Servidor WS + handlers de hubs + spawn arduino-cli |
| `app/scripts/factories/web2board.js` | Quitar spawn de Web2board Python |
| `app/scripts/factories/web2boardLocator.js` | Simplificar / marcar obsoleto |
| `app/scripts/WSHubsApi.js` | Sin cambios |
| `app/scripts/controllers/plotter.js` | Sin cambios |
| `MIGRATE_ARDUINO_CLI.md` | Este documento |

---

## Verificación (end-to-end)
1. `npm start` → Bitbloq arranca, `main.js` levanta WS en 9877.
2. Verificar Uno → "código verificado" (sin `[API] Not Found`).
3. Cargar a placa → sube y parpadea.
4. Monitor serie / Plotter → datos en vivo.
5. `userData/logs/bitbloq-offline.log` sin errores de WS/compile.

## Riesgos / notas
- `arduino-cli` debe estar en el PATH del proceso Electron.
- Sketch a tmp por petición para evitar condiciones de carrera.
- `get_hex_data` (devolver .hex al cliente) se puede implementar leyendo
  `<build>/<name>.ino.hex`.
