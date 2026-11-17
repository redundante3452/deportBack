# Honeytoken: prueba de disparo (run 44178025923, 2026-11-17)

- Señuelo: deportista `0e830672-a08d-4928-96fc-e5db00b3cb7f` ("Valentina Rios Ospina"), id en la variable `HONEYTOKEN_IDS`.
- Simulación: `GET /api/v2/deportistas/<id-señuelo>` con la credencial válida del equipo (T1078), trace `gd-honeytoken-20261117T211619Z`.
- La API respondió **HTTP 200** (sin revelar el señuelo).

| Hito (UTC) | Evento |
|---|---|
| 21:16:19.51 | Cloud Logging: `security_honeytoken_triggered` (deportista_id, GET, path, caller, trace_id, api_version v2) |
| 21:17:22 | Grafana: alerta "Honeytoken - acceso a deportista señuelo" en *firing* |

**MTTD = 63,4 s** (resolución del sondeo: 15 s). Estado previo de la alerta: 0 (sin disparos antes de la prueba).
