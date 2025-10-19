/**
 * Custom TradingView datafeed for Hyperliquid real-time data
 */

import { trpc } from "./trpc";

const INTERVAL_MAP: Record<string, string> = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "240": "4h",
  "1D": "1d",
};

export function createHyperliquidDatafeed(trpcClient: ReturnType<typeof trpc.useUtils>) {
  return {
    onReady: (callback: any) => {
      setTimeout(() => {
        callback({
          supported_resolutions: ["1", "3", "5", "15", "30", "60", "240", "1D"],
          supports_marks: false,
          supports_timescale_marks: false,
          supports_time: true,
        });
      }, 0);
    },

    searchSymbols: (userInput: string, exchange: string, symbolType: string, onResult: any) => {
      // Simple search - just return common Hyperliquid coins
      const symbols = ["BTC", "ETH", "SOL", "HYPE", "ASTER", "ARB", "AVAX", "MATIC"];
      const results = symbols
        .filter((s) => s.includes(userInput.toUpperCase()))
        .map((symbol) => ({
          symbol,
          full_name: `HYPERLIQUID:${symbol}USDC`,
          description: `${symbol}/USDC`,
          exchange: "HYPERLIQUID",
          type: "crypto",
        }));
      onResult(results);
    },

    resolveSymbol: (symbolName: string, onResolve: any, onError: any) => {
      // Extract coin from symbol (e.g., "BTC" from "HYPERLIQUID:BTCUSDC")
      const coin = symbolName.replace("HYPERLIQUID:", "").replace("USDC", "");
      
      const symbolInfo = {
        name: coin,
        full_name: `HYPERLIQUID:${coin}USDC`,
        description: `${coin}/USDC`,
        type: "crypto",
        session: "24x7",
        exchange: "HYPERLIQUID",
        listed_exchange: "HYPERLIQUID",
        timezone: "Etc/UTC",
        format: "price",
        pricescale: 100,
        minmov: 1,
        has_intraday: true,
        has_daily: true,
        has_weekly_and_monthly: false,
        supported_resolutions: ["1", "3", "5", "15", "30", "60", "240", "1D"],
        volume_precision: 8,
        data_status: "streaming",
      };

      setTimeout(() => onResolve(symbolInfo), 0);
    },

    getBars: async (
      symbolInfo: any,
      resolution: string,
      periodParams: any,
      onResult: any,
      onError: any
    ) => {
      try {
        const coin = symbolInfo.name;
        const interval = INTERVAL_MAP[resolution] || "1h";
        const { from, to, firstDataRequest } = periodParams;

        // Convert seconds to milliseconds
        const startTime = from * 1000;
        const endTime = to * 1000;

        // Fetch candles from Hyperliquid
        const candles = await trpcClient.client.market.getCandlesSnapshot.query({
          coin,
          interval,
          startTime,
          endTime,
        });

        if (!candles || candles.length === 0) {
          onResult([], { noData: true });
          return;
        }

        // Transform to TradingView format
        const bars = candles.map((candle: any) => ({
          time: candle.t, // Already in milliseconds
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
          volume: parseFloat(candle.v),
        }));

        onResult(bars, { noData: false });
      } catch (error) {
        console.error("[Hyperliquid Datafeed] Error fetching bars:", error);
        onError(error);
      }
    },

    subscribeBars: (
      symbolInfo: any,
      resolution: string,
      onTick: any,
      listenerGuid: string,
      onResetCacheNeededCallback: any
    ) => {
      // For now, we'll use polling. WebSocket support can be added later.
      console.log("[Hyperliquid Datafeed] Subscribe bars:", symbolInfo.name, resolution);
    },

    unsubscribeBars: (listenerGuid: string) => {
      console.log("[Hyperliquid Datafeed] Unsubscribe bars:", listenerGuid);
    },
  };
}

