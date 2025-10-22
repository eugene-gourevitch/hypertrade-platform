import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = '/' } =
    options ?? {};

  // Wallet-only authentication
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  useEffect(() => {
    // Check localStorage for wallet address
    const checkWallet = () => {
      const savedAddress = localStorage.getItem('wallet_address');
      setWalletAddress(savedAddress);
      setIsCheckingWallet(false);
    };

    checkWallet();

    // Listen for storage events (wallet connect/disconnect)
    window.addEventListener('storage', checkWallet);

    // Also listen for custom event from wallet hook
    const handleWalletChange = () => {
      checkWallet();
    };
    window.addEventListener('walletChanged', handleWalletChange);

    return () => {
      window.removeEventListener('storage', checkWallet);
      window.removeEventListener('walletChanged', handleWalletChange);
    };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('wallet_address');
    setWalletAddress(null);
    window.location.href = '/';
  }, []);

  const state = useMemo(() => {
    const user = walletAddress ? {
      id: walletAddress,
      name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      email: null,
      loginMethod: 'wallet' as const,
      role: 'user' as const,
    } : null;

    return {
      user,
      loading: isCheckingWallet,
      error: null,
      isAuthenticated: Boolean(user),
    };
  }, [walletAddress, isCheckingWallet]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isCheckingWallet) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isCheckingWallet,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => {
      // Re-check localStorage
      const savedAddress = localStorage.getItem('wallet_address');
      setWalletAddress(savedAddress);
    },
    logout,
  };
}
