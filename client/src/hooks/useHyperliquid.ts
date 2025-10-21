/**
 * React hook for Hyperliquid trading operations
 * Wraps client-side SDK with React state management
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import * as hyperliquid from "@/lib/hyperliquid";
import { toast } from "sonner";
import { ethers } from "ethers";

interface TradeStatus {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useHyperliquid() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TradeStatus>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  /**
   * Get signer from MetaMask
   */
  const getSigner = useCallback(async (): Promise<ethers.JsonRpcSigner> => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Verify the signer address matches the authenticated user
    if (user && address.toLowerCase() !== user.id.toLowerCase()) {
      throw new Error(
        `Wallet mismatch: Connected ${address} but authenticated as ${user.id}`
      );
    }

    return signer;
  }, [user]);

  /**
   * Place a limit order
   */
  const placeOrder = useCallback(
    async (params: {
      coin: string;
      isBuy: boolean;
      size: number;
      limitPrice: number;
      reduceOnly?: boolean;
      tif?: "Gtc" | "Ioc" | "Alo";
    }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Placing ${params.isBuy ? "BUY" : "SELL"} order for ${params.coin}...`, {
          id: "order-tx",
        });

        const result = await hyperliquid.placeOrder(signer, params);

        toast.success(
          `Order placed: ${params.isBuy ? "BUY" : "SELL"} ${params.size} ${params.coin} @ $${params.limitPrice}`,
          { id: "order-tx" }
        );

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Order failed:", error);
        toast.error(`Order failed: ${error.message}`, { id: "order-tx" });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Place a market order
   */
  const placeMarketOrder = useCallback(
    async (params: {
      coin: string;
      isBuy: boolean;
      size: number;
      slippage?: number;
    }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(
          `Placing market ${params.isBuy ? "BUY" : "SELL"} for ${params.coin}...`,
          { id: "market-order-tx" }
        );

        const result = await hyperliquid.placeMarketOrder(signer, params);

        toast.success(
          `Market order executed: ${params.isBuy ? "BUY" : "SELL"} ${params.size} ${params.coin}`,
          { id: "market-order-tx" }
        );

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Market order failed:", error);
        toast.error(`Market order failed: ${error.message}`, {
          id: "market-order-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Cancel a specific order
   */
  const cancelOrder = useCallback(
    async (params: { coin: string; oid: number }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Cancelling order #${params.oid}...`, {
          id: "cancel-order-tx",
        });

        const result = await hyperliquid.cancelOrder(signer, params);

        toast.success(`Order #${params.oid} cancelled`, {
          id: "cancel-order-tx",
        });

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Cancel order failed:", error);
        toast.error(`Cancel failed: ${error.message}`, {
          id: "cancel-order-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Cancel all orders for a coin
   */
  const cancelAllOrders = useCallback(
    async (coin: string) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Cancelling all ${coin} orders...`, {
          id: "cancel-all-tx",
        });

        const result = await hyperliquid.cancelAllOrders(signer, coin);

        toast.success(`All ${coin} orders cancelled`, { id: "cancel-all-tx" });

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Cancel all failed:", error);
        toast.error(`Cancel all failed: ${error.message}`, {
          id: "cancel-all-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Modify an existing order
   */
  const modifyOrder = useCallback(
    async (params: {
      oid: number;
      coin: string;
      isBuy: boolean;
      size: number;
      limitPrice: number;
      reduceOnly?: boolean;
    }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Modifying order #${params.oid}...`, {
          id: "modify-order-tx",
        });

        const result = await hyperliquid.modifyOrder(signer, params);

        toast.success(`Order #${params.oid} modified`, {
          id: "modify-order-tx",
        });

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Modify order failed:", error);
        toast.error(`Modify failed: ${error.message}`, {
          id: "modify-order-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Update leverage for an asset
   */
  const updateLeverage = useCallback(
    async (params: { coin: string; leverage: number; isCross: boolean }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Updating leverage for ${params.coin}...`, {
          id: "leverage-tx",
        });

        const result = await hyperliquid.updateLeverage(signer, params);

        toast.success(
          `Leverage updated: ${params.coin} @ ${params.leverage}x (${params.isCross ? "Cross" : "Isolated"})`,
          { id: "leverage-tx" }
        );

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Update leverage failed:", error);
        toast.error(`Leverage update failed: ${error.message}`, {
          id: "leverage-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  /**
   * Close a position (market order in opposite direction)
   */
  const closePosition = useCallback(
    async (params: {
      coin: string;
      size: number;
      isLong: boolean; // Current position direction
    }) => {
      // Close by placing market order in opposite direction
      return await placeMarketOrder({
        coin: params.coin,
        isBuy: !params.isLong, // Opposite direction
        size: params.size,
        slippage: 0.5,
      });
    },
    [placeMarketOrder]
  );

  /**
   * Withdraw USDC to L1
   */
  const withdrawUSDC = useCallback(
    async (params: { amount: number; destination?: string }) => {
      setStatus({ isLoading: true, error: null, txHash: null });

      try {
        const signer = await getSigner();

        toast.loading(`Withdrawing ${params.amount} USDC...`, {
          id: "withdraw-tx",
        });

        const result = await hyperliquid.withdrawUSDC(
          signer,
          params.amount,
          params.destination
        );

        toast.success(
          `Withdrawal initiated: ${params.amount} USDC to ${params.destination || "your wallet"}`,
          { id: "withdraw-tx" }
        );

        setStatus({ isLoading: false, error: null, txHash: result.txHash });
        return result;
      } catch (error: any) {
        console.error("Withdrawal failed:", error);
        toast.error(`Withdrawal failed: ${error.message}`, {
          id: "withdraw-tx",
        });
        setStatus({ isLoading: false, error: error.message, txHash: null });
        throw error;
      }
    },
    [getSigner]
  );

  return {
    placeOrder,
    placeMarketOrder,
    cancelOrder,
    cancelAllOrders,
    modifyOrder,
    updateLeverage,
    closePosition,
    withdrawUSDC,
    status,
  };
}
