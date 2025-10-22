/**
 * Performance Metrics Calculator
 * Calculates trading performance statistics
 */

import { Trade } from "@shared/types";

export interface PerformanceMetrics {
  // Overall stats
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage

  // P&L stats
  totalPnL: number;
  totalProfit: number;
  totalLoss: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number; // totalProfit / abs(totalLoss)

  // Risk metrics
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;

  // Trading stats
  averageTradeSize: number;
  totalVolume: number;

  // Time-based P&L
  dailyPnL: Array<{ date: string; pnl: number; cumulative: number }>;
  weeklyPnL: Array<{ date: string; pnl: number; cumulative: number }>;
  monthlyPnL: Array<{ date: string; pnl: number; cumulative: number }>;

  // By coin performance
  byCoin: Record<string, {
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

export function calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics {
  if (trades.length === 0) {
    return getEmptyMetrics();
  }

  // Filter completed trades with P&L data
  const completedTrades = trades.filter(t => t.pnl !== null && t.pnl !== undefined);

  if (completedTrades.length === 0) {
    return getEmptyMetrics();
  }

  // Overall stats
  const totalTrades = completedTrades.length;
  const winningTrades = completedTrades.filter(t => parseFloat(t.pnl!) > 0);
  const losingTrades = completedTrades.filter(t => parseFloat(t.pnl!) < 0);
  const winRate = (winningTrades.length / totalTrades) * 100;

  // P&L calculations
  const pnls = completedTrades.map(t => parseFloat(t.pnl!));
  const profits = winningTrades.map(t => parseFloat(t.pnl!));
  const losses = losingTrades.map(t => parseFloat(t.pnl!));

  const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
  const totalProfit = profits.reduce((sum, pnl) => sum + pnl, 0);
  const totalLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0));

  const averageWin = profits.length > 0 ? totalProfit / profits.length : 0;
  const averageLoss = losses.length > 0 ? totalLoss / losses.length : 0;
  const largestWin = profits.length > 0 ? Math.max(...profits) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses) : 0;

  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

  // Volume calculation
  const totalVolume = completedTrades.reduce((sum, trade) => {
    const size = parseFloat(trade.size || '0');
    const price = parseFloat(trade.price || trade.avgFillPrice || '0');
    return sum + (size * price);
  }, 0);

  const averageTradeSize = totalVolume / totalTrades;

  // Risk metrics
  const returns = pnls.map(pnl => pnl / averageTradeSize); // Normalize by trade size
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let cumulative = 0;

  for (const pnl of pnls) {
    cumulative += pnl;
    peak = Math.max(peak, cumulative);
    const drawdown = peak - cumulative;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  const maxDrawdownPercent = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  // Time-based P&L
  const dailyPnL = calculateTimePnL(completedTrades, 'daily');
  const weeklyPnL = calculateTimePnL(completedTrades, 'weekly');
  const monthlyPnL = calculateTimePnL(completedTrades, 'monthly');

  // By coin performance
  const byCoin: Record<string, { trades: number; pnl: number; winRate: number }> = {};

  completedTrades.forEach(trade => {
    if (!byCoin[trade.coin]) {
      byCoin[trade.coin] = { trades: 0, pnl: 0, winRate: 0 };
    }
    byCoin[trade.coin].trades++;
    byCoin[trade.coin].pnl += parseFloat(trade.pnl!);
  });

  // Calculate win rate per coin
  Object.keys(byCoin).forEach(coin => {
    const coinTrades = completedTrades.filter(t => t.coin === coin);
    const coinWins = coinTrades.filter(t => parseFloat(t.pnl!) > 0);
    byCoin[coin].winRate = (coinWins.length / coinTrades.length) * 100;
  });

  return {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    totalPnL,
    totalProfit,
    totalLoss,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPercent,
    averageTradeSize,
    totalVolume,
    dailyPnL,
    weeklyPnL,
    monthlyPnL,
    byCoin,
  };
}

function calculateTimePnL(
  trades: Trade[],
  period: 'daily' | 'weekly' | 'monthly'
): Array<{ date: string; pnl: number; cumulative: number }> {
  const grouped: Record<string, number> = {};

  trades.forEach(trade => {
    if (!trade.createdAt || !trade.pnl) return;

    const date = new Date(trade.createdAt);
    let key: string;

    if (period === 'daily') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (period === 'weekly') {
      const week = getWeekNumber(date);
      key = `${date.getFullYear()}-W${week}`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    grouped[key] = (grouped[key] || 0) + parseFloat(trade.pnl);
  });

  // Convert to array and add cumulative
  const result: Array<{ date: string; pnl: number; cumulative: number }> = [];
  let cumulative = 0;

  Object.keys(grouped)
    .sort()
    .forEach(key => {
      cumulative += grouped[key];
      result.push({
        date: key,
        pnl: grouped[key],
        cumulative,
      });
    });

  return result;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getEmptyMetrics(): PerformanceMetrics {
  return {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    totalProfit: 0,
    totalLoss: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    averageTradeSize: 0,
    totalVolume: 0,
    dailyPnL: [],
    weeklyPnL: [],
    monthlyPnL: [],
    byCoin: {},
  };
}
