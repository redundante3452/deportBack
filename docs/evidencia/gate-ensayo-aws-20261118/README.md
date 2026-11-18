# Ensayo del chaos gate con Inventario-U en AWS (2026-11-18)

Run 44245765785 (`execution_id=prueba-sslip-20261118`, `chaos_target=sslip.io`, umbrales p95 1000 ms y error 1 %).
Objetivo: comprobar que la demo funciona tras el cambio de Inventario-U a AWS (`*.sslip.io`).

| Ronda | p95 (k6) | Peticiones |
|---|---|---|
| Estado estable | 388,6 ms | 8201 |
| Ronda 0 (sin patrón) | 5052,5 ms (refuta) | 362 |
| Ronda 1 (timeout + breaker + degradación) | 53,6 ms (−98,9 %) | 28 333 |

Veredicto: **Chaos gate aprobado** (la Ronda 1 cumple). Es un ensayo: el experimento oficial sigue siendo `exp-b-20261117`.
