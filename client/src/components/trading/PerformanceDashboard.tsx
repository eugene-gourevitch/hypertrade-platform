import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Target, Award, DollarSign, BarChart3 } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function PerformanceDashboard() {
  const { data: metrics, isLoading } = trpc.account.getPerformanceMetrics.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">Loading performance metrics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.totalTrades === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <div className="text-muted-foreground">No trading history yet</div>
          <div className="text-sm text-muted-foreground/70 mt-2">
            Start trading to see your performance metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfitable = metrics.totalPnL > 0;

  return (
    <div className="space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total P&L */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
              {isProfitable ? '+' : ''}${metrics.totalPnL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.totalTrades} trades
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winningTrades}W / {metrics.losingTrades}L
            </p>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.profitFactor > 2 ? 'Excellent' : metrics.profitFactor > 1.5 ? 'Good' : metrics.profitFactor > 1 ? 'Fair' : 'Poor'}
            </p>
          </CardContent>
        </Card>

        {/* Sharpe Ratio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sharpe Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Risk-adjusted return
            </p>
          </CardContent>
        </Card>
      </div>

      {/* P&L Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative P&L</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metrics.dailyPnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={isProfitable ? '#10b981' : '#ef4444'}
                fill={isProfitable ? '#10b98133' : '#ef444433'}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Win/Loss Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Win/Loss Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Win</span>
              <span className="text-sm font-medium text-green-500">
                +${metrics.averageWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Loss</span>
              <span className="text-sm font-medium text-red-500">
                -${metrics.averageLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Win</span>
              <span className="text-sm font-medium text-green-500">
                +${metrics.largestWin.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Loss</span>
              <span className="text-sm font-medium text-red-500">
                ${metrics.largestLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Total Volume</span>
              <span className="text-sm font-medium">
                ${metrics.totalVolume.toFixed(0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* By Coin Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Coin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.byCoin)
                .sort(([, a], [, b]) => b.pnl - a.pnl)
                .slice(0, 5)
                .map(([coin, stats]) => (
                  <div key={coin} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{coin}</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.trades} trades • {stats.winRate.toFixed(1)}% WR
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${stats.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stats.pnl > 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Max Drawdown</span>
            <span className="text-sm font-medium text-red-500">
              -${metrics.maxDrawdown.toFixed(2)} ({metrics.maxDrawdownPercent.toFixed(2)}%)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Trade Size</span>
            <span className="text-sm font-medium">
              ${metrics.averageTradeSize.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
