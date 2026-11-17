#!/usr/bin/env bash
# Funciones comunes del experimento E4 (se hace `source` desde los otros scripts).

RONDA="${RONDA:-${1:-0}}"
BASE_URL="${BASE_URL:-http://34.16.0.136}"
PROJECT="${PROJECT:-deport-back}"
NAMESPACE="${NAMESPACE:-deport-back}"
DEPLOYMENT="${DEPLOYMENT:-deport-back}"
SQL_INSTANCE="${SQL_INSTANCE:-deport-back-sql}"
RESULT_DIR="${RESULT_DIR:-resultados/e4}"
FLOW_IDS=("296f5b48-cada-460d-9b8b-fd5dc2ac972e" "a2809c60-5868-4bc7-a256-0cb0cef748ec")
ALERT_TITLE="E4 - Borrado masivo de deportistas"
EMAIL_RE='^e4-[0-9]+-[A-Za-z0-9]+@example\.com$'

mkdir -p "$RESULT_DIR"
BITACORA="$RESULT_DIR/bitacora-r${RONDA}.md"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
epoch() { date -u +%s.%N; }

log() {
  local linea="- $(now) $*"
  echo "$linea" | tee -a "$BITACORA" >&2
}

api() { # api METODO RUTA [cuerpo]  -> imprime "<status>\n<cuerpo>" en $API_BODY y status en stdout
  local metodo="$1" ruta="$2" cuerpo="${3:-}" trace="${TRACE_ID:-gd-exp4-r${RONDA}-manual}"
  API_BODY="$(mktemp)"
  if [[ -n "$cuerpo" ]]; then
    curl -s -o "$API_BODY" -w '%{http_code}' --max-time 30 -X "$metodo" \
      -H "X-Api-Key: ${API_KEY}" -H "X-Trace-Id: ${trace}" -H 'Content-Type: application/json' \
      -d "$cuerpo" "${BASE_URL}${ruta}" || echo 000
  else
    curl -s -o "$API_BODY" -w '%{http_code}' --max-time 30 -X "$metodo" \
      -H "X-Api-Key: ${API_KEY}" -H "X-Trace-Id: ${trace}" \
      "${BASE_URL}${ruta}" || echo 000
  fi
}

contar_deportistas() {
  local st
  st="$(api GET /api/v2/deportistas)"
  if [[ "$st" == 200 ]]; then jq '.deportistas | length' "$API_BODY"; else echo "error-$st"; fi
  rm -f "$API_BODY"
}

control_actual() { # valor de SECURITY_DELETE_LIMIT_ENABLED en el deployment ("" si no se puede leer)
  kubectl -n "$NAMESPACE" get deployment "$DEPLOYMENT" \
    -o jsonpath='{.spec.template.spec.containers[?(@.name=="'"$DEPLOYMENT"'")].env[?(@.name=="SECURITY_DELETE_LIMIT_ENABLED")].value}' 2>/dev/null || true
}

fijar_control() { # fijar_control true|false
  local valor="$1"
  kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
    SECURITY_DELETE_LIMIT_ENABLED="$valor" SECURITY_DELETE_LIMIT_PER_MINUTE="${SECURITY_DELETE_LIMIT_PER_MINUTE:-10}"
  kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s
  # igual que scripts/run-chaos-experiment.sh: esperar el drenaje de los pods anteriores
  sleep "${SETTLE_SECONDS:-40}"
}

alerta_firing() { # 0 si la alerta esta firing; 2 si no medible
  if [[ -z "${GRAFANA_URL:-}" || -z "${GRAFANA_TOKEN:-}" ]]; then return 2; fi
  local json
  json="$(curl -s --max-time 20 -H "Authorization: Bearer ${GRAFANA_TOKEN}" \
    "${GRAFANA_URL%/}/api/prometheus/grafana/api/v1/alerts" || true)"
  local n
  n="$(jq --arg t "$ALERT_TITLE" '[.data.alerts[]? | select(.labels.alertname==$t and (.state|ascii_downcase|test("firing|alerting")))] | length' <<<"$json" 2>/dev/null || echo 0)"
  [[ "${n:-0}" -gt 0 ]]
}

regla_existe() { # 0 existe, 1 no, 2 no medible
  if [[ -z "${GRAFANA_URL:-}" || -z "${GRAFANA_TOKEN:-}" ]]; then return 2; fi
  curl -s --max-time 20 -H "Authorization: Bearer ${GRAFANA_TOKEN}" \
    "${GRAFANA_URL%/}/api/prometheus/grafana/api/v1/rules" \
    | jq -e --arg t "$ALERT_TITLE" '[.data.groups[]?.rules[]? | select(.name==$t)] | length > 0' >/dev/null 2>&1
}

borrar_clones() {
  local nombres n
  nombres="$(gcloud sql instances list --project "$PROJECT" \
    --filter='name~^deport-back-sql-e4-clone-' --format='value(name)' 2>/dev/null || true)"
  for n in $nombres; do
    log "Borrando clon $n"
    gcloud sql instances delete "$n" --project "$PROJECT" --quiet || log "AVISO: no se pudo borrar $n"
  done
}
