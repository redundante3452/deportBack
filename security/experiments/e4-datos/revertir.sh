#!/usr/bin/env bash
# Reversion del E4: borra solo el lote sintetico e4-*, restaura el control, borra clones.
# Imprime REVERSION OK o termina con error. Idempotente.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
RESULT_DIR="${RESULT_DIR:-$(pwd)/resultados/e4}"
: "${API_KEY:?API_KEY es obligatorio}"
# shellcheck source=lib.sh
source ./lib.sh

FALLOS=0
fallo() { log "FALLO: $*"; FALLOS=$((FALLOS + 1)); }
es_flujo() { local x; for x in "${FLOW_IDS[@]}"; do [[ "$1" == "$x" ]] && return 0; done; return 1; }

log "== Reversion E4 (ronda $RONDA) =="

# 1. Restaurar el control al valor previo (default false). Se hace primero para que el borrado del lote no reciba 429.
PREVIO="false"
[[ -f "$RESULT_DIR/control-previo.txt" ]] && PREVIO="$(cat "$RESULT_DIR/control-previo.txt")"
[[ "$PREVIO" == "true" ]] || PREVIO="false"
if command -v kubectl >/dev/null 2>&1; then
  ACTUAL="$(control_actual)"
  if [[ "${ACTUAL:-false}" != "$PREVIO" ]]; then
    log "Restaurando SECURITY_DELETE_LIMIT_ENABLED=$PREVIO (estaba '${ACTUAL:-sin definir}')"
    fijar_control "$PREVIO" || fallo "no se pudo restaurar el control"
  else
    log "Control ya en $PREVIO"
  fi
else
  log "AVISO: kubectl no disponible; no se pudo restaurar el control"
fi

# 2. Borrar SOLO registros sinteticos del lote (ids guardados + emails e4-<n>-<runid>@example.com)
IDS="$(mktemp)"
cat "$RESULT_DIR"/ids-r*.txt 2>/dev/null >>"$IDS" || true
ST="$(api GET /api/v2/deportistas)"
if [[ "$ST" == 200 ]]; then
  jq -r --arg re "$EMAIL_RE" '.deportistas[] | select(.email|test($re)) | .id' "$API_BODY" >>"$IDS"
else
  fallo "no se pudo listar deportistas (HTTP $ST)"
fi
rm -f "$API_BODY"
BORRADOS=0
while read -r id; do
  [[ -z "$id" ]] && continue
  if es_flujo "$id"; then log "OMITIDO id del flujo $id"; continue; fi
  for intento in $(seq 1 20); do
    ST="$(api DELETE "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
    [[ "$ST" == 429 ]] && { sleep 10; continue; }
    break
  done
  case "$ST" in
    200|204) BORRADOS=$((BORRADOS + 1)) ;;
    404) : ;;
    *) fallo "DELETE $id devolvio $ST" ;;
  esac
done < <(sort -u "$IDS")
rm -f "$IDS"
log "Registros sinteticos eliminados en la reversion: $BORRADOS"

# 3. Clones PITR
if command -v gcloud >/dev/null 2>&1; then
  borrar_clones
  RESTAN="$(gcloud sql instances list --project "$PROJECT" --filter='name~^deport-back-sql-e4-clone-' --format='value(name)' 2>/dev/null || true)"
  [[ -z "$RESTAN" ]] || fallo "quedan clones: $RESTAN"
else
  log "AVISO: gcloud no disponible; no se revisaron clones"
fi

# 4. Los ids del flujo siguen existiendo
for id in "${FLOW_IDS[@]}"; do
  ST="$(api GET "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
  [[ "$ST" == 200 ]] || fallo "id del flujo $id devolvio $ST (esperado 200)"
done

# 5. Quedan lotes e4-*?
ST="$(api GET /api/v2/deportistas)"
if [[ "$ST" == 200 ]]; then
  RESTO="$(jq --arg re "$EMAIL_RE" '[.deportistas[] | select(.email|test($re))] | length' "$API_BODY")"
  [[ "$RESTO" == 0 ]] || fallo "quedan $RESTO registros e4-*"
fi
rm -f "$API_BODY"

if [[ "$FALLOS" -eq 0 ]]; then
  log "REVERSION OK"
  echo "REVERSION OK"
else
  echo "REVERSION FALLIDA ($FALLOS fallos)" >&2
  exit 1
fi
