#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# infra/secrets.sh — Provision API keys in GCP Secret Manager
#
# Usage:
#   cd /home/dpolonia/HormuzPT
#   bash infra/secrets.sh
#
# Prerequisites:
#   - .env file with real keys in repo root
#   - gcloud authenticated with project owner
#   - gcloud config set project hormuzpt
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-hormuzpt}"

echo "=== HormuzPT: Provisioning secrets for project $PROJECT_ID ==="

# Source .env to read key values
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env not found at $ENV_FILE"
    exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

# Secrets to provision (name → env var value)
declare -A SECRETS=(
    ["ANTHROPIC_API_KEY"]="$ANTHROPIC_API_KEY"
    ["OPENAI_API_KEY"]="$OPENAI_API_KEY"
    ["VERTEX_AI_API_KEY"]="$VERTEX_AI_API_KEY"
    ["HUGGINGFACE_API_KEY"]="$HUGGINGFACE_API_KEY"
    ["SCOPUS_API_KEY"]="$SCOPUS_API_KEY"
    ["APIABERTA_API_KEY"]="$APIABERTA_API_KEY"
)

for secret_name in "${!SECRETS[@]}"; do
    secret_value="${SECRETS[$secret_name]}"

    if [ -z "$secret_value" ]; then
        echo "  SKIP: $secret_name (empty value)"
        continue
    fi

    # Create secret if it doesn't exist
    if ! gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo "  CREATE: $secret_name"
        gcloud secrets create "$secret_name" \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --quiet
    fi

    # Add new version with current value
    echo "  UPDATE: $secret_name (new version)"
    printf '%s' "$secret_value" | gcloud secrets versions add "$secret_name" \
        --project="$PROJECT_ID" \
        --data-file=- \
        --quiet
done

echo ""
echo "=== Secrets provisioned. Verify with: ==="
echo "  gcloud secrets list --project=$PROJECT_ID"
echo ""
echo "=== Grant Cloud Run service account access: ==="
echo "  SA=487878867028-compute@developer.gserviceaccount.com"
for secret_name in "${!SECRETS[@]}"; do
    echo "  gcloud secrets add-iam-policy-binding $secret_name --member=serviceAccount:\$SA --role=roles/secretmanager.secretAccessor --project=$PROJECT_ID"
done
