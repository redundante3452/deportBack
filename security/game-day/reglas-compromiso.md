---
title: Reglas de compromiso — Game day de Caos de Seguridad
subtitle: Énfasis en Defensa en Profundidad — Evaluación final 2026-2
---

**Grupo:** Alejandro Peñuela · Alejandro Marín · Alejandro Hernández
**Arquitectura:** api-fastify (Azure/AKS) → deport-back (GCP) → Inventario-U (AWS)

> **Declaración de vigencia.** Las condiciones de este documento las acordó el grupo por chat el
> 2026-11-17, antes de la primera ronda (R0 del E4, 19:14 UTC). Este documento las formaliza
> y se firmó después de ejecutar los experimentos.

## 1. Responsables y alcance autorizado

| Exp. | Responsable | Nube y recursos autorizados (solo propios del grupo) |
|---|---|---|
| Coordinación | Alejandro Peñuela | Coordinador del flujo `api-fastify` (`/api/v2/articulos/:id`) |
| E1 — Identidad | Alejandro Marín | AWS: VM y API de Inventario-U (`/api/v2`), su Prometheus/Grafana |
| E2 — Segmentación | Alejandro Peñuela | Azure: AKS y servicios de `api-fastify` |
| E3 — Telemetría e IA | Alejandro Peñuela | Azure: Alloy, Grafana Cloud (Loki/Mimir), asistente de triage (API de Gemini) |
| E4 — Resiliencia de datos (grupal) | Alejandro Hernández | GCP, proyecto `deport-back`: GKE `deport-back-gke`, Cloud SQL `deport-back-sql` (y sus clones temporales), bucket `deport-back-e4-copias-*` |

Queda **prohibido** actuar sobre recursos de la Universidad, de terceros o de otros grupos, y usar como
objetivo cualquier IP o cuenta cuya propiedad no se haya confirmado. Hacerlo anula la entrega.

## 2. Datos y radio de impacto

- Solo datos **sintéticos y desechables**. En el E4: `e4-<n>-<runid>@example.com`.
- Fuera de todo radio de impacto: los deportistas del flujo (`296f5b48-…`, `a2809c60-…`) y el señuelo
  (`0e830672-…`); se verifican intactos al revertir.
- No se usan credenciales reales de personas ni se modifican identidades administrativas.
- Ninguna regla o recurso compartido se cambia sin copia previa y plan de reversión.
- Un experimento a la vez; **no se despliega mientras corre una ronda**.

## 3. Ventanas (UTC)

| Exp. | Ronda | Inicio – fin | Ejecución (run) |
|---|---|---|---|
| E4 | R0 | 2026-11-17 19:14 – 19:26 | 44156311249 |
| E4 | R1 (intento 1, recuperación fallida) | 2026-11-17 19:44 – 20:03 | 44161780348 |
| E4 | R1 | 2026-11-17 20:05 – 20:28 | 44165423069 |
| E4 | R1 repetición | 2026-11-18 03:08 – 03:45 | 44228119507 |
| E4 | Caso negativo (intentos 1 y 2) | 2026-11-18 03:45 – 04:01 | 44232516003 · 44233528772 |
| E4 | Honeytoken (tendencia) | 2026-11-17 21:16 – 21:18 | 44178025923 |
| E1 (oficial, Marín) | R0 / R1 | 2026-11-18 05:39:24 – 05:40:17 / 05:41:04 – 05:41:44 | `f5c0fde6…` / `8f1e8c3e…` (verificación: run 44247381296) |
| E1 piloto (Peñuela, Azure) | R0 | 2026-11-17 20:50 – 20:55 | 44173454944 |
| E1 piloto (Peñuela, Azure) | R1 | 2026-11-18 00:45 – 00:51 | 44210464129 |
| E2 | R0 | 2026-11-17 23:55 – 2026-11-18 00:01 | 44203595125 |
| E2 | R1 / R1b | 2026-11-18 00:04 – 00:06 / 00:06 – 00:10 | 44204725933 / 44205109552 |
| E3-A | R1 / R0 (en ese orden) | 2026-11-18 00:33 – 00:38 / 00:39 – 00:45 | 44208851146 / 44209548922 |
| E3-B | R0 / R1 (manual, sin pipeline) | 2026-11-17 21:44 – 21:46 / 21:49 – 21:52 | `resultados/seguridad/ia-triage-{naive,seguro}-v{1,2,3}-*.json` |

Canal de comunicación: chat del grupo. El responsable avisa antes de iniciar y al terminar cada ronda.

## 4. Interruptor de parada

Se detiene la ronda de inmediato si ocurre cualquiera de estas condiciones:

1. se afecta un recurso fuera del alcance autorizado;
2. se pierde la trazabilidad del `trace_id` / `execution_id`;
3. se afectan los datos del flujo o del señuelo;
4. se afecta una operación de administración o de recuperación no prevista;
5. no se puede comprobar la reversión;
6. termina la ventana.

| Exp. | Acción de parada documentada |
|---|---|
| E4 | `security/experiments/e4-datos/parar.sh` (o `gameday-e4.yml` con `accion=parar`): corta el ataque y revierte |
| E1 (oficial, Marín) | `uv run python -m deploy.security.aws_e1 stop` (detiene la carga; borra solo sus SKU y verifica GET 404 y salud 200) |
| E1 piloto | `seguridad/experimentos/exp1-identidad/parar.sh` (fichero de parada; el ataque solo lee) · reversión `revertir.sh` |
| E2 | `seguridad/experimentos/e2-exposicion/parar.sh` (≤ 8 s: borra el Service expuesto) · reversión `revertir.sh` |
| E3-A | `seguridad/experimentos/e3-telemetria/parar.sh` (5 s: restaura Alloy) · reversión `revertir.sh` (`REVERSION OK`) |
| E3-B | Sin script: el asistente no ejecuta acciones; parar = no relanzar `triage.mjs --inyectar` |

En las ejecuciones por pipeline (`defensa-gate.yml` de api-fastify y `gameday-e4.yml` de deport-back) la
parada operativa es **cancelar el run**: la reversión corre siempre (`if: always()` / `trap EXIT`).
Rutas de E1 piloto, E2 y E3 en el repositorio de api-fastify, rama `produccion`.

## 5. Reversión

Cada ronda termina con la reversión, que debe: retirar la inyección o el ataque; restaurar la
configuración inicial (en el E4: límite de borrados apagado, sembrados borrados, clones eliminados);
comprobar pods, servicios y una petición sintética completa del flujo; y registrar hora UTC, ejecutor y
resultado. En el E4 la reversión es automática (`trap EXIT` → `revertir.sh`).

## 6. Bitácora y evidencia

Cada ronda registra `timestamp_utc, execution_id, ronda, experimento, trace_id, actor, acción, recurso,
señal esperada, señal observada, estado`. Toda cifra del informe debe salir de evidencia versionada con
sello de tiempo; no se aceptan resultados fabricados ni capturas sin identificador de ejecución.
Toda acción destructiva requiere la aprobación explícita del responsable de su experimento.

## 7. Aceptación

Con su firma, cada integrante declara que conoce y acepta estas reglas, y que los experimentos bajo su
responsabilidad se ejecutaron dentro de ellas. Las firmas van en la hoja siguiente.

<div style="page-break-before:always;"></div>

<div style="margin-top:120px;font-size:11pt;">
<p>ESTA HOJA DE FIRMAS PERTENECE A LAS REGLAS DE COMPROMISO DEL GAME DAY DE CAOS DE SEGURIDAD
(ÉNFASIS EN DEFENSA EN PROFUNDIDAD — EVALUACIÓN FINAL 2026-2) DEL GRUPO: ALEJANDRO PEÑUELA,
ALEJANDRO MARÍN Y ALEJANDRO HERNÁNDEZ.</p>
</div>

<div style="margin-top:40px;">
<div style="width:45%;display:inline-block;vertical-align:top;margin-top:90px;">
<div style="border-top:1px solid #000;width:90%;"></div>
<p style="margin:6px 0 0 0;font-size:10pt;">NOMBRE Y FIRMA: ALEJANDRO PEÑUELA</p>
<p style="margin:2px 0 0 0;font-size:10pt;">COORDINADOR · E2 Y E3 · api-fastify (Azure)</p>
</div>
<div style="width:45%;display:inline-block;vertical-align:top;margin-top:90px;">
<div style="border-top:1px solid #000;width:90%;"></div>
<p style="margin:6px 0 0 0;font-size:10pt;">NOMBRE Y FIRMA: ALEJANDRO MARÍN</p>
<p style="margin:2px 0 0 0;font-size:10pt;">RESPONSABLE E1 · Inventario-U (AWS)</p>
</div>
</div>
<div>
<div style="width:45%;display:inline-block;vertical-align:top;margin-top:90px;">
<div style="border-top:1px solid #000;width:90%;"></div>
<p style="margin:6px 0 0 0;font-size:10pt;">NOMBRE Y FIRMA: ALEJANDRO HERNÁNDEZ</p>
<p style="margin:2px 0 0 0;font-size:10pt;">RESPONSABLE E4 (GRUPAL) · deport-back (GCP)</p>
</div>
</div>
