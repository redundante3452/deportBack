resource "google_cloud_run_v2_service" "app" {
  name                = var.app_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.cloud_run.email

    volumes {
      name = "cloudsql"

      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }

    containers {
      image = var.image

      ports {
        container_port = 3000
      }

      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
      }

      env {
        name  = "DB_NAME"
        value = var.db_name
      }

      env {
        name  = "DB_USER"
        value = var.db_user
      }

      env {
        name  = "APP_VERSION"
        value = "v2"
      }

      env {
        name  = "APP_TRACK"
        value = "stable"
      }

      env {
        name = "DB_PASSWORD"

        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      # Dependencias externas del flujo (vacías = no se llama a esa API)
      env {
        name  = "API_FASTIFY_URL"
        value = var.api_fastify_url
      }

      env {
        name  = "INVENTARIO_U_URL"
        value = var.inventario_u_url
      }

      env {
        name  = "SECURITY_HONEYTOKEN_IDS"
        value = var.honeytoken_ids
      }

      env {
        name = "TEAM_API_KEY"

        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.team_api_key.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  depends_on = [google_secret_manager_secret_iam_member.team_api_key_accessor]
}

# La clave compartida entre las tres APIs se rota fuera de Terraform en el
# secreto "team-api-key"; Cloud Run lee siempre la última versión.
data "google_secret_manager_secret" "team_api_key" {
  secret_id = "team-api-key"
}

resource "google_secret_manager_secret_iam_member" "team_api_key_accessor" {
  secret_id = data.google_secret_manager_secret.team_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  name     = google_cloud_run_v2_service.app.name
  location = google_cloud_run_v2_service.app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
