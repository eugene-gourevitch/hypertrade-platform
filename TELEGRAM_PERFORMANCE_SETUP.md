# Performance Dashboard & Telegram Alerts - Setup Guide

## 🎉 New Features Added!

### 1. **Performance Dashboard** 📊
- Total P&L with charts
- Win rate & profit factor
- Sharpe ratio & max drawdown
- Performance by coin
- Daily/Weekly/Monthly P&L graphs

### 2. **Telegram Alerts** 💬
- Real-time liquidation warnings
- Order fill notifications
- Price alerts
- P&L milestones
- Direct to your phone via Telegram!

---

## 🤖 Setting Up Telegram Bot

### Step 1: Create Your Telegram Bot

1. **Open Telegram** and search for `@BotFather`

2. **Start a chat** with BotFather and send:
   ```
   /newbot
   ```

3. **Choose a name** for your bot (e.g., "HyperTrade Alerts")

4. **Choose a username** (must end in "bot", e.g., "HyperTradeAlertsBot")

5. **BotFather will send you a TOKEN** - it looks like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567
   ```

6. **SAVE THIS TOKEN** - you'll need it for deployment!

### Step 2: Start Your Bot

1. Click the link BotFather gave you to open your bot

2. Send `/start` to your bot

3. Your bot will reply with your **Chat ID** (a number like `987654321`)

4. **Save your Chat ID** - you'll enter it in the settings page!

---

## 🗄️ Update Database Schema

Run this command to add Telegram settings to your database:

```bash
pnpm db:push
```

This adds the following fields to `userSettings`:
- `telegramChatId`
- `telegramAlertsEnabled`
- `telegramLiquidationAlerts`
- `telegramFillAlerts`
- `telegramPriceAlerts`
- `telegramPnLAlerts`

---

## 🚀 Deploy to Google Cloud Run

### Set Environment Variable

Add your Telegram bot token to the deployment:

```bash
gcloud run services update hypertrade --region us-central1 \
  --set-env-vars "TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567"
```

**Replace** `123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567` with YOUR actual bot token!

### Full Deployment Command

```bash
# 1. Build
gcloud builds submit --tag gcr.io/hypertrade-platform-14738/hypertrade

# 2. Deploy
gcloud run deploy hypertrade \
  --image gcr.io/hypertrade-platform-14738/hypertrade \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600

# 3. Set Telegram token
gcloud run services update hypertrade --region us-central1 \
  --set-env-vars "TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE"
```

---

## 📱 Using the Features

### Performance Dashboard

1. Connect your wallet
2. Go to the **"Performance"** tab
3. See your trading stats:
   - Total P&L
   - Win rate
   - Profit factor
   - Sharpe ratio
   - Charts and analytics

### Telegram Alerts

1. Go to the **"Telegram"** tab
2. Follow the 3-step setup:
   - Open your bot in Telegram
   - Get your Chat ID
   - Enter it in the settings
3. Enable alert types you want:
   - 🚨 Liquidation warnings
   - ✅ Order fills
   - 📊 Price alerts
   - 💰 P&L milestones
4. Save settings

### Example Telegram Alerts

**Liquidation Warning:**
```
🚨🚨🚨 LIQUIDATION CRITICAL 🚨🚨🚨

Coin: BTC
Position Size: 0.5
Current Price: $96,500
Liquidation Price: $95,000
Distance: 8.5%

❗ IMMEDIATE ACTION REQUIRED

Time: 2025-10-22 03:00:00
```

**Order Filled:**
```
✅ ORDER FILLED

🟢 BOUGHT BTC
Size: 0.1
Price: $97,000
Total: $9,700

Time: 2025-10-22 03:00:00
```

---

## 🧪 Testing

### Test Performance Dashboard

1. Make sure you have some trades in your database
2. Navigate to Performance tab
3. You should see:
   - Total P&L card
   - Win rate
   - Charts
   - Performance by coin

### Test Telegram Alerts

1. Go to Telegram tab
2. Enter your Chat ID
3. Enable alerts
4. Save settings
5. Wait for liquidation monitor to run (every 5 minutes)
6. Or manually trigger an alert from server

---

## 🔧 Environment Variables Reference

Your `.env` file should now have:

```bash
# Database
DATABASE_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Hyperliquid
HYPERLIQUID_ACCOUNT_ADDRESS=0x...
HYPERLIQUID_API_SECRET=...
HYPERLIQUID_TESTNET=false

# Telegram (NEW!)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567

# Email (optional)
ENABLE_LIQUIDATION_ALERTS=true
EMAIL_SERVICE=gmail
EMAIL_USER=...
EMAIL_PASSWORD=...
```

---

## 📊 Performance Metrics Explained

### Win Rate
Percentage of profitable trades
- **>60%** = Excellent
- **50-60%** = Good
- **<50%** = Needs improvement

### Profit Factor
Total profit ÷ Total loss
- **>2.0** = Excellent
- **1.5-2.0** = Good
- **1.0-1.5** = Fair
- **<1.0** = Losing money

### Sharpe Ratio
Risk-adjusted return (annualized)
- **>2.0** = Excellent
- **1.0-2.0** = Good
- **0-1.0** = Fair
- **<0** = Losing after risk adjustment

### Max Drawdown
Largest peak-to-trough decline
- **<10%** = Excellent risk management
- **10-20%** = Good
- **20-30%** = Moderate risk
- **>30%** = High risk

---

## 🐛 Troubleshooting

### Telegram Alerts Not Working

1. **Check bot token**: Make sure `TELEGRAM_BOT_TOKEN` is set correctly
2. **Check Chat ID**: Make sure it's a number, not username
3. **Enable alerts**: Make sure alerts are enabled in settings
4. **Check logs**: Look at Cloud Run logs for errors
   ```bash
   gcloud run logs tail hypertrade --region us-central1
   ```

### Performance Dashboard Empty

1. **Check database**: Make sure you have trades with P&L data
2. **Check authentication**: Make sure you're logged in
3. **Check API**: Open browser console and check for errors

### Database Migration Issues

```bash
# If db:push fails, try:
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

## 🎯 Next Steps

1. **Create your Telegram bot** (5 minutes)
2. **Get your bot token** (from BotFather)
3. **Update database schema** (`pnpm db:push`)
4. **Rebuild and deploy** (see deployment commands above)
5. **Configure Telegram alerts** in the app
6. **Start trading** and watch alerts come in!

---

## 📝 Your Telegram Handle

You mentioned your handle is: **@gnossos**

Once your bot is set up, you can:
1. Search for your bot in Telegram
2. Send `/start`
3. Get your Chat ID
4. Enter it in the Telegram tab

---

## 🔥 What's Possible Now

### Real-Time Alerts on Your Phone
- Trading from your laptop? Get fill confirmations on your phone
- Sleeping? Wake up to liquidation warnings
- Out and about? Know when price hits your target

### Track Your Performance
- See if you're actually profitable
- Identify which coins you trade best
- Find your optimal trade size
- Measure risk-adjusted returns

### Never Miss a Trade
- Instant notifications when orders fill
- Know exactly when to add collateral
- Celebrate profitable days
- Learn from losing streaks

---

## 💡 Pro Tips

1. **Enable liquidation alerts first** - most important!
2. **Set a P&L milestone** - get notified at +$100, +$500, etc.
3. **Review performance weekly** - use charts to improve
4. **Test with small size first** - make sure alerts work
5. **Keep Telegram notifications on** - critical for liquidations

---

## 🚀 Ready?

Your platform now has:
- ✅ Real-time WebSocket data feed
- ✅ Order Book & Live Trades
- ✅ TradingView charts
- ✅ AI recommendations (Claude 4.5)
- ✅ Performance dashboard
- ✅ Telegram alerts

**You're running a PROFESSIONAL trading platform!** 🎉

Questions? Check the logs or ping me! 💪
