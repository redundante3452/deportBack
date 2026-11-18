# Historial de alertas desde 2026-11-18 03:00 UTC

Exportado con el workflow `grafana-historial-alertas.yml` (run 44240070495, solo lectura, API `rules/history`).

| UTC | Transición (E4 - Borrado masivo) | Causa |
|---|---|---|
| 03:14:10 | Normal (NoData) → Alerting | Ataque de la R1 repetición (MTTD 128,7 s) |
| 03:18:10 | Alerting → Normal | Resolución |
| 03:45:10 | Normal (NoData) → Alerting | Reversión propia de la repetición (50 borrados): falso positivo conocido |
| 03:49:10 | Alerting → Normal | Resolución |

Durante el caso negativo, intento 2 (03:53:58–04:00:34), la regla no pasó a Alerting. En la interfaz de
Grafana aparecen además cambios Normal ↔ "Normal (NoData)" (03:52, 03:56, 04:05): sin borrados en la
ventana la métrica basada en logs no tiene datos y la regla lo trata como OK (`noDataState: OK`); no son errores.
