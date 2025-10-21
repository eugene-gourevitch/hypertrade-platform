import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Percent, DollarSign } from "lucide-react";

interface PositionSizerProps {
  accountValue: number;
  currentPrice: number;
  leverage: number;
  onSizeChange: (size: number) => void;
}

export function PositionSizer({ accountValue, currentPrice, leverage, onSizeChange }: PositionSizerProps) {
  const [percentOfAccount, setPercentOfAccount] = useState([25]);
  const [customSize, setCustomSize] = useState("");
  const [mode, setMode] = useState<"percent" | "custom">("percent");

  // Calculate size based on percentage of account
  const calculateSize = (percent: number) => {
    if (currentPrice <= 0) return 0;
    const buyingPower = accountValue * leverage;
    const dollarAmount = (buyingPower * percent) / 100;
    return dollarAmount / currentPrice;
  };

  useEffect(() => {
    if (mode === "percent") {
      const size = calculateSize(percentOfAccount[0]);
      onSizeChange(size);
    } else {
      onSizeChange(parseFloat(customSize) || 0);
    }
  }, [percentOfAccount, customSize, mode, accountValue, currentPrice, leverage]);

  const size = mode === "percent" ? calculateSize(percentOfAccount[0]) : parseFloat(customSize) || 0;
  const notionalValue = size * currentPrice;
  const marginRequired = notionalValue / leverage;

  const quickSizeButtons = [10, 25, 50, 75, 100];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Position Size</Label>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={mode === "percent" ? "default" : "ghost"}
            className="h-6 px-2 text-xs"
            onClick={() => setMode("percent")}
          >
            <Percent className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={mode === "custom" ? "default" : "ghost"}
            className="h-6 px-2 text-xs"
            onClick={() => setMode("custom")}
          >
            <DollarSign className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {mode === "percent" ? (
        <>
          {/* Quick Size Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {quickSizeButtons.map((percent) => (
              <Button
                key={percent}
                size="sm"
                variant={percentOfAccount[0] === percent ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setPercentOfAccount([percent])}
              >
                {percent}%
              </Button>
            ))}
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Buying Power Used</span>
              <span className="font-mono font-semibold text-cyan-400">
                {percentOfAccount[0]}%
              </span>
            </div>
            <Slider
              value={percentOfAccount}
              onValueChange={setPercentOfAccount}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </>
      ) : (
        <div>
          <Label className="text-xs text-muted-foreground">Custom Size</Label>
          <Input
            type="number"
            placeholder="Enter size..."
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            className="font-mono"
          />
        </div>
      )}

      {/* Size Summary */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-accent/20 rounded p-2">
          <div className="text-muted-foreground text-[10px] mb-1">Size</div>
          <div className="font-mono font-semibold">{size.toFixed(4)}</div>
        </div>
        <div className="bg-accent/20 rounded p-2">
          <div className="text-muted-foreground text-[10px] mb-1">Value</div>
          <div className="font-mono font-semibold">${notionalValue.toFixed(2)}</div>
        </div>
        <div className="bg-accent/20 rounded p-2">
          <div className="text-muted-foreground text-[10px] mb-1">Margin</div>
          <div className="font-mono font-semibold">${marginRequired.toFixed(2)}</div>
        </div>
      </div>

      {/* Buying Power Indicator */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Available Buying Power</span>
          <span className="font-mono">${(accountValue * leverage).toFixed(2)}</span>
        </div>
        <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
            style={{ width: `${Math.min((notionalValue / (accountValue * leverage)) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Warnings */}
      {notionalValue > accountValue * leverage * 0.8 && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-500">
          ⚠️ Using {((notionalValue / (accountValue * leverage)) * 100).toFixed(0)}% of buying power
        </div>
      )}
    </div>
  );
}
