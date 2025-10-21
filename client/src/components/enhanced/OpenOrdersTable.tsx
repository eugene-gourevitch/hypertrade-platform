/**
 * Open Orders Table Component
 * Real-time order management
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
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { toast } from "sonner";
import { X, XCircle } from "lucide-react";

interface OpenOrder {
  coin: string;
  side: "buy" | "sell";
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  orderType?: string;
}

interface OpenOrdersTableProps {
  orders: OpenOrder[];
  currentPrices: Record<string, string>;
  onRefresh?: () => void;
}

export function OpenOrdersTable({ orders, currentPrices, onRefresh }: OpenOrdersTableProps) {
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const hyperliquid = useHyperliquid();

  const handleCancelOrder = async (coin: string, oid: number) => {
    try {
      await hyperliquid.cancelOrder({ coin, oid });
      onRefresh?.();
    } catch (error) {
      // Error already handled in hook
      console.error("Cancel order error:", error);
    }
  };

  const handleCancelAll = async (coin: string) => {
    try {
      await hyperliquid.cancelAllOrders(coin);
      setSelectedCoin(null);
      onRefresh?.();
    } catch (error) {
      // Error already handled in hook
      console.error("Cancel all error:", error);
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <Card className="bg-black border-gray-800 p-8">
        <div className="text-center text-gray-500">
          <div className="text-sm">No open orders</div>
          <div className="text-xs mt-1">Place an order to get started</div>
        </div>
      </Card>
    );
  }

  // Group orders by coin
  const ordersByCoin = orders.reduce((acc, order) => {
    if (!acc[order.coin]) acc[order.coin] = [];
    acc[order.coin].push(order);
    return acc;
  }, {} as Record<string, OpenOrder[]>);

  return (
    <Card className="bg-black border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <span className="text-sm font-semibold text-white">Open Orders</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {orders.length} orders
          </Badge>
          {Object.keys(ordersByCoin).length === 1 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => setSelectedCoin(Object.keys(ordersByCoin)[0])}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Cancel All Orders?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Cancel all {orders.length} open orders for {selectedCoin}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                    No, Keep Orders
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => selectedCoin && handleCancelAll(selectedCoin)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Yes, Cancel All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              <th className="text-left p-2 text-gray-400 font-medium">Coin</th>
              <th className="text-right p-2 text-gray-400 font-medium">Side</th>
              <th className="text-right p-2 text-gray-400 font-medium">Size</th>
              <th className="text-right p-2 text-gray-400 font-medium">Limit Price</th>
              <th className="text-right p-2 text-gray-400 font-medium">Mark Price</th>
              <th className="text-right p-2 text-gray-400 font-medium">Filled</th>
              <th className="text-right p-2 text-gray-400 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const isBuy = order.side === "buy";
              const currentPrice = currentPrices[order.coin] || "0";
              const priceDistance = ((parseFloat(order.limitPx) - parseFloat(currentPrice)) / parseFloat(currentPrice)) * 100;

              return (
                <tr
                  key={idx}
                  className="border-b border-gray-800 hover:bg-gray-900/50 transition"
                >
                  <td className="p-2">
                    <span className="font-mono font-semibold text-white">
                      {order.coin}
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs font-semibold",
                        isBuy
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      )}
                    >
                      {isBuy ? "BUY" : "SELL"}
                    </Badge>
                  </td>
                  <td className="p-2 text-right text-white font-mono">
                    {parseFloat(order.sz).toFixed(4)}
                  </td>
                  <td className="p-2 text-right text-white font-mono">
                    ${parseFloat(order.limitPx).toFixed(2)}
                  </td>
                  <td className="p-2 text-right text-gray-300 font-mono">
                    ${parseFloat(currentPrice).toFixed(2)}
                  </td>
                  <td className="p-2 text-right">
                    <span
                      className={cn(
                        "font-mono",
                        Math.abs(priceDistance) < 1
                          ? "text-yellow-500"
                          : "text-gray-500"
                      )}
                    >
                      {priceDistance > 0 ? "+" : ""}{priceDistance.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-2 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            Cancel Order?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-400">
                            Cancel {order.side.toUpperCase()} order for {parseFloat(order.sz).toFixed(4)} {order.coin} at ${parseFloat(order.limitPx).toFixed(2)}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
                            No
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelOrder(order.coin, order.oid)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Yes, Cancel
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
    </Card>
  );
}

