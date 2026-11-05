#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${APP_NAME:?APP_NAME is required}"

BAKE_SECONDS="${CANARY_BAKE_SECONDS:-60}"
START_CANARY_PERCENT="${CANARY_START_PERCENT:-0}"
SERVICE_JSON="$(gcloud run services describe "$APP_NAME" --project="$GCP_PROJECT_ID" --region="$GCP_REGION" --format=json)"
STABLE_URL="$(jq -r '.status.traffic[] | select(.tag=="stable") | .url' <<<"$SERVICE_JSON")"
CANARY_URL="$(jq -r '.status.traffic[] | select(.tag=="canary") | .url' <<<"$SERVICE_JSON")"
export STABLE_URL CANARY_URL

if [[ -z "$STABLE_URL" || -z "$CANARY_URL" || "$STABLE_URL" == "null" || "$CANARY_URL" == "null" ]]; then
  echo "No se pudieron obtener las URLs tagged stable/canary." >&2
  exit 1
fi

rollback() {
  echo "Quality gate falló; rollback a stable=100 y canary=0."
  gcloud run services update-traffic "$APP_NAME" \
    --project="$GCP_PROJECT_ID" \
    --region="$GCP_REGION" \
    --to-tags="stable=100,canary=0" || true
}

trap rollback ERR

case "$START_CANARY_PERCENT" in
  0) stages=(0 10 25 50 100) ;;
  10) stages=(10 25 50 100) ;;
  25) stages=(25 50 100) ;;
  50) stages=(50 100) ;;
  100) stages=(100) ;;
  *)
    echo "CANARY_START_PERCENT debe ser 0, 10, 25, 50 o 100." >&2
    exit 1
    ;;
esac

for canary_percent in "${stages[@]}"; do
  stable_percent=$((100 - canary_percent))
  echo "Etapa canary: stable=${stable_percent}% canary=${canary_percent}%"
  gcloud run services update-traffic "$APP_NAME" \
    --project="$GCP_PROJECT_ID" \
    --region="$GCP_REGION" \
    --to-tags="stable=${stable_percent},canary=${canary_percent}"

  bash scripts/canary-quality-gate.sh

  if (( canary_percent < 100 )); then
    echo "Bake time: ${BAKE_SECONDS}s"
    sleep "$BAKE_SECONDS"
  fi
done

trap - ERR
echo "Canary promovido al 100%."
