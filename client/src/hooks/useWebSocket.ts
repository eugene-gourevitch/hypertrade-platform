/**
 * Custom hook for WebSocket subscriptions
 * Provides real-time data updates from Hyperliquid
 */

import { trpc } from '@/lib/trpc';
import { useEffect, useState } from 'react';

/**
 * Subscribe to real-time price updates for all coins
 */
export function useAllMids() {
  const [mids, setMids] = useState<Record<string, string>>({});
  const [isConnected, setIsConnected] = useState(false);

  trpc.ws.subscribeAllMids.useSubscription(undefined, {
    onData: (data) => {
      setMids(data);
      setIsConnected(true);
    },
    onError: (error) => {
      console.error('[useAllMids] Error:', error);
      setIsConnected(false);
    },
  });

  return { mids, isConnected };
}

/**
 * Subscribe to real-time order book for a specific coin
 */
export function useL2Book(coin: string) {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  trpc.ws.subscribeL2Book.useSubscription(
    { coin },
    {
      enabled: !!coin,
      onData: (data) => {
        setOrderBook(data);
        setIsConnected(true);
      },
      onError: (error) => {
        console.error('[useL2Book] Error:', error);
        setIsConnected(false);
      },
    }
  );

  return { orderBook, isConnected };
}

/**
 * Subscribe to real-time trades for a specific coin
 */
export function useTrades(coin: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  trpc.ws.subscribeTrades.useSubscription(
    { coin },
    {
      enabled: !!coin,
      onData: (data) => {
        // Append new trades to the list
        setTrades((prev) => [data, ...prev].slice(0, 100)); // Keep last 100 trades
        setIsConnected(true);
      },
      onError: (error) => {
        console.error('[useTrades] Error:', error);
        setIsConnected(false);
      },
    }
  );

  return { trades, isConnected };
}

/**
 * Subscribe to user-specific events (requires wallet address)
 */
export function useUserEvents(user: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  trpc.ws.subscribeUser.useSubscription(
    { user: user || '' },
    {
      enabled: !!user,
      onData: (data) => {
        setEvents((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 events
        setIsConnected(true);
      },
      onError: (error) => {
        console.error('[useUserEvents] Error:', error);
        setIsConnected(false);
      },
    }
  );

  return { events, isConnected };
}

/**
 * Subscribe to user fills
 */
export function useUserFills(user: string | undefined) {
  const [fills, setFills] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  trpc.ws.subscribeUserFills.useSubscription(
    { user: user || '' },
    {
      enabled: !!user,
      onData: (data) => {
        setFills((prev) => [data, ...prev].slice(0, 100)); // Keep last 100 fills
        setIsConnected(true);
      },
      onError: (error) => {
        console.error('[useUserFills] Error:', error);
        setIsConnected(false);
      },
    }
  );

  return { fills, isConnected };
}

