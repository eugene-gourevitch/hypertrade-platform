/**
 * AI-powered trading recommendations using Anthropic Claude
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import * as db from "./db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export const aiRouter = router({
  /**
   * Get AI-powered trading recommendations
   */
  getTradingRecommendations: protectedProcedure
    .input(
      z.object({
        userState: z.any(),
        mids: z.record(z.string(), z.string()),
        selectedCoin: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
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

      // Calculate metrics
      const accountValueNum = parseFloat(accountValue);
      const marginUsedNum = parseFloat(totalMarginUsed);
      const withdrawableNum = parseFloat(withdrawable);

      const accountLeverage =
        accountValueNum > 0 ? marginUsedNum / accountValueNum : 0;
      const marginRatio =
        accountValueNum > 0 ? (marginUsedNum / accountValueNum) * 100 : 0;

      // Calculate total unrealized PNL
      const totalUnrealizedPnl = positions.reduce((sum: number, pos: any) => {
        return sum + parseFloat(pos.position?.unrealizedPnl || "0");
      }, 0);

      // Prepare position details
      const positionDetails = positions.map((pos: any) => {
        const position = pos.position;
        const coin = position.coin;
        const size = parseFloat(position.szi || "0");
        const entryPrice = parseFloat(position.entryPx || "0");
        const currentPrice = parseFloat((mids[coin] || "0") as string);
        const unrealizedPnl = parseFloat(position.unrealizedPnl || "0");
        const leverage = position.leverage?.value || 1;
        const liquidationPx = parseFloat(position.liquidationPx || "0");

        // Calculate distance to liquidation
        const distanceToLiq =
          currentPrice > 0 && liquidationPx > 0
            ? size > 0
              ? ((currentPrice - liquidationPx) / currentPrice) * 100
              : ((liquidationPx - currentPrice) / currentPrice) * 100
            : 0;

        return {
          coin,
          size: size.toFixed(4),
          side: size > 0 ? "LONG" : "SHORT",
          entryPrice: entryPrice.toFixed(2),
          currentPrice: currentPrice.toFixed(2),
          unrealizedPnl: unrealizedPnl.toFixed(2),
          pnlPercent: (
            ((unrealizedPnl / (entryPrice * Math.abs(size))) *
              100)
          ).toFixed(2),
          leverage: leverage,
          liquidationPrice: liquidationPx.toFixed(2),
          distanceToLiquidation: distanceToLiq.toFixed(2) + "%",
        };
      });

      // Build prompt for Claude
      const prompt = `You are an expert crypto trading advisor analyzing a trader's Hyperliquid DEX positions. Provide professional risk management and P&L optimization advice.

## Account Overview
- Total Account Value: $${accountValueNum.toFixed(2)}
- Available Balance: $${withdrawableNum.toFixed(2)}
- Margin Used: $${marginUsedNum.toFixed(2)} (${marginRatio.toFixed(2)}%)
- Account Leverage: ${accountLeverage.toFixed(2)}x
- Total Unrealized PNL: $${totalUnrealizedPnl.toFixed(2)}

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
Current Price: $${parseFloat((mids[selectedCoin] || "0") as string).toFixed(2)}

## Analysis Required
1. **Risk Assessment**: Evaluate liquidation risk for each position and overall portfolio risk
2. **Position Sizing**: Analyze if positions are appropriately sized relative to account
3. **Leverage Analysis**: Assess if leverage levels are prudent
4. **P&L Management**: Suggest take-profit and stop-loss levels
5. **Portfolio Balance**: Evaluate diversification and concentration risk
6. **Actionable Recommendations**: Provide specific, actionable trading advice

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
          accountLeverage: accountLeverage.toFixed(2),
          analysis,
          tokensUsed: message.usage?.input_tokens + message.usage?.output_tokens || 0,
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
          accountLeverage: accountLeverage.toFixed(2),
          analysis: "",
          errorMessage: error.message,
          responseTime: Date.now() - startTime,
        });

        throw new Error(`AI analysis failed: ${error.message}`);
      }
    }),
});
