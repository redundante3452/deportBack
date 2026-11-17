resource "random_password" "db" {
  length  = 32
  special = true
}

resource "google_sql_database_instance" "postgres" {
  name                = "${var.app_name}-sql"
  database_version    = "POSTGRES_15"
  region              = var.db_region
  deletion_protection = false

  settings {
    tier                        = "db-f1-micro"
    availability_type           = "ZONAL"
    disk_type                   = "PD_SSD"
    disk_size                   = 10
    disk_autoresize             = true
    deletion_protection_enabled = false

    # E4: con enable_db_backups=false no se declara el bloque (estado de la Ronda 0:
    # sin backups ni PITR). Con true se activan backups diarios y PITR.
    dynamic "backup_configuration" {
      for_each = var.enable_db_backups ? [1] : []
      content {
        enabled                        = true
        point_in_time_recovery_enabled = true
        transaction_log_retention_days = 1

        backup_retention_settings {
          retained_backups = 3
        }
      }
    }
  }
}

resource "google_sql_database" "app" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = var.db_user
  instance = google_sql_database_instance.postgres.name
  password = random_password.db.result
}

data "google_project" "current" {
  project_id = var.project_id
}

# Copia aislada del experimento E4 (solo con enable_db_backups=true).
# Región distinta a Cloud SQL (us-central1) para aislamiento geográfico.
# La retención de 6 h NUNCA se bloquea (is_locked=false): un bloqueo impediría
# borrar el bucket y haría fallar `terraform destroy`.
resource "google_storage_bucket" "e4_copias" {
  count = var.enable_db_backups ? 1 : 0

  name                        = "${var.project_id}-e4-copias-${data.google_project.current.number}"
  location                    = "US-EAST1"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = true

  versioning {
    enabled = true
  }

  retention_policy {
    retention_period = 21600
    is_locked        = false
  }
}

resource "google_storage_bucket_iam_member" "e4_sql_export" {
  count = var.enable_db_backups ? 1 : 0

  bucket = google_storage_bucket.e4_copias[0].name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_sql_database_instance.postgres.service_account_email_address}"
}
