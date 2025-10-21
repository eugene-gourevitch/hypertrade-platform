import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, trades, userSettings, InsertTrade, InsertUserSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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

    await db.insert(userSettings).values(settings).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert settings:", error);
    throw error;
  }
}
