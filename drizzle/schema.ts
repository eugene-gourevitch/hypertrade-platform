import { mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Trading history and preferences
export const trades = mysqlTable("trades", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  coin: varchar("coin", { length: 32 }).notNull(),
  side: mysqlEnum("side", ["buy", "sell"]).notNull(),
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

export const userSettings = mysqlTable("userSettings", {
  userId: varchar("userId", { length: 64 }).primaryKey(),
  defaultLeverage: varchar("defaultLeverage", { length: 8 }).default("1"),
  defaultSlippage: varchar("defaultSlippage", { length: 8 }).default("0.05"),
  favoriteCoins: text("favoriteCoins"),
  theme: varchar("theme", { length: 16 }).default("dark"),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
