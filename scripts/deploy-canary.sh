#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
: "${GCP_REGION:?GCP_REGION is required}"
: "${APP_NAME:?APP_NAME is required}"
: "${IMAGE:?IMAGE is required}"

gcloud run deploy "$APP_NAME" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --platform=managed \
  --image="$IMAGE" \
  --no-traffic \
  --tag=stable \
  --update-env-vars="APP_VERSION=v2,APP_TRACK=stable"

gcloud run services update-traffic "$APP_NAME" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --to-tags="stable=100"

gcloud run deploy "$APP_NAME" \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --platform=managed \
  --image="$IMAGE" \
  --no-traffic \
  --tag=canary \
  --update-env-vars="APP_VERSION=v3,APP_TRACK=canary"
