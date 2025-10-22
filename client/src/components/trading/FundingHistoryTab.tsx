import { DollarSign } from "lucide-react";

interface FundingHistoryTabProps {
  userState: any;
}

export function FundingHistoryTab({ userState }: FundingHistoryTabProps) {
  const positions = userState?.assetPositions || [];

  // Extract funding data from positions
  const fundingData = positions
    .filter((pos: any) => {
      const funding = parseFloat(pos.position?.cumFunding?.sinceOpen || "0");
      return funding !== 0;
    })
    .map((pos: any) => ({
      coin: pos.position.coin,
      fundingSinceOpen: parseFloat(pos.position?.cumFunding?.sinceOpen || "0"),
      allTime: parseFloat(pos.position?.cumFunding?.allTime || "0"),
      size: parseFloat(pos.position?.szi || "0"),
    }));

  if (fundingData.length === 0) {
    return (
      <div className="py-12 text-center">
        <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No funding history</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Funding fees from your positions will appear here
        </p>
      </div>
    );
  }

  const totalFundingSinceOpen = fundingData.reduce((sum: number, item: any) => sum + item.fundingSinceOpen, 0);

  return (
    <div className="p-4">
      {/* Summary */}
      <div className="mb-6 bg-accent/20 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Funding (Since Open)</div>
            <div className={`text-2xl font-bold font-mono ${totalFundingSinceOpen <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalFundingSinceOpen > 0 ? '-' : totalFundingSinceOpen < 0 ? '+' : ''}${Math.abs(totalFundingSinceOpen).toFixed(4)}
            </div>
          </div>
          <DollarSign className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {totalFundingSinceOpen < 0 ? '🟢 You received funding' : totalFundingSinceOpen > 0 ? '🔴 You paid funding' : 'No funding fees'}
        </div>
      </div>

      {/* Position-wise Funding */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Funding by Position</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-accent/5">
                <th className="text-left py-3 px-3">Asset</th>
                <th className="text-right py-3 px-3">Position Size</th>
                <th className="text-right py-3 px-3">Since Open</th>
                <th className="text-right py-3 px-3">All Time</th>
                <th className="text-right py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {fundingData.map((item: any, idx: number) => {
                const isPaid = item.fundingSinceOpen > 0;
                const isLong = item.size > 0;

                return (
                  <tr
                    key={idx}
                    className="border-b border-border/50 hover:bg-accent/10 transition-colors"
                  >
                    <td className="py-3 px-3 font-semibold">{item.coin}</td>
                    <td className="text-right py-3 px-3 font-mono">
                      <span className={isLong ? "text-green-500" : "text-red-500"}>
                        {isLong ? "+" : ""}{item.size.toFixed(4)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-3 font-mono">
                      <span className={isPaid ? "text-red-400" : "text-green-400"}>
                        {isPaid ? '-' : '+'}${Math.abs(item.fundingSinceOpen).toFixed(4)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-3 font-mono text-muted-foreground">
                      ${Math.abs(item.allTime).toFixed(4)}
                    </td>
                    <td className="text-right py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isPaid ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                      }`}>
                        {isPaid ? "PAID" : "RECEIVED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="text-xs">
          <strong className="text-blue-400">About Funding:</strong>
          <p className="text-muted-foreground mt-1">
            Funding rates are periodic payments between longs and shorts. When funding is positive, longs pay shorts. When negative, shorts pay longs. Rates are determined by the perpetual-spot price difference.
          </p>
        </div>
      </div>
    </div>
  );
}
