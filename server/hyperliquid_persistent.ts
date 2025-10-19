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
  private requestQueue: Array<{
    request: any;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];

  async start() {
    if (this.process) {
      return; // Already started
    }

    const ACCOUNT_ADDRESS = process.env.HYPERLIQUID_ACCOUNT_ADDRESS || "";
    const API_SECRET = process.env.HYPERLIQUID_API_SECRET || "";
    const USE_TESTNET = process.env.HYPERLIQUID_TESTNET === "true";

    this.process = spawn("python3.11", [DAEMON_SCRIPT]);

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
        const response = JSON.parse(line);
        if (response.ready) {
          this.ready = true;
          resolve();
        } else {
          reject(new Error("Daemon failed to initialize"));
        }
      });
    });

    // Handle responses
    this.rl.on("line", (line) => {
      if (!line.trim()) return;
      const response = JSON.parse(line);
      const pending = this.requestQueue.shift();
      if (pending) {
        if (response.success) {
          pending.resolve(response.data);
        } else {
          pending.reject(new Error(response.error));
        }
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

  async request<T = any>(command: string, args: any = {}): Promise<T> {
    if (!this.ready) {
      await this.start();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout: ${command}`));
      }, 30000);

      this.requestQueue.push({
        request: { command, args },
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      // Send request
      this.process!.stdin!.write(
        JSON.stringify({ command, args }) + "\n"
      );
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

export async function getCandles(
  coin: string,
  interval: string,
  startTime: number,
  endTime: number
) {
  return daemon.request("get_candles", { coin, interval, startTime, endTime });
}

