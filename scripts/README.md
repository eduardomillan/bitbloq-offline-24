# Scripts

Utility scripts for building release assets and publishing GitHub releases.

## build-release-assets.sh

Build and package Bitbloq Offline release assets for a target OS. Each target
must be built on its own OS (Electron binaries and native packaging tools
differ).

### Usage

```
scripts/build-release-assets.sh [-t TARGET] [-h|--help]
```

### Options

| Option | Description |
|--------|-------------|
| `-t TARGET` | Target to build: `linux`, `windows`, `mac`, `all`. Default: `linux`. |
| `-h, --help` | Show help message and exit. |

### Targets

| Target | Platform | Output |
|--------|----------|--------|
| `linux` | 64-bit Linux (Ubuntu 22.04+) | `.deb`, AppImage, `.zip` |
| `windows` | Windows with NSIS installed | `.exe`, `.zip` |
| `mac` | macOS | `.zip` |
| `all` | All targets available on this machine | All of the above |

### Examples

```sh
scripts/build-release-assets.sh
scripts/build-release-assets.sh -t linux
scripts/build-release-assets.sh -t all
```

## create-github-release.sh

Create a GitHub release and upload the release assets from `dist/`.

### Prerequisites

- `gh` CLI authenticated with a token that has `repo` scope.
- Release assets must already be built in `dist/` (run `build-release-assets.sh`
  first, on the matching OS).

### Usage

```
scripts/create-github-release.sh [VERSION] [--draft] [--prerelease] [-h|--help]
```

### Options

| Option | Description |
|--------|-------------|
| `VERSION` | Version tag to release (e.g. `2.1.0`). Defaults to the version in `package.json`. |
| `--draft` | Create the release as a draft (not published). |
| `--prerelease` | Mark the release as a prerelease. |
| `-h, --help` | Show help message and exit. |

### Examples

```sh
scripts/create-github-release.sh
scripts/create-github-release.sh 2.1.0
scripts/create-github-release.sh 2.1.0 --draft
```
