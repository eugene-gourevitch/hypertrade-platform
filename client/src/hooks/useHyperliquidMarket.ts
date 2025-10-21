/**
 * Direct Hyperliquid market data hooks
 * No backend server required - works standalone
 */

import { useState, useEffect } from "react";

const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz";

/**
 * Hook to fetch L2 order book directly from Hyperliquid
 */
export function useL2BookDirect(coin: string) {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!coin) return;

    const fetchOrderBook = async () => {
      try {
        const res = await fetch(`${HYPERLIQUID_API_URL}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "l2Book",
            coin,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch order book: ${res.statusText}`);
        }

        const data = await res.json();
        setOrderBook(data);
        setIsConnected(true);
      } catch (err) {
        console.error("[useL2BookDirect] Error:", err);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchOrderBook();

    // Poll every 2 seconds
    const interval = setInterval(fetchOrderBook, 2000);

    return () => clearInterval(interval);
  }, [coin]);

  return { orderBook, isConnected };
}

/**
 * Hook to fetch recent trades directly from Hyperliquid
 */
export function useTradesDirect(coin: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!coin) return;

    const fetchTrades = async () => {
      try {
        const res = await fetch(`${HYPERLIQUID_API_URL}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "recentTrades",
            coin,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch trades: ${res.statusText}`);
        }

        const data = await res.json();
        setTrades(Array.isArray(data) ? data : []);
        setIsConnected(true);
      } catch (err) {
        console.error("[useTradesDirect] Error:", err);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchTrades();

    // Poll every 3 seconds
    const interval = setInterval(fetchTrades, 3000);

    return () => clearInterval(interval);
  }, [coin]);

  return { trades, isConnected };
}

/**
 * Hook to fetch all mids directly from Hyperliquid
 */
export function useAllMidsDirect() {
  const [mids, setMids] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchMids = async () => {
      try {
        const res = await fetch(`${HYPERLIQUID_API_URL}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "allMids" }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch mids: ${res.statusText}`);
        }

        const data = await res.json();
        setMids(data);
        setIsConnected(true);
      } catch (err) {
        console.error("[useAllMidsDirect] Error:", err);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchMids();

    // Poll every 3 seconds
    const interval = setInterval(fetchMids, 3000);

    return () => clearInterval(interval);
  }, []);

  return { mids, isConnected };
}
