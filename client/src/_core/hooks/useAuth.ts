import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // Client-side wallet authentication (localStorage fallback for Vercel)
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  useEffect(() => {
    // Check localStorage for wallet address
    const savedAddress = localStorage.getItem('wallet_address');
    setWalletAddress(savedAddress);
    setIsCheckingWallet(false);
  }, []);

  // Try server auth first, fallback to localStorage
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      localStorage.removeItem('wallet_address');
      setWalletAddress(null);
      // Redirect to home page after logout
      window.location.href = '/';
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Server auth failed, just clear localStorage
        localStorage.removeItem('wallet_address');
        setWalletAddress(null);
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      localStorage.removeItem('wallet_address');
      setWalletAddress(null);
    }
  }, [logoutMutation, utils]);

  // Store user info in localStorage (side effect - use useEffect)
  useEffect(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
  }, [meQuery.data]);

  const state = useMemo(() => {
    // Prefer server auth, fallback to client-side wallet
    const serverUser = meQuery.data ?? null;
    const clientUser = walletAddress ? {
      id: walletAddress,
      name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      email: null,
      loginMethod: 'wallet' as const,
      role: 'user' as const,
    } : null;

    const user = serverUser || clientUser;

    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending || isCheckingWallet,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
    walletAddress,
    isCheckingWallet,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending || isCheckingWallet) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    isCheckingWallet,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      meQuery.refetch();
      // Also re-check localStorage
      const savedAddress = localStorage.getItem('wallet_address');
      setWalletAddress(savedAddress);
    },
    logout,
  };
}
