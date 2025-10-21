# HyperTrade Platform - New Features Documentation

This document outlines all the new features implemented in the HyperTrade platform upgrade.

## 🚀 Overview

We've completely redesigned the trading experience with a professional Bloomberg-style interface, advanced trading features, AI-powered recommendations, and automated risk management alerts.

---

## 📋 Table of Contents

1. [New Trading Page (TradingNew.tsx)](#new-trading-page)
2. [Take Profit / Stop Loss Orders](#tp-sl-orders)
3. [Position Sizing Tools](#position-sizing)
4. [Tab-Based Information Panels](#information-tabs)
5. [Live WebSocket Feeds](#live-websockets)
6. [AI Trade Recommendations](#ai-recommendations)
7. [Liquidation Alert System](#liquidation-alerts)
8. [TradingView Integration](#tradingview)
9. [Environment Variables](#environment-variables)
10. [Setup Instructions](#setup)

---

## 1. New Trading Page {#new-trading-page}

**Location:** `client/src/pages/TradingNew.tsx`

### Features:
- **Bloomberg-style 3-column layout**
  - Left: Real-time Order Book with depth visualization
  - Center: TradingView chart + Bottom tabs
  - Right: Order entry + Live trades feed

- **Top Bar:**
  - Coin selector with all Hyperliquid assets
  - Live price display with WebSocket indicator
  - Account balance and unrealized PNL
  - Wallet connection status

### Usage:
To use the new trading page, update your routing to point to `/trade-new` or replace the existing Trading component.

---

## 2. Take Profit / Stop Loss Orders {#tp-sl-orders}

**Location:** `client/src/components/trading/TPSLOrderEntry.tsx`

### Features:
- **Percentage-based TP/SL calculation**
  - Set take profit as % gain (e.g., 5%)
  - Set stop loss as % loss (e.g., 3%)
  - Auto-calculates price levels

- **Manual price entry**
  - Specify exact TP/SL prices
  - Real-time P&L estimates

- **Risk/Reward Display**
  - Shows potential profit/loss
  - Calculates risk/reward ratio
  - Visual risk summary

### Example:
```typescript
// TP/SL Order with 5% take profit and 3% stop loss
{
  coin: "BTC",
  isBuy: true,
  size: 0.1,
  limitPrice: 50000,
  takeProfit: 52500,  // +5%
  stopLoss: 48500     // -3%
}
```

---

## 3. Position Sizing Tools {#position-sizing}

**Location:** `client/src/components/trading/PositionSizer.tsx`

### Features:
- **Percentage-based sizing**
  - Quick buttons: 10%, 25%, 50%, 75%, 100%
  - Smooth slider for custom percentages
  - Accounts for leverage automatically

- **Custom size mode**
  - Direct size entry
  - Toggle between % and custom

- **Visual buying power indicator**
  - Color-coded usage bar (green → yellow → red)
  - Warnings at 80%+ utilization
  - Real-time margin calculations

### Metrics Displayed:
- Position size in base asset
- Notional value in USD
- Margin required
- Available buying power

---

## 4. Tab-Based Information Panels {#information-tabs}

### Balances Tab
**Location:** `client/src/components/trading/BalancesTab.tsx`

- **Account Overview Cards:**
  - Total Balance
  - Available/Withdrawable
  - Unrealized PNL
  - Margin Used with leverage

- **Position Breakdown Table:**
  - All open positions
  - Size, notional value, PNL
  - Margin usage per position
  - Leverage display

### Open Orders Tab
**Location:** `client/src/components/trading/OpenOrdersTab.tsx`

- Order list with fill progress bars
- Quick cancel functionality
- Timestamp and order details
- Color-coded buy/sell

### Order History Tab
**Location:** `client/src/components/trading/OrderHistoryTab.tsx`

- Last 50 executed orders
- Price, size, fees
- Total order value
- Open/Close indication

### Funding History Tab
**Location:** `client/src/components/trading/FundingHistoryTab.tsx`

- **Summary Card:**
  - Total funding paid/received
  - Color-coded profit/loss

- **Position-wise Breakdown:**
  - Funding per position
  - Since open vs all-time
  - Status indicators

- **Educational Info:**
  - Explains funding rates
  - When payments occur

### TWAP Tab
**Location:** `client/src/components/trading/TWAPTab.tsx`

- **TWAP Order Configuration:**
  - Total size to execute
  - Duration in minutes/hours
  - Number of sub-orders
  - Optional price limit

- **Order Summary:**
  - Per-order size
  - Execution interval
  - Total execution time

**Note:** TWAP execution requires backend implementation. UI is ready.

---

## 5. Live WebSocket Feeds {#live-websockets}

### Live Trades
**Location:** `client/src/components/LiveTrades.tsx`

- **Real-time trade feed**
  - Color-coded buy/sell
  - Price, size, timestamp
  - Connection status indicator
  - Auto-scroll with last 100 trades

### Enhanced Order Book
**Location:** `client/src/components/OrderBook.tsx`

- **Professional Features:**
  - Depth visualization bars
  - Precision selector (0.01, 0.1, 1, 10)
  - Best bid/ask highlighting
  - Live spread calculation
  - Cumulative size totals
  - Hover effects

- **WebSocket Integration:**
  - Real-time updates
  - Live connection indicator
  - Auto-reconnect

---

## 6. AI Trade Recommendations {#ai-recommendations}

**Location:**
- Backend: `server/ai_router.ts`
- Frontend: `client/src/components/trading/AIRecommendations.tsx`

### Features:
- **Powered by Anthropic Claude (Sonnet 4.5)**
- **Comprehensive Analysis:**
  - Risk assessment for each position
  - Liquidation risk evaluation
  - Position sizing recommendations
  - Leverage analysis
  - Portfolio diversification
  - Take-profit/stop-loss suggestions

- **Real-time Context:**
  - Current positions
  - Account value and leverage
  - Market prices
  - Distance to liquidation

### Backend Implementation:
```typescript
// Get AI recommendations
const result = await trpc.ai.getTradingRecommendations.useQuery({
  userState,
  mids,
  selectedCoin,
});
```

### Analysis Output:
- 🔴 Critical Risks
- ⚠️ Warnings & Concerns
- 💡 Optimization Suggestions
- ✅ Recommended Actions

---

## 7. Liquidation Alert System {#liquidation-alerts}

**Locations:**
- Email Service: `server/email_service.ts`
- Monitor Service: `server/liquidation_monitor.ts`
- Server Init: `server/_core/index.ts`

### Features:

#### Background Monitoring
- **Checks every 2 minutes**
- **Alert thresholds:**
  - Warning: 25% from liquidation
  - Critical: 10% from liquidation

#### Email Alerts
- **Professional HTML emails**
  - Position details
  - Current vs liquidation price
  - Visual distance indicators
  - Recommended actions
  - Direct link to trading platform

#### Rate Limiting
- **15-minute cooldown** between alerts per user
- Prevents alert spam
- Maintains urgency

### Email Configuration:

#### Gmail Setup:
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use App Password, not account password
EMAIL_FROM=HyperTrade Alerts <alerts@hypertrade.com>
ENABLE_LIQUIDATION_ALERTS=true
```

#### Custom SMTP:
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=HyperTrade Alerts <alerts@hypertrade.com>
ENABLE_LIQUIDATION_ALERTS=true
```

### Alert Email Contains:
1. **Position Summary:**
   - Asset, size, current price
   - Liquidation price
   - Distance percentage
   - Visual progress bar

2. **Recommended Actions:**
   - Add margin
   - Reduce position
   - Close position
   - Lower leverage

3. **Direct Action Link:**
   - One-click to trading platform

---

## 8. TradingView Integration {#tradingview}

**Location:** `client/src/components/HyperliquidChart.tsx`

### Features:
- **Custom Hyperliquid Datafeed**
  - Real candle data from Hyperliquid
  - No reliance on Binance
  - Direct market data

- **Chart Configuration:**
  - Dark theme optimized
  - Green/red candles
  - Multiple timeframes
  - Volume overlay

**Note:** Requires TradingView Charting Library to be set up. The free widget version has limitations.

---

## 9. Environment Variables {#environment-variables}

Add these to your `.env` file:

### Required for AI Recommendations:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### Required for Email Alerts:
```bash
# Option 1: Gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=HyperTrade <alerts@hypertrade.com>

# Option 2: Custom SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASSWORD=your-password
EMAIL_FROM=HyperTrade <alerts@hypertrade.com>

# Enable alerts
ENABLE_LIQUIDATION_ALERTS=true
```

### Optional:
```bash
# App URL for email links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 10. Setup Instructions {#setup}

### 1. Install Dependencies
```bash
pnpm install
```

All required packages are now installed:
- `@anthropic-ai/sdk` - AI recommendations
- `nodemailer` - Email service
- `react-markdown` - AI response rendering
- `@types/nodemailer` - TypeScript types

### 2. Configure Environment Variables
Create/update `.env`:
```bash
# Copy example and fill in your values
cp .env.example .env

# Add new variables
ANTHROPIC_API_KEY=sk-ant-...
ENABLE_LIQUIDATION_ALERTS=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 3. Update Routing (Optional)
If you want to use the new trading page as default:

`client/src/main.tsx` or your router:
```typescript
import TradingNew from "@/pages/TradingNew";

// Replace old route
<Route path="/trade" component={TradingNew} />
```

### 4. Start the Server
```bash
pnpm dev
```

The server will:
- ✅ Start Express + Vite
- ✅ Connect to Hyperliquid WebSocket
- ✅ Start liquidation monitor (if enabled)
- ✅ Initialize AI endpoints

### 5. Test Features

#### Test AI Recommendations:
1. Go to trading page
2. Have some open positions
3. Click "Get Analysis" in AI panel
4. Review recommendations

#### Test Liquidation Alerts:
1. Ensure `ENABLE_LIQUIDATION_ALERTS=true`
2. Open a highly leveraged position
3. Monitor emails (checks every 2 minutes)
4. You'll receive alert when within 25% of liquidation

#### Test TP/SL Orders:
1. Use the new order entry panel
2. Enable Take Profit switch
3. Set % gain or exact price
4. Same for Stop Loss
5. View risk/reward summary before placing

---

## 📊 Component Architecture

```
TradingNew.tsx (Main Page)
├── Header
│   ├── Coin Selector
│   ├── Price Display
│   └── Account Info
├── Left Panel: OrderBook
├── Center Panel
│   ├── HyperliquidChart (TradingView)
│   └── Bottom Tabs
│       ├── BalancesTab
│       ├── OpenOrdersTab
│       ├── OrderHistoryTab
│       ├── FundingHistoryTab
│       └── TWAPTab
└── Right Panel
    ├── PositionSizer
    ├── TPSLOrderEntry
    └── LiveTrades

Background Services
├── liquidation_monitor.ts (Checks positions every 2 min)
└── email_service.ts (Sends alerts)

API Endpoints
├── ai_router.ts (Anthropic integration)
└── Existing trading endpoints (orders, positions, etc.)
```

---

## 🔧 Troubleshooting

### AI Recommendations Not Working:
- ✅ Check `ANTHROPIC_API_KEY` is set
- ✅ Verify API key has credits
- ✅ Check server console for errors

### Email Alerts Not Sending:
- ✅ Verify `ENABLE_LIQUIDATION_ALERTS=true`
- ✅ Check email credentials are correct
- ✅ For Gmail, use App Password not account password
- ✅ Check server console logs for email errors

### WebSocket Not Connecting:
- ✅ Check Hyperliquid API status
- ✅ Verify server started successfully
- ✅ Look for WebSocket errors in browser console

### Position Data Not Loading:
- ✅ Ensure wallet is connected
- ✅ Check user is authenticated
- ✅ Verify Hyperliquid account has positions

---

## 📝 Notes

1. **TWAP Feature:** UI is complete but requires backend implementation for order execution scheduling.

2. **TradingView:** Full integration requires the TradingView Charting Library (paid product). Current implementation uses widget mode.

3. **Email Alerts:** Use Gmail App Passwords, not your regular password. Enable 2FA and generate an app-specific password.

4. **AI Rate Limits:** Be mindful of Anthropic API rate limits and costs when requesting frequent analyses.

5. **Production Deployment:** Remember to set `NODE_ENV=production` and configure all environment variables on your hosting platform (Vercel, Railway, etc.).

---

## 🎯 Next Steps

To further enhance the platform:

1. **Implement TWAP Execution:**
   - Backend scheduler for sub-orders
   - Order tracking and status updates
   - Cancellation logic

2. **Add More AI Features:**
   - Market sentiment analysis
   - Trading pattern recognition
   - Performance analytics

3. **Enhanced Alerts:**
   - SMS notifications
   - Discord/Telegram webhooks
   - Push notifications

4. **Advanced Analytics:**
   - Profit/loss charts
   - Trading statistics
   - Performance metrics

5. **Social Features:**
   - Copy trading
   - Leaderboards
   - Trade sharing

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review the CLAUDE.md file for architecture details
3. Check server console logs
4. Review browser console for client-side errors

---

**Built with ❤️ using Claude Code**
