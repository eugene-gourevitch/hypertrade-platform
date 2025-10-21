# HyperTrade - Professional Hyperliquid Trading Platform

A Bloomberg-style professional trading interface for Hyperliquid DEX, built with React, TypeScript, and real-time data streaming.

![HyperTrade Platform](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Features

### Core Trading Features
- **Real-Time Market Data** - Live price updates, order book, and position tracking
- **Advanced Charting** - TradingView integration with multiple timeframes and indicators
- **Order Execution** - Place limit and market orders directly from the interface
- **Position Management** - Close positions with one click, view real-time PNL
- **Risk Management** - Liquidation warnings, margin ratio monitoring, and account metrics
- **Order Management** - Cancel individual or all orders for a coin

### Professional UI/UX
- **Bloomberg-Style Interface** - Dark theme with professional layout
- **Real-Time Updates** - All data refreshes automatically every second
- **Responsive Design** - Works on desktop and tablet devices
- **Toast Notifications** - Instant feedback for all trading actions
- **Error Handling** - Comprehensive error messages and recovery

### Technical Features
- **Persistent Python Daemon** - Maintains connection to Hyperliquid API
- **tRPC API** - Type-safe API layer between frontend and backend
- **WebSocket Ready** - Infrastructure prepared for WebSocket integration
- **Cross Margin Support** - Full support for cross and isolated margin modes
- **Multi-Asset Trading** - Trade any perpetual contract available on Hyperliquid

## 📸 Screenshots

### Trading Interface
- Professional chart with TradingView
- Real-time positions table with PNL
- Live order book with bid/ask spread
- Order placement form with validation

### Account Overview
- Account equity breakdown (Spot + Perps)
- Unrealized PNL tracking
- Cross margin ratio monitoring
- Maintenance margin display
- Withdrawable balance calculation

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **TradingView Widget** - Advanced charting
- **tRPC Client** - Type-safe API calls
- **Sonner** - Toast notifications

### Backend
- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **tRPC** - API framework
- **Python 3.11** - Hyperliquid SDK integration
- **hyperliquid-python-sdk** - Official Hyperliquid API client

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- Hyperliquid account with API credentials
- Git

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/hypertrade.git
cd hypertrade
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Install Python dependencies
pip3 install hyperliquid-python-sdk
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Hyperliquid API Configuration
HYPERLIQUID_ACCOUNT_ADDRESS=0xYourAccountAddress
HYPERLIQUID_API_SECRET=YourPrivateKeyHere
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz

# Server Configuration
PORT=3000
NODE_ENV=development

# OAuth (if using authentication)
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
```

⚠️ **Security Warning**: Never commit your `.env` file or share your private keys!

### 4. Start the Development Server

```bash
pnpm dev
```

The application will be available at:
- **Homepage**: http://localhost:3000
- **Trading Interface**: http://localhost:3000/trade

## 🚀 Deployment

### Production Build

```bash
# Build the frontend and backend
pnpm build

# Start the production server
pnpm start
```

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

```env
NODE_ENV=production
HYPERLIQUID_ACCOUNT_ADDRESS=your_address
HYPERLIQUID_API_SECRET=your_secret
HYPERLIQUID_API_URL=https://api.hyperliquid.xyz
PORT=3000
```

### Deployment Platforms

**Recommended Platforms:**
- **Railway** - Easy deployment with environment variables
- **Render** - Free tier available
- **DigitalOcean App Platform** - Scalable and reliable
- **AWS EC2** - Full control and customization
- **Vercel** - Frontend only (requires separate backend deployment)

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 📚 Usage Guide

### Connecting Your Account

1. Add your Hyperliquid account address and API secret to `.env`
2. Restart the server
3. Navigate to http://localhost:3000/trade
4. Your positions and account data will load automatically

### Placing Orders

1. Select Buy or Sell
2. Choose order type (Limit or Market)
3. Enter price (for limit orders) and size
4. Click "Buy BTC" or "Sell BTC"
5. Confirm the order in the dialog
6. Toast notification will confirm success

### Closing Positions

1. Find the position in the Positions table
2. Click the green "Close" button
3. Confirm the closure in the dialog
4. Position will be closed at market price

### Canceling Orders

1. View open orders in the "Open Orders" section
2. Click "Cancel" next to the order
3. Order will be removed immediately

### Monitoring Risk

- **Cross Margin Ratio** - Shows percentage of margin used
- **Liquidation Price** - Displayed for each position
- **Unrealized PNL** - Updates in real-time
- **Maintenance Margin** - Shows minimum margin required

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Use `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Enable 2FA** - On your Hyperliquid account
4. **Use read-only API keys** - If you only need to view data
5. **Monitor API usage** - Watch for unusual activity
6. **Keep dependencies updated** - Run `pnpm update` regularly
7. **Use HTTPS in production** - Never deploy over HTTP

## 🐛 Troubleshooting

### Daemon Not Starting

**Error**: `Hyperliquid Daemon] Not ready, starting...`

**Solution**:
```bash
# Kill any existing daemon processes
pkill -f hyperliquid_daemon.py

# Restart the dev server
pnpm dev
```

### API Connection Errors

**Error**: `Failed to fetch user state`

**Solution**:
1. Check your API credentials in `.env`
2. Verify your account address is correct
3. Ensure your API secret has the necessary permissions
4. Check Hyperliquid API status

### Chart Not Loading

**Error**: Chart shows blank or loading forever

**Solution**:
1. Check browser console for errors
2. Verify TradingView widget is not blocked by ad blocker
3. Clear browser cache and reload

### Python Dependencies

**Error**: `ModuleNotFoundError: No module named 'hyperliquid'`

**Solution**:
```bash
pip3 install hyperliquid-python-sdk
```

## 🗺️ Roadmap

### Planned Features
- [ ] WebSocket integration for live trades feed
- [ ] Take Profit / Stop Loss orders
- [ ] Multi-timeframe analysis
- [ ] Trade history and analytics
- [ ] PNL charts and performance metrics
- [ ] Position size calculator
- [ ] Risk/reward calculator
- [ ] Mobile responsive design improvements
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts for power users
- [ ] Order templates and presets
- [ ] Multi-account support
- [ ] Telegram notifications
- [ ] Advanced order types (OCO, trailing stop)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update README if adding new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Trading cryptocurrencies involves substantial risk of loss. The authors and contributors are not responsible for any financial losses incurred through the use of this software.

**Use at your own risk. Always test with small amounts first.**

## 🙏 Acknowledgments

- [Hyperliquid](https://hyperliquid.xyz) - For the excellent DEX and API
- [TradingView](https://www.tradingview.com) - For the charting widget
- [shadcn/ui](https://ui.shadcn.com) - For the beautiful UI components
- [tRPC](https://trpc.io) - For the type-safe API framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/hypertrade/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/hypertrade/discussions)
- **Hyperliquid Docs**: [https://hyperliquid.gitbook.io](https://hyperliquid.gitbook.io)

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Built with ❤️ for the Hyperliquid community**

