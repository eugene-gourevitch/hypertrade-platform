# 🔥 HyperTrade - MetaMask Authentication Guide

## **Why MetaMask Instead of Google OAuth?**

Because this is a **DeFi trading platform**! Users need to:
- ✅ Sign transactions with their wallet
- ✅ Connect to Hyperliquid with their wallet
- ✅ Trustless authentication
- ✅ No centralized OAuth servers

---

## **🎯 Current Setup**

### **✅ What's Implemented:**

1. **MetaMask Wallet Authentication** (`server/_core/walletAuth.ts`)
   - Sign-in with wallet signature
   - No passwords, no OAuth
   - Nonce-based security
   - Session management

2. **WalletConnect Component** (`client/src/components/WalletConnect.tsx`)
   - "Connect Wallet" button
   - MetaMask detection
   - Auto-connect on page load
   - Disconnect functionality

3. **Secure Session Management**
   - Base64 encoded session tokens
   - 1-year expiration
   - Secure HTTP-only cookies
   - CSRF protection with nonces

---

## **🔒 How It Works**

### **Authentication Flow:**

```
1. User clicks "Connect Wallet"
   ↓
2. MetaMask popup appears
   ↓
3. User approves connection
   ↓
4. App requests signature for nonce
   ↓
5. User signs message in MetaMask
   ↓
6. Server verifies signature
   ↓
7. Check if wallet is authorized
   ↓
8. Create session, set secure cookie
   ↓
9. Redirect to /trade
   ↓
10. User can now trade!
```

---

## **⚙️ Configuration**

### **Environment Variables:**

#### **Development (`.env`):**
```env
AUTHORIZED_WALLET=0xYourMetaMaskAddress
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

#### **Production (Vercel Dashboard):**
```env
AUTHORIZED_WALLET=0xYourMetaMaskAddress
JWT_SECRET=super-secure-random-32-char-string
NODE_ENV=production
APP_URL=https://your-app.vercel.app
```

---

## **🎨 User Experience**

### **On Homepage:**
- **Not Connected:** Shows "Connect Wallet" button
- **Connected:** Shows wallet address (0x1234...5678)
- **Unauthorized:** Shows error message

### **On Trading Page:**
- **Not Connected:** Redirects to home
- **Connected & Authorized:** Full access to trading
- **Connected & Unauthorized:** Access denied

---

## **🔐 Security Features**

1. **Wallet Signature Verification**
   - Uses `viem` library for signature verification
   - Prevents replay attacks with nonces
   - Nonces expire after 5 minutes

2. **Authorized Wallet Only**
   - Hard-coded wallet address check
   - Case-insensitive matching
   - Rejects all other wallets

3. **Session Security**
   - HTTP-only cookies
   - Secure flag in production
   - 1-year expiration
   - Can be revoked server-side

---

## **🚀 For Vercel Deployment**

### **No OAuth Files Needed:**
- ❌ `oauth.ts` - DELETED
- ❌ Google OAuth credentials - NOT NEEDED
- ❌ OAuth redirect URIs - NOT NEEDED
- ✅ `walletAuth.ts` - ONLY THIS

### **What to Set in Vercel:**
1. Go to project Settings → Environment Variables
2. Add `AUTHORIZED_WALLET=0xYourAddress`
3. Add `JWT_SECRET=random-secure-string`
4. Redeploy

---

## **💡 How to Get Your Wallet Address**

### **From MetaMask:**
1. Open MetaMask extension
2. Click on account name at top
3. Address is copied to clipboard
4. Should look like: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9`

### **Verify Your Address:**
```bash
# In browser console:
ethereum.request({ method: 'eth_requestAccounts' })
  .then(accounts => console.log('Your address:', accounts[0]))
```

---

## **🔥 Advantages of MetaMask Auth**

### **vs Google OAuth:**
- ✅ No OAuth server needed
- ✅ Truly decentralized
- ✅ Users control their keys
- ✅ No email/password
- ✅ Works with hardware wallets

### **vs Username/Password:**
- ✅ No password to remember
- ✅ No password reset flow
- ✅ Cryptographically secure
- ✅ Can't be phished (easily)

### **For DeFi Trading:**
- ✅ Same wallet for trading & auth
- ✅ Direct connection to Hyperliquid
- ✅ Sign transactions from same wallet
- ✅ Industry standard (like Uniswap, GMX, etc)

---

## **🎯 Next Steps**

1. ✅ Code is ready
2. ✅ Build tested
3. ✅ MetaMask auth implemented
4. 🔄 Push to GitHub
5. 🔄 Deploy to Vercel
6. 🔄 Add environment variables
7. 🔄 Test live deployment

---

## **🚨 Important Notes**

### **For Production:**
- Change `JWT_SECRET` to a strong random string
- Update `AUTHORIZED_WALLET` to your real wallet
- Use HTTPS (Vercel does this automatically)
- Test thoroughly before real trading

### **For Multiple Users:**
If you want to allow multiple wallets later, you can:
1. Remove the wallet check in `walletAuth.ts`
2. Or add more wallets to an allowed list
3. Or implement a whitelist in database

---

## **🔥 You're Ready for Vercel!**

**Your platform has:**
- ✅ MetaMask wallet authentication
- ✅ No OAuth complexity
- ✅ Secure session management
- ✅ Production build tested
- ✅ Vercel-ready configuration

**Just deploy that shit and start trading! 🚀**

