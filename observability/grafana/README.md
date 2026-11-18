# Tablero del experimento de caos (deport-back)

Tablero de Grafana del **fallo b — indisponibilidad de Inventario-U**, definido como código.
Muestra a la vez la ventana de inyección (anotaciones) y la métrica objetivo en las dos rondas,
y el circuit breaker actuando.

- Publicado: <https://niftyivy3144.grafana.net/d/caos-deport-back-b>
- Fuente de datos: **Google Cloud Monitoring**, uid `gcp-deport-back`. Usa el service account
  `grafana-reader` del proyecto `deport-back`, con rol `roles/monitoring.viewer` (solo lectura).
- Métricas: métricas basadas en logs definidas en `terraform/monitoring.tf`.

| Archivo | Para qué |
|---|---|
| `build_dashboard.py` | Genera el JSON del tablero (fuente de verdad) |
| `caos-deport-back.json` | Tablero generado, `uid` estable `caos-deport-back-b` |
| `deploy.sh` | Publica el tablero por API |

## Publicar

```bash
export GRAFANA_URL=https://niftyivy3144.grafana.net
export GRAFANA_TOKEN=...   # token de service account (Editor); nunca en el repo
bash observability/grafana/deploy.sh
```

## Paneles

| Panel | Requisito de la rúbrica |
|---|---|
| Resultados k6 (estable / Ronda 0 / Ronda 1) | Comparación de las dos rondas |
| Latencia p95 frente al umbral de 1000 ms | Métrica objetivo y ventana de inyección |
| Throughput | Mecanismo del fallo (VUs bloqueados en la Ronda 0) |
| Fallos de dependencia por tipo | Patrón actuando (`timeout` → `circuit_open`) |
| Aperturas del circuit breaker | Patrón actuando |
| Errores 5xx | Guardarraíl (debe ser 0) |

Las ventanas de inyección se cargan como anotaciones del tablero desde los `*.meta.json`
del chaos gate (`docs/evidencia/<execution_id>/`).

## Añadir un panel

1. Añade una llamada a `ts(...)` en la lista `panels` de `build_dashboard.py`.
2. Usa una métrica existente en `terraform/monitoring.tf`, o créala ahí primero.
3. Vuelve a ejecutar `deploy.sh`.

## Tablero de seguridad (game day E4 + honeytoken)

Tablero aparte del de caos DevOps: `seguridad-game-day-e4` ("Seguridad - Game day E4 (GCP)", carpeta "Seguridad - Game day").
Resultados R0 vs R1 (MTTD, MTTC, RPO, RTO, cobertura, falsos positivos), borrados por minuto, borrados bloqueados (429),
accesos al señuelo, estado de las alertas y anotaciones de cada hito (etiqueta `e4-tablero`, idempotentes).

- Código: `build_dashboard_seguridad.py` genera `dashboard-seguridad.json` y `dashboard-seguridad-anotaciones.json`.
- Publicar: workflow manual `grafana-tablero-seguridad.yml` (usa `GRAFANA_TOKEN`; verifica tablero, anotaciones y una consulta real al datasource) o `GRAFANA_URL=... GRAFANA_TOKEN=... bash deploy-tablero-seguridad.sh`.
- Las cifras y horas (UTC, 2026-11-17) salen de `docs/evidencia/e4-*`, `honeytoken-20261117` y `alertas-historial-20261117`.
