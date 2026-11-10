resource "google_project_service" "container" {
  project            = var.project_id
  service            = "container.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "compute" {
  project            = var.project_id
  service            = "compute.googleapis.com"
  disable_on_destroy = false
}

resource "google_container_cluster" "gke" {
  name                = var.gke_cluster_name
  location            = var.region
  enable_autopilot    = true
  deletion_protection = false

  release_channel {
    channel = "REGULAR"
  }

  network    = "default"
  subnetwork = "default"

  depends_on = [
    google_project_service.container,
    google_project_service.compute,
  ]
}

resource "google_service_account" "gke_workload" {
  account_id   = "${var.app_name}-gke"
  display_name = "Workload Identity de ${var.app_name} en GKE"
}

resource "google_project_iam_member" "gke_cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.gke_workload.email}"
}

resource "google_secret_manager_secret_iam_member" "gke_db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.gke_workload.email}"
}
