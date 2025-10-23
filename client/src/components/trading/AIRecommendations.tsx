import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Brain, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface AIRecommendationsProps {
  userState: any;
  mids: Record<string, string> | undefined;
  selectedCoin: string;
}

export function AIRecommendations({ userState, mids, selectedCoin }: AIRecommendationsProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use mutation instead of query to handle large payloads
  const getRecommendations = trpc.ai.getTradingRecommendations.useMutation();

  const handleGetAnalysis = async () => {
    if (!userState || !mids) {
      setError("Account data not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getRecommendations.mutateAsync({
        userState,
        mids: mids || {},
        selectedCoin,
      });
      
      if (result?.success) {
        setAnalysis(result.analysis);
      } else {
        setError("Failed to generate analysis");
      }
    } catch (err: any) {
      setError(err.message || "Failed to get AI recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="text-sm font-semibold">AI Trading Assistant</h3>
          <span className="text-xs text-muted-foreground">Powered by Claude</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGetAnalysis}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Get Analysis
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="text-xs text-red-500">{error}</div>
        </div>
      )}

      {!analysis && !error && !isLoading && (
        <div className="py-12 text-center">
          <Brain className="h-12 w-12 text-purple-500/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Get AI-powered trading recommendations
          </p>
          <p className="text-xs text-muted-foreground/70 max-w-md mx-auto">
            Our AI analyzes your positions, leverage, risk exposure, and market conditions to provide
            personalized risk management and P&L optimization advice.
          </p>
        </div>
      )}

      {analysis && (
        <div className="prose prose-sm prose-invert max-w-none text-sm">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-base font-semibold mt-3 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
              li: ({ node, ...props }) => <li className="text-sm" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
              code: ({ node, ...props }) => (
                <code className="bg-accent px-1 py-0.5 rounded text-xs font-mono" {...props} />
              ),
            }}
          >
            {analysis}
          </ReactMarkdown>
        </div>
      )}

      {analysis && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="text-xs text-purple-300">
            <strong>Disclaimer:</strong> AI-generated advice is for informational purposes only. Always do your own research and never invest more than you can afford to lose. Trading cryptocurrencies carries significant risk.
          </div>
        </div>
      )}
    </Card>
  );
}
