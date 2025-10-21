#!/bin/bash

# Google Cloud Run Deployment Script for HyperTrade Platform
# Prerequisites: gcloud CLI installed and authenticated

set -e

echo "🚀 Deploying HyperTrade to Google Cloud Run..."

# Configuration
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-"your-project-id"}
REGION="us-central1"
SERVICE_NAME="hypertrade"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not authenticated. Run: gcloud auth login"
    exit 1
fi

# Set project
echo -e "${YELLOW}🔧 Setting project...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com

# Build container
echo -e "${YELLOW}🏗️  Building container...${NC}"
gcloud builds submit --tag ${IMAGE_NAME}

# Deploy to Cloud Run
echo -e "${YELLOW}🚢 Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --min-instances 1 \
    --max-instances 10 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600 \
    --set-env-vars NODE_ENV=production

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Service URL: ${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Set environment variables:"
echo "     gcloud run services update ${SERVICE_NAME} --region ${REGION} \\"
echo "       --set-env-vars DATABASE_URL=postgresql://... \\"
echo "       --set-env-vars ANTHROPIC_API_KEY=sk-ant-... \\"
echo "       --set-env-vars HYPERLIQUID_ACCOUNT_ADDRESS=0x... \\"
echo "       --set-env-vars HYPERLIQUID_API_SECRET=..."
echo ""
echo "  2. Or use Secret Manager (recommended):"
echo "     gcloud secrets create DATABASE_URL --data-file=- < <(echo 'postgresql://...')"
echo "     gcloud run services update ${SERVICE_NAME} --region ${REGION} \\"
echo "       --set-secrets DATABASE_URL=DATABASE_URL:latest"
echo ""
echo "  3. Enable WebSocket support:"
echo "     Update client/src/hooks/useWebSocket.ts:"
echo "     const supportsWebSocketSubscriptions = () => true;"
echo ""
echo -e "${GREEN}🎉 Your trading platform is live at: ${SERVICE_URL}${NC}"
