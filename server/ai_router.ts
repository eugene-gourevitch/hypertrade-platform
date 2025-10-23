/**
 * AI-powered trading recommendations using Anthropic Claude
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import * as db from "./db";
import { safeParseFloat, safeDivide, safeToFixed } from "./_core/safeNumber";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export const aiRouter = router({
  /**
   * Get AI-powered trading recommendations
   * Using mutation to handle large payloads and avoid HTTP 431 errors
   */
  getTradingRecommendations: protectedProcedure
    .input(
      z.object({
        userState: z.any(),
        mids: z.record(z.string()),
        selectedCoin: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY not configured");
      }

      const { userState, mids, selectedCoin } = input;

      // Extract relevant data
      const positions = userState?.assetPositions || [];
      const accountValue =
        userState?.marginSummary?.accountValue ||
        userState?.crossMarginSummary?.accountValue ||
        "0";
      const totalMarginUsed = userState?.marginSummary?.totalMarginUsed || "0";
      const withdrawable = userState?.withdrawable || "0";

      // Calculate metrics with safe parsing
      const accountValueNum = safeParseFloat(accountValue, 0);
      const marginUsedNum = safeParseFloat(totalMarginUsed, 0);
      const withdrawableNum = safeParseFloat(withdrawable, 0);

      // Safely calculate leverage and margin ratio
      const accountLeverage =
        accountValueNum > 0 && !isNaN(accountValueNum) 
          ? marginUsedNum / accountValueNum 
          : 0;
      const marginRatio =
        accountValueNum > 0 && !isNaN(accountValueNum) 
          ? (marginUsedNum / accountValueNum) * 100 
          : 0;

      // Calculate total unrealized PNL with safe parsing
      const totalUnrealizedPnl = positions.reduce((sum: number, pos: any) => {
        return sum + safeParseFloat(pos.position?.unrealizedPnl, 0);
      }, 0);

      // Prepare position details
      const positionDetails = positions.map((pos: any) => {
        const position = pos.position;
        const coin = position.coin;
        const size = safeParseFloat(position.szi, 0);
        const entryPrice = safeParseFloat(position.entryPx, 0);
        const currentPrice = safeParseFloat(mids[coin], 0);
        const unrealizedPnl = safeParseFloat(position.unrealizedPnl, 0);
        const leverage = position.leverage?.value || 1;
        const liquidationPx = safeParseFloat(position.liquidationPx, 0);

        // Calculate distance to liquidation safely
        const distanceToLiq =
          currentPrice > 0 && liquidationPx > 0
            ? size > 0
              ? safeDivide((currentPrice - liquidationPx), currentPrice, 0) * 100
              : safeDivide((liquidationPx - currentPrice), currentPrice, 0) * 100
            : 0;

        // Calculate PNL percentage safely (avoid division by zero)
        const positionValue = entryPrice * Math.abs(size);
        const pnlPercentNum = safeDivide(unrealizedPnl, positionValue, 0) * 100;
        const pnlPercent = safeToFixed(pnlPercentNum, 2);

        return {
          coin,
          size: safeToFixed(size, 4),
          side: size > 0 ? "LONG" : "SHORT",
          entryPrice: safeToFixed(entryPrice, 2),
          currentPrice: safeToFixed(currentPrice, 2),
          unrealizedPnl: safeToFixed(unrealizedPnl, 2),
          pnlPercent,
          leverage: leverage,
          liquidationPrice: safeToFixed(liquidationPx, 2),
          distanceToLiquidation: safeToFixed(distanceToLiq, 2) + "%",
        };
      });

      // Build prompt for Claude
      const prompt = `You are an expert crypto trading advisor analyzing a trader's Hyperliquid DEX positions. Provide professional risk management and P&L optimization advice.

## Account Overview
- Total Account Value: $${safeToFixed(accountValueNum, 2)}
- Available Balance: $${safeToFixed(withdrawableNum, 2)}
- Margin Used: $${safeToFixed(marginUsedNum, 2)} (${safeToFixed(marginRatio, 2)}%)
- Account Leverage: ${safeToFixed(accountLeverage, 2)}x
- Total Unrealized PNL: $${safeToFixed(totalUnrealizedPnl, 2)}

## Open Positions
${positionDetails.length > 0 ? positionDetails.map((p: any) => `
- ${p.coin}: ${p.side} ${p.size} @ $${p.entryPrice}
  Current Price: $${p.currentPrice}
  PNL: $${p.unrealizedPnl} (${p.pnlPercent}%)
  Leverage: ${p.leverage}x
  Liquidation: $${p.liquidationPrice} (${p.distanceToLiquidation} away)
`).join('\n') : 'No open positions'}

## Current Market Context
Selected Coin: ${selectedCoin}
Current Price: $${safeToFixed(safeParseFloat(mids[selectedCoin], 0), 2)}

## Analysis Required
1. **Risk Assessment**: Evaluate liquidation risk for each position and overall portfolio risk
2. **Position Sizing**: Analyze if positions are appropriately sized relative to account
3. **Leverage Analysis**: Assess if leverage levels are prudent
4. **P&L Management**: Suggest take-profit and stop-loss levels
5. **Portfolio Balance**: Evaluate diversification and concentration risk
6. **Actionable Recommendations**: Provide specific, actionable trading advice
7. **Top Hyperliquid wallets**: Provide analysis of the top 50 wallets on Hyperliquid and their trading activity

Please provide a structured analysis with:
- 🔴 Critical Risks (if any)
- ⚠️ Warnings & Concerns
- 💡 Optimization Suggestions
- ✅ Recommended Actions

Keep advice practical, specific, and actionable. Focus on risk management and capital preservation.`;

      const startTime = Date.now();

      try {
        const message = await anthropic.messages.create({
          model: "claude-4.5-sonnet-20251015",
          max_tokens: 4096,
          temperature: 0.7,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = message.content[0];
        const analysis =
          content.type === "text" ? content.text : "Unable to generate analysis";

        const responseTime = Date.now() - startTime;

        // Log AI recommendation to database
        await db.saveAIRecommendation({
          id: `${ctx.user.id}_${Date.now()}`,
          userId: ctx.user.id,
          selectedCoin,
          accountValue: accountValue.toString(),
          totalPositions: positions.length,
          accountLeverage: safeToFixed(accountLeverage, 2),
          analysis,
          tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
          model: "claude-4.5-sonnet-20251015",
          responseTime,
        });

        return {
          success: true,
          analysis,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error("[AI Router] Error calling Anthropic API:", error);

        // Log error to database
        await db.saveAIRecommendation({
          id: `${ctx.user.id}_${Date.now()}`,
          userId: ctx.user.id,
          selectedCoin,
          accountValue: accountValue.toString(),
          totalPositions: positions.length,
          accountLeverage: safeToFixed(accountLeverage, 2),
          analysis: "",
          errorMessage: error.message,
          responseTime: Date.now() - startTime,
        });

        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }),
});
