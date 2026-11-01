#!/usr/bin/env bash
set -euo pipefail

: "${STABLE_URL:?STABLE_URL is required}"
: "${CANARY_URL:?CANARY_URL is required}"

SAMPLE_SIZE="${CANARY_SAMPLE_SIZE:-20}"
MAX_ERROR_RATE="${CANARY_MAX_ERROR_RATE:-0}"
MAX_LATENCY_MS="${CANARY_MAX_LATENCY_MS:-1000}"
INJECT_FAILURE="${CANARY_INJECT_FAILURE:-false}"

measure() {
  local url="$1"
  local expected_track="$2"
  local failures=0
  local total_ms=0
  local i status duration version track
  local failure_header=()

  if [[ "$expected_track" == "canary" && "$INJECT_FAILURE" == "true" ]]; then
    failure_header=(-H "X-Canary-Failure: true")
  fi

  for ((i = 1; i <= SAMPLE_SIZE; i++)); do
    local headers_file response
    headers_file="$(mktemp)"
    response="$(
      curl --silent --show-error --max-time 30 \
        -H "X-Canary-Probe: true" \
        "${failure_header[@]}" \
        -D "$headers_file" \
        -o /dev/null \
        -w '%{http_code} %{time_total}' \
        "$url"
    )"
    read -r status duration <<<"$response"
    version="$(awk -F': ' 'tolower($1) == "x-app-version" { gsub("\r", "", $2); print $2 }' "$headers_file")"
    track="$(awk -F': ' 'tolower($1) == "x-app-track" { gsub("\r", "", $2); print $2 }' "$headers_file")"
    rm -f "$headers_file"

    duration=$(awk -v seconds="$duration" 'BEGIN { printf "%.0f", seconds * 1000 }')
    total_ms=$((total_ms + duration))

    if [[ "$status" -ge 400 || "$track" != "$expected_track" ]]; then
      failures=$((failures + 1))
    fi

    if [[ "$expected_track" == "canary" && "$version" != "v3" ]]; then
      failures=$((failures + 1))
    fi
    if [[ "$expected_track" == "stable" && "$version" != "v2" ]]; then
      failures=$((failures + 1))
    fi
  done

  local error_rate average_ms
  error_rate=$(awk -v failures="$failures" -v total="$SAMPLE_SIZE" 'BEGIN { printf "%.4f", failures / total }')
  average_ms=$((total_ms / SAMPLE_SIZE))
  printf '%s failures=%s/%s error_rate=%s average_ms=%s\n' \
    "$expected_track" "$failures" "$SAMPLE_SIZE" "$error_rate" "$average_ms"

  awk -v actual="$error_rate" -v maximum="$MAX_ERROR_RATE" 'BEGIN { exit !(actual <= maximum) }'
  (( average_ms <= MAX_LATENCY_MS ))
}

measure "$STABLE_URL" stable
measure "$CANARY_URL" canary
