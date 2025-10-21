# Google Cloud Run Deployment Guide

## Why Google Cloud Run?

✅ **WebSocket Support** - Real-time data streaming (60-minute timeout)
✅ **Serverless** - Auto-scales, pay only for usage
✅ **Fast** - Google's global infrastructure
✅ **Affordable** - Free tier + ~$10-20/month for production
✅ **Zero Config** - One command deployment

---

## Prerequisites

### 1. Install Google Cloud SDK

**Windows:**
```bash
# Download installer
https://cloud.google.com/sdk/docs/install

# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**macOS:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Authenticate

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable billing (required)
# Go to: https://console.cloud.google.com/billing
```

---

## Quick Deployment (5 Minutes)

### Option 1: Automated Script (Easiest)

```bash
# Make script executable
chmod +x deploy-google-cloud.sh

# Set your project ID
export GOOGLE_CLOUD_PROJECT="your-project-id"

# Deploy!
./deploy-google-cloud.sh
```

### Option 2: Manual Commands

```bash
# 1. Enable required APIs
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com

# 2. Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hypertrade

# 3. Deploy to Cloud Run
gcloud run deploy hypertrade \
    --image gcr.io/YOUR_PROJECT_ID/hypertrade \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --min-instances 1 \
    --max-instances 10 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 3600
```

---

## Environment Variables Setup

### Option A: Command Line (Quick)

```bash
gcloud run services update hypertrade --region us-central1 \
  --set-env-vars "\
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres,\
ANTHROPIC_API_KEY=sk-ant-api03-...,\
HYPERLIQUID_ACCOUNT_ADDRESS=0x...,\
HYPERLIQUID_API_SECRET=...,\
HYPERLIQUID_TESTNET=false,\
ENABLE_LIQUIDATION_ALERTS=true,\
EMAIL_SERVICE=gmail,\
EMAIL_USER=your-email@gmail.com,\
EMAIL_PASSWORD=your-gmail-app-password"
```

### Option B: Secret Manager (Recommended for Production)

```bash
# Create secrets
echo "postgresql://..." | gcloud secrets create DATABASE_URL --data-file=-
echo "sk-ant-..." | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
echo "0x..." | gcloud secrets create HYPERLIQUID_ACCOUNT_ADDRESS --data-file=-
echo "..." | gcloud secrets create HYPERLIQUID_API_SECRET --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding DATABASE_URL \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Update service to use secrets
gcloud run services update hypertrade --region us-central1 \
  --set-secrets "\
DATABASE_URL=DATABASE_URL:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,\
HYPERLIQUID_ACCOUNT_ADDRESS=HYPERLIQUID_ACCOUNT_ADDRESS:latest,\
HYPERLIQUID_API_SECRET=HYPERLIQUID_API_SECRET:latest"
```

---

## Enable WebSocket Support

After deployment, update your client code:

```typescript
// client/src/hooks/useWebSocket.ts:12
const supportsWebSocketSubscriptions = () => {
  return true; // ✅ Enable WebSocket on Cloud Run
};
```

Then redeploy:
```bash
git add .
git commit -m "Enable WebSocket support"
git push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/hypertrade
```

---

## Custom Domain Setup

```bash
# 1. Verify domain ownership
gcloud domains verify YOUR_DOMAIN.com

# 2. Map domain to Cloud Run service
gcloud run domain-mappings create \
    --service hypertrade \
    --domain YOUR_DOMAIN.com \
    --region us-central1

# 3. Update DNS records (shown in output)
# Add the CNAME records to your DNS provider
```

---

## Monitoring & Logs

### View Logs
```bash
# Real-time logs
gcloud run logs tail hypertrade --region us-central1

# Last 100 lines
gcloud run logs read hypertrade --region us-central1 --limit 100
```

### Dashboard
```bash
# Open Cloud Console
https://console.cloud.google.com/run
```

### Metrics
- Requests per second
- Latency (p50, p95, p99)
- Error rate
- Container instances
- Memory/CPU usage

---

## Cost Estimation

### Free Tier (Monthly)
- 2 million requests
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

### Your Trading Platform (Estimated)
**Scenario:** 100 active users, moderate trading

```
Requests: ~40M/month
  - Base: 2M free
  - Paid: 38M × $0.40/million = $15.20

CPU: ~100 hours/month
  - 2 vCPU × 100 hours = 200 vCPU-hours
  - 200 × 3600 = 720,000 vCPU-seconds
  - 720,000 × $0.00002400 = $17.28

Memory: 2GB average
  - 2GB × 100 hours = 200 GB-hours
  - 200 × 3600 = 720,000 GB-seconds
  - 720,000 × $0.00000250 = $1.80

Networking: ~50GB egress
  - 50GB × $0.12/GB = $6.00

Total: ~$40/month
```

**With optimizations (min-instances=0):** ~$15-20/month

---

## Continuous Deployment (Auto-Deploy on Git Push)

### 1. Connect GitHub Repository

```bash
# Trigger Cloud Build on git push
gcloud beta builds triggers create github \
    --repo-name=hypertrade-platform \
    --repo-owner=YOUR_GITHUB_USERNAME \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml
```

### 2. Push to Deploy

```bash
git add .
git commit -m "Update feature"
git push origin main
# ✅ Automatically builds and deploys!
```

---

## Scaling Configuration

### High-Traffic Setup
```bash
gcloud run services update hypertrade --region us-central1 \
  --min-instances 2 \
  --max-instances 50 \
  --cpu 4 \
  --memory 4Gi \
  --concurrency 100
```

### Cost-Optimized Setup
```bash
gcloud run services update hypertrade --region us-central1 \
  --min-instances 0 \
  --max-instances 5 \
  --cpu 1 \
  --memory 1Gi \
  --concurrency 80
```

---

## Performance Optimizations

### 1. Use Cloud SQL (Instead of Supabase)
```bash
# Create PostgreSQL instance
gcloud sql instances create hypertrade-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Connect Cloud Run to Cloud SQL
gcloud run services update hypertrade --region us-central1 \
  --add-cloudsql-instances PROJECT:us-central1:hypertrade-db
```

**Benefit:** <10ms database latency (same region)

### 2. Enable Cloud CDN
```bash
# Serve static assets from Cloud CDN
gcloud compute backend-buckets create hypertrade-assets \
    --gcs-bucket-name=hypertrade-assets

# ~$0.08/GB, faster than Cloud Run for static files
```

### 3. Multi-Region Deployment
```bash
# Deploy to multiple regions
gcloud run deploy hypertrade --region us-east1 --image gcr.io/...
gcloud run deploy hypertrade --region europe-west1 --image gcr.io/...
gcloud run deploy hypertrade --region asia-east1 --image gcr.io/...

# Use Cloud Load Balancer for geo-routing
# Users automatically connect to nearest region
```

---

## Troubleshooting

### Build Fails
```bash
# Check build logs
gcloud builds list --limit 10
gcloud builds log BUILD_ID
```

### Service Not Starting
```bash
# Check container logs
gcloud run logs read hypertrade --region us-central1 --limit 100

# Common issues:
# - Missing environment variables
# - Database connection timeout
# - Python SDK not installed in container
```

### WebSocket Disconnects
```bash
# Increase timeout
gcloud run services update hypertrade --region us-central1 --timeout 3600

# Check connection status in logs
gcloud run logs tail hypertrade --region us-central1 | grep -i websocket
```

---

## Comparison: Cloud Run vs Other Options

| Feature | Cloud Run | Railway | Render | Hetzner VPS |
|---------|-----------|---------|--------|-------------|
| **Setup Time** | 5 min | 5 min | 10 min | 60 min |
| **Cost/month** | $15-40 | $20 | $7-25 | €4.15 |
| **WebSocket** | ✅ 60min | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Auto-scale** | ✅ | ❌ | ✅ | ❌ |
| **Global CDN** | ✅ | ❌ | ✅ | ❌ |
| **Free Tier** | ✅ 2M req | ❌ | ✅ Limited | ❌ |
| **Monitoring** | ✅ Built-in | Basic | Basic | Manual |
| **Multi-region** | ✅ Easy | ❌ | ✅ | Manual |
| **Database** | Cloud SQL | Built-in | Built-in | Self-host |

---

## Ready to Deploy?

```bash
# Quick start
export GOOGLE_CLOUD_PROJECT="your-project-id"
chmod +x deploy-google-cloud.sh
./deploy-google-cloud.sh

# Then set environment variables and enable WebSocket
# Your trading platform will be live in 5 minutes!
```

---

## Support

- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Pricing Calculator:** https://cloud.google.com/products/calculator
- **Community:** https://cloud.google.com/community

**Questions?** Check deployment logs or open an issue.
