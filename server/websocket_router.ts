/**
 * WebSocket tRPC Router
 * Provides real-time subscriptions for market data
 */

import { observable } from '@trpc/server/observable';
import { publicProcedure, router } from './_core/trpc';
import { hyperliquidWS } from './hyperliquid_websocket';
import { z } from 'zod';

export const websocketRouter = router({
  /**
   * Subscribe to real-time price updates for all coins
   */
  subscribeAllMids: publicProcedure.subscription(() => {
    return observable<Record<string, string>>((emit) => {
      const onAllMids = (data: Record<string, string>) => {
        emit.next(data);
      };

      // Subscribe to WebSocket events
      hyperliquidWS.on('allMids', onAllMids);
      
      // Ensure WebSocket is subscribed
      if (hyperliquidWS.isConnected()) {
        hyperliquidWS.subscribeAllMids();
      }

      // Cleanup on unsubscribe
      return () => {
        hyperliquidWS.off('allMids', onAllMids);
      };
    });
  }),

  /**
   * Subscribe to real-time order book for a specific coin
   */
  subscribeL2Book: publicProcedure
    .input(z.object({ coin: z.string() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const onL2Book = (data: any) => {
          // Only emit if it's for the requested coin
          if (data.coin === input.coin) {
            emit.next(data);
          }
        };

        hyperliquidWS.on('l2Book', onL2Book);
        
        if (hyperliquidWS.isConnected()) {
          hyperliquidWS.subscribeL2Book(input.coin);
        }

        return () => {
          hyperliquidWS.off('l2Book', onL2Book);
          hyperliquidWS.unsubscribe({ type: 'l2Book', coin: input.coin });
        };
      });
    }),

  /**
   * Subscribe to real-time trades for a specific coin
   */
  subscribeTrades: publicProcedure
    .input(z.object({ coin: z.string() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const onTrades = (data: any) => {
          if (data.coin === input.coin) {
            emit.next(data);
          }
        };

        hyperliquidWS.on('trades', onTrades);
        
        if (hyperliquidWS.isConnected()) {
          hyperliquidWS.subscribeTrades(input.coin);
        }

        return () => {
          hyperliquidWS.off('trades', onTrades);
          hyperliquidWS.unsubscribe({ type: 'trades', coin: input.coin });
        };
      });
    }),

  /**
   * Subscribe to user-specific events (fills, liquidations, etc)
   */
  subscribeUser: publicProcedure
    .input(z.object({ user: z.string() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const onUser = (data: any) => {
          emit.next(data);
        };

        hyperliquidWS.on('user', onUser);
        
        if (hyperliquidWS.isConnected()) {
          hyperliquidWS.subscribeUser(input.user);
        }

        return () => {
          hyperliquidWS.off('user', onUser);
          hyperliquidWS.unsubscribe({ type: 'user', user: input.user });
        };
      });
    }),

  /**
   * Subscribe to user fills
   */
  subscribeUserFills: publicProcedure
    .input(z.object({ user: z.string() }))
    .subscription(({ input }) => {
      return observable<any>((emit) => {
        const onUserFills = (data: any) => {
          emit.next(data);
        };

        hyperliquidWS.on('userFills', onUserFills);
        
        if (hyperliquidWS.isConnected()) {
          hyperliquidWS.subscribeUserFills(input.user);
        }

        return () => {
          hyperliquidWS.off('userFills', onUserFills);
          hyperliquidWS.unsubscribe({ type: 'userFills', user: input.user });
        };
      });
    }),
});

