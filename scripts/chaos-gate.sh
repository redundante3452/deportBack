#!/usr/bin/env bash
set -euo pipefail

BASE_SUMMARY="${BASE_SUMMARY:-}"
: "${ROUND0_SUMMARY:?ROUND0_SUMMARY is required}"
: "${ROUND1_SUMMARY:?ROUND1_SUMMARY is required}"
: "${MAX_ERROR_RATE:?MAX_ERROR_RATE is required}"
: "${MAX_P95_MS:?MAX_P95_MS is required}"

# Formato de k6 --summary-export: .metrics.<m>["p(95)"], .metrics.http_req_failed.value
# (con passes/fails, donde "passes" = peticiones fallidas). Fallback a .values.*
read_p95() {
  jq -er '.metrics.http_req_duration as $m
    | ($m["p(95)"] // $m.values["p(95)"]) // error("sin p95")' "$1"
}

read_error() {
  jq -er '.metrics.http_req_failed as $m
    | ($m.value // $m.values.rate
       // (if (($m.passes // 0) + ($m.fails // 0)) > 0
           then ($m.passes / ($m.passes + $m.fails)) else null end))
    // error("sin tasa de error")' "$1"
}

le() { awk -v a="$1" -v b="$2" 'BEGIN { exit !(a <= b) }'; }

pct() { # variacion porcentual de $2 respecto a $1
  awk -v a="$1" -v b="$2" 'BEGIN { if (a == 0) print "n/a"; else printf "%+.1f%%", (b - a) / a * 100 }'
}

yn() { if le "$1" "$2"; then echo "sí"; else echo "no"; fi; }

declare -A ERR P95 OK
rows=""
for entry in "base:$BASE_SUMMARY" "ronda0:$ROUND0_SUMMARY" "ronda1:$ROUND1_SUMMARY"; do
  label="${entry%%:*}"; file="${entry#*:}"
  [[ -z "$file" ]] && continue
  ERR[$label]="$(read_error "$file")"
  P95[$label]="$(read_p95 "$file")"
  e_ok="$(yn "${ERR[$label]}" "$MAX_ERROR_RATE")"
  p_ok="$(yn "${P95[$label]}" "$MAX_P95_MS")"
  if [[ "$e_ok" == "sí" && "$p_ok" == "sí" ]]; then OK[$label]=sí; else OK[$label]=no; fi
  rows+="| $label | ${ERR[$label]} | ${P95[$label]} | $MAX_ERROR_RATE | $MAX_P95_MS | ${OK[$label]} |"$'\n'
done

table="| Ronda | error_rate | p95 (ms) | umbral error | umbral p95 (ms) | cumple |
|---|---|---|---|---|---|
${rows}
Variación ronda 0 -> ronda 1: p95 $(pct "${P95[ronda0]}" "${P95[ronda1]}"), error $(pct "${ERR[ronda0]}" "${ERR[ronda1]}")"

echo "$table"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  { echo "### Chaos gate"; echo; echo "$table"; } >> "$GITHUB_STEP_SUMMARY"
fi

if [[ "${OK[ronda0]}" == "sí" ]]; then
  echo "ADVERTENCIA: la Ronda 0 no refutó la hipótesis: el experimento no evidencia el modo de fallo" >&2
fi

fail=0
if ! le "${ERR[ronda1]}" "$MAX_ERROR_RATE"; then
  echo "FALLO: Ronda 1 supera el umbral de error: ${ERR[ronda1]} > $MAX_ERROR_RATE" >&2
  fail=1
fi
if ! le "${P95[ronda1]}" "$MAX_P95_MS"; then
  echo "FALLO: Ronda 1 supera el umbral de p95: ${P95[ronda1]} ms > $MAX_P95_MS ms" >&2
  fail=1
fi
if [[ "$fail" -ne 0 ]]; then exit 1; fi

echo "Chaos gate aprobado: la Ronda 1 cumple los umbrales."
