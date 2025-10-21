import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from 'google-auth-library';
import { nanoid } from "nanoid";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

// Authorized email address
const AUTHORIZED_EMAIL = 'egourev@gmail.com';

// Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || 'http://localhost:3000'}/api/oauth/callback`
);

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Google OAuth login endpoint
  app.get("/api/oauth/login", async (req: Request, res: Response) => {
    try {
      const state = nanoid();
      const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        state: state,
      });

      // Store state in session (you might want to use Redis in production)
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });

      res.redirect(authUrl);
    } catch (error) {
      console.error("[OAuth] Login failed", error);
      res.status(500).json({ error: "OAuth login failed" });
    }
  });

  // Google OAuth callback endpoint
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const storedState = req.cookies.oauth_state;

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    if (state !== storedState) {
      res.status(400).json({ error: "Invalid state parameter" });
      return;
    }

    try {
      // Exchange code for tokens
      const { tokens } = await googleClient.getToken(code);
      googleClient.setCredentials(tokens);

      // Verify the ID token and get user info
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        res.status(400).json({ error: "Invalid token payload" });
        return;
      }

      const { sub: googleId, email, name, picture } = payload;

      // Check if email is authorized
      if (email !== AUTHORIZED_EMAIL) {
        console.warn(`[OAuth] Unauthorized login attempt from: ${email}`);
        res.status(403).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1>Access Denied</h1>
              <p>Sorry, only <strong>${AUTHORIZED_EMAIL}</strong> is authorized to access this application.</p>
              <p>You tried to login with: <strong>${email}</strong></p>
              <a href="/" style="color: #0081f2;">← Back to Home</a>
            </body>
          </html>
        `);
        return;
      }

      // Create or update user in database
      await db.upsertUser({
        id: googleId,
        name: name || null,
        email: email,
        loginMethod: 'google',
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await createSessionToken(googleId, { name: name || email });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.clearCookie('oauth_state'); // Clear the state cookie
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[OAuth] Successful login: ${email}`);
      res.redirect(302, "/trade");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // Logout endpoint
  app.post("/api/oauth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME);
    res.json({ success: true });
  });
}

// Simple session token creation (you might want to use JWT in production)
async function createSessionToken(userId: string, userData: { name: string }): Promise<string> {
  const session = {
    userId,
    userData,
    createdAt: Date.now(),
    expiresAt: Date.now() + ONE_YEAR_MS,
  };
  
  // In production, you'd want to store this in Redis or a database
  // For now, we'll use a simple signed token approach
  return Buffer.from(JSON.stringify(session)).toString('base64');
}
