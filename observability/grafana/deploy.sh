#!/usr/bin/env bash
# Publica el tablero del experimento de caos en Grafana (Cloud o local) por API.
# Requiere: GRAFANA_URL (p. ej. https://niftyivy3144.grafana.net) y GRAFANA_TOKEN
# (token de service account con rol Editor). Nunca guardes el token en el repo.
set -euo pipefail

: "${GRAFANA_URL:?Define GRAFANA_URL}"
: "${GRAFANA_TOKEN:?Define GRAFANA_TOKEN}"
FOLDER_TITLE="${FOLDER_TITLE:-Caos - Indisponibilidad de dependencia (GCP)}"
DIR="$(cd "$(dirname "$0")" && pwd)"
PY="$(command -v python3 || command -v python)"

"$PY" "$DIR/build_dashboard.py" "$DIR/caos-deport-back.json"

api() { curl -fsS -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" "$@"; }

FOLDER_UID="$(api "$GRAFANA_URL/api/folders" | "$PY" -c "
import json,sys
t=sys.argv[1]
print(next((f['uid'] for f in json.load(sys.stdin) if f['title']==t),''))" "$FOLDER_TITLE")"

if [[ -z "$FOLDER_UID" ]]; then
  BODY="$("$PY" -c "import json,sys;print(json.dumps({'title':sys.argv[1]}))" "$FOLDER_TITLE")"
  FOLDER_UID="$(api -X POST "$GRAFANA_URL/api/folders" -d "$BODY" \
    | "$PY" -c "import json,sys;print(json.load(sys.stdin)['uid'])")"
fi

"$PY" -c "
import json,sys
d=json.load(open(sys.argv[1],encoding='utf-8'))
print(json.dumps({'dashboard':d,'folderUid':sys.argv[2],'overwrite':True,'message':'deploy.sh'}))" \
  "$DIR/caos-deport-back.json" "$FOLDER_UID" \
  | api -X POST "$GRAFANA_URL/api/dashboards/db" --data-binary @-
echo
echo "Tablero publicado: $GRAFANA_URL/d/caos-deport-back-b"
