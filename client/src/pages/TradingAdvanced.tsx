import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import TradingViewChart from "@/components/TradingViewChart";
import { useWallet } from "@/hooks/useWallet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AccountSetupHelp } from "@/components/AccountSetupHelp";

export default function TradingAdvanced() {
  const { user, isAuthenticated, loading } = useAuth();
  const wallet = useWallet();
  
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop" | "bracket">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");
  const [leverage, setLeverage] = useState([5]);
  const [isCross, setIsCross] = useState(true);

  // Fetch market data
  const { data: meta } = trpc.market.getMeta.useQuery();
  const { data: mids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 2000,
  });

  // Fetch account data
  const { data: userState, refetch: refetchUserState } =
    trpc.account.getUserState.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 3000,
    });
  const { data: openOrders, refetch: refetchOpenOrders } =
    trpc.account.getOpenOrders.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 2000,
    });

  // Trading mutations
  const placeMarketOrder = trpc.trading.placeMarketOrder.useMutation({
    onSuccess: () => {
      toast.success("Market order placed");
      setSize("");
      refetchUserState();
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Order failed: ${error.message}`),
  });

  const placeLimitOrder = trpc.trading.placeLimitOrder.useMutation({
    onSuccess: () => {
      toast.success("Limit order placed");
      setSize("");
      setPrice("");
      refetchUserState();
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Order failed: ${error.message}`),
  });

  const placeStopLoss = trpc.trading.placeStopLoss.useMutation({
    onSuccess: () => {
      toast.success("Stop loss placed");
      setSize("");
      setStopLossPrice("");
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Stop loss failed: ${error.message}`),
  });

  const placeTakeProfit = trpc.trading.placeTakeProfit.useMutation({
    onSuccess: () => {
      toast.success("Take profit placed");
      setSize("");
      setTakeProfitPrice("");
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Take profit failed: ${error.message}`),
  });

  const placeBracketOrder = trpc.trading.placeBracketOrder.useMutation({
    onSuccess: () => {
      toast.success("Bracket order placed");
      setSize("");
      setPrice("");
      setStopLossPrice("");
      setTakeProfitPrice("");
      refetchUserState();
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Bracket order failed: ${error.message}`),
  });

  const updateLeverageMutation = trpc.trading.updateLeverage.useMutation({
    onSuccess: () => {
      toast.success(`Leverage updated to ${leverage[0]}x`);
      refetchUserState();
    },
    onError: (error) => toast.error(`Failed to update leverage: ${error.message}`),
  });

  const cancelOrder = trpc.trading.cancelOrder.useMutation({
    onSuccess: () => {
      toast.success("Order cancelled");
      refetchOpenOrders();
    },
    onError: (error) => toast.error(`Cancel failed: ${error.message}`),
  });

  const handlePlaceOrder = () => {
    if (!size || parseFloat(size) <= 0) {
      toast.error("Please enter a valid size");
      return;
    }

    if (orderType === "market") {
      placeMarketOrder.mutate({
        coin: selectedCoin,
        isBuy: side === "buy",
        size: parseFloat(size),
      });
    } else if (orderType === "limit") {
      if (!price || parseFloat(price) <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
      placeLimitOrder.mutate({
        coin: selectedCoin,
        isBuy: side === "buy",
        size: parseFloat(size),
        price: parseFloat(price),
      });
    } else if (orderType === "stop") {
      if (!stopLossPrice || parseFloat(stopLossPrice) <= 0) {
        toast.error("Please enter a valid stop loss price");
        return;
      }
      placeStopLoss.mutate({
        coin: selectedCoin,
        isBuy: side === "sell", // Opposite side for stop loss
        size: parseFloat(size),
        triggerPrice: parseFloat(stopLossPrice),
      });
    } else if (orderType === "bracket") {
      if (!price || !stopLossPrice || !takeProfitPrice) {
        toast.error("Please enter entry, stop loss, and take profit prices");
        return;
      }
      placeBracketOrder.mutate({
        coin: selectedCoin,
        isBuy: side === "buy",
        size: parseFloat(size),
        entryPrice: parseFloat(price),
        stopLossPrice: parseFloat(stopLossPrice),
        takeProfitPrice: parseFloat(takeProfitPrice),
      });
    }
  };

  const handleUpdateLeverage = () => {
    updateLeverageMutation.mutate({
      coin: selectedCoin,
      leverage: leverage[0],
      isCross,
    });
  };

  const currentPrice = mids?.[selectedCoin] || "0";
  const coins = meta?.universe?.map((asset) => asset.name) || [];
  const accountValue =
    userState?.marginSummary?.accountValue ||
    userState?.crossMarginSummary?.accountValue ||
    "0";
  const positions = userState?.assetPositions || [];
  
  // Debug: Log user state
  console.log("User State:", userState);
  console.log("Account Value:", accountValue);
  console.log("Positions:", positions);

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              HyperTrade
            </Link>
            <nav className="flex gap-4">
              <Link href="/trade" className="text-sm font-medium hover:text-primary">
                Trade
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <span className="font-mono font-bold">
                ${parseFloat(accountValue).toFixed(2)}
              </span>
              {parseFloat(accountValue) === 0 && (
                <span className="ml-2 text-xs text-yellow-500">⚠️ Empty
                </span>
              )}
            </div>
            {parseFloat(accountValue) === 0 && (
              <AccountSetupHelp />
            )}
            {wallet.isMetaMaskInstalled && (
              <div>
                {wallet.isConnected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={wallet.disconnect}
                  >
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={wallet.connect}
                    disabled={wallet.isConnecting}
                  >
                    {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                )}
              </div>
            )}
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Chart */}
          <div className="col-span-9">
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {coins.map((coin) => (
                      <SelectItem key={coin} value={coin}>
                        {coin}/USDC
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1">
                  <div className="text-3xl font-bold font-mono">
                    ${parseFloat(currentPrice).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="h-[500px]">
                <TradingViewChart symbol={selectedCoin} theme="dark" />
              </div>
            </Card>

            {/* Positions */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Positions</h3>
                {parseFloat(accountValue) === 0 && (
                  <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                    ⚠️ Account has zero balance - deposit funds to start trading
                  </span>
                )}
              </div>
              {positions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">No open positions</p>
                  {parseFloat(accountValue) > 0 && (
                    <p className="text-xs text-muted-foreground">Place your first trade to see positions here</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Coin</th>
                        <th className="text-right py-2">Size</th>
                        <th className="text-right py-2">Entry</th>
                        <th className="text-right py-2">Mark</th>
                        <th className="text-right py-2">PnL</th>
                        <th className="text-right py-2">ROE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, idx) => {
                        const position = pos.position;
                        const size = parseFloat(position.szi || "0");
                        const pnl = parseFloat(position.unrealizedPnl || "0");
                        const roe = parseFloat(position.returnOnEquity || "0") * 100;
                        return (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-2 font-semibold">{position.coin}</td>
                            <td className="text-right font-mono">
                              {size > 0 ? "+" : ""}{size.toFixed(4)}
                            </td>
                            <td className="text-right font-mono">
                              ${parseFloat(position.entryPx || "0").toFixed(2)}
                            </td>
                            <td className="text-right font-mono">
                              ${parseFloat(mids?.[position.coin] || "0").toFixed(2)}
                            </td>
                            <td
                              className={`text-right font-mono ${
                                pnl >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                            </td>
                            <td
                              className={`text-right font-mono ${
                                roe >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Order Entry & Controls */}
          <div className="col-span-3 space-y-4">
            {/* Leverage Control */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Leverage</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{leverage[0]}x</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="cross-mode" className="text-xs">Cross</Label>
                    <Switch
                      id="cross-mode"
                      checked={isCross}
                      onCheckedChange={setIsCross}
                    />
                  </div>
                </div>
                <Slider
                  value={leverage}
                  onValueChange={setLeverage}
                  min={1}
                  max={40}
                  step={1}
                  className="w-full"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleUpdateLeverage}
                  disabled={updateLeverageMutation.isPending}
                >
                  Update Leverage
                </Button>
              </div>
            </Card>

            {/* Order Entry */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Place Order</h3>

              <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger
                    value="buy"
                    className="data-[state=active]:bg-green-600"
                  >
                    Buy
                  </TabsTrigger>
                  <TabsTrigger
                    value="sell"
                    className="data-[state=active]:bg-red-600"
                  >
                    Sell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={side} className="space-y-3">
                  <div>
                    <Label className="text-xs">Order Type</Label>
                    <Select
                      value={orderType}
                      onValueChange={(v) => setOrderType(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop">Stop Loss</SelectItem>
                        <SelectItem value="bracket">Bracket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(orderType === "limit" || orderType === "bracket") && (
                    <div>
                      <Label className="text-xs">Entry Price</Label>
                      <Input
                        type="number"
                        placeholder={currentPrice}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Size ({selectedCoin})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                  </div>

                  {(orderType === "stop" || orderType === "bracket") && (
                    <div>
                      <Label className="text-xs">Stop Loss Price</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={stopLossPrice}
                        onChange={(e) => setStopLossPrice(e.target.value)}
                      />
                    </div>
                  )}

                  {orderType === "bracket" && (
                    <div>
                      <Label className="text-xs">Take Profit Price</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={takeProfitPrice}
                        onChange={(e) => setTakeProfitPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant={side === "buy" ? "default" : "destructive"}
                    onClick={handlePlaceOrder}
                    disabled={
                      placeMarketOrder.isPending ||
                      placeLimitOrder.isPending ||
                      placeStopLoss.isPending ||
                      placeTakeProfit.isPending ||
                      placeBracketOrder.isPending
                    }
                  >
                    {orderType === "bracket"
                      ? "Place Bracket Order"
                      : `${side === "buy" ? "Buy" : "Sell"} ${selectedCoin}`}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Open Orders */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Open Orders</h3>
              {!openOrders || openOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No open orders</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {openOrders.map((order) => (
                    <div
                      key={order.oid}
                      className="p-2 bg-muted/30 rounded text-xs"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold">{order.coin}</span>
                        <span
                          className={
                            order.side === "B" ? "text-green-400" : "text-red-400"
                          }
                        >
                          {order.side === "B" ? "Buy" : "Sell"}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>${parseFloat(order.limitPx).toFixed(2)}</span>
                        <span>{order.sz}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-1 h-6 text-xs"
                        onClick={() =>
                          cancelOrder.mutate({
                            coin: order.coin,
                            oid: order.oid,
                          })
                        }
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

