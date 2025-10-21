# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyperTrade is a Bloomberg-style professional trading platform for Hyperliquid DEX, built as a full-stack TypeScript monorepo with React frontend, Express backend, tRPC for type-safe API layer, and Python integration for Hyperliquid SDK. The platform provides real-time market data streaming via WebSocket, order execution, position management, and professional trading interface.

## Development Commands

### Core Commands
```bash
# Development (starts Express server with Vite dev middleware + Python daemon)
pnpm dev

# Type checking (verify TypeScript types across entire monorepo)
pnpm check

# Production build (compiles frontend with Vite + backend with esbuild)
pnpm build

# Start production server
pnpm start

# Format code with Prettier
pnpm format

# Run tests (Vitest for server-side tests)
pnpm test

# Database operations
pnpm db:push        # Generate migrations and apply to database
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Test files location: server/**/*.test.ts
```

### Python Requirements
Python 3.11+ required with hyperliquid-python-sdk:
```bash
pip3 install hyperliquid-python-sdk
```

## Architecture Overview

### Monorepo Structure

```
hypertrade-platform/
├── client/src/           # React frontend (Vite + TypeScript)
│   ├── _core/hooks/     # Core hooks (useAuth)
│   ├── components/      # Reusable UI components (shadcn/ui)
│   ├── pages/          # Route components (Home, TradingAdvanced)
│   ├── hooks/          # WebSocket and market data hooks
│   ├── lib/trpc.ts     # tRPC client setup
│   └── main.tsx        # Entry point with React Query
│
├── server/              # Express + tRPC backend
│   ├── _core/          # Core server infrastructure
│   │   ├── index.ts    # Express server entry point
│   │   ├── trpc.ts     # tRPC router and middleware
│   │   ├── context.ts  # Request context with user auth
│   │   ├── oauth.ts    # Google OAuth routes
│   │   └── sdk.ts      # Session validation
│   ├── routers.ts      # Main tRPC router composition
│   ├── websocket_router.ts  # WebSocket subscriptions
│   ├── hyperliquid_persistent.ts  # Python daemon client (PREFERRED)
│   ├── hyperliquid.ts  # Python subprocess wrapper (legacy, avoid)
│   ├── hyperliquid_websocket.ts   # Hyperliquid WebSocket client
│   ├── hyperliquid_daemon.py      # Persistent Python process
│   └── db.ts           # Drizzle ORM database layer
│
├── shared/              # Shared types and utilities
│   └── types.ts        # Unified type exports (DB + error types)
│
└── drizzle/            # Database schema and migrations
    ├── schema.ts       # Table definitions (users, trades, userSettings)
    └── relations.ts    # Foreign key relationships
```

### Path Aliases
- `@/*` → `./client/src/*` (client-side imports)
- `@shared/*` → `./shared/*` (shared across client/server)
- `@assets/*` → `./attached_assets/*` (static assets)

## Key Architectural Patterns

### 1. Type-Safe API Layer (tRPC)

The application uses tRPC v11 for end-to-end type safety:

```typescript
// Server: server/routers.ts
export const appRouter = router({
  market: router({
    getAllMids: publicProcedure.query(async () => { ... }),
  }),
  trading: router({
    placeMarketOrder: protectedProcedure
      .input(z.object({ coin, isBuy, size, slippage }))
      .mutation(async ({ input }) => { ... }),
  }),
});

export type AppRouter = typeof appRouter;

// Client: auto-generated hooks
const { data } = trpc.market.getAllMids.useQuery();
const { mutateAsync } = trpc.trading.placeMarketOrder.useMutation();
```

**Procedure Types:**
- `publicProcedure` - No authentication required
- `protectedProcedure` - Requires authenticated user (via `requireUser` middleware)
- `adminProcedure` - Requires admin role

### 2. Hyperliquid Integration: Dual-Layer Architecture

**IMPORTANT:** Always use `hyperliquid_persistent.ts` (persistent daemon) instead of `hyperliquid.ts` (spawns new process).

**Why?**
- `hyperliquid.ts` spawns new Python subprocess for each request → hits rate limits
- `hyperliquid_persistent.ts` maintains one persistent daemon → reuses SDK connection

**Python Daemon Communication:**
```typescript
// Server sends JSON commands via stdin:
{ command: "get_candles", args: { coin: "BTC", interval: "1m", ... } }

// Daemon responds via stdout:
{ success: true, data: [...] }
// or
{ success: false, error: "Error message" }
```

**Daemon lifecycle:**
- Spawned on first request to `hyperliquid_persistent.ts`
- Stays alive for entire server lifetime
- Auto-restarts on crash with 1-second delay
- Kill existing daemon: `pkill -f hyperliquid_daemon.py`

### 3. WebSocket Real-Time Data

`server/hyperliquid_websocket.ts` maintains persistent connection to `wss://api.hyperliquid.xyz/ws`:

**Channels:**
- `allMids` - All token prices (BTC: "43250.5", ETH: "2300.1", ...)
- `l2Book` - Order book for specific coin
- `trades` - Live trades feed
- `user` - Account events (fills, liquidations)
- `userFills` - User trade fills
- `candle` - Candlestick data

**Client subscriptions:**
```typescript
// Client hooks (client/src/hooks/useWebSocket.ts)
const { mids } = useAllMids();              // Real-time prices
const { book } = useL2Book('BTC');          // Order book updates
const { trades } = useTrades('BTC');        // Live trades (last 100)
const { fills } = useUserFills(user);       // Fill notifications (last 100)
```

**Auto-reconnect:** 5-second delay with exponential backoff. Ping/pong every 30s.

### 4. Authentication Flow (Google OAuth)

```
1. User clicks "Login with Google"
   ↓
2. GET /api/oauth/login
   - Generate state token (random 32 bytes)
   - Store in httpOnly cookie: oauth_state
   - Redirect to Google OAuth consent screen
   ↓
3. User consents → Google redirects to /api/oauth/callback?code=...&state=...
   ↓
4. Server validates:
   - State matches cookie (CSRF protection)
   - Exchange code for ID token with Google
   - Verify email in whitelist (currently: egourev@gmail.com only)
   ↓
5. Create/update user in database
   ↓
6. Create session token:
   - Base64-encoded JSON: { userId, userData, expiresAt: Date.now() + 365 days }
   - Set httpOnly cookie: app_session_id (expires in 1 year)
   ↓
7. Redirect to /trade with valid session
```

**Session validation (every request):**
- Extract `app_session_id` cookie
- Decode base64 → parse JSON
- Check expiration
- Fetch user from database
- Attach to tRPC context: `ctx.user`

**Protected procedures require authenticated user:**
```typescript
protectedProcedure.query(async ({ ctx }) => {
  // ctx.user is guaranteed non-null
  // Access: ctx.user.id, ctx.user.email, etc.
})
```

### 5. Database Schema (Drizzle ORM)

**Tables:**
```typescript
users {
  id: string (PK, Google ID)
  name, email: string
  loginMethod: 'google'
  role: 'user' | 'admin'
  createdAt, lastSignedIn: timestamp
}

trades {
  id: string (PK, random hex)
  userId: string (FK)
  coin, side: string
  size, price: string (precision preserved)
  orderType: 'market' | 'limit'
  status, oid: string
  filledSize, avgFillPrice, fee, pnl: nullable string
  createdAt, updatedAt: timestamp
}

userSettings {
  userId: string (PK, FK)
  defaultLeverage: string (default "1")
  defaultSlippage: string (default "0.05")
  favoriteCoins: text (JSON)
  theme: 'dark' | 'light'
  updatedAt: timestamp
}
```

**Key patterns:**
- All types inferred from schema: `export type User = typeof users.$inferSelect`
- Shared via `@shared/types` for client/server consistency
- Lazy DB initialization: `getDb()` only connects if `DATABASE_URL` set
- MySQL dialect with Drizzle Kit for migrations

### 6. Type System: End-to-End Safety

```
Database Schema (Drizzle)
  ↓ (automatic inference)
TypeScript types (User, Trade, etc.)
  ↓ (exported via @shared/types)
Server tRPC Router (AppRouter)
  ↓ (automatic client generation)
React tRPC Hooks (trpc.*.useQuery/useMutation)
  ↓ (full type safety)
UI Components
```

**Result:** Change a DB field type → TypeScript errors cascade to every affected component.

### 7. Request Lifecycle Example

**Placing a market order:**
```
1. User clicks "Buy BTC" in TradingAdvanced component
   ↓
2. trpc.trading.placeMarketOrder.useMutation()
   .mutateAsync({ coin: 'BTC', isBuy: true, size: 0.1, slippage: 0.05 })
   ↓
3. HTTP POST /api/trpc/trading.placeMarketOrder
   ↓
4. Server: protectedProcedure.mutation()
   - Middleware validates ctx.user exists
   - Calls hyperliquidPersistent.placeMarketOrder()
   ↓
5. hyperliquid_persistent.ts sends to daemon:
   { command: "place_market_order", args: { coin, isBuy, size, slippage } }
   ↓
6. Python daemon executes via hyperliquid-python-sdk
   ↓
7. Server saves trade to database (db.saveTrade)
   ↓
8. Response serialized with SuperJSON, sent to client
   ↓
9. Client mutation resolves, UI updates, toast notification shown
```

## Environment Variables

**Required for production:**
```bash
# Hyperliquid API
HYPERLIQUID_ACCOUNT_ADDRESS=0xYourAccountAddress
HYPERLIQUID_API_SECRET=YourPrivateKeyHere
HYPERLIQUID_TESTNET=false

# Database
DATABASE_URL=mysql://user:password@host:3306/dbname

# Google OAuth
OAUTH_CLIENT_ID=your_client_id.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/api/oauth/callback

# Server
PORT=3000
NODE_ENV=production
```

**Development:** Copy `.env.example` to `.env` and fill in values.

## Common Development Workflows

### Adding a New tRPC Endpoint

1. **Define procedure in `server/routers.ts`:**
   ```typescript
   myNewEndpoint: protectedProcedure
     .input(z.object({ param: z.string() }))
     .query(async ({ input, ctx }) => {
       // Business logic
       return result;
     })
   ```

2. **Use in client:**
   ```typescript
   const { data } = trpc.myNewEndpoint.useQuery({ param: 'value' });
   ```

3. Types automatically synchronized!

### Adding a New Database Table

1. **Define schema in `drizzle/schema.ts`:**
   ```typescript
   export const myTable = mysqlTable("my_table", {
     id: varchar("id", { length: 255 }).primaryKey(),
     // ... other columns
   });
   ```

2. **Export type:**
   ```typescript
   export type MyTable = typeof myTable.$inferSelect;
   ```

3. **Generate migration:**
   ```bash
   pnpm db:push
   ```

4. **Add CRUD functions in `server/db.ts`**

### Adding WebSocket Subscription

1. **Subscribe in `server/hyperliquid_websocket.ts`:**
   ```typescript
   subscribeMyChannel(params) {
     this.ws.send(JSON.stringify({ method: 'subscribe', subscription: { ... } }));
   }
   ```

2. **Add tRPC subscription in `server/websocket_router.ts`:**
   ```typescript
   subscribeMyChannel: publicProcedure
     .input(z.object({ param: z.string() }))
     .subscription(({ input }) => {
       return observable((emit) => {
         const handler = (data) => emit.next(data);
         hyperliquidWS.on('myChannel', handler);
         return () => hyperliquidWS.off('myChannel', handler);
       });
     })
   ```

3. **Use in client hook:**
   ```typescript
   function useMyChannel(param: string) {
     const [data, setData] = useState(null);
     trpc.ws.subscribeMyChannel.useSubscription({ param }, {
       onData: setData
     });
     return data;
   }
   ```

## Development vs Production

### Development (`pnpm dev`)
- Vite dev server with HMR at `http://localhost:5173` (proxied through Express)
- TypeScript files run directly with `tsx watch`
- Python daemon spawned on first request
- Auto port discovery (tries 3000, 3001, 3002, ...)

### Production (`pnpm build && pnpm start`)
- Frontend compiled to `dist/public/` (static HTML/JS/CSS)
- Backend compiled to `dist/index.js` (single Node.js file)
- Express serves static files at root, tRPC at `/api/trpc`
- Python daemon spawned on server start

## Important Security Considerations

1. **Never commit `.env` file** - Contains API secrets and private keys
2. **Email whitelist** - OAuth callback only allows hardcoded emails (see `server/_core/oauth.ts`)
3. **Protected procedures** - All trading/account endpoints require authentication
4. **HttpOnly cookies** - Session tokens never accessible to JavaScript
5. **API credentials** - Hyperliquid account address and secret never exposed to frontend

## Troubleshooting

### Daemon Not Starting
```bash
# Kill existing daemon processes
pkill -f hyperliquid_daemon.py

# Check Python version
python3.11 --version

# Verify SDK installed
pip3 show hyperliquid-python-sdk

# Restart dev server
pnpm dev
```

### Type Errors After Schema Change
```bash
# Regenerate TypeScript types
pnpm db:push

# Run type check
pnpm check
```

### WebSocket Connection Issues
- Check Hyperliquid API status
- Verify `HYPERLIQUID_TESTNET` matches your account (mainnet = false)
- Check browser console for WebSocket errors
- Restart server to reinitialize WebSocket connection

## Code Style and Conventions

- **File naming:** `camelCase.ts` for modules, `PascalCase.tsx` for React components
- **Imports:** Use path aliases (`@/`, `@shared/`) instead of relative paths
- **Error handling:** Throw `TRPCError` with appropriate error codes (UNAUTHORIZED, BAD_REQUEST, etc.)
- **Database strings:** Store numbers as strings to preserve precision (e.g., "0.123456789")
- **Async patterns:** Use async/await, avoid promise chains
- **tRPC mutations:** Always return `{ success: boolean, ... }` for consistency

## Testing Strategy

- **Unit tests:** Server-side business logic in `server/**/*.test.ts`
- **Integration tests:** tRPC endpoint testing (mock hyperliquid responses)
- **Manual testing:** Use `/trade` interface with testnet account
- **Type safety:** TypeScript compiler catches most errors at build time

## Key Dependencies

- **Frontend:** React 19, TanStack Query, tRPC client, lightweight-charts, shadcn/ui, Tailwind CSS
- **Backend:** Express, tRPC server, Drizzle ORM, mysql2, ws (WebSocket), google-auth-library
- **Build:** Vite, esbuild, TypeScript 5.9
- **Python:** hyperliquid-python-sdk (must be installed separately)
