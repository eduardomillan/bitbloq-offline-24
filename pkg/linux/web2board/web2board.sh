#!/bin/sh
# Launcher for the standalone Web2Board service (Debian package).
# Runs the self-contained PyInstaller binary bundled in /opt/web2board.
exec /opt/web2board/web2boardLauncher --port 9877
