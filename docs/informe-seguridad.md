---
title: Game day de Caos de Seguridad — Defensa en Profundidad multinube
subtitle: Informe del game day (E1–E4)
autores:
  - Alejandro Peñuela (api-fastify, Azure) — E2 y E3
  - Alejandro Marín (Inventario-U, OCI) — E1
  - Alejandro Hernández (deport-back, GCP) — E4 (grupal)
curso: Énfasis en Defensa en Profundidad — Evaluación final 2026-2
fecha: 2026-11-18
---

> Todas las horas están en UTC y corresponden al 2026-11-17. Cada cifra proviene de `docs/evidencia/e4-*`; lo que depende de otro integrante figura como **[pendiente: quién/qué]** y no se rellena con supuestos.

## 1. Arquitectura y alcance

El flujo atraviesa tres nubes. El punto de entrada es api-fastify (Azure/AKS), que llama a deport-back (GCP/GKE) y a Inventario-U (OCI) propagando `X-Trace-Id` y `X-Api-Key`. Este informe cubre la superficie de seguridad de ese flujo, no su rendimiento.

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
  subgraph OCI["OCI - Inventario-U (E1)"]
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

Fronteras de confianza: Internet → LB de GKE (autenticación por `X-Api-Key`), pod → Cloud SQL (proxy con identidad de servicio), deport-back → Inventario-U (a través de Internet, clave compartida) y deport-back → bucket de copias (otra región, proyecto propio). Recolección: logs JSON de deport-back en Cloud Logging → métricas basadas en logs → Grafana Cloud (alertas). La telemetría de Azure y OCI la aportan sus responsables **[pendiente: Peñuela/Marín]**.

## 2. Inventario de controles por capa

| Capa | Control | Propietario | Señal esperada | D3FEND (verificado) |
|---|---|---|---|---|
| Identidad | `X-Api-Key` compartida (`TEAM_API_KEY`, Secret Manager) | deport-back / grupo | 401 y evento `security_authentication_denied` | sin ID verificado |
| Identidad | Identidad de servicio hacia Cloud SQL | deport-back | acceso solo desde el proxy | sin ID verificado |
| Identidad | Identidad de máquina/agente de Inventario-U | Marín | **[pendiente: Marín]** | **[pendiente: Marín]** |
| Red | LB HTTP de GKE | deport-back | tráfico solo a puertos publicados | sin ID verificado |
| Red | Segmentación este-oeste | Peñuela | **[pendiente: Peñuela]** | **[pendiente: Peñuela]** |
| Carga | HPA 2–5, probes, límites; timeout + circuit breaker | deport-back | `circuit_breaker_opened`, `dependency_failure` | sin ID verificado |
| Carga | Límite de borrados por llamador (10/min, HTTP 429) | deport-back | `security_mass_delete_blocked` | sin ID verificado (se traza a NIST SC-5/AC-3) |
| Datos | Backups y PITR de Cloud SQL | deport-back | clon a un instante previo | D3-RD Restore Database |
| Datos | Export a bucket aislado, versionado, retención 6 h | deport-back | versión no vigente retenida tras borrado | D3-RO Restore Object |
| Detección | Evento `deportista_deleted` + alerta “E4 - Borrado masivo de deportistas” | deport-back | alerta firing con ≥ 10 borrados en 5 min | D3-RAPA Resource Access Pattern Analysis |
| Detección | Honeytoken (deportista señuelo) | deport-back | `security_honeytoken_triggered` | D3-DO Decoy Object |
| Detección | Telemetría y alertas de E1–E3 | Marín / Peñuela | **[pendiente: Peñuela/Marín]** | **[pendiente]** |
| Respuesta | `parar.sh`, `revertir.sh` (trap EXIT) | deport-back | `REVERSION OK` | sin ID verificado |

## 3. Reglas de compromiso

Alcance: proyecto GCP, clúster y Cloud SQL propios; datos sintéticos (`e4-<n>-<runid>@example.com`); los dos deportistas del flujo quedan fuera del radio y se verifican al revertir. Interruptor de parada: `security/experiments/e4-datos/parar.sh` (corta el ataque y revierte). Reversión automática: `trap EXIT` que ejecuta `revertir.sh`. Bitácora: un archivo `bitacora-r<n>.md` con hora UTC por paso. Ventana: R0 19:14–19:26 y R1 20:05–20:28 del 2026-11-17. Condiciones completas en `security/game-day/reglas-compromiso.md`.

Aclaración honesta: estas condiciones (ventana, datos sintéticos, parada, reversión, bitácora) las acordó el equipo por chat el 2026-11-17 antes de la R0; el documento no está firmado: **[pendiente: firma de los 3 integrantes]**.

## 4. Estado estable medido antes de tocar nada

Medido por el paso (a) de la R0 (`bitacora-r0.md`, 19:14:13–19:14:16):

| Aspecto | Valor medido |
|---|---|
| Deportistas vía API | 2 (los del flujo) |
| Backups / PITR de Cloud SQL | apagados / apagados |
| `SECURITY_DELETE_LIMIT_ENABLED` | `false` |
| Regla de alerta de borrado masivo | no existe |
| Telemetría | el evento JSON `deportista_deleted` ya se emitía a Cloud Logging |

Estado estable de E1–E3: **[pendiente: Marín/Peñuela]**.

## 5. Hipótesis por experimento

Forma: *dado el control C, cuando ocurra A, esperamos la señal S en ≤ T1 y contención ≤ T2*.

| Exp. | Hipótesis |
|---|---|
| E4 | Dado el control de borrado masivo (límite por llamador, alerta, backups con PITR, copia aislada), cuando se borren deportistas con una credencial válida (T1078 + T1485), esperamos la alerta de Grafana (≥ 10 borrados en 5 min) en **T1 = 5 min** y el primer 429 en **T2 = 2 min**, con **RPO = 0** (`security/experiments/e4-datos/README.md`). |
| E1 | **[pendiente: Marín — control, adversario, T1, T2]** |
| E2 | **[pendiente: Peñuela — control, adversario, T1, T2]** |
| E3 | **[pendiente: Peñuela — control, adversario, T1, T2]** |

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
| MTTD | no detectado (10 min) | 37,5 s |
| MTTC | no contenido | 1,9 s |
| Borrados | 50/50 | 20/50 (30 × 429) |
| Cobertura de detección | 0/2 | 1/2 |
| Falsos positivos | **[pendiente: historial de la alerta en Grafana]** | **[pendiente: historial de la alerta en Grafana]** |
| RPO | 50 registros (100 %) | 0 (20/20 restaurados; punto PITR 20:09:40Z, 1 s antes del ataque) |
| RTO | no recuperable | 1043 s |

Cobertura 1/2: T1485 se detecta por la alerta; T1078 no es distinguible porque la clave válida es compartida por el equipo, de modo que un uso legítimo y uno malicioso producen la misma identidad.

**Inmutabilidad de la copia.** En R1 el paso de ataque borró el export `r1200522.sql.gz`; al listar versiones del objeto, la versión no vigente `#1794946045190266` seguía retenida (versionado + retención de 6 h). La retención se dejó sin bloquear a propósito para que `terraform destroy` siempre funcione (ver §11 y §14). El mensaje original del script “no hay inmutabilidad” era incorrecto y se corrigió.

## 7. E1, E2 y E3

**E1 — Identidad (Marín, OCI).** Hipótesis: **[pendiente: Marín]**. Rondas R0/R1: **[pendiente: Marín]**. MTTD/MTTC: **[pendiente: Marín]**.

**E2 — Segmentación (Peñuela, Azure).** Hipótesis: **[pendiente: Peñuela]**. Rondas R0/R1: **[pendiente: Peñuela]**. MTTD/MTTC: **[pendiente: Peñuela]**.

**E3 — Telemetría e IA (Peñuela, Azure).** Hipótesis: **[pendiente: Peñuela]**. Rondas R0/R1: **[pendiente: Peñuela]**. MTTD/MTTC: **[pendiente: Peñuela]**.

## 8. Mejoras aplicadas (deport-back)

| Mejora | Control resultante | Marco verificado |
|---|---|---|
| Alerta como código: ≥ 10 borrados en 5 min, evaluación cada 30 s | detección de patrón anómalo de acceso | D3-RAPA |
| Límite de 10 borrados/min por llamador (HTTP 429) | contención del abuso con credencial válida | NIST SC-5, AC-3 (sin ID D3FEND) |
| Backups + PITR de Cloud SQL | recuperación a un instante | D3-RD |
| Copia aislada en bucket US-EAST1, versionada | restauración de objetos | D3-RO |
| Honeytoken (deportista señuelo con alerta) | detección temprana de reconocimiento/acceso indebido | D3-DO Decoy Object (consultado 2026-11-17 en la API de D3FEND) |

## 9. Detección como código

`security/detections/rules.yaml` define 5 reglas con 10 fixtures (positivo y negativo por regla), validadas por `scripts/validate-security-detections.js`. Las reglas E4 (`mass-delete-deportistas`, `honeytoken-deportista`) están implementadas y publicadas; las de E1–E3 siguen en diseño. Las alertas de Grafana se versionan en `observability/grafana/alerta-e4.json` y `alerta-honeytoken.json` y las publica el workflow `grafana-alerta-e4.yml` con un secreto de GitHub (el token no se guarda en el repositorio).

## 10. Tendencias

**(a) Honeytoken con alerta.** Implementado en deport-back: `HoneytokenInterceptor` emite el evento `security_honeytoken_triggered` cuando se consulta un id señuelo (`SECURITY_HONEYTOKEN_IDS`) sin alterar la respuesta, la métrica `deport-back-honeytoken-triggered` lo cuenta y la alerta “Honeytoken - acceso a deportista señuelo” dispara con > 0 en 5 min. Resultado: **[pendiente: prueba de disparo y MTTD]**. Fuentes: la rúbrica del curso lista “honeytoken con alerta” como ejemplo de tendencia; MITRE D3FEND D3-DO Decoy Object (consultado 2026-11-17).

**(b)** **[pendiente: segunda tendencia — Peñuela (E3)]**.

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

**Humano en el bucle.** Toda acción destructiva (ataques de R0 y R1, cambios de IAM, despliegues) requirió confirmación explícita del usuario.

## 12. Caos sobre la capa de IA

**[pendiente: Peñuela, E3 — inyección indirecta AML.T0051.001 / OWASP LLM01:2025, mitigación y repetición]**

## 13. Trazabilidad control–experimento–marco

| Control (deport-back) | Exp. | ISO/IEC 27001:2022 A (fuente secundaria) | NIST SP 800-53 r5 | NIST SP 800-207 (tenet) |
|---|---|---|---|---|
| Backups + PITR, clon de restauración | E4 | 8.13 Information backup | CP-9, CP-10 | 7: recopilar información para mejorar la postura |
| Copia aislada versionada | E4 | 8.13 Information backup | CP-9 | 7 |
| Evento `deportista_deleted` y logs JSON | E4 | 8.15 Logging | AU-2, AU-12 | 7 |
| Alerta de borrado masivo y honeytoken | E4 | 8.16 Monitoring activities; 5.24/5.26 incidentes | AU-6, SI-4, IR-4, IR-5 | 4: política dinámica según el estado observado |
| Límite de borrados por llamador | E4 | 5.24/5.26 incidentes | SC-5, AC-3 | 3: acceso por sesión con mínimo privilegio |
| Credencial compartida (hallazgo) | E4/E1 | — | AC-6 | 3 |
| Controles de E1–E3 | E1–E3 | **[pendiente: Marín/Peñuela]** | **[pendiente]** | **[pendiente]** |

## 14. Lecciones, riesgos residuales y próximos experimentos

- **Límite en memoria por pod.** Con 2 réplicas pasaron 20 borrados en lugar de 10. Próximo paso: contador compartido (por ejemplo Redis).
- **Clave compartida.** `TEAM_API_KEY` hace indistinguible T1078; la corrección es una credencial efímera por llamador, en la capa de E1.
- **Retención sin bloquear.** Un atacante con permisos puede borrar versiones; es el costo de poder destruir la infraestructura. Alternativa: bloqueo en un proyecto aparte.
- **RTO de 1043 s.** Lo domina la creación del clon en `db-f1-micro` (el intento 1 agotó su espera a ~10 min). Próximo: réplica en espera o restauración con menor alcance.
- **Limpieza de clones.** En R1 el borrado del clon falló y `revertir.sh` lo señaló como fallo; debe verificarse y reintentarse.
- **Correlación.** El log `http_request` no incluye `trace_id`; se correlacionó por marca de tiempo.
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
