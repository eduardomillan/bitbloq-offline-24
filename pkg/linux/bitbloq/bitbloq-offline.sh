#!/bin/sh
# Launcher for Bitbloq Offline (Debian package).
# The app lives in /opt/bitbloq-offline and is launched from there so that
# Electron resolves process.resourcesPath -> /opt/bitbloq-offline/resources.
export NO_AT_BRIDGE=1
exec /opt/bitbloq-offline/Bitbloq "$@"
