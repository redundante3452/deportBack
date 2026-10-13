resource "google_service_account" "cloud_run" {
  account_id   = "${var.app_name}-run"
  display_name = "Service account de Cloud Run para ${var.app_name}"
}

resource "google_service_account_iam_member" "cloud_run_user" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:github-deploy@${var.project_id}.iam.gserviceaccount.com"
}

resource "google_project_iam_member" "cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "db_password_accessor" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
