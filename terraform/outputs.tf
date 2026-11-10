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

output "canary_dashboard_id" {
  description = "Identificador del dashboard de SLI/SLO del despliegue Canary."
  value       = google_monitoring_dashboard.canary.id
}

output "chaos_dashboard_id" {
  description = "Identificador del dashboard del experimento de caos."
  value       = google_monitoring_dashboard.chaos.id
}

output "gke_cluster_name" {
  description = "Nombre del clúster GKE Autopilot."
  value       = google_container_cluster.gke.name
}

output "gke_cluster_location" {
  description = "Región del clúster GKE."
  value       = google_container_cluster.gke.location
}

output "gke_endpoint" {
  description = "Endpoint privado de la API del clúster GKE."
  value       = google_container_cluster.gke.endpoint
  sensitive   = true
}

output "gke_load_balancer_ip" {
  description = "IP externa del LoadBalancer de Kubernetes, disponible después del apply."
  value       = try(kubernetes_service.app.status[0].load_balancer[0].ingress[0].ip, "")
}
