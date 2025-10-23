import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  }, []);

  // Initialize provider and check connection
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      setWallet((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Please install MetaMask to continue.",
      }));
      return;
    }

    const initProvider = async () => {
      try {
        if (!window.ethereum) return;
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        // Clear any stored wallet address to ensure secure connection flow
        localStorage.removeItem('wallet_address');

        // Do NOT auto-connect - user must explicitly click "Connect Wallet"
        // This ensures MetaMask prompts for permission every time
      } catch (error) {
        console.error("Error initializing provider:", error);
      }
    };

    initProvider();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setWallet({
          address: null,
          chainId: null,
          isConnected: false,
          isConnecting: false,
          error: null,
        });
        setSigner(null);
        localStorage.removeItem('wallet_address');
        window.dispatchEvent(new Event('walletChanged'));
      } else {
        // Account changed
        setWallet((prev) => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
        }));
        localStorage.setItem('wallet_address', accounts[0]);
        window.dispatchEvent(new Event('walletChanged'));
      }
    };

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setWallet((prev) => ({
        ...prev,
        chainId: parseInt(chainId, 16),
      }));
      // Don't auto-reload - let user stay on the page
      // window.location.reload();
    };

    if (window.ethereum?.on && window.ethereum?.removeListener) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setWallet((prev) => ({
        ...prev,
        error: "MetaMask is not installed",
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signer);
      setWallet({
        address,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
        error: null,
      });

      // Save wallet address to localStorage for authentication
      localStorage.setItem('wallet_address', address);
      window.dispatchEvent(new Event('walletChanged'));
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      }));
    }
  }, [isMetaMaskInstalled]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    setSigner(null);
    setProvider(null);

    // Clear wallet address from localStorage
    localStorage.removeItem('wallet_address');
    window.dispatchEvent(new Event('walletChanged'));
  }, []);

  // Sign message
  const signMessage = useCallback(
    async (message: string) => {
      if (!signer) {
        throw new Error("Wallet not connected");
      }
      return await signer.signMessage(message);
    },
    [signer]
  );

  // Sign typed data (for Hyperliquid orders)
  const signTypedData = useCallback(
    async (domain: any, types: any, value: any) => {
      if (!signer) {
        throw new Error("Wallet not connected");
      }
      return await signer.signTypedData(domain, types, value);
    },
    [signer]
  );

  return {
    ...wallet,
    provider,
    signer,
    connect,
    disconnect,
    signMessage,
    signTypedData,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
}

