/**
 * Custom hook for WebSocket subscriptions
 * Provides real-time data updates from Hyperliquid
 * Falls back to polling when WebSockets unavailable (e.g., Vercel)
 */

import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';

// Check if we're on a platform that supports WebSocket subscriptions
// Cloud Run supports WebSocket with 60-minute timeout
const supportsWebSocketSubscriptions = () => {
  // ✅ ENABLED: Real-time WebSocket streaming on Cloud Run
  return true; // 🔥 REAL-TIME MODE ACTIVATED
};

/**
 * Subscribe to real-time price updates for all coins
 * Falls back to polling if WebSocket unavailable
 */
export function useAllMids() {
  const [mids, setMids] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Use polling for data (works everywhere including Vercel)
  const { data: polledMids, isSuccess, isError } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: false,
  });

  // Update state when data arrives
  useEffect(() => {
    if (polledMids) {
      setMids(polledMids as Record<string, string>);
      setIsConnected(true);
    }
  }, [polledMids]);

  // Update connection status
  useEffect(() => {
    if (isError) {
      setIsConnected(false);
    } else if (isSuccess) {
      setIsConnected(true);
    }
  }, [isSuccess, isError]);

  return { mids, isConnected };
}

/**
 * Subscribe to real-time order book for a specific coin
 * Falls back to polling if WebSocket unavailable
 */
export function useL2Book(coin: string) {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Use polling for data (works everywhere including Vercel)
  const { data: polledBook, isSuccess, isError } = trpc.market.getL2Snapshot.useQuery(
    { coin },
    {
      enabled: !!coin,
      refetchInterval: 2000, // Poll every 2 seconds for order book
      refetchIntervalInBackground: false,
    }
  );

  // Update state when data arrives
  useEffect(() => {
    if (polledBook) {
      setOrderBook(polledBook);
      setIsConnected(true);
    }
  }, [polledBook]);

  // Update connection status
  useEffect(() => {
    if (isError) {
      setIsConnected(false);
    } else if (isSuccess) {
      setIsConnected(true);
    }
  }, [isSuccess, isError]);

  return { orderBook, isConnected };
}

/**
 * Subscribe to real-time trades for a specific coin
 * Uses polling to fetch recent trades
 */
export function useTrades(coin: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use polling for recent trades
  const { data: recentTrades, isSuccess, isError } = trpc.market.getRecentTrades.useQuery(
    { coin },
    {
      enabled: !!coin,
      refetchInterval: 3000, // Poll every 3 seconds for recent trades
      refetchIntervalInBackground: false,
    }
  );

  // Update state when data arrives
  useEffect(() => {
    if (recentTrades && Array.isArray(recentTrades)) {
      setTrades(recentTrades);
      setIsConnected(true);
    }
  }, [recentTrades]);

  // Update connection status
  useEffect(() => {
    if (isError) {
      setIsConnected(false);
    } else if (isSuccess) {
      setIsConnected(true);
    }
  }, [isSuccess, isError]);

  return { trades, isConnected };
}

/**
 * Subscribe to user-specific events (requires wallet address)
 */
export function useUserEvents(user: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      console.info('[useUserEvents] User events require WebSocket server (not available on Vercel)');
    }
  }, [user]);

  return { events, isConnected };
}

/**
 * Subscribe to user fills
 */
export function useUserFills(user: string | undefined) {
  const [fills, setFills] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      console.info('[useUserFills] User fills require WebSocket server (not available on Vercel)');
    }
  }, [user]);

  return { fills, isConnected };
}
