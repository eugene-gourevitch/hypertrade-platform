import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Send, CheckCircle2, XCircle } from "lucide-react";

export function TelegramSettings() {
  const { data: settings, refetch } = trpc.account.getSettings.useQuery();
  const updateSettings = trpc.account.updateSettings.useMutation();

  const [chatId, setChatId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [liquidationAlerts, setLiquidationAlerts] = useState(true);
  const [fillAlerts, setFillAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [pnlAlerts, setPnlAlerts] = useState(true);

  // Load settings
  useEffect(() => {
    if (settings) {
      setChatId(settings.telegramChatId || "");
      setEnabled(settings.telegramAlertsEnabled || false);
      setLiquidationAlerts(settings.telegramLiquidationAlerts ?? true);
      setFillAlerts(settings.telegramFillAlerts ?? true);
      setPriceAlerts(settings.telegramPriceAlerts ?? true);
      setPnlAlerts(settings.telegramPnLAlerts ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        telegramChatId: chatId,
        telegramAlertsEnabled: enabled,
        telegramLiquidationAlerts,
        telegramFillAlerts,
        telegramPriceAlerts,
        telegramPnLAlerts,
      });

      toast.success("Telegram settings saved!");
      refetch();
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Telegram Alerts Setup</CardTitle>
          <CardDescription>
            Get real-time trading alerts sent directly to your Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Start the Bot</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Open Telegram and start a chat with our bot
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://t.me/HyperTradeAlertsBot', '_blank')}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Open @HyperTradeAlertsBot
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Get Your Chat ID</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Send <code className="bg-accent px-1 py-0.5 rounded">/start</code> to the bot and copy your Chat ID
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Enter Your Chat ID</h3>
                <div className="space-y-2">
                  <Label htmlFor="chatId">Telegram Chat ID</Label>
                  <Input
                    id="chatId"
                    placeholder="123456789"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the number the bot sent you when you typed /start
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enable Alerts */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="enable-alerts">Enable Telegram Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Turn on/off all Telegram notifications
              </p>
            </div>
            <Switch
              id="enable-alerts"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!chatId}
            />
          </div>

          {/* Alert Types */}
          {enabled && chatId && (
            <div className="space-y-4">
              <h3 className="font-medium">Alert Types</h3>

              <div className="space-y-3">
                {/* Liquidation Alerts */}
                <div className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <div className="text-sm font-medium">🚨 Liquidation Warnings</div>
                    <div className="text-xs text-muted-foreground">When position nears liquidation</div>
                  </div>
                  <Switch
                    checked={liquidationAlerts}
                    onCheckedChange={setLiquidationAlerts}
                  />
                </div>

                {/* Fill Alerts */}
                <div className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <div className="text-sm font-medium">✅ Order Fills</div>
                    <div className="text-xs text-muted-foreground">When your order executes</div>
                  </div>
                  <Switch
                    checked={fillAlerts}
                    onCheckedChange={setFillAlerts}
                  />
                </div>

                {/* Price Alerts */}
                <div className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <div className="text-sm font-medium">📊 Price Alerts</div>
                    <div className="text-xs text-muted-foreground">When price hits your target</div>
                  </div>
                  <Switch
                    checked={priceAlerts}
                    onCheckedChange={setPriceAlerts}
                  />
                </div>

                {/* P&L Alerts */}
                <div className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <div className="text-sm font-medium">💰 P&L Milestones</div>
                    <div className="text-xs text-muted-foreground">When you hit profit goals</div>
                  </div>
                  <Switch
                    checked={pnlAlerts}
                    onCheckedChange={setPnlAlerts}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || !chatId}
              className="flex-1"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>

            {settings?.telegramAlertsEnabled && chatId && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Active
              </div>
            )}
          </div>

          {/* Test Alert */}
          {enabled && chatId && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Test Your Connection</p>
              <p className="text-xs text-muted-foreground mb-3">
                Send a test message to make sure everything is working
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info("Test alert feature coming soon!");
                }}
              >
                Send Test Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>What You'll Get</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="text-xl">🚨</div>
              <div>
                <strong>Liquidation Warnings</strong>
                <p className="text-muted-foreground">Instant alerts when your position is at risk</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">✅</div>
              <div>
                <strong>Order Fills</strong>
                <p className="text-muted-foreground">Know immediately when your trades execute</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">📊</div>
              <div>
                <strong>Price Alerts</strong>
                <p className="text-muted-foreground">Get notified when price hits your targets</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl">💰</div>
              <div>
                <strong>P&L Milestones</strong>
                <p className="text-muted-foreground">Celebrate wins and track losses</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
