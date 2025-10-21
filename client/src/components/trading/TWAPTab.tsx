import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Info } from "lucide-react";
import { useState } from "react";

interface TWAPTabProps {
  selectedCoin: string;
  onPlaceTWAP?: (params: any) => void;
}

export function TWAPTab({ selectedCoin, onPlaceTWAP }: TWAPTabProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [totalSize, setTotalSize] = useState("");
  const [duration, setDuration] = useState("60"); // minutes
  const [numOrders, setNumOrders] = useState("10");
  const [priceLimit, setPriceLimit] = useState("");

  const handlePlaceTWAP = () => {
    if (!totalSize || !duration || !numOrders) {
      return;
    }

    const params = {
      coin: selectedCoin,
      isBuy: side === "buy",
      totalSize: parseFloat(totalSize),
      duration: parseInt(duration),
      numOrders: parseInt(numOrders),
      priceLimit: priceLimit ? parseFloat(priceLimit) : undefined,
    };

    onPlaceTWAP?.(params);
  };

  const orderSize = totalSize && numOrders ? (parseFloat(totalSize) / parseInt(numOrders)).toFixed(4) : "0";
  const interval = duration && numOrders ? (parseInt(duration) / parseInt(numOrders)).toFixed(1) : "0";

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TWAP Form */}
        <div>
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5" />
              <div className="text-xs">
                <strong className="text-blue-400">Time-Weighted Average Price (TWAP)</strong>
                <p className="text-muted-foreground mt-1">
                  Breaks large orders into smaller chunks executed over time to reduce market impact and achieve better average execution price.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Side Selection */}
            <div>
              <Label className="text-xs mb-2">Side</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={side === "buy" ? "default" : "outline"}
                  className={side === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => setSide("buy")}
                >
                  Buy
                </Button>
                <Button
                  variant={side === "sell" ? "default" : "outline"}
                  className={side === "sell" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => setSide("sell")}
                >
                  Sell
                </Button>
              </div>
            </div>

            {/* Total Size */}
            <div>
              <Label htmlFor="total-size" className="text-xs">
                Total Size ({selectedCoin})
              </Label>
              <Input
                id="total-size"
                type="number"
                placeholder="0.00"
                value={totalSize}
                onChange={(e) => setTotalSize(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Duration */}
            <div>
              <Label htmlFor="duration" className="text-xs">
                Duration (minutes)
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Orders */}
            <div>
              <Label htmlFor="num-orders" className="text-xs">
                Number of Orders
              </Label>
              <Input
                id="num-orders"
                type="number"
                placeholder="10"
                value={numOrders}
                onChange={(e) => setNumOrders(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* Price Limit (Optional) */}
            <div>
              <Label htmlFor="price-limit" className="text-xs">
                Price Limit (Optional)
              </Label>
              <Input
                id="price-limit"
                type="number"
                placeholder="Market price"
                value={priceLimit}
                onChange={(e) => setPriceLimit(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for market orders
              </p>
            </div>

            <Button
              className="w-full"
              variant={side === "buy" ? "default" : "destructive"}
              onClick={handlePlaceTWAP}
              disabled
            >
              <Clock className="mr-2 h-4 w-4" />
              Place TWAP Order (Coming Soon)
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Order Summary</h3>
          <div className="space-y-3">
            <div className="bg-accent/20 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Per Order Size</div>
              <div className="text-xl font-bold font-mono">{orderSize} {selectedCoin}</div>
            </div>

            <div className="bg-accent/20 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Order Interval</div>
              <div className="text-xl font-bold font-mono">{interval} minutes</div>
            </div>

            <div className="bg-accent/20 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Total Orders</div>
              <div className="text-xl font-bold font-mono">{numOrders}</div>
            </div>

            <div className="bg-accent/20 rounded-lg p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Execution Time</div>
              <div className="text-xl font-bold font-mono">
                {parseInt(duration) >= 60
                  ? `${(parseInt(duration) / 60).toFixed(1)} hours`
                  : `${duration} minutes`}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-xs">
              <strong className="text-yellow-400">Note:</strong>
              <p className="text-muted-foreground mt-1">
                TWAP orders require continuous monitoring and will be cancelled if you close the browser or lose connection. Consider using a server-side TWAP implementation for long-duration orders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
