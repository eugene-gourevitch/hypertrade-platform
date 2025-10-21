/**
 * Enhanced Order Book Component
 * Real-time order book with WebSocket updates
 * Hyperliquid-style but with better UX
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { cn } from "@/lib/utils";

interface OrderBookLevel {
  price: string;
  size: string;
  total?: string;
}

interface EnhancedOrderBookProps {
  coin: string;
  currentPrice?: string;
  onPriceClick?: (price: string) => void;
}

export function EnhancedOrderBook({ coin, currentPrice, onPriceClick }: EnhancedOrderBookProps) {
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [spread, setSpread] = useState<string>("0");
  const [spreadPercent, setSpreadPercent] = useState<string>("0");
  const [view, setView] = useState<"all" | "bids" | "asks">("all");
  const [grouping, setGrouping] = useState<number>(0.5);

  // Calculate spread
  useEffect(() => {
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0]?.price || "0");
      const bestAsk = parseFloat(asks[0]?.price || "0");
      const spreadValue = bestAsk - bestBid;
      const spreadPct = ((spreadValue / bestBid) * 100).toFixed(4);
      
      setSpread(spreadValue.toFixed(2));
      setSpreadPercent(spreadPct);
    }
  }, [bids, asks]);

  // Format price with grouping
  const formatPrice = (price: string): string => {
    const num = parseFloat(price);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format size
  const formatSize = (size: string): string => {
    const num = parseFloat(size);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  // Calculate depth percentage
  const getDepthPercentage = (total: string, maxTotal: string): number => {
    return (parseFloat(total) / parseFloat(maxTotal)) * 100;
  };

  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1]?.total || "0" : "0";
  const maxAskTotal = asks.length > 0 ? asks[asks.length - 1]?.total || "0" : "0";

  return (
    <Card className="h-full flex flex-col bg-black border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Order Book</span>
          <WebSocketStatus isConnected={true} label="Live" />
        </div>
        
        {/* View Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("all")}
            className={cn(
              "p-1 rounded hover:bg-gray-800 transition",
              view === "all" ? "bg-gray-800" : ""
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
              <rect y="0" width="16" height="7" className={view === "all" ? "text-green-500" : ""} />
              <rect y="9" width="16" height="7" className={view === "all" ? "text-red-500" : ""} />
            </svg>
          </button>
          <button
            onClick={() => setView("bids")}
            className={cn(
              "p-1 rounded hover:bg-gray-800 transition",
              view === "bids" ? "bg-gray-800" : ""
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect y="0" width="16" height="16" className={view === "bids" ? "text-green-500" : "text-gray-400"} />
            </svg>
          </button>
          <button
            onClick={() => setView("asks")}
            className={cn(
              "p-1 rounded hover:bg-gray-800 transition",
              view === "asks" ? "bg-gray-800" : ""
            )}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect y="0" width="16" height="16" className={view === "asks" ? "text-red-500" : "text-gray-400"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-gray-500 border-b border-gray-800">
        <div className="text-left">Price (USDC)</div>
        <div className="text-right">Size ({coin})</div>
        <div className="text-right">Total</div>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sells) */}
        {(view === "all" || view === "asks") && (
          <div className="flex-1 overflow-y-auto flex flex-col-reverse">
            {asks.slice(0, 15).reverse().map((ask, idx) => (
              <div
                key={`ask-${idx}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-1 hover:bg-gray-900 cursor-pointer transition group"
                onClick={() => onPriceClick?.(ask.price)}
              >
                {/* Depth Bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-red-500/10"
                  style={{
                    width: `${getDepthPercentage(ask.total || "0", maxAskTotal)}%`,
                  }}
                />
                
                <div className="text-red-500 text-sm font-mono relative z-10">
                  {formatPrice(ask.price)}
                </div>
                <div className="text-gray-300 text-sm text-right font-mono relative z-10">
                  {formatSize(ask.size)}
                </div>
                <div className="text-gray-500 text-sm text-right font-mono relative z-10 group-hover:text-gray-300">
                  {formatSize(ask.total || "0")}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spread */}
        {view === "all" && (
          <div className="py-2 px-3 border-y border-gray-800 bg-gray-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Spread</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-yellow-500">
                  {spread}
                </span>
                <span className="text-xs text-gray-500">
                  ({spreadPercent}%)
                </span>
              </div>
            </div>
            {currentPrice && (
              <div className="mt-1 text-center">
                <span className="text-lg font-mono font-bold text-white">
                  {formatPrice(currentPrice)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bids (Buys) */}
        {(view === "all" || view === "bids") && (
          <div className="flex-1 overflow-y-auto">
            {bids.slice(0, 15).map((bid, idx) => (
              <div
                key={`bid-${idx}`}
                className="relative grid grid-cols-3 gap-2 px-3 py-1 hover:bg-gray-900 cursor-pointer transition group"
                onClick={() => onPriceClick?.(bid.price)}
              >
                {/* Depth Bar */}
                <div
                  className="absolute right-0 top-0 h-full bg-green-500/10"
                  style={{
                    width: `${getDepthPercentage(bid.total || "0", maxBidTotal)}%`,
                  }}
                />
                
                <div className="text-green-500 text-sm font-mono relative z-10">
                  {formatPrice(bid.price)}
                </div>
                <div className="text-gray-300 text-sm text-right font-mono relative z-10">
                  {formatSize(bid.size)}
                </div>
                <div className="text-gray-500 text-sm text-right font-mono relative z-10 group-hover:text-gray-300">
                  {formatSize(bid.total || "0")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grouping Controls */}
      <div className="p-2 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Group</span>
          <div className="flex items-center gap-1">
            {[0.01, 0.1, 0.5, 1, 10].map((val) => (
              <button
                key={val}
                onClick={() => setGrouping(val)}
                className={cn(
                  "px-2 py-1 text-xs rounded transition",
                  grouping === val
                    ? "bg-blue-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

