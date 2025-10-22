/**
 * Client-side Hyperliquid SDK
 * Handles signing and submitting transactions to Hyperliquid DEX
 * Uses user's MetaMask wallet for all operations
 */

import { ethers } from "ethers";

const MAINNET_API_URL = "https://api.hyperliquid.xyz";
const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";

// Get API URL based on environment
export const getApiUrl = () => {
  const isTestnet = import.meta.env.VITE_HYPERLIQUID_TESTNET === "true";
  return isTestnet ? TESTNET_API_URL : MAINNET_API_URL;
};

// Hyperliquid uses Arbitrum for settlement
const HYPERLIQUID_CHAIN_ID = 42161; // Arbitrum One

// EIP-712 domain for Hyperliquid
const HYPERLIQUID_DOMAIN = {
  name: "Exchange",
  version: "1",
  chainId: HYPERLIQUID_CHAIN_ID,
  verifyingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

/**
 * Get current timestamp in milliseconds
 */
function getTimestamp(): number {
  return Date.now();
}

/**
 * Sign an action using EIP-712
 */
async function signAction(
  signer: ethers.JsonRpcSigner,
  action: any,
  nonce: number
): Promise<{ r: string; s: string; v: number }> {
  // Define types based on action type
  let types: any;
  let value: any;

  if (action.type === "order") {
    types = {
      Order: [
        { name: "asset", type: "uint32" },
        { name: "isBuy", type: "bool" },
        { name: "limitPx", type: "uint64" },
        { name: "sz", type: "uint64" },
        { name: "reduceOnly", type: "bool" },
        { name: "orderType", type: "OrderType" },
      ],
      OrderType: [
        { name: "limit", type: "Limit" },
      ],
      Limit: [
        { name: "tif", type: "string" },
      ],
      Action: [
        { name: "type", type: "string" },
        { name: "orders", type: "Order[]" },
        { name: "nonce", type: "uint64" },
      ],
    };
    value = {
      type: action.type,
      orders: action.orders,
      nonce,
    };
  } else {
    // For other action types (cancel, updateLeverage, etc.), use generic structure
    types = {
      Action: [
        { name: "type", type: "string" },
        { name: "nonce", type: "uint64" },
      ],
    };
    value = {
      ...action,
      nonce,
    };
  }

  const signature = await signer.signTypedData(HYPERLIQUID_DOMAIN, types, value);
  const sig = ethers.Signature.from(signature);

  return {
    r: sig.r,
    s: sig.s,
    v: sig.v,
  };
}

/**
 * Send a signed action to Hyperliquid API
 */
async function sendAction(
  address: string,
  action: any,
  signature: { r: string; s: string; v: number },
  nonce: number
): Promise<any> {
  const response = await fetch(`${getApiUrl()}/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      nonce,
      signature,
      vaultAddress: null,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hyperliquid API error: ${error}`);
  }

  return await response.json();
}

/**
 * Get asset index from coin symbol
 */
async function getAssetIndex(coin: string): Promise<number> {
  const response = await fetch(`${getApiUrl()}/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "meta",
    }),
  });

  const data = await response.json();
  const universe = data.universe || [];

  const asset = universe.find((a: any) => a.name === coin);
  if (!asset) {
    throw new Error(`Asset ${coin} not found`);
  }

  return universe.indexOf(asset);
}

/**
 * Convert price to uint64 format (scaled by 1e8 for most assets)
 */
function priceToUint64(price: number, decimals: number = 8): string {
  return Math.floor(price * Math.pow(10, decimals)).toString();
}

/**
 * Convert size to uint64 format (scaled by 1e8)
 */
function sizeToUint64(size: number): string {
  return Math.floor(size * 1e8).toString();
}

/**
 * Place a limit order
 */
export async function placeOrder(
  signer: ethers.JsonRpcSigner,
  params: {
    coin: string;
    isBuy: boolean;
    size: number;
    limitPrice: number;
    reduceOnly?: boolean;
    tif?: "Gtc" | "Ioc" | "Alo"; // Good-til-cancel, Immediate-or-cancel, Add-liquidity-only
  }
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(params.coin);
  const nonce = getTimestamp();

  const action = {
    type: "order",
    orders: [
      {
        asset: assetIndex,
        isBuy: params.isBuy,
        limitPx: priceToUint64(params.limitPrice),
        sz: sizeToUint64(params.size),
        reduceOnly: params.reduceOnly || false,
        orderType: {
          limit: {
            tif: params.tif || "Gtc",
          },
        },
      },
    ],
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Place a market order (using IoC limit order at extreme price)
 */
export async function placeMarketOrder(
  signer: ethers.JsonRpcSigner,
  params: {
    coin: string;
    isBuy: boolean;
    size: number;
    slippage?: number; // Percentage (e.g., 0.5 for 0.5%)
  }
): Promise<any> {
  // Get current market price
  const response = await fetch(`${getApiUrl()}/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "allMids",
    }),
  });

  const mids = await response.json();
  const currentPrice = parseFloat(mids[params.coin]);

  if (!currentPrice) {
    throw new Error(`Could not get price for ${params.coin}`);
  }

  // Calculate limit price with slippage
  const slippageMultiplier = 1 + (params.slippage || 0.5) / 100;
  const limitPrice = params.isBuy
    ? currentPrice * slippageMultiplier
    : currentPrice / slippageMultiplier;

  // Use IoC (Immediate-or-cancel) to simulate market order
  return await placeOrder(signer, {
    coin: params.coin,
    isBuy: params.isBuy,
    size: params.size,
    limitPrice,
    tif: "Ioc",
  });
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  signer: ethers.JsonRpcSigner,
  params: {
    coin: string;
    oid: number; // Order ID
  }
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(params.coin);
  const nonce = getTimestamp();

  const action = {
    type: "cancel",
    cancels: [
      {
        asset: assetIndex,
        oid: params.oid,
      },
    ],
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Cancel all orders for a coin
 */
export async function cancelAllOrders(
  signer: ethers.JsonRpcSigner,
  coin: string
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(coin);
  const nonce = getTimestamp();

  const action = {
    type: "cancelByCloid",
    cancels: [
      {
        asset: assetIndex,
        cloid: "0x0000000000000000000000000000000000000000000000000000000000000000",
      },
    ],
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Modify an existing order
 */
export async function modifyOrder(
  signer: ethers.JsonRpcSigner,
  params: {
    oid: number;
    coin: string;
    isBuy: boolean;
    size: number;
    limitPrice: number;
    reduceOnly?: boolean;
  }
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(params.coin);
  const nonce = getTimestamp();

  const action = {
    type: "modify",
    oid: params.oid,
    order: {
      asset: assetIndex,
      isBuy: params.isBuy,
      limitPx: priceToUint64(params.limitPrice),
      sz: sizeToUint64(params.size),
      reduceOnly: params.reduceOnly || false,
      orderType: {
        limit: {
          tif: "Gtc",
        },
      },
    },
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Update leverage for an asset
 */
export async function updateLeverage(
  signer: ethers.JsonRpcSigner,
  params: {
    coin: string;
    leverage: number;
    isCross: boolean;
  }
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(params.coin);
  const nonce = getTimestamp();

  const action = {
    type: "updateLeverage",
    asset: assetIndex,
    isCross: params.isCross,
    leverage: params.leverage,
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Update isolated margin for a position
 */
export async function updateIsolatedMargin(
  signer: ethers.JsonRpcSigner,
  params: {
    coin: string;
    isBuy: boolean;
    ntli: number; // New target leverage inverse (1/leverage)
  }
): Promise<any> {
  const address = await signer.getAddress();
  const assetIndex = await getAssetIndex(params.coin);
  const nonce = getTimestamp();

  const action = {
    type: "updateIsolatedMargin",
    asset: assetIndex,
    isBuy: params.isBuy,
    ntli: params.ntli,
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}

/**
 * Withdraw USDC from Hyperliquid to L1
 */
export async function withdrawUSDC(
  signer: ethers.JsonRpcSigner,
  amount: number, // Amount in USDC
  destination?: string // Destination address (defaults to signer address)
): Promise<any> {
  const address = await signer.getAddress();
  const nonce = getTimestamp();

  const action = {
    type: "withdraw",
    hyperliquidChain: "Mainnet",
    signatureChainId: "0xa4b1", // Arbitrum
    amount: (amount * 1e6).toString(), // Convert to 6 decimal USDC
    time: nonce,
    destination: destination || address,
  };

  const signature = await signAction(signer, action, nonce);
  return await sendAction(address, action, signature, nonce);
}
