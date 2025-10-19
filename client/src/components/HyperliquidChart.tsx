import { useEffect, useRef, memo } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { trpc } from "@/lib/trpc";

interface HyperliquidChartProps {
  symbol: string;
  theme?: "light" | "dark";
}

const INTERVAL_OPTIONS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];

function HyperliquidChart({ symbol, theme = "dark" }: HyperliquidChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const intervalRef = useRef<string>("1h");

  const { data: candles, refetch } = trpc.market.getCandlesSnapshot.useQuery(
    {
      coin: symbol,
      interval: intervalRef.current,
      startTime: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
      endTime: Date.now(),
    },
    {
      refetchInterval: 5000, // Update every 5 seconds
      enabled: !!symbol,
    }
  );

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme === "dark" ? "#0f1419" : "#ffffff" },
        textColor: theme === "dark" ? "#d1d4dc" : "#191919",
      },
      grid: {
        vertLines: { color: theme === "dark" ? "#1e222d" : "#e1e3eb" },
        horzLines: { color: theme === "dark" ? "#1e222d" : "#e1e3eb" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    candleSeriesRef.current = candleSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [theme]);

  // Update chart data
  useEffect(() => {
    if (!candles || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    try {
      const candleData = candles.map((c: any) => ({
        time: Math.floor(c.t / 1000) as any, // Convert to seconds
        open: parseFloat(c.o),
        high: parseFloat(c.h),
        low: parseFloat(c.l),
        close: parseFloat(c.c),
      }));

      const volumeData = candles.map((c: any) => ({
        time: Math.floor(c.t / 1000) as any,
        value: parseFloat(c.v),
        color: parseFloat(c.c) >= parseFloat(c.o) ? "#26a69a80" : "#ef535080",
      }));

      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error("[HyperliquidChart] Error updating chart:", error);
    }
  }, [candles]);

  const changeInterval = (newInterval: string) => {
    intervalRef.current = newInterval;
    refetch();
  };

  return (
    <div className="relative w-full h-full">
      {/* Interval selector */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm rounded p-1">
        {INTERVAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => changeInterval(option.value)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              intervalRef.current === option.value
                ? "bg-cyan-500 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Data source indicator */}
      <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        Hyperliquid Live Data
      </div>
    </div>
  );
}

export default memo(HyperliquidChart);

