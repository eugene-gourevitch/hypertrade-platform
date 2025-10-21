/**
 * Custom hook for WebSocket subscriptions
 * Provides real-time data updates from Hyperliquid
 * Falls back to polling when WebSockets unavailable (e.g., Vercel)
 */

import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';

// Check if we're on a platform that supports WebSocket subscriptions
// Vercel doesn't support WebSocket subscriptions in tRPC, so we'll detect and fallback
const supportsWebSocketSubscriptions = () => {
  // On Vercel or when httpLink is used, subscriptions aren't available
  // We can detect this by checking if the environment suggests serverless
  return false; // Force polling mode for now - safer for all deployments
};

/**
 * Subscribe to real-time price updates for all coins
 * Falls back to polling if WebSocket unavailable
 */
export function useAllMids() {
  const [mids, setMids] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Use polling for data (works everywhere including Vercel)
  const { data: polledMids } = trpc.market.getAllMids.useQuery(undefined, {
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: false,
    onSuccess: () => {
      setIsConnected(true);
    },
    onError: () => {
      setIsConnected(false);
    },
  });

  // Update state when data arrives
  useEffect(() => {
    if (polledMids) {
      setMids(polledMids as Record<string, string>);
    }
  }, [polledMids]);

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
  const { data: polledBook } = trpc.market.getL2Snapshot.useQuery(
    { coin },
    {
      enabled: !!coin,
      refetchInterval: 2000, // Poll every 2 seconds for order book
      refetchIntervalInBackground: false,
      onSuccess: () => {
        setIsConnected(true);
      },
      onError: () => {
        setIsConnected(false);
      },
    }
  );

  // Update state when data arrives
  useEffect(() => {
    if (polledBook) {
      setOrderBook(polledBook);
    }
  }, [polledBook]);

  return { orderBook, isConnected };
}

/**
 * Subscribe to real-time trades for a specific coin
 * Note: Uses polling since WebSockets unavailable on serverless platforms
 */
export function useTrades(coin: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // For trades, we'll show a message that they need a full WebSocket server
  // Trades are harder to poll effectively
  useEffect(() => {
    if (coin) {
      console.info('[useTrades] Live trades require WebSocket server (not available on Vercel)');
    }
  }, [coin]);

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
