import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/WalletConnect";
import { MarketTicker } from "@/components/MarketTicker";
import { LiveMarketStats } from "@/components/LiveMarketStats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  TrendingUp,
  Lock,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-gray-800 border-t-cyan-500 animate-spin opacity-20"
                 style={{ animationDuration: '1.5s' }} />
          </div>
          <div className="text-gray-400 font-medium">Initializing HyperTrade...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '1s', animationDuration: '3s' }} />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
             style={{ animationDelay: '2s', animationDuration: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-gray-800/50 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  HyperTrade
                </div>
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  Professional Trading
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <a href="/trade">Demo Mode</a>
              </Button>
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20">
                    <span className="text-xs text-green-400 font-mono">
                      {user?.id?.slice(0, 6)}...{user?.id?.slice(-4)}
                    </span>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                    <a href="/trade">
                      Launch App
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                      Connect Wallet
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Connect Wallet</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Connect your Web3 wallet to access professional trading
                      </DialogDescription>
                    </DialogHeader>
                    <WalletConnect />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker />

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs text-cyan-400 font-medium">LIVE MARKET DATA</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                Bloomberg Meets
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hyperliquid DeFi
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional-grade trading terminal for Hyperliquid DEX.
              <br />
              Real-time market data • Advanced order types • Institutional-level execution
            </p>

            <div className="flex gap-4 justify-center mb-16">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20">
                    Start Trading
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Connect Wallet</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Connect your Web3 wallet to access professional trading
                    </DialogDescription>
                  </DialogHeader>
                  <WalletConnect />
                </DialogContent>
              </Dialog>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 border-gray-700 hover:bg-gray-800">
                <a href="/trade">
                  View Demo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>

            {/* Live Market Stats */}
            <LiveMarketStats />
          </div>

          {/* Features Grid */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-24">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Sub-millisecond order execution with WebSocket streaming",
                gradient: "from-yellow-500/10 to-orange-500/10",
                border: "border-yellow-500/20",
                iconColor: "text-yellow-400",
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "Non-custodial architecture with read-only API permissions",
                gradient: "from-green-500/10 to-emerald-500/10",
                border: "border-green-500/20",
                iconColor: "text-green-400",
              },
              {
                icon: BarChart3,
                title: "Pro Analytics",
                description: "Real-time charting, order book depth, and position tracking",
                gradient: "from-cyan-500/10 to-blue-500/10",
                border: "border-cyan-500/20",
                iconColor: "text-cyan-400",
              },
              {
                icon: TrendingUp,
                title: "Advanced Orders",
                description: "Market, limit, and conditional orders with smart routing",
                gradient: "from-purple-500/10 to-pink-500/10",
                border: "border-purple-500/20",
                iconColor: "text-purple-400",
              },
              {
                icon: Lock,
                title: "Web3 Native",
                description: "MetaMask authentication with zero KYC requirements",
                gradient: "from-blue-500/10 to-indigo-500/10",
                border: "border-blue-500/20",
                iconColor: "text-blue-400",
              },
              {
                icon: Layers,
                title: "Multi-Asset",
                description: "Trade 100+ perpetual contracts with up to 50x leverage",
                gradient: "from-red-500/10 to-orange-500/10",
                border: "border-red-500/20",
                iconColor: "text-red-400",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-xl border ${feature.border} bg-gradient-to-br ${feature.gradient} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-${feature.iconColor}/10`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <Icon className={`h-10 w-10 ${feature.iconColor} mb-4`} />
                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-black p-12">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Trade Like a Pro?
                </h2>
                <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                  Join thousands of traders using HyperTrade for institutional-grade execution on Hyperliquid DEX
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/20">
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Connect Wallet</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Connect your Web3 wallet to access professional trading
                      </DialogDescription>
                    </DialogHeader>
                    <WalletConnect />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 py-8 mt-16 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <div className="text-sm text-gray-500">
            <p className="mb-2">Professional Trading Terminal • Powered by Hyperliquid DEX</p>
            <p className="text-xs text-gray-600">
              Non-custodial • Permissionless • Built with React & TypeScript
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

