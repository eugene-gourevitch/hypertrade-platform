import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { useState } from "react";

interface TPSLOrderEntryProps {
  selectedCoin: string;
  currentPrice: string;
  onPlaceOrder: (params: any) => void;
  isLoading?: boolean;
}

export function TPSLOrderEntry({ selectedCoin, currentPrice, onPlaceOrder, isLoading }: TPSLOrderEntryProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("limit");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [reduceOnly, setReduceOnly] = useState(false);

  // TP/SL settings
  const [enableTP, setEnableTP] = useState(false);
  const [enableSL, setEnableSL] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState("");
  const [stopLossPrice, setStopLossPrice] = useState("");
  const [tpPercent, setTpPercent] = useState("5");
  const [slPercent, setSlPercent] = useState("3");

  // Auto-calculate TP/SL based on percentage
  const handleTPPercentChange = (percent: string) => {
    setTpPercent(percent);
    const basePrice = parseFloat(price || currentPrice);
    if (!basePrice) return;

    const multiplier = side === "buy" ? 1 + parseFloat(percent) / 100 : 1 - parseFloat(percent) / 100;
    setTakeProfitPrice((basePrice * multiplier).toFixed(2));
  };

  const handleSLPercentChange = (percent: string) => {
    setSlPercent(percent);
    const basePrice = parseFloat(price || currentPrice);
    if (!basePrice) return;

    const multiplier = side === "buy" ? 1 - parseFloat(percent) / 100 : 1 + parseFloat(percent) / 100;
    setStopLossPrice((basePrice * multiplier).toFixed(2));
  };

  const handlePlaceOrder = () => {
    if (!size || parseFloat(size) <= 0) {
      return;
    }

    const baseOrder = {
      coin: selectedCoin,
      isBuy: side === "buy",
      size: parseFloat(size),
      orderType,
      reduceOnly,
    };

    const limitPrice = orderType === "limit" ? parseFloat(price) : undefined;

    const params = {
      ...baseOrder,
      limitPrice,
      takeProfit: enableTP && takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
      stopLoss: enableSL && stopLossPrice ? parseFloat(stopLossPrice) : undefined,
    };

    onPlaceOrder(params);
  };

  // Calculate P&L estimates
  const calculatePnL = () => {
    const sizeNum = parseFloat(size || "0");
    const entryPrice = parseFloat(price || currentPrice || "0");

    if (!sizeNum || !entryPrice) return { tp: 0, sl: 0 };

    const tpPrice = parseFloat(takeProfitPrice || "0");
    const slPrice = parseFloat(stopLossPrice || "0");

    const tpPnL = side === "buy"
      ? (tpPrice - entryPrice) * sizeNum
      : (entryPrice - tpPrice) * sizeNum;

    const slPnL = side === "buy"
      ? (slPrice - entryPrice) * sizeNum
      : (entryPrice - slPrice) * sizeNum;

    return { tp: tpPnL, sl: slPnL };
  };

  const { tp: tpPnL, sl: slPnL } = calculatePnL();

  return (
    <div className="space-y-4">
      {/* Order Type Tabs */}
      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Side Selection */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={side === "buy" ? "default" : "outline"}
          className={side === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
          onClick={() => setSide("buy")}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Buy
        </Button>
        <Button
          variant={side === "sell" ? "default" : "outline"}
          className={side === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
          onClick={() => setSide("sell")}
        >
          <TrendingDown className="mr-2 h-4 w-4" />
          Sell
        </Button>
      </div>

      {/* Price (for limit orders) */}
      {orderType === "limit" && (
        <div>
          <Label htmlFor="price" className="text-xs">Entry Price</Label>
          <Input
            id="price"
            type="number"
            placeholder={currentPrice}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="font-mono"
          />
        </div>
      )}

      {/* Size */}
      <div>
        <Label htmlFor="size" className="text-xs">Size ({selectedCoin})</Label>
        <Input
          id="size"
          type="number"
          placeholder="0.00"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="font-mono"
        />
      </div>

      {/* Reduce Only */}
      <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
        <Label htmlFor="reduce-only" className="text-xs">Reduce Only</Label>
        <Switch
          id="reduce-only"
          checked={reduceOnly}
          onCheckedChange={setReduceOnly}
        />
      </div>

      {/* Take Profit Section */}
      <div className="border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            <Label className="text-xs font-semibold">Take Profit</Label>
          </div>
          <Switch
            checked={enableTP}
            onCheckedChange={setEnableTP}
          />
        </div>

        {enableTP && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">% Gain</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={tpPercent}
                  onChange={(e) => handleTPPercentChange(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={takeProfitPrice}
                  onChange={(e) => setTakeProfitPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            {tpPnL > 0 && (
              <div className="text-xs text-green-500 font-mono">
                Estimated profit: +${tpPnL.toFixed(2)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stop Loss Section */}
      <div className="border border-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-red-500" />
            <Label className="text-xs font-semibold">Stop Loss</Label>
          </div>
          <Switch
            checked={enableSL}
            onCheckedChange={setEnableSL}
          />
        </div>

        {enableSL && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">% Loss</Label>
                <Input
                  type="number"
                  placeholder="3"
                  value={slPercent}
                  onChange={(e) => handleSLPercentChange(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Price</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
            {slPnL < 0 && (
              <div className="text-xs text-red-500 font-mono">
                Estimated loss: ${slPnL.toFixed(2)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Place Order Button */}
      <Button
        className="w-full"
        variant={side === "buy" ? "default" : "destructive"}
        onClick={handlePlaceOrder}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : `${side === "buy" ? "Buy" : "Sell"} ${selectedCoin}`}
      </Button>

      {/* Risk Summary */}
      {(enableTP || enableSL) && (
        <div className="p-3 bg-accent/10 rounded-lg text-xs space-y-1">
          <div className="font-semibold mb-2">Risk/Reward Summary</div>
          {enableTP && (
            <div className="flex justify-between text-green-500">
              <span>Potential Profit:</span>
              <span className="font-mono">+${tpPnL.toFixed(2)}</span>
            </div>
          )}
          {enableSL && (
            <div className="flex justify-between text-red-500">
              <span>Potential Loss:</span>
              <span className="font-mono">${slPnL.toFixed(2)}</span>
            </div>
          )}
          {enableTP && enableSL && (
            <div className="flex justify-between text-cyan-400 pt-2 border-t border-border mt-2">
              <span>Risk/Reward Ratio:</span>
              <span className="font-mono font-semibold">
                1:{Math.abs(tpPnL / slPnL).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
