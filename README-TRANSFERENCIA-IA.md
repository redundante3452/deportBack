# Contexto de transferencia para otra IA

## 1. Objetivo del proyecto

Este repositorio contiene `deport-back`, una API NestJS/TypeScript con PostgreSQL y TypeORM. Forma parte de una arquitectura multinube para un trabajo de DevOps e Ingeniería del Caos:

```text
api-fastify (Azure/AKS)
        ↓
Inventario-U (AWS)
        ↓
deport-back (GCP)
```

El objetivo del trabajo actual es demostrar un flujo síncrono entre las tres APIs, propagación de `X-Trace-Id`, inyección controlada de fallos, medición reproducible de Ronda 0 y Ronda 1, resiliencia y recuperación.

## 2. Estado actual del repositorio

Repositorio: `deport-back`

Rama principal trabajada: `main`

Último commit conocido:

```text
e2ca411 🛑 detener despliegues automáticos GCP
```

El árbol de Git tiene un archivo no relacionado sin seguimiento:

```text
diagrama-flujo-worker.html
```

No modificarlo, incluirlo ni eliminarlo salvo instrucción explícita.

## 3. Trabajo ya implementado

### Aplicación

- API NestJS con PostgreSQL y TypeORM.
- Configuración de base de datos mediante variables de entorno.
- Soporte para socket Unix de Cloud SQL.
- Cliente HTTP externo con timeout y circuit breaker.
- Bloqueo de dependencias `http://` en producción.
- Validación TLS configurable para PostgreSQL.
- Propagación y uso de identificadores de trazabilidad según el flujo.
- API v3 y CRUD relacionado ya implementados.

Archivos importantes:

- `src/app.module.ts`
- `src/common/http-externo/http-externo.service.ts`
- `src/deportistas/controllers/`
- `src/deportistas/services/`

### Terraform y GCP

Existe infraestructura modular en `terraform/` para:

- Cloud SQL PostgreSQL 15.
- Artifact Registry.
- Secret Manager.
- IAM.
- Cloud Run.
- GKE Autopilot.
- Workloads de Kubernetes.
- Cloud Monitoring.
- Dashboards de Canary y caos.
- Backend remoto de Terraform en GCS.

Archivos principales:

- `terraform/providers.tf`
- `terraform/cloud_sql.tf`
- `terraform/cloud_run.tf`
- `terraform/gke.tf`
- `terraform/gke_workloads.tf`
- `terraform/monitoring.tf`
- `terraform/outputs.tf`
- `terraform/README.md`

El despliegue automático está protegido por:

```yaml
if: ${{ vars.ENABLE_GCP_DEPLOY == 'true' }}
```

No habilitarlo sin confirmar permisos, URLs, secretos y ventana de costos.

### Workflows

- `.github/workflows/deploy.yml`
  - Despliegue condicionado a `ENABLE_GCP_DEPLOY=true`.
  - Crea Artifact Registry.
  - Construye y publica la imagen.
  - Aplica Terraform.

- `.github/workflows/destroy.yml`
  - Genera un plan de destrucción.
  - Aplica exactamente ese plan.
  - Usa el backend remoto y variables completas.

- `.github/workflows/chaos-gate.yml`
  - Automatiza validaciones del experimento de caos.

### Ingeniería del Caos

Existe una base para experimentos reproducibles en `chaos/` y `load/`:

- Fallo controlado de dependencia.
- NetworkChaos.
- Interruptor propio de caos.
- Carga con k6.
- Circuit breaker.
- Timeout.
- Degradación controlada.
- Chaos Gate.
- Configuración de Ronda 0 y Ronda 1.

Archivos importantes:

- `chaos/README.md`
- `chaos/experiments/dependency-unavailable.yaml`
- `load/k6-flow.js`
- `scripts/run-chaos-experiment.sh`

El experimento de `deport-back` se enfoca en la indisponibilidad o fallo de una dependencia externa. No ejecutar inyecciones reales sin autorización del equipo y sin una ventana definida.

### Seguridad

Se preparó documentación para Defensa en Profundidad y Game Day:

- E1: identidad.
- E2: segmentación.
- E3: telemetría/IA.
- E4: datos.
- Reglas de compromiso.
- Matriz de trazabilidad.
- Fixtures positivos y negativos.
- Validación de detecciones.
- Telemetría de autenticaciones rechazadas.

Archivos:

- `security/README.md`
- `security/game-day/`
- `security/detections/`
- `security/experiments/`
- `scripts/validate-security-detections.js`

## 4. Validaciones ya realizadas

Se han validado satisfactoriamente:

- `terraform validate`.
- `npm run build`.
- Pruebas del guard de API key.
- Pruebas de `HttpExternoService`.
- Validación de detecciones: 4 reglas y 8 fixtures.
- `git diff --check`.
- Destrucción real de infraestructura mediante Terraform.

No presentar estas validaciones locales como evidencia de una ejecución cloud multinube. Para la entrega final aún se necesitan mediciones reales de las tres nubes.

## 5. Infraestructura y costos

La infraestructura GCP fue destruida con resultado registrado:

```text
0 added, 0 changed, 29 destroyed
```

El bucket GCS del estado de Terraform permanece porque contiene el estado remoto y archivos asociados. No eliminarlo hasta confirmar que ya no se necesita Terraform.

Cloud SQL genera costos cuando se vuelve a crear. El workflow de deploy quedó bloqueado para evitar recreaciones accidentales.

Antes de desplegar nuevamente se debe:

1. Confirmar permisos del service account de GitHub.
2. Confirmar APIs habilitadas.
3. Confirmar URLs y secretos.
4. Confirmar que el grupo acepta los costos.
5. Habilitar explícitamente `ENABLE_GCP_DEPLOY=true`.

## 6. Pendientes principales

### Coordinación del grupo

Resolver con los compañeros:

- Quién será oficialmente el coordinador del flujo.
- Si el flujo oficial será el de `api-fastify` o el de `Inventario-U`.
- URL real de cada servicio.
- `TEAM_API_KEY` por canal privado.
- Contrato exacto de `X-Trace-Id`.
- IDs sintéticos usados para las pruebas.
- Reparto de experimentos y patrones de resiliencia.

Hay dos flujos coordinadores preparados:

1. `api-fastify`: `GET /api/v2/articulos/:id`.
2. `Inventario-U`: `GET /api/v2/integracion`.

No asumir cuál es el oficial sin confirmación del equipo.

### Ejecución DevOps

Orden recomendado:

1. Confirmar arquitectura, URLs y secretos.
2. Corregir permisos del service account de GCP.
3. Desplegar las tres APIs.
4. Validar el flujo síncrono sin fallos.
5. Confirmar propagación de `X-Trace-Id`.
6. Capturar el estado estable.
7. Ejecutar Ronda 0.
8. Analizar resultados.
9. Aplicar o confirmar mejoras de resiliencia.
10. Ejecutar Ronda 1.
11. Validar el Chaos Gate.
12. Preparar dashboard y evidencia.
13. Completar el informe.
14. Ejecutar `terraform destroy` al terminar la sustentación.

### Evidencia pendiente

Todavía no afirmar que existen resultados cloud reales de Ronda 0 o Ronda 1. Faltan:

- URLs desplegadas.
- Ejecuciones reales de carga.
- Métricas de las tres nubes.
- Capturas o exportaciones del dashboard.
- Tiempos MTTD y MTTR medidos.
- Comparación antes/después.
- Evidencia del rollback o recuperación.

## 7. Dashboard de Grafana

Para este último trabajo de Ingeniería del Caos se necesita un dashboard de Grafana que cubra las tres nubes:

```text
GCP: deport-back
Azure: api-fastify
AWS: Inventario-U
```

Paneles mínimos:

1. Estado general del experimento.
2. Disponibilidad por nube.
3. Throughput y solicitudes por segundo.
4. Tasa de errores 4xx y 5xx.
5. Timeout y errores de dependencia.
6. Latencia promedio, p95 y p99.
7. Comparación Ronda 0 contra Ronda 1.
8. Estado y aperturas del circuit breaker.
9. Fallback o degradación.
10. MTTD y MTTR.
11. Línea temporal del fallo aplicado.
12. Flujo completo usando `X-Trace-Id`.

Etiquetas recomendadas:

```text
cloud
service
round
experiment
execution_id
trace_id
```

Grafana debe reutilizar las métricas existentes de Prometheus y las fuentes de datos disponibles en los repositorios del equipo. No inventar métricas ni porcentajes. Google Cloud Monitoring puede mantenerse como observabilidad interna de GCP, pero no es obligatorio crear un segundo dashboard para esta entrega si la guía solo exige Grafana.

## 8. Herramientas utilizadas

| Propósito | Herramienta |
|---|---|
| Infraestructura | Terraform |
| GCP | Cloud SQL, Cloud Run, GKE, Artifact Registry |
| Carga | k6 |
| Caos en `api-fastify` | Chaos Mesh |
| Caos en `Inventario-U` | Chaos Toolkit y Toxiproxy |
| Métricas | Prometheus |
| Dashboard | Grafana |
| Aplicación | NestJS, TypeScript, PostgreSQL, TypeORM |

## 9. Comandos útiles

Desde `deport-back`:

```powershell
pnpm run build
pnpm run security:detections
git status --short
```

Terraform:

```powershell
cd terraform
terraform init -reconfigure -backend-config="bucket=<TF_STATE_BUCKET>"
terraform validate
terraform plan
terraform apply
terraform plan -destroy -out=destroy.tfplan
terraform apply destroy.tfplan
```

No ejecutar `apply`, experimentos de caos o `destroy` sin autorización y sin confirmar el entorno correcto.

## 10. Reglas para la siguiente IA

- Responder en español.
- Revisar el código existente antes de crear archivos nuevos.
- Reutilizar servicios, scripts y dashboards existentes.
- No inventar URLs, métricas, resultados, integrantes ni evidencias.
- No exponer secretos por chat ni guardarlos en el repositorio.
- No modificar repositorios de compañeros sin coordinación.
- No incluir `diagrama-flujo-worker.html`.
- Mantener cambios pequeños y commits breves con GitMoji.
- No habilitar despliegues GCP automáticamente sin confirmación.
- No ejecutar fallos destructivos sin autorización explícita.
- Al finalizar la sustentación, destruir la infraestructura y verificar que el deploy automático siga deshabilitado.

## 11. Resultado esperado de la entrega

La entrega final debe demostrar, con evidencia real:

1. Flujo funcionando entre las tres nubes.
2. Trazabilidad de una solicitud completa.
3. Estado estable medido.
4. Fallo reproducible y controlado.
5. Impacto observable en Grafana.
6. Comportamiento de resiliencia.
7. Recuperación del sistema.
8. Comparación Ronda 0/Ronda 1.
9. Chaos Gate aprobado o rechazado según métricas.
10. Informe final y limpieza de infraestructura.
