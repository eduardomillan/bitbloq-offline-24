# Dialogs vs Toasts

Bitbloq Offline shows user feedback through two mechanisms:

- **Toasts** — transient (or persistent) notifications via `alertsService.add(...)`,
  rendered by `AlertsCtrl` / `views/components/alerts.html`.
- **Dialogs** — modal windows via `errorDialogs.showErrorDialog(...)` introduced during
  the `toast-to-dialogs` branch (commit `9625f21`), rendered by
  `views/modals/error-detail.html`. They require an explicit **Aceptar** (Accept) click
  and optionally offer a **Copiar** (Copy) button to copy the full error text for support.

This document records which messages remain toasts and which were migrated to dialogs so
the non-obvious mapping is not lost.

## Toasts (not migrated)

These use `alertsService.add(...)`. The 5th argument (`duration`) is the timeout in
milliseconds; `undefined`/omitted means the toast stays until dismissed (but these were
left as toasts intentionally, not converted to dialogs).

### With timeout (auto-dismiss)

| i18n key / content | Type | Timeout | Where |
|--------------------|------|---------|-------|
| `bigger-bloqs-version-detected` | warning | 5000 ms | `actionBar.js:158` (opening a newer-version project) |
| `offline-new-version-available` | info | 5000 ms | `actionBar.js:161` (project from newer app version) |
| `make-code-clipboard` | ok | 3000 ms | `actionBar.js:185` (code copied to clipboard) |
| `make-saved-project` | ok | 3000 ms | `projectApi.js:54`, `bloqsProject.js:319`, `bloqsProject.js:330` (project saved) |
| `alert-web2board-compile-verified` | ok | 5000 ms | `web2board.js:341` (compile/verify succeeded) |
| `alert-web2board-code-uploaded` | ok | 5000 ms | `web2board.js:360`, `web2board.js:395` (upload succeeded) |
| `web2board_toast_successfullyOpened` | ok | 3000 ms | `web2board.js:404` (app opened) |

### Persistent / loading toasts (no auto-dismiss)

| i18n key / content | Type | Where |
|--------------------|------|-------|
| `alert-open-logs-failed` | warning | `actionBar.js:216`, `actionBar.js:227` (could not open logs folder) |
| `bloqs-project_alert_no-board` | error | `hardwareTab.js:493` (no board selected) |
| `bloqs-project_alert_component_on_robot` | error | `hardwareTab.js:496` (component placed on robot) |
| `alert-web2board-not-found` | warning | `web2board.js:164` (arduino-cli / backend not found) — has a detail + copy button, **kept as toast** |
| `web2board_toast_startApp` | loading | `web2board.js:198` (starting backend) |
| `alert-web2board-compiling` | loading | `web2board.js:323` (compiling) |
| `alert-web2board-uploading` | loading | `web2board.js:327` (uploading, shows port) |
| `alert-web2board-settingBoard` | loading | `web2board.js:358`, `web2board.js:393` (setting board) |
| `alert-web2board-openSerialMonitor` | loading | `web2board.js:371` (opening serial monitor) |
| `web2board_toast_showingApp` | loading | `web2board.js:402` (showing app) |
| `alert-web2board-openPlotter` | loading | `web2board.js:413` (opening plotter) |

> Note: the persistent/loading toasts above are transient status messages (progress,
> success, info) that do not require user acknowledgement, so they were left as toasts.
> Only the *error* toasts that previously stayed on screen with a "Copiar" button were
> migrated to dialogs.

## Migrated dialogs (toast → modal)

All migrated dialogs go through `errorDialogs.showErrorDialog(...)` and use the
`views/modals/error-detail.html` template. They are invoked from `web2board.js` via two
helpers:

- `showErrorWithCopy(tag, error)` — shows the first line of the error as the message and
  offers a **Copiar** button that copies the complete error text.
- `showBoardErrorWithCopy(key, message)` — shows a localized i18n message and offers a
  **Copiar** button.

| # | Trigger / scenario | Call site | i18n key / content | Replaced toast |
|---|--------------------|-----------|--------------------|----------------|
| 1 | Upload compile error (`COMPILE_ERROR`) | `web2board.js:237` `showErrorWithCopy('UPLOAD', error.stdErr)` | message = first line of `stdErr`; copy = full `stdErr` | `alert-web2board-error-detail` (persistent, with copy) |
| 2 | Upload board not ready / no port (`BOARD_NOT_READY`) | `web2board.js:239` `showBoardErrorWithCopy('alert-web2board-no-port-found')` | `alert-web2board-no-port-found` | port-not-found toast |
| 3 | Generic upload error (other cases) | `web2board.js:241` `showErrorWithCopy('UPLOAD', error)` | copy = full error | upload error toast |
| 4 | Board not ready when verifying (`isBoardReady`, empty board) | `web2board.js:253` `showBoardErrorWithCopy('alert-web2board-boardNotReady')` | `alert-web2board-boardNotReady` | board-not-ready toast |
| 5 | Verify (compile) error | `web2board.js:343` `showErrorWithCopy('VERIFY', error)` | copy = full error | verify error toast |
| 6 | Board not ready during verify | `web2board.js:353` `showBoardErrorWithCopy('alert-web2board-boardNotReady')` | `alert-web2board-boardNotReady` | board-not-ready toast |
| 7 | No port found when opening communication | `web2board.js:379` `showBoardErrorWithCopy('alert-web2board-no-port-found')` | `alert-web2board-no-port-found` | port-not-found toast |
| 8 | No port found when opening plotter | `web2board.js:420` `showBoardErrorWithCopy('alert-web2board-no-port-found')` | `alert-web2board-no-port-found` | port-not-found toast |
| 9 | WebSocket connection closed unexpectedly (was connected) | `web2board.js:309` `showErrorDialog({messageKey:'web2board_toast_closedUnexpectedly'})` | `web2board_toast_closedUnexpectedly` | `web2board_toast_closedUnexpectedly` toast |

### i18n keys to keep in sync

Every key below must exist in all `app/res/locales/*.json` files (see `AGENTS.md` → i18n):

- `error-dialog-title`, `error-dialog-copy`, `error-dialog-accept` (dialog chrome)
- `alert-web2board-no-port-found`
- `alert-web2board-boardNotReady`
- `web2board_toast_closedUnexpectedly`
