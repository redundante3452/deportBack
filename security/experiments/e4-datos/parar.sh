#!/usr/bin/env bash
# Corta el ataque en curso (pidfile) y revierte.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
RESULT_DIR="${RESULT_DIR:-$(pwd)/resultados/e4}"
export RESULT_DIR
PIDFILE="$RESULT_DIR/ejecutar.pid"

if [[ -f "$PIDFILE" ]]; then
  PID="$(cat "$PIDFILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Deteniendo ejecutar.sh (pid $PID)"
    kill -TERM "$PID" 2>/dev/null || true
    for _ in $(seq 1 60); do kill -0 "$PID" 2>/dev/null || break; sleep 1; done
    kill -0 "$PID" 2>/dev/null && kill -KILL "$PID" 2>/dev/null
  else
    echo "El proceso $PID ya no existe"
  fi
  rm -f "$PIDFILE"
else
  echo "No hay pidfile en $PIDFILE"
fi

exec bash ./revertir.sh
