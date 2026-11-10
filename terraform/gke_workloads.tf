resource "kubernetes_namespace" "app" {
  metadata {
    name = var.gke_namespace
  }
}

resource "google_service_account_iam_member" "gke_workload_identity" {
  service_account_id = google_service_account.gke_workload.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.gke_namespace}/${var.app_name}-sa]"
}

resource "kubernetes_service_account" "app" {
  metadata {
    name      = "${var.app_name}-sa"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.gke_workload.email
    }
  }
}

resource "kubernetes_config_map" "app" {
  metadata {
    name      = "${var.app_name}-config"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    NODE_ENV                           = "production"
    PORT                               = "3000"
    DB_HOST                            = "127.0.0.1"
    DB_PORT                            = "5432"
    DB_SSL                             = "false"
    API_FASTIFY_URL                    = var.api_fastify_url
    INVENTARIO_U_URL                   = var.inventario_u_url
    REDIS_HOST                         = var.redis_host
    REDIS_PORT                         = "6379"
    CHAOS_DEPENDENCY_FAILURE           = "false"
    CHAOS_DEPENDENCY_TARGET            = ""
    RESILIENCE_CIRCUIT_BREAKER_ENABLED = "true"
  }
}

resource "kubernetes_secret" "db" {
  metadata {
    name      = "${var.app_name}-db"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  type = "Opaque"

  data = {
    DB_NAME      = var.db_name
    DB_USER      = var.db_user
    DB_PASSWORD  = random_password.db.result
    TEAM_API_KEY = var.team_api_key
  }
}

resource "kubernetes_deployment" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace.app.metadata[0].name
    labels = {
      app = var.app_name
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = var.app_name
      }
    }

    template {
      metadata {
        labels = {
          app = var.app_name
        }
      }

      spec {
        service_account_name = kubernetes_service_account.app.metadata[0].name

        container {
          name              = var.app_name
          image             = var.image
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 3000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.app.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.db.metadata[0].name
            }
          }

          resources {
            requests = {
              cpu    = "250m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "1"
              memory = "512Mi"
            }
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 3000
            }
            initial_delay_seconds = 20
            period_seconds        = 20
          }
        }

        container {
          name  = "cloud-sql-proxy"
          image = "gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14.0"

          args = [
            "--structured-logs",
            "--port=5432",
            google_sql_database_instance.postgres.connection_name,
          ]

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    selector = {
      app = var.app_name
    }

    port {
      port        = 80
      target_port = 3000
    }

    type = "LoadBalancer"
  }
}

resource "kubernetes_horizontal_pod_autoscaler_v2" "app" {
  metadata {
    name      = var.app_name
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  spec {
    min_replicas = 2
    max_replicas = 5

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.app.metadata[0].name
    }

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }
  }
}
