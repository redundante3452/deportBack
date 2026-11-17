#!/usr/bin/env bash
# Publica (upsert) las reglas de alerta del grupo e4-seguridad (E4 + honeytoken) en Grafana por la API de provisioning.
# Requiere GRAFANA_URL y GRAFANA_TOKEN (service account Editor). Nunca guardes el token en el repo.
# Umbral: >= 10 borrados en 5 min (el limite de la Ronda 1 deja pasar 10/min; ventana de 5 min
# para no partir el ataque entre dos buckets de 1 min).
set -euo pipefail
: "${GRAFANA_URL:?Define GRAFANA_URL}"
: "${GRAFANA_TOKEN:?Define GRAFANA_TOKEN}"
FOLDER_TITLE="${FOLDER_TITLE:-Seguridad - Game day}"
GROUP="e4-seguridad"
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="${GRAFANA_URL%/}"

api() { curl -fsS -H "Authorization: Bearer $GRAFANA_TOKEN" -H "Content-Type: application/json" -H "X-Disable-Provenance: true" "$@"; }

FOLDER_UID="$(api "$URL/api/folders" | jq -r --arg t "$FOLDER_TITLE" '[.[] | select(.title==$t) | .uid][0] // ""')"
if [[ -z "$FOLDER_UID" ]]; then
  FOLDER_UID="$(api -X POST "$URL/api/folders" -d "$(jq -n --arg t "$FOLDER_TITLE" '{title:$t}')" | jq -r .uid)"
fi
echo "Carpeta: $FOLDER_TITLE ($FOLDER_UID)"

jq -s --arg f "$FOLDER_UID" --arg g "$GROUP"   '{title:$g, interval:30, rules:(map(. + {folderUID:$f}))}' "$DIR/alerta-e4.json" "$DIR/alerta-honeytoken.json"   | api -X PUT "$URL/api/v1/provisioning/folder/$FOLDER_UID/rule-groups/$GROUP" --data-binary @- >/dev/null
echo "Reglas publicadas (grupo $GROUP, evaluacion cada 30 s): E4 - Borrado masivo de deportistas; Honeytoken - acceso a deportista senuelo"
