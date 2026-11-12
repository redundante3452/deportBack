# Inventario de controles por capa

La columna `estado` distingue lo observado en archivos de lo que debe
verificarse en la nube.

| Capa | Control | Propietario | Señal esperada | Telemetría | D3FEND | Estado |
|---|---|---|---|---|---|---|
| Identidad | Workload Identity para GKE | deport-back | Rechazo de identidad fuera del workload | IAM audit logs | Verificar técnica exacta en fuente primaria | Configurado en Terraform; no verificado en ejecución |
| Identidad | Roles Cloud SQL/Secret Manager | deport-back | Denegación por privilegio insuficiente | Cloud Audit Logs | Verificar técnica exacta en fuente primaria | Configurado en Terraform; alcance pendiente |
| Identidad | `X-Api-Key` entre APIs | Grupo | 401 ante clave ausente o inválida | Logs HTTP | Verificar técnica exacta en fuente primaria | Implementado; es secreto estático |
| Red | Service `LoadBalancer` | deport-back | Acceso solo por frontera autorizada | VPC/Cloud Audit Logs | Verificar técnica exacta en fuente primaria | Configurado; exposición/TLS pendiente |
| Red | Segmentación este-oeste | Grupo | Conexión no autorizada bloqueada | Network Policy logs | Verificar técnica exacta en fuente primaria | No evidenciado en este repositorio |
| Workload | Réplicas, probes y límites | deport-back | Pod no saludable retirado del tráfico | Kubernetes events | Verificar técnica exacta en fuente primaria | Configurado en Terraform |
| Workload | Circuit breaker y timeout | deport-back | Dependencia contenida y error degradado | Logs `dependency_failure` | Verificar técnica exacta en fuente primaria | Implementado; eficacia pendiente |
| Datos | Cloud SQL gestionado | deport-back | Acceso auditado y restringido | Cloud SQL/IAM logs | Verificar técnica exacta en fuente primaria | Configurado; restauración pendiente |
| Datos | Copia inmutable y aislada | Grupo | Borrado no elimina la copia | Storage audit logs | Verificar técnica exacta en fuente primaria | No evidenciado |
| Detección | Métricas HTTP y de dependencia | deport-back | Serie temporal durante el evento | Cloud Monitoring | Verificar técnica exacta en fuente primaria | Configurado; alertas pendientes |
| Detección | Alerta por ausencia de telemetría | Grupo | Señal de heartbeat ausente | Monitoring/Logging | Verificar técnica exacta en fuente primaria | No evidenciado |
| Respuesta | Rollback y reversión | Grupo | Estado estable confirmado | Workflow/artifact logs | Verificar técnica exacta en fuente primaria | Existe rollback DevOps; game day pendiente |

Los identificadores D3FEND y los controles normativos se verificarán contra sus
fuentes oficiales antes de cerrar la matriz. No se inventan identificadores.
