import { useState } from 'react';
import { useAccount, useConnect, useSignMessage, useDisconnect } from 'wagmi';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = async (connectorIndex: number) => {
    try {
      const connector = connectors[connectorIndex];
      if (!connector) {
        toast.error('Connector not available');
        return;
      }

      // Connect wallet
      connect({ connector });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleAuthenticate = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Step 1: Get nonce from server
      const { data: nonceData } = await axios.get(`/api/auth/nonce?address=${address}`);
      const { nonce, message } = nonceData;

      // Step 2: Sign the message
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature and create session
      const { data: verifyData } = await axios.post('/api/auth/verify', {
        address,
        signature,
        message,
      });

      if (verifyData.success) {
        toast.success('Successfully authenticated!');
        // Reload page to update auth state
        window.location.href = '/trade';
      } else {
        toast.error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-sm">
          <p className="text-muted-foreground mb-2">Connected Wallet</p>
          <p className="font-mono text-sm bg-secondary p-3 rounded">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAuthenticate}
            disabled={isAuthenticating}
            className="flex-1"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <Button
            onClick={handleDisconnect}
            variant="outline"
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground mb-2">Connect your wallet to continue</p>
      {connectors.map((connector, index) => (
        <Button
          key={connector.id}
          onClick={() => handleConnect(index)}
          disabled={isConnecting}
          variant="outline"
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              {connector.name === 'Injected' ? 'MetaMask / Browser Wallet' : connector.name}
            </>
          )}
        </Button>
      ))}
    </div>
  );
}
