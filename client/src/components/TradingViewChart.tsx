import { useEffect, useRef, memo } from "react";

interface TradingViewChartProps {
  symbol: string;
  theme?: "light" | "dark";
}

function TradingViewChart({ symbol, theme = "dark" }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    // Load TradingView script
    if (!scriptLoaded.current) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        initWidget();
      };
      document.head.appendChild(script);
    } else if (window.TradingView) {
      initWidget();
    }

    function initWidget() {
      if (container.current && window.TradingView) {
        // Clear previous widget
        container.current.innerHTML = "";

        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}USDT`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          toolbar_bg: theme === "dark" ? "#1e222d" : "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: container.current?.id || "tradingview_chart",
          hide_side_toolbar: false,
          studies: [
            "Volume@tv-basicstudies",
          ],
          disabled_features: [
            "use_localstorage_for_settings",
            "header_symbol_search",
          ],
          enabled_features: [
            "study_templates",
            "side_toolbar_in_fullscreen_mode",
          ],
          overrides: {
            "paneProperties.background": theme === "dark" ? "#0f1419" : "#ffffff",
            "paneProperties.backgroundType": "solid",
          },
          loading_screen: {
            backgroundColor: theme === "dark" ? "#0f1419" : "#ffffff",
            foregroundColor: theme === "dark" ? "#2962FF" : "#2962FF",
          },
        });
      }
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  return (
    <div
      id="tradingview_chart"
      ref={container}
      className="w-full h-full min-h-[400px]"
    />
  );
}

export default memo(TradingViewChart);
export { TradingViewChart };

