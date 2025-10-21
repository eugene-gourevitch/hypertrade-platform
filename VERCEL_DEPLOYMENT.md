# 🚀 Vercel Deployment Guide

## ✅ What's Fixed

Your app now works on Vercel with **client-side only wallet authentication**:

- ✅ No backend server needed
- ✅ MetaMask connects directly
- ✅ Trading works with user's own wallet
- ✅ All market data loads from Hyperliquid API
- ✅ Pure DeFi - non-custodial

---

## 📋 Deployment Steps

### 1. Push Code to Git

```bash
git add .
git commit -m "Fix Vercel deployment - client-side wallet auth"
git push
```

### 2. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel auto-detects build settings

#### Option B: Via CLI
```bash
pnpm i -g vercel
vercel
```

### 3. Add Environment Variables

**CRITICAL:** Add these environment variables in Vercel dashboard:

1. Go to: `https://vercel.com/[your-username]/[your-project]/settings/environment-variables`
2. Add each variable:

```env
NODE_ENV=production
HYPERLIQUID_TESTNET=false
AUTHORIZED_WALLET=none
VITE_HYPERLIQUID_TESTNET=false
```

3. Set scope to: **Production, Preview, and Development**
4. Click **Save**

### 4. Redeploy

After adding environment variables:
- Go to "Deployments" tab
- Click "..." on latest deployment
- Click "Redeploy"

---

## 🎯 What Works on Vercel

### ✅ Market Data (No Login Needed)
- Real-time price ticker
- Live market stats
- Charts and order books
- All crypto pairs from Hyperliquid mainnet

### ✅ Trading (After MetaMask Connection)
- Connect MetaMask wallet
- Place market orders
- Place limit orders
- Cancel orders
- Close positions
- Update leverage
- View positions and orders

---

## 🔧 How It Works

### Before (Failed on Vercel)
```
User → Server Auth API → Session Cookie → Trading
         ↑
  (Required Express server - doesn't work on Vercel static deployment)
```

### After (Works on Vercel)
```
User → MetaMask Connection → localStorage → Trading
         ↑
  (Pure client-side - works everywhere!)
```

### Dual-Mode Authentication

The app now supports **two modes**:

#### Local Development (with Express server)
- Uses full server auth with `/api/auth/*` endpoints
- Session cookies and database

#### Vercel Production (static site)
- Uses localStorage for wallet address
- No server auth needed
- Still fully functional!

---

## 🐛 Troubleshooting

### "Wallet connects but nothing happens"

**Problem:** Environment variable `VITE_HYPERLIQUID_TESTNET` not set

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. Add: `VITE_HYPERLIQUID_TESTNET=false`
3. Redeploy

### "Market data not loading"

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Verify Hyperliquid API is accessible:
   ```
   https://api.hyperliquid.xyz/info
   ```

### "Trading fails after connecting wallet"

**Check:**
1. MetaMask is connected to correct network
2. You have funds in your wallet
3. Hyperliquid mainnet is operational
4. Check browser console for errors

---

## 🔐 Security Notes

### Safe (Client-Side Only)
- ✅ localStorage wallet address
- ✅ MetaMask signatures
- ✅ No private keys stored

### Never Store
- ❌ Private keys
- ❌ Seed phrases
- ❌ API secrets in frontend code

---

## 📊 Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Vercel sets automatically |
| `HYPERLIQUID_TESTNET` | No | Server-side testnet flag (ignored on Vercel) |
| `AUTHORIZED_WALLET` | No | Set to `none` to allow any wallet |
| `VITE_HYPERLIQUID_TESTNET` | **YES** | Client-side testnet flag (REQUIRED!) |

**CRITICAL:** `VITE_` prefix exposes variable to frontend code. Without it, the app won't know which Hyperliquid network to use!

---

## 🎉 Success Checklist

After deployment, test these:

- [ ] Homepage loads
- [ ] Market ticker scrolls smoothly
- [ ] Click "Connect MetaMask"
- [ ] MetaMask popup appears
- [ ] After connecting, redirected to `/trade`
- [ ] Can see account balance
- [ ] Can select a coin (BTC, ETH, etc.)
- [ ] Can place a test order (small amount!)
- [ ] MetaMask popup for signature appears
- [ ] Order executes successfully
- [ ] Can cancel orders
- [ ] Can disconnect wallet

---

## 📞 Need Help?

If deployment fails:

1. Check Vercel deployment logs
2. Verify all environment variables are set
3. Test locally first: `pnpm dev`
4. Check browser console for errors
5. Verify MetaMask is installed

---

## 🔄 Future: Full Backend Deployment

If you want server-side features (database, OAuth, etc.):

1. Deploy backend separately to:
   - Railway
   - Render
   - Heroku
   - Your own VPS

2. Update frontend to point to backend URL

3. Keep Vercel for frontend static files

---

**Your app is now ready for Vercel! 🎉**
