#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# deploy.sh — Deploy HormuzPT to GCP (Cloud Run + Firebase Hosting)
#
# Usage:
#   ./deploy.sh              # Deploy all services
#   ./deploy.sh api          # Deploy api-proxy only
#   ./deploy.sh recalibrator # Deploy recalibrator only
#   ./deploy.sh frontend     # Deploy frontend only
#
# Prerequisites:
#   - gcloud authenticated: gcloud auth login
#   - firebase CLI: npm i -g firebase-tools && firebase login
#   - Secrets provisioned: bash infra/secrets.sh
#   - .env with VITE_API_URL for frontend build
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="hormuzpt"
REGION="europe-west1"
COMPUTE_SA="487878867028-compute@developer.gserviceaccount.com"

# Actual deployed service names (match existing Cloud Run services)
API_SERVICE="hormuzpt-api"
RECAL_SERVICE="hormuzpt-recalibrator"

# Image registry
API_IMAGE="gcr.io/$PROJECT_ID/$API_SERVICE"
RECAL_IMAGE="gcr.io/$PROJECT_ID/$RECAL_SERVICE"

TARGET="${1:-all}"

gcloud config set project "$PROJECT_ID" --quiet

# ── Helpers ──────────────────────────────────────────────────────

get_service_url() {
    gcloud run services describe "$1" \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        --format='value(status.url)' 2>/dev/null || echo ""
}

grant_secret_access() {
    local secret="$1"
    if gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
        gcloud secrets add-iam-policy-binding "$secret" \
            --member="serviceAccount:$COMPUTE_SA" \
            --role="roles/secretmanager.secretAccessor" \
            --project="$PROJECT_ID" \
            --quiet >/dev/null 2>&1 || true
    fi
}

# ── Deploy Recalibrator ──────────────────────────────────────────

deploy_recalibrator() {
    echo "=== Deploying recalibrator ==="
    cd recalibrator

    gcloud builds submit --tag "$RECAL_IMAGE" --quiet

    # Grant secret access to compute SA
    for secret in ANTHROPIC_API_KEY OPENAI_API_KEY VERTEX_AI_API_KEY HUGGINGFACE_API_KEY SCOPUS_API_KEY; do
        grant_secret_access "$secret"
    done

    gcloud run deploy "$RECAL_SERVICE" \
        --image "$RECAL_IMAGE" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 2 \
        --timeout 600 \
        --port 8082 \
        --set-env-vars "HORMUZ_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
        --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,VERTEX_AI_API_KEY=VERTEX_AI_API_KEY:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,SCOPUS_API_KEY=SCOPUS_API_KEY:latest" \
        --quiet

    cd ..
    RECAL_URL=$(get_service_url "$RECAL_SERVICE")
    echo "  Recalibrator: $RECAL_URL"
}

# ── Deploy API Proxy ─────────────────────────────────────────────

deploy_api() {
    echo "=== Deploying api-proxy ==="

    # Get recalibrator URL for service-to-service routing
    RECAL_URL=$(get_service_url "$RECAL_SERVICE")
    if [ -z "$RECAL_URL" ]; then
        echo "WARNING: Recalibrator not deployed. Deploy it first or api-proxy will use file fallback."
        RECAL_URL="https://$RECAL_SERVICE-$PROJECT_ID.run.app"
    fi

    # Bundle model_state_initial.json into api-proxy build context
    mkdir -p api-proxy/data
    cp data/model_state_initial.json api-proxy/data/model_state_initial.json

    cd api-proxy

    gcloud builds submit --tag "$API_IMAGE" --quiet

    # Grant secret access to compute SA
    for secret in ANTHROPIC_API_KEY OPENAI_API_KEY VERTEX_AI_API_KEY APIABERTA_API_KEY; do
        grant_secret_access "$secret"
    done

    gcloud run deploy "$API_SERVICE" \
        --image "$API_IMAGE" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 5 \
        --port 8081 \
        --set-env-vars "HORMUZ_ENV=production,RECALIBRATOR_URL=$RECAL_URL,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GCS_BUCKET=hormuzpt-hormuz-cache,VERTEX_AI_LOCATION=europe-west1" \
        --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,VERTEX_AI_API_KEY=VERTEX_AI_API_KEY:latest,APIABERTA_API_KEY=APIABERTA_API_KEY:latest" \
        --quiet

    cd ..

    # Clean up bundled file
    rm -f api-proxy/data/model_state_initial.json

    API_URL=$(get_service_url "$API_SERVICE")
    echo "  API Proxy: $API_URL"
}

# ── Deploy Frontend ──────────────────────────────────────────────

deploy_frontend() {
    echo "=== Deploying frontend (Firebase Hosting) ==="

    cd frontend
    npm run build
    cd ..

    firebase deploy --only hosting --project "$PROJECT_ID"

    echo "  Frontend: https://$PROJECT_ID.web.app"
}

# ── Main ─────────────────────────────────────────────────────────

echo "HormuzPT Deploy — project=$PROJECT_ID region=$REGION"
echo ""

case "$TARGET" in
    recalibrator)
        deploy_recalibrator
        ;;
    api)
        deploy_api
        ;;
    frontend)
        deploy_frontend
        ;;
    all)
        deploy_recalibrator
        deploy_api
        deploy_frontend
        ;;
    *)
        echo "Usage: $0 [all|api|recalibrator|frontend]"
        exit 1
        ;;
esac

echo ""
echo "=== Deploy complete ==="
echo "  API:          $(get_service_url $API_SERVICE)"
echo "  Recalibrator: $(get_service_url $RECAL_SERVICE)"
echo "  Frontend:     https://$PROJECT_ID.web.app"
