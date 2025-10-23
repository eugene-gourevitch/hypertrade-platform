/**
 * Simplified Hyperliquid Integration
 * Direct HTTP API calls without Python dependency
 */

const MAINNET_API_URL = "https://api.hyperliquid.xyz";
const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";

const getApiUrl = () => {
  const isTestnet = process.env.HYPERLIQUID_TESTNET === "true";
  return isTestnet ? TESTNET_API_URL : MAINNET_API_URL;
};

/**
 * Get all mid prices (quotes)
 */
export async function getAllMids(): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${getApiUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "allMids" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error("[Hyperliquid] Failed to fetch mids:", error);
    // Return mock data for development
    if (process.env.NODE_ENV === "development") {
      return {
        BTC: "109500.00",
        ETH: "3885.00",
        SOL: "187.50",
        ARB: "0.31",
        AVAX: "19.50",
        BNB: "1103.00",
        DOGE: "0.19",
        MATIC: "0.38",
        OP: "0.43",
        WIF: "0.51",
        PEPE: "0.0000069",
        BONK: "0.000014",
      };
    }
    throw error;
  }
}

/**
 * Get order book snapshot
 */
export async function getL2Snapshot(coin: string): Promise<any> {
  try {
    const response = await fetch(`${getApiUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "l2Book", 
        coin 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Format the response
    return {
      coin,
      time: Date.now(),
      levels: data?.levels || [[], []],
    };
  } catch (error) {
    console.error(`[Hyperliquid] Failed to fetch L2 for ${coin}:`, error);
    // Return mock order book for development
    if (process.env.NODE_ENV === "development") {
      return {
        coin,
        time: Date.now(),
        levels: [
          // Bids
          [
            ["109400.00", "0.5"],
            ["109350.00", "1.2"],
            ["109300.00", "2.1"],
          ],
          // Asks
          [
            ["109500.00", "0.8"],
            ["109550.00", "1.5"],
            ["109600.00", "2.3"],
          ],
        ],
      };
    }
    throw error;
  }
}

/**
 * Get metadata for all assets
 */
export async function getMeta(): Promise<any> {
  try {
    const response = await fetch(`${getApiUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Hyperliquid] Failed to fetch meta:", error);
    // Return basic meta for development
    if (process.env.NODE_ENV === "development") {
      return {
        universe: [
          { name: "BTC", szDecimals: 5 },
          { name: "ETH", szDecimals: 4 },
          { name: "SOL", szDecimals: 3 },
        ],
      };
    }
    throw error;
  }
}

/**
 * Get recent trades
 */
export async function getRecentTrades(coin: string): Promise<any[]> {
  try {
    const response = await fetch(`${getApiUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "trades",
        coin 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const trades = await response.json();
    return trades || [];
  } catch (error) {
    console.error(`[Hyperliquid] Failed to fetch trades for ${coin}:`, error);
    // Return mock trades for development
    if (process.env.NODE_ENV === "development") {
      return [
        {
          coin,
          side: "BUY",
          px: "109500.00",
          sz: "0.1",
          time: Date.now() - 1000,
        },
        {
          coin,
          side: "SELL",
          px: "109490.00",
          sz: "0.05",
          time: Date.now() - 2000,
        },
      ];
    }
    return [];
  }
}

/**
 * Mock order placement for development
 * In production, this should use proper signing with wallet
 */
export async function placeOrder(params: {
  coin: string;
  isBuy: boolean;
  size: number;
  price: number;
  orderType: "market" | "limit";
}): Promise<any> {
  console.log("[Hyperliquid] Order placement:", params);
  
  // Check if we have credentials
  const hasCredentials = process.env.HYPERLIQUID_ACCOUNT_ADDRESS && 
                        process.env.HYPERLIQUID_API_SECRET;
  
  if (!hasCredentials) {
    console.warn("[Hyperliquid] No credentials configured - returning mock response");
    
    // Return mock success for development
    return {
      success: true,
      status: "MOCK_ORDER",
      response: {
        type: "order",
        data: {
          statuses: [{
            resting: {
              oid: Math.floor(Math.random() * 1000000),
            },
          }],
        },
      },
    };
  }
  
  // In production, this would sign and submit the order
  throw new Error("Order placement requires proper wallet configuration");
}

/**
 * Get user's account state (mock for development)
 */
export async function getUserState(address: string): Promise<any> {
  // Return mock account state for development
  if (!address || process.env.NODE_ENV === "development") {
    return {
      marginSummary: {
        accountValue: "10000.00",
        totalNtlPos: "5000.00",
        totalRawUsd: "5000.00",
        totalMarginUsed: "1000.00",
      },
      crossMarginSummary: {
        accountValue: "10000.00",
        totalNtlPos: "5000.00", 
        totalRawUsd: "5000.00",
        totalMarginUsed: "1000.00",
      },
      withdrawable: "8000.00",
      assetPositions: [],
    };
  }
  
  try {
    const response = await fetch(`${getApiUrl()}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        type: "clearinghouseState",
        user: address,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[Hyperliquid] Failed to fetch user state:", error);
    throw error;
  }
}
