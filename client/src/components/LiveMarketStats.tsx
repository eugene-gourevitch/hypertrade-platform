/**
 * Live Market Statistics
 * Real-time market metrics displayed in Bloomberg-style cards
 */

import { trpc } from "@/lib/trpc";
import { Activity, TrendingUp, Zap, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

interface MarketMetrics {
  totalAssets: number;
  avgPrice: number;
  topGainer: { coin: string; change: number } | null;
  topLoser: { coin: string; change: number } | null;
}

export function LiveMarketStats() {
  // Use polling instead of WebSocket subscriptions for homepage
  const { data: mids, isSuccess } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 2000, // Poll every 2 seconds
    refetchIntervalInBackground: true,
  });

  const [metrics, setMetrics] = useState<MarketMetrics>({
    totalAssets: 0,
    avgPrice: 0,
    topGainer: null,
    topLoser: null,
  });

  useEffect(() => {
    if (!mids || Object.keys(mids).length === 0) return;

    const prices = Object.values(mids).map((p) => parseFloat(p));
    const totalAssets = Object.keys(mids).length;
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    // For demo purposes, generate random changes
    const changes = Object.keys(mids).map((coin) => ({
      coin,
      change: (Math.random() - 0.5) * 10,
    }));

    const sortedChanges = [...changes].sort((a, b) => b.change - a.change);
    const topGainer = sortedChanges[0];
    const topLoser = sortedChanges[sortedChanges.length - 1];

    setMetrics({
      totalAssets,
      avgPrice,
      topGainer,
      topLoser,
    });
  }, [mids]);

  const stats = [
    {
      icon: Activity,
      label: "Live Assets",
      value: metrics.totalAssets.toString(),
      color: "text-cyan-400",
      bgGradient: "from-cyan-500/10 to-blue-500/10",
      borderColor: "border-cyan-500/20",
    },
    {
      icon: DollarSign,
      label: "Avg Price",
      value: `$${metrics.avgPrice.toFixed(2)}`,
      color: "text-green-400",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      borderColor: "border-green-500/20",
    },
    {
      icon: TrendingUp,
      label: "Top Gainer",
      value: metrics.topGainer
        ? `${metrics.topGainer.coin} +${metrics.topGainer.change.toFixed(2)}%`
        : "---",
      color: "text-emerald-400",
      bgGradient: "from-emerald-500/10 to-green-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      icon: Zap,
      label: "Market Status",
      value: isSuccess ? "LIVE" : "OFFLINE",
      color: isSuccess ? "text-yellow-400" : "text-gray-500",
      bgGradient: isSuccess
        ? "from-yellow-500/10 to-orange-500/10"
        : "from-gray-500/10 to-gray-600/10",
      borderColor: isSuccess ? "border-yellow-500/20" : "border-gray-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`relative group overflow-hidden rounded-lg border ${stat.borderColor} bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-${stat.color}/20`}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                {isSuccess && idx === 3 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 font-medium mb-1">
                {stat.label}
              </div>
              <div className={`text-lg font-bold ${stat.color} font-mono`}>
                {stat.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
