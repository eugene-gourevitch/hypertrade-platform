import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  walletAddress: string | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Accept wallet address from client header (for wallet-only auth)
  const walletAddress = opts.req.headers['x-wallet-address'] as string | undefined || null;

  // Create a synthetic user from wallet address
  let user: User | null = null;
  if (walletAddress) {
    user = {
      id: walletAddress,
      name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      email: null,
      loginMethod: 'wallet' as const,
      role: 'user' as const,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    walletAddress,
  };
}
