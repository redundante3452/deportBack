# Adopta recursos que quedaron creados en GCP tras un apply interrumpido y que
# no llegaron al estado remoto. Los bloques son idempotentes: una vez importados
# no hacen nada. Se pueden eliminar cuando el estado ya los contenga.

import {
  to = google_sql_database_instance.postgres
  id = "projects/${var.project_id}/instances/${var.app_name}-sql"
}

import {
  to = google_service_account.cloud_run
  id = "projects/${var.project_id}/serviceAccounts/${var.app_name}-run@${var.project_id}.iam.gserviceaccount.com"
}

import {
  to = google_service_account.gke_workload
  id = "projects/${var.project_id}/serviceAccounts/${var.app_name}-gke@${var.project_id}.iam.gserviceaccount.com"
}

import {
  to = google_secret_manager_secret.db_password
  id = "projects/${var.project_id}/secrets/${var.app_name}-db-password"
}
