/**
 * Persistent Hyperliquid API client using a long-running Python daemon.
 * Avoids recreating clients on every request to prevent rate limiting.
 */

import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DAEMON_SCRIPT = path.join(__dirname, "hyperliquid_daemon.py");

class HyperliquidDaemon {
  private process: ChildProcess | null = null;
  private rl: readline.Interface | null = null;
  private ready = false;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }>();
  private requestIdCounter = 0;

  async start() {
    if (this.process && this.ready) {
      console.log("[Hyperliquid Daemon] Already started and ready");
      return; // Already started and ready
    }
    
    if (this.process && !this.ready) {
      console.log("[Hyperliquid Daemon] Process exists but not ready, restarting...");
      this.process.kill();
      this.process = null;
      this.rl = null;
    }

    console.log("[Hyperliquid Daemon] Starting...");
    const ACCOUNT_ADDRESS = process.env.HYPERLIQUID_ACCOUNT_ADDRESS || "";
    const API_SECRET = process.env.HYPERLIQUID_API_SECRET || "";
    const USE_TESTNET = process.env.HYPERLIQUID_TESTNET === "true";
    console.log("[Hyperliquid Daemon] Account:", ACCOUNT_ADDRESS.substring(0, 10) + "...");

    this.process = spawn("python3.11", ["-u", DAEMON_SCRIPT]);

    // Log stderr for debugging
    this.process.stderr!.on("data", (data) => {
      console.error("[Hyperliquid Daemon] stderr:", data.toString());
    });

    this.rl = readline.createInterface({
      input: this.process.stdout!,
      crlfDelay: Infinity,
    });

    // Send initialization
    this.process.stdin!.write(
      JSON.stringify({
        account_address: ACCOUNT_ADDRESS,
        api_secret: API_SECRET,
        testnet: USE_TESTNET,
      }) + "\n"
    );

    // Wait for ready signal
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Daemon initialization timeout"));
      }, 10000);

      this.rl!.once("line", (line) => {
        clearTimeout(timeout);
        console.log("[Hyperliquid Daemon] Received first line:", line);
        try {
          const response = JSON.parse(line);
          console.log("[Hyperliquid Daemon] Parsed response:", response);
          if (response.ready) {
            this.ready = true;
            console.log("[Hyperliquid Daemon] Ready!");
            resolve();
          } else {
            reject(new Error("Daemon failed to initialize"));
          }
        } catch (e) {
          console.error("[Hyperliquid Daemon] Failed to parse response:", e);
          reject(e);
        }
      });
    });

    // Handle responses
    this.rl.on("line", (line) => {
      if (!line.trim()) return;

      try {
        const response = JSON.parse(line);
        const requestId = response.id;

        if (!requestId) {
          console.warn("[Hyperliquid Daemon] Response missing request ID:", line);
          return;
        }

        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(requestId);

          if (response.success) {
            pending.resolve(response.data);
          } else {
            pending.reject(new Error(response.error || "Unknown error"));
          }
        } else {
          console.warn("[Hyperliquid Daemon] No pending request for ID:", requestId);
        }
      } catch (error) {
        console.error("[Hyperliquid Daemon] Failed to parse response:", error, "Line:", line);
      }
    });

    // Handle errors
    this.process.on("error", (error) => {
      console.error("[Hyperliquid Daemon] Process error:", error);
      this.restart();
    });

    this.process.on("exit", (code) => {
      console.log(`[Hyperliquid Daemon] Process exited with code ${code}`);
      this.ready = false;
      this.process = null;
      this.rl = null;

      // Reject all pending requests
      const error = new Error(`Daemon process exited with code ${code}`);
      for (const [id, pending] of this.pendingRequests.entries()) {
        clearTimeout(pending.timer);
        pending.reject(error);
      }
      this.pendingRequests.clear();
    });
  }

  async restart() {
    console.log("[Hyperliquid Daemon] Restarting...");
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.rl = null;
    }
    this.ready = false;
    await this.start();
  }

  async request(command: string, args: any = {}) {
    console.log(`[Hyperliquid Daemon] Request: ${command}`);
    if (!this.process || !this.ready) {
      console.log(`[Hyperliquid Daemon] Not ready, starting... (process=${!!this.process}, ready=${this.ready})`);
      await this.start();
    }

    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;

      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout: ${command}`));
      }, 30000);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
      });

      // Send request with ID
      const requestPayload = JSON.stringify({ id: requestId, command, args }) + "\n";

      try {
        const written = this.process!.stdin!.write(requestPayload);
        if (!written) {
          console.warn("[Hyperliquid Daemon] Write buffer full, waiting for drain...");
          this.process!.stdin!.once('drain', () => {
            console.log("[Hyperliquid Daemon] Buffer drained, continuing...");
          });
        }
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Failed to write request: ${error}`));
      }
    });
  }
}

// Singleton instance
const daemon = new HyperliquidDaemon();

// Export API functions
export async function getUserState(address?: string) {
  return daemon.request("get_user_state", { address });
}

export async function getAllMids() {
  return daemon.request("get_all_mids");
}

export async function getMeta() {
  return daemon.request("get_meta");
}

export async function getL2Snapshot(coin: string) {
  return daemon.request("get_l2_snapshot", { coin });
}

export async function getOpenOrders(address?: string) {
  return daemon.request("get_open_orders", { address });
}

export async function getUserFills(address?: string) {
  return daemon.request("get_user_fills", { address });
}

export async function getCandles(
  coin: string,
  interval: string,
  startTime: number,
  endTime: number
) {
  return daemon.request("get_candles", { coin, interval, startTime, endTime });
}

// Trading functions
export async function placeOrder(
  coin: string,
  is_buy: boolean,
  sz: number,
  limit_px: number,
  order_type?: any,
  reduce_only?: boolean
) {
  return daemon.request("place_order", { 
    coin, 
    is_buy, 
    sz, 
    limit_px, 
    order_type, 
    reduce_only 
  });
}

export async function cancelOrder(coin: string, oid: number) {
  return daemon.request("cancel_order", { coin, oid });
}

export async function cancelAllOrders(coin: string) {
  return daemon.request("cancel_all_orders", { coin });
}

export async function closePosition(coin: string, sz?: number) {
  return daemon.request("close_position", { coin, sz });
}

export async function modifyOrder(
  oid: number,
  coin: string,
  is_buy: boolean,
  sz: number,
  limit_px: number,
  order_type?: any,
  reduce_only?: boolean
) {
  return daemon.request("modify_order", {
    oid,
    coin,
    is_buy,
    sz,
    limit_px,
    order_type,
    reduce_only,
  });
}

