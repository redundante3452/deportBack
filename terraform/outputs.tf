output "service_url" {
  description = "URL pública del servicio Cloud Run."
  value       = google_cloud_run_v2_service.app.uri
}

output "sql_instance_name" {
  description = "Nombre de la instancia Cloud SQL."
  value       = google_sql_database_instance.postgres.name
}

output "registry_url" {
  description = "URL del repositorio Docker de Artifact Registry."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}
