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

        // Check if we have a saved wallet address and verify it's still connected
        const savedAddress = localStorage.getItem('wallet_address');
        if (savedAddress) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
              // Wallet is still connected, restore the state
              const signer = await browserProvider.getSigner();
              const network = await browserProvider.getNetwork();
              
              setSigner(signer);
              setWallet({
                address: savedAddress,
                chainId: Number(network.chainId),
                isConnected: true,
                isConnecting: false,
                error: null,
              });
            } else {
              // Wallet is no longer connected, clear saved address
              localStorage.removeItem('wallet_address');
            }
          } catch (error) {
            console.error("Error checking saved wallet:", error);
            localStorage.removeItem('wallet_address');
          }
        }
      } catch (error) {
        console.error("Error initializing provider:", error);
        setWallet((prev) => ({
          ...prev,
          error: "Failed to initialize wallet provider",
        }));
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
      
      // Request account access with proper error handling
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please check your MetaMask.");
      }

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const network = await browserProvider.getNetwork();

      // Verify the address matches
      if (address.toLowerCase() !== accounts[0].toLowerCase()) {
        throw new Error("Address mismatch. Please try again.");
      }

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
      
      return address; // Return address for success handling
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      // Handle specific error codes
      let errorMessage = "Failed to connect wallet";
      if (error.code === 4001) {
        errorMessage = "Connection rejected by user";
      } else if (error.code === -32002) {
        errorMessage = "Request already pending. Check MetaMask.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      
      throw error; // Re-throw for caller to handle
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

