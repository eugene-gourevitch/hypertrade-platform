import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ExternalLink } from "lucide-react";

export function AccountSetupHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Getting Started with HyperTrade</DialogTitle>
          <DialogDescription>
            Follow these steps to start trading on Hyperliquid
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                1
              </span>
              Create a Hyperliquid Account
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Visit{" "}
              <a
                href="https://app.hyperliquid.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                app.hyperliquid.xyz
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and connect your wallet to create an account.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                2
              </span>
              Deposit Funds (USDC)
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Your account currently shows <strong>$0.00</strong> because no funds have been
              deposited yet. To start trading:
            </p>
            <ul className="text-sm text-muted-foreground ml-8 space-y-2 list-disc list-inside">
              <li>
                Go to{" "}
                <a
                  href="https://app.hyperliquid.xyz/trade"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Hyperliquid's official app
                </a>
              </li>
              <li>Click "Deposit" in the top right</li>
              <li>Bridge USDC from Arbitrum or other supported chains</li>
              <li>
                Minimum deposit: <strong>$10 USDC</strong> recommended
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                3
              </span>
              Generate API Keys
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Your API keys are already configured in this app. The API wallet has{" "}
              <strong>trading permissions only</strong> (no withdrawals) for security.
            </p>
            <div className="ml-8 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
              <strong>⚠️ Security Note:</strong> Your API keys can only place trades and view
              account data. They cannot withdraw funds from your account.
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                4
              </span>
              Start Trading
            </h3>
            <p className="text-sm text-muted-foreground ml-8">
              Once funds are deposited, you can:
            </p>
            <ul className="text-sm text-muted-foreground ml-8 space-y-1 list-disc list-inside">
              <li>View real-time market data and TradingView charts</li>
              <li>Place market, limit, stop loss, and take profit orders</li>
              <li>Use bracket orders (entry + SL + TP in one)</li>
              <li>Adjust leverage from 1x to 40x</li>
              <li>Monitor positions and PnL in real-time</li>
            </ul>
          </div>

          {/* Additional Info */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold">Additional Resources</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a
                href="https://hyperliquid.gitbook.io/hyperliquid-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Hyperliquid Documentation
              </a>
              <a
                href="https://app.hyperliquid.xyz/trade"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Official Hyperliquid App
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

