import { pgTable, varchar, text, timestamp, integer, boolean, decimal, index, pgEnum } from "drizzle-orm/pg-core";

// Define enums (PostgreSQL requires enum definitions before use)
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const sideEnum = pgEnum("side", ["buy", "sell"]);

/**
 * Core user table backing auth flow.
 * Uses wallet addresses as primary identifiers.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(), // Wallet address (0x...)
  name: text("name"), // Optional display name
  email: varchar("email", { length: 320 }), // Optional email
  loginMethod: varchar("loginMethod", { length: 64 }).default("wallet"), // Always 'wallet'
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Trading history and preferences
export const trades = pgTable("trades", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  coin: varchar("coin", { length: 32 }).notNull(),
  side: sideEnum("side").notNull(),
  size: varchar("size", { length: 32 }).notNull(),
  price: varchar("price", { length: 32 }).notNull(),
  orderType: varchar("orderType", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  oid: varchar("oid", { length: 64 }),
  filledSize: varchar("filledSize", { length: 32 }),
  avgFillPrice: varchar("avgFillPrice", { length: 32 }),
  fee: varchar("fee", { length: 32 }),
  pnl: varchar("pnl", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const userSettings = pgTable("userSettings", {
  userId: varchar("userId", { length: 64 }).primaryKey(),
  defaultLeverage: varchar("defaultLeverage", { length: 8 }).default("1"),
  defaultSlippage: varchar("defaultSlippage", { length: 8 }).default("0.05"),
  favoriteCoins: text("favoriteCoins"),
  theme: varchar("theme", { length: 16 }).default("dark"),

  // Telegram settings
  telegramChatId: varchar("telegramChatId", { length: 255 }),
  telegramAlertsEnabled: boolean("telegramAlertsEnabled").default(false),
  telegramLiquidationAlerts: boolean("telegramLiquidationAlerts").default(true),
  telegramFillAlerts: boolean("telegramFillAlerts").default(true),
  telegramPriceAlerts: boolean("telegramPriceAlerts").default(true),
  telegramPnLAlerts: boolean("telegramPnLAlerts").default(true),

  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * ============================================
 * ANALYTICS AND LOGGING TABLES
 * ============================================
 */

/**
 * API Request Logs
 * Track all API calls for debugging and analytics
 */
export const apiLogs = pgTable("apiLogs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(), // GET, POST, etc.
  statusCode: integer("statusCode").notNull(),
  responseTime: integer("responseTime"), // milliseconds
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  errorMessage: text("errorMessage"),
  requestBody: text("requestBody"), // JSON string
  responseBody: text("responseBody"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("apiLogs_userId_idx").on(table.userId),
  endpointIdx: index("apiLogs_endpoint_idx").on(table.endpoint),
  createdAtIdx: index("apiLogs_createdAt_idx").on(table.createdAt),
}));

/**
 * Trading Activity Logs
 * Detailed logs of all trading actions
 */
export const tradingLogs = pgTable("tradingLogs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // place_order, cancel_order, etc.
  coin: varchar("coin", { length: 20 }).notNull(),
  orderType: varchar("orderType", { length: 20 }), // market, limit, stop, etc.
  side: varchar("side", { length: 10 }), // buy, sell
  size: varchar("size", { length: 50 }),
  price: varchar("price", { length: 50 }),
  leverage: integer("leverage"),
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  metadata: text("metadata"), // JSON string with additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("tradingLogs_userId_idx").on(table.userId),
  actionIdx: index("tradingLogs_action_idx").on(table.action),
  coinIdx: index("tradingLogs_coin_idx").on(table.coin),
  createdAtIdx: index("tradingLogs_createdAt_idx").on(table.createdAt),
}));

/**
 * Liquidation Alerts Log
 * Track when liquidation alerts were sent
 */
export const liquidationAlerts = pgTable("liquidationAlerts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  coin: varchar("coin", { length: 20 }).notNull(),
  positionSize: varchar("positionSize", { length: 50 }).notNull(),
  currentPrice: varchar("currentPrice", { length: 50 }).notNull(),
  liquidationPrice: varchar("liquidationPrice", { length: 50 }).notNull(),
  distancePercent: decimal("distancePercent", { precision: 10, scale: 4 }).notNull(),
  alertType: varchar("alertType", { length: 20 }).notNull(), // warning, critical
  emailSent: boolean("emailSent").notNull().default(false),
  emailError: text("emailError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("liquidationAlerts_userId_idx").on(table.userId),
  alertTypeIdx: index("liquidationAlerts_alertType_idx").on(table.alertType),
  createdAtIdx: index("liquidationAlerts_createdAt_idx").on(table.createdAt),
}));

/**
 * AI Recommendations Log
 * Track AI analysis requests and responses
 */
export const aiRecommendations = pgTable("aiRecommendations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  selectedCoin: varchar("selectedCoin", { length: 20 }),
  accountValue: varchar("accountValue", { length: 50 }),
  totalPositions: integer("totalPositions"),
  accountLeverage: decimal("accountLeverage", { precision: 10, scale: 2 }),
  analysis: text("analysis").notNull(), // The AI response
  tokensUsed: integer("tokensUsed"),
  model: varchar("model", { length: 50 }), // claude-3-5-sonnet, etc.
  responseTime: integer("responseTime"), // milliseconds
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("aiRecommendations_userId_idx").on(table.userId),
  createdAtIdx: index("aiRecommendations_createdAt_idx").on(table.createdAt),
}));

/**
 * User Sessions Log
 * Track login/logout activity
 */
export const userSessions = pgTable("userSessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  sessionStart: timestamp("sessionStart").defaultNow().notNull(),
  sessionEnd: timestamp("sessionEnd"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  deviceType: varchar("deviceType", { length: 50 }), // desktop, mobile, tablet
  country: varchar("country", { length: 2 }), // ISO country code
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userSessions_userId_idx").on(table.userId),
  sessionStartIdx: index("userSessions_sessionStart_idx").on(table.sessionStart),
}));

/**
 * Performance Metrics
 * Track trading performance over time
 */
export const performanceMetrics = pgTable("performanceMetrics", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  date: timestamp("date").notNull(),
  totalTrades: integer("totalTrades").notNull().default(0),
  profitableTrades: integer("profitableTrades").notNull().default(0),
  totalPnl: varchar("totalPnl", { length: 50 }).notNull().default("0"),
  totalVolume: varchar("totalVolume", { length: 50 }).notNull().default("0"),
  totalFees: varchar("totalFees", { length: 50 }).notNull().default("0"),
  averageHoldTime: integer("averageHoldTime"), // minutes
  largestWin: varchar("largestWin", { length: 50 }),
  largestLoss: varchar("largestLoss", { length: 50 }),
  winRate: decimal("winRate", { precision: 5, scale: 2 }), // percentage
  sharpeRatio: decimal("sharpeRatio", { precision: 10, scale: 4 }),
  maxDrawdown: varchar("maxDrawdown", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("performanceMetrics_userId_idx").on(table.userId),
  dateIdx: index("performanceMetrics_date_idx").on(table.date),
}));

/**
 * Error Logs
 * Centralized error tracking
 */
export const errorLogs = pgTable("errorLogs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 64 }),
  errorType: varchar("errorType", { length: 100 }).notNull(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  context: text("context"), // JSON string with additional context
  severity: varchar("severity", { length: 20 }).notNull(), // error, warning, critical
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  errorTypeIdx: index("errorLogs_errorType_idx").on(table.errorType),
  severityIdx: index("errorLogs_severity_idx").on(table.severity),
  resolvedIdx: index("errorLogs_resolved_idx").on(table.resolved),
  createdAtIdx: index("errorLogs_createdAt_idx").on(table.createdAt),
}));

// Export type inferences for all logging tables
export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = typeof apiLogs.$inferInsert;
export type TradingLog = typeof tradingLogs.$inferSelect;
export type InsertTradingLog = typeof tradingLogs.$inferInsert;
export type LiquidationAlert = typeof liquidationAlerts.$inferSelect;
export type InsertLiquidationAlert = typeof liquidationAlerts.$inferInsert;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = typeof aiRecommendations.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;
