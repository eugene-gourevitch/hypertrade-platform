import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface LiveTradesProps {
  symbol: string;
  className?: string;
}

export default function LiveTrades({ symbol, className }: LiveTradesProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Live Trades</span>
          <span className="text-xs text-muted-foreground">{symbol}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Info className="h-10 w-10 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Live trades feed requires WebSocket implementation
            </p>
            <p className="text-xs text-muted-foreground/70">
              Hyperliquid provides real-time trades via WebSocket subscriptions
            </p>
          </div>
        </div>

        {/* Placeholder UI showing what it would look like */}
        <div className="mt-4 space-y-2 opacity-30">
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
            <div className="text-left">Price (USD)</div>
            <div className="text-right">Size</div>
            <div className="text-right">Time</div>
          </div>
          {[1, 2, 3, 4, 5].map((i: number) => (
            <div key={i} className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-left text-green-500">--</div>
              <div className="text-right">--</div>
              <div className="text-right text-muted-foreground">--</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

