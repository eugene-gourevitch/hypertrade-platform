/**
 * TypeScript wrapper for Hyperliquid Python SDK integration.
 * Executes Python scripts and returns typed results.
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PYTHON_SCRIPT = path.join(__dirname, "hyperliquid.py");
const ACCOUNT_ADDRESS = process.env.HYPERLIQUID_ACCOUNT_ADDRESS || "";
const API_SECRET = process.env.HYPERLIQUID_API_SECRET || "";
const USE_TESTNET = process.env.HYPERLIQUID_TESTNET === "true";

/**
 * Execute Python command and return parsed JSON result
 */
async function executePythonCommand<T = any>(
  command: string,
  ...args: string[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    const pythonArgs = [
      PYTHON_SCRIPT,
      command,
      ACCOUNT_ADDRESS,
      API_SECRET,
      USE_TESTNET.toString(),
      ...args,
    ];

    const process = spawn("python3.11", pythonArgs);
    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${stdout}`));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface Position {
  coin: string;
  size: number;
  entry_price: number;
  position_value: number;
  unrealized_pnl: number;
  return_on_equity: number;
  leverage: number;
  liquidation_px: number | null;
}

export interface Balance {
  coin: string;
  total: number;
  hold: number;
  available: number;
}

export interface UserState {
  assetPositions: Array<{
    position: {
      coin: string;
      szi: string;
      entryPx: string;
      positionValue: string;
      unrealizedPnl: string;
      returnOnEquity: string;
      leverage: { value: string; type: string };
      liquidationPx: string | null;
    };
    type: string;
  }>;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  withdrawable: string;
}

export interface OpenOrder {
  coin: string;
  oid: number;
  side: string;
  limitPx: string;
  sz: string;
  timestamp: number;
  origSz: string;
  cloid?: string;
}

export interface Fill {
  coin: string;
  px: string;
  sz: string;
  side: string;
  time: number;
  startPosition: string;
  dir: string;
  closedPnl: string;
  hash: string;
  oid: number;
  crossed: boolean;
  fee: string;
  tid: number;
  feeToken: string;
}

export interface AssetMeta {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface OrderResult {
  status: string;
  response: {
    type: string;
    data?: {
      statuses: Array<{
        resting?: { oid: number };
        filled?: { totalSz: string; avgPx: string };
        error?: string;
      }>;
    };
  };
}

// ============================================================================
// Account Information
// ============================================================================

export async function getUserState(address?: string): Promise<UserState> {
  return executePythonCommand("get_user_state");
}

export async function getOpenOrders(address?: string): Promise<OpenOrder[]> {
  return executePythonCommand("get_open_orders");
}

export async function getUserFills(address?: string): Promise<Fill[]> {
  return executePythonCommand("get_user_fills");
}

// ============================================================================
// Market Information
// ============================================================================

export async function getMeta(): Promise<{ universe: AssetMeta[] }> {
  return executePythonCommand("get_meta");
}

export async function getSpotMeta(): Promise<any> {
  return executePythonCommand("get_spot_meta");
}

export async function getAllMids(): Promise<Record<string, string>> {
  return executePythonCommand("get_all_mids");
}

export async function getL2Snapshot(coin: string): Promise<{
  coin: string;
  levels: Array<[{ px: string; sz: string; n: number }]>;
  time: number;
}> {
  return executePythonCommand("get_l2_snapshot", coin);
}

export async function getCandlesSnapshot(
  coin: string,
  interval: string = "1m",
  startTime?: number,
  endTime?: number
): Promise<any[]> {
  const args = [coin, interval];
  if (startTime) args.push(startTime.toString());
  if (endTime) args.push(endTime.toString());
  return executePythonCommand("get_candles_snapshot", ...args);
}

// ============================================================================
// Trading Operations
// ============================================================================

export async function placeMarketOrder(
  coin: string,
  isBuy: boolean,
  size: number,
  slippage: number = 0.05
): Promise<OrderResult> {
  return executePythonCommand(
    "place_market_order",
    coin,
    isBuy.toString(),
    size.toString(),
    slippage.toString()
  );
}

export async function placeLimitOrder(
  coin: string,
  isBuy: boolean,
  size: number,
  price: number,
  reduceOnly: boolean = false,
  cloid?: string
): Promise<OrderResult> {
  const args = [
    coin,
    isBuy.toString(),
    size.toString(),
    price.toString(),
    reduceOnly.toString(),
  ];
  if (cloid) args.push(cloid);
  return executePythonCommand("place_limit_order", ...args);
}

export async function cancelOrder(coin: string, oid: number): Promise<any> {
  return executePythonCommand("cancel_order", coin, oid.toString());
}

export async function cancelAllOrders(coin?: string): Promise<any> {
  return executePythonCommand("cancel_all_orders", coin || "");
}

export async function updateLeverage(
  coin: string,
  leverage: number,
  isCross: boolean = true
): Promise<any> {
  return executePythonCommand(
    "update_leverage",
    coin,
    leverage.toString(),
    isCross.toString()
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

export function formatPosition(position: any): Position {
  return {
    coin: position.coin,
    size: parseFloat(position.szi || "0"),
    entry_price: parseFloat(position.entryPx || "0"),
    position_value: parseFloat(position.positionValue || "0"),
    unrealized_pnl: parseFloat(position.unrealizedPnl || "0"),
    return_on_equity: parseFloat(position.returnOnEquity || "0"),
    leverage: parseFloat(position.leverage?.value || "0"),
    liquidation_px: position.liquidationPx
      ? parseFloat(position.liquidationPx)
      : null,
  };
}

export function formatBalance(balance: any): Balance {
  const total = parseFloat(balance.total || "0");
  const hold = parseFloat(balance.hold || "0");
  return {
    coin: balance.coin,
    total,
    hold,
    available: total - hold,
  };
}

