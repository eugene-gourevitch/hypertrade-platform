import { useEffect, useRef, memo } from "react";

interface HyperliquidChartProps {
  symbol: string;
  interval: string;
}

function HyperliquidChart({ symbol, interval }: HyperliquidChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const loadTradingView = () => {
      if (!window.TradingView) {
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = initWidget;
        document.head.appendChild(script);
      } else {
        initWidget();
      }
    };

    const initWidget = () => {
      if (!window.TradingView || !container.current) return;

      // Clear the container
      container.current.innerHTML = '';

      // Use the free TradingView widget
      new window.TradingView.widget({
        width: "100%",
        height: "100%",
        symbol: `BINANCE:${symbol}USDT`, // Using Binance as proxy for Hyperliquid price data
        interval: interval as any,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0a0a0a",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: container.current.id,
        backgroundColor: "#0a0a0a",
        gridColor: "#1a1a1a",
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        studies: [],
      });
    };

    loadTradingView();

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval]);

  return (
    <div className="relative w-full h-full bg-background">
      <div
        id={`tradingview_${symbol}_${interval}`}
        ref={container}
        className="w-full h-full"
      />
    </div>
  );
}

export default memo(HyperliquidChart);
