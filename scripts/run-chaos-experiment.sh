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
MANIFEST="${MANIFEST:-chaos/experiments/dependency-unavailable.yaml}"

if [[ "$ROUND" != "0" && "$ROUND" != "1" ]]; then
  echo "ROUND debe ser 0 o 1." >&2
  exit 2
fi

if [[ "${CHAOS_CONFIRM:-false}" != "true" ]]; then
  echo "Modo de validación: exporta CHAOS_CONFIRM=true para afectar GKE." >&2
  echo "BASE_URL=$BASE_URL DEPORTISTA_ID=$DEPORTISTA_ID TARGET=$CHAOS_TARGET"
  exit 0
fi

cleanup() {
  kubectl delete -f "$MANIFEST" --ignore-not-found
  kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
    CHAOS_DEPENDENCY_FAILURE=false \
    CHAOS_DEPENDENCY_TARGET= \
    RESILIENCE_CIRCUIT_BREAKER_ENABLED=true
  kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s
}
trap cleanup EXIT

if [[ "$ROUND" == "0" ]]; then
  kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
    CHAOS_DEPENDENCY_FAILURE=true \
    CHAOS_DEPENDENCY_TARGET="$CHAOS_TARGET" \
    RESILIENCE_CIRCUIT_BREAKER_ENABLED=false
else
  kubectl -n "$NAMESPACE" set env deployment/"$DEPLOYMENT" \
    CHAOS_DEPENDENCY_FAILURE=true \
    CHAOS_DEPENDENCY_TARGET="$CHAOS_TARGET" \
    RESILIENCE_CIRCUIT_BREAKER_ENABLED=true
fi
kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" --timeout=180s

kubectl apply -f "$MANIFEST"
k6 run \
  -e "BASE_URL=$BASE_URL" \
  -e "DEPORTISTA_ID=$DEPORTISTA_ID" \
  -e "API_KEY=$API_KEY" \
  --summary-export "$SUMMARY_FILE" \
  load/k6-flow.js
