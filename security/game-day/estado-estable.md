# Estado estable de seguridad

Este registro se completa antes de la Ronda 0 en la infraestructura autorizada.
La configuración escrita en Terraform no sustituye una medición en ejecución.

## Identificación

| Campo | Valor |
|---|---|
| execution_id | Pendiente |
| timestamp_inicio_utc | Pendiente |
| timestamp_fin_utc | Pendiente |
| commit | Pendiente |
| entorno | Pendiente de confirmar |
| responsable | Pendiente |

## Controles observados

| Capa | Control | Activo | Evidencia | Verificado en |
|---|---|---:|---|---|
| Identidad | Workload Identity | Pendiente | Pendiente | GCP |
| Red | Segmentación/denegación por defecto | Pendiente | Pendiente | GCP |
| Workload | Probes, réplicas y límites | Pendiente | Pendiente | GKE |
| Datos | Copia aislada e inmutabilidad | Pendiente | Pendiente | Nube del grupo |
| Detección | Logs y alertas | Pendiente | Pendiente | Plataforma real |

## Cobertura de telemetría

| Señal | Fuente | Correlación | Estado |
|---|---|---|---|
| Solicitud HTTP | Logs estructurados | `trace_id` | Pendiente |
| Denegación de identidad | Audit logs | `execution_id` | Pendiente |
| Cambio de red | Audit/Network logs | `execution_id` | Pendiente |
| Heartbeat de telemetría | Métrica de presencia | `execution_id` | Pendiente |
| Protección de datos | Logs de almacenamiento | `execution_id` | Pendiente |

## Línea base

| Experimento | Técnica emulada | MTTD individual | MTTC individual | Cobertura | Falsos positivos | Estado |
|---|---|---|---|---:|---:|---|
| E1 | Pendiente | no medido | no medido | no medido | no medido | Pendiente |
| E2 | Pendiente | no medido | no medido | no medido | no medido | Pendiente |
| E3 | Pendiente | no medido | no medido | no medido | no medido | Pendiente |
| E4 | Pendiente | no medido | no medido | no medido | no medido | Pendiente |

No usar `0` para indicar ausencia de medición. Usar `no medido`, `no detectado`
o `no contenido` según corresponda.
