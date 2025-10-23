# GitHub Actions Setup Script for Windows
# This script helps you set up GitHub Actions deployment

Write-Host "GitHub Actions Deployment Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Check if gcloud is installed
try {
    gcloud version | Out-Null
} catch {
    Write-Host "❌ gcloud CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get project ID
$PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) {
    Write-Host "❌ Project ID is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up service account for GitHub Actions..." -ForegroundColor Yellow

# Create service account
Write-Host "Creating service account..." -ForegroundColor Cyan
gcloud iam service-accounts create github-actions `
    --display-name="GitHub Actions Deploy" `
    --project=$PROJECT_ID

$SA_EMAIL = "github-actions@$PROJECT_ID.iam.gserviceaccount.com"

# Grant permissions
Write-Host "Granting permissions..." -ForegroundColor Cyan
$roles = @(
    "roles/run.admin",
    "roles/storage.admin",
    "roles/cloudsql.client"
)

foreach ($role in $roles) {
    Write-Host "  - Adding $role" -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$SA_EMAIL" `
        --role=$role `
        --quiet
}

# Service account user permission
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/iam.serviceAccountUser" `
    --project=$PROJECT_ID `
    --quiet

# Create key
Write-Host ""
Write-Host "Creating service account key..." -ForegroundColor Cyan
$KEY_FILE = "github-actions-key.json"
gcloud iam service-accounts keys create $KEY_FILE `
    --iam-account=$SA_EMAIL `
    --project=$PROJECT_ID

# Read and display key
$KEY_CONTENT = Get-Content $KEY_FILE -Raw

Write-Host ""
Write-Host "✅ Service account created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Now, add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "(Go to Settings → Secrets and variables → Actions)" -ForegroundColor Gray
Write-Host ""

# Display required secrets
Write-Host "REQUIRED SECRETS:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. GCP_PROJECT_ID" -ForegroundColor Yellow
Write-Host "   Value: $PROJECT_ID" -ForegroundColor Gray
Write-Host ""

Write-Host "2. GCP_SA_KEY" -ForegroundColor Yellow
Write-Host "   Value: (Copy the entire JSON below)" -ForegroundColor Gray
Write-Host "   ---START---" -ForegroundColor DarkGray
Write-Host $KEY_CONTENT -ForegroundColor DarkGray
Write-Host "   ---END---" -ForegroundColor DarkGray
Write-Host ""

# Ask about database
$setupDB = Read-Host "Do you want to set up Cloud SQL database? (y/n)"
if ($setupDB -eq 'y') {
    Write-Host ""
    Write-Host "Creating Cloud SQL instance..." -ForegroundColor Cyan
    
    $INSTANCE_NAME = "hypertrade-db"
    $DB_PASSWORD = Read-Host "Enter a password for the database" -AsSecureString
    $DB_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
    
    # Create instance
    gcloud sql instances create $INSTANCE_NAME `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=us-central1 `
        --project=$PROJECT_ID
    
    # Create database
    gcloud sql databases create hypertrade_production `
        --instance=$INSTANCE_NAME `
        --project=$PROJECT_ID
    
    # Create user
    gcloud sql users create hypertrade_user `
        --instance=$INSTANCE_NAME `
        --password=$DB_PASSWORD_TEXT `
        --project=$PROJECT_ID
    
    $CONNECTION_NAME = "$PROJECT_ID:us-central1:$INSTANCE_NAME"
    $DATABASE_URL = "postgresql://hypertrade_user:$DB_PASSWORD_TEXT@localhost/hypertrade_production?host=/cloudsql/$CONNECTION_NAME"
    
    Write-Host ""
    Write-Host "3. DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   Value: $DATABASE_URL" -ForegroundColor Gray
}

Write-Host ""
Write-Host "4. HYPERLIQUID_ACCOUNT_ADDRESS" -ForegroundColor Yellow
Write-Host "   Value: (Your Hyperliquid wallet address)" -ForegroundColor Gray
Write-Host ""

Write-Host "5. HYPERLIQUID_API_SECRET" -ForegroundColor Yellow
Write-Host "   Value: (Your Hyperliquid API secret)" -ForegroundColor Gray
Write-Host ""

Write-Host "6. ANTHROPIC_API_KEY" -ForegroundColor Yellow
Write-Host "   Value: (Your Anthropic Claude API key)" -ForegroundColor Gray
Write-Host ""

Write-Host "7. VITE_WALLETCONNECT_PROJECT_ID" -ForegroundColor Yellow
Write-Host "   Value: (Get from https://cloud.walletconnect.com)" -ForegroundColor Gray
Write-Host ""

# Clean up
Remove-Item $KEY_FILE -Force

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Add the secrets above to your GitHub repository" -ForegroundColor Gray
Write-Host "2. Push your code to trigger deployment" -ForegroundColor Gray
Write-Host "3. Check the Actions tab in GitHub to monitor deployment" -ForegroundColor Gray
Write-Host ""
Write-Host "To deploy manually:" -ForegroundColor Yellow
Write-Host "  Go to Actions → Deploy to Google Cloud Run → Run workflow" -ForegroundColor Gray
