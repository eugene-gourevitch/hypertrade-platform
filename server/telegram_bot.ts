/**
 * Telegram Bot Service
 * Sends real-time alerts to users via Telegram
 */

import TelegramBot from 'node-telegram-bot-api';
import * as db from './db';

let bot: TelegramBot | null = null;

/**
 * Initialize Telegram bot
 */
export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('[Telegram] Bot token not provided. Telegram alerts disabled.');
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: true });

    // Handle /start command - registers user
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;

      await bot!.sendMessage(
        chatId,
        `🎉 Welcome to HyperTrade Alerts!\n\n` +
        `Your Chat ID: \`${chatId}\`\n\n` +
        `To enable alerts:\n` +
        `1. Copy your Chat ID\n` +
        `2. Go to Settings in HyperTrade\n` +
        `3. Paste your Chat ID in Telegram Settings\n\n` +
        `You'll receive:\n` +
        `• 🚨 Liquidation warnings\n` +
        `• ✅ Trade fill notifications\n` +
        `• 📊 Price alerts\n` +
        `• 💰 P&L milestones`,
        { parse_mode: 'Markdown' }
      );
    });

    // Handle /status command
    bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;

      await bot!.sendMessage(
        chatId,
        `✅ Bot is active and running!\n\n` +
        `Your Chat ID: \`${chatId}\``,
        { parse_mode: 'Markdown' }
      );
    });

    // Handle /help command
    bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;

      await bot!.sendMessage(
        chatId,
        `📖 *HyperTrade Telegram Bot Commands*\n\n` +
        `/start - Get started and see your Chat ID\n` +
        `/status - Check if bot is active\n` +
        `/help - Show this help message\n\n` +
        `*Alert Types:*\n` +
        `🚨 Liquidation Risk - When position nears liquidation\n` +
        `✅ Order Filled - When your order executes\n` +
        `📊 Price Alert - When price hits your target\n` +
        `💰 P&L Milestone - When you hit profit goals`,
        { parse_mode: 'Markdown' }
      );
    });

    console.log('[Telegram] Bot initialized successfully');
    return bot;
  } catch (error) {
    console.error('[Telegram] Failed to initialize bot:', error);
    return null;
  }
}

/**
 * Send liquidation alert to user
 */
export async function sendLiquidationAlert(
  chatId: string,
  position: {
    coin: string;
    size: string;
    currentPrice: string;
    liquidationPrice: string;
    distancePercent: number;
  }
) {
  if (!bot) return;

  const emoji = position.distancePercent < 10 ? '🚨🚨🚨' : '⚠️';
  const urgency = position.distancePercent < 10 ? 'CRITICAL' : 'WARNING';

  const message =
    `${emoji} *LIQUIDATION ${urgency}* ${emoji}\n\n` +
    `Coin: *${position.coin}*\n` +
    `Position Size: \`${position.size}\`\n` +
    `Current Price: \`$${parseFloat(position.currentPrice).toFixed(2)}\`\n` +
    `Liquidation Price: \`$${parseFloat(position.liquidationPrice).toFixed(2)}\`\n` +
    `Distance: *${position.distancePercent.toFixed(2)}%*\n\n` +
    (position.distancePercent < 10
      ? `❗ *IMMEDIATE ACTION REQUIRED*\n`
      : `⏰ Consider adding collateral or closing position\n`) +
    `\nTime: ${new Date().toLocaleString()}`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`[Telegram] Liquidation alert sent to ${chatId}`);
  } catch (error) {
    console.error(`[Telegram] Failed to send alert to ${chatId}:`, error);
  }
}

/**
 * Send trade fill notification
 */
export async function sendFillNotification(
  chatId: string,
  fill: {
    coin: string;
    side: 'buy' | 'sell';
    size: string;
    price: string;
    total: string;
  }
) {
  if (!bot) return;

  const emoji = fill.side === 'buy' ? '🟢' : '🔴';
  const action = fill.side === 'buy' ? 'BOUGHT' : 'SOLD';

  const message =
    `✅ *ORDER FILLED*\n\n` +
    `${emoji} ${action} *${fill.coin}*\n` +
    `Size: \`${fill.size}\`\n` +
    `Price: \`$${parseFloat(fill.price).toFixed(2)}\`\n` +
    `Total: \`$${parseFloat(fill.total).toFixed(2)}\`\n\n` +
    `Time: ${new Date().toLocaleString()}`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`[Telegram] Failed to send fill notification to ${chatId}:`, error);
  }
}

/**
 * Send price alert
 */
export async function sendPriceAlert(
  chatId: string,
  alert: {
    coin: string;
    targetPrice: string;
    currentPrice: string;
    direction: 'above' | 'below';
  }
) {
  if (!bot) return;

  const emoji = alert.direction === 'above' ? '📈' : '📉';

  const message =
    `📊 *PRICE ALERT* ${emoji}\n\n` +
    `*${alert.coin}* hit your target!\n\n` +
    `Target: \`$${parseFloat(alert.targetPrice).toFixed(2)}\`\n` +
    `Current: \`$${parseFloat(alert.currentPrice).toFixed(2)}\`\n` +
    `Direction: ${alert.direction === 'above' ? 'Above ⬆️' : 'Below ⬇️'}\n\n` +
    `Time: ${new Date().toLocaleString()}`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`[Telegram] Failed to send price alert to ${chatId}:`, error);
  }
}

/**
 * Send P&L milestone notification
 */
export async function sendPnLMilestone(
  chatId: string,
  milestone: {
    type: 'profit' | 'loss';
    amount: number;
    totalPnL: number;
    percentChange: number;
  }
) {
  if (!bot) return;

  const emoji = milestone.type === 'profit' ? '💰🎉' : '📉⚠️';
  const title = milestone.type === 'profit' ? 'PROFIT MILESTONE' : 'LOSS ALERT';

  const message =
    `${emoji} *${title}* ${emoji}\n\n` +
    `Amount: \`${milestone.amount > 0 ? '+' : ''}$${milestone.amount.toFixed(2)}\`\n` +
    `Total P&L: \`${milestone.totalPnL > 0 ? '+' : ''}$${milestone.totalPnL.toFixed(2)}\`\n` +
    `Change: \`${milestone.percentChange > 0 ? '+' : ''}${milestone.percentChange.toFixed(2)}%\`\n\n` +
    `Time: ${new Date().toLocaleString()}`;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`[Telegram] Failed to send P&L milestone to ${chatId}:`, error);
  }
}

/**
 * Send custom message
 */
export async function sendCustomMessage(chatId: string, message: string) {
  if (!bot) return;

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(`[Telegram] Failed to send custom message to ${chatId}:`, error);
  }
}

// Initialize bot on module load
if (process.env.TELEGRAM_BOT_TOKEN) {
  initTelegramBot();
}
