import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { websocketRouter } from "./websocket_router";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as hyperliquid from "./hyperliquid"; // TODO: Migrate remaining functions to persistent daemon
import * as hyperliquidPersistent from "./hyperliquid_persistent";
import * as hyperliquidHTTP from "./hyperliquid_http"; // HTTP-only fallback (works everywhere)
import * as db from "./db";
import { randomBytes } from "crypto";

export const appRouter = router({
  system: systemRouter,
  ws: websocketRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Market data endpoints (public)
  market: router({
    getMeta: publicProcedure.query(async () => {
      try {
        return await hyperliquidPersistent.getMeta();
      } catch (error: any) {
        // Fallback to HTTP-only API (no Python required)
        console.warn('[Market] Daemon failed, using HTTP fallback:', error.message);
        return await hyperliquidHTTP.getMeta();
      }
    }),

    getAllMids: publicProcedure.query(async () => {
      try {
        return await hyperliquidPersistent.getAllMids();
      } catch (error: any) {
        // Fallback to HTTP-only API (no Python required)
        console.warn('[Market] Daemon failed, using HTTP fallback:', error.message);
        return await hyperliquidHTTP.getAllMids();
      }
    }),

    getL2Snapshot: publicProcedure
      .input(z.object({ coin: z.string() }))
      .query(async ({ input }) => {
        try {
          return await hyperliquidPersistent.getL2Snapshot(input.coin);
        } catch (error: any) {
          console.warn('[Market] Daemon failed, using HTTP fallback:', error.message);
          return await hyperliquidHTTP.getL2Snapshot(input.coin);
        }
      }),

    getCandlesSnapshot: publicProcedure
      .input(
        z.object({
          coin: z.string(),
          interval: z.string().default("1m"),
          startTime: z.number().optional(),
          endTime: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const now = Date.now();
        const startTime = input.startTime || (now - 24 * 60 * 60 * 1000);
        const endTime = input.endTime || now;
        return await hyperliquidPersistent.getCandles(
          input.coin,
          input.interval,
          startTime,
          endTime
        );
      }),


  }),

  // Account endpoints (protected)
  account: router({
    getUserState: protectedProcedure.query(async ({ ctx }) => {
      // Use the connected wallet address to fetch positions
      try {
        return await hyperliquidPersistent.getUserState(ctx.user.id);
      } catch (error: any) {
        console.warn('[Account] Daemon failed, using HTTP fallback:', error.message);
        return await hyperliquidHTTP.getUserState(ctx.user.id);
      }
    }),

    getOpenOrders: protectedProcedure.query(async ({ ctx }) => {
      // Use the connected wallet address to fetch open orders
      try {
        return await hyperliquidPersistent.getOpenOrders(ctx.user.id);
      } catch (error: any) {
        console.warn('[Account] Daemon failed, using HTTP fallback:', error.message);
        return await hyperliquidHTTP.getOpenOrders(ctx.user.id);
      }
    }),

    getUserFills: protectedProcedure.query(async ({ ctx }) => {
      // Use the connected wallet address to fetch trade fills
      return await hyperliquidPersistent.getUserFills(ctx.user.id);
    }),

    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getUserSettings(ctx.user.id);
      return settings || {
        userId: ctx.user.id,
        defaultLeverage: "1",
        defaultSlippage: "0.05",
        favoriteCoins: null,
        theme: "dark",
      };
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          defaultLeverage: z.string().optional(),
          defaultSlippage: z.string().optional(),
          favoriteCoins: z.string().optional(),
          theme: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.upsertUserSettings({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    getTrades: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserTrades(ctx.user.id, input.limit);
      }),
  }),

  // Trading endpoints (protected)
  trading: router({
    placeMarketOrder: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          isBuy: z.boolean(),
          size: z.number(),
          slippage: z.number().default(0.05),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await hyperliquid.placeMarketOrder(
          input.coin,
          input.isBuy,
          input.size,
          input.slippage
        );

        // Save trade to database
        const tradeId = randomBytes(16).toString("hex");
        await db.saveTrade({
          id: tradeId,
          userId: ctx.user.id,
          coin: input.coin,
          side: input.isBuy ? "buy" : "sell",
          size: input.size.toString(),
          price: "0",
          orderType: "market",
          status: result.status,
          oid: result.response?.data?.statuses?.[0]?.resting?.oid?.toString(),
          filledSize: result.response?.data?.statuses?.[0]?.filled?.totalSz,
          avgFillPrice: result.response?.data?.statuses?.[0]?.filled?.avgPx,
        });

        return result;
      }),

    placeLimitOrder: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          isBuy: z.boolean(),
          size: z.number(),
          price: z.number(),
          reduceOnly: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await hyperliquid.placeLimitOrder(
          input.coin,
          input.isBuy,
          input.size,
          input.price,
          input.reduceOnly
        );

        // Save trade to database
        const tradeId = randomBytes(16).toString("hex");
        await db.saveTrade({
          id: tradeId,
          userId: ctx.user.id,
          coin: input.coin,
          side: input.isBuy ? "buy" : "sell",
          size: input.size.toString(),
          price: input.price.toString(),
          orderType: "limit",
          status: result.status,
          oid: result.response?.data?.statuses?.[0]?.resting?.oid?.toString(),
          filledSize: result.response?.data?.statuses?.[0]?.filled?.totalSz,
          avgFillPrice: result.response?.data?.statuses?.[0]?.filled?.avgPx,
        });

        return result;
      }),

    cancelOrder: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          oid: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquidPersistent.cancelOrder(input.coin, input.oid);
      }),

    cancelAllOrders: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquidPersistent.cancelAllOrders(input.coin);
      }),

    closePosition: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          size: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquidPersistent.closePosition(input.coin, input.size);
      }),

    updateLeverage: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          leverage: z.number(),
          isCross: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.updateLeverage(
          input.coin,
          input.leverage,
          input.isCross
        );
      }),

    placeStopLoss: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          isBuy: z.boolean(),
          size: z.number(),
          triggerPrice: z.number(),
          limitPrice: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.placeStopLossOrder(
          input.coin,
          input.isBuy,
          input.size,
          input.triggerPrice,
          input.limitPrice
        );
      }),

    placeTakeProfit: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          isBuy: z.boolean(),
          size: z.number(),
          triggerPrice: z.number(),
          limitPrice: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.placeTakeProfitOrder(
          input.coin,
          input.isBuy,
          input.size,
          input.triggerPrice,
          input.limitPrice
        );
      }),

    placeBracketOrder: protectedProcedure
      .input(
        z.object({
          coin: z.string(),
          isBuy: z.boolean(),
          size: z.number(),
          entryPrice: z.number(),
          stopLossPrice: z.number(),
          takeProfitPrice: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.placeBracketOrder(
          input.coin,
          input.isBuy,
          input.size,
          input.entryPrice,
          input.stopLossPrice,
          input.takeProfitPrice
        );
      }),
  }),

  transfer: router({
    usdTransfer: protectedProcedure
      .input(
        z.object({
          destination: z.string(),
          amount: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.usdTransfer(
          input.destination,
          input.amount
        );
      }),

    spotTransfer: protectedProcedure
      .input(
        z.object({
          destination: z.string(),
          token: z.string(),
          amount: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.spotTransfer(
          input.destination,
          input.token,
          input.amount
        );
      }),

    withdrawFromBridge: protectedProcedure
      .input(
        z.object({
          destination: z.string(),
          amount: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.withdrawFromBridge(
          input.destination,
          input.amount
        );
      }),

    getSpotBalances: protectedProcedure.query(async ({ ctx }) => {
      return await hyperliquid.getSpotBalances();
    }),
  }),
});

export type AppRouter = typeof appRouter;
