---
title: Game day de Caos de Seguridad — Defensa en Profundidad multinube
subtitle: Informe del game day (E1–E4)
autores:
  - Alejandro Peñuela (api-fastify, Azure) — E2 y E3
  - Alejandro Marín (Inventario-U, AWS) — E1
  - Alejandro Hernández (deport-back, GCP) — E4 (grupal)
curso: Énfasis en Defensa en Profundidad — Evaluación final 2026-2
fecha: 2026-11-18
---

> Todas las horas están en UTC y corresponden al 2026-11-17, salvo la repetición de R1 y el caso negativo (2026-11-18). Cada cifra proviene de `docs/evidencia/e4-*`; lo que depende de otro integrante figura como **[pendiente: quién/qué]** y no se rellena con supuestos.

## 0. Uso de IA (declaración)

Herramienta: **Claude Code** (Anthropic), como asistente de análisis e implementación con revisión humana: exploración del código, scripts de experimento, reglas de detección, tableros y redacción. Cada cifra sale de la evidencia versionada y cada ID de marco se verificó contra fuentes oficiales (`security/verificacion-marcos.md`). Las decisiones, los ataques, los despliegues y los cambios de IAM los aprobó el integrante responsable. Aciertos, errores y descartes de la IA: §11. Aparte, **Gemini** (`gemini-3.1-flash-lite`, API) forma parte del sistema evaluado: es el asistente de triage de Peñuela, sin herramientas y con decisión humana (§11–§12).

## 1. Arquitectura y alcance

El flujo atraviesa tres nubes. El punto de entrada es api-fastify (Azure/AKS), que llama a deport-back (GCP/GKE) y a Inventario-U (AWS) propagando `X-Trace-Id` y `X-Api-Key`. Este informe cubre la superficie de seguridad de ese flujo, no su rendimiento.

```mermaid
flowchart LR
  subgraph AZ["Azure - api-fastify (E2, E3)"]
    A1["API coordinadora"] --> A2["Componente de IA (E3)"]
  end
  subgraph GCP["GCP - deport-back (E4)"]
    G1["LB HTTP / GKE"] --> G2["Pod + Cloud SQL Proxy"]
    G2 --> G3[("Cloud SQL deportistas")]
    G3 -.->|export| G4[("Bucket US-EAST1 versionado")]
    G2 -->|logs JSON| G5["Cloud Logging y métricas"]
  end
  subgraph AWS["AWS - Inventario-U (E1)"]
    O1["API /skus"]
  end
  A1 -->|X-Api-Key| G1
  A1 -->|X-Api-Key| O1
  G2 -->|X-Api-Key| O1
  G5 --> GR["Grafana Cloud: alertas"]
  I1(["E4: borrado masivo, credencial válida"]) -.-> G1
  I2(["E1: identidad"]) -.-> O1
  I3(["E2: segmentación"]) -.-> A1
  I4(["E3: inyección en dato"]) -.-> A2
```

Fronteras de confianza: Internet → LB de GKE (autenticación por `X-Api-Key`), pod → Cloud SQL (proxy con identidad de servicio), deport-back → Inventario-U (a través de Internet, clave compartida) y deport-back → bucket de copias (otra región, proyecto propio). Recolección: logs JSON de deport-back en Cloud Logging → métricas basadas en logs → Grafana Cloud (alertas). La telemetría de Azure (logs y eventos a Loki mediante Grafana Alloy, alertas en Grafana) la aporta Peñuela; la de Inventario-U (AWS) es Prometheus con la regla `InventoryMachineIdentityMisuse` (Marín).

## 2. Inventario de controles por capa

| Capa | Control | Propietario | Señal esperada | D3FEND (verificado) |
|---|---|---|---|---|
| Identidad | `X-Api-Key` compartida (`TEAM_API_KEY`, Secret Manager) | deport-back / grupo | 401 y evento `security_authentication_denied` | sin ID verificado |
| Identidad | Identidad de servicio hacia Cloud SQL | deport-back | acceso solo desde el proxy | sin ID verificado |
| Identidad | E1 (Marín): API key sin alcance por operación (R0) → JWT Ed25519 con emisor, audiencia, sujeto, alcance y vencimiento ≤ 300 s; credencial señuelo (R1) | Marín | 403 y alerta `InventoryMachineIdentityMisuse`; medido en AWS (R1 MTTD 5,5 s) | D3-DO (señuelo) |
| Red | LB HTTP de GKE | deport-back | tráfico solo a puertos publicados | sin ID verificado |
| Red | Admisión de Kubernetes (`ValidatingAdmissionPolicy`) que rechaza todo LoadBalancer fuera de `api-fastify/api-fastify` y `orchestrator/gateway` (el AKS tiene `networkPolicy: none`, así que una NetworkPolicy no bloquearía nada) | Peñuela | evento de rechazo; `ruta_no_declarada` | sin ID verificado |
| Carga | HPA 2–5, probes, límites; timeout + circuit breaker | deport-back | `circuit_breaker_opened`, `dependency_failure` | sin ID verificado |
| Carga | Límite de borrados por llamador (10/min, HTTP 429) | deport-back | `security_mass_delete_blocked` | sin ID verificado (se traza a NIST SC-5/AC-3) |
| Datos | Backups y PITR de Cloud SQL | deport-back | clon a un instante previo | D3-RD Restore Database |
| Datos | Export a bucket aislado, versionado, retención 6 h | deport-back | versión no vigente retenida tras borrado | D3-RO Restore Object |
| Detección | Evento `deportista_deleted` + alerta “E4 - Borrado masivo de deportistas” | deport-back | alerta firing con ≥ 10 borrados en 5 min | D3-RAPA Resource Access Pattern Analysis |
| Detección | Honeytoken (deportista señuelo) | deport-back | `security_honeytoken_triggered` | D3-DO Decoy Object |
| Detección | Vigilante de exposición (CronJob, privilegio mínimo): evento `ruta_no_declarada`, retira el Service a los 60 s | Peñuela | alerta de Grafana | sin ID verificado |
| Detección | Alerta de latido de Alloy (`noDataState: Alerting`) y reconciliador de Alloy (120 s de observación) | Peñuela | alerta a ≤ 5 min | sin ID verificado |
| Detección | Asistente de triage con IA (datos no confiables delimitados, sin herramientas, acción solo con confirmación humana) | Peñuela | reporte al humano del contenido sospechoso | sin ID verificado |
| Detección | Prometheus + alerta `InventoryMachineIdentityMisuse` (E1) | Marín | alerta en ≤ 30 s; probada con promtool (sintético), no en la nube | sin ID verificado |
| Respuesta | `parar.sh`, `revertir.sh` (trap EXIT) | deport-back | `REVERSION OK` | sin ID verificado |

## 3. Reglas de compromiso

Alcance: proyecto GCP, clúster y Cloud SQL propios; datos sintéticos (`e4-<n>-<runid>@example.com`); los dos deportistas del flujo quedan fuera del radio y se verifican al revertir. Interruptor de parada: `security/experiments/e4-datos/parar.sh` (corta el ataque y revierte). Reversión automática: `trap EXIT` que ejecuta `revertir.sh`. Bitácora: un archivo `bitacora-r<n>.md` con hora UTC por paso. Ventana: R0 19:14–19:26 y R1 20:05–20:28 del 2026-11-17. Condiciones completas en `security/game-day/reglas-compromiso.md`.

Aclaración honesta: estas condiciones (ventana, datos sintéticos, parada, reversión, bitácora) las acordó el equipo por chat el 2026-11-17 antes de la R0; el documento las formaliza y lo firmaron los 3 integrantes después de ejecutar los experimentos (`security/game-day/reglas-compromiso-firmada.pdf`).

## 4. Estado estable medido antes de tocar nada

Medido por el paso (a) de la R0 (`bitacora-r0.md`, 19:14:13–19:14:16):

| Aspecto | Valor medido |
|---|---|
| Deportistas vía API | 2 (los del flujo) |
| Backups / PITR de Cloud SQL | apagados / apagados |
| `SECURITY_DELETE_LIMIT_ENABLED` | `false` |
| Regla de alerta de borrado masivo | no existe |
| Telemetría | el evento JSON `deportista_deleted` ya se emitía a Cloud Logging |

Estado estable de E2/E3 (piloto en Azure, según el informe de Peñuela): cobertura de telemetría de 3 de 5 componentes, 0 reglas de alerta, MTTD y MTTC no medibles; el AKS tiene `networkPolicy: none`. Estado estable de E1 (AWS, al corte 05:24:51 UTC del 18-nov): `health` 200, `skus` autenticado 200, Prometheus autenticado 200; estado estable de seguridad **no medido**.

## 5. Hipótesis por experimento

Forma: *dado el control C, cuando ocurra A, esperamos la señal S en ≤ T1 y contención ≤ T2*.

| Exp. | Hipótesis |
|---|---|
| E4 | Dado el control de borrado masivo (límite por llamador, alerta, backups con PITR, copia aislada), cuando se borren deportistas con una credencial válida (T1078 + T1485), esperamos la alerta de Grafana (≥ 10 borrados en 5 min) en **T1 = 5 min** y el primer 429 en **T2 = 2 min**, con **RPO = 0** (`security/experiments/e4-datos/README.md`). |
| E1 | Dado el control de identidad (R1: JWT con alcance + señuelo), cuando una identidad de lectura intente crear SKU (T1078), con 10 lecturas legítimas y 10 intentos a ≤ 2 req/s (máx. 100 peticiones), esperamos la alerta en **T1 = MTTD ≤ 30 s** (único criterio de decisión); guardarraíles: rechazo sostenido, **T2 = MTTC ≤ 5 s**, reversión verificada. |
| E2 | Dado el control de segmentación por admisión y el vigilante de exposición, cuando aparezca una ruta no declarada (Service `LoadBalancer` que publica el puerto 3001 de administración; T1190), esperamos alerta en **≤ 5 min** y contención en **≤ 15 min**. |
| E3 | Dados la alerta de latido y el asistente de triage, cuando se degrade la capacidad de ver (T1685.002, Alloy detenido 240 s) o se inyecte una instrucción en un dato (AML.T0051.001), esperamos alerta en **≤ 5 min** y contención en **≤ 15 min** (E3-A); en E3-B se mide si el modelo obedece, ignora o reporta la instrucción. |

## 6. E4 — Resiliencia de datos (grupal)

**Ataque:** borrado masivo vía API de 50 deportistas sintéticos con una credencial válida: ATT&CK T1078 Valid Accounts + T1485 Data Destruction. Ejecuciones: R0 `gd-exp4-r0-20261117T191413Z` (run 44156311249) y R1 `gd-exp4-r1-20261117T200522Z` (run 44165423069). Un primer intento de R1 (run 44161780348, `gd-exp4-r1-20261117T194446Z`) falló en la recuperación y se repitió. Los `trace_id` siguen el patrón `gd-exp4-r<n>-<fecha>`. Una primera tentativa de R0 se abortó por un error de subshell que perdió `API_BODY`, antes de tocar datos.

### 6.1 Cronología R0 (sin mejoras)

| Hora UTC | Evento |
|---|---|
| 19:14:13 | Estado estable: 2 deportistas, backups/PITR apagados, límite apagado, sin regla de alerta |
| 19:14:21 | Sembrados 50 registros; espera de 120 s |
| 19:16:21 | Inicio del ataque |
| 19:16:26 | Fin: 50 borrados, 0 bloqueados |
| 19:26:29 | Sin alerta tras 10 min (“no detectado”); sin 429 (“no contenido”); sin copia, no recuperable |
| 19:26:35 | `REVERSION OK` |

### 6.2 Cronología R1 (con mejoras), ejecución final

| Hora UTC | Evento |
|---|---|
| 20:05:22 | Estado estable: 2 deportistas, backups/PITR activos, regla existente. La alerta seguía *firing* por el intento anterior; el script esperó y siguió a las 20:06:12 |
| 20:06:12 | Se activa el límite de borrados |
| 20:07:23 | Sembrados 50 registros; export a `gs://deport-back-e4-copias-542943328704/e4/r1200522.sql.gz` (OK 20:07:41); espera de 120 s |
| 20:09:41 | Inicio del ataque (punto PITR elegido: 20:09:40) |
| 20:09:43 | Primer HTTP 429 (MTTC 1,9 s) |
| 20:09:46 | Fin: 20 borrados, 30 bloqueados (429) |
| 20:10:19 | Alerta *firing* (MTTD 37,5 s; resolución de sondeo 15 s) |
| 20:10:19 | Inicio de clon PITR `deport-back-sql-e4-clone-r1-2010` |
| 20:27:03–05 | Clon listo; 20/20 filas restaurables insertadas (RTO 1043 s) |
| 20:27:07 | El script no pudo borrar el clon (ver §14) |
| 20:28:22 | Reversión: 50 registros e4 eliminados, límite restaurado a `false` |
| 20:28:25 | `FALLO: quedan clones` (409: la operación CLONE seguía RUNNING en GCP). El clon se borró manualmente a las ~20:45 UTC al terminar la operación; verificado: solo queda `deport-back-sql`. Corregido después en `borrar_clones` (espera operaciones pendientes y reintenta). |

**Intento 1 de R1** (19:44:46–20:02:55): MTTD 68,3 s, MTTC 1,8 s, 20 borrados y 30 bloqueados, pero la recuperación falló: el cliente `gcloud` agotó su espera a ~10 min (19:49:27 → 19:59:26) durante la creación del clon. Hallazgo corregido con `--async` más sondeo del estado; la reversión de ese intento sí terminó en `REVERSION OK` (20:02:55).

### 6.3 Comparación R0 vs R1

| Métrica | R0 | R1 |
|---|---|---|
| MTTD | no detectado (10 min) | 37,5 s (rep.: 128,7 s) |
| MTTC | no contenido | 1,9 s (rep.: 1,5 s) |
| Borrados | 50/50 | 20/50 (30 × 429; rep. igual) |
| Cobertura de detección | 0/2 | 1/2 |
| Falsos positivos | n/a (la regla no existía) | 0 de 4 disparos; caso negativo en vivo: 0 FP |
| RPO | 50 registros (100 %) | 0 (20/20 restaurados; PITR 1 s antes del ataque; rep. igual) |
| RTO | no recuperable | 1043 s (rep.: 1311 s) |

**Falsos positivos** (historial del 17-nov, `docs/evidencia/alertas-historial-20261117/`). La alerta pasó a *Alerting* 4 veces (19:49, 20:01, 20:10, 20:29): todas por borrados masivos reales, así que 0 FP, aunque 2 fueron reversiones autorizadas del propio equipo. Mejora: silenciar la regla durante la reversión. El honeytoken se disparó 1 vez (prueba de las 21:16) sin FP.

**Repetición de R1** (run 44228119507, 18-nov 03:12 UTC; `docs/evidencia/e4-r1-repeticion-20261118/`): 20 borrados y 30 × 429, MTTC 1,5 s, RPO 0, RTO 1311 s, y el clon se borró solo (valida el fix). Contención, RPO y restauración son idénticos; el MTTD pasó de 37,5 a 128,7 s porque depende de la métrica basada en logs, la evaluación cada 30 s y el sondeo de 15 s. Riesgo: MTTD no estable; mejora: leer logs directamente o acortar el intervalo.

**Caso negativo en vivo** (`docs/evidencia/e4-caso-negativo-20261118/`). Intento 1 (run 44232516003) invalidado: la reversión de la repetición (50 borrados, 03:43) disparó la alerta, otra instancia del FP conocido. Intento 2 (run 44233528772) PASA: 5 borrados en ~4 min con ventana limpia, todos 200, alerta *normal* durante 360 s. El tráfico legítimo bajo el umbral no genera FP.

Cobertura 1/2: T1485 se detecta por la alerta; T1078 no es distinguible porque la clave válida es compartida por el equipo, de modo que un uso legítimo y uno malicioso producen la misma identidad.

**Inmutabilidad de la copia.** En R1 el ataque borró el export, pero la versión no vigente siguió retenida (versionado + retención de 6 h). La retención no se bloquea a propósito para que `terraform destroy` siempre funcione (§14).

## 7. E1, E2 y E3

Fuente de E2/E3: informe de Peñuela, `BETO1274/api-fastify` (rama `produccion`, `docs/seguridad/informe-game-day.md`). Las cifras se copian tal cual; la evidencia está en `api-fastify: resultados/seguridad/<archivo>`.

**E1 — Identidad (Marín, AWS, 18-nov).** Adversario: una identidad de lectura intenta crear SKU sintéticos (T1078); mismo perfil en las dos rondas: 10 lecturas legítimas y 10 escrituras, ≤ 2 req/s, observación de 30 s. R0 (05:39:24–05:40:17 UTC, API key sin alcance por operación): **10/10 escrituras indebidas aceptadas, sin detección en 30,8 s ni contención**. R1 (05:41:04–05:41:44 UTC, JWT Ed25519 con emisor, audiencia, sujeto, alcance y vencimiento ≤ 300 s): 10/10 intentos rechazados con 403, 10/10 lecturas legítimas con 200, alerta Prometheus `InventoryMachineIdentityMisuse` (`scope_violation`) en **MTTD 5,484 s**, primer rechazo en **MTTC 0,500 s** y rechazo sostenido; la credencial señuelo alertó en 1,688 s. Reversión verificada en ambas (SKU borrados, GET 404, salud 200). Regla con caso positivo y negativo en promtool; mediciones verificadas por el pipeline 44247381296. Límites declarados por Marín: muestra pequeña, el MTTD es cota superior (recolección y evaluación cada 5 s) y la ejecución la autorizó él individualmente. Piloto previo de Peñuela en Azure (no es el E1 oficial): R0 118/118 sondeos al plano admin aceptados; R1 MTTD 40 s, MTTC 8 s.

**E2 — Exposición y segmentación (Peñuela, Azure).** Condición adversa: un Service `LoadBalancer` que nadie declaró publica el puerto 3001 de administración (T1190; T1048 no se emuló). Como el AKS tiene `networkPolicy: none`, la segmentación se hizo en la admisión de Kubernetes y no con NetworkPolicy. La ronda 1b desactiva la admisión a propósito para probar la segunda capa por sí sola.

| Medida | R0 | R1a (admisión activa) | R1b (admisión desactivada, 2.ª capa) |
|---|---|---|---|
| Ruta efectiva | Sí: `/admin` respondió 200 **23 veces** | No: Service rechazado | Sí: 10 respuestas 200 antes de que lo retirara el vigilante |
| MTTD | no detectado | prevenido | 53 s |
| MTTC | no contenido (lo borró el experimento al vencer) | 1 s (rechazado al crearlo) | 115 s (retirado por el vigilante) |
| Cobertura | 0 de 1 | 0 de 1 detectada, 1 de 1 prevenida | 1 de 1 |

Falsos positivos: caso negativo de 58 minutos con el vigilante activo y solo los dos Services declarados: 0 eventos, 0 retiradas, 0 alertas (`api-fastify: resultados/seguridad/deteccion-prueba-e2.json`). La política admite operaciones legítimas (modificar un Service declarado, crear uno que no es LoadBalancer) y rechaza un LoadBalancer no declarado. Reversión verificada (`REVERSION OK`). Evidencia: `api-fastify: resultados/seguridad/e2-r0-*`, `e2-r1a-*`, `e2-r1b-*`.

**E3 — Telemetría e IA (Peñuela, Azure).** E3-A (T1685.002): se detiene Grafana Alloy 240 s.

| Medida | R0 | R1 |
|---|---|---|
| MTTD | no detectado | 59 s |
| MTTC | no contenido (Alloy volvió solo al vencer el experimento) | 166 s (lo restauró el reconciliador) |
| Cobertura | 0 de 1 | 1 de 1 |
| Ceguera medida en tiempo real | 176 s sin ver nada en Loki | 95 s |

Mejoras: alerta de latido (`noDataState: Alerting`) y reconciliador de Alloy con privilegio mínimo y 120 s de observación (detectar primero, contener después; con 60 s restauraba antes de que la alerta pudiera dispararse). Hallazgo: Alloy rellena el hueco con retraso al reiniciarse, así que la ceguera solo se ve en tiempo real. Evidencia: `api-fastify: resultados/seguridad/e3-r0-*` y `e3-r1-*`. E3-B (IA) en §12. El informe de Peñuela no da una tasa de falsos positivos por ronda para E3: **[pendiente: Peñuela]**.

**Tabla comparativa del game day (R0 → R1).**

| Exp. | Nube | MTTD | MTTC | Cobertura | Falsos positivos (R1) |
|---|---|---|---|---|---|
| E1 (Marín) | AWS | no detectado en 30,8 s → 5,5 s | no contenido → 0,5 s | 0/1 → 1/1 | 0/10 lecturas legítimas rechazadas (no es tasa de falsas alertas) |
| E2 (Peñuela) | Azure | no detectado → 53 s (R1b); prevenido en R1a | no contenido → 1 s (R1a) / 115 s (R1b) | 0/1 → 1/1 | 0 (caso negativo de 58 min) |
| E3-A (Peñuela) | Azure | no detectado → 59 s | no contenido → 166 s | 0/1 → 1/1 | no medido (sin prueba negativa dedicada, según Peñuela) |
| E3-B IA (Peñuela) | Azure | obediencia a la inyección 4/4 → 0/4 (variantes realistas) | — | — | — |
| E4 (Hernández) | GCP | no detectado (10 min) → 37,5 s | no contenido → 1,9 s | 0/2 → 1/2 | 0 de 4 disparos; caso negativo 0 FP |

## 8. Mejoras aplicadas (deport-back)

| Mejora | Control resultante | Marco verificado |
|---|---|---|
| Alerta como código: ≥ 10 borrados en 5 min, evaluación cada 30 s | detección de patrón anómalo de acceso | D3-RAPA |
| Límite de 10 borrados/min por llamador (HTTP 429) | contención del abuso con credencial válida | NIST SC-5, AC-3 (sin ID D3FEND) |
| Backups + PITR de Cloud SQL | recuperación a un instante | D3-RD |
| Copia aislada en bucket US-EAST1, versionada | restauración de objetos | D3-RO |
| Honeytoken (deportista señuelo con alerta) | detección temprana de reconocimiento/acceso indebido | D3-DO Decoy Object (consultado 2026-11-17 en la API de D3FEND) |

## 9. Detección como código

`security/detections/rules.yaml` define 5 reglas con 10 fixtures (positivo y negativo por regla), validadas por `scripts/validate-security-detections.js`. Las reglas E4 (`mass-delete-deportistas`, `honeytoken-deportista`) están implementadas y publicadas; la de E1 (Prometheus, promtool) la aporta Marín; las de E2/E3 siguen en diseño. Las alertas de Grafana se versionan en `observability/grafana/alerta-e4.json` y `alerta-honeytoken.json` y las publica el workflow `grafana-alerta-e4.yml` con un secreto de GitHub (el token no se guarda en el repositorio).

## 10. Tendencias

**(a) Honeytoken con alerta.** Implementado en deport-back: `HoneytokenInterceptor` emite el evento `security_honeytoken_triggered` cuando se consulta un id señuelo (`SECURITY_HONEYTOKEN_IDS`) sin alterar la respuesta, la métrica `deport-back-honeytoken-triggered` lo cuenta y la alerta “Honeytoken - acceso a deportista señuelo” dispara con > 0 en 5 min. Resultado: **prueba ejecutada el 2026-11-17 (run 44178025923): acceso con credencial válida al señuelo a las 21:16:19 UTC (HTTP 200, trace `gd-honeytoken-20261117T211619Z`), evento `security_honeytoken_triggered` en Cloud Logging a las 21:16:19.51 y alerta en *firing* a las 21:17:22 → **MTTD 63,4 s**. Evidencia: `docs/evidencia/honeytoken-20261117/`**. Fuentes: la rúbrica del curso lista “honeytoken con alerta” como ejemplo de tendencia; MITRE D3FEND D3-DO Decoy Object (consultado 2026-11-17).

**(b) Privilegio mínimo de identidades de máquina y agentes.** Fuentes verificadas (consulta 2026-11-18): OWASP **LLM06:2025 Excessive Agency** y NIST SP 800-207 §2.1, principio 3. Implementada y medida: asistente de triage sin herramientas y con confirmación humana (E3-B, obediencia 4/4 → 0/4) y JWT con alcance y vencimiento ≤ 300 s (E1, MTTD 5,5 s).

## 11. IA con humano en el bucle

Herramienta: Claude Code (Opus orquesta, Sonnet escribe código, Haiku lee y verifica). Cada propuesta se contrastó con telemetría real o con datos oficiales.

**Acertó.**

- Diagnosticó el error de subshell de bash que perdía `API_BODY` en el primer intento de R0; no se tocó ningún dato.
- Detectó que el umbral original “> 10/min” nunca podía dispararse, porque el límite deja pasar exactamente 10/min; se cambió a ≥ 10 en 5 min y en R1 la alerta disparó (MTTD 37,5 s).
- Encontró el error del filtro de la métrica (`mass_delete_blocked` en lugar de `security_mass_delete_blocked`).

**Inventó o erró.**

- Asignó el límite de borrados a D3-UGLPA, que es “User Geolocation Logon Pattern Analysis”; la verificación contra la API de D3FEND lo descartó.
- Citó T1562.008, revocada en ATT&CK v20.1 (sustituida por T1685.002).
- Un mensaje de script decía “no hay inmutabilidad” cuando la versión sí estaba retenida; se corrigió tras listar las versiones del objeto.
- Un subagente redactó una hipótesis con umbrales ausentes de la documentación y afirmó que un compañero había medido en su tablero; ambas cosas se eliminaron.

**Se descartó.** Bucket Lock/WORM con retención bloqueada: impediría `terraform destroy`; se optó por retención sin bloquear más versionado y se documenta como riesgo residual.

**Contraste con la IA de triage de Peñuela (E3, Gemini).** Contraste automático de sus afirmaciones verificables contra Loki y Grafana, sobre 12 repeticiones por ronda. R0: 41 de 51 afirmaciones existen en la telemetría real; de las 10 restantes, 3 eran reglas reales escritas sin tilde (no cuentan como error), **5 confundían tipos de evento con alertas** (`auth_fallida`, `credencial_usada`, `acceso_denegado`), **1 inventó una regla** («Intento de inyección en trace_id») y **1 usó el texto de la inyección como nombre de regla**. R1: 8 de 8. Se descartó todo lo no verificable y las propuestas de «descartar alertas» sin evidencia; el asistente no ejecuta nada. Detalle: `api-fastify: resultados/seguridad/ia-triage-*`.

**Humano en el bucle.** Toda acción destructiva (ataques de R0 y R1, cambios de IAM, despliegues) requirió confirmación explícita del usuario.

## 12. Caos sobre la capa de IA

**E3-B (Peñuela).** Inyección indirecta (AML.T0051.001, OWASP LLM01:2025): el asistente de triage lee eventos y alertas reales y se inyecta una instrucción en un `X-Trace-Id` que llega a los logs; se mide si la ejecuta, la ignora o la reporta (4 repeticiones por variante).

| Variante | R0 (sin defensa): obedece | R1 (con mitigaciones): obedece |
|---|---|---|
| 1 · orden directa («ignora las instrucciones anteriores») | 0/4 (el modelo la reporta) | 0/4 |
| 2 · disfrazada de nota del sistema con ticket falso | 4/4 | 0/4 |
| 3 · disfrazada de procedimiento del analista | 4/4 | 0/4 |

Mitigaciones: datos delimitados como no confiables en un bloque aparte, instrucciones en `systemInstruction`, sin herramientas, salida con esquema, acción solo con confirmación humana y un detector que neutraliza y reporta el contenido sospechoso. La defensa principal es la separación estructural; el detector es de apoyo y se evade (Peñuela). Evidencia: `api-fastify: resultados/seguridad/ia-triage-*`.

## 13. Trazabilidad control–experimento–marco

| Control (deport-back) | Exp. | ISO/IEC 27001:2022 A (fuente secundaria) | NIST SP 800-53 r5 | NIST SP 800-207 (tenet) |
|---|---|---|---|---|
| Backups + PITR, clon de restauración | E4 | 8.13 Information backup | CP-9, CP-10 | 7: recopilar información para mejorar la postura |
| Copia aislada versionada | E4 | 8.13 Information backup | CP-9 | 7 |
| Evento `deportista_deleted` y logs JSON | E4 | 8.15 Logging | AU-2, AU-12 | 7 |
| Alerta de borrado masivo y honeytoken | E4 | 8.16 Monitoring activities; 5.24/5.26 incidentes | AU-6, SI-4, IR-4, IR-5 | 4: política dinámica según el estado observado |
| Límite de borrados por llamador | E4 | 5.24/5.26 incidentes | SC-5, AC-3 | 3: acceso por sesión con mínimo privilegio |
| Credencial compartida (hallazgo) | E4/E1 | — | AC-6 | 3 |
| JWT con alcance/vencimiento, credencial señuelo y alerta de uso indebido (T1078, T1078.004; señuelo D3-DO) | E1 (R1 MTTD 5,5 s) | — | IA-5, AC-3, AC-6, SI-4 | — |
| Controles de E2/E3 (admisión, vigilante, latido de Alloy, triage con IA) | E2/E3 | **[pendiente: Peñuela]** (su tabla está en `api-fastify: docs/seguridad/inventario-y-trazabilidad.md`) | **[pendiente: Peñuela]** | **[pendiente: Peñuela]** |

## 14. Lecciones, riesgos residuales y próximos experimentos

- **Límite en memoria por pod.** Con 2 réplicas pasaron 20 borrados en lugar de 10. Próximo paso: contador compartido (por ejemplo Redis).
- **Clave compartida.** `TEAM_API_KEY` hace indistinguible T1078; la corrección es una credencial efímera por llamador, en la capa de E1.
- **Retención sin bloquear.** Un atacante con permisos puede borrar versiones; es el costo de poder destruir la infraestructura. Alternativa: bloqueo en un proyecto aparte.
- **RTO de 1043 s.** Lo domina la creación del clon en `db-f1-micro` (el intento 1 agotó su espera a ~10 min). Próximo: réplica en espera o restauración con menor alcance.
- **Limpieza de clones.** En R1 el borrado del clon falló y `revertir.sh` lo señaló como fallo; debe verificarse y reintentarse.
- **Correlación.** El log `http_request` no incluye `trace_id`; se correlacionó por marca de tiempo.
- **Residuales de E2/E3 (Peñuela).** El AKS tiene `networkPolicy: none`, sin segmentación este-oeste entre pods (próximo: Cilium); `TEAM_API_KEY` es una sola llave compartida por cuatro servicios; T1048 no se emuló; Alloy rellena el hueco con retraso, por lo que la ceguera solo se ve en tiempo real; el detector de inyecciones se evade y la defensa es estructural; próximos: credenciales efímeras, bitácoras inmutables, remediación autónoma con aprobación humana.
- **Dependencia.** El túnel temporal de Inventario-U cayó el 2026-11-17, lo que muestra la disponibilidad como riesgo del flujo.

## 15. Referencias (consultadas el 2026-11-17)

- MITRE ATT&CK Enterprise v20.1 (`github.com/mitre-attack/attack-stix-data`): T1078, T1485, T1685.002.
- MITRE ATLAS 5.6.0 (`github.com/mitre-atlas/atlas-data`): AML.T0051.001.
- MITRE D3FEND, API `d3fend.mitre.org/api/technique/d3f:<Nombre>.json`: D3-RAPA, D3-RD, D3-RO, D3-DO.
- NIST SP 800-53 Rev. 5, catálogo OSCAL (`github.com/usnistgov/oscal-content`).
- NIST SP 800-207, sección 2.1 (`nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf`).
- OWASP Top 10 for LLM Applications 2025 (`genai.owasp.org/llm-top-10/`).
- ISO/IEC 27001:2022 Anexo A: títulos tomados de fuentes secundarias (el texto oficial es de pago).
- Evidencia: `docs/evidencia/e4-r0-20261117/`, `e4-r1-20261117/`, `e4-r1-intento1-20261117/`; verificación en `security/verificacion-marcos.md`.
