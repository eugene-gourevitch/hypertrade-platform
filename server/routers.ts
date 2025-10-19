import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as hyperliquid from "./hyperliquid";
import * as db from "./db";
import { randomBytes } from "crypto";

export const appRouter = router({
  system: systemRouter,

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
      return await hyperliquid.getMeta();
    }),

    getSpotMeta: publicProcedure.query(async () => {
      return await hyperliquid.getSpotMeta();
    }),

    getAllMids: publicProcedure.query(async () => {
      return await hyperliquid.getAllMids();
    }),

    getL2Snapshot: publicProcedure
      .input(z.object({ coin: z.string() }))
      .query(async ({ input }) => {
        return await hyperliquid.getL2Snapshot(input.coin);
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
        return await hyperliquid.getCandlesSnapshot(
          input.coin,
          input.interval,
          input.startTime,
          input.endTime
        );
      }),
  }),

  // Account endpoints (protected)
  account: router({
    getUserState: protectedProcedure.query(async ({ ctx }) => {
      return await hyperliquid.getUserState();
    }),

    getOpenOrders: protectedProcedure.query(async ({ ctx }) => {
      return await hyperliquid.getOpenOrders();
    }),

    getUserFills: protectedProcedure.query(async ({ ctx }) => {
      return await hyperliquid.getUserFills();
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
        return await hyperliquid.cancelOrder(input.coin, input.oid);
      }),

    cancelAllOrders: protectedProcedure
      .input(
        z.object({
          coin: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await hyperliquid.cancelAllOrders(input.coin);
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
  }),
});

export type AppRouter = typeof appRouter;
