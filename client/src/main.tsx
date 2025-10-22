import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi';
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

// Log errors but don't redirect (wallet-only auth now)
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get wallet address from localStorage and send it in header
        const walletAddress = localStorage.getItem('wallet_address');

        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers: {
            ...(init?.headers ?? {}),
            ...(walletAddress ? { 'x-wallet-address': walletAddress } : {}),
          },
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <WagmiProvider config={config}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </WagmiProvider>
);
