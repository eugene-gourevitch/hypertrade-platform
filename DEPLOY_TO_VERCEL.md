# 🚀 Deploy HyperTrade to Vercel - Complete Guide

## **MetaMask-Only Authentication (No OAuth Bullshit)**

---

## **🎯 QUICK START (5 Minutes)**

### **Step 1: Push to GitHub**
```bash
git add -A
git commit -m "feat: MetaMask auth + Hyperliquid UI + WebSockets"
git push origin master
```

### **Step 2: Import to Vercel**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Click "Deploy"

### **Step 3: Add Environment Variables**
In Vercel Dashboard → Settings → Environment Variables, add:

```env
AUTHORIZED_WALLET=0xYourMetaMaskWalletAddressHere
JWT_SECRET=generate-a-random-32-char-string-here
NODE_ENV=production
```

### **Step 4: Redeploy**
- Go to Deployments tab
- Click "Redeploy" button

**Done!** Your platform is live! 🎉

---

## **🔑 Environment Variables Explained**

### **REQUIRED (Must Set in Vercel):**

#### **AUTHORIZED_WALLET**
```env
AUTHORIZED_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9
```
- **What:** Your MetaMask wallet address
- **Why:** Only this wallet can access the platform
- **How to get:** Open MetaMask → Copy your address
- **Important:** Use the FULL address with `0x` prefix

#### **JWT_SECRET**
```env
JWT_SECRET=a8f3k2m9x7b4n6v2c8z5q1w3e7r9t4y6
```
- **What:** Secret key for session tokens
- **Why:** Secures your authentication
- **How to generate:** Use a random string generator
- **Important:** At least 32 characters, never share

---

### **OPTIONAL (For Real Trading):**

#### **Hyperliquid API** (if you want actual trading)
```env
HYPERLIQUID_ACCOUNT_ADDRESS=0xYourHyperliquidWallet
HYPERLIQUID_API_SECRET=YourPrivateKeyHere
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
```

#### **Database** (if you want to store trade history)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

---

## **⚙️ Vercel Configuration**

The `vercel.json` file is already configured:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "framework": null,
  "installCommand": "pnpm install"
}
```

---

## **🧪 Test Before Deploying**

### **1. Test Build Locally:**
```bash
pnpm build
```
**Expected:** ✓ built in ~2 minutes

### **2. Test Production Server:**
```bash
pnpm start
```
**Expected:** Server running on http://localhost:3000

### **3. Test MetaMask Connection:**
- Visit http://localhost:3000
- Click "Connect Wallet"
- Sign message in MetaMask
- Should redirect to /trade

---

## **🚀 Deployment Steps (Detailed)**

### **Option 1: Vercel Dashboard (Easiest)**

1. **Push Code to GitHub**
   ```bash
   git add -A
   git commit -m "feat: production-ready MetaMask auth"
   git push origin master
   ```

2. **Import Repository**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `hypertrade-platform` repo
   - Click "Import"

3. **Configure Build Settings** (Should auto-detect)
   - Framework Preset: Other
   - Build Command: `pnpm build`
   - Output Directory: `dist/public`
   - Install Command: `pnpm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add `AUTHORIZED_WALLET`
   - Add `JWT_SECRET`
   - Add others as needed

5. **Deploy**
   - Click "Deploy"
   - Wait ~3-5 minutes
   - Visit your live URL!

---

### **Option 2: Vercel CLI (For Power Users)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Or deploy directly to production
vercel --prod

# Set environment variables
vercel env add AUTHORIZED_WALLET
vercel env add JWT_SECRET
```

---

## **🔒 Security Setup**

### **1. Get Your Wallet Address**
```bash
# Open MetaMask
# Click on your account name
# It will copy your address
# Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9
```

### **2. Generate JWT Secret**
```bash
# Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator (HTTPS only!)
# https://www.uuidgenerator.net/
```

### **3. Add to Vercel**
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Add both variables
- Make sure to select "Production" environment

---

## **🐛 Troubleshooting**

### **Build Failed**
❌ **Error:** Module not found  
✅ **Fix:** Run `pnpm install` locally, commit `pnpm-lock.yaml`

❌ **Error:** TypeScript errors  
✅ **Fix:** Run `pnpm check` locally, fix errors

### **Runtime Errors**

❌ **Error:** "AUTHORIZED_WALLET not set"  
✅ **Fix:** Add environment variable in Vercel, redeploy

❌ **Error:** "MetaMask not detected"  
✅ **Fix:** Install MetaMask browser extension

❌ **Error:** "Access denied" when connecting wallet  
✅ **Fix:** Update `AUTHORIZED_WALLET` to your actual MetaMask address

### **WebSocket Issues**

❌ **Error:** WebSocket connection fails  
✅ **Fix:** Vercel supports WebSockets, but you may need serverless-friendly approach

---

## **📊 After Deployment**

### **1. Test Your Live Site**
- Visit your Vercel URL
- Open browser console (F12)
- Look for errors
- Test MetaMask connection
- Try placing a test order (if connected to real API)

### **2. Monitor Logs**
- Vercel Dashboard → Your Project → Logs
- Watch for errors
- Monitor WebSocket connections

### **3. Set Custom Domain (Optional)**
- Vercel Dashboard → Settings → Domains
- Add your custom domain
- Update `APP_URL` environment variable

---

## **⚡ Performance Optimization**

### **Current Build Size:**
- Total: ~2.5 MB
- Largest chunk: 1.3 MB (can be optimized)

### **Future Optimizations:**
1. Code splitting (dynamic imports)
2. Lazy load trading components
3. Tree-shaking unused dependencies
4. CDN for static assets

---

## **🎯 Production Checklist**

- [ ] Code pushed to GitHub
- [ ] Repository imported to Vercel
- [ ] `AUTHORIZED_WALLET` environment variable set
- [ ] `JWT_SECRET` environment variable set
- [ ] Build completed successfully
- [ ] Site is live and accessible
- [ ] MetaMask connection works
- [ ] WebSocket status shows "Connected"
- [ ] Can view market data
- [ ] Can place orders (if API configured)
- [ ] Custom domain configured (optional)

---

## **💡 Pro Tips**

### **Vercel-Specific:**
- Use Vercel Postgres for database (free tier available)
- Enable Vercel Analytics for monitoring
- Set up Vercel Edge Functions for WebSocket optimization
- Use Preview deployments for testing

### **MetaMask:**
- Test with MetaMask on mobile
- Support WalletConnect for mobile wallets
- Add wallet switching support
- Handle network changes gracefully

### **Performance:**
- Enable Vercel's Edge Network
- Use ISR (Incremental Static Regeneration) where possible
- Implement service workers for offline support
- Add loading skeletons for better UX

---

## **🔥 You're Ready!**

Your HyperTrade platform is:
✅ Built and tested locally  
✅ Configured for Vercel  
✅ Using MetaMask (no OAuth complexity)  
✅ Production-ready  

**Now go deploy that shit and start trading! 🚀**

---

## **📞 Need Help?**

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support
- **MetaMask Docs:** https://docs.metamask.io

**Common Vercel Issues:**
- Environment variables not working? Redeploy after adding them
- Build failing? Check build logs in Vercel dashboard
- 404 errors? Check your `vercel.json` configuration

