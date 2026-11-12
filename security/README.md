# Game Day de Caos de Seguridad

Este directorio contiene el entregable de Defensa en Profundidad. Es
independiente del informe de rendimiento y resiliencia del entregable DevOps.

## Estado de la evidencia

Los archivos de diseño son código y documentación versionados. Todavía no
contienen resultados de ejecución, alertas, capturas, MTTD, MTTC, RPO ni RTO.
Esos valores solo se completarán después de ejecutar los experimentos en
infraestructura propia, con autorización del grupo y datos sintéticos.

## Arquitectura comprobada en el repositorio

`deport-back` se despliega en GKE y usa Cloud SQL PostgreSQL, un proxy de Cloud
SQL como sidecar y Redis configurado para la caché. El endpoint compuesto
`GET /api/v2/deportistas/:id` consulta `/articulos` de `api-fastify` y `/skus`
de Inventario-U. El mismo `X-Trace-Id` se propaga en esas llamadas.

La existencia de recursos en Terraform o manifiestos no demuestra que estén
desplegados. Las URLs, cuentas, componentes de IA, almacenamiento de objetos,
alertas y estado de Chaos Mesh deben verificarse antes del game day.

## Experimentos

Las fichas YAML son contratos de diseño y alcance; no se aplican directamente a
un clúster hasta confirmar la plataforma declarativa compatible, el recurso
objetivo y las reglas de compromiso. Esta separación evita presentar un
manifiesto ilustrativo como una inyección ejecutable.

- [E1 - Identidad](experiments/e1-identidad.yaml)
- [E2 - Segmentación](experiments/e2-segmentacion.yaml)
- [E3 - Telemetría e IA](experiments/e3-telemetria-ia.yaml)
- [E4 - Datos](experiments/e4-datos.yaml)

## Documentación de ejecución

- [Reglas de compromiso](game-day/reglas-compromiso.md)
- [Inventario de controles](game-day/inventario-controles.md)
- [Hipótesis](game-day/hipotesis.md)
- [Bitácora](game-day/bitacora.md)
- [Detección como código](detections/README.md)
- [Matriz de trazabilidad](game-day/matriz-trazabilidad.md)

## Criterio de completitud

Un experimento solo se considera completado cuando tiene dos rondas
comparables, señales de telemetría con UTC y `trace_id`, MTTD y MTTC medidos,
reversión comprobada y evidencia conservada. Un valor desconocido se registra
como `no medido`, `no detectado` o `no contenido`; nunca se reemplaza por cero.
