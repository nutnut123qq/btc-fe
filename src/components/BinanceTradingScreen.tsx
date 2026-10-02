"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  KlineOHLC,
  MarketTicker,
  SmartMoneyStructureDto,
} from "@/lib/types";
import {
  getMarketTickers,
  getTechnicalReplaySmc,
} from "@/lib/api";
import dynamic from "next/dynamic";
import { BinanceTickerHeader } from "./BinanceTickerHeader";
import { subscribeBinanceConnection, subscribeBinanceTickers, type BinanceLiveTicker } from "@/lib/binanceWs";
import type { MarketConnectionSnapshot } from "@/lib/marketTruth";
import { latestCandleLifecycle } from "@/lib/marketTruth";
import { SymbolWatchlistPanel } from "./SymbolWatchlistPanel";
import { MarketTradesWidget } from "./MarketTradesWidget";
import { OrderBookWidget } from "./OrderBookWidget";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, type ActiveTimeframe } from "@/lib/timeframe";
import { ACTIVE_SYMBOL, ACTIVE_SYMBOLS } from "@/lib/marketScope";
import {
  LatestRequestGate,
  normalizeReplayAsOfMs,
  stepReplayAsOfMs,
  type TechnicalReplayEnvelope,
  type TechnicalReplayEvent,
} from "@/lib/technicalReplay";
import { TechnicalReplayPanel } from "./TechnicalReplayPanel";

// Code-splitting with dynamic imports to optimize First Contentful Paint & bundle size
const BtcCandlestickChart = dynamic(
  () => import("./BtcCandlestickChart").then((mod) => mod.BtcCandlestickChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono">Đang tải Lightweight Canvas Chart Engine...</p>
        </div>
      </div>
    ),
  }
);

import {
  BarChart2,
  Layers,
  ArrowDownUp,
  BrainCircuit,
  RefreshCw,
  Activity,
} from "lucide-react";

const TIMEFRAMES = ACTIVE_TIMEFRAMES.map((timeframe) => ({ label: timeframe, value: timeframe }));

type RightTab = "trades" | "depth";
type BottomTab = "market_trades" | "smart_money";

export function BinanceTradingScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [selectedTf, setSelectedTf] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [klines, setKlines] = useState<KlineOHLC[]>([]);
  const [loadingKlines, setLoadingKlines] = useState<boolean>(true);
  const [marketConnection, setMarketConnection] = useState<MarketConnectionSnapshot>({
    state: "closed",
    venue: "Binance Spot",
    transport: "WebSocket",
    lastMessageAtMs: null,
    reconnectAttempts: 0,
  });
  const showWatchlistSidebar = true;

  // Indicators toggle
  const [showIndicators, setShowIndicators] = useState<boolean>(true);
  const [showPatterns, setShowPatterns] = useState<boolean>(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState<boolean>(true);
  const [showFibonacci, setShowFibonacci] = useState<boolean>(false);
  const [showSmartMoney, setShowSmartMoney] = useState<boolean>(true);

  // Indicators data
  const [smartMoney, setSmartMoney] = useState<SmartMoneyStructureDto[] | null>(null);
  const [technicalReplay, setTechnicalReplay] = useState<TechnicalReplayEnvelope | null>(null);
  const [selectedReplayEvent, setSelectedReplayEvent] = useState<TechnicalReplayEvent | null>(null);
  const [asOfTimeMs, setAsOfTimeMs] = useState<number | null>(null);
  const [replayError, setReplayError] = useState<string | null>(null);
  const requestGateRef = useRef(new LatestRequestGate());
  const chartAbortRef = useRef<AbortController | null>(null);

  // Invalidate synchronously in the interaction handler. Waiting for the next
  // effect would leave a small window where an older response could still win.
  const invalidateReplayRequest = useCallback(() => {
    chartAbortRef.current?.abort();
    requestGateRef.current.begin();
    setLoadingKlines(true);
    setReplayError(null);
    setKlines([]);
    setSmartMoney(null);
    setTechnicalReplay(null);
    setSelectedReplayEvent(null);
  }, []);

  // Tabs
  const [rightTab, setRightTab] = useState<RightTab>("trades");
  const [bottomTab, setBottomTab] = useState<BottomTab>("market_trades");

  // Active Ticker
  const activeTicker = tickers.find(
    (t) => t.symbol.toUpperCase() === selectedSymbol.toUpperCase()
  ) || null;

  // Poll tickers
  const fetchTickers = useCallback(async () => {
    try {
      const data = await getMarketTickers();
      if (Array.isArray(data)) {
        const receivedAtMs = Date.now();
        setTickers(data.filter((ticker) => ticker.symbol.toUpperCase() === ACTIVE_SYMBOL).map((ticker) => ({
          ...ticker,
          venue: "Binance Spot",
          source: "rest" as const,
          receivedAtMs,
        })));
      }
    } catch (e) {
      console.error("Failed to load tickers", e);
    }
  }, []);

  useEffect(() => {
    void fetchTickers();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchTickers();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchTickers]);

  // Live WebSocket Ticker Stream
  useEffect(() => {
    const unsub = subscribeBinanceTickers([...ACTIVE_SYMBOLS], (liveTicker: BinanceLiveTicker) => {
      setTickers((prev) => {
        const idx = prev.findIndex((t) => t.symbol.toUpperCase() === liveTicker.symbol.toUpperCase());
        const existing = idx >= 0 ? prev[idx] : null;
        const updatedItem: MarketTicker = {
          symbol: liveTicker.symbol,
          lastPrice: liveTicker.lastPrice,
          priceChangePercent: liveTicker.priceChangePercent,
          priceChange: liveTicker.priceChange,
          highPrice: liveTicker.high24h,
          lowPrice: liveTicker.low24h,
          volume: liveTicker.volume,
          quoteVolume: liveTicker.quoteVolume,
          bidPrice: existing ? existing.bidPrice : liveTicker.lastPrice,
          askPrice: existing ? existing.askPrice : liveTicker.lastPrice,
          count: existing ? existing.count : 0,
          closeTimeMs: liveTicker.timestampMs,
          venue: "Binance Spot",
          source: "websocket",
          receivedAtMs: Date.now(),
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedItem;
          return next;
        }
        return [...prev, updatedItem];
      });
    });
    return unsub;
  }, []);

  useEffect(() => subscribeBinanceConnection(setMarketConnection), []);

  // Load one point-in-time technical snapshot. The gate complements AbortController
  // because a completed older response can still race with a newer request.
  const loadChartData = useCallback(async (sym = selectedSymbol, tf = selectedTf, requestedAsOf: number | null = asOfTimeMs) => {
    chartAbortRef.current?.abort();
    const controller = new AbortController();
    chartAbortRef.current = controller;
    const requestToken = requestGateRef.current.begin();
    const requestAsOfTimeMs = normalizeReplayAsOfMs(requestedAsOf ?? Date.now(), tf);
    setLoadingKlines(true);
    setReplayError(null);
    setKlines([]);
    setSmartMoney(null);
    setTechnicalReplay(null);
    setSelectedReplayEvent(null);
    try {
      const replay = await getTechnicalReplaySmc({
        symbol: sym,
        timeframe: tf,
        asOfTimeMs: requestAsOfTimeMs,
        lookbackBars: 500,
        signal: controller.signal,
      });
      if (!requestGateRef.current.isCurrent(requestToken) || controller.signal.aborted) return;

      setKlines(replay.candles);
      setTechnicalReplay(replay);
      setSmartMoney(replay.events);
    } catch (err) {
      if (!controller.signal.aborted && requestGateRef.current.isCurrent(requestToken)) {
        setKlines([]);
        setTechnicalReplay(null);
        setSmartMoney(null);
        setReplayError(err instanceof Error ? err.message : "Không đọc được technical replay.");
      }
    } finally {
      if (requestGateRef.current.isCurrent(requestToken)) setLoadingKlines(false);
    }
  }, [asOfTimeMs, selectedSymbol, selectedTf]);

  useEffect(() => {
    void loadChartData();
    return () => chartAbortRef.current?.abort();
  }, [loadChartData]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 p-1 sm:p-2">
      {/* Top Header Ticker Bar */}
      <BinanceTickerHeader
        selectedSymbol={selectedSymbol}
        ticker={activeTicker}
        connection={marketConnection}
      />

      {/* Main Grid: Watchlist (Left) + Chart/Bottom (Center) + Orderbook/Trades (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Watchlist / Market Selector (Desktop sidebar) */}
        {showWatchlistSidebar && (
          <div className="hidden xl:block xl:col-span-3 h-[780px] sticky top-16">
            <SymbolWatchlistPanel
              tickers={tickers}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => {
                if (sym === selectedSymbol) return;
                invalidateReplayRequest();
                setSelectedSymbol(sym);
              }}
            />
          </div>
        )}

        {/* Center Column: Chart & Trading Panel */}
        <div
          className={`space-y-3 ${
            showWatchlistSidebar ? "lg:col-span-8 xl:col-span-6" : "lg:col-span-8 xl:col-span-9"
          }`}
        >
          {/* Chart Container Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            {/* Chart Toolbar */}
            <div className="p-2.5 bg-gray-950/80 border-b border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Timeframe buttons */}
              <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
                <span className="text-[10px] text-gray-400 font-semibold px-1.5 uppercase">Khung:</span>
                {TIMEFRAMES.map((tf) => (
                  <button
                    type="button"
                    key={tf.value}
                    aria-pressed={selectedTf === tf.value}
                    onClick={() => {
                      if (tf.value === selectedTf) return;
                      invalidateReplayRequest();
                      setSelectedTf(tf.value);
                      setAsOfTimeMs((current) => current == null ? null : normalizeReplayAsOfMs(current, tf.value));
                    }}
                    className={`px-2 py-1 rounded font-bold text-xs transition-colors ${
                      selectedTf === tf.value
                        ? "bg-teal-500 text-gray-950 shadow-sm"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Indicator Overlay Toggles */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  aria-pressed={showIndicators}
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${showIndicators ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"}`}
                >
                  <Activity className="w-3 h-3" /> Indicators
                </button>
                <button
                  type="button"
                  aria-pressed={showPatterns}
                  onClick={() => setShowPatterns(!showPatterns)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${showPatterns ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"}`}
                >
                  <BarChart2 className="w-3 h-3" /> Patterns
                </button>
                <button
                  type="button"
                  aria-pressed={showSmartMoney}
                  onClick={() => setShowSmartMoney(!showSmartMoney)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                    showSmartMoney
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                      : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  <BrainCircuit className="w-3 h-3" /> Smart Money
                </button>

                <button
                  type="button"
                  aria-pressed={showVolumeProfile}
                  onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                  disabled={technicalReplay?.layers.volumeProfile.availability === "unavailable"}
                  className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${showVolumeProfile ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"}`}
                  title={technicalReplay?.layers.volumeProfile.availability === "unavailable" ? technicalReplay.layers.volumeProfile.unavailableReason ?? "Volume Profile unavailable" : "Volume Profile point-in-time từ replay"}
                >
                  <BarChart2 className="w-3 h-3" /> Volume Profile
                </button>

                <button
                  type="button"
                  aria-pressed={showFibonacci}
                  onClick={() => setShowFibonacci(!showFibonacci)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                    showFibonacci
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  <Layers className="w-3 h-3" /> Fibonacci
                </button>

                <button
                  type="button"
                  onClick={() => void loadChartData(selectedSymbol, selectedTf)}
                  className="p-1.5 rounded bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800 hover:bg-gray-800 transition-colors"
                  title="Làm mới nến"
                  aria-label={`Làm mới nến BTCUSDT ${selectedTf}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingKlines ? "animate-spin text-teal-400" : ""}`} />
                </button>
              </div>
            </div>

            <TechnicalReplayPanel
              symbol={ACTIVE_SYMBOL}
              timeframe={selectedTf}
              asOfTimeMs={asOfTimeMs}
              replay={technicalReplay}
              loading={loadingKlines}
              error={replayError}
              selectedEvent={selectedReplayEvent}
              unavailableOverlays={[
                ...(technicalReplay?.coverage.filter((item) => item.availability === "unavailable").map((item) => item.layerKey) ?? []),
                ...(replayError ? ["Technical replay"] : []),
              ]}
              onSetAsOf={(timeMs) => {
                const normalized = normalizeReplayAsOfMs(timeMs, selectedTf);
                if (normalized === asOfTimeMs) return;
                invalidateReplayRequest();
                setAsOfTimeMs(normalized);
              }}
              onStep={(direction) => {
                invalidateReplayRequest();
                setAsOfTimeMs((current) => {
                  const base = current ?? normalizeReplayAsOfMs(Date.now(), selectedTf);
                  return stepReplayAsOfMs(base, selectedTf, direction);
                });
              }}
              onReturnLive={() => {
                if (asOfTimeMs == null) return;
                invalidateReplayRequest();
                setAsOfTimeMs(null);
              }}
              onSelectEvent={setSelectedReplayEvent}
            />

            {/* Candlestick Chart Area */}
            <div className="p-2 min-h-[460px] relative bg-gray-950">
              {klines.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                  <span>Stored finalized Binance Spot klines · cùng nguồn với replay layers</span>
                  <span className={`rounded border px-2 py-0.5 ${latestCandleLifecycle(klines, selectedTf) === "forming" ? "border-amber-700/60 bg-amber-950/30 text-amber-300" : "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"}`}>
                    Nến cuối: {latestCandleLifecycle(klines, selectedTf) === "forming" ? "đang hình thành — không phải nến chốt" : "đã đóng"}
                  </span>
                </div>
              )}
              {loadingKlines && klines.length === 0 ? (
                <div className="h-[440px] flex items-center justify-center text-xs text-gray-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> Đang tải biểu đồ nến {selectedSymbol}...
                </div>
              ) : klines.length === 0 ? (
                <div className="h-[440px] flex items-center justify-center text-xs text-gray-400">
                  Không có dữ liệu nến cho {selectedSymbol} ({selectedTf})
                </div>
              ) : (
                <BtcCandlestickChart
                  data={klines}
                  height={460}
                  volumeProfile={showVolumeProfile ? technicalReplay?.layers.volumeProfile.payload ?? null : null}
                  smartMoney={showSmartMoney ? smartMoney : null}
                  replayPatterns={showPatterns ? technicalReplay?.layers.candlePatterns.payload ?? null : null}
                  replayIndicators={showIndicators ? technicalReplay?.layers.indicators.payload ?? null : null}
                  replayFibonacci={technicalReplay?.layers.fibonacci.payload ?? null}
                  showFibonacci={showFibonacci}
                  timeframe={selectedTf}
                  onSelectSmartMoney={(event) => {
                    const replayEvent = technicalReplay?.events.find((item) => item.eventId === (event as TechnicalReplayEvent).eventId);
                    if (replayEvent) setSelectedReplayEvent(replayEvent);
                  }}
                />
              )}
            </div>
          </div>

          {/* Bottom Tabs Panel: realtime trades / replay Smart Money evidence */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            {/* Tabs Header */}
            <div className="flex items-center justify-between p-2 bg-gray-950/80 border-b border-gray-800 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed={bottomTab === "market_trades"}
                  onClick={() => setBottomTab("market_trades")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === "market_trades"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  Khớp lệnh realtime ({selectedSymbol.replace(/USDT$/i, "")})
                </button>

                <button
                  type="button"
                  aria-pressed={bottomTab === "smart_money"}
                  onClick={() => setBottomTab("smart_money")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === "smart_money"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Cấu trúc Smart Money
                </button>

              </div>

              {/* Active Symbol Tag */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400">
                <span>Cặp:</span>
                <span className="font-bold text-gray-200">{selectedSymbol}</span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-3">
              {bottomTab === "market_trades" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <p>Luồng realtime độc lập với cutoff Technical Replay:</p>
                    <span className="text-[11px] text-teal-400">Cập nhật tự động 2s</span>
                  </div>
                  <MarketTradesWidget symbol={selectedSymbol} limit={30} />
                </div>
              )}

              {bottomTab === "smart_money" && (
                <div className="space-y-2 text-xs">
                  <p className="text-gray-400">
                    Hình học giá SMC (BOS/CHOCH/FVG/swing) trên khung {selectedTf}. Đây là nhãn mô tả, không phải bằng chứng về hoạt động tổ chức hay xác suất giao dịch:
                  </p>
                  {smartMoney && smartMoney.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {smartMoney.map((sm) => {
                        const isBull = sm.eventType.includes("BULL");
                        const isBear = sm.eventType.includes("BEAR");
                        return (
                          <button
                            type="button"
                            key={(sm as TechnicalReplayEvent).eventId ?? sm.id}
                            onClick={() => {
                              const event = technicalReplay?.events.find((item) => item.eventId === (sm as TechnicalReplayEvent).eventId);
                              if (event) setSelectedReplayEvent(event);
                            }}
                            className="p-2.5 bg-gray-950 rounded-lg border border-gray-800/80 flex items-center justify-between text-left hover:border-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                          >
                            <div>
                              <span className="font-bold text-indigo-400">{sm.eventType.replace("_", " ")}</span>
                              <span className="text-[10px] text-gray-400 ml-2">{sm.timeframe}</span>
                              <div className="text-[11px] text-gray-300 mt-0.5">
                                Giá: ${sm.price.toFixed(2)} {sm.lowPrice != null && sm.highPrice != null ? `(Zone: $${sm.lowPrice.toFixed(2)} - $${sm.highPrice.toFixed(2)})` : ""}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Origin {new Date(sm.originTimeMs ?? sm.timeMs).toLocaleString("vi-VN")} · biết được từ {new Date(sm.availableTimeMs ?? sm.timeMs).toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isBull ? "bg-emerald-500/20 text-emerald-400" : isBear ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-300"
                              }`}
                            >
                              {isBull ? "BULLISH" : isBear ? "BEARISH" : "NEUTRAL"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-950/40 rounded-lg text-center text-gray-400">
                      Chưa phát hiện sự kiện hình học giá SMC (BOS/CHOCH/FVG/swing) trên {selectedSymbol} ({selectedTf}) tại mốc đang xem.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Realtime microstructure is deliberately separated from replay evidence. */}
        <aside className="min-w-0 space-y-3 lg:col-span-4 xl:col-span-3" aria-label="Dữ liệu thị trường realtime độc lập với Technical Replay">
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-3 text-[11px] leading-relaxed text-amber-200">
            <strong className="block text-xs">REALTIME MARKET DATA</strong>
            Khớp lệnh và sổ lệnh bên dưới cập nhật theo thời gian thực, không thuộc cutoff {technicalReplay?.effectiveAsOfTimeMs ? new Date(technicalReplay.effectiveAsOfTimeMs).toLocaleString("vi-VN") : "Technical Replay"} và không phải layer bằng chứng lịch sử.
          </div>

          {/* Right Tabs Header */}
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              type="button"
              aria-pressed={rightTab === "trades"}
              onClick={() => setRightTab("trades")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === "trades"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <ArrowDownUp className="w-3 h-3" /> Khớp
            </button>
            <button
              type="button"
              aria-pressed={rightTab === "depth"}
              onClick={() => setRightTab("depth")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === "depth"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <Layers className="w-3 h-3" /> Sổ
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="h-[600px]">
            {rightTab === "trades" && (
              <MarketTradesWidget symbol={selectedSymbol} limit={35} />
            )}

            {rightTab === "depth" && (
              <OrderBookWidget symbol={selectedSymbol} limit={11} />
            )}

          </div>
        </aside>
      </div>

    </div>
  );
}
