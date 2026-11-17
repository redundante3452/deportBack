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
