# PowerShell deployment script for Google Cloud Run
# Run this with: powershell -ExecutionPolicy Bypass -File deploy-to-google-cloud.ps1

param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [string]$ServiceName = "hypertrade"
)

Write-Host "🚀 Deploying HyperTrade to Google Cloud Run..." -ForegroundColor Green
Write-Host ""

# Check if project ID is provided
if ($ProjectId -eq "") {
    Write-Host "❌ Project ID not provided!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\deploy-to-google-cloud.ps1 -ProjectId YOUR_PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "Or set it first:" -ForegroundColor Yellow
    Write-Host "  gcloud config set project YOUR_PROJECT_ID" -ForegroundColor White
    Write-Host "  .\deploy-to-google-cloud.ps1" -ForegroundColor White
    Write-Host ""

    # Try to get current project
    $currentProject = gcloud config get-value project 2>$null
    if ($currentProject) {
        Write-Host "Current project: $currentProject" -ForegroundColor Cyan
        $response = Read-Host "Use this project? (y/n)"
        if ($response -eq "y") {
            $ProjectId = $currentProject
        } else {
            exit 1
        }
    } else {
        exit 1
    }
}

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Project ID: $ProjectId" -ForegroundColor White
Write-Host "  Region: $Region" -ForegroundColor White
Write-Host "  Service: $ServiceName" -ForegroundColor White
Write-Host ""

# Set project
Write-Host "🔧 Setting project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project. Make sure you're authenticated:" -ForegroundColor Red
    Write-Host "   gcloud auth login" -ForegroundColor White
    exit 1
}

# Enable APIs
Write-Host ""
Write-Host "🔌 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com secretmanager.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Failed to enable some APIs. They may already be enabled." -ForegroundColor Yellow
}

# Build image
Write-Host ""
Write-Host "🏗️  Building container image..." -ForegroundColor Yellow
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Cyan

$imageName = "gcr.io/$ProjectId/$ServiceName"
gcloud builds submit --tag $imageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Check the error above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete!" -ForegroundColor Green

# Deploy to Cloud Run
Write-Host ""
Write-Host "🚢 Deploying to Cloud Run..." -ForegroundColor Yellow

gcloud run deploy $ServiceName `
    --image $imageName `
    --region $Region `
    --platform managed `
    --allow-unauthenticated `
    --min-instances 1 `
    --max-instances 10 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 3600 `
    --set-env-vars "NODE_ENV=production"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Get service URL
$serviceUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Service URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Set environment variables:" -ForegroundColor White
Write-Host ""
Write-Host "gcloud run services update $ServiceName --region $Region ``" -ForegroundColor Cyan
Write-Host "  --set-env-vars ""``" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://...,``" -ForegroundColor Cyan
Write-Host "ANTHROPIC_API_KEY=sk-ant-...,``" -ForegroundColor Cyan
Write-Host "HYPERLIQUID_ACCOUNT_ADDRESS=0x...,``" -ForegroundColor Cyan
Write-Host "HYPERLIQUID_API_SECRET=...""" -ForegroundColor Cyan
Write-Host ""

Write-Host "2️⃣  Enable WebSocket support:" -ForegroundColor White
Write-Host "   Edit: client/src/hooks/useWebSocket.ts:12" -ForegroundColor Cyan
Write-Host "   Change: const supportsWebSocketSubscriptions = () => true;" -ForegroundColor Cyan
Write-Host ""

Write-Host "3️⃣  Test your application:" -ForegroundColor White
Write-Host "   $serviceUrl" -ForegroundColor Cyan
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🎉 Your trading platform is live!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan
