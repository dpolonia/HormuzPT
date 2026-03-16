#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# infra/scheduler.sh — Create/update Cloud Scheduler jobs
#
# Usage:
#   cd /home/dpolonia/HormuzPT
#   bash infra/scheduler.sh
#
# Creates two jobs:
#   1. hormuz-daily-refresh  — Every day at 23:59 → POST /api/refresh
#   2. hormuz-weekly-recal   — Every Monday at 00:01 → POST /recalibrate
#
# Prerequisites:
#   - gcloud authenticated
#   - Cloud Run services already deployed
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-hormuzpt}"
REGION="europe-west1"
COMPUTE_SA="487878867028-compute@developer.gserviceaccount.com"

gcloud config set project "$PROJECT_ID" --quiet

# ── Resolve service URLs ──────────────────────────────────────────

API_URL=$(gcloud run services describe hormuzpt-api \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format='value(status.url)' 2>/dev/null || echo "")

RECAL_URL=$(gcloud run services describe hormuzpt-recalibrator \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format='value(status.url)' 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
    echo "ERROR: hormuzpt-api service not found. Deploy it first."
    exit 1
fi

if [ -z "$RECAL_URL" ]; then
    echo "ERROR: hormuzpt-recalibrator service not found. Deploy it first."
    exit 1
fi

echo "=== HormuzPT: Setting up Cloud Scheduler jobs ==="
echo "  API URL:          $API_URL"
echo "  Recalibrator URL: $RECAL_URL"
echo ""

# ── Job 1: Daily data refresh (23:59 Lisbon time) ──────────────────

JOB_DAILY="hormuz-daily-refresh"
echo "--- $JOB_DAILY ---"

# Delete existing job if present (idempotent)
gcloud scheduler jobs delete "$JOB_DAILY" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null || true

gcloud scheduler jobs create http "$JOB_DAILY" \
    --schedule="59 23 * * *" \
    --uri="${API_URL}/api/refresh" \
    --http-method=POST \
    --time-zone="Europe/Lisbon" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Daily cache refresh for HormuzPT API proxy" \
    --attempt-deadline="120s" \
    --quiet

echo "  Created: $JOB_DAILY → POST ${API_URL}/api/refresh (daily 23:59 Lisbon)"

# ── Job 2: Weekly recalibration (Monday 00:01 Lisbon time) ─────────

JOB_WEEKLY="hormuz-weekly-recal"
echo "--- $JOB_WEEKLY ---"

gcloud scheduler jobs delete "$JOB_WEEKLY" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null || true

gcloud scheduler jobs create http "$JOB_WEEKLY" \
    --schedule="1 0 * * 1" \
    --uri="${RECAL_URL}/recalibrate" \
    --http-method=POST \
    --time-zone="Europe/Lisbon" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --description="Weekly model recalibration for HormuzPT" \
    --attempt-deadline="600s" \
    --oidc-service-account-email="$COMPUTE_SA" \
    --quiet

echo "  Created: $JOB_WEEKLY → POST ${RECAL_URL}/recalibrate (Monday 00:01 Lisbon)"

# ── Summary ────────────────────────────────────────────────────────

echo ""
echo "=== Scheduler jobs configured ==="
echo ""
gcloud scheduler jobs list --location="$REGION" --project="$PROJECT_ID"
echo ""
echo "=== Manual trigger commands ==="
echo "  gcloud scheduler jobs run $JOB_DAILY --location=$REGION --project=$PROJECT_ID"
echo "  gcloud scheduler jobs run $JOB_WEEKLY --location=$REGION --project=$PROJECT_ID"
