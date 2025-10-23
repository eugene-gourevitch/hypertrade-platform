# Fix Trading and Quote Issues

## Problems Identified

1. **Quotes showing incorrect data** - API calls failing or returning stale data
2. **Orders not executing** - Multiple configuration and implementation issues
3. **Python daemon issues** - Not properly configured or running

## Root Causes

### 1. Missing Hyperliquid Configuration
- `HYPERLIQUID_ACCOUNT_ADDRESS` environment variable not set
- `HYPERLIQUID_API_SECRET` environment variable not set
- Python daemon not running or failing to initialize

### 2. Client-Side Signing Issues
- Trying to sign orders directly from browser without proper wallet setup
- Using incorrect chain ID for Hyperliquid
- Missing proper EIP-712 signing implementation

### 3. API Endpoint Issues
- Fallback to HTTP API not working properly
- WebSocket connections failing
- Market data not updating in real-time

## Quick Fix Solutions

### Option 1: Use Server-Side Trading (Recommended)

Instead of signing on client-side, route all trades through the server:

1. **Set Environment Variables**
```bash
# In your .env file or Cloud Run configuration
HYPERLIQUID_ACCOUNT_ADDRESS=your_wallet_address
HYPERLIQUID_API_SECRET=your_api_secret
HYPERLIQUID_TESTNET=false  # or true for testnet
```

2. **Install Python Dependencies**
```bash
pip install hyperliquid-python-sdk
```

3. **Modify Order Flow**
- Change client to call server endpoints
- Server handles all signing and submission
- This is more secure and reliable

### Option 2: Fix Client-Side Trading

1. **Update Chain Configuration**
```javascript
// Hyperliquid uses its own L1, not Arbitrum
const HYPERLIQUID_CHAIN_ID = 1337; // Update to correct chain ID
```

2. **Fix API URLs**
```javascript
// Correct API endpoints
const MAINNET_API_URL = "https://api.hyperliquid.xyz";
const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";
```

## Immediate Actions Required

### 1. Fix Market Data (Quotes)

**File: `client/src/hooks/useHyperliquidMarket.ts`**
```typescript
// Add proper error handling and fallback
const { data: allMids, error } = trpc.market.getAllMids.useQuery(undefined, {
  refetchInterval: 1000, // Update every second
  retry: 3,
  retryDelay: 1000,
  onError: (error) => {
    console.error('[Market] Failed to fetch prices:', error);
    // Use cached data or show error state
  }
});
```

### 2. Fix Order Submission

**File: `server/routers.ts`**
```typescript
placeMarketOrder: protectedProcedure
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    try {
      // Check if Python daemon is available
      const result = await hyperliquidPersistent.placeMarketOrder(
        input.coin,
        input.isBuy,
        input.size,
        input.slippage
      );
      
      if (!result || result.error) {
        throw new Error(result?.error || 'Order failed');
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('[Trading] Order failed:', error);
      
      // Return user-friendly error
      throw new Error('Trading is currently unavailable. Please check your configuration.');
    }
  })
```

### 3. Add Configuration Check

**File: `server/_core/validateEnv.ts`**
```typescript
// Add to critical variables for trading
if (process.env.ENABLE_TRADING === 'true') {
  if (!process.env.HYPERLIQUID_ACCOUNT_ADDRESS) {
    console.error('❌ HYPERLIQUID_ACCOUNT_ADDRESS is required for trading');
    result.valid = false;
  }
  if (!process.env.HYPERLIQUID_API_SECRET) {
    console.error('❌ HYPERLIQUID_API_SECRET is required for trading');
    result.valid = false;
  }
}
```

## Testing Steps

1. **Test Market Data**
```bash
# Check if API is responding
curl https://api.hyperliquid.xyz/info -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"allMids"}'
```

2. **Test Python Daemon**
```bash
# Run directly to test
python3 server/hyperliquid_api.py get_all_mids
```

3. **Test Order Placement**
```bash
# Use testnet first
HYPERLIQUID_TESTNET=true npm run dev
# Try placing a small test order
```

## Proper Setup Guide

### Step 1: Get Hyperliquid API Credentials

1. Go to https://app.hyperliquid.xyz
2. Connect your wallet
3. Go to API settings
4. Generate API key and secret
5. Save wallet address

### Step 2: Configure Environment

```bash
# .env file
HYPERLIQUID_ACCOUNT_ADDRESS=0x...your_wallet_address
HYPERLIQUID_API_SECRET=your_api_secret_key
HYPERLIQUID_TESTNET=false
ENABLE_TRADING=true
```

### Step 3: Install Dependencies

```bash
# Install Python SDK
pip install hyperliquid-python-sdk

# Or use Docker
docker build -t hypertrade .
```

### Step 4: Test Configuration

```bash
# Test market data
npm run dev
# Open browser console and check for errors

# Test order placement (use testnet!)
HYPERLIQUID_TESTNET=true npm run dev
```

## Alternative: Disable Trading

If you just want to view market data without trading:

1. **Disable Order Buttons**
```typescript
// In EnhancedOrderForm.tsx
const TRADING_ENABLED = false; // Set to false to disable

<Button 
  disabled={!TRADING_ENABLED || isLoading}
  onClick={handleSubmit}
>
  {TRADING_ENABLED ? 'Place Order' : 'Trading Disabled'}
</Button>
```

2. **Show View-Only Mode**
```typescript
// Add banner to trading pages
{!TRADING_ENABLED && (
  <Alert className="mb-4">
    <AlertDescription>
      Trading is currently disabled. You're in view-only mode.
    </AlertDescription>
  </Alert>
)}
```

## Long-term Solution

Consider using Hyperliquid's official SDK or API client instead of custom implementation:

1. **Official TypeScript SDK**
```bash
npm install @hyperliquid/sdk
```

2. **Use Exchange Connector**
```typescript
import { Exchange } from '@hyperliquid/sdk';

const exchange = new Exchange(
  walletAddress,
  apiSecret,
  isTestnet
);

// Place orders
await exchange.placeOrder({
  coin: 'BTC',
  isBuy: true,
  size: 0.001,
  orderType: 'market'
});
```

This would be more reliable than the current custom implementation.
