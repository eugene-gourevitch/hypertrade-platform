import { useEffect, useRef, memo } from "react";

interface HyperliquidChartProps {
  symbol: string;
  interval: string;
}

function HyperliquidChart({ symbol, interval }: HyperliquidChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Map Hyperliquid symbols to Binance symbols for TradingView
    const symbolMap: Record<string, string> = {
      "BTC": "BTCUSDT",
      "ETH": "ETHUSDT",
      "SOL": "SOLUSDT",
      "HYPE": "BTCUSDT", // Fallback to BTC for tokens not on Binance
      "ASTER": "BTCUSDT",
    };

    const tvSymbol = symbolMap[symbol] || "BTCUSDT";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${tvSymbol}`,
          interval: interval,
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0a0a0a",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: container.current!.id,
          studies: ["Volume@tv-basicstudies"],
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full">
      <div
        id={`tradingview_${symbol}_${interval}`}
        ref={container}
        className="w-full h-full"
      />
    </div>
  );
}

export default memo(HyperliquidChart);

