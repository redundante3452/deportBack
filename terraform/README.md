# Infraestructura de deport-back en Google Cloud

Esta carpeta despliega la API NestJS en Cloud Run y PostgreSQL 15 en Cloud SQL.
Los recursos están separados por servicio para facilitar su revisión y mantenimiento.

## Prerrequisitos

- Terraform >= 1.5.
- Docker.
- Google Cloud CLI (`gcloud`) autenticado.
- Un proyecto GCP con facturación habilitada.
- Un bucket GCS existente para el estado remoto.
- Permisos para crear Artifact Registry, Cloud SQL, Cloud Run, Secret Manager e IAM.

## Autenticación en GCP

Para desarrollo local:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project MI_PROJECT_ID
```

Para CI, usa Workload Identity Federation o el secreto `GCP_SA_KEY` indicado en
el workflow. No guardes una llave JSON dentro del repositorio.

## Configuración y ejecución

```bash
cp terraform.tfvars.example terraform.tfvars
# Edita terraform.tfvars con tu project_id y valores reales.
terraform init -backend-config="bucket=MI_BUCKET_DE_TF_STATE"
terraform plan
terraform apply
```

El nombre del bucket se entrega a `terraform init` porque Terraform no permite
referenciar variables dentro del bloque de backend. El archivo `terraform.tfvars`
no debe subirse al repositorio.

## Build y push de la imagen

Desde la raíz del proyecto:

```bash
gcloud auth configure-docker REGION-docker.pkg.dev
gcloud artifacts repositories describe deport-back \
  --location=REGION \
  --project=MI_PROJECT_ID
docker build -t REGION-docker.pkg.dev/MI_PROJECT_ID/deport-back/deport-back:TAG .
docker push REGION-docker.pkg.dev/MI_PROJECT_ID/deport-back/deport-back:TAG
terraform apply -auto-approve \
  -var="project_id=MI_PROJECT_ID" \
  -var="region=REGION" \
  -var="image=REGION-docker.pkg.dev/MI_PROJECT_ID/deport-back/deport-back:TAG"
```

El workflow de despliegue automatiza este proceso usando el SHA del commit como tag.

## Eliminación al terminar la sustentación

Para evitar costos, elimina todos los recursos gestionados por Terraform cuando
termines la sustentación:

```bash
terraform destroy -auto-approve
```

El bucket del estado no es administrado por este módulo y debe eliminarse por separado
solo cuando ya no necesites conservar el estado.
