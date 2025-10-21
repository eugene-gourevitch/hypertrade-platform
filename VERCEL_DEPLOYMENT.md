/**
 * Extended schema for logging and analytics
 * Add these to your existing drizzle/schema.ts
 */

import { mysqlTable, varchar, text, timestamp, decimal, index, int, boolean } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * API Request Logs
 * Track all API calls for debugging and analytics
 */
export const apiLogs = mysqlTable("api_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  statusCode: int("status_code").notNull(),
  responseTime: int("response_time"), // milliseconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  errorMessage: text("error_message"),
  requestBody: text("request_body"), // JSON string
  responseBody: text("response_body"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  endpointIdx: index("endpoint_idx").on(table.endpoint),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

/**
 * Trading Activity Logs
 * Detailed logs of all trading actions
 */
export const tradingLogs = mysqlTable("trading_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(), // place_order, cancel_order, etc.
  coin: varchar("coin", { length: 20 }).notNull(),
  orderType: varchar("order_type", { length: 20 }), // market, limit, stop, etc.
  side: varchar("side", { length: 10 }), // buy, sell
  size: varchar("size", { length: 50 }),
  price: varchar("price", { length: 50 }),
  leverage: int("leverage"),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string with additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  coinIdx: index("coin_idx").on(table.coin),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

/**
 * Liquidation Alerts Log
 * Track when liquidation alerts were sent
 */
export const liquidationAlerts = mysqlTable("liquidation_alerts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  coin: varchar("coin", { length: 20 }).notNull(),
  positionSize: varchar("position_size", { length: 50 }).notNull(),
  currentPrice: varchar("current_price", { length: 50 }).notNull(),
  liquidationPrice: varchar("liquidation_price", { length: 50 }).notNull(),
  distancePercent: decimal("distance_percent", { precision: 10, scale: 4 }).notNull(),
  alertType: varchar("alert_type", { length: 20 }).notNull(), // warning, critical
  emailSent: boolean("email_sent").notNull().default(false),
  emailError: text("email_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  alertTypeIdx: index("alert_type_idx").on(table.alertType),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

/**
 * AI Recommendations Log
 * Track AI analysis requests and responses
 */
export const aiRecommendations = mysqlTable("ai_recommendations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  selectedCoin: varchar("selected_coin", { length: 20 }),
  accountValue: varchar("account_value", { length: 50 }),
  totalPositions: int("total_positions"),
  accountLeverage: decimal("account_leverage", { precision: 10, scale: 2 }),
  analysis: text("analysis").notNull(), // The AI response
  tokensUsed: int("tokens_used"),
  model: varchar("model", { length: 50 }), // claude-3-5-sonnet, etc.
  responseTime: int("response_time"), // milliseconds
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

/**
 * User Sessions Log
 * Track login/logout activity
 */
export const userSessions = mysqlTable("user_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  sessionStart: timestamp("session_start").defaultNow().notNull(),
  sessionEnd: timestamp("session_end"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  deviceType: varchar("device_type", { length: 50 }), // desktop, mobile, tablet
  country: varchar("country", { length: 2 }), // ISO country code
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  sessionStartIdx: index("session_start_idx").on(table.sessionStart),
}));

/**
 * Performance Metrics
 * Track trading performance over time
 */
export const performanceMetrics = mysqlTable("performance_metrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  totalTrades: int("total_trades").notNull().default(0),
  profitableTrades: int("profitable_trades").notNull().default(0),
  totalPnl: varchar("total_pnl", { length: 50 }).notNull().default("0"),
  totalVolume: varchar("total_volume", { length: 50 }).notNull().default("0"),
  totalFees: varchar("total_fees", { length: 50 }).notNull().default("0"),
  averageHoldTime: int("average_hold_time"), // minutes
  largestWin: varchar("largest_win", { length: 50 }),
  largestLoss: varchar("largest_loss", { length: 50 }),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }), // percentage
  sharpeRatio: decimal("sharpe_ratio", { precision: 10, scale: 4 }),
  maxDrawdown: varchar("max_drawdown", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
}));

/**
 * Error Logs
 * Centralized error tracking
 */
export const errorLogs = mysqlTable("error_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id),
  errorType: varchar("error_type", { length: 100 }).notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  context: text("context"), // JSON string with additional context
  severity: varchar("severity", { length: 20 }).notNull(), // error, warning, critical
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  errorTypeIdx: index("error_type_idx").on(table.errorType),
  severityIdx: index("severity_idx").on(table.severity),
  resolvedIdx: index("resolved_idx").on(table.resolved),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

// Export type inferences
export type ApiLog = typeof apiLogs.$inferSelect;
export type TradingLog = typeof tradingLogs.$inferSelect;
export type LiquidationAlert = typeof liquidationAlerts.$inferSelect;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type ErrorLog = typeof errorLogs.$inferSelect;
