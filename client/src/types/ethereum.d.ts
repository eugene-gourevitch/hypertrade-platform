import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isConnected?: () => boolean;
      // Standard EIP-1193 methods
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      // Event methods
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      // Legacy methods (still used by some dApps)
      enable?: () => Promise<string[]>;
      send?: (method: string, params?: any[]) => Promise<any>;
      sendAsync?: (payload: any, callback: (error: Error | null, result?: any) => void) => void;
      // MetaMask specific
      _metamask?: {
        isUnlocked?: () => Promise<boolean>;
      };
      // Network properties
      chainId?: string;
      networkVersion?: string;
      selectedAddress?: string | null;
    } & ethers.Eip1193Provider;
    TradingView?: any;
  }
}

export {};

