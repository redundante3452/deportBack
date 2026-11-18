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


RED, ORANGE, PURPLE, BLUE = "#F2495C", "#FF9830", "#B877D9", "#5794F2"


def ts(pid, title, target, x, y, w, h, desc, no_value, color):
    return {
        "id": pid, "type": "timeseries", "title": title, "description": desc,
        "datasource": DS, "gridPos": {"x": x, "y": y, "w": w, "h": h}, "targets": [target],
        "fieldConfig": {"defaults": {
            "unit": "short", "decimals": 0, "min": 0, "noValue": no_value,
            "color": {"mode": "fixed", "fixedColor": color},
            "custom": {"drawStyle": "bars", "lineWidth": 1, "fillOpacity": 70, "showPoints": "never",
                       "spanNulls": False, "axisSoftMin": 0, "barAlignment": 0},
        }, "overrides": []},
        "options": {"legend": {"displayMode": "list", "placement": "bottom", "showLegend": False},
                    "tooltip": {"mode": "single", "sort": "none"}},
    }


def stat(pid, title, target, x, y, w, h, desc, no_value, color):
    return {
        "id": pid, "type": "stat", "title": title, "description": desc, "transparent": True,
        "datasource": DS, "gridPos": {"x": x, "y": y, "w": w, "h": h}, "targets": [target],
        "fieldConfig": {"defaults": {
            "unit": "short", "decimals": 0, "noValue": no_value,
            "color": {"mode": "thresholds"},
            "thresholds": {"mode": "absolute", "steps": [{"color": color, "value": None}]},
        }, "overrides": []},
        "options": {"reduceOptions": {"calcs": ["sum"], "fields": "", "values": False},
                    "colorMode": "value", "graphMode": "none", "textMode": "value", "justifyMode": "center",
                    "orientation": "auto"},
    }


def text(pid, title, md, x, y, w, h):
    return {"id": pid, "type": "text", "title": title, "gridPos": {"x": x, "y": y, "w": w, "h": h},
            "options": {"mode": "markdown", "content": md}}


RESULTADOS = """**E4 — resiliencia de datos (Cloud SQL).** Ataque simulado: borrado masivo de 50 deportistas sintéticos `e4-*` con credencial válida (ATT&CK **T1078** + **T1485**). Mismo ataque en las dos rondas.

| Métrica | Ronda 0 (controles de partida) | Ronda 1 (con mejoras) | R1 repetición (18-nov) |
|---|---|---|---|
| Borrados | **50 / 50** | **20 / 50** (30 × HTTP 429) | **20 / 50** (30 × HTTP 429) |
| **MTTD** (detección) | **No detectado en 10 min** (no había alerta) | **37,5 s** (alerta Grafana firing 20:10:19) | **128,7 s** (alerta firing 03:14:23) |
| **MTTC** (contención) | **No contenido** | **1,9 s** (primer 429 a las 20:09:43) | **1,5 s** |
| **RPO** (datos perdidos) | **50 registros (100 %)** | **0** (20/20 restaurados) | **0** (20/20 restaurados) |
| **RTO** (recuperación) | **No recuperable** (sin backups ni PITR) | **1043 s** (~17 min; casi todo es crear el clon PITR) | **1311 s** (clon borrado automáticamente) |
| Cobertura de detección | **0 / 2** | **1 / 2** (T1485 detectada; T1078 no distinguible con clave compartida) | **1 / 2** (igual que R1) |
| Falsos positivos | n/a (la regla no existía) | **0 de 4 disparos** (2 fueron reversiones propias autorizadas) | no recalculado |

**Honeytoken** (deportista señuelo con alerta): acceso 21:16:19, alerta firing 21:17:22, **MTTD 63,4 s**, 0 falsos positivos.

**Marcos** (verificados en `security/verificacion-marcos.md`): ATT&CK **T1078**, **T1485**. D3FEND: **D3-RAPA** (límite de borrados por llamador), **D3-RD** Restore Database (clon PITR), **D3-RO** Restore Object (copia en bucket), **D3-DO** Decoy Object (honeytoken).

**Nota:** el panel de 429 aparece vacío en R0/R1: el filtro de la métrica `mass-delete-blocked` se corrigió después de R1 (deploy 44177083535) y las métricas log-based no son retroactivas. La R1 repetición (enlace arriba, 18-nov 03:12 UTC) sí muestra los 30 × 429. Evidencia R1: `docs/evidencia/e4-r1-20261117/ataque-r1.csv`; repetición: `docs/evidencia/e4-r1-repeticion-20261118/`.

**Hallazgo R1:** el límite es en memoria por pod (2 réplicas), por eso pasaron 20 borrados y no 10; mejora: contador compartido."""

CRONO = """**Línea de tiempo (UTC, 2026-11-17 y repetición del 2026-11-18).**

- **R0** — ataque 19:16:21–19:16:26: 50/50 borrados, sin alerta.
- **R1 intento 1** — ataque 19:48:18, alerta firing 19:49:27; la reversión borró 30 a las 20:00:38. La recuperación falló (el clon superó el tiempo del cliente); corregido con clon asíncrono.
- **R1** — ataque 20:09:41–20:09:46, alerta 20:10:19, restauración lista 20:27:05, reversión 20:28:22.
- **Honeytoken** — acceso 21:16:19, alerta 21:17:22.
- **R1 repetición (2026-11-18)** — ataque 03:12:15–03:12:19, alerta 03:14:23 (MTTD 128,7 s), restauración PITR 20/20 03:34:37 (RTO 1311 s), reversión 03:42:42. Caso negativo del intento 1 invalidado a las 03:45:27 (alerta por la reversión previa).

Las barras de los paneles son eventos reales de Cloud Logging (métricas basadas en logs). Las anotaciones marcan cada hito; los enlaces de arriba saltan a cada ronda."""

NOTE429 = "El filtro de la métrica mass-delete-blocked se corrigió después de R1 (deploy 44177083535) y las métricas basadas en logs no son retroactivas: R0/R1 no tienen datos. La R1 repetición (enlace arriba, 18-nov 03:12 UTC) sí muestra los 30 × 429. Evidencia R1: docs/evidencia/e4-r1-20261117/ataque-r1.csv"
NV429 = "Sin 429: el límite solo está activo durante la R1 (ver 'R1 repetición')"

panels = [
    stat(1, "Borrados en el rango", q("A", "deport-back-deportistas-deleted", "borrados"), 0, 0, 4, 5,
         "Suma de eventos deportista_deleted en el rango. Incluye las reversiones del propio script. Preocupa si crece sin una operación planificada.",
         "0", RED),
    stat(2, "Bloqueados 429 en el rango", q("A", "deport-back-mass-delete-blocked", "bloqueados"), 4, 0, 4, 5,
         "Suma de security_mass_delete_blocked: borrados frenados por el límite. " + NOTE429, NV429, ORANGE),
    stat(3, "Accesos al señuelo", q("A", "deport-back-honeytoken-triggered", "accesos"), 8, 0, 4, 5,
         "Suma de security_honeytoken_triggered. Cualquier valor mayor que 0 es sospechoso: nadie legítimo usa el señuelo.",
         "0", PURPLE),
    {"id": 7, "type": "alertlist", "title": "Estado de las alertas",
     "description": "Reglas de la carpeta Seguridad - Game day. Firing significa que la detección disparó; Normal, que está armada y en reposo.",
     "gridPos": {"x": 12, "y": 0, "w": 12, "h": 5},
     "options": {"viewMode": "list", "groupMode": "default", "groupBy": [], "maxItems": 5, "sortOrder": 1,
                 "dashboardAlerts": False, "alertName": "", "showInstances": False,
                 "folder": {"title": "Seguridad - Game day"},
                 "stateFilter": {"firing": True, "pending": True, "noData": True, "normal": True, "error": True}}},
    ts(4, "Borrados por minuto", q("A", "deport-back-deportistas-deleted", "borrados"), 0, 5, 8, 8,
       "Evento deportista_deleted. R0: 50 en 5 s. R1: 20 (el resto bloqueado). Incluye las reversiones del propio script.",
       "Sin borrados en el rango", RED),
    ts(5, "Bloqueados (429) por minuto", q("A", "deport-back-mass-delete-blocked", "bloqueados"), 8, 5, 8, 8,
       "Evento security_mass_delete_blocked: el límite de borrados por llamador actuando. " + NOTE429,
       NV429, ORANGE),
    ts(6, "Accesos al señuelo por minuto", q("A", "deport-back-honeytoken-triggered", "accesos"), 16, 5, 8, 8,
       "Evento security_honeytoken_triggered: lectura, modificación o borrado del deportista señuelo.",
       "Sin accesos en el rango", PURPLE),
    text(8, "Resultados: Ronda 0 vs Ronda 1", RESULTADOS, 0, 13, 16, 15),
    text(9, "Cronología", CRONO, 16, 13, 8, 15),
]

RANGOS = [
    ("R0 (19:12-19:30)", "2026-11-17T19:12:00.000Z", "2026-11-17T19:30:00.000Z"),
    ("R1 intento 1 (19:44-20:04)", "2026-11-17T19:44:00.000Z", "2026-11-17T20:04:00.000Z"),
    ("R1 (20:04-20:35)", "2026-11-17T20:04:00.000Z", "2026-11-17T20:35:00.000Z"),
    ("Honeytoken (21:10-21:30)", "2026-11-17T21:10:00.000Z", "2026-11-17T21:30:00.000Z"),
    ("R1 repetición (18-nov 03:05-03:50)", "2026-11-18T03:05:00.000Z", "2026-11-18T03:50:00.000Z"),
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
    "graphTooltip": 1,
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
    ("2026-11-18T03:12:15Z", "2026-11-18T03:12:19Z", "R1 repetición ataque: 20 borrados, 30 x 429"),
    ("2026-11-18T03:14:23Z", None, "R1 repetición: alerta E4 firing (MTTD 128,7 s)"),
    ("2026-11-18T03:34:37Z", None, "R1 repetición: restauración PITR 20/20 (RTO 1311 s)"),
    ("2026-11-18T03:42:42Z", None, "R1 repetición: reversión borró 50 (actividad propia)"),
    ("2026-11-18T03:45:27Z", None, "Caso negativo intento 1 invalidado: alerta por la reversión previa"),
]

out = sys.argv[1]
with open(out, "w", encoding="utf-8") as fh:
    json.dump(dashboard, fh, ensure_ascii=False, indent=2)
with open(out.replace(".json", "-anotaciones.json"), "w", encoding="utf-8") as fh:
    json.dump([{"inicio": a, "fin": b, "texto": t} for a, b, t in HITOS], fh, ensure_ascii=False, indent=2)
print("ok", out)
