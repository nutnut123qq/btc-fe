"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { KlineOHLC } from "@/lib/types";
import { ema, bollinger } from "@/lib/indicators";

type Props = {
  data: KlineOHLC[];
  height?: number;
  highlightWindow?: { startTimeMs: number; endTimeMs: number } | null;
};

function estimateBarSeconds(data: KlineOHLC[]): number {
  if (data.length < 2) return 60;
  let total = 0;
  let count = 0;
  for (let i = 1; i < Math.min(data.length, 20); i++) {
    total += (data[i].openTimeMs - data[i - 1].openTimeMs) / 1000;
    count++;
  }
  return count > 0 ? Math.round(total / count) : 60;
}

export function BtcCandlestickChart({ data, height = 440, highlightWindow }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || data.length === 0) return;

    const chart = createChart(el, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9CA3AF",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      rightPriceScale: {
        borderColor: "#374151",
        scaleMargins: { top: 0.06, bottom: 0.28 },
      },
      timeScale: {
        borderColor: "#374151",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: { time: true, price: true },
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderVisible: false,
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#4b5563",
    });

    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    const candles = data.map((r) => ({
      time: Math.floor(r.openTimeMs / 1000) as UTCTimestamp,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
    }));

    const volumes = data.map((r) => ({
      time: Math.floor(r.openTimeMs / 1000) as UTCTimestamp,
      value: r.volume,
      color:
        r.close >= r.open ? "rgba(52, 211, 153, 0.45)" : "rgba(248, 113, 113, 0.45)",
    }));

    candleSeries.setData(candles);
    volSeries.setData(volumes);

    // EMA20
    const ema20 = ema(data, 20);
    if (ema20.length > 0) {
      const emaSeries = chart.addSeries(LineSeries, {
        color: "#fbbf24",
        lineWidth: 1,
        title: "EMA20",
      });
      emaSeries.setData(ema20.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
    }

    // Bollinger Bands
    const bb = bollinger(data, 20, 2);
    if (bb.upper.length > 0) {
      const upperSeries = chart.addSeries(LineSeries, {
        color: "#94a3b8",
        lineWidth: 1,
        lineStyle: 2,
        title: "BB Upper",
      });
      upperSeries.setData(bb.upper.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
      const lowerSeries = chart.addSeries(LineSeries, {
        color: "#94a3b8",
        lineWidth: 1,
        lineStyle: 2,
        title: "BB Lower",
      });
      lowerSeries.setData(bb.lower.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
    }

    // Highlight markers (gold circles) for pattern window — matching Flutter behavior
    const markers: Array<{
      time: UTCTimestamp;
      position: "belowBar" | "aboveBar" | "inBar";
      color: string;
      shape: "circle" | "square" | "arrowUp" | "arrowDown";
      size: number;
    }> = [];
    if (highlightWindow) {
      data.forEach((r) => {
        if (r.openTimeMs >= highlightWindow.startTimeMs && r.openTimeMs <= highlightWindow.endTimeMs) {
          markers.push({
            time: Math.floor(r.openTimeMs / 1000) as UTCTimestamp,
            position: "belowBar",
            color: "#FFD700",
            shape: "circle",
            size: 1,
          });
        }
      });
    }
    // lightweight-charts v5: use createSeriesMarkers primitive
    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers);
    }

    // Visible range: zoom to highlight window with padding (like Flutter's kHighlightVisiblePadBars = 12)
    if (highlightWindow) {
      const barSec = estimateBarSeconds(data);
      const pad = 12 * barSec;
      const fromSec = Math.floor(highlightWindow.startTimeMs / 1000) - pad;
      const toSec = Math.floor(highlightWindow.endTimeMs / 1000) + pad;
      chart.timeScale().setVisibleRange({
        from: fromSec as UTCTimestamp,
        to: toSec as UTCTimestamp,
      });
    } else {
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height, highlightWindow]);

  if (data.length === 0) return null;

  return (
    <div className="w-full">
      <div
        ref={wrapRef}
        className="w-full rounded-lg border border-gray-800 overflow-hidden"
        style={{ minHeight: height }}
      />
      <p className="text-[11px] text-gray-500 mt-2 px-1 leading-relaxed">
        <span className="text-gray-400">Giao diện kiểu sàn:</span> cuộn chuột = zoom trục thởi gian · giữ và kéo =
        xem vùng khác · giữ <kbd className="px-1 rounded bg-gray-800 text-gray-300">Shift</kbd> + cuộn = zoom
        giá · chạm (mobile): kéo / chụm.
      </p>
    </div>
  );
}
