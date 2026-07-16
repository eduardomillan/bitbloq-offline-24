# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Current version: **1.3.0-rc.1**

## [Unreleased]

## [1.2.3] - Deprecated / Obsolete

> **Deprecated.** This was the last release of the original `bq/bitbloq-offline`
> lineage, used as the baseline before this fork. It does **not** work on modern
> systems (Ubuntu 22.04 / Lliurex 23+, current Electron/glibc) and is kept only
> for historical reference. Use `1.3.0-rc.1` or later instead.

## [1.3.0-rc.1] - 2026-07-16

> First release candidate of the maintained fork. This is the first build
> intended to be functional on modern systems (Ubuntu 22.04 / Lliurex 23-25,
> current Electron and glibc). Please test and report issues.

### Added
- **Bulgarian (bg-BG) language.** New locale `app/res/locales/bg-BG.json`
  (1427 keys, translated from `es-ES`). Registered in the language selector
  (`commonModals.js` `modaloptions`) and in `tasks/poeditor.js` (`langKeys`).
  The `bg-BG` language name is added to every existing locale file so the
  selector is self-describing. (Fork branches `bg-BG`.)
- **Web2Board released as a separate, versioned package.** Added
  `grunt package-web2board`, the download descriptor
  `app/res/web2board-download.json` (version 2.1.3, per-platform zip + SHA-256),
  the on-demand installer factory `app/scripts/factories/web2boardInstaller.js`,
  the manifest generator `tasks/lib/web2board-manifest.js`, and the CI workflow
  `.github/workflows/release-web2board.yml` that builds and publishes the
  `web2board-vX.Y.Z` release assets automatically.
- **Slim builds.** `grunt dist-slim` / `build:*-slim` produce distributables
  without a bundled Web2Board; Web2Board is fetched and checksum-verified on
  first use.

### Changed
- **Linux port to modern distributions.** Adapted to run on Ubuntu 22.04 /
  Lliurex 23-25: `main.js` launches Electron with `--no-sandbox` and
  `--disable-dev-shm-usage`; added required system libraries (libusb, pango).
- **Build tooling.** Switched SCSS compilation to Dart Sass (`grunt sass`);
  fixed `bower`/`grunt` installation issues (certificate workaround, forced
  `--legacy-peer-deps` in CI); added a Linux launch helper script.
- **README** rewritten in English with accurate, current platform, build,
  Web2Board and i18n documentation (replaces the discontinued upstream text).

### Removed
- **Linux 32-bit support.** Deleted `res/linux32-prebuilt` and the
  `copy:linux32`, `copy:prebuiltLinux32` and `clean:linux32` grunt targets;
  removed the corresponding exclusions and the Linux 32-bit Web2Board launcher
  fallback in `web2board.js` (non-x64 Linux now uses the on-demand download).
  Removed the "Linux 32" links from the README. Only 64-bit Linux is built.

### Fixed
- Board flashing and USB detection issues on current Linux kernels/glibc.

---

## Versioning policy

- **MAJOR** — incompatible changes to the build/runtime contract or removal of
  a supported platform.
- **MINOR** — new features (languages, boards, build modes) in a
  backwards-compatible way.
- **PATCH** — bug fixes and platform adaptations that do not change behavior.

Web2Board is versioned independently and referenced by its own `web2board-vX.Y.Z`
release tag; the application pins the Web2Board version in
`app/res/web2board-download.json`.
