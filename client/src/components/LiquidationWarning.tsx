import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface LiquidationWarningProps {
  positions: any[];
  mids: Record<string, number>;
}

export function LiquidationWarning({ positions, mids }: LiquidationWarningProps) {
  // Calculate risk level for each position
  const riskyPositions = positions.filter((pos) => {
    const position = pos.position;
    const currentPrice = mids[position.coin] || 0;
    const liquidationPrice = parseFloat(position.liquidationPx || "0");
    const size = parseFloat(position.szi || "0");
    
    if (size === 0 || liquidationPrice === 0 || currentPrice === 0) {
      return false;
    }
    
    // Calculate distance to liquidation as percentage
    const distancePercent = size > 0
      ? ((currentPrice - liquidationPrice) / currentPrice) * 100
      : ((liquidationPrice - currentPrice) / currentPrice) * 100;
    
    // Warn if within 20% of liquidation
    return distancePercent < 20 && distancePercent > 0;
  });

  if (riskyPositions.length === 0) {
    return null;
  }

  const criticalPositions = riskyPositions.filter((pos) => {
    const position = pos.position;
    const currentPrice = mids[position.coin] || 0;
    const liquidationPrice = parseFloat(position.liquidationPx || "0");
    const size = parseFloat(position.szi || "0");
    
    const distancePercent = size > 0
      ? ((currentPrice - liquidationPrice) / currentPrice) * 100
      : ((liquidationPrice - currentPrice) / currentPrice) * 100;
    
    // Critical if within 10% of liquidation
    return distancePercent < 10;
  });

  const isCritical = criticalPositions.length > 0;

  return (
    <Alert variant={isCritical ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">
        {isCritical ? "⚠️ CRITICAL: Liquidation Risk" : "⚠️ Warning: Approaching Liquidation"}
      </AlertTitle>
      <AlertDescription className="text-sm mt-2">
        <div className="space-y-1">
          {riskyPositions.map((pos, idx) => {
            const position = pos.position;
            const currentPrice = mids[position.coin] || 0;
            const liquidationPrice = parseFloat(position.liquidationPx || "0");
            const size = parseFloat(position.szi || "0");
            
            const distancePercent = size > 0
              ? ((currentPrice - liquidationPrice) / currentPrice) * 100
              : ((liquidationPrice - currentPrice) / currentPrice) * 100;
            
            return (
              <div key={idx} className="flex justify-between items-center">
                <span>
                  <strong>{position.coin}</strong> position is{" "}
                  <strong className={distancePercent < 10 ? "text-red-400" : "text-yellow-400"}>
                    {distancePercent.toFixed(1)}%
                  </strong>{" "}
                  from liquidation (${liquidationPrice.toFixed(2)})
                </span>
                <span className="text-xs text-muted-foreground">
                  Current: ${currentPrice.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs">
          <strong>Recommended actions:</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Add margin to your account</li>
            <li>Reduce position size or close positions</li>
            <li>Lower leverage on risky positions</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

