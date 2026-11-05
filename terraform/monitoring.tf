resource "google_logging_metric" "http_requests_by_track" {
  name       = "${var.app_name}-http-requests-by-track"
  filter     = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"http_request\""
  depends_on = [google_project_iam_member.logging_config_writer]

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"

    labels {
      key        = "track"
      value_type = "STRING"
    }

    labels {
      key        = "version"
      value_type = "STRING"
    }
  }

  label_extractors = {
    track   = "EXTRACT(jsonPayload.app_track)"
    version = "EXTRACT(jsonPayload.app_version)"
  }
}

resource "google_logging_metric" "http_errors_by_track" {
  name       = "${var.app_name}-http-errors-by-track"
  filter     = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"http_request\" AND jsonPayload.status >= 500"
  depends_on = [google_project_iam_member.logging_config_writer]

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"

    labels {
      key        = "track"
      value_type = "STRING"
    }
  }

  label_extractors = {
    track = "EXTRACT(jsonPayload.app_track)"
  }
}

resource "google_logging_metric" "http_client_errors_by_track" {
  name       = "${var.app_name}-http-client-errors-by-track"
  filter     = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"http_request\" AND jsonPayload.status >= 400 AND jsonPayload.status < 500"
  depends_on = [google_project_iam_member.logging_config_writer]

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"

    labels {
      key        = "track"
      value_type = "STRING"
    }
  }

  label_extractors = {
    track = "EXTRACT(jsonPayload.app_track)"
  }
}

resource "google_logging_metric" "http_latency_by_track" {
  name       = "${var.app_name}-http-latency-by-track"
  filter     = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"http_request\""
  depends_on = [google_project_iam_member.logging_config_writer]

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "DISTRIBUTION"
    unit        = "ms"

    labels {
      key        = "track"
      value_type = "STRING"
    }
  }

  value_extractor = "EXTRACT(jsonPayload.duration_ms)"

  bucket_options {
    linear_buckets {
      num_finite_buckets = 20
      width              = 100
      offset             = 0
    }
  }

  label_extractors = {
    track = "EXTRACT(jsonPayload.app_track)"
  }
}

resource "google_logging_metric" "deportistas_created" {
  name       = "${var.app_name}-deportistas-created"
  filter     = "resource.type=\"cloud_run_revision\" AND jsonPayload.event=\"deportista_created\""
  depends_on = [google_project_iam_member.logging_config_writer]

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_dashboard" "canary" {
  depends_on = [google_project_iam_member.monitoring_dashboard_editor]

  dashboard_json = jsonencode({
    displayName = "${var.app_name} Canary SLI/SLO"
    gridLayout = {
      columns = "2"
      widgets = [
        {
          title = "Solicitudes actuales"
          scorecard = {
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_requests_by_track.name}\""
                aggregation = {
                  alignmentPeriod    = "60s"
                  perSeriesAligner   = "ALIGN_RATE"
                  crossSeriesReducer = "REDUCE_SUM"
                }
              }
            }
          }
        },
        {
          title = "Errores 5xx actuales"
          scorecard = {
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_errors_by_track.name}\""
                aggregation = {
                  alignmentPeriod    = "60s"
                  perSeriesAligner   = "ALIGN_RATE"
                  crossSeriesReducer = "REDUCE_SUM"
                }
              }
            }
          }
        },
        {
          title = "Latencia media (ms)"
          scorecard = {
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_latency_by_track.name}\""
                aggregation = {
                  alignmentPeriod    = "60s"
                  perSeriesAligner   = "ALIGN_DELTA"
                  crossSeriesReducer = "REDUCE_MEAN"
                }
              }
            }
          }
        },
        {
          title = "Deportistas creados"
          scorecard = {
            timeSeriesQuery = {
              timeSeriesFilter = {
                filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.deportistas_created.name}\""
                aggregation = {
                  alignmentPeriod    = "60s"
                  perSeriesAligner   = "ALIGN_SUM"
                  crossSeriesReducer = "REDUCE_SUM"
                }
              }
            }
          }
        },
        {
          title = "Objetivos Canary"
          text = {
            content = "### SLO Canary\n\n- Error rate objetivo: **0%**\n- Latencia media objetivo: **< 1000 ms**\n- Promoción: **10% → 25% → 50% → 100%**\n- Rollback: **stable 100% / canary 0%**"
            format  = "MARKDOWN"
          }
        },
        {
          title = "Peticiones por track"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_requests_by_track.name}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["metric.label.track"]
                  }
                }
              }
              plotType = "LINE"
            }]
            timeshiftDuration = "0s"
          }
        },
        {
          title = "Errores 5xx por track"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_errors_by_track.name}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["metric.label.track"]
                  }
                }
              }
              plotType = "LINE"
            }]
          }
        },
        {
          title = "Errores 4xx por track"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_client_errors_by_track.name}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_RATE"
                    crossSeriesReducer = "REDUCE_SUM"
                    groupByFields      = ["metric.label.track"]
                  }
                }
              }
              plotType = "LINE"
            }]
          }
        },
        {
          title = "Latencia por track (ms)"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_latency_by_track.name}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_DELTA"
                    crossSeriesReducer = "REDUCE_MEAN"
                    groupByFields      = ["metric.label.track"]
                  }
                }
              }
              plotType = "LINE"
            }]
          }
        },
        {
          title = "Métrica de negocio: deportistas creados"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.deportistas_created.name}\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_SUM"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
              plotType = "LINE"
            }]
          }
        }
      ]
    }
  })
}
