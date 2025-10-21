import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";

interface OpenOrdersTabProps {
  openOrders: any[] | undefined;
  onCancelOrder: (coin: string, oid: number) => void;
  isLoading?: boolean;
}

export function OpenOrdersTab({ openOrders, onCancelOrder, isLoading }: OpenOrdersTabProps) {
  if (!openOrders || openOrders.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No open orders</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Place an order to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground bg-accent/5">
            <th className="text-left py-3 px-3">Time</th>
            <th className="text-left py-3 px-3">Coin</th>
            <th className="text-left py-3 px-3">Side</th>
            <th className="text-right py-3 px-3">Price</th>
            <th className="text-right py-3 px-3">Size</th>
            <th className="text-right py-3 px-3">Filled</th>
            <th className="text-right py-3 px-3">Type</th>
            <th className="text-center py-3 px-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {openOrders.map((order: any) => {
            const isBuy = order.side === "B";
            const filled = parseFloat(order.szDecimals || "0") - parseFloat(order.remainingSz || order.szDecimals || "0");
            const total = parseFloat(order.szDecimals || "0");
            const fillPercent = total > 0 ? (filled / total) * 100 : 0;
            const timestamp = order.timestamp ? new Date(order.timestamp).toLocaleString() : "—";

            return (
              <tr
                key={order.oid}
                className="border-b border-border/50 hover:bg-accent/10 transition-colors"
              >
                <td className="py-3 px-3 text-muted-foreground font-mono text-[10px]">
                  {timestamp}
                </td>
                <td className="py-3 px-3 font-semibold">{order.coin}</td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      isBuy
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ${parseFloat(order.limitPx).toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right font-mono">{order.sz}</td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isBuy ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                    <span className="font-mono">{fillPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  <span className="text-muted-foreground">
                    {order.orderType || "Limit"}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onCancelOrder(order.coin, order.oid)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
