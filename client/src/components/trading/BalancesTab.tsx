import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface BalancesTabProps {
  userState: any;
  mids: Record<string, string> | undefined;
}

export function BalancesTab({ userState, mids }: BalancesTabProps) {
  if (!userState) {
    return (
      <div className="py-12 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No balance data available</p>
      </div>
    );
  }

  const accountValue = userState?.marginSummary?.accountValue || userState?.crossMarginSummary?.accountValue || "0";
  const withdrawable = userState?.withdrawable || "0";
  const totalMarginUsed = userState?.marginSummary?.totalMarginUsed || "0";
  const totalNtlPos = userState?.marginSummary?.totalNtlPos || "0";

  // Calculate metrics
  const accountValueNum = parseFloat(accountValue);
  const marginUsedNum = parseFloat(totalMarginUsed);
  const withdrawableNum = parseFloat(withdrawable);
  const ntlPosNum = parseFloat(totalNtlPos);

  const accountLeverage = accountValueNum > 0 ? ntlPosNum / accountValueNum : 0;
  const crossMarginRatio = accountValueNum > 0 ? (marginUsedNum / accountValueNum) * 100 : 0;

  // Calculate total unrealized PNL
  const positions = userState?.assetPositions || [];
  const totalUnrealizedPnl = positions.reduce((sum: number, pos: any) => {
    return sum + parseFloat(pos.position?.unrealizedPnl || "0");
  }, 0);

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="bg-accent/20 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total Balance</span>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">${accountValueNum.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Account Value</div>
        </div>

        {/* Available Balance */}
        <div className="bg-accent/20 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Available</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-green-500">${withdrawableNum.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">Withdrawable</div>
        </div>

        {/* Unrealized PNL */}
        <div className="bg-accent/20 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Unrealized PNL</span>
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className={`text-2xl font-bold font-mono ${totalUnrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">From open positions</div>
        </div>

        {/* Margin Used */}
        <div className="bg-accent/20 rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Margin Used</span>
            <span className={`text-xs font-semibold ${crossMarginRatio > 80 ? 'text-red-500' : crossMarginRatio > 50 ? 'text-yellow-500' : 'text-green-500'}`}>
              {crossMarginRatio.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono">${marginUsedNum.toFixed(2)}</div>
          <div className="text-xs text-cyan-400 mt-1">{accountLeverage.toFixed(2)}x Leverage</div>
        </div>
      </div>

      {/* Position Details */}
      {positions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Position Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right py-2">Size</th>
                  <th className="text-right py-2">Notional Value</th>
                  <th className="text-right py-2">Unrealized PNL</th>
                  <th className="text-right py-2">Margin</th>
                  <th className="text-right py-2">Leverage</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos: any, idx: number) => {
                  const position = pos.position;
                  const size = parseFloat(position.szi || "0");
                  const pnl = parseFloat(position.unrealizedPnl || "0");
                  const positionValue = parseFloat(position.positionValue || "0");
                  const marginUsed = parseFloat((position as any).marginUsed || "0");
                  const leverage = position.leverage?.value || 1;

                  return (
                    <tr key={idx} className="border-b border-border/50 hover:bg-accent/10">
                      <td className="py-3">{position.coin}</td>
                      <td className="text-right font-mono">
                        <span className={size > 0 ? "text-green-500" : "text-red-500"}>
                          {size > 0 ? "+" : ""}{size.toFixed(4)}
                        </span>
                      </td>
                      <td className="text-right font-mono">${positionValue.toFixed(2)}</td>
                      <td className="text-right font-mono">
                        <span className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-right font-mono">${marginUsed.toFixed(2)}</td>
                      <td className="text-right font-mono text-cyan-400">{leverage}x</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
