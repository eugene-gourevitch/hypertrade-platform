/**
 * MetaMask Wallet Connection Component
 * Web3 wallet authentication
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Wallet, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletConnectProps {
  onConnected?: (address: string) => void;
}

export function WalletConnect({ onConnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    setHasMetaMask(typeof window.ethereum !== 'undefined' && Boolean(window.ethereum.isMetaMask));

    // Check localStorage for saved wallet address
    const savedAddress = localStorage.getItem('wallet_address');

    // Event handlers stored for cleanup
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem('wallet_address', address);
        // Dispatch event for other components
        window.dispatchEvent(new Event('walletChanged'));
      } else {
        setWalletAddress(null);
        localStorage.removeItem('wallet_address');
        window.dispatchEvent(new Event('walletChanged'));
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);
            localStorage.setItem('wallet_address', address);
          } else if (savedAddress) {
            // Clear localStorage if MetaMask is disconnected
            localStorage.removeItem('wallet_address');
            setWalletAddress(null);
          }
        })
        .catch((error: any) => {
          console.error('[WalletConnect] Failed to get accounts:', error);
        });

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Listen for chain changes
      window.ethereum.on('chainChanged', handleChainChanged);
    } else if (savedAddress) {
      // If MetaMask not installed but wallet was saved, clear it
      localStorage.removeItem('wallet_address');
    }

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not installed", {
        description: "Please install MetaMask to continue",
        action: {
          label: "Install",
          onClick: () => window.open("https://metamask.io/download/", "_blank"),
        },
      });
      return;
    }

    // Check if MetaMask is locked
    try {
      if (window.ethereum._metamask?.isUnlocked) {
        const isUnlocked = await window.ethereum._metamask.isUnlocked();
        if (!isUnlocked) {
          toast.error("MetaMask is locked", {
            description: "Please unlock your MetaMask wallet",
          });
          return;
        }
      }
    } catch (error) {
      console.warn("[WalletConnect] Could not check if MetaMask is locked:", error);
    }

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please check your MetaMask.");
      }

      const address = accounts[0];

      // Verify we got a valid address
      if (!address || !address.startsWith('0x')) {
        throw new Error("Invalid wallet address received");
      }

      // Store wallet address in localStorage (client-side only, no server auth needed)
      localStorage.setItem('wallet_address', address);
      setWalletAddress(address);

      // Dispatch event for other components
      window.dispatchEvent(new Event('walletChanged'));

      toast.success("✅ Wallet connected successfully!", {
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      
      onConnected?.(address);

      // Redirect to trading page after a short delay
      setTimeout(() => {
        window.location.href = '/trade';
      }, 500);

    } catch (error: any) {
      console.error("[WalletConnect] Connection failed:", error);

      // Handle specific error codes
      if (error.code === 4001) {
        toast.error("Connection rejected", {
          description: "You rejected the connection request",
        });
      } else if (error.code === -32002) {
        toast.error("Request pending", {
          description: "Please check MetaMask for pending requests",
        });
      } else if (error.code === -32603) {
        toast.error("Internal error", {
          description: "MetaMask encountered an internal error. Please try again.",
        });
      } else {
        toast.error("Connection Failed", {
          description: error.message || "Please try again",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('wallet_address');

      // Clear local state
      setWalletAddress(null);

      // Show success message
      toast.success("Wallet disconnected - redirecting...");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error("[WalletAuth] Logout failed:", error);
      toast.error("Logout failed - try refreshing the page");
    }
  };

  if (!hasMetaMask) {
    return (
      <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1">MetaMask Required</h3>
            <p className="text-sm text-gray-400 mb-3">
              Please install MetaMask to connect your wallet and access the trading platform.
            </p>
            <Button
              onClick={() => window.open("https://metamask.io/download/", "_blank")}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Install MetaMask
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (walletAddress) {
    return (
      <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-xs text-gray-400">Connected Wallet</div>
              <div className="font-mono text-sm text-white">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            Disconnect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
      <div className="text-center">
        <Wallet className="h-12 w-12 text-blue-500 mx-auto mb-3" />
        <h3 className="font-semibold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-sm text-gray-400 mb-4">
          Sign in with MetaMask to access professional trading features
        </p>
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          {isConnecting ? (
            "Connecting..."
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect MetaMask
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
