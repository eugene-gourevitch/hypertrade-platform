/**
 * Direct HTTP client for Hyperliquid API
 * No Python required - works on Vercel!
 */

import axios from 'axios';

const MAINNET_API_URL = 'https://api.hyperliquid.xyz';
const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

const getApiUrl = () => {
  return process.env.HYPERLIQUID_TESTNET === 'true' ? TESTNET_API_URL : MAINNET_API_URL;
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Get market metadata (all available assets)
 */
export async function getMeta() {
  const response = await api.post('/info', {
    type: 'meta',
  });
  return response.data;
}

/**
 * Get all mid prices
 */
export async function getAllMids() {
  const response = await api.post('/info', {
    type: 'allMids',
  });
  return response.data;
}

/**
 * Get L2 order book snapshot
 */
export async function getL2Snapshot(coin: string) {
  const response = await api.post('/info', {
    type: 'l2Book',
    coin,
  });
  return response.data;
}

/**
 * Get user state (positions, balances, etc.)
 */
export async function getUserState(address: string) {
  const response = await api.post('/info', {
    type: 'clearinghouseState',
    user: address,
  });
  return response.data;
}

/**
 * Get open orders for user
 */
export async function getOpenOrders(address: string) {
  const response = await api.post('/info', {
    type: 'openOrders',
    user: address,
  });
  return response.data;
}

/**
 * Get user fills (trade history)
 */
export async function getUserFills(address: string) {
  const response = await api.post('/info', {
    type: 'userFills',
    user: address,
  });
  return response.data;
}

/**
 * Get candle data
 */
export async function getCandles(
  coin: string,
  interval: string,
  startTime: number,
  endTime: number
) {
  const response = await api.post('/info', {
    type: 'candleSnapshot',
    req: {
      coin,
      interval,
      startTime,
      endTime,
    },
  });
  return response.data;
}

/**
 * Get spot metadata
 */
export async function getSpotMeta() {
  const response = await api.post('/info', {
    type: 'spotMeta',
  });
  return response.data;
}

/**
 * Get spot balances for user
 */
export async function getSpotBalances(address: string) {
  const response = await api.post('/info', {
    type: 'spotClearinghouseState',
    user: address,
  });
  return response.data;
}

console.log('[HyperliquidHTTP] Initialized HTTP client for', getApiUrl());

