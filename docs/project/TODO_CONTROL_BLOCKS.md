# Zowi Control Blocks — Coverage Analysis & Implementation Plan

> Status: **Analysis complete — pending implementation**
> Scope: Blocks insertable in the bitbloq-offline-24 editor for controlling Zowi,
> compared against the full capabilities available in `../zowiLibs` and
> `../ZowiDesktop`.

## 1. Reference sources

The available Zowi capabilities come from two reference codebases:

- **`../zowiLibs`** — the firmware / Arduino library (`Zowi.h`, `Zowi.cpp`,
  `Zowi_mouths.h`, `Zowi_gestures.h`, `Zowi_sounds.h`, `ZOWI_BASE_v2.ino`).
- **`../ZowiDesktop`** — the desktop app / CLI + protocol
  (`robot_commands.h`, `robot_commands.cpp`, `cli_commands.cpp`).

Both expose essentially the same catalog. bitbloq-offline-24 consumes the
C++ library bundled under `res/libs/v1_1_3/BitbloqZowi/`.

The editable Zowi blocks are defined in the `bloqs` bower package
(`bower_components/bloqs/src/scripts/bloqs/zowi/`) and registered in the UI via
`app/res/properties.json` and `app/res/menus/swtoolbox.json`.

## 2. Current coverage summary

| Category      | Total available | Exposed in blocks | Missing |
|---------------|-----------------|-------------------|---------|
| **Movements** | 14 functions     | 14 (simple + advanced) | **0**  |
| **Gestures**  | 13               | 11               | **2**   |
| **Mouths**    | 31 (+4 animations) | 6 (dropdown) + 1 (free bitmap) | **25** (no dropdown) |
| **Sounds**    | 19               | 8                | **11**  |

Movements are fully covered. Gestures, mouths, and sounds are only partially
exposed in the editor's dropdowns.

## 3. Detailed differences

### 3.1 Movements — COMPLETE (0 missing)

All 14 movement functions from `zowiLibs` (`home`, `walk`, `turn`, `bend`,
`shakeLeg`, `updown`, `swing`, `tiptoeSwing`, `jitter`, `ascendingTurn`,
`moonwalker`, `crusaito`, `flapping`, `jump`) and all 20 protocol `MoveID`s from
`ZowiDesktop`, including every direction (forward/backward/left/right),
with speed (`LOW/MEDIUM/HIGH_SPEED`) and height (`SMALL/MEDIUM/BIG_HEIGHT`)
variants, are reachable through the combination of simple + advanced blocks:

- `zowiHome`
- `zowiMovementsSimple` (13 options: walk, turn, shakeLeg, bend, moonwalker,
  crusaito, flapping, updown, swing, tiptoeSwing, jitter, ascendingTurn, jump)
- `zowiMovementsFront` (walk fwd/back + speed)
- `zowiMovementsSides` (turn/shakeLeg/bend left/right + speed)
- `zowiMovementsHeightFront` (flapping fwd/back + speed + height)
- `zowiMovementsHeightSides` (moonwalker/crusaito left/right + speed + height)
- `zowiMovementsNoDir-v1` (updown/swing/tiptoeSwing/jitter/ascendingTurn + speed + height)

### 3.2 Gestures — MISSING 2 of 13

The `zowiGestures` block dropdown exposes **11** of the 13 gestures.

| Gesture        | zowiLibs | ZowiDesktop | Block available |
|----------------|----------|-------------|-----------------|
| ZowiHappy      | ✅       | ✅          | ✅              |
| ZowiSuperHappy | ✅       | ✅          | ✅              |
| ZowiSad        | ✅       | ✅          | ✅              |
| ZowiSleeping   | ✅       | ✅          | ✅              |
| ZowiFart       | ✅       | ✅          | ✅              |
| ZowiConfused   | ✅       | ✅          | ✅              |
| ZowiLove       | ✅       | ✅          | ✅              |
| ZowiAngry      | ✅       | ✅          | ✅              |
| ZowiFretful    | ✅       | ✅          | ✅              |
| **ZowiMagic**  | ✅ (id 9) | ✅ (id 9)    | **❌ MISSING** |
| **ZowiWave**   | ✅ (id 10)| ✅ (id 10)   | **❌ MISSING** |
| ZowiVictory    | ✅       | ✅          | ✅              |
| ZowiFail       | ✅       | ✅          | ✅              |

### 3.3 Mouths — only 6 of 31 in basic dropdown

The `zowiMouth` block dropdown exposes only 6 expressions:
`smile`, `sad`, `happyOpen`, `confused`, `bigSurprise`, `tongueOut`
(using the `*_code` bitmask constants).

Missing from the dropdown (25 expressions):

| Group        | Mouths missing                                                  |
|--------------|-----------------------------------------------------------------|
| Digits       | zero_code … nine_code (0-9)                                     |
| Happy        | happyClosed_code                                                |
| Symbols      | heart_code, smallSurprise_code, lineMouth_code, diagonal_code   |
| Vampire      | vamp1_code, vamp2_code                                          |
| Sad          | sadOpen_code, sadClosed_code                                    |
| Others       | okMouth_code, xMouth_code, interrogation_code, thunder_code, culito_code, angry_code |

> Note: The advanced block `zowiMouthAdvanced` (`advanced/zowiMouth.js`) already
> allows a **free-form 30-bit binary bitmap**, so any custom mouth can be drawn
> manually. The gap is the absence of ready-made named mouths in a dropdown.

### 3.4 Sounds — only 8 of 19 in dropdown

The `zowiSounds` block dropdown exposes only 8 sounds: `S_surprise`, `S_OhOoh`,
`S_cuddly`, `S_sleeping`, `S_happy`, `S_sad`, `S_confused`, `S_fart1`.

Missing from the dropdown (11 sounds):

| Sound         | Value          | Sound         | Value            |
|---------------|----------------|---------------|------------------|
| Connection    | S_connection   | Super happy   | S_superHappy     |
| Disconnection | S_disconnection| Happy (short) | S_happy_short    |
| Button pushed | S_buttonPushed | Fart 2        | S_fart2          |
| Mode 1        | S_mode1        | Fart 3        | S_fart3          |
| Mode 2        | S_mode2        | Oh ooh 2      | S_OhOoh2         |
| Mode 3        | S_mode3        |               |                  |

## 4. Implementation plan

### Phase 0 — Verify the C++ side

Before adding any block option, confirm the constants exist in the bundled
library and match the upstream zowiLibs values (`res/libs/v1_1_3/BitbloqZowi/`):

- `Zowi_gestures.h` → `ZowiMagic` (9), `ZowiWave` (10).
- `Zowi_mouths.h` → all `*_code` bitmask constants.
- `Zowi_sounds.h` → all `S_*` constants.

> If any constant is absent in the bundled v1_1_3 library, it must be backported
> first (copy from `../zowiLibs/arduinolibs/Zowi/`) before the block will compile.

### Phase 1 — Add missing options to the bloq definitions

Edit the JS bloq source (not the `dist/` — the dist is generated):

1. **Gestures — `bower_components/bloqs/src/scripts/bloqs/zowi/zowiGestures.js`**
   Add two entries to the `GESTURE` dropdown:
   ```js
   { label: 'bloq-zowi-gestures-ZowiMagic-v1', value: 'ZowiMagic' },
   { label: 'bloq-zowi-gestures-ZowiWave-v1',  value: 'ZowiWave'  }
   ```
   Order: place them after `ZowiFretful` to mirror the upstream enum order.

2. **Mouths — `bower_components/bloqs/src/scripts/bloqs/zowi/zowiMouth.js`**
   Extend the `GESTURE` dropdown with the 25 missing `*_code` values. Keep the
   existing 6 first (backwards compatibility), then append the new ones, using
   unique label keys:
   ```js
   // zero_code … nine_code, happyClosed_code, heart_code, smallSurprise_code,
   // vamp1_code, vamp2_code, lineMouth_code, diagonal_code, sadOpen_code,
   // sadClosed_code, okMouth_code, xMouth_code, interrogation_code,
   // thunder_code, culito_code, angry_code
   ```
   > Consider whether to put named mouths in the basic block or only expose the
   > most useful ones and rely on `zowiMouthAdvanced` for the rest. Recommended:
   > add all of them to the basic block for parity.

3. **Sounds — `bower_components/bloqs/src/scripts/bloqs/zowi/zowiSounds.js`**
   Extend the `SOUND` dropdown with the 11 missing `S_*` values, keeping the
   existing 8 first.

### Phase 2 — Regenerate the bloqs dist

The editor consumes `bower_components/bloqs/dist/`. Rebuild the bloq JSON/JS so
the new options appear:
- Run the bloqs build step (`grunt` task that compiles `src/scripts/bloqs` →
  `dist/`), or, if the dist is not auto-generated here, rebuild the package and
  copy the updated `dist/bloqs/zowi/*.json` files back.

> Verify which grunt task regenerates dist (e.g. the `bloqs` build inside
> `bower_components/bloqs`) and run it. `npm test` (jshint) should pass after.

### Phase 3 — UI registration (if new bloqs are created)

If any entirely *new* blok gets added (beyond extending dropdowns), register it
in:
- `app/res/properties.json` → `zowi` / `advancedZowis` arrays.
- `app/res/menus/swtoolbox.json` → toolbox menu.

> For dropdown-only changes this is **not** needed — the bloqs already exist.

### Phase 4 — Translations (i18n)

Block labels use a **separate translation system** (Poeditor project, not
`app/res/locales/*.json`). Each new dropdown option needs an i18n key resolved
to its translated text in every language:

1. Add new keys for every new label used in Phases 1-3:
   - `bloq-zowi-gestures-ZowiMagic-v1`, `bloq-zowi-gestures-ZowiWave-v1`
   - New mouth keys, e.g. `bloq-zowi-mouth-heart`, `bloq-zowi-mouth-x`, etc.
   - New sound keys, e.g. `bloq-zowi-sounds-connection`, `bloq-zowi-sounds-mode1`, etc.
2. Provide translations (at minimum `en-GB`; ideally all 13 locales: bg, ca,
   de, en, es, eu, fr, gl, it, nl, pt, ru, zh-CN).
3. Register/update through the Poeditor workflow (`tasks/poeditor.js`) so the
   strings reach the translation store the app fetches at runtime.
   - If translations are unavailable, blocks will render the raw key; decide on a
     fallback so the UI is not broken.

### Phase 5 — Verification

1. **Lint:** `npm test` (grunt jshint) — source JS must pass.
2. **Build:** `grunt build:linux` (or target of choice) to regenerate
   `app/images/sprite.svg`, CSS, and the Electron dist.
3. **Manual:**
   - Open the Zowi bloqs in the editor; confirm the new dropdown options appear.
   - Place each new option in a program, compile, and flash a Zowi board.
   - Confirm the generated Arduino code compiles against the bundled
     `BitbloqZowi` v1_1_3 library (gestures, mouths, sounds resolve).
4. **Regression:** existing saved programs using the old dropdown values (e.g.
   `ZowiHappy`, `smile_code`, `S_surprise`) must still load and compile unchanged.

### Phase 6 — Optional / follow-ups (out of scope unless requested)

- **Mouth animations** (`littleUuh`, `dreamMouth`, `adivinawi`, `wave`) exist in
  the library but are not represented as standalone blocks. Could be exposed as
  new blocks or options.
- **Sounds** like the raw buzzer `T <freq> <dur>` tone command in ZowiDesktop are
  not represented as blocks; a "beep" block could be added on request.
- Consider whether `ZowiMagic`/`ZowiWave` should also appear in the ZowiDesktop
  GUI gesture picker (currently only shows first 10 gestures) for consistency.

## 5. Files touched (summary)

| File | Change |
|------|--------|
| `bower_components/bloqs/src/scripts/bloqs/zowi/zowiGestures.js` | +2 gesture options |
| `bower_components/bloqs/src/scripts/bloqs/zowi/zowiMouth.js` | +25 mouth options |
| `bower_components/bloqs/src/scripts/bloqs/zowi/zowiSounds.js` | +11 sound options |
| `bower_components/bloqs/dist/bloqs/zowi/*.json` | regenerated from src |
| `res/libs/v1_1_3/BitbloqZowi/*.h` | only if a constant is missing (backport) |
| `app/res/properties.json`, `app/res/menus/swtoolbox.json` | only if new bloqs added |
| Poeditor translation store (+ `tasks/poeditor.js` workflow) | new i18n keys + translations |
