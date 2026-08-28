"use client";

import { useState, useEffect, useCallback } from "react";
import {
  KlineOHLC,
  MarketTicker,
  VolumeProfileDto,
  SmartMoneyStructureDto,
  PaperTradeItem,
  PaperTradeSummary,
} from "@/lib/types";
import {
  getMarketTickers,
  getBtcKlines,
  getVolumeProfile,
  getSmartMoneyStructures,
  getOpenPaperTrades,
  getPaperTradeSummary,
} from "@/lib/api";
import dynamic from "next/dynamic";
import { BinanceTickerHeader } from "./BinanceTickerHeader";
import { subscribeBinanceTickers, type BinanceLiveTicker } from "@/lib/binanceWs";
import { SymbolWatchlistPanel } from "./SymbolWatchlistPanel";
import { MarketTradesWidget } from "./MarketTradesWidget";
import { OrderBookWidget } from "./OrderBookWidget";
import { ConfluenceWidget } from "./ConfluenceWidget";
import { RegimeBadge } from "./RegimeBadge";
import { ExecutionPanel } from "./ExecutionPanel";
import { SentimentBadge } from "./SentimentBadge";
import { ErrorBoundary } from "./ErrorBoundary";

// Code-splitting with dynamic imports to optimize First Contentful Paint & bundle size
const BtcCandlestickChart = dynamic(
  () => import("./BtcCandlestickChart").then((mod) => mod.BtcCandlestickChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-mono">Đang tải Lightweight Canvas Chart Engine...</p>
        </div>
      </div>
    ),
  }
);

const LiquidationHeatmapWidget = dynamic(
  () => import("./LiquidationHeatmapWidget").then((mod) => mod.LiquidationHeatmapWidget),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-gray-900/50 rounded-xl border border-gray-800">
        <p className="text-xs text-gray-500 font-mono">Đang tải Liquidation Heatmap Engine...</p>
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
  Flame,
  Zap,
} from "lucide-react";

const TIMEFRAMES = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
] as const;

type RightTab = "trades" | "depth" | "ai" | "execution";
type BottomTab = "market_trades" | "paper_trades" | "smart_money" | "volume_profile" | "liquidation_heatmap";

export function BinanceTradingScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [selectedTf, setSelectedTf] = useState<string>("1h");
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [klines, setKlines] = useState<KlineOHLC[]>([]);
  const [loadingKlines, setLoadingKlines] = useState<boolean>(true);
  const [selectorOpen, setSelectorOpen] = useState<boolean>(false);
  const showWatchlistSidebar = true;

  // Indicators toggle
  const [showFibonacci, setShowFibonacci] = useState<boolean>(false);
  const [showSmartMoney, setShowSmartMoney] = useState<boolean>(true);
  const [showVolumeProfile, setShowVolumeProfile] = useState<boolean>(false);

  // Indicators data
  const [volumeProfile, setVolumeProfile] = useState<VolumeProfileDto | null>(null);
  const [smartMoney, setSmartMoney] = useState<SmartMoneyStructureDto[] | null>(null);

  // Tabs
  const [rightTab, setRightTab] = useState<RightTab>("trades");
  const [bottomTab, setBottomTab] = useState<BottomTab>("market_trades");

  // Paper trade state for bottom panel
  const [paperSummary, setPaperSummary] = useState<PaperTradeSummary | null>(null);
  const [openPaperTrades, setOpenPaperTrades] = useState<PaperTradeItem[]>([]);

  // Active Ticker
  const activeTicker = tickers.find(
    (t) => t.symbol.toUpperCase() === selectedSymbol.toUpperCase()
  ) || null;

  // Poll tickers
  const fetchTickers = useCallback(async () => {
    try {
      const data = await getMarketTickers();
      if (Array.isArray(data)) {
        setTickers(data);
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
    const unsub = subscribeBinanceTickers(["BTCUSDT", "ETHUSDT", "SOLUSDT"], (liveTicker: BinanceLiveTicker) => {
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

  // Load Klines and indicators for selected symbol
  const loadChartData = useCallback(async (sym = selectedSymbol, tf = selectedTf) => {
    setLoadingKlines(true);
    try {
      const rawKlines = await getBtcKlines({ symbol: sym, interval: tf, limit: 180 });
      if (Array.isArray(rawKlines)) {
        const mapped: KlineOHLC[] = rawKlines.map((k: KlineOHLC) => ({
          openTimeMs: k.openTimeMs,
          open: Number(k.open),
          high: Number(k.high),
          low: Number(k.low),
          close: Number(k.close),
          volume: Number(k.volume),
        }));
        setKlines(mapped);
      }

      // Load Smart Money & Volume Profile if BTC or supported
      try {
        const [smRes, vpRes] = await Promise.allSettled([
          getSmartMoneyStructures(sym, tf),
          getVolumeProfile(sym, tf),
        ]);
        if (smRes.status === "fulfilled") setSmartMoney(smRes.value ?? null);
        if (vpRes.status === "fulfilled") setVolumeProfile(vpRes.value ?? null);
      } catch {}

      // Load paper trades
      try {
        const [pSum, pOpen] = await Promise.allSettled([
          getPaperTradeSummary(sym, tf),
          getOpenPaperTrades(sym),
        ]);
        if (pSum.status === "fulfilled") setPaperSummary(pSum.value);
        if (pOpen.status === "fulfilled") setOpenPaperTrades(pOpen.value?.items ?? []);
      } catch {}
    } catch (err) {
      console.error("Failed to load chart data", err);
    } finally {
      setLoadingKlines(false);
    }
  }, [selectedSymbol, selectedTf]);

  useEffect(() => {
    void loadChartData();
  }, [loadChartData]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-3 p-1 sm:p-2">
      {/* Top Header Ticker Bar */}
      <BinanceTickerHeader
        selectedSymbol={selectedSymbol}
        ticker={activeTicker}
        onOpenSelector={() => setSelectorOpen(true)}
      />

      {/* Main Grid: Watchlist (Left) + Chart/Bottom (Center) + Orderbook/Trades (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column: Watchlist / Market Selector (Desktop sidebar) */}
        {showWatchlistSidebar && (
          <div className="hidden xl:block xl:col-span-3 h-[780px] sticky top-16">
            <SymbolWatchlistPanel
              tickers={tickers}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => setSelectedSymbol(sym)}
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
                <span className="text-[10px] text-gray-500 font-semibold px-1.5 uppercase">Khung:</span>
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTf(tf.value)}
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
                  onClick={() => setShowVolumeProfile(!showVolumeProfile)}
                  className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                    showVolumeProfile
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800"
                  }`}
                >
                  <BarChart2 className="w-3 h-3" /> Volume Profile
                </button>

                <button
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
                  onClick={() => void loadChartData(selectedSymbol, selectedTf)}
                  className="p-1.5 rounded bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800 hover:bg-gray-800 transition-colors"
                  title="Làm mới nến"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingKlines ? "animate-spin text-teal-400" : ""}`} />
                </button>
              </div>
            </div>

            {/* Candlestick Chart Area */}
            <div className="p-2 min-h-[460px] relative bg-gray-950">
              {loadingKlines && klines.length === 0 ? (
                <div className="h-[440px] flex items-center justify-center text-xs text-gray-500 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" /> Đang tải biểu đồ nến {selectedSymbol}...
                </div>
              ) : klines.length === 0 ? (
                <div className="h-[440px] flex items-center justify-center text-xs text-gray-500">
                  Không có dữ liệu nến cho {selectedSymbol} ({selectedTf})
                </div>
              ) : (
                <BtcCandlestickChart
                  data={klines}
                  height={460}
                  volumeProfile={showVolumeProfile ? volumeProfile : null}
                  smartMoney={showSmartMoney ? smartMoney : null}
                  showFibonacci={showFibonacci}
                />
              )}
            </div>
          </div>

          {/* Bottom Tabs Panel: Market Trades History / Paper Trades / Smart Money Analysis */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
            {/* Tabs Header */}
            <div className="flex items-center justify-between p-2 bg-gray-950/80 border-b border-gray-800 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBottomTab("market_trades")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === "market_trades"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  Lịch sử khớp lệnh ({selectedSymbol.replace(/USDT$/i, "")})
                </button>

                <button
                  onClick={() => setBottomTab("paper_trades")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === "paper_trades"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Vị thế Paper Trading & AI
                  {openPaperTrades.length > 0 && (
                    <span className="bg-teal-500 text-gray-950 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                      {openPaperTrades.length}
                    </span>
                  )}
                </button>

                <button
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

                <button
                  onClick={() => setBottomTab("liquidation_heatmap")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    bottomTab === "liquidation_heatmap"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Bản đồ Thanh lý (Heatmap)
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
                    <p>Các giao dịch vừa được khớp lệnh trên sàn Binance:</p>
                    <span className="text-[11px] text-teal-400">Cập nhật tự động 2s</span>
                  </div>
                  <MarketTradesWidget key={`bottom-trades-${selectedSymbol}`} symbol={selectedSymbol} limit={30} />
                </div>
              )}

              {bottomTab === "paper_trades" && (
                <div className="space-y-3 text-xs">
                  {/* Summary Bar */}
                  {paperSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-950 p-2.5 rounded-lg border border-gray-800">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase">Tổng lệnh</div>
                        <div className="font-bold text-gray-200">{paperSummary.totalTrades}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase">Tỷ lệ thắng</div>
                        <div className="font-bold text-teal-400">{(paperSummary.winRate * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase">Lợi nhuận ròng</div>
                        <div className={`font-bold ${paperSummary.totalNetReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {paperSummary.totalNetReturnPct >= 0 ? "+" : ""}{paperSummary.totalNetReturnPct.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase">Max Drawdown</div>
                        <div className="font-bold text-rose-400">-{paperSummary.maxDrawdownPct.toFixed(2)}%</div>
                      </div>
                    </div>
                  )}

                  {/* Open Trades Table */}
                  <div>
                    <h4 className="font-bold text-gray-300 text-xs mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Vị thế đang mở ({openPaperTrades.length})
                    </h4>
                    {openPaperTrades.length === 0 ? (
                      <div className="p-4 bg-gray-950/40 rounded-lg text-center text-gray-500 text-xs">
                        Hiện không có vị thế mở nào cho {selectedSymbol}
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-gray-800 rounded-lg">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
                            <tr>
                              <th className="p-2">Hướng</th>
                              <th className="p-2">Giá vào</th>
                              <th className="p-2">Độ tin cậy</th>
                              <th className="p-2">TP / SL</th>
                              <th className="p-2">Thời gian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800/50">
                            {openPaperTrades.map((t) => (
                              <tr key={t.id} className="hover:bg-gray-800/30">
                                <td className="p-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                      t.side.toUpperCase() === "LONG"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-rose-500/20 text-rose-400"
                                    }`}
                                  >
                                    {t.side.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-2 text-gray-200">
                                  {t.entryPrice != null ? `$${t.entryPrice.toFixed(2)}` : "--"}
                                </td>
                                <td className="p-2 text-teal-400 font-semibold">
                                  {t.confidence != null ? `${(t.confidence * 100).toFixed(1)}%` : "--"}
                                </td>
                                <td className="p-2 text-gray-400">
                                  ${t.takeProfitPrice?.toFixed(2) ?? "--"} / ${t.stopLossPrice?.toFixed(2) ?? "--"}
                                </td>
                                <td className="p-2 text-gray-500">
                                  {new Date(t.entryTimeMs).toLocaleTimeString("vi-VN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bottomTab === "smart_money" && (
                <div className="space-y-2 text-xs">
                  <p className="text-gray-400">
                    Các cấu trúc thị trường Smart Money Concepts (Order Blocks, Fair Value Gaps, Liquidity Sweeps) trên khung {selectedTf}:
                  </p>
                  {smartMoney && smartMoney.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {smartMoney.map((sm) => {
                        const isBull = sm.eventType.includes("BULL");
                        const isBear = sm.eventType.includes("BEAR");
                        return (
                          <div key={sm.id} className="p-2.5 bg-gray-950 rounded-lg border border-gray-800/80 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-indigo-400">{sm.eventType.replace("_", " ")}</span>
                              <span className="text-[10px] text-gray-500 ml-2">{sm.timeframe}</span>
                              <div className="text-[11px] text-gray-300 mt-0.5">
                                Giá: ${sm.price.toFixed(2)} {sm.lowPrice != null && sm.highPrice != null ? `(Zone: $${sm.lowPrice.toFixed(2)} - $${sm.highPrice.toFixed(2)})` : ""}
                              </div>
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isBull ? "bg-emerald-500/20 text-emerald-400" : isBear ? "bg-rose-500/20 text-rose-400" : "bg-gray-800 text-gray-300"
                              }`}
                            >
                              {isBull ? "BULLISH" : isBear ? "BEARISH" : "NEUTRAL"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-950/40 rounded-lg text-center text-gray-500">
                      Chưa phát hiện vùng Order Block mới trên {selectedSymbol} ({selectedTf})
                    </div>
                  )}
                </div>
              )}

              {bottomTab === "liquidation_heatmap" && (
                <div className="space-y-2">
                  <ErrorBoundary fallbackTitle="Lỗi tải Bản đồ Thanh lý">
                    <LiquidationHeatmapWidget
                      key={`${selectedSymbol}-${selectedTf}`}
                      symbol={selectedSymbol}
                      timeframe={selectedTf}
                      onSymbolChange={(s) => setSelectedSymbol(s)}
                    />
                  </ErrorBoundary>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Book & Market Trades & AI Widget */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          {/* Regime & Macro Sentiment Badges */}
          <div className="space-y-2">
            <ErrorBoundary fallbackTitle="Lỗi tải Regime">
              <RegimeBadge symbol={selectedSymbol} timeframe={selectedTf} />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Lỗi tải Sentiment">
              <SentimentBadge symbol={selectedSymbol} compact={true} />
            </ErrorBoundary>
          </div>

          {/* Right Tabs Header */}
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs">
            <button
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
              onClick={() => setRightTab("depth")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === "depth"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <Layers className="w-3 h-3" /> Sổ
            </button>
            <button
              onClick={() => setRightTab("ai")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === "ai"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <BrainCircuit className="w-3 h-3" /> AI
            </button>
            <button
              onClick={() => setRightTab("execution")}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === "execution"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" /> Đặt lệnh
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="h-[600px]">
            {rightTab === "trades" && (
              <MarketTradesWidget key={`right-trades-${selectedSymbol}`} symbol={selectedSymbol} limit={35} />
            )}

            {rightTab === "depth" && (
              <OrderBookWidget key={selectedSymbol} symbol={selectedSymbol} limit={11} />
            )}

            {rightTab === "ai" && (
              <div className="space-y-3 overflow-y-auto h-full pr-1">
                <ErrorBoundary fallbackTitle="Lỗi tải Confluence">
                  <ConfluenceWidget symbol={selectedSymbol} />
                </ErrorBoundary>
              </div>
            )}

            {rightTab === "execution" && (
              <div className="space-y-3 overflow-y-auto h-full pr-1">
                <ErrorBoundary fallbackTitle="Lỗi tải Bảng Đặt lệnh Testnet">
                  <ExecutionPanel
                    symbol={selectedSymbol}
                    currentPrice={activeTicker ? activeTicker.lastPrice : undefined}
                    onOrderSuccess={() => void loadChartData(selectedSymbol, selectedTf)}
                  />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Symbol Selector Modal */}
      {selectorOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-150">
            <SymbolWatchlistPanel
              tickers={tickers}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                setSelectorOpen(false);
              }}
              onClose={() => setSelectorOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
