import { History } from "lucide-react";

interface OrderHistoryTabProps {
  userFills: any[] | undefined;
}

export function OrderHistoryTab({ userFills }: OrderHistoryTabProps) {
  if (!userFills || userFills.length === 0) {
    return (
      <div className="py-12 text-center">
        <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No order history</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Your executed orders will appear here
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
            <th className="text-right py-3 px-3">Fee</th>
            <th className="text-right py-3 px-3">Total</th>
            <th className="text-left py-3 px-3">Type</th>
          </tr>
        </thead>
        <tbody>
          {userFills.slice(0, 50).map((fill: any, idx: number) => {
            const isBuy = fill.side === "B";
            const price = parseFloat(fill.px);
            const size = parseFloat(fill.sz);
            const fee = parseFloat(fill.fee || "0");
            const total = price * size;
            const timestamp = new Date(fill.time).toLocaleString();

            return (
              <tr
                key={idx}
                className="border-b border-border/50 hover:bg-accent/10 transition-colors"
              >
                <td className="py-3 px-3 text-muted-foreground font-mono text-[10px]">
                  {timestamp}
                </td>
                <td className="py-3 px-3 font-semibold">{fill.coin}</td>
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
                <td className="py-3 px-3 text-right font-mono">${price.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-mono">{size.toFixed(4)}</td>
                <td className="py-3 px-3 text-right font-mono text-red-400">
                  ${Math.abs(fee).toFixed(4)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold">
                  ${total.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  {fill.closedPnl ? "Close" : "Open"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
