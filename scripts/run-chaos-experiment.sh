#!/usr/bin/env bash
set -euo pipefail

: "${BASE_URL:?BASE_URL is required}"
: "${DEPORTISTA_ID:?DEPORTISTA_ID is required}"
: "${API_KEY:?API_KEY is required}"
: "${CHAOS_TARGET:?CHAOS_TARGET is required}"

NAMESPACE="${NAMESPACE:-deport-back}"
DEPLOYMENT="${DEPLOYMENT:-deport-back}"
ROUND="${ROUND:-1}"
SUMMARY_FILE="${SUMMARY_FILE:-chaos-round-${ROUND}.json}"
META_FILE="${SUMMARY_FILE%.json}.meta.json"
MANIFEST="${MANIFEST:-chaos/experiments/dependency-unavailable.yaml}"
EXECUTION_ID="${EXECUTION_ID:-$(date -u +%Y%m%dT%H%M%SZ)-${ROUND}}"
CRD="networkchaos.chaos-mesh.org"

if [[ "$ROUND" != "base" && "$ROUND" != "0" && "$ROUND" != "1" ]]; then
  echo "ROUND debe ser base, 0 o 1." >&2
  exit 2
fi

if [[ "${CHAOS_CONFIRM:-false}" != "true" ]]; then
  echo "Modo de validación: exporta CHAOS_CONFIRM=true para afectar GKE." >&2
  echo "BASE_URL=$BASE_URL DEPORTISTA_ID=$DEPORTISTA_ID TARGET=$CHAOS_TARGET ROUND=$ROUND EXECUTION_ID=$EXECUTION_ID"
  exit 0
fi

crd_exists() {
  kubectl get crd "$CRD" >/dev/null 2>&1
}

cleanup() {
  if crd_exists; then
    kubectl delete -f "$MANIFEST" --ignore-not-found
  fi
  kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
    CHAOS_DEPENDENCY_FAILURE=false \
    CHAOS_DEPENDENCY_TARGET= \
    CHAOS_DEPENDENCY_MODE=hang \
    RESILIENCE_CIRCUIT_BREAKER_ENABLED=true
  kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s
}
trap cleanup EXIT

case "$ROUND" in
  base)
    FAILURE=false; TARGET=""; BREAKER=true ;;
  0)
    FAILURE=true; TARGET="$CHAOS_TARGET"; BREAKER=false ;;
  1)
    FAILURE=true; TARGET="$CHAOS_TARGET"; BREAKER=true ;;
esac

kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
  CHAOS_DEPENDENCY_FAILURE="$FAILURE" \
  CHAOS_DEPENDENCY_TARGET="$TARGET" \
  CHAOS_DEPENDENCY_MODE=hang \
  RESILIENCE_CIRCUIT_BREAKER_ENABLED="$BREAKER"
kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s

if [[ "$ROUND" != "base" ]]; then
  if crd_exists; then
    kubectl apply -f "$MANIFEST"
  else
    echo "Chaos Mesh no instalado: inyección solo por interruptor"
  fi
fi

INJECTION_START="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# k6 puede incumplir thresholds (exit 99) sin abortar el script.
set +e
k6 run \
  -e "BASE_URL=$BASE_URL" \
  -e "DEPORTISTA_ID=$DEPORTISTA_ID" \
  -e "API_KEY=$API_KEY" \
  -e "ROUND=ronda-$ROUND" \
  -e "EXECUTION_ID=$EXECUTION_ID" \
  --summary-export "$SUMMARY_FILE" \
  load/k6-flow.js
K6_EXIT=$?
set -e

INJECTION_END="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

BREAKER_LABEL=$([[ "$BREAKER" == "true" ]] && echo on || echo off)
printf '{\n  "execution_id": "%s",\n  "round": "%s",\n  "injection_start_utc": "%s",\n  "injection_end_utc": "%s",\n  "base_url": "%s",\n  "chaos_target": "%s",\n  "breaker": "%s",\n  "k6_exit_code": %s,\n  "trace_id_prefix": "%s"\n}\n' \
  "$EXECUTION_ID" "$ROUND" "$INJECTION_START" "$INJECTION_END" "$BASE_URL" \
  "$TARGET" "$BREAKER_LABEL" "$K6_EXIT" "$EXECUTION_ID" > "$META_FILE"
echo "Metadatos escritos en $META_FILE (k6_exit_code=$K6_EXIT)"

exit 0
