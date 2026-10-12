resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.app_name
  description   = "Repositorio Docker para ${var.app_name}"
  format        = "DOCKER"
}
