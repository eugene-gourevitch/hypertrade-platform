import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertUser,
  users,
  trades,
  userSettings,
  InsertTrade,
  InsertUserSettings,
  apiLogs,
  tradingLogs,
  liquidationAlerts,
  aiRecommendations,
  userSessions,
  performanceMetrics,
  errorLogs,
  InsertApiLog,
  InsertTradingLog,
  InsertLiquidationAlert,
  InsertAIRecommendation,
  InsertUserSession,
  InsertPerformanceMetric,
  InsertErrorLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('supabase.co')
          ? { rejectUnauthorized: false }
          : undefined,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.id,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  return await db.select().from(users);
}

// Trading queries
export async function saveTrade(trade: InsertTrade): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save trade: database not available");
    return;
  }

  try {
    await db.insert(trades).values(trade);
  } catch (error) {
    console.error("[Database] Failed to save trade:", error);
    throw error;
  }
}

export async function getUserTrades(userId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get trades: database not available");
    return [];
  }

  const result = await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(trades.createdAt)
    .limit(limit);

  return result;
}

export async function getUserSettings(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get settings: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertUserSettings(
  settings: InsertUserSettings
): Promise<void> {
  if (!settings.userId) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert settings: database not available");
    return;
  }

  try {
    const updateSet: Record<string, unknown> = {};

    if (settings.defaultLeverage !== undefined) {
      updateSet.defaultLeverage = settings.defaultLeverage;
    }
    if (settings.defaultSlippage !== undefined) {
      updateSet.defaultSlippage = settings.defaultSlippage;
    }
    if (settings.favoriteCoins !== undefined) {
      updateSet.favoriteCoins = settings.favoriteCoins;
    }
    if (settings.theme !== undefined) {
      updateSet.theme = settings.theme;
    }

    updateSet.updatedAt = new Date();

    await db.insert(userSettings).values(settings).onConflictDoUpdate({
      target: userSettings.userId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert settings:", error);
    throw error;
  }
}

/**
 * ============================================
 * LOGGING FUNCTIONS
 * ============================================
 */

/**
 * API Logs
 */
export async function saveApiLog(log: InsertApiLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save API log: database not available");
    return;
  }

  try {
    await db.insert(apiLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to save API log:", error);
    // Don't throw - logging failures shouldn't break the request
  }
}

export async function getApiLogs(userId?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(apiLogs).orderBy(desc(apiLogs.createdAt)).limit(limit);

    if (userId) {
      query = query.where(eq(apiLogs.userId, userId)) as any;
    }

    return await query;
  } catch (error) {
    console.error("[Database] Failed to get API logs:", error);
    return [];
  }
}

/**
 * Trading Logs
 */
export async function saveTradingLog(log: InsertTradingLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save trading log: database not available");
    return;
  }

  try {
    await db.insert(tradingLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to save trading log:", error);
  }
}

export async function getTradingLogs(userId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(tradingLogs)
      .where(eq(tradingLogs.userId, userId))
      .orderBy(desc(tradingLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get trading logs:", error);
    return [];
  }
}

/**
 * Liquidation Alerts
 */
export async function saveLiquidationAlert(alert: InsertLiquidationAlert): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save liquidation alert: database not available");
    return;
  }

  try {
    await db.insert(liquidationAlerts).values(alert);
  } catch (error) {
    console.error("[Database] Failed to save liquidation alert:", error);
  }
}

export async function getLiquidationAlerts(userId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(liquidationAlerts)
      .where(eq(liquidationAlerts.userId, userId))
      .orderBy(desc(liquidationAlerts.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get liquidation alerts:", error);
    return [];
  }
}

/**
 * AI Recommendations
 */
export async function saveAIRecommendation(recommendation: InsertAIRecommendation): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save AI recommendation: database not available");
    return;
  }

  try {
    await db.insert(aiRecommendations).values(recommendation);
  } catch (error) {
    console.error("[Database] Failed to save AI recommendation:", error);
  }
}

export async function getAIRecommendations(userId: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(aiRecommendations)
      .where(eq(aiRecommendations.userId, userId))
      .orderBy(desc(aiRecommendations.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get AI recommendations:", error);
    return [];
  }
}

/**
 * User Sessions
 */
export async function saveUserSession(session: InsertUserSession): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save user session: database not available");
    return;
  }

  try {
    await db.insert(userSessions).values(session);
  } catch (error) {
    console.error("[Database] Failed to save user session:", error);
  }
}

export async function getUserSessions(userId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(desc(userSessions.sessionStart))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get user sessions:", error);
    return [];
  }
}

/**
 * Performance Metrics
 */
export async function savePerformanceMetric(metric: InsertPerformanceMetric): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save performance metric: database not available");
    return;
  }

  try {
    await db.insert(performanceMetrics).values(metric);
  } catch (error) {
    console.error("[Database] Failed to save performance metric:", error);
  }
}

export async function getPerformanceMetrics(userId: string, limit: number = 30) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, userId))
      .orderBy(desc(performanceMetrics.date))
      .limit(limit);
  } catch (error) {
    console.error("[Database] Failed to get performance metrics:", error);
    return [];
  }
}

/**
 * Error Logs
 */
export async function saveErrorLog(log: InsertErrorLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save error log: database not available");
    return;
  }

  try {
    await db.insert(errorLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to save error log:", error);
  }
}

export async function getErrorLogs(userId?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit);

    if (userId) {
      query = query.where(eq(errorLogs.userId, userId)) as any;
    }

    return await query;
  } catch (error) {
    console.error("[Database] Failed to get error logs:", error);
    return [];
  }
}
