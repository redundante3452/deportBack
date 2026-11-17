# Carga k6 — perfil fijo `perfil-p1-v1`

`load/k6-flow.js` ejecuta `GET /api/v2/deportistas/:id` (headers `X-Trace-Id` y `X-Api-Key`)
con un perfil declarado en el codigo (`PERFIL_CARGA`). **No se puede cambiar por env**
(`VUS` y `DURATION` ya no tienen efecto), para que Ronda 0 y Ronda 1 usen la misma carga.

| # | Escalon | Duracion | VUs |
|---|---------|----------|-----|
| 1 | Rampa | 30s | 0 -> 5 |
| 2 | Meseta | 1m30s | 5 |
| 3 | Escalon | 30s | 5 -> 10 |
| 4 | Meseta | 1m30s | 10 |
| 5 | Bajada | 30s | 10 -> 0 |

Total: **4m30s**. Cada request lleva tags `perfil=perfil-p1-v1` y `round=<ROUND>`
(`ronda-0`, `ronda-1` o `sin-ronda`).

## Umbrales (configurables por env)

- `http_req_failed`: `rate < MAX_ERROR_RATE` (por defecto 0.01)
- `http_req_duration`: `p(95) < MAX_P95_MS` (por defecto 1000 ms)

## Ejecucion

```bash
k6 run -e BASE_URL=http://host -e DEPORTISTA_ID=1 -e API_KEY=xxx -e ROUND=ronda-0 load/k6-flow.js
```

En el experimento de caos usar `scripts/run-chaos-experiment.sh` (pasa `ROUND=ronda-<N>`).
`chaos/experiments/dependency-unavailable.yaml` tiene `duration: 4m30s`, igual al perfil.
Si se cambia el perfil, subir la version (`perfil-p1-v2`) y ajustar esa duracion.
