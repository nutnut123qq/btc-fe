"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getPortfolioSummary, getMultiAssetPaperTrades } from "@/lib/api";
import { subscribeBinanceTickers, type BinanceLiveTicker } from "@/lib/binanceWs";
import type {
  PortfolioSummaryResponse,
  PaginatedPaperTrades,
  PaperTradeItem,
  PaperTradeFilterParams,
} from "@/lib/types";
import {
  getPaperModelLabel,
  getSimulatedPnlStatus,
  PAPER_JOURNAL_LABEL,
} from "@/lib/researchUi";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";

function formatUsdt(val: number | null | undefined): string {
  if (val === null || val === undefined) return "--";
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatQty(val: number | null | undefined, symbol: string): string {
  if (val === null || val === undefined) return "--";
  const coin = symbol.replace("USDT", "");
  const decimals = coin === "BTC" ? 4 : 2;
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
  const [selectedSymbol, setSelectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [selectedSide, setSelectedSide] = useState<"all" | "long" | "short">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "open" | "closed">("all");
  const [selectedTf, setSelectedTf] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Public market prices used only to mark open simulated positions.
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Auto-refresh timer state
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(30); // 30s default
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Binance public ticker is market data, not a user-data or execution stream.
  useEffect(() => {
    const unsub = subscribeBinanceTickers([ACTIVE_SYMBOL], (t: BinanceLiveTicker) => {
      setLivePrices((prev) => {
        if (prev[t.symbol] === t.lastPrice) return prev;
        return { ...prev, [t.symbol]: t.lastPrice };
      });
    });
    return unsub;
  }, []);

  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      setError("");

      try {
        const filterParams: PaperTradeFilterParams = {
          symbols: selectedSymbol,
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
        setError(err instanceof Error ? err.message : "Không thể tải nhật ký Paper");
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
    setSelectedSymbol(ACTIVE_SYMBOL);
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
    <div className="space-y-4">
      {/* ── 1. SIMULATION DISCLAIMER (persistent, non-removable) ── */}
      <div className="flex items-center gap-2 border border-amber-500/30 bg-amber-500/10 rounded px-3 py-1.5 text-[11px] leading-snug text-amber-200/90">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <span className="font-semibold text-amber-300">MÔ PHỎNG</span> — không
          tiền thật, không khuyến nghị đầu tư. Mọi lệnh được ghi nhận giả lập
          trên dữ liệu thị trường thật.
        </span>
      </div>

      {/* ── 2. SCREEN HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-100">
            {PAPER_JOURNAL_LABEL}
          </h1>
          <p className="hidden sm:block truncate text-xs text-slate-400 mt-0.5">
            Giao dịch mô phỏng từ mô hình nghiên cứu; không phải lệnh đã khớp trên Binance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Refresh Selector */}
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Tự làm mới:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="h-7 bg-slate-900 border border-slate-700 rounded px-1.5 text-[11px] font-mono tabular-nums text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={0}>Tắt</option>
            </select>
          </label>

          {/* Manual Refresh Button */}
          <button
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/60 text-slate-300 hover:text-teal-300 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── 3. METRIC STRIP (flat label-value pairs, secondary) ── */}
      {summary && (
        <div className="border border-slate-800 rounded bg-slate-900">
          <div className="flex flex-wrap lg:flex-nowrap divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Vốn giả lập */}
            <div className="px-3 py-2 flex-1 min-w-[150px]">
              <div className="text-[11px] text-slate-500">Vốn giả lập</div>
              <div className="font-mono text-sm font-medium text-slate-100 tabular-nums mt-0.5">
                {formatUsdt(summary.currentBalance)}{" "}
                <span className="text-[10px] font-normal text-slate-500">USDT</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">
                vốn ban đầu {formatUsdt(summary.initialBalance)}
              </div>
            </div>

            {/* PnL mô phỏng */}
            <div className="px-3 py-2 flex-1 min-w-[170px]">
              <div className="text-[11px] text-slate-500">PnL mô phỏng đã ghi nhận</div>
              <div
                className={`font-mono text-sm font-semibold tabular-nums mt-0.5 ${
                  summary.realizedPnLUsdt >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {summary.realizedPnLUsdt >= 0 ? "+" : ""}
                {formatUsdt(summary.realizedPnLUsdt)}{" "}
                <span className="text-[10px] font-normal">
                  ({summary.realizedPnLPct >= 0 ? "+" : ""}
                  {summary.realizedPnLPct.toFixed(2)}%)
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {getSimulatedPnlStatus(summary.realizedPnLUsdt)}
              </div>
            </div>

            {/* Win rate */}
            <div className="px-3 py-2 flex-1 min-w-[140px]">
              <div className="text-[11px] text-slate-500">Tỷ lệ thắng</div>
              <div className="font-mono text-sm font-medium text-slate-100 tabular-nums mt-0.5">
                {summary.winRatePct.toFixed(1)}%{" "}
                <span className="text-[10px] font-normal text-slate-500">
                  {summary.winCount}W · {summary.lossCount}L
                </span>
              </div>
            </div>

            {/* Số lệnh */}
            <div className="px-3 py-2 flex-1 min-w-[140px]">
              <div className="text-[11px] text-slate-500">Số lệnh</div>
              <div className="font-mono text-sm font-medium text-slate-100 tabular-nums mt-0.5">
                {summary.closedTrades}{" "}
                <span className="text-[10px] font-normal text-slate-500">đóng</span>
                {" · "}
                {summary.openTrades}{" "}
                <span className="text-[10px] font-normal text-teal-400">đang mở</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums mt-0.5">
                tổng {summary.totalTrades} lệnh
              </div>
            </div>
          </div>

          {/* Per-symbol breakdown — flat secondary row */}
          {Object.keys(summary.breakdownBySymbol).length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 px-3 py-1.5">
              {Object.entries(summary.breakdownBySymbol).map(([sym, item]) => {
                const coin = sym.replace("USDT", "");
                const isProfitable = item.realizedPnLUsdt >= 0;
                return (
                  <div
                    key={sym}
                    className="flex items-center gap-1.5 font-mono text-[10px] tabular-nums"
                  >
                    <span className="font-semibold text-slate-200">{coin}</span>
                    <span className="text-slate-500">
                      {item.totalTrades} lệnh · {item.winRatePct.toFixed(0)}% WR
                    </span>
                    <span className={isProfitable ? "text-emerald-400" : "text-rose-400"}>
                      {isProfitable ? "+" : ""}
                      {formatUsdt(item.realizedPnLUsdt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. FILTER STRIP ── */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Mã tài sản</label>
          <select
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="BTCUSDT">BTC/USDT</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Chiều lệnh</label>
          <select
            value={selectedSide}
            onChange={(e) => {
              setSelectedSide(e.target.value as "all" | "long" | "short");
              setCurrentPage(1);
            }}
            className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Tất cả chiều</option>
            <option value="long">LONG (Mua / Đánh lên)</option>
            <option value="short">SHORT (Bán / Đánh xuống)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Trạng thái</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as "all" | "open" | "closed");
              setCurrentPage(1);
            }}
            className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="closed">Đã đóng (Closed)</option>
            <option value="open">Đang mở (Open)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Khung thời gian</label>
          <select
            value={selectedTf}
            onChange={(e) => {
              setSelectedTf(e.target.value);
              setCurrentPage(1);
            }}
            className="h-7 text-xs bg-slate-900 border border-slate-700 rounded px-2 text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Tất cả khung</option>
            <option value="4h">4 Giờ (4h - Primary)</option>
            <option value="1h">1 Giờ (1h)</option>
            <option value="1d">1 Ngày (1d)</option>
          </select>
        </div>

        <button
          onClick={handleResetFilters}
          className="h-7 px-3 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded transition-colors"
        >
          Đặt lại bộ lọc
        </button>
      </div>

      {/* ── 5. SIMULATED TRADE JOURNAL (dominant flat table) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300">
            Danh sách giao dịch mô phỏng{" "}
            <span className="font-mono tabular-nums text-slate-500">
              ({tradesData?.totalCount || 0} lệnh)
            </span>
          </h2>
          <div className="text-[10px] text-slate-500 font-mono tabular-nums">
            Cập nhật {lastRefreshedAt.toLocaleTimeString("vi-VN")}
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-rose-500/10 border-b border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* contained scroll region — never page-level overflow */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-500 border-b border-slate-800 text-[10px] font-medium tracking-wide">
              <tr>
                <th className="py-1.5 px-3">Lệnh · Mở</th>
                <th className="py-1.5 px-3">Đóng</th>
                <th className="py-1.5 px-3">Cặp / Khung</th>
                <th className="py-1.5 px-3">Hướng</th>
                <th className="py-1.5 px-3 text-right">Giá vào</th>
                <th className="py-1.5 px-3 text-right">Giá ra</th>
                <th className="py-1.5 px-3 text-right">Vị thế / KL</th>
                <th className="py-1.5 px-3 text-right">TP / SL</th>
                <th className="py-1.5 px-3 text-right">PnL</th>
                <th className="py-1.5 px-3">Lý do đóng</th>
                <th className="py-1.5 px-3">Model · Tín hiệu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                    Đang nạp nhật ký Paper...
                  </td>
                </tr>
              ) : !tradesData || tradesData.items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Không tìm thấy lệnh nào phù hợp với bộ lọc đã chọn.
                  </td>
                </tr>
              ) : (
                tradesData.items.map((trade: PaperTradeItem) => {
                  const isLong = trade.side.toLowerCase() === "long";
                  const isOpen = trade.status.toLowerCase() === "open";
                  const netPct = trade.netReturnPct ?? (trade.netReturn ? trade.netReturn * 100 : null);
                  const isProfitable = (netPct ?? 0) > 0;

                  return (
                    <tr
                      key={trade.id}
                      className={`hover:bg-slate-800/40 transition-colors duration-150 ${
                        isOpen ? "bg-slate-800/20" : ""
                      }`}
                    >
                      {/* 1. ID & open time */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isOpen && (
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
                          )}
                          <span className="font-mono text-slate-100 font-medium tabular-nums">
                            #{trade.id}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 tabular-nums mt-0.5">
                          {formatTime(trade.entryTimeMs)}
                        </div>
                      </td>

                      {/* 2. Close time (provenance) */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[10px] text-slate-400 tabular-nums">
                        {isOpen ? "—" : formatTime(trade.exitTimeMs)}
                      </td>

                      {/* 3. Symbol & Timeframe */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-slate-200 font-medium">{trade.symbol}</span>
                        <span className="font-mono text-[10px] text-slate-500 ml-1.5">
                          {trade.timeframe}
                        </span>
                      </td>

                      {/* 4. Side — plain mono text */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            isLong ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isLong ? "LONG" : "SHORT"}
                        </span>
                      </td>

                      {/* 5. Entry Price */}
                      <td className="py-2 px-3 text-right font-mono text-slate-200 tabular-nums whitespace-nowrap">
                        {formatUsdt(trade.entryPrice)}
                      </td>

                      {/* 6. Exit Price (live reference when open) */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {isOpen ? (
                          <div className="flex flex-col items-end">
                            <span className="text-teal-400">
                              {formatUsdt(livePrices[trade.symbol] || trade.entryPrice)}
                            </span>
                            <span className="text-[9px] text-slate-500 font-sans">
                              giá thị trường tham chiếu
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-200">{formatUsdt(trade.exitPrice)}</span>
                        )}
                      </td>

                      {/* 7. Position Size & Quantity */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-slate-200">{formatUsdt(trade.positionSizeUsdt)}</div>
                        <div className="text-[10px] text-slate-500">
                          {formatQty(trade.executedQty, trade.symbol)}
                        </div>
                      </td>

                      {/* 8. TP / SL */}
                      <td className="py-2 px-3 text-right font-mono text-[10px] tabular-nums whitespace-nowrap">
                        {trade.takeProfitPrice || trade.stopLossPrice ? (
                          <div className="space-y-0.5">
                            <div className="text-emerald-400/90">
                              TP {formatUsdt(trade.takeProfitPrice)}
                            </div>
                            <div className="text-rose-400/90">
                              SL {formatUsdt(trade.stopLossPrice)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* 9. PnL & ROI */}
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
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
                                  className={`font-semibold ${
                                    isFloatPos ? "text-emerald-400" : "text-rose-400"
                                  }`}
                                >
                                  {isFloatPos ? "+" : ""}
                                  {formatUsdt(floatUsdt)}
                                </div>
                                <div
                                  className={`text-[10px] ${
                                    isFloatPos ? "text-emerald-400/80" : "text-rose-400/80"
                                  }`}
                                >
                                  {isFloatPos ? "+" : ""}
                                  {(floatPct * 100).toFixed(2)}% (tạm tính)
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div>
                            <div
                              className={`font-semibold ${
                                isProfitable ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isProfitable ? "+" : ""}
                              {formatUsdt(trade.realizedPnLUsdt)}
                            </div>
                            <div
                              className={`text-[10px] ${
                                isProfitable ? "text-emerald-400/80" : "text-rose-400/80"
                              }`}
                            >
                              {netPct !== null && netPct !== undefined
                                ? `${netPct >= 0 ? "+" : ""}${netPct.toFixed(2)}%`
                                : "—"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 10. Exit Reason — short plain label */}
                      <td className="py-2 px-3 whitespace-nowrap text-xs">
                        {isOpen ? (
                          <span className="text-teal-300 font-medium">Đang mở · paper</span>
                        ) : trade.exitReason === "TP" ? (
                          <span className="text-slate-300">Chốt lời (TP)</span>
                        ) : trade.exitReason === "TRAILING_SL" ? (
                          <span className="text-slate-300">Trailing SL</span>
                        ) : trade.exitReason === "SL" ? (
                          <span className="text-slate-300">Cắt lỗ (SL)</span>
                        ) : trade.exitReason === "TIMEOUT" ? (
                          <span className="text-slate-300">Hết 24h</span>
                        ) : (
                          <span className="text-slate-400">{trade.exitReason || "CLOSED"}</span>
                        )}
                      </td>

                      {/* 11. Model & signal provenance */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[160px] tabular-nums" title={trade.modelVersion || ""}>
                          {getPaperModelLabel(trade.modelVersion)}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 tabular-nums mt-0.5">
                          {trade.confidence != null
                            ? `conf ${(trade.confidence * 100).toFixed(1)}%`
                            : "conf —"}
                          {trade.ensembleDirection && (
                            <span className="text-slate-500"> · ens {trade.ensembleDirection}</span>
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

        {/* ── 6. PAGINATION BAR ── */}
        {tradesData && tradesData.totalPages > 0 && (
          <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                Hiển thị{" "}
                <span className="text-slate-200 font-mono tabular-nums">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, tradesData.totalCount)}
                </span>{" "}
                trên <span className="text-slate-200 font-mono tabular-nums">{tradesData.totalCount}</span> lệnh
              </span>

              <span className="text-slate-600">·</span>

              <div className="flex items-center gap-1">
                <span>Số dòng:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-6 bg-slate-900 border border-slate-700 text-slate-200 rounded px-1 font-mono tabular-nums focus:outline-none focus:border-teal-500"
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
                className="p-1 border border-slate-700 bg-slate-900 rounded hover:border-teal-500/60 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-1 font-mono tabular-nums text-slate-300">
                {currentPage} / {tradesData.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= tradesData.totalPages}
                className="p-1 border border-slate-700 bg-slate-900 rounded hover:border-teal-500/60 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                aria-label="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
