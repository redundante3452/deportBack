# Evidencia — experimento b (indisponibilidad de dependencia) · deport-back

- Run del chaos gate: https://github.com/redundante3452/deportBack/actions/runs/44024828423 (resultado: **aprobado**)
- execution_id: `exp-b-20261117` (`-base`, `-r0`, `-r1`); trace ids `exp-b-20261117-<ronda>-<vu>-<iter>`
- Objetivo: GKE `http://34.16.0.136`, `GET /api/v2/deportistas/296f5b48-cada-460d-9b8b-fd5dc2ac972e`
- Fallo: `CHAOS_DEPENDENCY_FAILURE=true`, `CHAOS_DEPENDENCY_MODE=hang`, objetivo `trycloudflare` (Inventario-U `/api/v2/skus`), durante toda la ronda (4 m 30 s)
- Perfil de carga: `perfil-p1-v1` (k6, escalones 5→10 VUs, 4 m 30 s), idéntico en las tres mediciones
- Hipótesis: p95 < 1000 ms (guardarraíl: error < 1 %)

| Medición | Breaker | Ventana UTC | p95 | mediana | máx. | error HTTP | peticiones | req/s |
|---|---|---|---|---|---|---|---|---|
| Estado estable | on | 05:34:34–05:39:04 | 291 ms | 205 ms | 1525 ms | 0 % | 8172 | 30,3 |
| Ronda 0 | **off** | 05:40:12–05:44:45 | **5126 ms** | 5045 ms | 5247 ms | 0 % | 362 | 1,3 |
| Ronda 1 | **on** | 05:46:38–05:51:08 | **50 ms** | 48 ms | 5276 ms | 0 % | 30708 | 113,7 |

- Variación p95: estado estable → Ronda 0 **+1660 %**; Ronda 0 → Ronda 1 **−99,0 %**.
- Ronda 0 **refuta** la hipótesis (5126 ms ≥ 1000 ms). Ronda 1 la **cumple** (50 ms).

## Fallos de dependencia registrados (Cloud Logging, `dependency_failure`, inventario-u)

| Ronda | Timeout (5 s, caos hang) | Circuito abierto (rechazo rápido) |
|---|---|---|
| Ronda 0 | 361 | 0 |
| Ronda 1 | 60 | 30 640 |

## Lectura

- **Modo de fallo (Ronda 0):** saturación por timeout demasiado largo. Cada petición espera los 5 s del timeout hacia Inventario-U; el throughput cae de 30,3 a 1,3 req/s porque los VUs quedan bloqueados. No hay errores HTTP: la degradación responde 200 pero tarde.
- **Patrón actuando (Ronda 1):** tras 3 fallos el circuito se abre y las llamadas se rechazan en el acto; cada 30 s (cooldown) vuelve a probar y vuelve a abrir (60 timeouts = sondeos). El p95 queda incluso por debajo del estado estable porque **se omite la llamada a Inventario-U**: el 100 % de las respuestas de la Ronda 1 son **degradadas** (`apis_externas.inventario_u` con error). Es el compromiso del patrón: disponibilidad y latencia a cambio de una respuesta parcial.
- El máximo de 5276 ms en la Ronda 1 corresponde a esos sondeos tras cada cooldown.
