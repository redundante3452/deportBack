#!/usr/bin/env bash
# Publica el tablero de Seguridad (game day E4 + honeytoken) en Grafana por API y carga sus anotaciones.
# Requiere GRAFANA_URL y GRAFANA_TOKEN (service account Editor). Nunca guardes el token en el repo.
# Idempotente: sobrescribe el tablero y reemplaza las anotaciones con la etiqueta e4-tablero.
set -euo pipefail
: "${GRAFANA_URL:?Define GRAFANA_URL}"
: "${GRAFANA_TOKEN:?Define GRAFANA_TOKEN}"
FOLDER_TITLE="${FOLDER_TITLE:-Seguridad - Game day}"
UID_TABLERO="seguridad-game-day-e4"
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="${GRAFANA_URL%/}"
PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys' >/dev/null 2>&1; then PY="$c"; break; fi
done
[[ -n "$PY" ]] || { echo "No se encontro Python" >&2; exit 1; }

"$PY" "$DIR/build_dashboard_seguridad.py" "$DIR/dashboard-seguridad.json"

api() { curl -fsS --retry 6 --retry-delay 5 --retry-all-errors -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" "$@"; }

FOLDER_UID="$(api "$URL/api/folders" | jq -r --arg t "$FOLDER_TITLE" '[.[] | select(.title==$t) | .uid][0] // ""')"
if [[ -z "$FOLDER_UID" ]]; then
  FOLDER_UID="$(api -X POST "$URL/api/folders" -d "$(jq -n --arg t "$FOLDER_TITLE" '{title:$t}')" | jq -r .uid)"
fi
echo "Carpeta: $FOLDER_TITLE ($FOLDER_UID)"

jq --arg f "$FOLDER_UID" '{dashboard: (.panels |= map(if .type=="alertlist" then .options.folder = {uid:$f, title:"Seguridad - Game day"} else . end)),
    folderUid:$f, overwrite:true, message:"deploy-tablero-seguridad.sh"}' "$DIR/dashboard-seguridad.json" \
  | api -X POST "$URL/api/dashboards/db" --data-binary @- | jq '{status, uid, url}'

# Anotaciones idempotentes: borra las previas con la etiqueta e4-tablero y crea las nuevas
DASH_ID="$(api "$URL/api/dashboards/uid/$UID_TABLERO" | jq -r .dashboard.id)"
for id in $(api "$URL/api/annotations?dashboardUID=$UID_TABLERO&tags=e4-tablero&limit=1000" | jq -r '.[].id'); do
  api -X DELETE "$URL/api/annotations/$id" >/dev/null
done
N=0
while IFS= read -r a; do
  ini="$(jq -r .inicio <<<"$a")"; fin="$(jq -r '.fin // .inicio' <<<"$a")"
  ms() { "$PY" -c "import sys,datetime as d;print(int(d.datetime.strptime(sys.argv[1],'%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=d.timezone.utc).timestamp()*1000))" "$1"; }
  jq -n --arg uid "$UID_TABLERO" --arg t "$(jq -r .texto <<<"$a")" --argjson s "$(ms "$ini")" --argjson e "$(ms "$fin")" \
    '{dashboardUID:$uid, time:$s, timeEnd:$e, text:$t, tags:["e4","e4-tablero"]}' \
    | api -X POST "$URL/api/annotations" --data-binary @- >/dev/null
  sleep 2
  N=$((N+1))
done < <(jq -c '.[]' "$DIR/dashboard-seguridad-anotaciones.json")
echo "Anotaciones creadas: $N"
echo "Anotaciones con etiqueta e4-tablero en el tablero (inicio-fin UTC):"
api "$URL/api/annotations?dashboardUID=$UID_TABLERO&tags=e4-tablero&limit=1000"   | jq -r 'sort_by(.time)[] | "\(.time/1000|todate) -> \(.timeEnd/1000|todate) | \(.text)"'
echo "Tablero publicado: $URL/d/$UID_TABLERO"
