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
import { TechnicalReplayControls, TechnicalReplayPanel, TechnicalReplayStatus, useMinWidth } from "./TechnicalReplayPanel";

// Code-splitting with dynamic imports to optimize First Contentful Paint & bundle size
const BtcCandlestickChart = dynamic(
  () => import("./BtcCandlestickChart").then((mod) => mod.BtcCandlestickChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[560px] flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Đang tải Lightweight Canvas Chart Engine...</p>
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
  PanelRightOpen,
  PanelRightClose,
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
  const [asideOpen, setAsideOpen] = useState<boolean>(false);
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

  const wideChart = useMinWidth(1024);
  const chartHeight = wideChart ? 560 : 300;
  const layerToggleClass = (active: boolean) =>
    `flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors ${
      active
        ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
        : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 p-1 sm:p-2">
      {/* Slim realtime price strip — clearly separated from the as-of replay marker */}
      <BinanceTickerHeader
        selectedSymbol={selectedSymbol}
        ticker={activeTicker}
        connection={marketConnection}
      />

      {/* Main Grid: Watchlist | Chart | Replay synthesis | Realtime rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[230px_minmax(0,1fr)_300px_48px] gap-3 items-start">
        {/* Left Column: Watchlist / Market Selector (Desktop sidebar) */}
        {showWatchlistSidebar && (
          <div className="hidden xl:block h-[780px] sticky top-[104px]">
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

        {/* Center Column: dominant chart region + secondary tabs */}
        <div className="min-w-0 space-y-3">
          {/* Chart region: one tight toolbar strip + as-of status + dominant canvas */}
          <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
            {/* Compact toolbar: timeframe chips · replay as-of · layer toggles */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-slate-800 bg-slate-900 px-2 py-1.5">
              <div className="flex items-center divide-x divide-slate-800 overflow-hidden rounded border border-slate-800" role="group" aria-label="Khung thời gian">
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
                    className={`px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      selectedTf === tf.value
                        ? "bg-teal-500/15 font-semibold text-teal-300"
                        : "bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <TechnicalReplayControls
                asOfTimeMs={asOfTimeMs}
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
              />

              {/* Layer toggles */}
              <div className="ml-auto flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  aria-pressed={showIndicators}
                  onClick={() => setShowIndicators(!showIndicators)}
                  className={layerToggleClass(showIndicators)}
                >
                  <Activity className="w-3 h-3" /> Indicators
                </button>
                <button
                  type="button"
                  aria-pressed={showPatterns}
                  onClick={() => setShowPatterns(!showPatterns)}
                  className={layerToggleClass(showPatterns)}
                >
                  <BarChart2 className="w-3 h-3" /> Patterns
                </button>
                <button
                  type="button"
                  aria-pressed={showSmartMoney}
                  onClick={() => setShowSmartMoney(!showSmartMoney)}
                  className={layerToggleClass(showSmartMoney)}
                >
                  <BrainCircuit className="w-3 h-3" /> Smart Money
                </button>
                <button
                  type="button"
                  aria-pressed={showVolumeProfile}
                  onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                  disabled={technicalReplay?.layers.volumeProfile.availability === "unavailable"}
                  className={`${layerToggleClass(showVolumeProfile)} disabled:cursor-not-allowed disabled:opacity-40`}
                  title={technicalReplay?.layers.volumeProfile.availability === "unavailable" ? technicalReplay.layers.volumeProfile.unavailableReason ?? "Volume Profile unavailable" : "Volume Profile point-in-time từ replay"}
                >
                  <BarChart2 className="w-3 h-3" /> Volume Profile
                </button>
                <button
                  type="button"
                  aria-pressed={showFibonacci}
                  onClick={() => setShowFibonacci(!showFibonacci)}
                  className={layerToggleClass(showFibonacci)}
                >
                  <Layers className="w-3 h-3" /> Fibonacci
                </button>
                <button
                  type="button"
                  onClick={() => void loadChartData(selectedSymbol, selectedTf)}
                  className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-400 transition-colors hover:text-slate-200"
                  title="Làm mới nến"
                  aria-label={`Làm mới nến BTCUSDT ${selectedTf}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingKlines ? "animate-spin text-teal-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* As-of marker + honest replay states */}
            <TechnicalReplayStatus
              symbol={ACTIVE_SYMBOL}
              timeframe={selectedTf}
              asOfTimeMs={asOfTimeMs}
              replay={technicalReplay}
              loading={loadingKlines}
              error={replayError}
              unavailableOverlays={[
                ...(technicalReplay?.coverage.filter((item) => item.availability === "unavailable").map((item) => item.layerKey) ?? []),
                ...(replayError ? ["Technical replay"] : []),
              ]}
            />

            {/* Candlestick Chart Area — dominant region */}
            <div className="relative bg-slate-950 p-1.5 sm:p-2">
              {klines.length > 0 && (
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Stored finalized Binance Spot klines · cùng nguồn với replay layers</span>
                  <span className={`rounded border px-1.5 py-0.5 ${latestCandleLifecycle(klines, selectedTf) === "forming" ? "border-slate-800 bg-slate-900/40 text-slate-300" : "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"}`}>
                    Nến cuối: {latestCandleLifecycle(klines, selectedTf) === "forming" ? "đang hình thành — không phải nến chốt" : "đã đóng"}
                  </span>
                </div>
              )}
              {loadingKlines && klines.length === 0 ? (
                <div className="h-[300px] lg:h-[540px] flex items-center justify-center text-xs text-slate-400 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> Đang tải biểu đồ nến {selectedSymbol}...
                </div>
              ) : klines.length === 0 ? (
                <div className="h-[300px] lg:h-[540px] flex items-center justify-center text-xs text-slate-400">
                  Không có dữ liệu nến cho {selectedSymbol} ({selectedTf})
                </div>
              ) : (
                <BtcCandlestickChart
                  data={klines}
                  height={chartHeight}
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
          <div className="overflow-hidden rounded border border-slate-800 bg-slate-900">
            {/* Tabs Header — flat underline tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-2 overflow-x-auto">
              <div className="flex items-center">
                <button
                  type="button"
                  aria-pressed={bottomTab === "market_trades"}
                  onClick={() => setBottomTab("market_trades")}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition-colors ${
 bottomTab === "market_trades"
 ? "border-teal-500 font-medium text-teal-300"
 : "border-transparent text-slate-400 hover:text-slate-200"
 }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  Khớp lệnh realtime ({selectedSymbol.replace(/USDT$/i, "")})
                </button>

                <button
                  type="button"
                  aria-pressed={bottomTab === "smart_money"}
                  onClick={() => setBottomTab("smart_money")}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition-colors ${
 bottomTab === "smart_money"
 ? "border-teal-500 font-medium text-teal-300"
 : "border-transparent text-slate-400 hover:text-slate-200"
 }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Cấu trúc Smart Money
                </button>

              </div>

              {/* Active Symbol Tag */}
              <div className="hidden sm:flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <span>Cặp:</span>
                <span className="font-semibold text-slate-300">{selectedSymbol}</span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-2.5">
              {bottomTab === "market_trades" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <p>Luồng realtime độc lập với cutoff Technical Replay:</p>
                    <span className="text-teal-400">Cập nhật tự động 2s</span>
                  </div>
                  <MarketTradesWidget symbol={selectedSymbol} limit={30} />
                </div>
              )}

              {bottomTab === "smart_money" && (
                <div className="space-y-2 text-xs">
                  <p className="text-[11px] leading-5 text-slate-500">
                    Hình học giá SMC (BOS/CHOCH/FVG/swing) trên khung {selectedTf}. Đây là nhãn mô tả, không phải bằng chứng về hoạt động tổ chức hay xác suất giao dịch:
                  </p>
                  {smartMoney && smartMoney.length > 0 ? (
                    <div className="divide-y divide-slate-800 rounded border border-slate-800">
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
                            className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition-colors hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-slate-200">{sm.eventType.replace("_", " ")}</span>
                              <span className="ml-2 font-mono text-[10px] text-slate-500">{sm.timeframe}</span>
                              <div className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-300">
                                Giá: ${sm.price.toFixed(2)} {sm.lowPrice != null && sm.highPrice != null ? `(Zone: $${sm.lowPrice.toFixed(2)} - $${sm.highPrice.toFixed(2)})` : ""}
                              </div>
                              <div className="mt-0.5 font-mono text-[10px] tabular-nums text-slate-500">
                                Origin {new Date(sm.originTimeMs ?? sm.timeMs).toLocaleString("vi-VN")} · biết được từ {new Date(sm.availableTimeMs ?? sm.timeMs).toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                isBull ? "bg-emerald-500/15 text-emerald-400" : isBear ? "bg-rose-500/15 text-rose-400" : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {isBull ? "BULLISH" : isBear ? "BEARISH" : "NEUTRAL"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded border border-slate-800 bg-slate-950/60 p-4 text-center text-[11px] text-slate-500">
                      Chưa phát hiện sự kiện hình học giá SMC (BOS/CHOCH/FVG/swing) trên {selectedSymbol} ({selectedTf}) tại mốc đang xem.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Replay synthesis column — flat accordion sections on mobile, sticky side column on xl */}
        <div className="min-w-0 xl:sticky xl:top-[104px]">
          <TechnicalReplayPanel
            timeframe={selectedTf}
            asOfTimeMs={asOfTimeMs}
            replay={technicalReplay}
            selectedEvent={selectedReplayEvent}
            onSelectEvent={setSelectedReplayEvent}
          />
        </div>

        {/* Realtime microstructure is deliberately separated from replay evidence. */}
        <aside className="min-w-0 relative" aria-label="Dữ liệu thị trường realtime độc lập với Technical Replay">
          {/* Collapsed rail strip — xl only */}
          {!asideOpen && (
            <div className="hidden xl:flex flex-col items-center gap-1 w-12 py-2 rounded border border-slate-800 bg-slate-900">
              <button
                type="button"
                onClick={() => setAsideOpen(true)}
                className="p-2 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                aria-label="Mở panel dữ liệu realtime"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setRightTab("trades"); setAsideOpen(true); }}
                className="p-2 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                aria-label="Mở khớp lệnh realtime"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setRightTab("depth"); setAsideOpen(true); }}
                className="p-2 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors"
                aria-label="Mở sổ lệnh"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Panel: block flow dưới xl; overlay phải trên xl khi mở */}
          <div className={`space-y-3 ${asideOpen ? "xl:absolute xl:right-0 xl:top-0 xl:z-30 xl:block xl:w-80 xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto xl:rounded xl:border xl:border-slate-800 xl:bg-slate-950 xl:p-3 xl:shadow-2xl" : "xl:hidden"}`}>
          <div className="hidden xl:flex justify-end">
            <button
              type="button"
              onClick={() => setAsideOpen(false)}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Đóng panel dữ liệu realtime"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-400">
            <strong className="block text-[13px] font-semibold text-slate-200">Realtime market data</strong>
            Khớp lệnh và sổ lệnh bên dưới cập nhật theo thời gian thực, không thuộc cutoff {technicalReplay?.effectiveAsOfTimeMs ? new Date(technicalReplay.effectiveAsOfTimeMs).toLocaleString("vi-VN") : "Technical Replay"} và không phải layer bằng chứng lịch sử.
          </div>

          {/* Right Tabs Header — segmented control */}
          <div className="flex divide-x divide-slate-800 overflow-hidden rounded border border-slate-800 text-[11px]">
            <button
              type="button"
              aria-pressed={rightTab === "trades"}
              onClick={() => setRightTab("trades")}
              className={`flex flex-1 items-center justify-center gap-1 py-1.5 font-medium transition-colors ${
 rightTab === "trades"
 ? "bg-teal-500/15 text-teal-300"
 : "bg-slate-950 text-slate-400 hover:text-slate-200"
 }`}
            >
              <ArrowDownUp className="w-3 h-3" /> Khớp
            </button>
            <button
              type="button"
              aria-pressed={rightTab === "depth"}
              onClick={() => setRightTab("depth")}
              className={`flex flex-1 items-center justify-center gap-1 py-1.5 font-medium transition-colors ${
 rightTab === "depth"
 ? "bg-teal-500/15 text-teal-300"
 : "bg-slate-950 text-slate-400 hover:text-slate-200"
 }`}
            >
              <Layers className="w-3 h-3" /> Sổ
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="h-[600px] @container">
            {rightTab === "trades" && (
              <MarketTradesWidget symbol={selectedSymbol} limit={35} />
            )}

            {rightTab === "depth" && (
              <OrderBookWidget symbol={selectedSymbol} limit={11} />
            )}

          </div>
          </div>
        </aside>
      </div>

    </div>
  );
}
