# Deploy to Google Cloud Run - Simple 5-Step Guide

## 🎯 Quick Deploy (Copy & Paste These Commands)

### Step 1: Install Python (if needed)

Open PowerShell as Administrator and run:

```powershell
# Download and install Python 3.11
winget install Python.Python.3.11
```

OR download from: https://www.python.org/downloads/

**IMPORTANT:** Check "Add Python to PATH" during installation!

---

### Step 2: Authenticate to Google Cloud

Open a **NEW** terminal/PowerShell window (to refresh PATH) and run:

```bash
# Login to Google Cloud
gcloud auth login

# This will open a browser - sign in with your Google account
```

---

### Step 3: Create/Select Project

```bash
# List your projects
gcloud projects list

# Create a new project (if needed)
gcloud projects create YOUR-PROJECT-ID --name="HyperTrade"

# Set the project
gcloud config set project YOUR-PROJECT-ID

# Enable billing (REQUIRED)
# Go to: https://console.cloud.google.com/billing
# Link a billing account to your project
```

---

### Step 4: Deploy to Cloud Run

```bash
# Navigate to project directory
cd "C:\Users\egour\OneDrive\Documents\GitHub\hypertrade-platform"

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com

# Build and deploy (this takes 5-10 minutes)
gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/hypertrade

# Deploy to Cloud Run
gcloud run deploy hypertrade \
  --image gcr.io/YOUR-PROJECT-ID/hypertrade \
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

### Step 5: Set Environment Variables

```bash
# Set your environment variables
gcloud run services update hypertrade --region us-central1 \
  --set-env-vars "\
DATABASE_URL=postgresql://YOUR_SUPABASE_URL,\
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY,\
HYPERLIQUID_ACCOUNT_ADDRESS=0xYOUR_ADDRESS,\
HYPERLIQUID_API_SECRET=YOUR_SECRET,\
HYPERLIQUID_TESTNET=false,\
ENABLE_LIQUIDATION_ALERTS=true"
```

**Replace with your actual values:**
- `YOUR_SUPABASE_URL` - From Supabase Dashboard
- `sk-ant-YOUR_KEY` - From Anthropic Console
- `0xYOUR_ADDRESS` - Your wallet address
- `YOUR_SECRET` - Your wallet private key

---

### Step 6: Get Your URL

```bash
# Get the deployed URL
gcloud run services describe hypertrade --region us-central1 --format "value(status.url)"
```

This will output something like:
```
https://hypertrade-abc123-uc.a.run.app
```

**🎉 Your trading platform is now live!**

---

## 🔧 Enable WebSocket Support

After deployment, enable WebSocket for real-time data:

1. Edit `client/src/hooks/useWebSocket.ts` line 12:
   ```typescript
   const supportsWebSocketSubscriptions = () => {
     return true; // ✅ Enable WebSocket on Cloud Run
   };
   ```

2. Commit and redeploy:
   ```bash
   git add .
   git commit -m "Enable WebSocket support"
   gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/hypertrade
   ```

---

## 🐛 Troubleshooting

### "gcloud: command not found"
- **Solution:** Restart your terminal after installing gcloud CLI
- **Alternative:** Use full path: `"C:\Users\egour\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"`

### "Python not found"
- **Solution:** Install Python and restart terminal
- **Check:** Run `python --version` - should show Python 3.11+

### "Build failed"
- **Check:** Docker daemon is running
- **Check:** `Dockerfile` exists in project root
- **View logs:** `gcloud builds list` then `gcloud builds log BUILD_ID`

### "Permission denied"
- **Solution:** Make sure billing is enabled
- **Check:** https://console.cloud.google.com/billing

---

## 💰 Cost Alert

Your deployment will cost approximately:
- **Free tier:** First 2M requests/month
- **After that:** ~$10-20/month for moderate usage
- **Tip:** Set a budget alert in Google Cloud Console

---

## 📊 View Your Deployment

### Cloud Console Dashboard
```bash
# Open in browser
https://console.cloud.google.com/run?project=YOUR-PROJECT-ID
```

### View Logs
```bash
# Real-time logs
gcloud run logs tail hypertrade --region us-central1

# Last 100 lines
gcloud run logs read hypertrade --region us-central1 --limit 100
```

---

## 🚀 Quick Reference

```bash
# Redeploy after changes
gcloud builds submit --tag gcr.io/YOUR-PROJECT-ID/hypertrade

# Update environment variables
gcloud run services update hypertrade --region us-central1 \
  --set-env-vars "KEY=value"

# Scale up/down
gcloud run services update hypertrade --region us-central1 \
  --min-instances 0 \
  --max-instances 5

# Delete service
gcloud run services delete hypertrade --region us-central1
```

---

## ✅ Checklist

- [ ] Python 3.11+ installed
- [ ] gcloud CLI installed
- [ ] Authenticated (`gcloud auth login`)
- [ ] Project created and selected
- [ ] Billing enabled
- [ ] Docker container built
- [ ] Service deployed to Cloud Run
- [ ] Environment variables set
- [ ] WebSocket enabled
- [ ] Application tested at URL

---

## Need Help?

**Copy and paste these commands one by one and tell me if you get any errors!**

I'll help you fix them immediately. 🚀
