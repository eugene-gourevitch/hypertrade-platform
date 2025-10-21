import { useEffect, useRef, memo } from "react";
import { trpc } from "@/lib/trpc";
import { createHyperliquidDatafeed } from "@/lib/hyperliquid-datafeed";

interface HyperliquidChartProps {
  symbol: string;
  interval: string;
}

function HyperliquidChart({ symbol, interval }: HyperliquidChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const tvWidget = useRef<any>(null);
  const trpcUtils = trpc.useUtils();

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

      // Clean up previous widget
      if (tvWidget.current) {
        tvWidget.current.remove();
        tvWidget.current = null;
      }

      const widgetOptions = {
        symbol: `HYPERLIQUID:${symbol}USDC`,
        datafeed: createHyperliquidDatafeed(trpcUtils),
        interval: interval,
        container: container.current,
        library_path: "/charting_library/",
        locale: "en",
        disabled_features: ["use_localstorage_for_settings"],
        enabled_features: ["study_templates"],
        fullscreen: false,
        autosize: true,
        theme: "dark",
        toolbar_bg: "#0a0a0a",
        overrides: {
          "paneProperties.background": "#0a0a0a",
          "paneProperties.backgroundType": "solid",
          "mainSeriesProperties.candleStyle.upColor": "#22c55e",
          "mainSeriesProperties.candleStyle.downColor": "#ef4444",
          "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
          "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
        },
        studies_overrides: {},
        time_frames: [
          { text: "1h", resolution: "1", description: "1 Hour" },
          { text: "4h", resolution: "15", description: "4 Hours" },
          { text: "1d", resolution: "60", description: "1 Day" },
          { text: "1w", resolution: "240", description: "1 Week" },
          { text: "1m", resolution: "1D", description: "1 Month" },
        ],
      };

      try {
        tvWidget.current = new window.TradingView.widget(widgetOptions);
      } catch (error) {
        console.error("[HyperliquidChart] Error initializing TradingView widget:", error);
      }
    };

    loadTradingView();

    return () => {
      if (tvWidget.current) {
        tvWidget.current.remove();
        tvWidget.current = null;
      }
    };
  }, [symbol, interval, trpcUtils]);

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
