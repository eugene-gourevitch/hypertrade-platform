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
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Trading() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");

  // Fetch market data
  const { data: meta } = trpc.market.getMeta.useQuery();
  const { data: mids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 2000, // Refresh every 2 seconds
  });
  const { data: orderBook } = trpc.market.getL2Snapshot.useQuery(
    { coin: selectedCoin },
    {
      enabled: !!selectedCoin,
      refetchInterval: 1000,
    }
  );

  // Fetch account data (only if authenticated)
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
  const { data: userFills } = trpc.account.getUserFills.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Trading mutations
  const placeMarketOrder = trpc.trading.placeMarketOrder.useMutation({
    onSuccess: () => {
      toast.success("Market order placed successfully");
      setSize("");
      refetchUserState();
      refetchOpenOrders();
    },
    onError: (error) => {
      toast.error(`Order failed: ${error.message}`);
    },
  });

  const placeLimitOrder = trpc.trading.placeLimitOrder.useMutation({
    onSuccess: () => {
      toast.success("Limit order placed successfully");
      setSize("");
      setPrice("");
      refetchUserState();
      refetchOpenOrders();
    },
    onError: (error) => {
      toast.error(`Order failed: ${error.message}`);
    },
  });

  const cancelOrder = trpc.trading.cancelOrder.useMutation({
    onSuccess: () => {
      toast.success("Order cancelled");
      refetchOpenOrders();
    },
    onError: (error) => {
      toast.error(`Cancel failed: ${error.message}`);
    },
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
    } else {
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
    }
  };

  const currentPrice = mids?.[selectedCoin] || "0";
  const coins = meta?.universe?.map((asset) => asset.name) || [];

  // Auto-fill price for limit orders
  useEffect(() => {
    if (orderType === "limit" && !price && currentPrice !== "0") {
      setPrice(currentPrice);
    }
  }, [orderType, currentPrice, price]);

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

  const accountValue =
    userState?.marginSummary?.accountValue ||
    userState?.crossMarginSummary?.accountValue ||
    "0";
  const positions = userState?.assetPositions || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="text-xl font-bold text-primary">HyperTrade</a>
            </Link>
            <nav className="flex gap-4">
              <Link href="/trade">
                <a className="text-sm font-medium hover:text-primary">Trade</a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Account Value: </span>
              <span className="font-mono font-bold">
                ${parseFloat(accountValue).toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Market Selector & Chart Placeholder */}
          <div className="col-span-8">
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
            </Card>

            {/* Order Book */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Order Book</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Asks (Sell orders) */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2 grid grid-cols-2">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                  </div>
                  <div className="space-y-1">
                    {orderBook?.levels?.[1]
                      ?.slice(0, 10)
                      .reverse()
                      .map((level, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-2 text-sm font-mono"
                        >
                          <span className="text-red-400">{level.px}</span>
                          <span className="text-right text-muted-foreground">
                            {level.sz}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Bids (Buy orders) */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2 grid grid-cols-2">
                    <span>Price</span>
                    <span className="text-right">Size</span>
                  </div>
                  <div className="space-y-1">
                    {orderBook?.levels?.[0]?.slice(0, 10).map((level, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-2 text-sm font-mono"
                      >
                        <span className="text-green-400">{level.px}</span>
                        <span className="text-right text-muted-foreground">
                          {level.sz}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Order Entry */}
          <div className="col-span-4">
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold mb-4">Place Order</h3>

              <Tabs value={side} onValueChange={(v) => setSide(v as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-green-600">
                    Buy
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
                    Sell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={side} className="space-y-4">
                  <div>
                    <Label>Order Type</Label>
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
                      </SelectContent>
                    </Select>
                  </div>

                  {orderType === "limit" && (
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Size ({selectedCoin})</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    variant={side === "buy" ? "default" : "destructive"}
                    onClick={handlePlaceOrder}
                    disabled={
                      placeMarketOrder.isPending || placeLimitOrder.isPending
                    }
                  >
                    {side === "buy" ? "Buy" : "Sell"} {selectedCoin}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Positions */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Positions</h3>
              {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open positions</p>
              ) : (
                <div className="space-y-2">
                  {positions.map((pos, idx) => {
                    const position = pos.position;
                    const size = parseFloat(position.szi || "0");
                    const pnl = parseFloat(position.unrealizedPnl || "0");
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-muted/50 rounded-lg text-sm"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{position.coin}</span>
                          <span
                            className={
                              pnl >= 0 ? "text-green-400" : "text-red-400"
                            }
                          >
                            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Size: {Math.abs(size).toFixed(4)}</span>
                          <span>
                            Entry: ${parseFloat(position.entryPx || "0").toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Bottom: Open Orders & Trade History */}
        <div className="mt-4">
          <Card className="p-4">
            <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">Open Orders</TabsTrigger>
                <TabsTrigger value="history">Trade History</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="mt-4">
                {!openOrders || openOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open orders</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Coin</th>
                          <th className="text-left py-2">Side</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Size</th>
                          <th className="text-right py-2">Filled</th>
                          <th className="text-right py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openOrders.map((order) => (
                          <tr key={order.oid} className="border-b border-border/50">
                            <td className="py-2">{order.coin}</td>
                            <td
                              className={
                                order.side === "B"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {order.side === "B" ? "Buy" : "Sell"}
                            </td>
                            <td className="text-right font-mono">
                              ${parseFloat(order.limitPx).toFixed(2)}
                            </td>
                            <td className="text-right font-mono">{order.sz}</td>
                            <td className="text-right font-mono">
                              {(
                                parseFloat(order.origSz) - parseFloat(order.sz)
                              ).toFixed(4)}
                            </td>
                            <td className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  cancelOrder.mutate({
                                    coin: order.coin,
                                    oid: order.oid,
                                  })
                                }
                              >
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                {!userFills || userFills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trade history</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Time</th>
                          <th className="text-left py-2">Coin</th>
                          <th className="text-left py-2">Side</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Size</th>
                          <th className="text-right py-2">Fee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userFills.slice(0, 20).map((fill, idx) => (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-2">
                              {new Date(fill.time).toLocaleString()}
                            </td>
                            <td>{fill.coin}</td>
                            <td
                              className={
                                fill.side === "B"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {fill.side === "B" ? "Buy" : "Sell"}
                            </td>
                            <td className="text-right font-mono">
                              ${parseFloat(fill.px).toFixed(2)}
                            </td>
                            <td className="text-right font-mono">{fill.sz}</td>
                            <td className="text-right font-mono">
                              ${parseFloat(fill.fee).toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

