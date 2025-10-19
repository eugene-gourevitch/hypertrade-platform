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
import { TransferDialog } from "@/components/TransferDialog";

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
  const [leverage, setLeverage] = useState([10]);
  const [isIsolated, setIsIsolated] = useState(false);
  const [marketType, setMarketType] = useState<"perps" | "spot">("perps");

  // Fetch market data
  const { data: meta } = trpc.market.getMeta.useQuery();
  const { data: mids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 1000, // Update every second
  });

  // Fetch account data
  const { data: userState, refetch: refetchUserState } =
    trpc.account.getUserState.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 1000, // Update every second
    });
  const { data: openOrders, refetch: refetchOpenOrders } =
    trpc.account.getOpenOrders.useQuery(undefined, {
      enabled: isAuthenticated,
      refetchInterval: 1000, // Update every second
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
      isCross: !isIsolated,
    });
  };

  const currentPrice = mids?.[selectedCoin] || "0";
  const coins = meta?.universe?.map((asset) => asset.name) || [];
  const accountValue =
    userState?.marginSummary?.accountValue ||
    userState?.crossMarginSummary?.accountValue ||
    "0";
  const positions = userState?.assetPositions || [];
  
  // Calculate account metrics
  const totalMarginUsed = userState?.marginSummary?.totalMarginUsed || "0";
  const totalNtlPos = userState?.marginSummary?.totalNtlPos || "0";
  const withdrawable = userState?.withdrawable || "0";
  
  // Calculate unrealized PNL from positions
  const totalUnrealizedPnl = positions.reduce((sum, pos) => {
    return sum + parseFloat(pos.position?.unrealizedPnl || "0");
  }, 0).toFixed(2);
  
  // Calculate risk metrics
  const accountValueNum = parseFloat(accountValue);
  const marginUsedNum = parseFloat(totalMarginUsed);
  const crossMarginRatio = accountValueNum > 0 ? (marginUsedNum / accountValueNum) * 100 : 0;
  const accountLeverage = marginUsedNum > 0 ? parseFloat(totalNtlPos) / accountValueNum : 0;
  
  // Calculate order summary metrics
  const sizeNum = parseFloat(size || "0");
  const priceNum = parseFloat(price || currentPrice);
  const orderValue = sizeNum * priceNum;
  const marginRequired = orderValue / leverage[0];
  const estimatedLiqPrice = side === "buy" 
    ? priceNum * (1 - 0.9 / leverage[0])
    : priceNum * (1 + 0.9 / leverage[0]);
  
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
            <TransferDialog />
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
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-3xl font-bold font-mono">
                    ${parseFloat(currentPrice).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-500">LIVE</span>
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
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Coin</th>
                        <th className="text-right py-2 px-2">Size</th>
                        <th className="text-right py-2 px-2">Position Value</th>
                        <th className="text-right py-2 px-2">Entry Price</th>
                        <th className="text-right py-2 px-2">Mark Price</th>
                        <th className="text-right py-2 px-2">PNL (ROE %)</th>
                        <th className="text-right py-2 px-2">Liq. Price</th>
                        <th className="text-right py-2 px-2">Margin</th>
                        <th className="text-right py-2 px-2">Funding</th>
                        <th className="text-center py-2 px-2">TP/SL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((pos, idx) => {
                        const position = pos.position;
                        const size = parseFloat(position.szi || "0");
                        const pnl = parseFloat(position.unrealizedPnl || "0");
                        const roe = parseFloat(position.returnOnEquity || "0") * 100;
                        const leverage = position.leverage?.value || 1;
                        const marginType = position.leverage?.type === "cross" ? "Cross" : "Isolated";
                        const liquidationPx = parseFloat(position.liquidationPx || "0");
                        const marginUsed = parseFloat((position as any).marginUsed || "0");
                        const funding = parseFloat((position as any).cumFunding?.sinceOpen || "0");
                        const positionValue = parseFloat(position.positionValue || "0");
                        
                        return (
                          <tr key={idx} className="border-b border-border/50 hover:bg-accent/5">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">{position.coin}</span>
                                <span className="text-xs text-cyan-400">{leverage}x</span>
                              </div>
                            </td>
                            <td className="text-right font-mono px-2">
                              <span className={size > 0 ? "text-green-400" : "text-red-400"}>
                                {size > 0 ? "+" : ""}{Math.abs(size).toFixed(4)}
                              </span>
                            </td>
                            <td className="text-right font-mono px-2">
                              ${positionValue.toFixed(2)}
                            </td>
                            <td className="text-right font-mono px-2">
                              ${parseFloat(position.entryPx || "0").toFixed(2)}
                            </td>
                            <td className="text-right font-mono px-2">
                              ${parseFloat(mids?.[position.coin] || "0").toFixed(2)}
                            </td>
                            <td className="text-right font-mono px-2">
                              <div className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                                <div>{pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}</div>
                                <div className="text-[10px]">
                                  ({roe >= 0 ? "+" : ""}{ roe.toFixed(2)}%)
                                </div>
                              </div>
                            </td>
                            <td className="text-right font-mono px-2 text-orange-400">
                              ${liquidationPx.toFixed(2)}
                            </td>
                            <td className="text-right px-2">
                              <div className="text-xs">
                                <div className="font-mono">${marginUsed.toFixed(2)}</div>
                                <div className="text-[10px] text-muted-foreground">({marginType})</div>
                              </div>
                            </td>
                            <td className="text-right font-mono px-2">
                              <span className={funding <= 0 ? "text-green-400" : "text-red-400"}>
                                {funding > 0 ? "-" : funding < 0 ? "+" : ""}${Math.abs(funding).toFixed(2)}
                              </span>
                            </td>
                            <td className="text-center px-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                                  Limit
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]">
                                  Market
                                </Button>
                              </div>
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
                      checked={!isIsolated}
                      onCheckedChange={(checked) => setIsIsolated(!checked)}
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

            {/* Account Overview & Risk Metrics */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Account Overview</h3>
              
              {/* Account Equity */}
              <div className="space-y-2 mb-4 pb-4 border-b border-border">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Account Equity</div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Spot</span>
                  <span className="font-mono">$8.49</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Perps</span>
                  <span className="font-mono font-semibold">${parseFloat(accountValue).toFixed(2)}</span>
                </div>
              </div>

              {/* Perps Overview - Risk Metrics */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Perps Overview</div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-mono">${parseFloat(accountValue).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Unrealized PNL</span>
                  <span className={`font-mono font-semibold ${
                    parseFloat(totalUnrealizedPnl) >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {parseFloat(totalUnrealizedPnl) >= 0 ? "+" : ""}${parseFloat(totalUnrealizedPnl).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cross Margin Ratio</span>
                  <span className={`font-mono font-semibold ${
                    crossMarginRatio > 80 ? "text-red-400" : 
                    crossMarginRatio > 50 ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {crossMarginRatio.toFixed(2)}%
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Maintenance Margin</span>
                  <span className="font-mono">${parseFloat(totalMarginUsed).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cross Account Leverage</span>
                  <span className="font-mono text-cyan-400 font-semibold">{accountLeverage.toFixed(2)}x</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Withdrawable</span>
                  <span className="font-mono">${parseFloat(withdrawable).toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                    Deposit
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Withdraw
                  </Button>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs border-cyan-500/30 text-cyan-400">
                  Perps ⇄ Spot
                </Button>
              </div>
            </Card>

            {/* Order Summary */}
            {(size || price) && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidation Price</span>
                    <span className="font-mono text-orange-400">
                      {estimatedLiqPrice > 0 ? `$${estimatedLiqPrice.toFixed(2)}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Value</span>
                    <span className="font-mono">
                      {orderValue > 0 ? `$${orderValue.toFixed(2)}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin Required</span>
                    <span className="font-mono">
                      {marginRequired > 0 ? `$${marginRequired.toFixed(2)}` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span className="font-mono text-cyan-400">↔ 0.0432% / 0.0144%</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

