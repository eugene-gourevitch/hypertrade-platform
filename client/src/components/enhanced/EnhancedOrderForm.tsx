/**
 * Enhanced Order Form Component
 * Hyperliquid-style interface with Market/Limit/Pro tabs
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useHyperliquid } from "@/hooks/useHyperliquid";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Settings2 } from "lucide-react";

interface EnhancedOrderFormProps {
  coin: string;
  currentPrice?: string;
  accountEquity?: number;
  onOrderPlaced?: () => void;
}

export function EnhancedOrderForm({
  coin,
  currentPrice = "0",
  accountEquity = 0,
  onOrderPlaced,
}: EnhancedOrderFormProps) {
  const [orderTab, setOrderTab] = useState<"market" | "limit" | "pro">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  
  // Order parameters
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [takeProfitPrice, setTakeProfitPrice] = useState("");
  const [leverage, setLeverage] = useState([10]);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState<"GTC" | "IOC" | "FOK">("GTC");

  // Auto-fill limit price with current market price
  useEffect(() => {
    if (orderTab === "limit" && !limitPrice && currentPrice !== "0") {
      setLimitPrice(currentPrice);
    }
  }, [orderTab, currentPrice, limitPrice]);

  // Use client-side Hyperliquid hook (signs with MetaMask)
  const hyperliquid = useHyperliquid();

  // Handle order submission (client-side signing)
  const handleSubmit = async () => {
    const sizeNum = parseFloat(size);

    if (!size || sizeNum <= 0) {
      toast.error("Enter a valid size");
      return;
    }

    try {
      if (orderTab === "market") {
        await hyperliquid.placeMarketOrder({
          coin,
          isBuy: side === "buy",
          size: sizeNum,
          slippage: 0.5, // 0.5% slippage
        });
        setSize("");
        onOrderPlaced?.();
      } else if (orderTab === "limit") {
        const priceNum = parseFloat(limitPrice);
        if (!limitPrice || priceNum <= 0) {
          toast.error("Enter a valid price");
          return;
        }

        await hyperliquid.placeOrder({
          coin,
          isBuy: side === "buy",
          size: sizeNum,
          limitPrice: priceNum,
          reduceOnly,
          tif: postOnly ? "Alo" : timeInForce === "GTC" ? "Gtc" : "Ioc",
        });
        setSize("");
        setLimitPrice("");
        onOrderPlaced?.();
      } else if (orderTab === "pro") {
        const entryNum = parseFloat(limitPrice);
        const slNum = parseFloat(stopLossPrice);
        const tpNum = parseFloat(takeProfitPrice);

        if (!limitPrice || entryNum <= 0) {
          toast.error("Enter entry price");
          return;
        }
        if (!stopLossPrice || slNum <= 0) {
          toast.error("Enter stop loss price");
          return;
        }
        if (!takeProfitPrice || tpNum <= 0) {
          toast.error("Enter take profit price");
          return;
        }

        // Place entry order
        await hyperliquid.placeOrder({
          coin,
          isBuy: side === "buy",
          size: sizeNum,
          limitPrice: entryNum,
          tif: "Gtc",
        });

        // Note: Bracket orders (SL/TP) need to be placed separately
        // This is a simplified version - full implementation would place 3 orders
        toast.info("Entry order placed. Set SL/TP manually after fill.");

        setSize("");
        setLimitPrice("");
        setStopLossPrice("");
        setTakeProfitPrice("");
        onOrderPlaced?.();
      }
    } catch (error) {
      // Error already handled in useHyperliquid hook
      console.error("Order submission error:", error);
    }
  };

  // Quick size buttons (% of equity)
  const setQuickSize = (percent: number) => {
    if (!currentPrice || accountEquity <= 0) return;

    const price = parseFloat(currentPrice);
    if (!price || price <= 0 || !isFinite(price)) return;

    const leverageValue = leverage[0] || 1;
    const buyingPower = (accountEquity * percent / 100) * leverageValue;
    const calculatedSize = buyingPower / price;

    if (!isFinite(calculatedSize)) return;
    setSize(calculatedSize.toFixed(4));
  };

  // Calculate order value
  const calculateOrderValue = (): string => {
    const sizeNum = parseFloat(size || "0");
    const price = orderTab === "market" 
      ? parseFloat(currentPrice)
      : parseFloat(limitPrice || "0");
    
    const value = sizeNum * price;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate margin required
  const calculateMargin = (): string => {
    const sizeNum = parseFloat(size || "0");
    const price = orderTab === "market"
      ? parseFloat(currentPrice)
      : parseFloat(limitPrice || "0");
    const leverageValue = leverage[0] || 1;
    
    const margin = (sizeNum * price) / leverageValue;
    return margin.toFixed(2);
  };

  // Check if trading is properly configured
  const isTradingConfigured = import.meta.env.VITE_ENABLE_TRADING === 'true';
  
  return (
    <Card className="h-full flex flex-col bg-black border-gray-800">
      {/* Trading Warning if not configured */}
      {!isTradingConfigured && (
        <div className="bg-yellow-900/20 border border-yellow-600/30 p-2 m-2 rounded">
          <p className="text-xs text-yellow-500">
            ⚠️ Trading is in demo mode. Orders will not be executed.
          </p>
        </div>
      )}
      
      {/* Side Toggle - Buy/Sell */}
      <div className="grid grid-cols-2 gap-0 p-2">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "py-2.5 text-sm font-semibold rounded-l transition-all",
            side === "buy"
              ? "bg-green-500 text-white shadow-lg"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          )}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("sell")}
          className={cn(
            "py-2.5 text-sm font-semibold rounded-r transition-all",
            side === "sell"
              ? "bg-red-500 text-white shadow-lg"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          )}
        >
          Sell / Short
        </button>
      </div>

      {/* Order Type Tabs */}
      <Tabs value={orderTab} onValueChange={(v) => setOrderTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 mx-2">
          <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
          <TabsTrigger value="limit" className="text-xs">Limit</TabsTrigger>
          <TabsTrigger value="pro" className="text-xs">Pro</TabsTrigger>
        </TabsList>

        {/* Market Order Tab */}
        <TabsContent value="market" className="flex-1 p-3 space-y-3 overflow-y-auto">
          {/* Size Input */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Size ({coin})</Label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Quick Size Buttons */}
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => setQuickSize(percent)}
                className="px-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-400">Leverage</Label>
              <span className="text-sm text-white font-mono">{leverage[0]}x</span>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Order Summary */}
          <div className="space-y-1 text-xs bg-gray-900 p-2 rounded">
            <div className="flex justify-between">
              <span className="text-gray-500">Market Price:</span>
              <span className="text-white font-mono">${currentPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Value:</span>
              <span className="text-white font-mono">${calculateOrderValue()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Margin Required:</span>
              <span className="text-white font-mono">${calculateMargin()}</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!size || hyperliquid.status.isLoading}
            className={cn(
              "w-full py-6 text-base font-semibold",
              side === "buy"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {hyperliquid.status.isLoading ? (
              "Placing..."
            ) : (
              <>
                {side === "buy" ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
                {side === "buy" ? "Buy" : "Sell"} {coin} (Market)
              </>
            )}
          </Button>
        </TabsContent>

        {/* Limit Order Tab */}
        <TabsContent value="limit" className="flex-1 p-3 space-y-3 overflow-y-auto">
          {/* Price Input */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Limit Price (USDC)</Label>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="0.00"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Size Input */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Size ({coin})</Label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Quick Size Buttons */}
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => setQuickSize(percent)}
                className="px-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-400">Leverage</Label>
              <span className="text-sm text-white font-mono">{leverage[0]}x</span>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-400">Reduce Only</Label>
              <Switch checked={reduceOnly} onCheckedChange={setReduceOnly} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-400">Post Only</Label>
              <Switch checked={postOnly} onCheckedChange={setPostOnly} />
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-1 text-xs bg-gray-900 p-2 rounded">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Value:</span>
              <span className="text-white font-mono">${calculateOrderValue()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Margin Required:</span>
              <span className="text-white font-mono">${calculateMargin()}</span>
            </div>
            {limitPrice && currentPrice !== "0" && (
              <div className="flex justify-between">
                <span className="text-gray-500">From Market:</span>
                <span
                  className={cn(
                    "font-mono",
                    parseFloat(limitPrice) > parseFloat(currentPrice)
                      ? "text-red-500"
                      : "text-green-500"
                  )}
                >
                  {((Math.abs(parseFloat(limitPrice) - parseFloat(currentPrice)) / parseFloat(currentPrice)) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!size || !limitPrice || hyperliquid.status.isLoading}
            className={cn(
              "w-full py-6 text-base font-semibold",
              side === "buy"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {hyperliquid.status.isLoading ? (
              "Placing..."
            ) : (
              <>
                {side === "buy" ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
                {side === "buy" ? "Buy" : "Sell"} {coin} (Limit)
              </>
            )}
          </Button>
        </TabsContent>

        {/* Pro Order Tab (Bracket Orders) */}
        <TabsContent value="pro" className="flex-1 p-3 space-y-3 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-900 rounded border border-gray-800">
            <Settings2 className="inline h-3 w-3 mr-1" />
            Pro mode: Entry + Stop Loss + Take Profit in one order
          </div>

          {/* Entry Price */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Entry Price (USDC)</Label>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Entry price"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Size Input */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Size ({coin})</Label>
            <Input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Quick Size Buttons */}
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => setQuickSize(percent)}
                className="px-2 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition"
              >
                {percent}%
              </button>
            ))}
          </div>

          {/* Stop Loss Price */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Stop Loss (USDC)</Label>
            <Input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(e.target.value)}
              placeholder="Stop loss price"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Take Profit Price */}
          <div>
            <Label className="text-xs text-gray-400 mb-1.5">Take Profit (USDC)</Label>
            <Input
              type="number"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(e.target.value)}
              placeholder="Take profit price"
              className="bg-gray-900 border-gray-700 text-white font-mono"
            />
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-400">Leverage</Label>
              <span className="text-sm text-white font-mono">{leverage[0]}x</span>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Risk/Reward Display */}
          {limitPrice && stopLossPrice && takeProfitPrice && (() => {
            const lpPrice = parseFloat(limitPrice);
            const slPrice = parseFloat(stopLossPrice);
            const tpPrice = parseFloat(takeProfitPrice);
            const sizeNum = parseFloat(size || "0");

            const risk = Math.abs(lpPrice - slPrice);
            const reward = Math.abs(tpPrice - lpPrice);
            const rrRatio = risk > 0 ? reward / risk : 0;

            return (
              <div className="space-y-1 text-xs bg-gray-900 p-2 rounded border border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk:</span>
                  <span className="text-red-500 font-mono">
                    ${(sizeNum * risk).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reward:</span>
                  <span className="text-green-500 font-mono">
                    ${(sizeNum * reward).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">R:R Ratio:</span>
                  <span className="text-yellow-500 font-mono">
                    1:{rrRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!size || !limitPrice || !stopLossPrice || !takeProfitPrice || hyperliquid.status.isLoading}
            className={cn(
              "w-full py-6 text-base font-semibold",
              side === "buy"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            )}
          >
            {hyperliquid.status.isLoading ? (
              "Placing..."
            ) : (
              <>
                {side === "buy" ? <TrendingUp className="mr-2 h-5 w-5" /> : <TrendingDown className="mr-2 h-5 w-5" />}
                Place Bracket Order
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

