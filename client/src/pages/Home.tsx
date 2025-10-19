import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold text-primary">HyperTrade</div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <Button asChild variant="default">
                  <a href="/trade">Launch App</a>
                </Button>
              </>
            ) : (
              <Button asChild variant="default">
                <a href={getLoginUrl()}>Login</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
            Professional Trading Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access your Hyperliquid account with advanced trading tools,
            real-time market data, and professional-grade execution.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="text-lg px-8">
                <a href="/trade">Start Trading</a>
              </Button>
            ) : (
              <Button asChild size="lg" className="text-lg px-8">
                <a href={getLoginUrl()}>Get Started</a>
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Real-Time Data</h3>
              <p className="text-sm text-muted-foreground">
                Live market data, order book, and trade execution with minimal latency
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure Trading</h3>
              <p className="text-sm text-muted-foreground">
                API wallet integration with no withdrawal permissions for maximum security
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">Advanced Tools</h3>
              <p className="text-sm text-muted-foreground">
                Professional trading interface with position management and analytics
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Hyperliquid API • Professional Trading Platform</p>
        </div>
      </footer>
    </div>
  );
}

