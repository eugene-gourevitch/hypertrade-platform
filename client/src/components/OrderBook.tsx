import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useL2Book } from "@/hooks/useWebSocket";
import { BookOpen } from "lucide-react";
import { useState } from "react";

interface OrderBookProps {
  coin: string;
  className?: string;
}

export function OrderBook({ coin, className }: OrderBookProps) {
  const { orderBook, isConnected } = useL2Book(coin);
  const [precision, setPrecision] = useState(2);

  if (!orderBook || !orderBook.levels || orderBook.levels.length < 2) {
    return (
      <Card className={`h-full flex flex-col ${className || ""}`}>
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Order Book
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              {isConnected ? "Loading order book..." : "Connecting..."}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bids = orderBook.levels[0] || [];
  const asks = orderBook.levels[1] || [];

  // Calculate max size for depth visualization
  const maxBidSize = Math.max(...bids.map((b: any) => parseFloat(b.sz)), 0);
  const maxAskSize = Math.max(...asks.map((a: any) => parseFloat(a.sz)), 0);
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
    <Card className={`h-full flex flex-col ${className || ""}`}>
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Order Book
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className="text-xs bg-background border border-border rounded px-2 py-1"
            >
              <option value={0}>0.01</option>
              <option value={1}>0.1</option>
              <option value={2}>1</option>
              <option value={3}>10</option>
            </select>
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500">LIVE</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b text-muted-foreground font-medium bg-accent/5">
            <div className="text-left">Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Total</div>
          </div>

          {/* Asks (Sell orders) - Show top 15 in reverse */}
          <div className="flex-1 overflow-y-auto flex flex-col-reverse">
            {asks
              .slice(0, 15)
              .map((ask: any, idx: number) => {
                const size = parseFloat(ask.sz);
                askTotal += size;
                const depthPercent = (size / maxSize) * 100;
                const price = parseFloat(ask.px);

                return (
                  <div
                    key={`ask-${idx}`}
                    className="grid grid-cols-3 gap-2 px-3 py-1 relative hover:bg-red-500/5 cursor-pointer transition-colors group"
                  >
                    {/* Depth visualization */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-red-500/10 group-hover:bg-red-500/15 transition-colors"
                      style={{ width: `${depthPercent}%` }}
                    />
                    <div className="text-red-500 font-mono relative z-10">
                      {price.toFixed(precision)}
                    </div>
                    <div className="text-right font-mono relative z-10">
                      {size.toFixed(4)}
                    </div>
                    <div className="text-right text-muted-foreground font-mono relative z-10 text-[10px]">
                      {askTotal.toFixed(4)}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Spread */}
          <div className="border-y bg-accent/20 px-3 py-2.5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-bold font-mono text-green-500">
                  ${bestBid.toFixed(precision)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Best Bid
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-xs">${spread.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground">{spreadPercent}%</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-red-500">
                  ${bestAsk.toFixed(precision)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Best Ask
                </div>
              </div>
            </div>
          </div>

          {/* Bids (Buy orders) - Show top 15 */}
          <div className="flex-1 overflow-y-auto">
            {bids.slice(0, 15).map((bid: any, idx: number) => {
              const size = parseFloat(bid.sz);
              bidTotal += size;
              const depthPercent = (size / maxSize) * 100;
              const price = parseFloat(bid.px);

              return (
                <div
                  key={`bid-${idx}`}
                  className="grid grid-cols-3 gap-2 px-3 py-1 relative hover:bg-green-500/5 cursor-pointer transition-colors group"
                >
                  {/* Depth visualization */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-green-500/10 group-hover:bg-green-500/15 transition-colors"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <div className="text-green-500 font-mono relative z-10">
                    {price.toFixed(precision)}
                  </div>
                  <div className="text-right font-mono relative z-10">
                    {size.toFixed(4)}
                  </div>
                  <div className="text-right text-muted-foreground font-mono relative z-10 text-[10px]">
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
