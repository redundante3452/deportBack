"""Genera el dashboard de Grafana del experimento b (deport-back, GCP).

Uso: python build_dashboard.py <salida.json>
El JSON resultante es el "dashboard como código" que se versiona en el repo.
"""
import json
import sys

DS = {"type": "stackdriver", "uid": "gcp-deport-back"}
PROJECT = "deport-back"


def q(ref, metric, aligner, reducer, group_bys=None, resource="k8s_container", extra=None, alias=None):
    filters = ["metric.type", "=", metric, "AND", "resource.type", "=", resource]
    if extra:
        filters += ["AND"] + extra
    t = {
        "refId": ref,
        "datasource": DS,
        "queryType": "timeSeriesList",
        "timeSeriesList": {
            "projectName": PROJECT,
            "filters": filters,
            "perSeriesAligner": aligner,
            "crossSeriesReducer": reducer,
            "alignmentPeriod": "+60s",
            "groupBys": group_bys or [],
            "view": "FULL",
        },
    }
    if alias:
        t["aliasBy"] = alias
    return t


def ts(pid, title, targets, x, y, w=12, h=8, unit="short", desc="", threshold=None, bars=False, no_value=None):
    p = {
        "id": pid,
        "type": "timeseries",
        "title": title,
        "description": desc,
        "datasource": DS,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "targets": targets,
        "fieldConfig": {
            "defaults": {
                "unit": unit,
                "custom": {
                    "drawStyle": "bars" if bars else "line",
                    "lineWidth": 2,
                    "fillOpacity": 15,
                    "spanNulls": False,
                },
            },
            "overrides": [],
        },
        "options": {"legend": {"displayMode": "list", "placement": "bottom"}, "tooltip": {"mode": "multi"}},
    }
    if no_value is not None:
        p["fieldConfig"]["defaults"]["noValue"] = no_value
    if threshold is not None:
        p["fieldConfig"]["defaults"]["thresholds"] = {
            "mode": "absolute",
            "steps": [{"color": "green", "value": None}, {"color": "red", "value": threshold}],
        }
        p["fieldConfig"]["defaults"]["custom"]["thresholdsStyle"] = {"mode": "line+area"}
    return p


def text(pid, title, md, x, y, w, h):
    return {
        "id": pid,
        "type": "text",
        "title": title,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "options": {"mode": "markdown", "content": md},
    }


def row(pid, title, y):
    return {"id": pid, "type": "row", "title": title, "collapsed": False, "gridPos": {"x": 0, "y": y, "w": 24, "h": 1}, "panels": []}


U = "logging.googleapis.com/user/"

RESULTADOS = """**Métrica objetivo:** p95 extremo a extremo de `GET /api/v2/deportistas/:id` medido por **k6** (cliente), umbral **< 1000 ms**.
Mismo perfil `perfil-p1-v1` (4 m 30 s, 5→10 VUs), mismo fallo, misma duración en cada ejecución.

| Ejecución | Medición | Breaker | p95 (k6) | Error HTTP | req/s |
|---|---|---|---|---|---|
| **Oficial** `exp-b-20261117` | Estado estable | on | 291 ms | 0 % | 30,3 |
| | **Ronda 0** | **off** | **5126 ms** ❌ refuta | 0 % | 1,3 |
| | **Ronda 1** | **on** | **50 ms** ✅ cumple | 0 % | 113,7 |
| **Ensayo** `ensayo-b-20261117` | Estado estable | on | 259 ms | 0 % | 32,9 |
| | **Ronda 0** | **off** | **5027 ms** ❌ refuta | 0 % | 1,3 |
| | **Ronda 1** | **on** | **31 ms** ✅ cumple | 0,01 % | 172,5 |

Variación p95 R0 → R1: **−99,0 %** (oficial) y **−99,4 %** (ensayo). Ambos chaos gates **aprobados**.
En la Ronda 1 casi todas las respuestas son **degradadas** (`circuit_open`): el patrón cambia completitud por latencia.
Evidencia: `docs/evidencia/` en el repo. Usa los enlaces de arriba para ir a cada ejecución."""

FALLO = """**Fallo b — indisponibilidad de dependencia.** Interruptor `CHAOS_DEPENDENCY_FAILURE=true`, modo `hang`, objetivo Inventario-U (`/api/v2/skus`).
**Radio de impacto:** solo el deployment `deport-back` en GKE. **Patrones:** timeout 5 s · circuit breaker (3 fallos, 30 s) · degradación.
Las franjas sombreadas son las ventanas de inyección (anotaciones con `execution_id`)."""

panels = [
    row(1, "Experimento b — indisponibilidad de Inventario-U (deport-back · GCP)", 0),
    text(2, "Resultados k6: oficial y ensayo", RESULTADOS, 0, 1, 14, 12),
    text(3, "Experimento", FALLO, 14, 1, 10, 12),
    ts(4, "Latencia p95 en el servidor (GKE)",
       [q("A", U + "deport-back-http-latency-by-track", "ALIGN_DELTA", "REDUCE_PERCENTILE_95", alias="p95 servidor (buckets lineales, tope 2000 ms)"),
        q("B", U + "deport-back-http-latency-exp", "ALIGN_DELTA", "REDUCE_PERCENTILE_95", alias="p95 servidor (buckets exponenciales)")],
       0, 13, unit="ms", threshold=1000,
       desc="p95 de duration_ms de los logs http_request en GKE. La serie lineal satura en 2000 ms (en la Ronda 0 oficial el real fue ~5000 ms según k6); la exponencial (desde el ensayo) muestra la cola completa."),
    ts(5, "Throughput (peticiones/s)",
       [q("A", U + "deport-back-http-requests-by-track", "ALIGN_RATE", "REDUCE_SUM", alias="req/s")],
       12, 13, unit="reqps",
       desc="En la Ronda 0 cae a ~1 req/s: los VUs de k6 quedan bloqueados 5 s por petición (timeout demasiado largo)."),
    ts(6, "Fallos de dependencia por tipo",
       [q("A", U + "deport-back-dependency-failures", "ALIGN_RATE", "REDUCE_SUM", group_bys=["metric.label.error_type"], alias="{{metric.label.error_type}}")],
       0, 21, unit="reqps", no_value="Sin eventos en el rango (métrica disponible desde 2026-11-17 06:00 UTC)",
       desc="timeout = espera completa a la dependencia; circuit_open = rechazo rápido del circuit breaker. Disponible desde la corrección de logs JSON (ejecuciones posteriores al experimento oficial)."),
    ts(7, "Aperturas del circuit breaker",
       [q("A", U + "deport-back-circuit-breaker-opened", "ALIGN_DELTA", "REDUCE_SUM", alias="aperturas")],
       12, 21, unit="short", bars=True, no_value="Sin aperturas en el rango (métrica disponible desde 2026-11-17 06:00 UTC)",
       desc="Evento circuit_breaker_opened (al tercer fallo consecutivo). Disponible desde la corrección de logs JSON."),
    ts(8, "Errores HTTP 5xx (peticiones/s)",
       [q("A", U + "deport-back-http-errors-by-track", "ALIGN_RATE", "REDUCE_SUM", alias="5xx/s")],
       0, 29, w=24, unit="reqps", no_value="0",
       desc="Debe ser 0: la degradación responde 200 con apis_externas.inventario_u en error."),
]

dashboard = {
    "uid": "caos-deport-back-b",
    "title": "Caos: indisponibilidad de dependencia (ronda 0 vs ronda 1)",
    "tags": ["caos", "devops", "deport-back", "gcp"],
    "timezone": "utc",
    "schemaVersion": 39,
    "editable": True,
    "time": {"from": "2026-11-17T06:20:00.000Z", "to": "2026-11-17T06:45:00.000Z"},
    "refresh": "",
    "annotations": {
        "list": [
            {
                "builtIn": 1,
                "datasource": {"type": "grafana", "uid": "-- Grafana --"},
                "enable": True,
                "hide": False,
                "iconColor": "rgba(255, 96, 96, 1)",
                "name": "Ventanas de inyección",
                "type": "dashboard",
            }
        ]
    },
    "links": [
        {"title": "Experimento oficial (05:30–05:55 UTC)", "type": "link", "icon": "dashboard",
         "url": "/d/caos-deport-back-b?from=2026-11-17T05:30:00.000Z&to=2026-11-17T05:55:00.000Z", "targetBlank": False},
        {"title": "Ensayo (06:20–06:45 UTC)", "type": "link", "icon": "dashboard",
         "url": "/d/caos-deport-back-b?from=2026-11-17T06:20:00.000Z&to=2026-11-17T06:45:00.000Z", "targetBlank": False},
    ],
    "panels": panels,
}

with open(sys.argv[1], "w", encoding="utf-8") as fh:
    json.dump(dashboard, fh, ensure_ascii=False, indent=2)
print("ok", sys.argv[1])
