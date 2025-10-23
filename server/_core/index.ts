import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerWalletAuthRoutes } from "./walletAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { hyperliquidWS } from "../hyperliquid_websocket";
import { startLiquidationMonitor } from "../liquidation_monitor";
import { logEnvironmentStatus } from "./validateEnv";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Validate environment variables before starting
  logEnvironmentStatus();
  
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser for session management
  app.use(cookieParser());
  // Wallet authentication routes
  registerWalletAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  console.log(`[Server] NODE_ENV: "${process.env.NODE_ENV}"`);
  console.log(`[Server] NODE_ENV type: ${typeof process.env.NODE_ENV}`);
  console.log(`[Server] NODE_ENV === "development": ${process.env.NODE_ENV === "development"}`);
  
  if (process.env.NODE_ENV === "development") {
    console.log("[Server] Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("[Server] Setting up static file serving...");
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Initialize WebSocket connections
    console.log('[Server] Initializing Hyperliquid WebSocket...');
    hyperliquidWS.subscribeAllMids();

    // Log WebSocket events
    hyperliquidWS.on('connected', () => {
      console.log('[Server] ✅ WebSocket connected and subscribed');
    });

    hyperliquidWS.on('error', (error) => {
      console.error('[Server] WebSocket error:', error.message);
    });

    // Start liquidation monitoring service
    if (process.env.ENABLE_LIQUIDATION_ALERTS === "true") {
      console.log('[Server] Starting liquidation monitor...');
      startLiquidationMonitor();
    } else {
      console.log('[Server] Liquidation alerts disabled (set ENABLE_LIQUIDATION_ALERTS=true to enable)');
    }
  });
}

startServer().catch(console.error);
