import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { verifyMessage } from "viem";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

// Store nonces temporarily (in production, use Redis)
const nonces = new Map<string, { nonce: string; timestamp: number }>();

// Clean up old nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  for (const [address, data] of nonces.entries()) {
    if (now - data.timestamp > fiveMinutes) {
      nonces.delete(address);
    }
  }
}, 5 * 60 * 1000);

export function registerWalletAuthRoutes(app: Express) {
  /**
   * GET /api/auth/nonce
   * Generate a nonce for wallet signature
   */
  app.get("/api/auth/nonce", async (req: Request, res: Response) => {
    try {
      const address = req.query.address as string;

      if (!address || typeof address !== 'string') {
        res.status(400).json({ error: "Wallet address is required" });
        return;
      }

      // Normalize address to lowercase
      const normalizedAddress = address.toLowerCase();

      // Generate a random nonce
      const nonce = nanoid(32);

      // Store nonce with timestamp
      nonces.set(normalizedAddress, {
        nonce,
        timestamp: Date.now(),
      });

      console.log(`[WalletAuth] Generated nonce for ${normalizedAddress}`);

      res.json({
        nonce,
        message: `Sign this message to authenticate with HyperTrade:\n\nNonce: ${nonce}\nAddress: ${normalizedAddress}`,
      });
    } catch (error) {
      console.error("[WalletAuth] Failed to generate nonce", error);
      res.status(500).json({ error: "Failed to generate nonce" });
    }
  });

  /**
   * POST /api/auth/verify
   * Verify wallet signature and create session
   */
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { address, signature, message } = req.body;

      if (!address || !signature || !message) {
        res.status(400).json({ error: "Address, signature, and message are required" });
        return;
      }

      // Normalize address
      const normalizedAddress = address.toLowerCase();

      // Get stored nonce
      const storedData = nonces.get(normalizedAddress);
      if (!storedData) {
        res.status(400).json({ error: "No nonce found for this address. Please request a new nonce." });
        return;
      }

      // Verify nonce hasn't expired (5 minutes)
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - storedData.timestamp > fiveMinutes) {
        nonces.delete(normalizedAddress);
        res.status(400).json({ error: "Nonce expired. Please request a new nonce." });
        return;
      }

      // Verify the message contains the nonce
      if (!message.includes(storedData.nonce)) {
        res.status(400).json({ error: "Message does not contain the correct nonce" });
        return;
      }

      // Verify the signature
      let isValid = false;
      try {
        isValid = await verifyMessage({
          address: address as `0x${string}`,
          message,
          signature: signature as `0x${string}`,
        });
      } catch (error) {
        console.error("[WalletAuth] Signature verification failed", error);
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      if (!isValid) {
        res.status(400).json({ error: "Invalid signature" });
        return;
      }

      // Delete used nonce
      nonces.delete(normalizedAddress);

      // Create or update user in database
      await db.upsertUser({
        id: normalizedAddress,
        name: null,
        email: null,
        loginMethod: 'wallet',
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await createSessionToken(normalizedAddress, {
        name: `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[WalletAuth] Successful login: ${normalizedAddress}`);

      res.json({
        success: true,
        address: normalizedAddress,
      });
    } catch (error) {
      console.error("[WalletAuth] Verification failed", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  /**
   * POST /api/auth/logout
   * Clear session cookie
   */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}

/**
 * Create a simple session token (base64 encoded JSON)
 * In production, consider using JWT with proper signing
 */
async function createSessionToken(userId: string, userData: { name: string }): Promise<string> {
  const session = {
    userId,
    userData,
    createdAt: Date.now(),
    expiresAt: Date.now() + ONE_YEAR_MS,
  };

  return Buffer.from(JSON.stringify(session)).toString('base64');
}
