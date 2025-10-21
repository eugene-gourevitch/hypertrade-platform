# 🚀 Deploying HyperTrade to Vercel

## **MetaMask-Only Authentication - No OAuth Needed**

---

## **🔧 Setup Instructions**

### **1. Install Vercel CLI (Optional)**
```bash
npm i -g vercel
```

### **2. Configure Environment Variables in Vercel Dashboard**

Go to your Vercel project → Settings → Environment Variables and add:

#### **Required Variables:**
```env
NODE_ENV=production
APP_URL=https://your-app.vercel.app
AUTHORIZED_WALLET=0xYourMetaMaskWalletAddressHere
JWT_SECRET=your-secure-random-secret-minimum-32-chars
```

#### **Hyperliquid API (if using real trading):**
```env
HYPERLIQUID_ACCOUNT_ADDRESS=0xYourHyperliquidWallet
HYPERLIQUID_API_SECRET=YourPrivateKeyHere
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
```

#### **Optional:**
```env
VITE_APP_TITLE=HyperTrade - Professional Trading Platform
DATABASE_URL=your-postgresql-url (if using Vercel Postgres)
```

---

## **📝 Important Notes**

### **MetaMask Authentication**
- ✅ No Google OAuth needed
- ✅ No OAUTH_SERVER_URL needed
- ✅ Client-side wallet signing
- ✅ Server verifies signature
- ✅ Session stored in secure cookie

### **Authorized Wallet**
- Set `AUTHORIZED_WALLET` to YOUR MetaMask address
- Only that wallet can access the platform
- Case-insensitive matching
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9`

### **Security**
- `JWT_SECRET` should be at least 32 characters
- Use a random string generator
- Never commit to git

---

## **🚀 Deployment Methods**

### **Method 1: GitHub Integration (Recommended)**
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### **Method 2: Vercel CLI**
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## **✅ Pre-Deployment Checklist**

- [ ] Set `AUTHORIZED_WALLET` in Vercel environment variables
- [ ] Set `JWT_SECRET` in Vercel environment variables  
- [ ] Set `APP_URL` to your Vercel app URL
- [ ] Remove Google OAuth dependencies (already done!)
- [ ] Test build locally: `pnpm build`
- [ ] Test production mode: `pnpm start`
- [ ] Commit all changes
- [ ] Push to GitHub

---

## **🧪 Test Build Locally**

```bash
# Build the app
pnpm build

# Should see:
# ✓ 6046 modules transformed
# ✓ built in XXs

# Test production server
pnpm start

# Visit http://localhost:3000
```

---

## **🔥 What Happens on Vercel**

1. **Build Phase:**
   - Runs `pnpm install`
   - Runs `pnpm build` (builds frontend + backend)
   - Creates `dist/public/` folder

2. **Runtime:**
   - Runs `node dist/index.js`
   - Serves static files from `dist/public/`
   - WebSocket connections established
   - MetaMask authentication ready

---

## **🐛 Common Issues**

### **"OAuth not configured" error**
✅ **FIXED** - We removed Google OAuth, using MetaMask only

### **Build fails with missing exports**
✅ **FIXED** - TradingViewChart export fixed

### **Environment variables not working**
- Make sure they're added in Vercel dashboard
- Restart the deployment after adding variables

### **MetaMask not connecting**
- Check browser console for errors
- Make sure wallet is unlocked
- Try refreshing the page

---

## **📊 After Deployment**

### **Update Your Wallet:**
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Update `AUTHORIZED_WALLET` with your MetaMask address
4. Redeploy

### **Test the Platform:**
1. Visit your Vercel URL
2. Click "Connect Wallet"
3. Approve MetaMask signature request
4. Get redirected to `/trade`
5. Start trading!

---

## **🎯 Production Checklist**

- [ ] `AUTHORIZED_WALLET` set to your real wallet
- [ ] `JWT_SECRET` is secure random string
- [ ] `APP_URL` matches your Vercel domain
- [ ] Hyperliquid API credentials added (if trading)
- [ ] Database configured (if storing data)
- [ ] Test wallet connection
- [ ] Test order placement
- [ ] Monitor Vercel logs

---

## **🔗 Useful Links**

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **MetaMask:** https://metamask.io
- **Hyperliquid API:** https://hyperliquid.gitbook.io

---

## **✨ You're Ready to Deploy!**

Your HyperTrade platform is now configured for MetaMask-only authentication and ready for Vercel deployment!

No OAuth complexity, just clean Web3 wallet authentication. 🔥

