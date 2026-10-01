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
import { KlineOHLC, VolumeProfileDto, SmartMoneyStructureDto, CandlePatternItem } from "@/lib/types";
import { ema, bollinger, calculateFibonacciLevels } from "@/lib/indicators";
import { latestCandleLifecycle } from "@/lib/marketTruth";
import { intervalToMs } from "@/lib/timeframe";
import type { CandlePatternReplay, FibonacciReplay, TechnicalIndicatorReplay, VolumeProfileReplay } from "@/lib/technicalReplay";
import { buildReplayPatternMarkers } from "@/lib/chartMarkers";

type Props = {
  data: KlineOHLC[];
  height?: number;
  highlightWindow?: { startTimeMs: number; endTimeMs: number } | null;
  volumeProfile?: VolumeProfileDto | VolumeProfileReplay | null;
  smartMoney?: SmartMoneyStructureDto[] | null;
  patterns?: CandlePatternItem[] | null;
  replayPatterns?: CandlePatternReplay | null;
  replayIndicators?: TechnicalIndicatorReplay | null;
  replayFibonacci?: FibonacciReplay | null;
  showFibonacci?: boolean;
  timeframe?: string;
  onSelectSmartMoney?: (event: SmartMoneyStructureDto) => void;
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

export function BtcCandlestickChart({ data, height = 440, highlightWindow, volumeProfile, smartMoney, patterns, replayPatterns, replayIndicators, replayFibonacci, showFibonacci, timeframe = "4h", onSelectSmartMoney }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const onSelectSmartMoneyRef = useRef(onSelectSmartMoney);

  useEffect(() => {
    onSelectSmartMoneyRef.current = onSelectSmartMoney;
  }, [onSelectSmartMoney]);

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

    if (replayIndicators !== undefined) {
      const replayLines = [
        [replayIndicators?.ema12, "#fbbf24", "EMA12"],
        [replayIndicators?.ema26, "#38bdf8", "EMA26"],
        [replayIndicators?.sma50, "#c084fc", "SMA50"],
      ] as const;
      replayLines.forEach(([price, color, title]) => {
        if (price == null) return;
        candleSeries.createPriceLine({ price, color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title });
      });
    } else {
      // Legacy chart mode outside Technical Replay.
      const ema20 = ema(data, 20);
      if (ema20.length > 0) {
        const emaSeries = chart.addSeries(LineSeries, { color: "#fbbf24", lineWidth: 1, title: "EMA20" });
        emaSeries.setData(ema20.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
      }
      const bb = bollinger(data, 20, 2);
      if (bb.upper.length > 0) {
        const upperSeries = chart.addSeries(LineSeries, { color: "#94a3b8", lineWidth: 1, lineStyle: 2, title: "BB Upper" });
        upperSeries.setData(bb.upper.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
        const lowerSeries = chart.addSeries(LineSeries, { color: "#94a3b8", lineWidth: 1, lineStyle: 2, title: "BB Lower" });
        lowerSeries.setData(bb.lower.map((d) => ({ time: d.time as UTCTimestamp, value: d.value })));
      }
    }

    // Volume Profile POC / VAH / VAL PriceLines
    if (volumeProfile) {
      if (volumeProfile.pocPrice > 0) {
        candleSeries.createPriceLine({
          price: volumeProfile.pocPrice,
          color: "#eab308", // Amber / Gold
          lineWidth: 2,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: "VPVR POC",
        });
      }
      if (volumeProfile.vahPrice > 0) {
        candleSeries.createPriceLine({
          price: volumeProfile.vahPrice,
          color: "#f43f5e", // Rose / Red
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "VAH",
        });
      }
      if (volumeProfile.valPrice > 0) {
        candleSeries.createPriceLine({
          price: volumeProfile.valPrice,
          color: "#10b981", // Emerald / Green
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "VAL",
        });
      }
    }

    // Active FVG Price Lines
    if (smartMoney && smartMoney.length > 0) {
      smartMoney
        .filter((smc) => smc.eventType.startsWith("FVG") && !smc.isMitigated && smc.highPrice && smc.lowPrice)
        .slice(0, 5)
        .forEach((fvg) => {
          const isBull = fvg.eventType.includes("BULL");
          candleSeries.createPriceLine({
            price: fvg.highPrice!,
            color: isBull ? "#34d399" : "#f87171",
            lineWidth: 1,
            lineStyle: 3, // Dotted
            axisLabelVisible: false,
            title: `FVG High`,
          });
          candleSeries.createPriceLine({
            price: fvg.lowPrice!,
            color: isBull ? "#34d399" : "#f87171",
            lineWidth: 1,
            lineStyle: 3,
            axisLabelVisible: false,
            title: `FVG Low`,
          });
        });
    }

    // Auto Fibonacci Retracement Levels & Golden Pocket
    if (showFibonacci) {
      const fibs = replayFibonacci !== undefined
        ? (replayFibonacci?.levels.map((level) => ({ ...level, label: `${(level.ratio * 100).toFixed(1)}%`, isGoldenPocket: level.ratio >= 0.618 && level.ratio <= 0.65 })) ?? [])
        : calculateFibonacciLevels(data);
      fibs.forEach((fib) => {
        const isGP = fib.isGoldenPocket;
        candleSeries.createPriceLine({
          price: fib.price,
          color: isGP ? "#fbbf24" : fib.ratio === 0.5 ? "#2dd4bf" : "#6b7280",
          lineWidth: isGP ? 2 : 1,
          lineStyle: isGP ? 0 : 2,
          axisLabelVisible: true,
          title: fib.label,
        });
      });
    }

    // Combined Markers (Candle Patterns + Smart Money + Highlight Window)
    const markers: Array<{
      time: UTCTimestamp;
      position: "belowBar" | "aboveBar" | "inBar";
      color: string;
      shape: "circle" | "square" | "arrowUp" | "arrowDown";
      size: number;
      text?: string;
    }> = [];

    // 1. Candle Patterns Markers
    if (patterns && patterns.length > 0) {
      patterns.forEach((p) => {
        const timeSec = Math.floor(p.openTimeMs / 1000) as UTCTimestamp;
        const isNeutral = p.patternType.toUpperCase().includes("DOJI") || p.trendDirection.toLowerCase() === "neutral";
        const isBullish = p.trendDirection === "Uptrend" || p.patternType.includes("Bullish") || p.patternType === "Hammer" || p.patternType === "MorningStar";
        markers.push({
          time: timeSec,
          position: isNeutral ? "inBar" : isBullish ? "belowBar" : "aboveBar",
          color: isNeutral ? "#d1d5db" : isBullish ? "#34d399" : "#f87171",
          shape: isNeutral ? "circle" : isBullish ? "arrowUp" : "arrowDown",
          size: 1,
          text: `${p.patternType}`,
        });
      });
    }

    // 2. Smart Money Concepts Markers
    if (smartMoney && smartMoney.length > 0) {
      smartMoney.forEach((smc) => {
        // Place causal event markers at the first knowable time. Origin remains available in the detail panel.
        const availableTimeMs = smc.availableTimeMs ?? smc.timeMs;
        const markerOpenTimeMs = Math.floor(availableTimeMs / intervalToMs(timeframe)) * intervalToMs(timeframe);
        const timeSec = Math.floor(markerOpenTimeMs / 1000) as UTCTimestamp;
        const isBull = smc.eventType.includes("BULL");
        if (smc.eventType.includes("FVG") || smc.eventType.includes("BOS") || smc.eventType.includes("CHOCH")) {
          markers.push({
            time: timeSec,
            position: isBull ? "belowBar" : "aboveBar",
            color: isBull ? "#60a5fa" : "#c084fc",
            shape: isBull ? "arrowUp" : "arrowDown",
            size: 1,
            text: smc.eventType.replace("_", " "),
          });
        } else if (smc.eventType === "SWING_HIGH" || smc.eventType === "SWING_LOW") {
          markers.push({
            time: timeSec,
            position: smc.eventType === "SWING_HIGH" ? "aboveBar" : "belowBar",
            color: "#fbbf24",
            shape: "square",
            size: 1,
            text: smc.eventType === "SWING_HIGH" ? "SH" : "SL",
          });
        }
      });
    }

    // 3. Highlight Window Markers
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

    // Replay patterns must join the marker set before sorting/combining/rendering.
    markers.push(
      ...buildReplayPatternMarkers(replayPatterns, timeframe).map((marker) => ({
        ...marker,
        time: marker.time as UTCTimestamp,
      })),
    );

    // Sort markers chronologically (required by lightweight-charts)
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    // Combine markers at the exact same timestamp and position to prevent UI spam
    const combinedMarkers: typeof markers = [];
    markers.forEach((m) => {
      const last = combinedMarkers[combinedMarkers.length - 1];
      if (last && last.time === m.time && last.position === m.position) {
        if (m.text && !last.text?.includes(m.text)) {
          last.text = last.text ? `${last.text} | ${m.text}` : m.text;
        }
      } else {
        combinedMarkers.push({ ...m });
      }
    });

    if (combinedMarkers.length > 0) {
      // Keep the price action readable on dense datasets; detailed history remains
      // available in the dedicated Smart Money/pattern panels.
      createSeriesMarkers(candleSeries, combinedMarkers.slice(-60));
    }

    chart.subscribeClick((param) => {
      if (!param.time || !smartMoney?.length || !onSelectSmartMoneyRef.current) return;
      const clickedTimeSec = typeof param.time === "number" ? param.time : null;
      if (clickedTimeSec == null) return;
      const event = smartMoney.find(
        (item) => {
          const availableTimeMs = item.availableTimeMs ?? item.timeMs;
          const markerOpenTimeMs = Math.floor(availableTimeMs / intervalToMs(timeframe)) * intervalToMs(timeframe);
          return Math.floor(markerOpenTimeMs / 1000) === clickedTimeSec;
        },
      );
      if (event) onSelectSmartMoneyRef.current(event);
    });

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
  }, [data, height, highlightWindow, volumeProfile, smartMoney, patterns, replayPatterns, replayIndicators, replayFibonacci, showFibonacci, timeframe]);

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
      <p className={`text-[11px] mt-1 px-1 ${latestCandleLifecycle(data, timeframe) === "forming" ? "text-amber-400" : "text-emerald-500"}`}>
        Nến cuối: {latestCandleLifecycle(data, timeframe) === "forming" ? "đang hình thành; indicator hiển thị có thể còn thay đổi" : "đã đóng"}.
      </p>
    </div>
  );
}
