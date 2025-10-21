/**
 * WebSocket Connection Status Indicator
 * Shows real-time connection status
 */

import { Badge } from "@/components/ui/badge";
import { Activity, WifiOff } from "lucide-react";

interface WebSocketStatusProps {
  isConnected: boolean;
  label?: string;
}

export function WebSocketStatus({ isConnected, label = "Live" }: WebSocketStatusProps) {
  if (isConnected) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <Activity className="h-3 w-3 animate-pulse" />
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <WifiOff className="h-3 w-3" />
      Connecting...
    </Badge>
  );
}

