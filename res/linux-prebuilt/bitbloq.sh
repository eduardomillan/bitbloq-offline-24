#!/bin/sh
# Lanzador de Bitbloq Offline para Linux.
export NO_AT_BRIDGE=1
DIR="$(cd "$(dirname "$0")" && pwd)"

# Ensure libusb-0.1.so.4 is available system-wide for avrdude64 (called by
# web2board via PyInstaller, which resets LD_LIBRARY_PATH).
LIBUSB_SRC="$DIR/libusb/libusb-0.1.so.4"
LIBUSB_DST="/usr/lib/x86_64-linux-gnu/libusb-0.1.so.4"
if [ -f "$LIBUSB_SRC" ] && [ ! -e "$LIBUSB_DST" ]; then
    echo "Creating libusb symlink for avrdude64 (requires sudo)..."
    sudo ln -sf "$LIBUSB_SRC" "$LIBUSB_DST" && sudo ldconfig 2>/dev/null || \
        echo "WARNING: Could not create libusb symlink. Upload may fail."
fi

exec "$DIR/Bitbloq" "$@"
