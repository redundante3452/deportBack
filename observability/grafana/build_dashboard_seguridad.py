"""Genera el tablero de Grafana de Ciberseguridad (game day E4 + honeytoken, GCP).

Uso: python build_dashboard_seguridad.py <salida.json>
Genera <salida.json> (tablero) y <salida>-anotaciones.json (hitos para la API de anotaciones).
Las cifras salen de docs/evidencia/ (e4-r0, e4-r1-intento1, e4-r1, honeytoken, alertas-historial).
El panel de alertas se filtra por el titulo de la carpeta; deploy-tablero-seguridad.sh le inyecta el uid real.
"""
import json
import sys

DS = {"type": "stackdriver", "uid": "gcp-deport-back"}
PROJECT = "deport-back"
U = "logging.googleapis.com/user/"


def q(ref, metric, alias):
    return {
        "refId": ref,
        "datasource": DS,
        "queryType": "timeSeriesList",
        "aliasBy": alias,
        "timeSeriesList": {
            "projectName": PROJECT,
            "filters": ["metric.type", "=", U + metric],
            "perSeriesAligner": "ALIGN_DELTA",
            "crossSeriesReducer": "REDUCE_SUM",
            "alignmentPeriod": "+60s",
            "groupBys": [],
            "view": "FULL",
        },
    }


def ts(pid, title, target, x, y, w, h, desc, no_value, color):
    return {
        "id": pid, "type": "timeseries", "title": title, "description": desc,
        "datasource": DS, "gridPos": {"x": x, "y": y, "w": w, "h": h}, "targets": [target],
        "fieldConfig": {"defaults": {
            "unit": "short", "noValue": no_value, "color": {"mode": "fixed", "fixedColor": color},
            "custom": {"drawStyle": "bars", "lineWidth": 1, "fillOpacity": 60, "spanNulls": False},
        }, "overrides": []},
        "options": {"legend": {"displayMode": "list", "placement": "bottom"}, "tooltip": {"mode": "multi"}},
    }


def text(pid, title, md, x, y, w, h):
    return {"id": pid, "type": "text", "title": title, "gridPos": {"x": x, "y": y, "w": w, "h": h},
            "options": {"mode": "markdown", "content": md}}


RESULTADOS = """**E4 — resiliencia de datos (Cloud SQL).** Ataque simulado: borrado masivo de 50 deportistas sintéticos `e4-*` con credencial válida (ATT&CK **T1078** + **T1485**). Mismo ataque en las dos rondas.

| Métrica | Ronda 0 (controles de partida) | Ronda 1 (con mejoras) |
|---|---|---|
| Borrados | **50 / 50** | **20 / 50** (30 × HTTP 429) |
| **MTTD** (detección) | **No detectado en 10 min** (no había alerta) | **37,5 s** (alerta Grafana firing 20:10:19) |
| **MTTC** (contención) | **No contenido** | **1,9 s** (primer 429 a las 20:09:43) |
| **RPO** (datos perdidos) | **50 registros (100 %)** | **0** (20/20 restaurados) |
| **RTO** (recuperación) | **No recuperable** (sin backups ni PITR) | **1043 s** (~17 min; casi todo es crear el clon PITR) |
| Cobertura de detección | **0 / 2** | **1 / 2** (T1485 detectada; T1078 no distinguible con clave compartida) |
| Falsos positivos | n/a (la regla no existía) | **0 de 4 disparos** (2 fueron reversiones propias autorizadas) |

**Honeytoken** (deportista señuelo con alerta): acceso 21:16:19, alerta firing 21:17:22, **MTTD 63,4 s**, 0 falsos positivos.

**Marcos** (verificados en `security/verificacion-marcos.md`): ATT&CK **T1078**, **T1485**. D3FEND: **D3-RAPA** (límite de borrados por llamador), **D3-RD** Restore Database (clon PITR), **D3-RO** Restore Object (copia en bucket), **D3-DO** Decoy Object (honeytoken).

**Nota:** el panel de 429 aparece vacío en R1: el filtro de la métrica `mass-delete-blocked` usaba un evento inexistente hasta el deploy 44177083535 (posterior a R1) y las métricas log-based no son retroactivas. Los 30 × 429 de R1 están en `docs/evidencia/e4-r1-20261117/ataque-r1.csv`.

**Hallazgo R1:** el límite es en memoria por pod (2 réplicas), por eso pasaron 20 borrados y no 10; mejora: contador compartido."""

CRONO = """**Línea de tiempo (UTC, 2026-11-17).**

- **R0** — ataque 19:16:21–19:16:26: 50/50 borrados, sin alerta.
- **R1 intento 1** — ataque 19:48:18, alerta firing 19:49:27; la reversión borró 30 a las 20:00:38. La recuperación falló (el clon superó el tiempo del cliente); corregido con clon asíncrono.
- **R1** — ataque 20:09:41–20:09:46, alerta 20:10:19, restauración lista 20:27:05, reversión 20:28:22.
- **Honeytoken** — acceso 21:16:19, alerta 21:17:22.

Las barras de los paneles son eventos reales de Cloud Logging (métricas basadas en logs). Las anotaciones marcan cada hito; los enlaces de arriba saltan a cada ronda."""

panels = [
    {"id": 1, "type": "row", "title": "Game day E4 y honeytoken — resultados (deport-back · GCP)", "collapsed": False,
     "gridPos": {"x": 0, "y": 0, "w": 24, "h": 1}, "panels": []},
    text(2, "Resultados: Ronda 0 vs Ronda 1", RESULTADOS, 0, 1, 15, 18),
    text(3, "Cronología", CRONO, 15, 1, 9, 18),
    ts(4, "Borrados de deportistas por minuto", q("A", "deport-back-deportistas-deleted", "borrados"), 0, 19, 12, 8,
       "Evento deportista_deleted. R0: 50 en 5 s. R1: 20 (el resto bloqueado). Incluye las reversiones del propio script.",
       "Sin borrados en el rango", "red"),
    ts(5, "Borrados bloqueados (HTTP 429) por minuto", q("A", "deport-back-mass-delete-blocked", "bloqueados"), 12, 19, 12, 8,
       "Evento security_mass_delete_blocked: el límite de borrados por llamador actuando (solo en R1). Sin datos en R0/R1: el filtro de la métrica estaba mal (evento inexistente) y se corrigió después de R1 (deploy 44177083535); las métricas log-based no son retroactivas. Evidencia de los 30 × 429 de R1: docs/evidencia/e4-r1-20261117/ataque-r1.csv",
       "Sin datos en R0/R1: el filtro de la métrica estaba mal (evento inexistente) y se corrigió después de R1 (deploy 44177083535); las métricas log-based no son retroactivas. Evidencia de los 30 × 429 de R1: docs/evidencia/e4-r1-20261117/ataque-r1.csv", "orange"),
    ts(6, "Accesos al señuelo (honeytoken)", q("A", "deport-back-honeytoken-triggered", "accesos"), 0, 27, 12, 8,
       "Evento security_honeytoken_triggered: lectura, modificación o borrado del deportista señuelo.",
       "Sin accesos en el rango", "purple"),
    {"id": 7, "type": "alertlist", "title": "Estado actual de las alertas (carpeta Seguridad - Game day)",
     "gridPos": {"x": 12, "y": 27, "w": 12, "h": 8},
     "options": {"viewMode": "list", "groupMode": "default", "groupBy": [], "maxItems": 20, "sortOrder": 1,
                 "dashboardAlerts": False, "alertName": "", "showInstances": False,
                 "folder": {"title": "Seguridad - Game day"},
                 "stateFilter": {"firing": True, "pending": True, "noData": True, "normal": True, "error": True}}},
]

RANGOS = [
    ("R0 (19:12-19:30)", "2026-11-17T19:12:00.000Z", "2026-11-17T19:30:00.000Z"),
    ("R1 intento 1 (19:44-20:04)", "2026-11-17T19:44:00.000Z", "2026-11-17T20:04:00.000Z"),
    ("R1 (20:04-20:35)", "2026-11-17T20:04:00.000Z", "2026-11-17T20:35:00.000Z"),
    ("Honeytoken (21:10-21:30)", "2026-11-17T21:10:00.000Z", "2026-11-17T21:30:00.000Z"),
]

dashboard = {
    "uid": "seguridad-game-day-e4",
    "title": "Seguridad - Game day E4 (GCP)",
    "tags": ["seguridad", "e4", "honeytoken", "deport-back", "gcp"],
    "timezone": "utc",
    "schemaVersion": 39,
    "editable": True,
    "time": {"from": "2026-11-17T19:00:00.000Z", "to": "2026-11-17T21:35:00.000Z"},
    "refresh": "",
    "annotations": {"list": [{
        "builtIn": 1, "datasource": {"type": "grafana", "uid": "-- Grafana --"}, "enable": True, "hide": False,
        "iconColor": "rgba(255, 96, 96, 1)", "name": "Hitos del game day", "type": "dashboard"}]},
    "links": [{"title": t, "type": "link", "icon": "dashboard", "keepTime": False, "targetBlank": False,
               "url": f"/d/seguridad-game-day-e4?from={a}&to={b}"} for t, a, b in RANGOS],
    "panels": panels,
}

# Hitos (UTC) tomados de docs/evidencia: (inicio, fin o None, texto)
HITOS = [
    ("2026-11-17T19:16:21Z", "2026-11-17T19:16:26Z", "R0 ataque: 50/50 borrados, sin detección"),
    ("2026-11-17T19:48:18Z", "2026-11-17T19:48:23Z", "R1 intento 1 ataque: 20 borrados, 30 x 429"),
    ("2026-11-17T19:49:27Z", None, "R1 intento 1: alerta E4 firing"),
    ("2026-11-17T20:00:38Z", None, "R1 intento 1: reversión borró 30 (actividad propia)"),
    ("2026-11-17T20:09:41Z", "2026-11-17T20:09:46Z", "R1 ataque: 20 borrados, 30 x 429"),
    ("2026-11-17T20:10:19Z", None, "R1: alerta E4 firing (MTTD 37,5 s)"),
    ("2026-11-17T20:27:05Z", None, "R1: restauración PITR lista, 20/20 (RTO 1043 s)"),
    ("2026-11-17T20:28:22Z", None, "R1: reversión borró 50 (actividad propia)"),
    ("2026-11-17T21:16:19Z", None, "Honeytoken: acceso al señuelo"),
    ("2026-11-17T21:17:22Z", None, "Honeytoken: alerta firing (MTTD 63,4 s)"),
]

out = sys.argv[1]
with open(out, "w", encoding="utf-8") as fh:
    json.dump(dashboard, fh, ensure_ascii=False, indent=2)
with open(out.replace(".json", "-anotaciones.json"), "w", encoding="utf-8") as fh:
    json.dump([{"inicio": a, "fin": b, "texto": t} for a, b, t in HITOS], fh, ensure_ascii=False, indent=2)
print("ok", out)
