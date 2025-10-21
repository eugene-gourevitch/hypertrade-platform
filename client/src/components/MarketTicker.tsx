/**
 * Bloomberg-style Market Ticker Tape
 * Shows real-time scrolling prices for all crypto assets
 */

import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChange {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

export function MarketTicker() {
  // Use polling instead of WebSocket subscriptions for homepage
  const { data: mids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds (much slower)
    refetchIntervalInBackground: false, // Don't poll when not visible
  });

  const [priceChanges, setPriceChanges] = useState<Record<string, PriceChange>>({});
  const previousMidsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!mids) return;

    // Calculate price changes
    const changes: Record<string, PriceChange> = {};

    Object.entries(mids).forEach(([coin, price]: [string, any]) => {
      const current = parseFloat(price);
      const previous = parseFloat(previousMidsRef.current[coin] || price);
      const change = current - previous;
      const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

      changes[coin] = {
        current,
        previous,
        change,
        changePercent,
      };
    });

    setPriceChanges(changes);
    previousMidsRef.current = mids;
  }, [mids]);

  const coins = mids ? Object.keys(mids).sort() : [];

  if (!mids || coins.length === 0) {
    return (
      <div className="bg-black/40 border-y border-gray-800/50 backdrop-blur-sm">
        <div className="py-2 px-4 text-center text-gray-500 text-sm">
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border-y border-gray-800/50 backdrop-blur-sm overflow-hidden">
      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/40 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none" />

        {/* Scrolling ticker */}
        <div className="ticker-wrapper py-2">
          <div className="ticker-content">
            {[...coins, ...coins].map((coin, idx) => {
              const priceData = priceChanges[coin];
              if (!priceData) return null;

              const isPositive = priceData.change >= 0;
              const price = priceData.current.toFixed(2);
              const changePercent = Math.abs(priceData.changePercent).toFixed(2);

              return (
                <div
                  key={`${coin}-${idx}`}
                  className="inline-flex items-center gap-3 px-6 border-r border-gray-800/50"
                >
                  <span className="font-bold text-white text-sm">{coin}</span>
                  <span className="font-mono text-gray-200 text-sm">
                    ${price}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isPositive ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? "+" : "-"}
                    {changePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .ticker-wrapper {
          overflow: hidden;
        }

        .ticker-content {
          display: inline-flex;
          animation: ticker-scroll 480s linear infinite;
          will-change: transform;
        }

        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-wrapper:hover .ticker-content {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
