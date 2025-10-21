import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrades } from "@/hooks/useWebSocket";
import { Activity } from "lucide-react";

interface LiveTradesProps {
  symbol: string;
  className?: string;
}

export default function LiveTrades({ symbol, className }: LiveTradesProps) {
  const { trades, isConnected } = useTrades(symbol);

  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Live Trades</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{symbol}</span>
            {isConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-500">LIVE</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-full text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b text-muted-foreground font-medium">
            <div className="text-left">Price (USD)</div>
            <div className="text-right">Size</div>
            <div className="text-right">Time</div>
          </div>

          {/* Trades List */}
          <div className="overflow-y-auto max-h-[400px]">
            {!isConnected || trades.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isConnected ? "Waiting for trades..." : "Connecting..."}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {trades.map((trade: any, idx: number) => {
                  const isBuy = trade.side === "B";
                  const time = new Date(trade.time);
                  const timeStr = time.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <div
                      key={`${trade.time}-${idx}`}
                      className="grid grid-cols-3 gap-2 px-3 py-1.5 hover:bg-accent/20 transition-colors"
                    >
                      <div className={`font-mono ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                        {parseFloat(trade.px).toFixed(2)}
                      </div>
                      <div className="text-right font-mono">
                        {parseFloat(trade.sz).toFixed(4)}
                      </div>
                      <div className="text-right text-muted-foreground font-mono text-[10px]">
                        {timeStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
