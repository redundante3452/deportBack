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


BLUE, RED, ORANGE, YELLOW, GREEN, PURPLE = "#5794F2", "#F2495C", "#FF9830", "#FADE2A", "#73BF69", "#B877D9"


def fixed(color):
    return {"mode": "fixed", "fixedColor": color}


def ov_name(name, props):
    return {"matcher": {"id": "byName", "options": name}, "properties": props}


def ov_regex(rx, props):
    return {"matcher": {"id": "byRegexp", "options": rx}, "properties": props}


def ov_ref(ref, props):
    return {"matcher": {"id": "byFrameRefID", "options": ref}, "properties": props}


def ts(pid, title, targets, x, y, w=12, h=8, unit="short", desc="", threshold=None, bars=False,
       no_value=None, overrides=None, legend=None, ymax=None):
    custom = {
        "drawStyle": "bars" if bars else "line",
        "lineWidth": 1 if bars else 2,
        "fillOpacity": 60 if bars else 15,
        "gradientMode": "none" if bars else "opacity",
        "showPoints": "never",
        "spanNulls": False,
        "axisSoftMin": 0,
    }
    defaults = {"unit": unit, "min": 0, "color": fixed(BLUE), "custom": custom}
    if unit == "ms":
        defaults["decimals"] = 0
    p = {
        "id": pid,
        "type": "timeseries",
        "title": title,
        "description": desc,
        "datasource": DS,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "targets": targets,
        "fieldConfig": {"defaults": defaults, "overrides": overrides or []},
        "options": {
            "legend": legend or {"showLegend": False, "displayMode": "list", "placement": "bottom"},
            "tooltip": {"mode": "multi", "sort": "desc"},
        },
    }
    if ymax is not None:
        defaults["max"] = ymax
    if no_value is not None:
        defaults["noValue"] = no_value
    if threshold is not None:
        defaults["thresholds"] = {
            "mode": "absolute",
            "steps": [{"color": GREEN, "value": None}, {"color": RED, "value": threshold}],
        }
        custom["thresholdsStyle"] = {"mode": "line"}
    return p


def stat(pid, title, targets, x, y, w=6, h=4, unit="short", desc="", calc="max", steps=None,
         color=None, no_value="Sin datos", decimals=None, overrides=None):
    d = {"unit": unit, "noValue": no_value}
    if decimals is not None:
        d["decimals"] = decimals
    if steps:
        d["color"] = {"mode": "thresholds"}
        d["thresholds"] = {"mode": "absolute", "steps": steps}
    else:
        d["color"] = fixed(color or BLUE)
    return {
        "id": pid,
        "type": "stat",
        "title": title,
        "description": desc,
        "datasource": DS,
        "transparent": True,
        "gridPos": {"x": x, "y": y, "w": w, "h": h},
        "targets": targets,
        "fieldConfig": {"defaults": d, "overrides": overrides or []},
        "options": {
            "reduceOptions": {"calcs": [calc], "fields": "", "values": False},
            "colorMode": "value",
            "graphMode": "area",
            "textMode": "value_and_name",
            "justifyMode": "center",
            "orientation": "auto",
        },
    }


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

LEG_TABLE_B = {"showLegend": True, "displayMode": "table", "placement": "bottom", "calcs": ["max", "lastNotNull"]}
LEG_TABLE_R = {"showLegend": True, "displayMode": "table", "placement": "right", "calcs": ["max", "lastNotNull"]}

T_P95_A = q("A", U + "deport-back-http-latency-by-track", "ALIGN_DELTA", "REDUCE_PERCENTILE_95", alias="p95 servidor (buckets lineales, tope 2000 ms)")
T_P95_B = q("B", U + "deport-back-http-latency-exp", "ALIGN_DELTA", "REDUCE_PERCENTILE_95", alias="p95 servidor (buckets exponenciales)")
T_RPS = q("A", U + "deport-back-http-requests-by-track", "ALIGN_RATE", "REDUCE_SUM", alias="req/s")
T_DEP = q("A", U + "deport-back-dependency-failures", "ALIGN_RATE", "REDUCE_SUM", group_bys=["metric.label.error_type"], alias="{{metric.label.error_type}}")
T_CB = q("A", U + "deport-back-circuit-breaker-opened", "ALIGN_DELTA", "REDUCE_SUM", alias="aperturas")
T_5XX = q("A", U + "deport-back-http-errors-by-track", "ALIGN_RATE", "REDUCE_SUM", alias="5xx/s")

ERR_TYPE_OVERRIDES = [
    ov_name("timeout", [{"id": "color", "value": fixed(ORANGE)}]),
    ov_name("circuit_open", [{"id": "color", "value": fixed(YELLOW)}]),
    ov_regex("^(?!timeout$|circuit_open$).*", [{"id": "color", "value": fixed(RED)}]),
]
P95_OVERRIDES = [
    ov_ref("A", [{"id": "displayName", "value": "lineal (tope 2 s)"},
                 {"id": "custom.lineStyle", "value": {"fill": "dash", "dash": [10, 10]}}]),
    ov_ref("B", [{"id": "displayName", "value": "exponencial"}]),
]
P95_STAT_OVERRIDES = [
    ov_ref("A", [{"id": "displayName", "value": "lineal (tope 2 s)"}]),
    ov_ref("B", [{"id": "displayName", "value": "exponencial"}]),
]

panels = [
    # Cabecera de estado (y=0, h=4)
    stat(1, "p95 máximo en el servidor", [T_P95_A, T_P95_B], 0, 0, unit="ms", decimals=0,
         steps=[{"color": GREEN, "value": None}, {"color": RED, "value": 1000}], overrides=P95_STAT_OVERRIDES,
         desc="Mayor p95 de latencia del servidor en el rango. Rojo si supera el umbral de 1000 ms del experimento. La serie lineal satura en 2000 ms; la exponencial muestra la cola completa.",
         no_value="Sin datos en el rango"),
    stat(2, "Errores 5xx (pico)", [T_5XX], 6, 0, unit="reqps", decimals=2,
         steps=[{"color": GREEN, "value": None}, {"color": RED, "value": 0.001}],
         desc="Pico de respuestas 5xx por segundo. Debe ser 0: la degradación responde 200. Preocupa cualquier valor mayor que 0.",
         no_value="0"),
    stat(3, "Fallos de dependencia (pico)", [T_DEP], 12, 0, unit="reqps", decimals=1, color=ORANGE,
         overrides=ERR_TYPE_OVERRIDES,
         desc="Pico de fallos al llamar a Inventario-U por tipo: timeout (espera completa) y circuit_open (rechazo rápido del breaker).",
         no_value="Sin eventos"),
    stat(4, "Aperturas del breaker", [T_CB], 18, 0, unit="short", decimals=0, calc="sum", color=PURPLE,
         desc="Total de veces que el circuit breaker se abrió en el rango (al tercer fallo consecutivo).",
         no_value="Sin aperturas"),
    # Tendencias
    ts(5, "Latencia p95 en el servidor", [T_P95_A, T_P95_B], 0, 4, w=16, h=9, unit="ms", threshold=1000,
       overrides=P95_OVERRIDES, legend=LEG_TABLE_B,
       desc="p95 de duration_ms de los logs http_request en GKE. La línea marca el umbral de 1000 ms. La serie lineal satura en 2000 ms (en la Ronda 0 oficial el real fue ~5000 ms según k6); la exponencial (desde el ensayo) muestra la cola completa. Preocupa si cruza la línea fuera de la Ronda 0."),
    ts(6, "Peticiones por segundo", [T_RPS], 16, 4, w=8, h=9, unit="reqps",
       desc="En la Ronda 0 cae a ~1 req/s: los VUs de k6 quedan bloqueados 5 s por petición (timeout demasiado largo). Una caída sostenida indica saturación del cliente o del servicio."),
    ts(7, "Fallos de dependencia por tipo", [T_DEP], 0, 13, w=12, h=8, unit="reqps", overrides=ERR_TYPE_OVERRIDES,
       legend=LEG_TABLE_R, no_value="Sin eventos en el rango (métrica desde 2026-11-17 06:00 UTC)",
       desc="timeout = espera completa a la dependencia; circuit_open = rechazo rápido del circuit breaker. Disponible desde la corrección de logs JSON (ejecuciones posteriores al experimento oficial)."),
    ts(8, "Aperturas del circuit breaker", [T_CB], 12, 13, w=12, h=8, unit="short", bars=True,
       overrides=[ov_name("aperturas", [{"id": "color", "value": fixed(PURPLE)}])],
       no_value="Sin aperturas en el rango (métrica desde 2026-11-17 06:00 UTC)",
       desc="Evento circuit_breaker_opened (al tercer fallo consecutivo). Disponible desde la corrección de logs JSON."),
    ts(9, "Errores HTTP 5xx", [T_5XX], 0, 21, w=24, h=6, unit="reqps",
       overrides=[ov_name("5xx/s", [{"id": "color", "value": fixed(RED)}])], no_value="0",
       desc="Debe ser 0: la degradación responde 200 con apis_externas.inventario_u en error. Preocupa cualquier barra."),
    # Detalle
    row(10, "Detalle del experimento b: Inventario-U (deport-back · GCP)", 27),
    text(11, "Resultados k6: oficial y ensayo", RESULTADOS, 0, 28, 14, 12),
    text(12, "Experimento", FALLO, 14, 28, 10, 12),
]

dashboard = {
    "uid": "caos-deport-back-b",
    "title": "Caos: indisponibilidad de dependencia (ronda 0 vs ronda 1)",
    "tags": ["caos", "devops", "deport-back", "gcp"],
    "timezone": "utc",
    "schemaVersion": 39,
    "editable": True,
    "time": {"from": "2026-11-17T06:20:00.000Z", "to": "2026-11-17T06:45:00.000Z"},
    "graphTooltip": 1,
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
