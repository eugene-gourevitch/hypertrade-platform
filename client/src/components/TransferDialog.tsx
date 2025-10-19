import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function TransferDialog() {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");

  const usdTransferMutation = trpc.transfer.usdTransfer.useMutation({
    onSuccess: () => {
      toast.success("USD transfer successful");
      setDestination("");
      setAmount("");
      setOpen(false);
    },
    onError: (error) => toast.error(`Transfer failed: ${error.message}`),
  });

  const withdrawMutation = trpc.transfer.withdrawFromBridge.useMutation({
    onSuccess: () => {
      toast.success("Withdrawal initiated - may take a few minutes");
      setDestination("");
      setAmount("");
      setOpen(false);
    },
    onError: (error) => toast.error(`Withdrawal failed: ${error.message}`),
  });

  const handleUsdTransfer = () => {
    if (!destination || !amount) {
      toast.error("Please fill in all fields");
      return;
    }
    usdTransferMutation.mutate({
      destination,
      amount: parseFloat(amount),
    });
  };

  const handleWithdraw = () => {
    if (!destination || !amount) {
      toast.error("Please fill in all fields");
      return;
    }
    withdrawMutation.mutate({
      destination,
      amount: parseFloat(amount),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer & Bridge</DialogTitle>
          <DialogDescription>
            Move funds between accounts or bridge to EVM chains
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="transfer" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer">Internal Transfer</TabsTrigger>
            <TabsTrigger value="bridge">Bridge to EVM</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label>Destination Address</Label>
              <Input
                placeholder="0x..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Transfer USDC to another Hyperliquid account
              </p>
            </div>

            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleUsdTransfer}
              disabled={usdTransferMutation.isPending}
            >
              {usdTransferMutation.isPending ? "Transferring..." : "Transfer USD"}
            </Button>
          </TabsContent>

          <TabsContent value="bridge" className="space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
              <strong>⚠️ Bridge Withdrawal:</strong> Withdrawing to Arbitrum takes 5-10 minutes.
              Ensure the destination address is correct.
            </div>

            <div className="space-y-2">
              <Label>Destination Address (Arbitrum)</Label>
              <Input
                placeholder="0x..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your EVM wallet address on Arbitrum
              </p>
            </div>

            <div className="space-y-2">
              <Label>Amount (USDC)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Minimum: $10 USDC
              </p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              <ArrowUpRight className="h-4 w-4" />
              {withdrawMutation.isPending ? "Processing..." : "Withdraw to Arbitrum"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

