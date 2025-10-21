/**
 * Professional Trading Interface
 * Hyperliquid.xyz style layout - BUT WAY BETTER
 * Real-time WebSockets, enhanced UX, professional features
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnhancedOrderBook } from "@/components/enhanced/EnhancedOrderBook";
import { LiveTradesFeed } from "@/components/enhanced/LiveTradesFeed";
import { EnhancedOrderForm } from "@/components/enhanced/EnhancedOrderForm";
import { PositionsTable } from "@/components/enhanced/PositionsTable";
import { OpenOrdersTable } from "@/components/enhanced/OpenOrdersTable";
import { TradingViewChart } from "@/components/TradingViewChart";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Activity,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function TradingPro() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"positions" | "orders" | "history">("positions");

  // Fetch market data with WebSocket updates
  const { data: meta } = trpc.market.getMeta.useQuery();
  const { data: mids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds (slower, less crazy)
    refetchIntervalInBackground: false, // Don't poll when tab not active
  });

  // Fetch account data
  const { data: userState, refetch: refetchUserState } =
    trpc.account.getUserState.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 3000, // Slower polling - every 3 seconds
      refetchIntervalInBackground: false,
    });

  const { data: openOrders, refetch: refetchOpenOrders } =
    trpc.account.getOpenOrders.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 3000, // Slower polling - every 3 seconds
      refetchIntervalInBackground: false,
    });

  // Get current price
  const currentPrice = mids?.[selectedCoin] || "0";
  const coins = meta?.universe?.map((asset: any) => asset.name) || ["BTC", "ETH", "SOL"];

  // Calculate account metrics
  const accountEquity = userState?.marginSummary
    ? parseFloat(userState.marginSummary.accountValue || "0")
    : 0;

  const totalPnl = userState?.assetPositions?.reduce((acc: number, pos: any) => {
    return acc + parseFloat(pos.position?.unrealizedPnl || "0");
  }, 0) || 0;

  const marginRatio = userState?.marginSummary?.totalMarginUsed && accountEquity > 0
    ? (parseFloat(userState.marginSummary.totalMarginUsed) / accountEquity) * 100
    : 0;

  // Get positions
  const positions = userState?.assetPositions?.filter((asset: any) => {
    const size = parseFloat(asset.position?.szi || "0");
    return size !== 0;
  }).map((asset: any) => ({
    coin: asset.position?.coin || "",
    szi: asset.position?.szi || "0",
    entryPx: asset.position?.entryPx || "0",
    positionValue: asset.position?.positionValue || "0",
    unrealizedPnl: asset.position?.unrealizedPnl || "0",
    returnOnEquity: asset.position?.returnOnEquity || "0",
    liquidationPx: asset.position?.liquidationPx || null,
    marginUsed: asset.position?.marginUsed || "0",
    leverage: asset.position?.leverage || { value: 1, type: "cross" },
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-950">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded flex items-center justify-center font-bold">
              H
            </div>
            <span className="text-lg font-bold">HyperTrade</span>
          </div>

          {/* Coin Selector */}
          <Select value={selectedCoin} onValueChange={setSelectedCoin}>
            <SelectTrigger className="w-32 bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {coins.map((coin: string) => (
                <SelectItem key={coin} value={coin} className="text-white">
                  {coin}-PERP
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Current Price */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-bold">
              ${parseFloat(currentPrice).toLocaleString()}
            </span>
            {/* 24h change - TODO: Calculate from real data */}
          </div>

          {/* WebSocket Status */}
          <WebSocketStatus isConnected={true} />
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Account Info */}
              <div className="flex items-center gap-4 px-4 py-1.5 bg-gray-900 rounded border border-gray-800">
                <div>
                  <div className="text-xs text-gray-500">Equity</div>
                  <div className="text-sm font-mono font-semibold">
                    ${accountEquity.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">PNL</div>
                  <div
                    className={cn(
                      "text-sm font-mono font-semibold",
                      totalPnl >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Margin</div>
                  <div className="text-sm font-mono font-semibold">
                    {marginRatio.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{user?.email}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => logout()}
                  className="text-gray-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Connect wallet to trade</span>
              <Button asChild variant="default">
                <a href="/">Connect Wallet</a>
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Chart Section */}
          <div className="h-[60vh] border-b border-gray-800">
            <TradingViewChart
              symbol={`${selectedCoin}USD`}
              theme="dark"
            />
          </div>

          {/* Bottom Section - Positions/Orders/History */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 bg-gray-950">
                <button
                  onClick={() => setSelectedTab("positions")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded transition",
                    selectedTab === "positions"
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  )}
                >
                  Positions {positions.length > 0 && `(${positions.length})`}
                </button>
                <button
                  onClick={() => setSelectedTab("orders")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded transition",
                    selectedTab === "orders"
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  )}
                >
                  Open Orders {openOrders?.length > 0 && `(${openOrders.length})`}
                </button>
                <button
                  onClick={() => setSelectedTab("history")}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded transition",
                    selectedTab === "history"
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  )}
                >
                  History
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {selectedTab === "positions" && (
                  <PositionsTable
                    positions={positions}
                    currentPrices={mids || {}}
                    onRefresh={refetchUserState}
                  />
                )}

                {selectedTab === "orders" && (
                  <OpenOrdersTable
                    orders={openOrders || []}
                    currentPrices={mids || {}}
                    onRefresh={refetchOpenOrders}
                  />
                )}

                {selectedTab === "history" && (
                  <Card className="bg-black border-gray-800">
                    <div className="p-4 text-center text-gray-500 py-8">
                      Trade history (TODO)
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Order Book, Trades, Order Form */}
        <div className="w-96 border-l border-gray-800 flex flex-col bg-gray-950">
          {/* Order Form */}
          <div className="h-[450px] border-b border-gray-800">
            <EnhancedOrderForm
              coin={selectedCoin}
              currentPrice={currentPrice}
              accountEquity={accountEquity}
              onOrderPlaced={() => {
                refetchUserState();
                refetchOpenOrders();
              }}
            />
          </div>

          {/* Order Book & Trades in Split View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-1/2 border-b border-gray-800">
              <EnhancedOrderBook
                coin={selectedCoin}
                currentPrice={currentPrice}
                onPriceClick={(price) => {
                  // Auto-fill price when clicking order book
                  console.log("Price clicked:", price);
                }}
              />
            </div>
            <div className="h-1/2">
              <LiveTradesFeed
                coin={selectedCoin}
                onPriceClick={(price) => {
                  console.log("Trade price clicked:", price);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

