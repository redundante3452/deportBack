# Chaos gate que falla por umbral (run 44173523895, 2026-11-17)

Objetivo: evidenciar que el pipeline **falla** cuando la métrica objetivo no cumple el umbral y deja el porqué.
Mismo experimento, perfil `perfil-p1-v1` y fallo b; único cambio: `max_p95_ms=20` (umbral deliberadamente
más estricto que el p95 alcanzable en la Ronda 1).

| Ronda | error_rate | p95 (ms) | umbral p95 (ms) | cumple |
|---|---|---|---|---|
| base | 0 | 95,97 | 20 | no |
| ronda0 | 0,5154 | 5030,69 | 20 | no |
| ronda1 | 0 | 30,34 | 20 | no |

Salida del paso "Evaluate chaos gate": `FALLO: Ronda 1 supera el umbral de p95: 30.34476795 ms > 20 ms` → exit 1.

Nota: durante esta ejecución el túnel temporal de Inventario-U estaba caído (DNS sin resolver desde ~14:00 COL),
por eso el estado estable y la Ronda 0 no son comparables con el experimento oficial (`exp-b-20261117`).
Esta ejecución se usa solo como evidencia del comportamiento de la puerta de calidad.
