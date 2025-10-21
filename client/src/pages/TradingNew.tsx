import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import HyperliquidChart from "@/components/HyperliquidChart";
import { useWallet } from "@/hooks/useWallet";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { useHyperliquidAccount, useHyperliquidMeta, useHyperliquidMids } from "@/hooks/useHyperliquidAccount";
import { useAllMids } from "@/hooks/useWebSocket";
import { OrderBook } from "@/components/OrderBook";
import LiveTrades from "@/components/LiveTrades";
import { TPSLOrderEntry } from "@/components/trading/TPSLOrderEntry";
import { PositionSizer } from "@/components/trading/PositionSizer";
import { BalancesTab } from "@/components/trading/BalancesTab";
import { OpenOrdersTab } from "@/components/trading/OpenOrdersTab";
import { OrderHistoryTab } from "@/components/trading/OrderHistoryTab";
import { FundingHistoryTab } from "@/components/trading/FundingHistoryTab";
import { TWAPTab } from "@/components/trading/TWAPTab";
import { AIRecommendations } from "@/components/trading/AIRecommendations";
import { Activity, TrendingUp, TrendingDown, DollarSign, Brain } from "lucide-react";

export default function TradingNew() {
  const { user, isAuthenticated, loading } = useAuth();
  const wallet = useWallet();
  const hyperliquid = useHyperliquid();

  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [leverage, setLeverage] = useState(10);
  const [bottomTab, setBottomTab] = useState("balances");
  const [orderSize, setOrderSize] = useState(0);

  // Fetch market data
  const { meta } = useHyperliquidMeta();
  const { mids: staticMids } = useHyperliquidMids({ refetchInterval: 5000 });
  const { mids: wsMids, isConnected: wsConnected } = useAllMids();

  // Use WebSocket mids if available, fallback to static
  const mids = wsConnected && wsMids ? wsMids : staticMids;

  // Fetch account data
  const {
    userState,
    openOrders,
    isLoading: isLoadingAccount,
    refetch: refetchAccount,
  } = useHyperliquidAccount({ refetchInterval: 5000 });

  const { data: userFills } = trpc.account.getUserFills.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Client-side trading
  const handlePlaceOrder = async (params: any) => {
    try {
      if (params.orderType === "market") {
        await hyperliquid.placeMarketOrder({
          coin: params.coin,
          isBuy: params.isBuy,
          size: params.size,
          slippage: 0.5,
        });
      } else {
        await hyperliquid.placeOrder({
          coin: params.coin,
          isBuy: params.isBuy,
          size: params.size,
          limitPrice: params.limitPrice,
          reduceOnly: params.reduceOnly,
        });
      }

      // TODO: Implement TP/SL orders when backend supports them
      if (params.takeProfit || params.stopLoss) {
        toast.info("TP/SL orders will be placed after entry fills");
      }

      refetchAccount();
    } catch (error: any) {
      console.error("Order placement failed:", error);
    }
  };

  const handleCancelOrder = async (coin: string, oid: number) => {
    try {
      await hyperliquid.cancelOrder({ coin, oid });
      refetchAccount();
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const currentPrice = mids?.[selectedCoin] || "0";
  const coins = meta?.universe?.map((asset: any) => asset.name) || [];
  const accountValue = parseFloat(
    userState?.marginSummary?.accountValue ||
    userState?.crossMarginSummary?.accountValue ||
    "0"
  );
  const positions = userState?.assetPositions || [];

  // Calculate metrics
  const totalMarginUsed = userState?.marginSummary?.totalMarginUsed || "0";
  const totalUnrealizedPnl = positions.reduce((sum: number, pos: any) => {
    return sum + parseFloat(pos.position?.unrealizedPnl || "0");
  }, 0);
  const accountLeverage = accountValue > 0 ? parseFloat(totalMarginUsed) / accountValue : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">
            Please login to access the trading platform
          </p>
          <Button asChild className="w-full">
            <a href={getLoginUrl()}>Login</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border bg-card h-14 flex items-center px-4">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="text-xl font-bold text-primary">
            HyperTrade
          </Link>

          {/* Coin Selector */}
          <Select value={selectedCoin} onValueChange={setSelectedCoin}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {coins.length === 0 ? (
                <SelectItem value="BTC" disabled>Loading...</SelectItem>
              ) : (
                coins.map((coin: string) => (
                  <SelectItem key={coin} value={coin}>
                    {coin}/USDC
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {/* Price Display */}
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold font-mono">
              ${parseFloat(currentPrice).toFixed(2)}
            </div>
            {wsConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <div className="text-muted-foreground text-xs">Balance</div>
            <div className="font-mono font-bold">${accountValue.toFixed(2)}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground text-xs">PNL</div>
            <div className={`font-mono font-bold ${totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </div>
          </div>

          {wallet.isMetaMaskInstalled && (
            <div>
              {wallet.isConnected ? (
                <Button size="sm" variant="outline" onClick={wallet.disconnect}>
                  {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={wallet.connect} disabled={wallet.isConnecting}>
                  {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground">{user?.email}</div>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Order Book */}
        <div className="w-80 border-r border-border">
          <OrderBook coin={selectedCoin} className="h-full" />
        </div>

        {/* Center: Chart + Bottom Tabs */}
        <div className="flex-1 flex flex-col">
          {/* Chart */}
          <div className="h-[calc(60vh-3.5rem)] border-b border-border">
            <HyperliquidChart symbol={selectedCoin} interval="15" />
          </div>

          {/* Bottom Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={bottomTab} onValueChange={setBottomTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-10">
                <TabsTrigger value="balances" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Balances
                </TabsTrigger>
                <TabsTrigger value="open-orders" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Activity className="h-4 w-4 mr-2" />
                  Open Orders
                </TabsTrigger>
                <TabsTrigger value="order-history" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Order History
                </TabsTrigger>
                <TabsTrigger value="funding" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Funding
                </TabsTrigger>
                <TabsTrigger value="twap" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  TWAP
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <Brain className="h-4 w-4 mr-2" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="balances" className="m-0 h-full">
                  <BalancesTab userState={userState} mids={mids} />
                </TabsContent>

                <TabsContent value="open-orders" className="m-0 h-full">
                  <OpenOrdersTab
                    openOrders={openOrders}
                    onCancelOrder={handleCancelOrder}
                    isLoading={hyperliquid.status.isLoading}
                  />
                </TabsContent>

                <TabsContent value="order-history" className="m-0 h-full">
                  <OrderHistoryTab userFills={userFills as any[]} />
                </TabsContent>

                <TabsContent value="funding" className="m-0 h-full">
                  <FundingHistoryTab userState={userState} />
                </TabsContent>

                <TabsContent value="twap" className="m-0 h-full">
                  <TWAPTab selectedCoin={selectedCoin} />
                </TabsContent>

                <TabsContent value="ai-assistant" className="m-0 h-full p-4">
                  <AIRecommendations
                    userState={userState}
                    mids={mids}
                    selectedCoin={selectedCoin}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right: Order Entry + Live Trades */}
        <div className="w-96 border-l border-border flex flex-col">
          {/* Order Entry */}
          <div className="p-4 border-b border-border overflow-y-auto max-h-[60vh]">
            <h3 className="text-sm font-semibold mb-4">Place Order</h3>

            {/* Position Sizer */}
            <div className="mb-4">
              <PositionSizer
                accountValue={accountValue}
                currentPrice={parseFloat(currentPrice)}
                leverage={leverage}
                onSizeChange={setOrderSize}
              />
            </div>

            {/* TP/SL Order Entry */}
            <TPSLOrderEntry
              selectedCoin={selectedCoin}
              currentPrice={currentPrice}
              onPlaceOrder={handlePlaceOrder}
              isLoading={hyperliquid.status.isLoading}
            />
          </div>

          {/* Live Trades */}
          <div className="flex-1 overflow-hidden">
            <LiveTrades symbol={selectedCoin} className="h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
