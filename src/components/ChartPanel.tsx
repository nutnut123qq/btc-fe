"use client";

import { useEffect, useRef, useState } from "react";
import { Search, RefreshCw, Database, CandlestickChart } from "lucide-react";
import {
  KlineOHLC,
  PatternSearchResponse,
  PatternSearchItem,
  CandlePatternItem,
  CandlePatternListResponse,
} from "@/lib/types";
import {
  getBtcKlines,
  searchPatterns,
  getCandlesAround,
  indexCandlePatterns,
  getCandlePatternsByType,
} from "@/lib/api";
import { BtcCandlestickChart } from "./BtcCandlestickChart";
import { ema, rsi } from "@/lib/indicators";

const TIMEFRAMES = [
  { label: "M1", value: "1m" },
  { label: "M5", value: "5m" },
  { label: "M15", value: "15m" },
  { label: "M30", value: "30m" },
  { label: "D1", value: "1d" },
] as const;

const FEATURE_TYPES = [
  { label: "Open", value: "open" },
  { label: "High", value: "high" },
  { label: "Low", value: "low" },
  { label: "Close", value: "close" },
  { label: "All", value: "all" },
  { label: "Returns+Shape", value: "returns_shape" },
] as const;

const WINDOW_SIZES = [5, 10, 15, 20, 25] as const;

const PATTERN_TYPES = [
  { label: "Bullish Engulfing", value: "BullishEngulfing" },
  { label: "Bearish Engulfing", value: "BearishEngulfing" },
  { label: "Morning Star", value: "MorningStar" },
  { label: "Evening Star", value: "EveningStar" },
  { label: "Hammer", value: "Hammer" },
  { label: "Hanging Man", value: "HangingMan" },
  { label: "Doji", value: "Doji" },
  { label: "Dragonfly Doji", value: "DragonflyDoji" },
  { label: "Gravestone Doji", value: "GravestoneDoji" },
  { label: "Inverted Hammer", value: "InvertedHammer" },
  { label: "Shooting Star", value: "ShootingStar" },
  { label: "Spinning Top", value: "SpinningTop" },
  { label: "Bullish Marubozu", value: "BullishMarubozu" },
  { label: "Bearish Marubozu", value: "BearishMarubozu" },
  { label: "Piercing Line", value: "PiercingLine" },
  { label: "Dark Cloud Cover", value: "DarkCloudCover" },
  { label: "Bullish Harami", value: "BullishHarami" },
  { label: "Bearish Harami", value: "BearishHarami" },
  { label: "Tweezer Bottoms", value: "TweezerBottoms" },
  { label: "Tweezer Tops", value: "TweezerTops" },
  { label: "Three White Soldiers", value: "ThreeWhiteSoldiers" },
  { label: "Three Black Crows", value: "ThreeBlackCrows" },
  { label: "Three Inside Up", value: "ThreeInsideUp" },
  { label: "Three Inside Down", value: "ThreeInsideDown" },
] as const;

export function ChartPanel() {
  const [candles, setCandles] = useState<KlineOHLC[]>([]);
  const [timeframe, setTimeframe] = useState<string>("15m");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "jumping">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PatternSearchItem[]>([]);
  const [searchMeta, setSearchMeta] = useState<PatternSearchResponse | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("returns_shape");
  const [selectedWindowSize, setSelectedWindowSize] = useState<number>(10);
  const [highlightWindow, setHighlightWindow] = useState<{ startTimeMs: number; endTimeMs: number } | null>(null);

  const [indexing, setIndexing] = useState(false);
  const [indexResult, setIndexResult] = useState<{ indexed: number; durationMs: number } | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  const [selectedPatternType, setSelectedPatternType] = useState<string>(PATTERN_TYPES[0].value);
  const [patternSearchLoading, setPatternSearchLoading] = useState(false);
  const [patternSearchError, setPatternSearchError] = useState<string | null>(null);
  const [patternSearchResults, setPatternSearchResults] = useState<CandlePatternItem[]>([]);
  const [patternSearchMeta, setPatternSearchMeta] = useState<CandlePatternListResponse | null>(null);

  const opTokenRef = useRef(0);

  const load = async (tf: string, limit = 1000) => {
    const token = ++opTokenRef.current;
    setStatus("loading");
    setErrorMsg(null);
    const start = performance.now();
    try {
      const rows: KlineOHLC[] = await getBtcKlines({ interval: tf, limit });
      if (opTokenRef.current !== token) return;
      setCandles(rows);
      setLatencyMs(Math.round(performance.now() - start));
      setStatus("idle");
    } catch (e) {
      if (opTokenRef.current !== token) return;
      setErrorMsg(e instanceof Error ? e.message : "Chart load failed");
      setStatus("error");
    }
  };

  useEffect(() => {
    void load(timeframe);
  }, [timeframe]);

  const runPatternSearch = async () => {
    if (candles.length === 0) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const result: PatternSearchResponse = await searchPatterns({
        symbol: "BTCUSDT",
        timeframe,
        featureType: selectedFeature,
        lookbackBars: 3000,
        windowSize: selectedWindowSize,
        topK: 10,
        minGapBars: selectedWindowSize,
      });
      setSearchResults(result.items ?? []);
      setSearchMeta(result);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  const runIndexPatterns = async () => {
    setIndexing(true);
    setIndexError(null);
    setIndexResult(null);
    try {
      const result = await indexCandlePatterns({
        symbol: "BTCUSDT",
        timeframe,
        lookbackBars: 500,
      });
      setIndexResult({ indexed: result.indexed, durationMs: result.durationMs });
    } catch (e) {
      setIndexError(e instanceof Error ? e.message : "Index failed");
    } finally {
      setIndexing(false);
    }
  };

  const runPatternTypeSearch = async () => {
    setPatternSearchLoading(true);
    setPatternSearchError(null);
    try {
      const result: CandlePatternListResponse = await getCandlePatternsByType({
        symbol: "BTCUSDT",
        timeframe,
        patternType: selectedPatternType,
        page: 1,
        pageSize: 50,
      });
      setPatternSearchResults(result.items ?? []);
      setPatternSearchMeta(result);
    } catch (e) {
      setPatternSearchError(e instanceof Error ? e.message : "Pattern type search failed");
    } finally {
      setPatternSearchLoading(false);
    }
  };

  const resolveIntervalMs = (tf: string) => {
    switch (tf) {
      case "1m":
        return 60_000;
      case "5m":
        return 300_000;
      case "15m":
        return 900_000;
      case "30m":
        return 1_800_000;
      case "1h":
        return 3_600_000;
      case "4h":
        return 14_400_000;
      case "1d":
        return 86_400_000;
      default:
        return 900_000;
    }
  };

  const patternWindowFor = (item: CandlePatternItem) => {
    const bars =
      item.patternCategory === "Triple" ? 3 : item.patternCategory === "Double" ? 2 : 1;
    const intervalMs = resolveIntervalMs(item.timeframe);
    const startTimeMs = item.openTimeMs;
    const endTimeMs = startTimeMs + (bars - 1) * intervalMs;
    return { startTimeMs, endTimeMs };
  };

  const focusPatternWindow = async (item: CandlePatternItem) => {
    const window = patternWindowFor(item);
    const hasWindowInData = candles.some(
      (c) => c.openTimeMs >= window.startTimeMs && c.openTimeMs <= window.endTimeMs
    );
    if (!hasWindowInData) {
      setStatus("jumping");
      try {
        const res = await getCandlesAround({
          symbol: item.symbol,
          timeframe: item.timeframe,
          timeMs: window.startTimeMs,
          beforeBars: 120,
          afterBars: 120,
        });
        if (res.candles) {
          setCandles(res.candles);
        }
      } catch {
        /* ignore */
      } finally {
        setStatus("idle");
      }
    }
    setHighlightWindow(window);
  };

  const focusWindow = async (item: PatternSearchItem) => {
    const hasWindowInData = candles.some(
      (c) => c.openTimeMs >= item.startTimeMs && c.openTimeMs <= item.endTimeMs
    );
    if (!hasWindowInData) {
      setStatus("jumping");
      try {
        const res = await getCandlesAround({
          symbol: item.symbol,
          timeframe: item.timeframe,
          timeMs: item.startTimeMs,
          beforeBars: 120,
          afterBars: 120,
        });
        if (res.candles) {
          setCandles(res.candles);
        }
      } catch {
        /* ignore */
      } finally {
        setStatus("idle");
      }
    }
    setHighlightWindow({ startTimeMs: item.startTimeMs, endTimeMs: item.endTimeMs });
  };

  const indicators = (() => {
    if (candles.length === 0) return { ema20: null, rsi14: null };
    const ema20 = ema(candles, 20);
    const rsi14 = rsi(candles, 14);
    return {
      ema20: ema20.length > 0 ? ema20[ema20.length - 1].value : null,
      rsi14: rsi14.length > 0 ? rsi14[rsi14.length - 1].value : null,
    };
  })();

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              timeframe === tf.value
                ? "bg-teal-600 border-teal-500 text-white"
                : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {tf.label}
          </button>
        ))}

        <button
          onClick={() => void runPatternSearch()}
          disabled={searchLoading}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50"
        >
          <Search className="w-3 h-3" />
          {searchLoading ? "Searching…" : "Search pattern"}
        </button>

        <button
          onClick={() => void runIndexPatterns()}
          disabled={indexing}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Database className="w-3 h-3" />
          {indexing ? "Indexing…" : "Index patterns"}
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">Kiểu đặc trưng</p>
        <div className="flex flex-wrap gap-2">
          {FEATURE_TYPES.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setSelectedFeature(ft.value)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                selectedFeature === ft.value
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600"
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">Cửa sổ nến</p>
        <div className="flex flex-wrap gap-2">
          {WINDOW_SIZES.map((ws) => (
            <button
              key={ws}
              onClick={() => setSelectedWindowSize(ws)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                selectedWindowSize === ws
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-600"
              }`}
            >
              {ws}
            </button>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
        <span>TF: {timeframe}</span>
        <span>Candles: {candles.length}</span>
        {candles.length > 0 && (
          <span>Close: {candles[candles.length - 1].close.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        )}
        {indicators.ema20 != null && <span>EMA20: {indicators.ema20.toFixed(2)}</span>}
        {indicators.rsi14 != null && <span>RSI14: {indicators.rsi14.toFixed(2)}</span>}
        {latencyMs != null && <span>Latency: {latencyMs}ms</span>}
        {status === "jumping" && (
          <span className="inline-flex items-center gap-1 text-teal-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải…
          </span>
        )}
        {indexing && (
          <span className="inline-flex items-center gap-1 text-indigo-400">
            <RefreshCw className="w-3 h-3 animate-spin" /> Indexing patterns…
          </span>
        )}
        {indexResult && (
          <span className="text-indigo-300">
            Indexed {indexResult.indexed} patterns ({indexResult.durationMs}ms)
          </span>
        )}
        {indexError && <span className="text-rose-400">Index error: {indexError}</span>}
      </div>

      {/* Chart */}
      <div className="w-full">
        {status === "loading" && (
          <div className="h-[440px] flex items-center justify-center text-gray-500">
            <RefreshCw className="animate-spin w-8 h-8 mr-2" /> Đang tải biểu đồ…
          </div>
        )}
        {status === "error" && (
          <div className="h-[440px] flex items-center justify-center text-rose-400 text-sm px-4 text-center">
            Không tải được chart: {errorMsg}
          </div>
        )}
        {status !== "loading" && status !== "error" && candles.length > 0 && (
          <BtcCandlestickChart data={candles} height={440} highlightWindow={highlightWindow} />
        )}
        {status !== "loading" && status !== "error" && candles.length === 0 && (
          <div className="h-[440px] flex items-center justify-center text-gray-500">Không có dữ liệu nến.</div>
        )}
      </div>

      {/* Pattern search results */}
      <div className="space-y-2">
        {searchLoading && (
          <div className="space-y-2">
            <p className="text-sm text-teal-400">Đang tìm cửa sổ tương tự…</p>
            <p className="text-xs text-gray-500">
              feature={selectedFeature} · {timeframe} · BTCUSDT
            </p>
            <div className="h-2 bg-gray-800 rounded overflow-hidden">
              <div className="h-full bg-teal-600 animate-pulse w-2/3" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-900 rounded border border-gray-800 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {searchError && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900 text-rose-200 text-sm">
            <div className="font-semibold">Không tìm được mẫu</div>
            <p className="text-xs mt-1">{searchError}</p>
            <button
              onClick={() => void runPatternSearch()}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded border border-rose-800 text-xs hover:bg-rose-900/40"
            >
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        )}

        {!searchLoading && !searchError && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchMeta && (
              <p className="text-xs text-gray-500">
                feature={searchMeta.featureType} | scanned={searchMeta.scannedWindows} | latency={searchMeta.latencyMs}ms | store=
                {searchMeta.fromVectorStore ? "db" : "fallback"}
              </p>
            )}
            <p className="text-sm font-medium text-gray-200">Cửa sổ tương tự (top {searchResults.length})</p>
            <p className="text-xs text-gray-500">Chạm một dòng để đưa biểu đồ tới vùng nến đó.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {searchResults.map((r) => (
                <button
                  key={r.windowId}
                  onClick={() => void focusWindow(r)}
                  className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                    highlightWindow?.startTimeMs === r.startTimeMs
                      ? "border-teal-500 bg-teal-950/20"
                      : "border-gray-800 bg-gray-900 hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-gray-200">
                    {r.windowId} — score={r.similarity.toFixed(3)}
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    {new Date(r.startTimeMs).toLocaleString()} →{" "}
                    {new Date(r.endTimeMs).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!searchLoading && !searchError && searchResults.length === 0 && !searchMeta && (
          <p className="text-xs text-gray-500">
            Chưa có kết quả. Chọn kiểu đặc trưng, rồi bấm Search pattern.
          </p>
        )}
        {!searchLoading && !searchError && searchResults.length === 0 && searchMeta && (
          <p className="text-xs text-gray-500">
            Không tìm thấy cửa sổ tương tự (scanned={searchMeta.scannedWindows}, store={searchMeta.fromVectorStore ? "db" : "fallback"}).
          </p>
        )}
      </div>

      {/* Pattern type search */}
      <div className="space-y-2 border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-500">Tìm window theo loại nến</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedPatternType}
            onChange={(e) => setSelectedPatternType(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
          >
            {PATTERN_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {pt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => void runPatternTypeSearch()}
            disabled={patternSearchLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
          >
            <CandlestickChart className="w-3 h-3" />
            {patternSearchLoading ? "Searching…" : "Tìm window"}
          </button>
        </div>

        {patternSearchLoading && (
          <div className="space-y-2">
            <p className="text-sm text-amber-400">Đang tìm các vùng {selectedPatternType}…</p>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-900 rounded border border-gray-800 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {patternSearchError && (
          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900 text-rose-200 text-sm">
            <div className="font-semibold">Không tìm được mẫu</div>
            <p className="text-xs mt-1">{patternSearchError}</p>
            <button
              onClick={() => void runPatternTypeSearch()}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded border border-rose-800 text-xs hover:bg-rose-900/40"
            >
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        )}

        {!patternSearchLoading && !patternSearchError && patternSearchResults.length > 0 && (
          <div className="space-y-2">
            {patternSearchMeta && (
              <p className="text-xs text-gray-500">
                pattern={patternSearchMeta.patternType} | total={patternSearchMeta.total} | page={patternSearchMeta.page}
              </p>
            )}
            <p className="text-sm font-medium text-gray-200">
              Các vùng {PATTERN_TYPES.find((p) => p.value === selectedPatternType)?.label ?? selectedPatternType}
            </p>
            <p className="text-xs text-gray-500">Chạm một dòng để đưa biểu đồ tới vùng nến đó.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {patternSearchResults.map((r) => {
                const window = patternWindowFor(r);
                return (
                  <button
                    key={r.id}
                    onClick={() => void focusPatternWindow(r)}
                    className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                      highlightWindow?.startTimeMs === window.startTimeMs
                        ? "border-amber-500 bg-amber-950/20"
                        : "border-gray-800 bg-gray-900 hover:border-gray-600"
                    }`}
                  >
                    <div className="font-medium text-gray-200">
                      {r.patternType} — {r.trendDirection}
                    </div>
                    <div className="text-gray-500 mt-0.5">
                      {new Date(window.startTimeMs).toLocaleString()} →{" "}
                      {new Date(window.endTimeMs).toLocaleTimeString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!patternSearchLoading && !patternSearchError && patternSearchResults.length === 0 && patternSearchMeta && (
          <p className="text-xs text-gray-500">
            Không tìm thấy vùng nến {selectedPatternType} nào.
          </p>
        )}
      </div>
    </div>
  );
}
