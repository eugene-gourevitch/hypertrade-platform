/**
 * Background service for monitoring liquidation risk
 * Sends email alerts when positions approach liquidation
 */

import * as hyperliquidPersistent from "./hyperliquid_persistent";
import * as hyperliquidHTTP from "./hyperliquid_http";
import * as db from "./db";
import { sendLiquidationWarning } from "./email_service";

interface LiquidationAlert {
  userId: string;
  email: string;
  positions: Array<{
    coin: string;
    size: string;
    currentPrice: string;
    liquidationPrice: string;
    distancePercent: number;
  }>;
}

// Track when we last sent alerts to avoid spam
const lastAlertTime = new Map<string, number>();
const ALERT_COOLDOWN = 15 * 60 * 1000; // 15 minutes between alerts

/**
 * Check if a user needs a liquidation alert
 */
async function checkUserLiquidation(userId: string, email: string): Promise<LiquidationAlert | null> {
  try {
    // Get user state
    const userState = await hyperliquidPersistent.getUserState(userId).catch(() =>
      hyperliquidHTTP.getUserState(userId)
    ) as any;

    if (!userState || !userState.assetPositions) {
      return null;
    }

    // Get current prices
    const mids = await hyperliquidPersistent.getAllMids().catch(() =>
      hyperliquidHTTP.getAllMids()
    ) as any;

    // Check each position for liquidation risk
    const riskyPositions = userState.assetPositions
      .map((pos: any) => {
        const position = pos.position;
        const coin = position.coin;
        const size = parseFloat(position.szi || "0");
        const currentPrice = parseFloat(mids[coin] || "0");
        const liquidationPx = parseFloat(position.liquidationPx || "0");

        if (size === 0 || currentPrice === 0 || liquidationPx === 0) {
          return null;
        }

        // Calculate distance to liquidation as percentage
        const distancePercent = size > 0
          ? ((currentPrice - liquidationPx) / currentPrice) * 100
          : ((liquidationPx - currentPrice) / currentPrice) * 100;

        // Alert if within 25% of liquidation
        if (distancePercent > 0 && distancePercent < 25) {
          return {
            coin,
            size: Math.abs(size).toFixed(4),
            currentPrice: currentPrice.toFixed(2),
            liquidationPrice: liquidationPx.toFixed(2),
            distancePercent,
          };
        }

        return null;
      })
      .filter((p: any) => p !== null);

    if (riskyPositions.length > 0) {
      return {
        userId,
        email,
        positions: riskyPositions,
      };
    }

    return null;
  } catch (error: any) {
    console.error(`[Liquidation Monitor] Error checking user ${userId}:`, error.message);
    return null;
  }
}

/**
 * Check all users for liquidation risk
 */
async function checkAllUsers() {
  try {
    // Get all users from database
    const users = await db.getAllUsers();

    console.log(`[Liquidation Monitor] Checking ${users.length} users...`);

    for (const user of users) {
      // Skip users without email
      if (!user.email) {
        continue;
      }

      // Skip if we recently sent an alert to this user
      const lastAlert = lastAlertTime.get(user.id);
      if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN) {
        continue;
      }

      const alert = await checkUserLiquidation(user.id, user.email);

      if (alert) {
        console.log(`[Liquidation Monitor] Alert needed for ${user.email}:`, alert.positions.length, "positions at risk");

        // Send email alert
        const sent = await sendLiquidationWarning(alert.email, alert.positions);

        // Send Telegram alerts
        const userSettings = await db.getUserSettings(user.id);
        if (userSettings?.telegramAlertsEnabled && userSettings?.telegramLiquidationAlerts && userSettings?.telegramChatId) {
          const { sendLiquidationAlert } = await import('./telegram_bot');
          const chatId = userSettings.telegramChatId;
          for (const pos of alert.positions) {
            await sendLiquidationAlert(chatId, pos);
          }
        }

        // Log each position alert to database
        for (const pos of alert.positions) {
          const alertType = pos.distancePercent < 10 ? "critical" : "warning";

          await db.saveLiquidationAlert({
            id: `${user.id}_${pos.coin}_${Date.now()}`,
            userId: user.id,
            coin: pos.coin,
            positionSize: pos.size,
            currentPrice: pos.currentPrice,
            liquidationPrice: pos.liquidationPrice,
            distancePercent: pos.distancePercent.toString(),
            alertType,
            emailSent: sent,
            emailError: sent ? null : "Failed to send email",
          });
        }

        if (sent) {
          lastAlertTime.set(user.id, Date.now());
          console.log(`[Liquidation Monitor] Alert sent to ${user.email}`);
        }
      }
    }
  } catch (error: any) {
    console.error("[Liquidation Monitor] Error in checkAllUsers:", error.message);
  }
}

/**
 * Start the liquidation monitoring service
 */
export function startLiquidationMonitor() {
  console.log("[Liquidation Monitor] Starting...");

  // Check immediately on startup
  checkAllUsers();

  // Then check every 2 minutes
  const interval = setInterval(checkAllUsers, 2 * 60 * 1000);

  // Cleanup function
  return () => {
    console.log("[Liquidation Monitor] Stopping...");
    clearInterval(interval);
  };
}

/**
 * Manual trigger for testing
 */
export async function triggerLiquidationCheck(userId: string, email: string): Promise<boolean> {
  const alert = await checkUserLiquidation(userId, email);

  if (alert) {
    return await sendLiquidationWarning(alert.email, alert.positions);
  }

  return false;
}
