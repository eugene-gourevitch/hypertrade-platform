# Google Cloud SQL Setup Guide

## Prerequisites
- Google Cloud Project with billing enabled
- gcloud CLI installed and configured
- Cloud SQL Admin API enabled

## Step 1: Create Cloud SQL Instance

```bash
# Set your project ID
export PROJECT_ID=your-project-id
export REGION=us-central1
export INSTANCE_NAME=hypertrade-db

# Create PostgreSQL instance
gcloud sql instances create $INSTANCE_NAME \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --network=default \
  --no-backup \
  --storage-size=10GB \
  --storage-type=SSD
```

## Step 2: Create Database and User

```bash
# Set root password
gcloud sql users set-password postgres \
  --instance=$INSTANCE_NAME \
  --password=YOUR_ROOT_PASSWORD

# Connect to instance
gcloud sql connect $INSTANCE_NAME --user=postgres

# In PostgreSQL prompt, run:
CREATE DATABASE hypertrade_production;
CREATE USER hypertrade_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE hypertrade_production TO hypertrade_user;
\q
```

## Step 3: Configure Cloud Run Connection

### Option A: Using Cloud SQL Proxy (Recommended)

1. Enable Cloud SQL connection in Cloud Run:
```bash
gcloud run services update hypertrade \
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$INSTANCE_NAME \
  --region=$REGION
```

2. Set DATABASE_URL environment variable:
```bash
# Format for Cloud SQL Proxy connection
export DATABASE_URL="postgresql://hypertrade_user:password@localhost/hypertrade_production?host=/cloudsql/$PROJECT_ID:$REGION:$INSTANCE_NAME"

gcloud run services update hypertrade \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --region=$REGION
```

### Option B: Using Public IP

1. Get the instance's public IP:
```bash
gcloud sql instances describe $INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)"
```

2. Authorize Cloud Run's IP (not recommended for production):
```bash
# This is less secure - use Cloud SQL Proxy instead
gcloud sql instances patch $INSTANCE_NAME \
  --authorized-networks=0.0.0.0/0
```

## Step 4: Run Database Migrations

### Local migration with Cloud SQL Proxy:
```bash
# Install Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# Start proxy
./cloud_sql_proxy -instances=$PROJECT_ID:$REGION:$INSTANCE_NAME=tcp:5432 &

# Run migrations
DATABASE_URL="postgresql://hypertrade_user:password@localhost:5432/hypertrade_production" \
npm run db:push
```

### Using GitHub Actions or Cloud Build:
Add to your CI/CD pipeline:
```yaml
- name: Run migrations
  run: |
    wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
    chmod +x cloud_sql_proxy
    ./cloud_sql_proxy -instances=${{ secrets.INSTANCE_CONNECTION_NAME }}=tcp:5432 &
    sleep 5
    DATABASE_URL="${{ secrets.DATABASE_URL }}" npm run db:push
```

## Step 5: Set All Environment Variables

```bash
# Set all required environment variables for production
gcloud run services update hypertrade \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --set-env-vars HYPERLIQUID_ACCOUNT_ADDRESS=your-address \
  --set-env-vars HYPERLIQUID_API_SECRET=your-secret \
  --set-env-vars ANTHROPIC_API_KEY=your-api-key \
  --set-env-vars VITE_WALLETCONNECT_PROJECT_ID=your-project-id \
  --set-env-vars NODE_ENV=production \
  --region=$REGION
```

## Step 6: Verify Connection

Check Cloud Run logs:
```bash
gcloud run logs read --service=hypertrade --region=$REGION --limit=50
```

Look for:
- `[Database] ✅ Successfully connected to database`
- `[ENV] ✅ All environment variables configured correctly`

## Troubleshooting

### Connection Refused
- Ensure Cloud SQL instance is running
- Verify Cloud SQL connection is added to Cloud Run service
- Check DATABASE_URL format (use Unix socket path for Cloud SQL Proxy)

### Authentication Failed
- Verify username and password
- Ensure user has proper privileges
- Check if SSL is required

### Timeout Issues
- Increase connection timeout in db.ts
- Check Cloud SQL instance performance
- Consider upgrading instance tier for production

## Security Best Practices

1. **Never use public IP in production** - Always use Cloud SQL Proxy
2. **Use Secret Manager** for sensitive values:
```bash
echo -n "your-database-url" | gcloud secrets create db-url --data-file=-
gcloud run services update hypertrade \
  --set-secrets=DATABASE_URL=db-url:latest
```

3. **Enable automatic backups** for production:
```bash
gcloud sql instances patch $INSTANCE_NAME \
  --backup-start-time=03:00 \
  --backup-location=$REGION
```

4. **Monitor database performance**:
- Enable Cloud SQL Insights
- Set up alerting for connection issues
- Monitor query performance

## Cleanup (if needed)

```bash
# Delete Cloud SQL instance (WARNING: This deletes all data!)
gcloud sql instances delete $INSTANCE_NAME

# Remove Cloud SQL connection from Cloud Run
gcloud run services update hypertrade \
  --remove-cloudsql-instances=$PROJECT_ID:$REGION:$INSTANCE_NAME
```
