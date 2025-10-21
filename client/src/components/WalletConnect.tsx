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

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletConnectProps {
  onConnected?: (address: string) => void;
}

export function WalletConnect({ onConnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    setHasMetaMask(typeof window.ethereum !== 'undefined');
    
    // Check if already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(console.error);

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
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

    setIsConnecting(true);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const address = accounts[0];
      setWalletAddress(address);

      // Get nonce from server
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!nonceRes.ok) {
        throw new Error('Failed to get nonce');
      }

      const { message, nonce } = await nonceRes.json();

      // Sign message with MetaMask
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Verify signature on server
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ address, signature, nonce }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const { success } = await verifyRes.json();

      if (success) {
        toast.success("✅ Wallet connected successfully!");
        onConnected?.(address);
        // Redirect to trading page
        window.location.href = '/trade';
      }
    } catch (error: any) {
      console.error("[WalletAuth] Connection failed:", error);
      
      if (error.code === 4001) {
        toast.error("Connection rejected", {
          description: "You rejected the connection request",
        });
      } else if (error.message.includes('Only') || error.message.includes('authorized')) {
        toast.error("Access Denied", {
          description: error.message,
        });
      } else {
        toast.error("Connection failed", {
          description: error.message || "Please try again",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setWalletAddress(null);
      toast.success("Wallet disconnected");
      window.location.href = '/';
    } catch (error) {
      console.error("[WalletAuth] Logout failed:", error);
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
