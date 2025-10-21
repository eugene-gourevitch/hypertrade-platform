/**
 * Enhanced Positions Table
 * Hyperliquid-style with real-time updates
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface Position {
  coin: string;
  szi: string;
  entryPx?: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity?: string;
  liquidationPx?: string;
  marginUsed: string;
  leverage?: {
    value: number;
    type: string;
  };
}

interface PositionsTableProps {
  positions: Position[];
  currentPrices: Record<string, string>;
  onRefresh?: () => void;
}

export function PositionsTable({ positions, currentPrices, onRefresh }: PositionsTableProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const closePosition = trpc.trading.closePosition.useMutation({
    onSuccess: () => {
      toast.success("✅ Position closed");
      setSelectedPosition(null);
      onRefresh?.();
    },
    onError: (error) => toast.error(`❌ Failed to close: ${error.message}`),
  });

  const handleClosePosition = (position: Position) => {
    closePosition.mutate({
      coin: position.coin,
      size: Math.abs(parseFloat(position.szi)),
    });
  };

  // Calculate current PNL
  const calculateCurrentPnl = (position: Position): { pnl: number; pnlPercent: number } => {
    const size = parseFloat(position.szi);
    const entryPrice = parseFloat(position.entryPx || "0");
    const currentPrice = parseFloat(currentPrices[position.coin] || "0");
    
    if (!currentPrice || !entryPrice) return { pnl: 0, pnlPercent: 0 };

    const pnl = size * (currentPrice - entryPrice);
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * Math.sign(size);

    return { pnl, pnlPercent };
  };

  if (!positions || positions.length === 0) {
    return (
      <Card className="bg-black border-gray-800 p-8">
        <div className="text-center text-gray-500">
          <div className="text-sm">No open positions</div>
          <div className="text-xs mt-1">Place an order to get started</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <span className="text-sm font-semibold text-white">Positions</span>
        <Badge variant="secondary" className="text-xs">
          {positions.length} open
        </Badge>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="text-left p-2 text-gray-400 font-medium">Coin</th>
              <th className="text-right p-2 text-gray-400 font-medium">Side</th>
              <th className="text-right p-2 text-gray-400 font-medium">Size</th>
              <th className="text-right p-2 text-gray-400 font-medium">Entry</th>
              <th className="text-right p-2 text-gray-400 font-medium">Mark</th>
              <th className="text-right p-2 text-gray-400 font-medium">Liq. Price</th>
              <th className="text-right p-2 text-gray-400 font-medium">PNL</th>
              <th className="text-right p-2 text-gray-400 font-medium">PNL %</th>
              <th className="text-right p-2 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position, idx) => {
              const size = parseFloat(position.szi);
              const isLong = size > 0;
              const { pnl, pnlPercent } = calculateCurrentPnl(position);
              const currentPrice = currentPrices[position.coin] || "0";

              return (
                <tr
                  key={idx}
                  className="border-b border-gray-800 hover:bg-gray-900/50 transition"
                >
                  <td className="p-2">
                    <span className="font-mono font-semibold text-white">
                      {position.coin}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-semibold",
                        isLong
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}
                    >
                      {isLong ? "LONG" : "SHORT"}
                    </Badge>
                  </td>
                  <td className="p-2 text-right text-white font-mono">
                    {Math.abs(size).toFixed(4)}
                  </td>
                  <td className="p-2 text-right text-gray-300 font-mono">
                    ${parseFloat(position.entryPx || "0").toFixed(2)}
                  </td>
                  <td className="p-2 text-right text-white font-mono">
                    ${parseFloat(currentPrice).toFixed(2)}
                  </td>
                  <td className="p-2 text-right text-yellow-500 font-mono">
                    {position.liquidationPx
                      ? `$${parseFloat(position.liquidationPx).toFixed(2)}`
                      : "-"}
                  </td>
                  <td
                    className={cn(
                      "p-2 text-right font-mono font-semibold",
                      pnl >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                  </td>
                  <td
                    className={cn(
                      "p-2 text-right font-mono font-semibold",
                      pnlPercent >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                  </td>
                  <td className="p-2 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Close
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Close Position?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Close {Math.abs(size).toFixed(4)} {position.coin} {isLong ? "LONG" : "SHORT"} at market price?
                            <div className="mt-2 p-2 bg-gray-800 rounded">
                              <div className="text-sm text-white">
                                Current PNL: <span className={cn("font-semibold", pnl >= 0 ? "text-green-500" : "text-red-500")}>
                                  {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ({pnl >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleClosePosition(position)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Close Position
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Total PNL: </span>
            <span
              className={cn(
                "font-mono font-semibold",
                positions.reduce((acc, p) => acc + calculateCurrentPnl(p).pnl, 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              ${positions.reduce((acc, p) => acc + calculateCurrentPnl(p).pnl, 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Positions: </span>
            <span className="text-white font-mono">{positions.length}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Margin Used: </span>
            <span className="text-white font-mono">
              ${positions.reduce((acc, p) => acc + parseFloat(p.marginUsed || "0"), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

