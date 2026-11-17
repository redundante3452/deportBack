#!/usr/bin/env bash
# E4 - Resiliencia de datos: borrado masivo con credencial valida sobre un lote sintetico.
# Uso: RONDA=0|1 BASE_URL=... API_KEY=... [GRAFANA_URL GRAFANA_TOKEN E4_BUCKET] ./ejecutar.sh [ronda]
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
RESULT_DIR="${RESULT_DIR:-$(pwd)/resultados/e4}"
: "${API_KEY:?API_KEY es obligatorio}"
# shellcheck source=lib.sh
source ./lib.sh
[[ "$RONDA" == 0 || "$RONDA" == 1 ]] || { echo "RONDA debe ser 0 o 1" >&2; exit 2; }
export RESULT_DIR RONDA

RUN_TS="$(date -u +%Y%m%dT%H%M%SZ)"
RUNID="r${RONDA}$(date -u +%H%M%S)"
EXECUTION_ID="gd-exp4-r${RONDA}-${RUN_TS}"
TRACE_ID="$EXECUTION_ID"
export TRACE_ID
echo $$ >"$RESULT_DIR/ejecutar.pid"
IDS_FILE="$RESULT_DIR/ids-r${RONDA}.txt"
: >"$IDS_FILE"
echo "# Bitacora E4 ronda $RONDA ($EXECUTION_ID)" >"$BITACORA"

limpieza() {
  local rc=$?
  trap - EXIT
  log "Limpieza final (trap EXIT, codigo original $rc)"
  bash ./revertir.sh || log "AVISO: revertir.sh fallo en la limpieza"
  rm -f "$RESULT_DIR/ejecutar.pid"
  exit "$rc"
}
trap limpieza EXIT
trap 'exit 143' TERM INT

TOTAL=50
DEL=0; BLOQ=0; OTROS=0
T_PRIMER_429=""; T_DETECCION=""; T_REC_INICIO=""; T_REC_FIN=""
MTTD="null"; MTTC="null"; RTO="null"; RPO="null"; RESTAURADOS=0
DETECTADO=false; CONTENIDO=false
PITR_PUNTO=""; VENTANA_RPO_S="null"
CLON=""; PROXY_PID=""

# ---- a. Estado estable
log "== a. Estado estable =="
CONTEO_INICIAL="$(contar_deportistas)"
log "Deportistas (API): $CONTEO_INICIAL"
DBINFO="$(gcloud sql instances describe "$SQL_INSTANCE" --project "$PROJECT" --format=json)"
BACKUPS="$(jq -r '.settings.backupConfiguration.enabled // false' <<<"$DBINFO")"
PITR="$(jq -r '.settings.backupConfiguration.pointInTimeRecoveryEnabled // false' <<<"$DBINFO")"
log "Backups=$BACKUPS PITR=$PITR"
CONTROL_PREVIO=""
if command -v kubectl >/dev/null 2>&1; then CONTROL_PREVIO="$(control_actual)"; fi
[[ "$CONTROL_PREVIO" == "true" ]] || CONTROL_PREVIO=false
echo "$CONTROL_PREVIO" >"$RESULT_DIR/control-previo.txt"
log "Control SECURITY_DELETE_LIMIT_ENABLED previo: $CONTROL_PREVIO"
set +e; regla_existe; RE=$?; set -e
case $RE in 0) log "Regla de alerta '$ALERT_TITLE': existe";; 1) log "Regla de alerta: NO existe";; *) log "Regla de alerta: deteccion no medible (sin GRAFANA_URL/GRAFANA_TOKEN)";; esac
if alerta_firing; then
  log "AVISO: la alerta ya esta firing antes del ataque; esperando hasta 5 min a que se resuelva"
  for _ in $(seq 1 20); do sleep 15; alerta_firing || break; done
fi

# ---- b. Control segun ronda
if [[ "$RONDA" == 1 ]]; then
  log "== b. Ronda 1: activando control de contencion =="
  fijar_control true
  [[ "$PITR" == true ]] || log "AVISO: ronda 1 sin PITR activo: no habra recuperacion por clon"
else
  log "== b. Ronda 0: control desactivado =="
  [[ "$(control_actual)" == "true" ]] && fijar_control false
fi

# ---- c. Siembra
log "== c. Siembra de $TOTAL registros sinteticos =="
for n in $(seq 1 "$TOTAL"); do
  ST="$(api POST /api/v2/deportistas "{\"nombre\":\"E4 sintetico $n\",\"email\":\"e4-$n-$RUNID@example.com\"}")"
  if [[ "$ST" == 201 ]]; then jq -r '.deportista.id' "$API_BODY" >>"$IDS_FILE"; else log "Siembra $n fallo HTTP $ST"; fi
  rm -f "$API_BODY"
done
SEMBRADOS="$(wc -l <"$IDS_FILE" | tr -d ' ')"
T_SIEMBRA_FIN="$(now)"
log "Sembrados: $SEMBRADOS. T_siembra_fin=$T_SIEMBRA_FIN"
[[ "$SEMBRADOS" -gt 0 ]] || { log "No se sembro nada; abortando"; exit 1; }

# Copia aislada (solo ronda 1 con bucket): se exporta ANTES del ataque
EXPORT_URI=""
if [[ "$RONDA" == 1 && -n "${E4_BUCKET:-}" ]]; then
  EXPORT_URI="gs://${E4_BUCKET}/e4/${RUNID}.sql.gz"
  log "Exportando copia aislada a $EXPORT_URI"
  gcloud sql export sql "$SQL_INSTANCE" "$EXPORT_URI" --database=deport_db --project "$PROJECT" --quiet \
    && log "Export OK" || { log "AVISO: export fallo"; EXPORT_URI=""; }
elif [[ "$RONDA" == 1 ]]; then
  log "AVISO: sin E4_BUCKET, se omite la copia aislada"
fi
log "Espera de 120 s (log de transacciones posterior a la siembra para el PITR)"
sleep 120

# ---- d. Ataque
log "== d. Ataque: borrado masivo con credencial valida (ATT&CK T1078 + T1485) =="
T_ATAQUE_INICIO="$(now)"; E_ATAQUE_INICIO="$(epoch)"
ESTADO="$RESULT_DIR/ataque-r${RONDA}.csv"
echo "hora_utc,id,status" >"$ESTADO"
: >"$RESULT_DIR/ids-borrados-r${RONDA}.txt"
while read -r id; do
  [[ -z "$id" ]] && continue
  ST="$(api DELETE "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
  echo "$(now),$id,$ST" >>"$ESTADO"
  case "$ST" in
    200|204) DEL=$((DEL + 1)); echo "$id" >>"$RESULT_DIR/ids-borrados-r${RONDA}.txt" ;;
    429) BLOQ=$((BLOQ + 1)); if [[ -z "$T_PRIMER_429" ]]; then T_PRIMER_429="$(now)"; E_429="$(epoch)"; fi ;;
    *) OTROS=$((OTROS + 1)) ;;
  esac
done <"$IDS_FILE"
T_ATAQUE_FIN="$(now)"
log "Ataque fin $T_ATAQUE_FIN: borrados=$DEL bloqueados(429)=$BLOQ otros=$OTROS"

# ---- e. Deteccion
log "== e. Deteccion (hasta 10 min, cada 15 s) =="
set +e
if [[ -z "${GRAFANA_URL:-}" || -z "${GRAFANA_TOKEN:-}" ]]; then
  log "deteccion no medible (sin GRAFANA_URL/GRAFANA_TOKEN)"
  DETECCION_MEDIBLE=false
else
  DETECCION_MEDIBLE=true
  LIMITE=$(( $(date -u +%s) + 600 ))
  while [[ $(date -u +%s) -lt $LIMITE ]]; do
    if alerta_firing; then T_DETECCION="$(now)"; E_DET="$(epoch)"; break; fi
    sleep 15
  done
  if [[ -n "$T_DETECCION" ]]; then
    DETECTADO=true
    MTTD="$(awk -v a="$E_DET" -v b="$E_ATAQUE_INICIO" 'BEGIN{printf "%.1f", a-b}')"
    log "Detectado en $T_DETECCION. MTTD=${MTTD}s (resolucion de sondeo 15 s)"
  else
    log "no detectado en 10 min"
  fi
fi
set -e

# ---- f. Contencion
if [[ -n "$T_PRIMER_429" ]]; then
  CONTENIDO=true
  MTTC="$(awk -v a="$E_429" -v b="$E_ATAQUE_INICIO" 'BEGIN{printf "%.1f", a-b}')"
  log "Contenido: primer 429 en $T_PRIMER_429. MTTC=${MTTC}s"
else
  log "no contenido (ningun 429)"
fi

# ---- g. Recuperacion
log "== g. Recuperacion =="
if [[ "$DEL" -eq 0 ]]; then
  RPO=0; log "Nada que recuperar (0 borrados)"
elif [[ "$BACKUPS" != true && "$PITR" != true ]]; then
  RPO="$DEL"
  log "sin copia: RPO = perdida de $DEL registros (100 % de los borrados); RTO = no recuperable"
elif [[ "$PITR" == true ]]; then
  T_REC_INICIO="$(now)"
  PITR_PUNTO="$(date -u -d "$T_ATAQUE_INICIO - 1 second" +%Y-%m-%dT%H:%M:%SZ)"
  CLON="deport-back-sql-e4-clone-r${RONDA}-$(date -u +%H%M)"
  log "Clonando a $PITR_PUNTO -> $CLON"
  gcloud sql instances clone "$SQL_INSTANCE" "$CLON" --point-in-time="$PITR_PUNTO" --project "$PROJECT" --quiet --async  # el cliente corta a los ~10 min; el estado se sondea abajo
  for _ in $(seq 1 120); do
    EST="$(gcloud sql instances describe "$CLON" --project "$PROJECT" --format='value(state)' 2>/dev/null || true)"
    [[ "$EST" == RUNNABLE ]] && break
    sleep 20
  done
  [[ "$EST" == RUNNABLE ]] || { log "El clon no llego a RUNNABLE"; exit 1; }
  REGION="$(jq -r '.region' <<<"$DBINFO")"
  PGPASSWORD="$(gcloud secrets versions access latest --secret=deport-back-db-password --project "$PROJECT")"
  export PGPASSWORD
  cloud-sql-proxy "${PROJECT}:${REGION}:${SQL_INSTANCE}?port=5441" "${PROJECT}:${REGION}:${CLON}?port=5442" >"$RESULT_DIR/proxy.log" 2>&1 &
  PROXY_PID=$!
  sleep 8
  LISTA="$(sed "s/.*/'&'/" "$RESULT_DIR/ids-borrados-r${RONDA}.txt" | paste -sd, -)"
  psql "host=127.0.0.1 port=5442 user=deport_user dbname=deport_db" -At -v ON_ERROR_STOP=1 -c \
    "SELECT format('INSERT INTO deportistas (id,nombre,email,nivel,\"creadoEn\") VALUES (%L,%L,%L,%L,%L) ON CONFLICT (id) DO NOTHING;', id,nombre,email,nivel,\"creadoEn\") FROM deportistas WHERE id IN ($LISTA)" \
    >"$RESULT_DIR/restore-r${RONDA}.sql"
  log "Filas a restaurar desde el clon: $(wc -l <"$RESULT_DIR/restore-r${RONDA}.sql" | tr -d ' ')"
  psql "host=127.0.0.1 port=5441 user=deport_user dbname=deport_db" -v ON_ERROR_STOP=1 -f "$RESULT_DIR/restore-r${RONDA}.sql" >/dev/null
  kill "$PROXY_PID" 2>/dev/null || true; PROXY_PID=""
  T_REC_FIN="$(now)"
  while read -r id; do
    ST="$(api GET "/api/v2/deportistas/$id")"; rm -f "$API_BODY"
    [[ "$ST" == 200 ]] && RESTAURADOS=$((RESTAURADOS + 1))
  done <"$RESULT_DIR/ids-borrados-r${RONDA}.txt"
  RPO=$((DEL - RESTAURADOS))
  RTO="$(( $(date -u -d "$T_REC_FIN" +%s) - $(date -u -d "$T_ATAQUE_INICIO" +%s) ))"
  VENTANA_RPO_S=1
  log "Restaurados $RESTAURADOS/$DEL. RPO=$RPO registros (ventana PITR 1 s antes del ataque). RTO=${RTO}s"
  borrar_clones
else
  RPO="$DEL"
  log "Backups sin PITR: no implementado en este script; RPO=$DEL"
fi

# Inmutabilidad de la copia aislada
if [[ -n "$EXPORT_URI" ]]; then
  log "Retencion del bucket: $(gcloud storage buckets describe "gs://${E4_BUCKET}" --format='json(retention_policy,versioning)' 2>&1 | tr -d '\n')"
  if gcloud storage rm "$EXPORT_URI" >"$RESULT_DIR/intento-borrado-export.log" 2>&1; then
    log "El borrado del export SE PERMITIO (no hay inmutabilidad efectiva)"
  else
    log "Borrado del export DENEGADO (inmutabilidad evidenciada): $(tr -d '\n' <"$RESULT_DIR/intento-borrado-export.log" | cut -c1-300)"
  fi
fi

# ---- h. Resultado
jq -n --arg exec "$EXECUTION_ID" --argjson ronda "$RONDA" \
  --arg ti "$T_ATAQUE_INICIO" --arg tf "$T_ATAQUE_FIN" --arg ts "$T_SIEMBRA_FIN" \
  --arg t429 "$T_PRIMER_429" --arg tdet "$T_DETECCION" --arg trec "$T_REC_INICIO" --arg trecf "$T_REC_FIN" \
  --arg pitrp "$PITR_PUNTO" \
  --argjson sem "$SEMBRADOS" --argjson del "$DEL" --argjson bloq "$BLOQ" \
  --argjson mttd "$MTTD" --argjson mttc "$MTTC" --argjson rpo "${RPO:-null}" --argjson rto "$RTO" \
  --argjson rest "$RESTAURADOS" --argjson det "$DETECTADO" --argjson cont "$CONTENIDO" \
  --argjson bk "$BACKUPS" --argjson pitr "$PITR" \
  '{execution_id:$exec,ronda:$ronda,t_siembra_fin:$ts,t_ataque_inicio:$ti,t_ataque_fin:$tf,
    t_primer_429:(if $t429=="" then null else $t429 end),t_deteccion:(if $tdet=="" then null else $tdet end),
    t_recuperacion_inicio:(if $trec=="" then null else $trec end),t_recuperacion_fin:(if $trecf=="" then null else $trecf end),
    punto_pitr:(if $pitrp=="" then null else $pitrp end),
    total_sembrados:$sem,borrados:$del,bloqueados:$bloq,mttd_s:$mttd,mttc_s:$mttc,
    rpo_registros:$rpo,rto_s:$rto,restaurados:$rest,detectado:$det,contenido:$cont,backups:$bk,pitr:$pitr}' \
  >"$RESULT_DIR/resultado-r${RONDA}.json"
log "Resultado escrito en $RESULT_DIR/resultado-r${RONDA}.json"
