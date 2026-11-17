#!/usr/bin/env bash
# Uso: scripts/informe-pdf.sh <entrada.md> <salida.pdf>
# Requiere: python con 'markdown' (pip install --user markdown pypdf) y Microsoft Edge.
set -euo pipefail
[ $# -eq 2 ] || { echo "Uso: $0 <entrada.md> <salida.pdf>" >&2; exit 1; }
EDGE="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
IN="$(realpath "$1")"; OUT="$(realpath -m "$2")"
mkdir -p "$(dirname "$OUT")"
HTML="${OUT%.pdf}.html"
python "$AQUI/informe-pdf.py" "$IN" "$HTML"
"$EDGE" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf="$(cygpath -w "$OUT")" "file:///$(cygpath -m "$HTML")" >/dev/null 2>&1 || true
[ -s "$OUT" ] || { echo "No se generó el PDF" >&2; exit 1; }
rm -f "$HTML"
python -c "import pypdf,sys;print('Páginas:',len(pypdf.PdfReader(sys.argv[1]).pages))" "$OUT"
