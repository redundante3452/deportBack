# Bitácora del game day

Este archivo se completa durante la ejecución real. Las horas deben estar en
UTC y cada fila debe tener un `execution_id`.

| timestamp_utc | execution_id | round | experiment | trace_id | actor | action | resource | signal | status |
|---|---|---:|---|---|---|---|---|---|---|

No se deben rellenar filas con resultados supuestos.
| 2026-11-17T19:14:13Z | gd-exp4-r0-20261117T191413Z | 0 | E4 | gd-exp4-r0 | script | estado estable | deport-back-sql/deportistas | 2 deportistas, backups/PITR off, sin alerta | ok |
| 2026-11-17T19:16:21Z | gd-exp4-r0-20261117T191413Z | 0 | E4 | gd-exp4-r0 | script | inicio ataque T1078+T1485 | deport-back-sql/deportistas | 50 sembrados | ejecutado |
| 2026-11-17T19:16:26Z | gd-exp4-r0-20261117T191413Z | 0 | E4 | gd-exp4-r0 | script | fin ataque | deport-back-sql/deportistas | 50 borrados, 0 bloqueados | ejecutado |
| 2026-11-17T19:26:29Z | gd-exp4-r0-20261117T191413Z | 0 | E4 | gd-exp4-r0 | script | deteccion | deport-back-sql/deportistas | no detectado en 10 min; no contenido; RPO 50 | medido |
| 2026-11-17T19:26:35Z | gd-exp4-r0-20261117T191413Z | 0 | E4 | gd-exp4-r0 | script | reversion | deport-back-sql/deportistas | REVERSION OK | ok |
| 2026-11-17T19:44:46Z | gd-exp4-r1-20261117T194446Z | 1 | E4 | gd-exp4-r1 | script | intento 1: estado estable | deport-back-sql/deportistas | backups/PITR on | ok |
| 2026-11-17T19:48:18Z | gd-exp4-r1-20261117T194446Z | 1 | E4 | gd-exp4-r1 | script | intento 1: inicio ataque | deport-back-sql/deportistas | 20 borrados, 30 x 429 | ejecutado |
| 2026-11-17T19:49:27Z | gd-exp4-r1-20261117T194446Z | 1 | E4 | gd-exp4-r1 | script | intento 1: deteccion | deport-back-sql/deportistas | MTTD 68,3 s; MTTC 1,8 s | medido |
| 2026-11-17T19:59:26Z | gd-exp4-r1-20261117T194446Z | 1 | E4 | gd-exp4-r1 | script | intento 1: recuperacion | deport-back-sql/deportistas | clon agoto espera ~10 min | fallo |
| 2026-11-17T20:02:55Z | gd-exp4-r1-20261117T194446Z | 1 | E4 | gd-exp4-r1 | script | intento 1: reversion | deport-back-sql/deportistas | REVERSION OK | ok |
| 2026-11-17T20:05:22Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | estado estable | deport-back-sql/deportistas | 2 deportistas, backups/PITR on, regla existe | ok |
| 2026-11-17T20:09:41Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | inicio ataque T1078+T1485 | deport-back-sql/deportistas | 50 sembrados; export OK | ejecutado |
| 2026-11-17T20:09:43Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | primer 429 | deport-back-sql/deportistas | MTTC 1,9 s | medido |
| 2026-11-17T20:10:19Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | alerta firing | deport-back-sql/deportistas | MTTD 37,5 s | medido |
| 2026-11-17T20:27:05Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | restauracion | deport-back-sql/deportistas | 20/20; RPO 0; RTO 1043 s | ok |
| 2026-11-17T20:28:25Z | gd-exp4-r1-20261117T200522Z | 1 | E4 | gd-exp4-r1 | script | reversion | deport-back-sql/deportistas | quedan clones (pendiente de borrar) | aviso |

Filas E1-E3: pendiente (Marin/Penuela). No se rellenan con resultados supuestos.
