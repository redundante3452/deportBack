variable "project_id" {
  description = "ID del proyecto de Google Cloud."
  type        = string
}

variable "region" {
  description = "Región de Google Cloud para Artifact Registry y Cloud Run."
  type        = string
  default     = "us-central1"
}

variable "db_region" {
  description = "Región de Google Cloud para Cloud SQL."
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "Nombre base de los recursos de la aplicación."
  type        = string
  default     = "deport-back"
}

variable "db_name" {
  description = "Nombre de la base de datos PostgreSQL."
  type        = string
  default     = "deport_db"
}

variable "db_user" {
  description = "Usuario de la base de datos PostgreSQL."
  type        = string
  default     = "deport_user"
}

variable "image" {
  description = "Imagen Docker completa que ejecutará Cloud Run."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "gke_cluster_name" {
  description = "Nombre del clúster GKE Autopilot."
  type        = string
  default     = "deport-back-gke"
}

variable "gke_namespace" {
  description = "Namespace de Kubernetes para la API."
  type        = string
  default     = "deport-back"
}

variable "api_fastify_url" {
  description = "URL pública de api-fastify para llamadas entre APIs."
  type        = string
  default     = ""
}

variable "inventario_u_url" {
  description = "URL pública de Inventario-U para llamadas entre APIs."
  type        = string
  default     = ""
}

variable "redis_host" {
  description = "IP o hostname de Redis para la aplicación en GKE."
  type        = string
  default     = ""
}

variable "team_api_key" {
  description = "Clave compartida entre APIs; se entrega por tfvars o CI y no se versiona."
  type        = string
  sensitive   = true
  default     = ""
}
