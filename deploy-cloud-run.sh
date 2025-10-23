#!/bin/bash

# Google Cloud Run Deployment Script
# This script deploys the Hypertrade Platform to Google Cloud Run

set -e

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-project-id"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME=${SERVICE_NAME:-"hypertrade"}
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to Google Cloud Run${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if PROJECT_ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${YELLOW}⚠️  Please set your PROJECT_ID:${NC}"
    echo "export PROJECT_ID=your-actual-project-id"
    exit 1
fi

# Set the project
echo -e "${GREEN}Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    sqladmin.googleapis.com

# Build the application
echo -e "${GREEN}Building the application...${NC}"
npm run build

# Build and push Docker image
echo -e "${GREEN}Building Docker image...${NC}"
gcloud builds submit --tag $IMAGE_NAME

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"

# Get Cloud SQL instance connection name if exists
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe hypertrade-db \
    --format="value(connectionName)" 2>/dev/null || echo "")

if [ -n "$INSTANCE_CONNECTION_NAME" ]; then
    echo -e "${GREEN}Found Cloud SQL instance: $INSTANCE_CONNECTION_NAME${NC}"
    CLOUDSQL_FLAG="--add-cloudsql-instances=$INSTANCE_CONNECTION_NAME"
else
    echo -e "${YELLOW}⚠️  No Cloud SQL instance found. Database features will be disabled.${NC}"
    CLOUDSQL_FLAG=""
fi

# Deploy the service
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --max-instances 10 \
    --min-instances 0 \
    --cpu 1 \
    --timeout 60 \
    $CLOUDSQL_FLAG \
    --set-env-vars NODE_ENV=production

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"

# Remind about environment variables
echo -e "${YELLOW}"
echo "⚠️  Don't forget to set your environment variables:"
echo ""
echo "gcloud run services update $SERVICE_NAME \\"
echo "  --update-env-vars DATABASE_URL=your-database-url \\"
echo "  --update-env-vars HYPERLIQUID_ACCOUNT_ADDRESS=your-address \\"
echo "  --update-env-vars HYPERLIQUID_API_SECRET=your-secret \\"
echo "  --update-env-vars ANTHROPIC_API_KEY=your-api-key \\"
echo "  --update-env-vars VITE_WALLETCONNECT_PROJECT_ID=your-project-id \\"
echo "  --region $REGION"
echo -e "${NC}"

# Check service logs
echo -e "${GREEN}Checking service logs...${NC}"
gcloud run logs read --service=$SERVICE_NAME --region=$REGION --limit=20
