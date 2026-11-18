#!/usr/bin/env bash
# E4 - Caso negativo en vivo: trafico legitimo (5 borrados, 1 por minuto) por debajo del umbral
# de la alerta (>= 10 borrados en 5 min) NO debe dispararla. Mide falsos positivos en infraestructura real.
# Uso: API_KEY=... GRAFANA_URL=... GRAFANA_TOKEN=... [BASE_URL RESULT_DIR] ./caso-negativo.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
RESULT_DIR="${RESULT_DIR:-$(pwd)/resultados/e4}"
: "${API_KEY:?API_KEY es obligatorio}"
RONDA=neg   # bitacora-rneg.md / resultado-rneg.json
export RESULT_DIR RONDA
# shellcheck source=lib.sh
source ./lib.sh

TOTAL=5
INTERVALO=60       # s entre borrados
OBSERVACION=360    # s desde el primer borrado
SONDEO=15
PROTEGIDOS=("${FLOW_IDS[@]}" "0e830672-a08d-4928-96fc-e5db00b3cb7f")
RUNID="neg$(date -u +%H%M%S)"
EXECUTION_ID="gd-exp4-neg-$(date -u +%Y%m%dT%H%M%SZ)"
TRACE_ID="$EXECUTION_ID"; export TRACE_ID
IDS_FILE="$RESULT_DIR/ids-rneg.txt"; : >"$IDS_FILE"
CSV="$RESULT_DIR/caso-negativo.csv"; echo "hora_utc,evento,detalle" >"$CSV"
echo "# Bitacora E4 caso negativo ($EXECUTION_ID)" >"$BITACORA"

es_protegido() { local x; for x in "${PROTEGIDOS[@]}"; do [[ "$1" == "$x" ]] && return 0; done; return 1; }
declare -A BORRADO=()   # ids ya borrados en esta corrida
CODIGOS=(); T_PRIMER=""; DISPARO=false; T_DISPARO=""; ESTADOS=""; VEREDICTO="ABORTADO"; MOTIVO=""

escribir_resultado() {
  local codes_json borrados_json
  codes_json="$(printf '%s\n' "${CODIGOS[@]:-}" | jq -R . | jq -s 'map(select(length>0))')"
  borrados_json="$(printf '%s\n' "${!BORRADO[@]:-}" | jq -R . | jq -s 'map(select(length>0))')"
  jq -n --arg exec "$EXECUTION_ID" --arg v "$VEREDICTO" --arg m "$MOTIVO" \
    --arg t1 "$T_PRIMER" --arg tf "$(now)" --arg td "$T_DISPARO" --arg est "$ESTADOS" \
    --argjson ids "$(jq -R . <"$IDS_FILE" | jq -s .)" \
    --argjson borrados "$borrados_json" \
    --argjson codes "$codes_json" --argjson disparo "$DISPARO" \
    '{execution_id:$exec,tipo:"caso-negativo",umbral:"10 borrados en 5 min",borrados_planificados:5,
      t_primer_borrado:(if $t1=="" then null else $t1 end),t_fin:$tf,
      t_disparo:(if $td=="" then null else $td end),
      ids_sembrados:$ids,ids_borrados:$borrados,codigos_http:$codes,
      estados_alerta_observados:($est|split(" ")|map(select(length>0))),
      alerta_disparada:$disparo,veredicto:$v,motivo:$m}' \
    >"$RESULT_DIR/resultado-rneg.json"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    {
      echo "## E4 - caso negativo en vivo: **$VEREDICTO**"
      echo "Alerta disparada: $DISPARO. Codigos HTTP de borrado: ${CODIGOS[*]:-ninguno}. $MOTIVO"
    } >>"$GITHUB_STEP_SUMMARY"
  fi
}

limpieza() { # borra SOLO ids sembrados en esta corrida que sigan vivos
  local rc=$? id st
  trap - EXIT
  while read -r id; do
    [[ -z "$id" || -n "${BORRADO[$id]:-}" ]] && continue
    if es_protegido "$id"; then log "OMITIDO id protegido $id"; continue; fi
    st="$(api DELETE "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
    log "Limpieza: DELETE $id -> $st"
  done <"$IDS_FILE"
  escribir_resultado || true
  exit "$rc"
}
trap limpieza EXIT
trap 'exit 143' TERM INT

# a. La alerta no debe estar firing (si no, no se puede atribuir el disparo)
log "== a. Esperando alerta no firing (max 15 min) =="
EST="$(alerta_estado)"
if [[ "$EST" == "no-medible" || "$EST" == "ausente" ]]; then
  MOTIVO="alerta $EST: no se puede medir el caso negativo"; VEREDICTO="NO_MEDIBLE"; log "$MOTIVO"; exit 1
fi
for _ in $(seq 1 60); do
  [[ "$EST" != "firing" ]] && break
  sleep 15; EST="$(alerta_estado)"
done
if [[ "$EST" == "firing" ]]; then MOTIVO="la alerta siguio firing 15 min antes de empezar"; log "$MOTIVO"; exit 1; fi
log "Alerta en estado '$EST' antes de empezar"

# b. Siembra de 5
log "== b. Siembra de $TOTAL deportistas sinteticos (e4-<n>-$RUNID@example.com) =="
for n in $(seq 1 "$TOTAL"); do
  ST="$(api POST /api/v2/deportistas "{\"nombre\":\"E4 neg $n\",\"email\":\"e4-$n-$RUNID@example.com\"}")"
  if [[ "$ST" == 201 ]]; then jq -r '.deportista.id' "$API_BODY" >>"$IDS_FILE"; else log "Siembra $n fallo HTTP $ST"; fi
  rm -f "$API_BODY"
done
SEMBRADOS="$(wc -l <"$IDS_FILE" | tr -d ' ')"
log "Sembrados: $SEMBRADOS"
[[ "$SEMBRADOS" -gt 0 ]] || { MOTIVO="no se sembro nada"; exit 1; }
sleep 20

# c+d. Borrado legitimo (1/min) y observacion cada 15 s durante 6 min desde el primer borrado
log "== c. Borrado de $SEMBRADOS registros, 1 cada ${INTERVALO}s; d. observacion de la alerta cada ${SONDEO}s =="
mapfile -t LISTA <"$IDS_FILE"
T_PRIMER="$(now)"; T0="$(date -u +%s)"; SIG=0
while :; do
  T=$(( $(date -u +%s) - T0 ))
  if [[ "$SIG" -lt "${#LISTA[@]}" && "$T" -ge $(( SIG * INTERVALO )) ]]; then
    id="${LISTA[$SIG]}"
    if es_protegido "$id"; then
      log "OMITIDO id protegido $id"
    else
      ST="$(api DELETE "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
      CODIGOS+=("$ST"); echo "$(now),delete,$id $ST" >>"$CSV"; log "DELETE $id -> $ST"
      if [[ "$ST" == 200 || "$ST" == 204 || "$ST" == 404 ]]; then BORRADO[$id]=1; fi
    fi
    SIG=$((SIG + 1))
  fi
  EST="$(alerta_estado)"; echo "$(now),alerta,$EST" >>"$CSV"; ESTADOS+="$(now)=$EST "
  if [[ "$EST" == "firing" ]]; then DISPARO=true; T_DISPARO="$(now)"; log "ALERTA FIRING (falso positivo)"; break; fi
  if [[ "$T" -ge "$OBSERVACION" && "$SIG" -ge "${#LISTA[@]}" ]]; then break; fi
  sleep "$SONDEO"
done

# e. Veredicto
if $DISPARO; then
  VEREDICTO="FALLA"; MOTIVO="la alerta se disparo con trafico legitimo bajo el umbral"
else
  VEREDICTO="PASA"; MOTIVO="la alerta nunca paso a firing durante ${OBSERVACION}s con ${#CODIGOS[@]} borrados"
fi
log "Veredicto: $VEREDICTO. $MOTIVO"
[[ "$VEREDICTO" == "PASA" ]]
