#!/bin/sh
# Lanzador de Bitbloq Offline para Linux.
# No se fuerza LD_LIBRARY_PATH con el pango 1.38 empaquetado: en distros
# modernas (glibc 2.35 / fontconfig 2.13) ese pango viejo rompe el render de
# los diálogos GTK2 (fuentes como cuadrados). Se usa el pango del sistema
# (libpango-1.0-0 >= 1.40), que es compatible con el fontconfig actual.
# NO_AT_BRIDGE evita cargar el módulo atk-bridge de GTK2, que en estas
# distros da un símbolo indefinido y un warning molesto.
export NO_AT_BRIDGE=1
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/Bitbloq" "$@"
