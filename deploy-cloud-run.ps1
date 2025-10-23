# Google Cloud Run Deployment Script for Windows
# This script deploys the Hypertrade Platform to Google Cloud Run

# Configuration
$PROJECT_ID = if ($env:PROJECT_ID) { $env:PROJECT_ID } else { "your-project-id" }
$REGION = if ($env:REGION) { $env:REGION } else { "us-central1" }
$SERVICE_NAME = if ($env:SERVICE_NAME) { $env:SERVICE_NAME } else { "hypertrade" }
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Starting deployment to Google Cloud Run" -ForegroundColor Green

# Check if gcloud is installed
try {
    gcloud version | Out-Null
} catch {
    Write-Host "❌ gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if PROJECT_ID is set
if ($PROJECT_ID -eq "your-project-id") {
    Write-Host "⚠️  Please set your PROJECT_ID:" -ForegroundColor Yellow
    Write-Host '$env:PROJECT_ID = "your-actual-project-id"'
    exit 1
}

# Set the project
Write-Host "Setting project to $PROJECT_ID" -ForegroundColor Green
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Green
gcloud services enable `
    cloudbuild.googleapis.com `
    run.googleapis.com `
    containerregistry.googleapis.com `
    sqladmin.googleapis.com

# Build the application
Write-Host "Building the application..." -ForegroundColor Green
npm run build

# Build and push Docker image
Write-Host "Building Docker image..." -ForegroundColor Green
gcloud builds submit --tag $IMAGE_NAME

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Green

# Get Cloud SQL instance connection name if exists
try {
    $INSTANCE_CONNECTION_NAME = gcloud sql instances describe hypertrade-db `
        --format="value(connectionName)" 2>$null
    
    if ($INSTANCE_CONNECTION_NAME) {
        Write-Host "Found Cloud SQL instance: $INSTANCE_CONNECTION_NAME" -ForegroundColor Green
        $CLOUDSQL_FLAG = "--add-cloudsql-instances=$INSTANCE_CONNECTION_NAME"
    } else {
        Write-Host "⚠️  No Cloud SQL instance found. Database features will be disabled." -ForegroundColor Yellow
        $CLOUDSQL_FLAG = ""
    }
} catch {
    Write-Host "⚠️  No Cloud SQL instance found. Database features will be disabled." -ForegroundColor Yellow
    $CLOUDSQL_FLAG = ""
}

# Deploy the service
$deployCmd = @"
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 512Mi `
    --max-instances 10 `
    --min-instances 0 `
    --cpu 1 `
    --timeout 60 `
    $CLOUDSQL_FLAG `
    --set-env-vars NODE_ENV=production
"@

Invoke-Expression $deployCmd

# Get the service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
    --platform managed `
    --region $REGION `
    --format 'value(status.url)'

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Service URL: $SERVICE_URL" -ForegroundColor Green

# Remind about environment variables
Write-Host ""
Write-Host "⚠️  Don't forget to set your environment variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "gcloud run services update $SERVICE_NAME ``" -ForegroundColor Cyan
Write-Host "  --update-env-vars DATABASE_URL=your-database-url ``" -ForegroundColor Cyan
Write-Host "  --update-env-vars HYPERLIQUID_ACCOUNT_ADDRESS=your-address ``" -ForegroundColor Cyan
Write-Host "  --update-env-vars HYPERLIQUID_API_SECRET=your-secret ``" -ForegroundColor Cyan
Write-Host "  --update-env-vars ANTHROPIC_API_KEY=your-api-key ``" -ForegroundColor Cyan
Write-Host "  --update-env-vars VITE_WALLETCONNECT_PROJECT_ID=your-project-id ``" -ForegroundColor Cyan
Write-Host "  --region $REGION" -ForegroundColor Cyan
Write-Host ""

# Check service logs
Write-Host "Checking service logs..." -ForegroundColor Green
gcloud run logs read --service=$SERVICE_NAME --region=$REGION --limit=20
