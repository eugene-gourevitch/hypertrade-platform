# GitHub Actions Deployment Setup

This guide will help you set up automatic deployment to Google Cloud Run using GitHub Actions.

## Prerequisites

- Google Cloud Project with billing enabled
- GitHub repository
- Local gcloud CLI for initial setup

## Step 1: Create a Service Account

Create a service account for GitHub Actions to use:

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deploy" \
  --project=$PROJECT_ID

# Get the service account email
export SA_EMAIL=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/run.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/storage.admin

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/cloudsql.client

gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --member=serviceAccount:$SA_EMAIL \
  --role=roles/iam.serviceAccountUser \
  --project=$PROJECT_ID
```

## Step 2: Create Service Account Key

```bash
# Create and download the key
gcloud iam service-accounts keys create key.json \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

# Display the key (to copy to GitHub)
cat key.json

# IMPORTANT: Delete the local key file after copying
rm key.json
```

## Step 3: Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Required Secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `my-project-123456` |
| `GCP_SA_KEY` | Service account JSON key (from Step 2) | `{entire JSON content}` |
| `DATABASE_URL` | Production database connection string | `postgresql://user:pass@/db?host=/cloudsql/...` |
| `HYPERLIQUID_ACCOUNT_ADDRESS` | Your Hyperliquid wallet address | `0x...` |
| `HYPERLIQUID_API_SECRET` | Hyperliquid API secret | `your-secret` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | `sk-ant-...` |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | `your-project-id` |

### Optional Secrets:

| Secret Name | Description |
|------------|-------------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for notifications |
| `RESEND_API_KEY` | Resend API key for emails |
| `STAGING_DATABASE_URL` | Staging database connection |
| `STAGING_HYPERLIQUID_ADDRESS` | Testnet wallet address |
| `STAGING_HYPERLIQUID_SECRET` | Testnet API secret |

## Step 4: Enable Required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  sqladmin.googleapis.com \
  --project=$PROJECT_ID
```

## Step 5: Create Cloud SQL Instance (if needed)

If you haven't already, create your Cloud SQL instance:

```bash
# Create instance
gcloud sql instances create hypertrade-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --project=$PROJECT_ID

# Create database
gcloud sql databases create hypertrade_production \
  --instance=hypertrade-db \
  --project=$PROJECT_ID

# Create user
gcloud sql users create hypertrade_user \
  --instance=hypertrade-db \
  --password=your-secure-password \
  --project=$PROJECT_ID
```

## Step 6: Test Deployment

### Manual Deployment Test:

1. Go to Actions tab in GitHub
2. Select "Deploy to Google Cloud Run"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### Automatic Deployment:

- **Production**: Merges to `main` or `master` branch
- **Staging**: Opening or updating pull requests

## Deployment Workflows

### Production Deployment (.github/workflows/deploy.yml)

- Triggers on push to main/master
- Deploys to `hypertrade` service
- Uses production environment variables
- Runs database migrations

### Staging Deployment (.github/workflows/deploy-staging.yml)

- Triggers on pull requests
- Deploys to `hypertrade-staging` service
- Uses testnet configuration
- Comments deployment URL on PR

## Monitoring Deployments

### View Deployment Logs:

```bash
# Production logs
gcloud run logs read --service=hypertrade --region=us-central1

# Staging logs
gcloud run logs read --service=hypertrade-staging --region=us-central1
```

### View Service Status:

```bash
# List all services
gcloud run services list --region=us-central1

# Describe specific service
gcloud run services describe hypertrade --region=us-central1
```

## Rollback Procedure

If a deployment fails or causes issues:

### Quick Rollback:

```bash
# List revisions
gcloud run revisions list --service=hypertrade --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic hypertrade \
  --to-revisions=PREVIOUS_REVISION_NAME=100 \
  --region=us-central1
```

### GitHub Rollback:

1. Revert the problematic commit
2. Push to trigger new deployment
3. Or manually trigger previous workflow

## Security Best Practices

1. **Rotate Service Account Keys Regularly**
   ```bash
   # Create new key
   gcloud iam service-accounts keys create new-key.json \
     --iam-account=$SA_EMAIL
   
   # Update GitHub secret
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=$SA_EMAIL
   ```

2. **Use Workload Identity Federation** (Advanced)
   - More secure than service account keys
   - No key rotation needed
   - See: https://github.com/google-github-actions/auth#workload-identity-federation

3. **Limit Service Account Permissions**
   - Use minimal required roles
   - Consider separate accounts for staging/production

4. **Protect Secrets**
   - Use GitHub environment protection rules
   - Require reviews for production deployments
   - Enable secret scanning

## Troubleshooting

### Build Fails

```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

### Deployment Fails

```bash
# Check service status
gcloud run services describe hypertrade --region=us-central1

# Check recent deployments
gcloud run revisions list --service=hypertrade --region=us-central1
```

### Database Connection Issues

```bash
# Verify Cloud SQL instance
gcloud sql instances describe hypertrade-db

# Check connection name format
echo "postgresql://user:pass@localhost/db?host=/cloudsql/PROJECT:REGION:INSTANCE"
```

### Permission Errors

```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com"
```

## Cost Optimization

1. **Set Resource Limits**
   - Min instances: 0 (scale to zero)
   - Max instances: Based on expected traffic
   - CPU/Memory: Start small, scale as needed

2. **Use Artifact Registry** (instead of Container Registry)
   ```bash
   # Create repository
   gcloud artifacts repositories create hypertrade \
     --repository-format=docker \
     --location=us-central1
   
   # Update workflows to use:
   # us-central1-docker.pkg.dev/$PROJECT_ID/hypertrade/$SERVICE_NAME
   ```

3. **Clean Up Old Images**
   ```bash
   # List images
   gcloud container images list-tags gcr.io/$PROJECT_ID/$SERVICE_NAME
   
   # Delete old images
   gcloud container images delete gcr.io/$PROJECT_ID/$SERVICE_NAME:TAG
   ```

## Next Steps

1. Test staging deployment with a PR
2. Verify production deployment works
3. Set up monitoring and alerts
4. Configure custom domain (optional)
5. Set up backup strategies
