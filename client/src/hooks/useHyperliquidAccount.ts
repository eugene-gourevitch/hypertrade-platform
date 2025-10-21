/**
 * Client-side hook to fetch Hyperliquid account data
 * Works without backend server (Vercel compatible)
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const HYPERLIQUID_API_URL = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true"
  ? "https://api.hyperliquid-testnet.xyz"
  : "https://api.hyperliquid.xyz";

export function useHyperliquidAccount(options?: { refetchInterval?: number }) {
  const { user } = useAuth();
  const [userState, setUserState] = useState<any>(null);
  const [openOrders, setOpenOrders] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccountData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user state (positions, balance, etc.)
      const stateRes = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: user.id,
        }),
      });

      if (!stateRes.ok) {
        throw new Error(`Failed to fetch user state: ${stateRes.statusText}`);
      }

      const state = await stateRes.json();
      setUserState(state);

      // Fetch open orders
      const ordersRes = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "openOrders",
          user: user.id,
        }),
      });

      if (!ordersRes.ok) {
        throw new Error(`Failed to fetch open orders: ${ordersRes.statusText}`);
      }

      const orders = await ordersRes.json();
      setOpenOrders(orders);

      setError(null);
    } catch (err: any) {
      console.error("[useHyperliquidAccount] Error:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAccountData();
  }, [user?.id]);

  // Polling
  useEffect(() => {
    if (!options?.refetchInterval) return;

    const interval = setInterval(fetchAccountData, options.refetchInterval);
    return () => clearInterval(interval);
  }, [user?.id, options?.refetchInterval]);

  return {
    userState,
    openOrders,
    isLoading,
    error,
    refetch: fetchAccountData,
  };
}

/**
 * Hook to fetch market metadata
 */
export function useHyperliquidMeta() {
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(`${HYPERLIQUID_API_URL}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "meta" }),
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch meta: ${res.statusText}`);
        }

        const data = await res.json();
        setMeta(data);
      } catch (err) {
        console.error("[useHyperliquidMeta] Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeta();
  }, []);

  return { meta, isLoading };
}

/**
 * Hook to fetch all mid prices
 */
export function useHyperliquidMids(options?: { refetchInterval?: number }) {
  const [mids, setMids] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (err) {
      console.error("[useHyperliquidMids] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMids();
  }, []);

  useEffect(() => {
    if (!options?.refetchInterval) return;

    const interval = setInterval(fetchMids, options.refetchInterval);
    return () => clearInterval(interval);
  }, [options?.refetchInterval]);

  return { mids, isLoading, refetch: fetchMids };
}
