#!/usr/bin/env bash
#
# Create a GitHub release for Bitbloq Offline and upload the release assets.
#
# Prerequisites:
#   - `gh` CLI authenticated with a token that has `repo` scope.
#   - The release assets must already be built in dist/ (run
#     scripts/build-release-assets.sh first, on the matching OS).
#
# Usage:
#   scripts/create-github-release.sh            # uses version from package.json
#   scripts/create-github-release.sh 2.1.0      # override version
#   scripts/create-github-release.sh 2.1.0 --draft   # create as draft release
#   scripts/create-github-release.sh 2.1.0 --prerelease
#
set -euo pipefail

cd "$(dirname "$0")/.."

usage() {
    cat <<'EOF'
Usage: create-github-release.sh [VERSION] [--draft] [--prerelease] [-h|--help]

Create a GitHub release for Bitbloq Offline and upload the release assets.

Arguments:
  VERSION     Version tag to release (e.g. 2.1.0). Defaults to the version in
              package.json.

Options:
  -h, --help      Show this help message and exit.
  --draft         Create the release as a draft (not published).
  --prerelease    Mark the release as a prerelease.

Prerequisites:
  - `gh` CLI authenticated with a token that has `repo` scope.
  - The release assets must already be built in dist/ (run
    scripts/build-release-assets.sh first, on the matching OS).

Examples:
  create-github-release.sh
  create-github-release.sh 2.1.0
  create-github-release.sh 2.1.0 --draft
EOF
}

GH_FLAGS=()
VERSION=""
for arg in "$@"; do
    case "$arg" in
        -h|--help)     usage; exit 0 ;;
        --draft)       GH_FLAGS+=("--draft") ;;
        --prerelease)  GH_FLAGS+=("--prerelease") ;;
        -*)            echo "Unknown option: $arg" >&2; exit 2 ;;
        *)             VERSION="$arg" ;;
    esac
done

if [ -z "$VERSION" ]; then
    VERSION="$(node -p "require('./package.json').version")"
fi

if [ -z "$VERSION" ]; then
    echo "ERROR: could not read version from package.json" >&2
    exit 1
fi

PRODUCT="bitbloq-offline"
TAG="v${VERSION}"

echo "Creating GitHub release ${TAG} (version ${VERSION})"

# Collect release assets from dist/.
ASSETS=()
while IFS= read -r -d '' f; do
    ASSETS+=("$f")
done < <(find dist -maxdepth 1 -type f \( \
    -name "${PRODUCT}-linux-${VERSION}.zip" \
    -o -name "${PRODUCT}-windows-${VERSION}.zip" \
    -o -name "${PRODUCT}-mac-${VERSION}.zip" \
    -o -name "${PRODUCT}-setup-${VERSION}.exe" \
    -o -name "${PRODUCT}_${VERSION}_amd64.deb" \
    -o -name "BitbloqOffline-${VERSION}.AppImage" \
\) -print0 | sort -z)

if [ ${#ASSETS[@]} -eq 0 ]; then
    echo "ERROR: no release assets found in dist/ for v${VERSION}." >&2
    echo "       Run scripts/build-release-assets.sh first." >&2
    exit 1
fi

echo "Assets to upload:"
for a in "${ASSETS[@]}"; do
    echo "  - $a"
done

# Generate release notes from CHANGELOG.md for this version.
NOTES_FILE="$(mktemp)"
trap 'rm -f "$NOTES_FILE"' EXIT

awk -v ver="${VERSION}" '
    $0 ~ "^## \\[" ver "\\]" { found=1; next }
    found && /^## \[/ { exit }
    found { print }
' CHANGELOG.md > "$NOTES_FILE"

if [ ! -s "$NOTES_FILE" ]; then
    echo "WARNING: no changelog entry found for v${VERSION}; using a generic note." >&2
    echo "Bitbloq Offline v${VERSION}" > "$NOTES_FILE"
fi

echo "Release notes (from CHANGELOG.md):"
echo "----------------------------------------"
cat "$NOTES_FILE"
echo "----------------------------------------"

# Create the release.
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
REPO=""
if [ -n "$REMOTE_URL" ]; then
    REPO="$(echo "$REMOTE_URL" | sed -E 's#.*github\.com[:/]##; s#\.git$##')"
fi

if [ -z "$REPO" ]; then
    echo "ERROR: cannot determine GitHub repo from git remote 'origin'." >&2
    echo "       Run: gh repo set-default OWNER/REPO" >&2
    exit 1
fi

gh release create "$TAG" "${ASSETS[@]}" \
    -R "$REPO" \
    --title "Bitbloq Offline v${VERSION}" \
    --notes-file "$NOTES_FILE" \
    "${GH_FLAGS[@]}"

echo "GitHub release ${TAG} created successfully."
