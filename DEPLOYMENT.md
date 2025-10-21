# Deployment Guide - HyperTrade Platform

This guide explains how to deploy the HyperTrade platform with the frontend on Vercel and the backend on Railway or Render.

## Architecture Overview

**Split Deployment:**
- **Frontend**: Deployed on Vercel (static React app)
- **Backend**: Deployed on Railway or Render (Node.js + Python daemon + WebSocket)

## Prerequisites

1. **Accounts Required:**
   - GitHub account (for code hosting)
   - Vercel account (https://vercel.com)
   - Railway account (https://railway.app) OR Render account (https://render.com)
   - MySQL database (PlanetScale, Railway, or other MySQL provider)

2. **Local Setup:**
   ```bash
   # Install dependencies
   pnpm install

   # Install Python dependencies
   pip3 install hyperliquid-python-sdk
   ```

3. **Hyperliquid API Credentials:**
   - Wallet address
   - API secret (private key)
   - Test on testnet first before using mainnet

---

## Step 1: Deploy Backend (Railway or Render)

### Option A: Railway

1. **Create New Project:**
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the configuration from `railway.json`

2. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000

   # Hyperliquid API
   HYPERLIQUID_ACCOUNT_ADDRESS=0xYourWalletAddress
   HYPERLIQUID_API_SECRET=YourPrivateKey
   HYPERLIQUID_TESTNET=false

   # Database
   DATABASE_URL=mysql://user:password@host:3306/dbname

   # Session Security
   JWT_SECRET=<generate-random-64-char-string>
   VITE_APP_ID=hypertrade

   # Frontend URL (update after deploying frontend)
   APP_URL=https://your-app.vercel.app
   ```

3. **Configure Python:**
   - Railway auto-detects Python 3.11
   - No additional configuration needed

4. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the deployment URL (e.g., `hypertrade-backend.up.railway.app`)

5. **Verify Deployment:**
   ```bash
   curl https://your-backend.railway.app/api/trpc/system.health
   ```

### Option B: Render

1. **Create New Web Service:**
   - Go to https://dashboard.render.com/select-repo
   - Select your repository
   - Render will auto-detect configuration from `render.yaml`

2. **Set Environment Variables:**
   - Go to the service settings
   - Add the same environment variables as Railway (listed above)

3. **Configure Python:**
   - Render auto-detects Python from requirements.txt
   - Create `requirements.txt` if not exists:
     ```
     hyperliquid-python-sdk
     ```

4. **Deploy:**
   - Render will automatically build and deploy
   - Copy the deployment URL (e.g., `hypertrade-backend.onrender.com`)

---

## Step 2: Deploy Frontend (Vercel)

1. **Import Project:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

2. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend.railway.app/api/trpc
   ```
   *(Replace with your actual backend URL from Step 1)*

3. **Configure Build Settings:**
   - Build Command: `pnpm build:frontend` (auto-detected from vercel.json)
   - Output Directory: `dist/public` (auto-detected)
   - Install Command: `pnpm install` (auto-detected)

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Copy the deployment URL (e.g., `hypertrade.vercel.app`)

---

## Step 3: Update Backend with Frontend URL

1. **Update Backend Environment Variable:**
   - Go back to Railway/Render dashboard
   - Update `APP_URL` to your Vercel URL:
     ```
     APP_URL=https://hypertrade.vercel.app
     ```

2. **Configure CORS (if needed):**
   - The backend is already configured to accept credentials from the frontend
   - Cookies will work across domains with `credentials: 'include'`

---

## Step 4: Database Setup

### Option A: PlanetScale (Recommended)

1. **Create Database:**
   - Go to https://planetscale.com
   - Create new database
   - Copy connection string

2. **Run Migrations:**
   ```bash
   # Locally, with DATABASE_URL set
   pnpm db:push
   ```

3. **Update Backend:**
   - Set `DATABASE_URL` in Railway/Render to PlanetScale connection string

### Option B: Railway MySQL

1. **Add MySQL Plugin:**
   - In Railway project, click "New" → "Database" → "MySQL"
   - Copy the `DATABASE_URL` from MySQL service

2. **Run Migrations:**
   ```bash
   pnpm db:push
   ```

---

## Step 5: Testing Deployment

### Backend Health Check
```bash
curl https://your-backend.railway.app/api/trpc/system.health
```
Expected: `{"status":"ok"}`

### Frontend Access
1. Visit `https://your-app.vercel.app`
2. Click "Connect Wallet"
3. Sign message with your wallet
4. Verify you can access the trading interface

### WebSocket Connection
- Check browser console for WebSocket connection logs
- Should see: `[HyperWS] ✅ Connected to Hyperliquid WebSocket`

### Python Daemon
- Check Railway/Render logs for:
  ```
  [Hyperliquid Daemon] Ready!
  ```

---

## Environment Variables Reference

### Backend (Railway/Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | No | Server port | `3000` (Railway auto-sets) |
| `HYPERLIQUID_ACCOUNT_ADDRESS` | Yes | Hyperliquid wallet address | `0x123...` |
| `HYPERLIQUID_API_SECRET` | Yes | Private key | `0xabc...` |
| `HYPERLIQUID_TESTNET` | No | Use testnet | `false` |
| `DATABASE_URL` | Yes | MySQL connection string | `mysql://...` |
| `JWT_SECRET` | Yes | Session signing key | Random 64-char string |
| `VITE_APP_ID` | Yes | App identifier | `hypertrade` |
| `APP_URL` | Yes | Frontend URL | `https://app.vercel.app` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API endpoint | `https://backend.railway.app/api/trpc` |

---

## Security Checklist

- [ ] Changed `JWT_SECRET` to a strong random value
- [ ] Using mainnet API keys? Double-check wallet address
- [ ] Database credentials are secure
- [ ] `APP_URL` matches your actual frontend domain
- [ ] Test wallet authentication end-to-end
- [ ] WebSocket connection works
- [ ] Verify no sensitive data in browser console

---

## Troubleshooting

### "Failed to fetch" errors
- **Cause**: Backend URL incorrect or CORS issue
- **Fix**: Verify `VITE_API_URL` in Vercel matches your backend URL exactly

### "Daemon not ready" errors
- **Cause**: Python daemon failed to start
- **Fix**:
  - Check Railway/Render logs for Python errors
  - Verify Python 3.11+ is installed
  - Verify `hyperliquid-python-sdk` is in requirements.txt

### WebSocket not connecting
- **Cause**: Hyperliquid API issue or network problem
- **Fix**:
  - Check backend logs for WebSocket errors
  - Verify Hyperliquid API status
  - Restart backend service

### "Database not available" warnings
- **Cause**: `DATABASE_URL` not set or incorrect
- **Fix**:
  - Verify `DATABASE_URL` is set in environment variables
  - Test database connection locally first
  - Check database is accessible from Railway/Render IP

### Session/Auth issues
- **Cause**: JWT secret mismatch or cookie domain issues
- **Fix**:
  - Verify `JWT_SECRET` is set and consistent
  - Check `APP_URL` matches frontend domain
  - Clear browser cookies and try again

---

## Monitoring

### Railway
- View logs: Project → Service → Logs
- View metrics: Project → Service → Metrics
- Set up health check alerts

### Render
- View logs: Service → Logs
- View metrics: Service → Metrics
- Configure health check notifications

### Vercel
- View build logs: Deployment → Build Logs
- View runtime logs: Deployment → Runtime Logs
- Configure deployment notifications

---

## Scaling Considerations

### Backend
- **Railway**: Scale up to higher plan for more resources
- **Render**: Use at least "Starter" plan for production
- **Database**: PlanetScale auto-scales, consider read replicas for high traffic

### Frontend
- Vercel automatically handles CDN and edge caching
- No manual scaling needed

---

## Cost Estimates

### Hobby/Development
- **Vercel**: Free tier (perfect for hobby projects)
- **Railway**: ~$5-10/month (Starter plan with 8GB RAM)
- **Render**: $7/month (Starter plan)
- **PlanetScale**: Free tier (1 database, 5GB storage)

### Production
- **Vercel**: $20/month (Pro plan for team features)
- **Railway**: $20-50/month depending on usage
- **Render**: $25-50/month for higher plans
- **PlanetScale**: $29/month (Scaler plan, 10GB+ storage)

---

## Support

- **Documentation**: See CLAUDE.md for technical details
- **Issues**: https://github.com/your-repo/issues
- **Discord**: (Add your Discord link)

---

## Next Steps

After successful deployment:

1. **Test all features:**
   - Wallet authentication
   - Real-time market data
   - Order placement
   - Position management

2. **Monitor performance:**
   - Check backend logs for errors
   - Monitor WebSocket stability
   - Track Python daemon uptime

3. **Set up alerts:**
   - Configure Railway/Render health check alerts
   - Set up Vercel deployment notifications
   - Monitor database query performance

4. **Regular maintenance:**
   - Update dependencies monthly
   - Review logs weekly
   - Test on testnet before mainnet changes

---

## Rollback Procedure

### Vercel (Frontend)
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

### Railway (Backend)
1. Go to Deployments
2. Click previous deployment
3. Click "Redeploy"

### Render (Backend)
1. Go to Events
2. Find previous successful deploy
3. Click "Rollback to this version"

---

*Last Updated: January 2025*
