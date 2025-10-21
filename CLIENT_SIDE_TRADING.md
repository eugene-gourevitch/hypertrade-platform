# Client-Side Trading with MetaMask

## Overview

HyperTrade now uses **100% client-side transaction signing** with YOUR MetaMask wallet. All trading operations are signed directly in your browser and sent to Hyperliquid DEX.

## How It Works

### Before (Server-Side Trading):
```
You → HyperTrade Server → Hyperliquid
      (uses server's wallet)
```

### Now (Client-Side Trading):
```
You + MetaMask → Hyperliquid
(signs with YOUR wallet directly)
```

## Key Features

### ✅ **Full Control**
- All transactions signed with YOUR wallet
- No server has access to your private keys
- You see every transaction in MetaMask before approving

### ✅ **Your Positions**
- View YOUR actual positions on Hyperliquid
- Trade with YOUR capital
- YOUR PnL, not server's

### ✅ **Security**
- Non-custodial: You control your funds
- MetaMask signature required for every action
- EIP-712 typed signatures (Hyperliquid standard)

## Supported Operations

All trading operations use client-side signing:

| Operation | Description | MetaMask Signature |
|-----------|-------------|-------------------|
| **Place Market Order** | Instant execution at current price | ✅ Required |
| **Place Limit Order** | Order at specific price | ✅ Required |
| **Cancel Order** | Cancel a specific order | ✅ Required |
| **Cancel All Orders** | Cancel all orders for a coin | ✅ Required |
| **Close Position** | Market order to close position | ✅ Required |
| **Update Leverage** | Change leverage settings | ✅ Required |

## Code Structure

### Client-Side SDK
**Location:** `client/src/lib/hyperliquid.ts`

Core functions for interacting with Hyperliquid:
- `placeOrder()` - Place limit order
- `placeMarketOrder()` - Place market order
- `cancelOrder()` - Cancel specific order
- `cancelAllOrders()` - Cancel all orders
- `updateLeverage()` - Update leverage

### React Hook
**Location:** `client/src/hooks/useHyperliquid.ts`

```typescript
import { useHyperliquid } from "@/hooks/useHyperliquid";

function MyComponent() {
  const { placeMarketOrder, cancelOrder, status } = useHyperliquid();

  const handleTrade = async () => {
    await placeMarketOrder({
      coin: "BTC",
      isBuy: true,
      size: 0.1,
      slippage: 0.5,
    });
  };

  return <button onClick={handleTrade}>Buy BTC</button>;
}
```

### Updated Components

1. **EnhancedOrderForm** (`client/src/components/enhanced/EnhancedOrderForm.tsx`)
   - Market, Limit, and Pro order tabs
   - Client-side signing for all order types

2. **PositionsTable** (`client/src/components/enhanced/PositionsTable.tsx`)
   - Close positions with MetaMask

3. **OpenOrdersTable** (`client/src/components/enhanced/OpenOrdersTable.tsx`)
   - Cancel orders with MetaMask

## Transaction Flow

### Example: Placing a Market Order

```typescript
1. User clicks "Buy BTC" button
   ↓
2. useHyperliquid.placeMarketOrder() called
   ↓
3. Get current signer from MetaMask
   ↓
4. Fetch current BTC price from Hyperliquid API
   ↓
5. Calculate limit price with slippage
   ↓
6. Create EIP-712 typed data structure
   ↓
7. **MetaMask popup** - User signs transaction
   ↓
8. Send signed action to Hyperliquid API
   ↓
9. Order executed on Hyperliquid
   ↓
10. Toast notification shown
```

## EIP-712 Signing

Hyperliquid uses EIP-712 typed data signing for security:

```typescript
const HYPERLIQUID_DOMAIN = {
  name: "Exchange",
  version: "1",
  chainId: 42161, // Arbitrum One
  verifyingContract: "0x0000000000000000000000000000000000000000",
};

// User signs structured data, not raw bytes
const signature = await signer.signTypedData(domain, types, value);
```

## API Endpoints

**Hyperliquid Mainnet:** `https://api.hyperliquid.xyz`
**Hyperliquid Testnet:** `https://api.hyperliquid-testnet.xyz`

### Info API
- `POST /info` - Get market data, user state, etc.

### Exchange API
- `POST /exchange` - Submit signed trading actions

## Error Handling

All errors are handled gracefully with toast notifications:

```typescript
try {
  await hyperliquid.placeOrder({ ... });
  toast.success("Order placed!");
} catch (error) {
  toast.error(`Order failed: ${error.message}`);
}
```

Common errors:
- **"MetaMask not installed"** - Install MetaMask
- **"Wallet mismatch"** - Connected wallet doesn't match authenticated user
- **"User denied signature"** - User rejected MetaMask popup
- **"Insufficient margin"** - Not enough funds
- **"Asset not found"** - Invalid coin symbol

## Development

### Testing Client-Side Trading

1. **Install MetaMask** browser extension
2. **Connect wallet** on homepage
3. **Navigate to /trade**
4. **Place order** - MetaMask will popup
5. **Sign transaction** in MetaMask
6. **Verify** on Hyperliquid

### Environment Variables

```bash
# Use testnet for development
VITE_HYPERLIQUID_TESTNET=true

# Production
VITE_HYPERLIQUID_TESTNET=false
```

## Security Considerations

### ✅ What's Secure:
- Private keys never leave MetaMask
- All transactions require explicit user approval
- EIP-712 signatures show structured data
- Session cookies for auth, not trading

### ⚠️ Important Notes:
- **Always review transactions** in MetaMask before signing
- **Check slippage** settings before market orders
- **Verify coin symbol** is correct
- **Use testnet first** before mainnet trading

## Comparison

| Feature | Server-Side (Old) | Client-Side (New) |
|---------|-------------------|-------------------|
| **Private Keys** | Server controls | User controls |
| **Signatures** | Automatic | MetaMask popup |
| **Positions** | Server's | User's actual |
| **Security** | Custodial | Non-custodial |
| **Trust Model** | Trust server | Trustless |
| **Capital** | Server's funds | User's funds |

## Troubleshooting

### MetaMask not popping up?
- Check if MetaMask is installed
- Refresh the page
- Check browser console for errors

### Transaction failing?
- Verify you have enough margin
- Check coin symbol is correct
- Try lower size
- Check Hyperliquid API status

### Wallet address mismatch?
- Disconnect wallet
- Reconnect with correct wallet
- Clear cookies and try again

## Next Steps

1. ✅ Connect MetaMask on homepage
2. ✅ Verify wallet shows YOUR positions
3. ✅ Place a small test order
4. ✅ Check order appears in Open Orders
5. ✅ Try canceling order
6. ✅ Test closing position

## Technical Details

### File Changes

**New Files:**
- `client/src/lib/hyperliquid.ts` - Client-side SDK
- `client/src/hooks/useHyperliquid.ts` - React hook

**Modified Files:**
- `client/src/components/enhanced/EnhancedOrderForm.tsx`
- `client/src/components/enhanced/PositionsTable.tsx`
- `client/src/components/enhanced/OpenOrdersTable.tsx`
- `server/routers.ts` (account endpoints now use ctx.user.id)

### Dependencies Added

```json
{
  "ethers": "^6.15.0"
}
```

### API Reference

See `client/src/lib/hyperliquid.ts` for full API documentation.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify MetaMask is unlocked
3. Try on testnet first
4. Check Hyperliquid API docs

---

**You're now trading with YOUR wallet! 🚀**
