import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface OrderBookProps {
  coin: string;
}

export function OrderBook({ coin }: OrderBookProps) {
  const [selectedCoin, setSelectedCoin] = useState(coin);

  useEffect(() => {
    setSelectedCoin(coin);
  }, [coin]);

  const { data: orderBook } = trpc.market.getL2Snapshot.useQuery(
    { coin: selectedCoin },
    {
      refetchInterval: 500, // Update every 500ms for real-time order book
      enabled: !!selectedCoin,
    }
  );

  if (!orderBook || !orderBook.levels || orderBook.levels.length < 2) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Order Book</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading order book...</div>
        </CardContent>
      </Card>
    );
  }

  const bids = orderBook.levels[0] || [];
  const asks = orderBook.levels[1] || [];

  // Calculate max size for depth visualization
  const maxBidSize = Math.max(...bids.map((b) => parseFloat(b.sz)), 0);
  const maxAskSize = Math.max(...asks.map((a) => parseFloat(a.sz)), 0);
  const maxSize = Math.max(maxBidSize, maxAskSize);

  // Calculate spread
  const bestBid = bids[0] ? parseFloat(bids[0].px) : 0;
  const bestAsk = asks[0] ? parseFloat(asks[0].px) : 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = bestBid > 0 ? ((spread / bestBid) * 100).toFixed(4) : "0.0000";

  // Calculate cumulative totals
  let bidTotal = 0;
  let askTotal = 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-sm font-medium">Order Book</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="flex flex-col h-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b text-muted-foreground font-medium">
            <div className="text-left">Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>

          {/* Asks (Sell orders) - Show top 10 in reverse */}
          <div className="flex-1 overflow-y-auto">
            {asks
              .slice(0, 10)
              .reverse()
              .map((ask, idx) => {
                const size = parseFloat(ask.sz);
                askTotal += size;
                const depthPercent = (size / maxSize) * 100;

                return (
                  <div
                    key={`ask-${idx}`}
                    className="grid grid-cols-3 gap-2 px-3 py-1 relative hover:bg-accent/50 cursor-pointer"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                      style={{ width: `${depthPercent}%` }}
                    />
                    <div className="text-red-500 relative z-10">{parseFloat(ask.px).toFixed(1)}</div>
                    <div className="text-right relative z-10">{size.toFixed(4)}</div>
                    <div className="text-right text-muted-foreground relative z-10">
                      {askTotal.toFixed(4)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Spread */}
          <div className="border-y bg-accent/30 px-3 py-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Spread</span>
              <div className="text-right">
                <div className="font-medium">{spread.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">{spreadPercent}%</div>
              </div>
            </div>
          </div>

          {/* Bids (Buy orders) - Show top 10 */}
          <div className="flex-1 overflow-y-auto">
            {bids.slice(0, 10).map((bid, idx) => {
              const size = parseFloat(bid.sz);
              bidTotal += size;
              const depthPercent = (size / maxSize) * 100;

              return (
                <div
                  key={`bid-${idx}`}
                  className="grid grid-cols-3 gap-2 px-3 py-1 relative hover:bg-accent/50 cursor-pointer"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <div className="text-green-500 relative z-10">{parseFloat(bid.px).toFixed(1)}</div>
                  <div className="text-right relative z-10">{size.toFixed(4)}</div>
                  <div className="text-right text-muted-foreground relative z-10">
                    {bidTotal.toFixed(4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

