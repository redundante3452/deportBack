# E4 - Resiliencia de datos (borrado masivo con credencial valida)

## Hipotesis de control

Dado el control C tal como esta configurado hoy (ronda 0: sin backups ni PITR, sin limite de borrados;
ronda 1: backups + PITR, export a bucket con retencion no bloqueada, alerta de borrado masivo y limite de
borrados por clave), cuando ocurra la condicion adversa A (borrado masivo de deportistas con una credencial
valida, ATT&CK T1078 Valid Accounts + T1485 Data Destruction; IDs **pendientes de marcar como "verificado en
attack.mitre.org"**), esperamos la senal S (alerta `E4 - Borrado masivo de deportistas` en Grafana, metrica
`deport-back-deportistas-deleted` > 10 en 1 min) en <= T1 = 5 min y la contencion (HTTP 429) en <= T2 = 2 min.

## Metricas

| Metrica | Como se mide |
|---|---|
| MTTD | primer sondeo (cada 15 s, maximo 10 min) con la alerta firing en Grafana menos `T_ataque_inicio`. Sin Grafana: "deteccion no medible". |
| MTTC | hora del primer HTTP 429 menos `T_ataque_inicio`. Sin 429: "no contenido". |
| RPO | registros borrados que no se pudieron restaurar (ronda 0: el 100 %); ventana PITR = 1 s antes del ataque. |
| RTO | `T_rec_fin` - `T_ataque_inicio` (clon PITR + copia de filas + verificacion por API). Sin copia: no recuperable. |

Salidas en `RESULT_DIR` (por defecto `resultados/e4`): `bitacora-r<ronda>.md` (horas UTC),
`resultado-r<ronda>.json`, `ataque-r<ronda>.csv`, ids usados. trace_id: `gd-exp4-r<ronda>-<YYYYmmddTHHMMSSZ>`.

## Radio de impacto

Solo 50 registros sinteticos `e4-<n>-<runid>@example.com` creados por el propio script; el ataque borra unicamente
esos ids. Los deportistas del flujo (`296f5b48-...`, `a2809c60-...`) estan fuera del radio y se verifican al revertir.
La restauracion solo inserta (`ON CONFLICT DO NOTHING`) las filas borradas del lote.

## Condiciones de aborto

- Falla la siembra o el conteo de deportistas del flujo cambia.
- Un id del flujo deja de responder 200.
- El clon no llega a RUNNABLE en 20 min.
- Cualquier operador puede ejecutar `parar.sh` (corta el ataque y revierte).

## Reversion

`revertir.sh` (tambien en `trap EXIT`): restaura `SECURITY_DELETE_LIMIT_ENABLED` al valor previo, borra los
registros `e4-*` restantes, borra clones `deport-back-sql-e4-clone-*`, verifica los ids del flujo e imprime
`REVERSION OK` (o falla). El export en el bucket debe poder eliminarse al destruir la infraestructura
(retencion **no bloqueada**).

## Como ejecutar

Local (requiere `jq`, `curl`, `gcloud`, `kubectl`, `psql`, `cloud-sql-proxy` v2 en el PATH):

```bash
export BASE_URL=http://34.16.0.136 API_KEY=... PROJECT=deport-back
export GRAFANA_URL=... GRAFANA_TOKEN=... E4_BUCKET=...   # opcionales
RONDA=0 bash security/experiments/e4-datos/ejecutar.sh
bash security/experiments/e4-datos/parar.sh      # si hay que cortar
bash security/experiments/e4-datos/revertir.sh
```

Por workflow: `gh workflow run gameday-e4.yml -f ronda=0 -f accion=iniciar` (acciones: iniciar | parar | revertir).
No ejecutar mientras corre otro experimento ni desplegar durante la ronda.

## Que cambia entre ronda 0 y 1

| | Ronda 0 | Ronda 1 |
|---|---|---|
| Backups / PITR | apagados (estado de partida) | activos |
| Control de borrados (429 > 10/min) | apagado | `SECURITY_DELETE_LIMIT_ENABLED=true` |
| Alerta de borrado masivo | medida igual | medida igual |
| Copia aislada (export a bucket) | no | si, si hay `E4_BUCKET` |
| Recuperacion | no recuperable (RPO = 100 %) | clon PITR + restauracion parcial |
