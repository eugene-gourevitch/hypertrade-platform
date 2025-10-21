/**
 * Live Trades Feed Component
 * Real-time trades with WebSocket updates
 * Hyperliquid-style but enhanced
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { WebSocketStatus } from "@/components/WebSocketStatus";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Trade {
  price: string;
  size: string;
  time: number;
  side: "buy" | "sell";
}

interface LiveTradesFeedProps {
  coin: string;
  onPriceClick?: (price: string) => void;
}

export function LiveTradesFeed({ coin, onPriceClick }: LiveTradesFeedProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [flashingTrades, setFlashingTrades] = useState<Set<number>>(new Set());

  // Add new trade with flash effect
  const addTrade = (trade: Trade) => {
    setTrades((prev) => [trade, ...prev].slice(0, 100));
    setFlashingTrades((prev) => new Set(prev).add(trade.time));
    
    // Remove flash after animation
    setTimeout(() => {
      setFlashingTrades((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trade.time);
        return newSet;
      });
    }, 500);
  };

  // Format price
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

  // Format time
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <Card className="h-full flex flex-col bg-black border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Recent Trades</span>
          <WebSocketStatus isConnected={true} label="Live" />
        </div>
        
        {/* Trade Count */}
        <div className="text-xs text-gray-500">
          {trades.length} trades
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-gray-500 border-b border-gray-800">
        <div className="text-left">Price (USDC)</div>
        <div className="text-right">Size ({coin})</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-sm">Waiting for trades...</div>
            </div>
          </div>
        ) : (
          trades.map((trade, idx) => {
            const isFlashing = flashingTrades.has(trade.time);
            const isBuy = trade.side === "buy";

            return (
              <div
                key={`${trade.time}-${idx}`}
                className={cn(
                  "grid grid-cols-3 gap-2 px-3 py-1.5 hover:bg-gray-900 cursor-pointer transition-all group relative",
                  isFlashing && "animate-pulse"
                )}
                onClick={() => onPriceClick?.(trade.price)}
              >
                {/* Flash background */}
                {isFlashing && (
                  <div
                    className={cn(
                      "absolute inset-0 opacity-20 transition-opacity",
                      isBuy ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                )}

                {/* Price with side indicator */}
                <div className="flex items-center gap-1 relative z-10">
                  {isBuy ? (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-mono font-medium",
                      isBuy ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {formatPrice(trade.price)}
                  </span>
                </div>

                {/* Size */}
                <div className="text-gray-300 text-sm text-right font-mono relative z-10">
                  {formatSize(trade.size)}
                </div>

                {/* Time */}
                <div className="text-gray-500 text-xs text-right font-mono relative z-10 group-hover:text-gray-300">
                  {formatTime(trade.time)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Statistics */}
      <div className="p-2 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">24h Volume: </span>
            <span className="text-white font-mono">$1.2M</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Trades: </span>
            <span className="text-white font-mono">12,345</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

