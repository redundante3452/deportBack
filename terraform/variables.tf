variable "project_id" {
  description = "ID del proyecto de Google Cloud."
  type        = string
}

variable "region" {
  description = "Región de Google Cloud para Artifact Registry, Cloud SQL y Cloud Run."
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
