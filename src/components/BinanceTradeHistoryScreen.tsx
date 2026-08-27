"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Wallet,
  TrendingUp,
  Award,
  PieChart,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { getPortfolioSummary, getMultiAssetPaperTrades } from "@/lib/api";
import { subscribeBinanceTickers, type BinanceLiveTicker } from "@/lib/binanceWs";
import { subscribeTradeStream, type LiveTradeExecutedEvent, type LiveBalanceUpdatedEvent } from "@/lib/tradeStream";
import type {
  PortfolioSummaryResponse,
  PaginatedPaperTrades,
  PaperTradeItem,
  PaperTradeFilterParams,
} from "@/lib/types";

function formatUsdt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "--";
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(val: number | null | undefined, symbol: string): string {
  if (val === null || val === undefined) return "--";
  const coin = symbol.replace("USDT", "");
  const decimals = coin === "BTC" ? 4 : coin === "ETH" ? 4 : 2;
  return `${val.toFixed(decimals)} ${coin}`;
}

function formatTime(ms: number | null | undefined): string {
  if (!ms || ms === 0) return "--";
  const d = new Date(ms);
  return d.toISOString().replace("T", " ").substring(0, 16) + " UTC";
}

export function BinanceTradeHistoryScreen() {
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [tradesData, setTradesData] = useState<PaginatedPaperTrades | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>("");

  // Filters State
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [selectedSide, setSelectedSide] = useState<"all" | "long" | "short">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "open" | "closed">("all");
  const [selectedTf, setSelectedTf] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Live WebSocket Prices State
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // SignalR Live Sync State
  const [signalRConnected, setSignalRConnected] = useState<boolean>(false);
  const [liveAlert, setLiveAlert] = useState<LiveTradeExecutedEvent | null>(null);

  // Auto-refresh timer state
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Subscribe to Binance Live WebSocket Ticker
  useEffect(() => {
    const unsub = subscribeBinanceTickers(["BTCUSDT", "ETHUSDT", "SOLUSDT"], (t: BinanceLiveTicker) => {
      setLivePrices((prev) => {
        if (prev[t.symbol] === t.lastPrice) return prev;
        return { ...prev, [t.symbol]: t.lastPrice };
      });
    });
    return unsub;
  }, []);

  // Subscribe to Backend SignalR Trade Notification Hub
  useEffect(() => {
    const unsub = subscribeTradeStream(
      (tradeEvt: LiveTradeExecutedEvent) => {
        setLiveAlert(tradeEvt);
        setTimeout(() => setLiveAlert(null), 8000);

        setTradesData((prev) => {
          if (!prev) return prev;
          const exists = prev.items.some(
            (item) => item.id === tradeEvt.orderId || (tradeEvt.clientOrderId && item.clientOrderId === tradeEvt.clientOrderId)
          );

          if (exists) {
            return {
              ...prev,
              items: prev.items.map((item) => {
                if (item.id === tradeEvt.orderId || (tradeEvt.clientOrderId && item.clientOrderId === tradeEvt.clientOrderId)) {
                  return {
                    ...item,
                    status: tradeEvt.isClosed ? "closed" : "open",
                    exitPrice: tradeEvt.exitPrice ?? item.exitPrice,
                    exitReason: tradeEvt.exitReason ?? item.exitReason,
                    realizedPnLUsdt: tradeEvt.realizedPnL ?? item.realizedPnLUsdt,
                    netReturn: tradeEvt.netReturn ?? item.netReturn,
                    netReturnPct: tradeEvt.netReturn != null ? Number(tradeEvt.netReturn.toFixed(2)) : item.netReturnPct,
                    executedQty: tradeEvt.executedQty ?? item.executedQty,
                    exitTimeMs: tradeEvt.timestamp,
                    closedAtUtc: tradeEvt.isClosed ? new Date(tradeEvt.timestamp).toISOString() : item.closedAtUtc,
                  };
                }
                return item;
              }),
            };
          } else {
            const newItem: PaperTradeItem = {
              id: tradeEvt.orderId || Date.now(),
              symbol: tradeEvt.symbol,
              timeframe: "1h",
              windowEndMs: tradeEvt.timestamp,
              entryTimeMs: tradeEvt.timestamp,
              exitTimeMs: tradeEvt.isClosed ? tradeEvt.timestamp : 0,
              side: tradeEvt.side,
              confidence: null,
              probDown: null,
              probSideways: null,
              probUp: null,
              entryPrice: tradeEvt.entryPrice,
              exitPrice: tradeEvt.exitPrice ?? null,
              positionSizeUsdt: tradeEvt.executedQty * tradeEvt.entryPrice,
              executedQty: tradeEvt.executedQty,
              netReturn: tradeEvt.netReturn ?? null,
              netReturnPct: tradeEvt.netReturn != null ? Number(tradeEvt.netReturn.toFixed(2)) : null,
              realizedPnLUsdt: tradeEvt.realizedPnL != null ? Number(tradeEvt.realizedPnL.toFixed(2)) : null,
              status: tradeEvt.isClosed ? "closed" : "open",
              exitReason: tradeEvt.exitReason ?? null,
              orderId: tradeEvt.orderId ?? null,
              clientOrderId: tradeEvt.clientOrderId ?? null,
              createdAtUtc: new Date(tradeEvt.timestamp).toISOString(),
              closedAtUtc: tradeEvt.isClosed ? new Date(tradeEvt.timestamp).toISOString() : null,
              modelVersion: "BinanceLiveStream",
            };
            return {
              ...prev,
              totalCount: prev.totalCount + 1,
              items: [newItem, ...prev.items.slice(0, pageSize - 1)],
            };
          }
        });

        // Refresh portfolio metrics
        void getPortfolioSummary().then((s) => setSummary(s)).catch(() => {});
      },
      (balanceEvt: LiveBalanceUpdatedEvent) => {
        const usdt = balanceEvt.balances.find((b) => b.asset === "USDT");
        if (usdt) {
          setSummary((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentBalance: usdt.walletBalance,
            };
          });
        }
      },
      (connected: boolean) => {
        setSignalRConnected(connected);
      }
    );

    return unsub;
  }, [pageSize]);

  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      setError("");

      try {
        const filterParams: PaperTradeFilterParams = {
          symbols: selectedSymbol === "all" ? undefined : selectedSymbol,
          side: selectedSide,
          status: selectedStatus,
          timeframe: selectedTf,
          page: currentPage,
          pageSize: pageSize,
        };

        const [sumRes, tradesRes] = await Promise.all([
          getPortfolioSummary(),
          getMultiAssetPaperTrades(filterParams),
        ]);

        setSummary(sumRes);
        setTradesData(tradesRes);
        setLastRefreshedAt(new Date());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu lịch sử giao dịch");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedSymbol, selectedSide, selectedStatus, selectedTf, currentPage, pageSize]
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      void loadData(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  const handleResetFilters = () => {
    setSelectedSymbol("all");
    setSelectedSide("all");
    setSelectedStatus("all");
    setSelectedTf("all");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (tradesData?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. SCREEN HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold px-2 py-0.5 rounded">
              USDT-M Futures
            </span>
            <h1 className="text-xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
              Lịch sử Giao dịch Binance Đa Tài sản
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Quản lý danh mục đa coin tự động hóa bằng AI Champion Model (XGBoost Calibrated 4h & ATR Dynamic TP/SL)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* SignalR Live Sync Badge */}
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
              signalRConnected
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                signalRConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span>{signalRConnected ? "Live Sync (SignalR)" : "Connecting..."}</span>
          </div>

          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Tự làm mới:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-gray-900">10s</option>
              <option value={30} className="bg-gray-900">30s</option>
              <option value={60} className="bg-gray-900">60s</option>
              <option value={0} className="bg-gray-900">Tắt</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── 1.1 LIVE TRADE EXECUTION TOAST BANNER ── */}
      {liveAlert && (
        <div className="flex items-center justify-between gap-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-3.5 text-emerald-200 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-bounce" />
            <div>
              <span className="font-bold text-sm text-emerald-300">
                ⚡ [Live Push] Lệnh {liveAlert.symbol} {liveAlert.side} {liveAlert.status}:
              </span>{" "}
              <span className="text-xs text-gray-200">
                Giá {liveAlert.isClosed ? `đóng: $${liveAlert.exitPrice?.toLocaleString()}` : `vào: $${liveAlert.entryPrice.toLocaleString()}`}
                {liveAlert.realizedPnL != null && (
                  <strong className={liveAlert.realizedPnL >= 0 ? " text-emerald-400 ml-1.5" : " text-rose-400 ml-1.5"}>
                    (PnL: {liveAlert.realizedPnL >= 0 ? "+" : ""}${liveAlert.realizedPnL.toFixed(2)} USDT)
                  </strong>
                )}
              </span>
            </div>
          </div>
          <button
            onClick={() => setLiveAlert(null)}
            className="text-gray-400 hover:text-gray-200 text-xs px-2 py-1 bg-gray-900/60 rounded"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ── 2. PORTFOLIO METRICS CARDS ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Wallet Balance */}
          <div className="bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-cyan-400" />
                Số Dư Ví (USDT)
              </span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                Vốn: {formatUsdt(summary.initialBalance)}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white">
                {formatUsdt(summary.currentBalance)}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span>Vị thế tối đa:</span>
                <span className="text-gray-200 font-semibold">20% / lệnh</span>
              </div>
            </div>
          </div>

          {/* Card 2: Cumulative Realized PnL */}
          <div className="bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tổng PnL Thực Tế
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  summary.realizedPnLUsdt >= 0
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {summary.realizedPnLPct >= 0 ? "+" : ""}
                {summary.realizedPnLPct.toFixed(2)}% ROI
              </span>
            </div>
            <div className="mt-3">
              <div
                className={`text-2xl font-bold tracking-tight ${
                  summary.realizedPnLUsdt >= 0 ? "text-[#0ecb81]" : "text-[#f6465d]"
                }`}
              >
                {summary.realizedPnLUsdt >= 0 ? "+" : ""}
                {formatUsdt(summary.realizedPnLUsdt)}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span>Trạng thái:</span>
                <span className={summary.realizedPnLUsdt >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {summary.realizedPnLUsdt >= 0 ? "Đang có lãi tích lũy" : "Đang điều chỉnh danh mục"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Win Rate & Trades Breakdown */}
          <div className="bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Tỷ Lệ Thắng (Win Rate)
              </span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                {summary.totalTrades} Lệnh
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{summary.winRatePct.toFixed(1)}%</span>
                <span className="text-xs font-normal text-gray-400">
                  ({summary.winCount}W - {summary.lossCount}L)
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span className="text-emerald-400">{summary.closedTrades} Đã đóng</span>
                <span>•</span>
                <span className="text-cyan-400">{summary.openTrades} Đang mở</span>
              </div>
            </div>
          </div>

          {/* Card 4: Multi-Asset Breakdown Badges */}
          <div className="bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-purple-400" />
                Hiệu Suất Theo Coin
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                3 Cặp
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              {Object.entries(summary.breakdownBySymbol).map(([sym, item]) => {
                const coin = sym.replace("USDT", "");
                const isProfitable = item.realizedPnLUsdt >= 0;
                return (
                  <div
                    key={sym}
                    className="flex items-center justify-between text-xs bg-gray-900/60 rounded px-2 py-1 border border-gray-800/80"
                  >
                    <span className="font-bold text-gray-200">{coin}</span>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-gray-400">{item.winRatePct.toFixed(0)}% WR</span>
                      <span className={`font-semibold ${isProfitable ? "text-[#0ecb81]" : "text-[#f6465d]"}`}>
                        {isProfitable ? "+" : ""}
                        {formatUsdt(item.realizedPnLUsdt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. FILTER CONTROLS BAR ── */}
      <div className="bg-[#181a20] border border-[#2b313a] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-teal-400" />
          Bộ Lọc Lịch Sử Giao Dịch
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Symbol Filter */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Mã Tài Sản</label>
            <select
              value={selectedSymbol}
              onChange={(e) => {
                setSelectedSymbol(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Tất cả Coin</option>
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
            </select>
          </div>

          {/* Side Filter */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Chiều Lệnh</label>
            <select
              value={selectedSide}
              onChange={(e) => {
                setSelectedSide(e.target.value as "all" | "long" | "short");
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Tất cả Chiều</option>
              <option value="long">LONG (Mua / Đánh lên)</option>
              <option value="short">SHORT (Bán / Đánh xuống)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Trạng Thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as "all" | "open" | "closed");
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="closed">Đã đóng (Closed)</option>
              <option value="open">Đang mở (Open)</option>
            </select>
          </div>

          {/* Timeframe Filter */}
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Khung Thời Gian</label>
            <select
              value={selectedTf}
              onChange={(e) => {
                setSelectedTf(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-2 text-gray-200 focus:outline-none focus:border-teal-500"
            >
              <option value="all">Tất cả Khung</option>
              <option value="4h">4 Giờ (4h - Primary)</option>
              <option value="1h">1 Giờ (1h)</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full text-xs py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors font-medium"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. BINANCE ORDER & TRADE HISTORY TABLE ── */}
      <div className="bg-[#181a20] border border-[#2b313a] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#2b313a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wide">
              Danh Sách Lệnh Khớp Thực Tế ({tradesData?.totalCount || 0} Lệnh)
            </h2>
          </div>
          <div className="text-xs text-gray-400">
            Cập nhật lúc: {lastRefreshedAt.toLocaleTimeString("vi-VN")}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1e2329] text-gray-400 border-b border-[#2b313a] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">#ID & Thời Gian</th>
                <th className="py-3 px-3">Cặp / Khung</th>
                <th className="py-3 px-3">Chiều Lệnh</th>
                <th className="py-3 px-3 text-right">Giá Vào</th>
                <th className="py-3 px-3 text-right">Giá Đóng</th>
                <th className="py-3 px-3 text-right">Vị Thế / SL</th>
                <th className="py-3 px-3 text-center">Chốt Lời / Cắt Lỗ</th>
                <th className="py-3 px-4 text-right">PnL / ROI</th>
                <th className="py-3 px-3 text-center">Lý Do Đóng</th>
                <th className="py-3 px-4">AI Model & Tín Hiệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b313a] text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                    Đang nạp dữ liệu lệnh khớp Binance...
                  </td>
                </tr>
              ) : !tradesData || tradesData.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    Không tìm thấy lệnh nào phù hợp với bộ lọc đã chọn.
                  </td>
                </tr>
              ) : (
                tradesData.items.map((trade: PaperTradeItem) => {
                  const isLong = trade.side.toLowerCase() === "long";
                  const isOpen = trade.status.toLowerCase() === "open";
                  const netPct = trade.netReturnPct ?? (trade.netReturn ? trade.netReturn * 100 : null);
                  const isProfitable = (netPct ?? 0) > 0;
                  const coin = trade.symbol.replace("USDT", "");

                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-[#2b313a]/30 transition-colors duration-150"
                    >
                      {/* 1. ID & Time */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-100">#{trade.id}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {formatTime(trade.entryTimeMs)}
                        </div>
                      </td>

                      {/* 2. Symbol & Timeframe */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-100">{trade.symbol}</span>
                          <span className="text-[10px] bg-gray-800 text-gray-400 px-1 py-0.2 rounded border border-gray-700">
                            {trade.timeframe}
                          </span>
                        </div>
                      </td>

                      {/* 3. Side Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                            isLong
                              ? "bg-emerald-500/15 text-[#0ecb81] border border-emerald-500/30"
                              : "bg-rose-500/15 text-[#f6465d] border border-rose-500/30"
                          }`}
                        >
                          {isLong ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {trade.side.toUpperCase()}
                        </span>
                      </td>

                      {/* 4. Entry Price */}
                      <td className="py-3 px-3 text-right font-medium text-gray-200">
                        {formatUsdt(trade.entryPrice)}
                      </td>

                      {/* 5. Exit Price */}
                      <td className="py-3 px-3 text-right font-medium text-gray-200">
                        {isOpen ? (
                          <div className="flex flex-col items-end">
                            <span className="text-cyan-400 font-mono font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                              {formatUsdt(livePrices[trade.symbol] || trade.entryPrice)}
                            </span>
                            <span className="text-[9px] text-cyan-500/80">Live WebSocket</span>
                          </div>
                        ) : (
                          formatUsdt(trade.exitPrice)
                        )}
                      </td>

                      {/* 6. Position Size & Quantity */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-gray-200">
                          {formatUsdt(trade.positionSizeUsdt)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {formatQty(trade.executedQty, trade.symbol)}
                        </div>
                      </td>

                      {/* 7. TP / SL / ATR */}
                      <td className="py-3 px-3 text-center">
                        {trade.takeProfitPrice || trade.stopLossPrice ? (
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-[#0ecb81] font-mono">
                              TP: {formatUsdt(trade.takeProfitPrice)}
                            </div>
                            <div className="text-[#f6465d] font-mono">
                              SL: {formatUsdt(trade.stopLossPrice)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </td>

                      {/* 8. PnL & ROI */}
                      <td className="py-3 px-4 text-right">
                        {isOpen ? (
                          (() => {
                            const entryPrice = trade.entryPrice ?? 0;
                            const curPrice = livePrices[trade.symbol] || entryPrice;
                            const floatPct = entryPrice > 0
                              ? (isLong
                                  ? (curPrice - entryPrice) / entryPrice
                                  : (entryPrice - curPrice) / entryPrice)
                              : 0;
                            const floatUsdt = (trade.positionSizeUsdt || 0) * floatPct;
                            const isFloatPos = floatPct >= 0;
                            return (
                              <div>
                                <div
                                  className={`font-bold text-sm font-mono ${
                                    isFloatPos ? "text-[#0ecb81]" : "text-[#f6465d]"
                                  }`}
                                >
                                  {isFloatPos ? "+" : ""}
                                  {formatUsdt(floatUsdt)}
                                </div>
                                <div
                                  className={`text-[10px] font-semibold ${
                                    isFloatPos ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {isFloatPos ? "+" : ""}
                                  {(floatPct * 100).toFixed(2)}% (Live)
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div>
                            <div
                              className={`font-bold text-sm ${
                                isProfitable ? "text-[#0ecb81]" : "text-[#f6465d]"
                              }`}
                            >
                              {isProfitable ? "+" : ""}
                              {formatUsdt(trade.realizedPnLUsdt)}
                            </div>
                            <div
                              className={`text-[10px] font-semibold ${
                                isProfitable ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {netPct !== null && netPct !== undefined
                                ? `${netPct >= 0 ? "+" : ""}${netPct.toFixed(2)}%`
                                : "--"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 9. Exit Reason */}
                      <td className="py-3 px-3 text-center">
                        {isOpen ? (
                          <span className="inline-block bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                            OPEN (LIVE)
                          </span>
                        ) : trade.exitReason === "TP" ? (
                          <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            Chốt lời (TP)
                          </span>
                        ) : trade.exitReason === "TRAILING_SL" ? (
                          <span className="inline-block bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            Trailing SL
                          </span>
                        ) : trade.exitReason === "SL" ? (
                          <span className="inline-block bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            Cắt lỗ (SL)
                          </span>
                        ) : trade.exitReason === "TIMEOUT" ? (
                          <span className="inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            Hết 24h
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">{trade.exitReason || "CLOSED"}</span>
                        )}
                      </td>

                      {/* 10. AI Trigger & Confidence */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-teal-400" />
                            <span className="text-[11px] font-semibold text-gray-200">
                              {trade.confidence ? `${(trade.confidence * 100).toFixed(1)}% Conf` : "AI Trigger"}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 truncate max-w-[140px]" title={trade.modelVersion || ""}>
                            {trade.modelVersion ? trade.modelVersion.replace(".joblib", "") : "XGB Calibrated"}
                          </div>
                          {trade.ensembleDirection && (
                            <span className="text-[9px] text-purple-300">
                              Ens: {trade.ensembleDirection}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. PAGINATION BAR ── */}
        {tradesData && tradesData.totalPages > 0 && (
          <div className="p-4 border-t border-[#2b313a] bg-[#1e2329] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span>
                Hiển thị{" "}
                <span className="text-gray-200 font-semibold">
                  {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, tradesData.totalCount)}
                </span>{" "}
                trên tổng <span className="text-gray-200 font-semibold">{tradesData.totalCount}</span> lệnh
              </span>

              <span className="text-gray-600">|</span>

              <div className="flex items-center gap-1">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-900 border border-gray-700 text-gray-200 rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 bg-gray-900 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 font-medium text-gray-200">
                Trang {currentPage} / {tradesData.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= tradesData.totalPages}
                className="p-1.5 bg-gray-900 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
