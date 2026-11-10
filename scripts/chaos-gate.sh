#!/usr/bin/env bash
set -euo pipefail

: "${ROUND0_SUMMARY:?ROUND0_SUMMARY is required}"
: "${ROUND1_SUMMARY:?ROUND1_SUMMARY is required}"
: "${MAX_ERROR_RATE:?MAX_ERROR_RATE is required}"
: "${MAX_P95_MS:?MAX_P95_MS is required}"

read_metric() {
  local summary="$1"
  local metric="$2"
  jq -er ".metrics[\"$metric\"].values[\"$3\"] // error" "$summary"
}

check_round() {
  local label="$1"
  local summary="$2"
  local error_rate p95

  error_rate="$(read_metric "$summary" http_req_failed rate)"
  p95="$(read_metric "$summary" http_req_duration 'p(95)')"

  printf '%s error_rate=%s p95_ms=%s\n' "$label" "$error_rate" "$p95"

  awk -v actual="$error_rate" -v maximum="$MAX_ERROR_RATE" \
    'BEGIN { exit !(actual <= maximum) }'
  awk -v actual="$p95" -v maximum="$MAX_P95_MS" \
    'BEGIN { exit !(actual <= maximum) }'
}

check_round "round0" "$ROUND0_SUMMARY"
check_round "round1" "$ROUND1_SUMMARY"

echo "Chaos gate aprobado: ambas rondas cumplen los umbrales."
