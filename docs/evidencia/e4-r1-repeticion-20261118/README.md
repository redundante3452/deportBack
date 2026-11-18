# E4 Ronda 1 - repeticion (reproducibilidad)

Workflow "Game Day E4", run 44228119507, execution_id `gd-exp4-r1-20261118T030801Z` (2026-11-18 UTC). Mismas mejoras y mismo procedimiento que la R1 del 17-nov (`../e4-r1-20261117/`).

## Resultado

- Siembra de 50 registros sinteticos (03:09:57Z) + export aislado `gs://deport-back-e4-copias-542943328704/e4/r1030801.sql.gz`.
- Ataque 03:12:15Z-03:12:19Z (borrado masivo con credencial valida, T1078 + T1485): **20 borrados, 30 x 429**.
- **MTTD 128,7 s** (alerta Grafana firing 03:14:23Z). **MTTC 1,5 s** (primer 429 03:12:16Z).
- Recuperacion: clon PITR `deport-back-sql-e4-clone-r1-0314` a 03:12:14Z -> **20/20 restaurados, RPO 0, RTO 1311 s**.
- El clon tuvo operaciones pendientes ~6 min (12 esperas de 30 s) y se **borro automaticamente** (valida el fix de `borrar_clones`).
- El `rm` del export dejo la version retenida (versionado + retencion de 6 h); el mensaje del script ya es el correcto (`versiones-export.txt`).
- Reversion 03:42:42Z: restauro `SECURITY_DELETE_LIMIT_ENABLED=false` y elimino 50 sinteticos por API (03:44:03Z, REVERSION OK).

## Cloud Monitoring (confirmacion, dato aportado por el orquestador)

- Metrica `mass-delete-blocked`: 13 + 17 = 30 a las 03:13 UTC (primera vez con datos en el tablero).
- Metrica `deportistas-deleted`: 10 + 10 = 20 (limite por pod en memoria, 2 replicas).

## Comparacion con la R1 del 17-nov

| Metrica | R1 (17-nov, 20:09 UTC) | Repeticion (18-nov, 03:12 UTC) |
|---|---|---|
| Borrados / bloqueados (429) | 20 / 30 | 20 / 30 |
| MTTD | 37,5 s | 128,7 s |
| MTTC | 1,9 s | 1,5 s |
| Restaurados | 20/20 | 20/20 |
| RPO | 0 | 0 |
| RTO | 1043 s | 1311 s |

Nota sobre el MTTD mayor: la deteccion depende de la ingesta de la metrica basada en logs, la evaluacion de la regla cada 30 s y el sondeo del script cada 15 s. Contencion, recuperacion y RPO se reprodujeron.

## Archivos

`bitacora-r1.md`, `resultado-r1.json`, `ataque-r1.csv`, `ids-r1.txt`, `ids-borrados-r1.txt`, `control-previo.txt`, `versiones-export.txt`, `intento-borrado-export.log`, `proxy.log`, `restore-r1.sql`.
