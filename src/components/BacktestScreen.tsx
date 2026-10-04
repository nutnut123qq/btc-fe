"use client";

import { useEffect, useMemo, useState, useRef, useCallback, type ReactNode } from "react";
import { AlertTriangle, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { getBacktestRuns, getBacktestRunDetail, runEnsembleBacktest, optimizeEnsembleWeights } from "@/lib/api";
import { getSessionKey } from "@/lib/sessionAuth";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, type ActiveTimeframe } from "@/lib/timeframe";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";
import type { BacktestRunSummary, BacktestTradeItem, WeightOptimizationResultDto, EquityCurvePoint } from "@/lib/types";
import { createChart, AreaSeries, LineSeries, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

function formatPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

function formatDate(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

function formatMonth(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 7);
}

type RunDisplayStatus = "valid" | "legacy" | "invalid" | "experimental";

// Trạng thái hiển thị: Valid yên tĩnh, legacy subdued, invalid rose,
// experimental (ensemble runs stored as Invalid w/ "Experimental" reason) amber.
function runStatusOf(r: { validityStatus: BacktestRunSummary["validityStatus"]; invalidReason: string | null }): {
  key: RunDisplayStatus;
  label: string;
  textCls: string;
  badgeCls: string;
} {
  if (r.validityStatus === "Valid") {
    return { key: "valid", label: "hợp lệ", textCls: "text-slate-300", badgeCls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" };
  }
  if (r.validityStatus === "Legacy") {
    return { key: "legacy", label: "legacy", textCls: "text-slate-500", badgeCls: "border-slate-700 bg-slate-800/60 text-slate-400" };
  }
  if (r.invalidReason?.toLowerCase().includes("experimental")) {
    return { key: "experimental", label: "experimental", textCls: "text-amber-400", badgeCls: "border-amber-500/30 bg-amber-500/10 text-amber-400" };
  }
  return { key: "invalid", label: "invalid", textCls: "text-rose-400", badgeCls: "border-rose-500/30 bg-rose-500/10 text-rose-400" };
}

function pnlCls(r: BacktestRunSummary) {
  const st = runStatusOf(r);
  if (st.key === "invalid") return "text-slate-500"; // invalid runs: never headline profit
  const base = r.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400";
  return st.key === "legacy" ? `${base}/80` : base;
}

// equityCurveJson is a JSON string on the detail DTO; parse defensively,
// accept both camelCase/PascalCase point shapes, sort + dedupe timestamps.
function parseEquityCurve(json?: string): { time: UTCTimestamp; value: number }[] {
  if (!json) return [];
  try {
    const raw: unknown = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    const pts = raw
      .map((p) => {
        const o = p as Record<string, unknown>;
        return {
          t: Number(o.timeMs ?? o.TimeMs ?? o.time ?? o.Time),
          v: Number(o.cumulativeReturnPct ?? o.CumulativeReturnPct ?? o.equity ?? o.Equity ?? o.value),
        };
      })
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);
    const out: { time: UTCTimestamp; value: number }[] = [];
    for (const p of pts) {
      const time = Math.floor(p.t / 1000) as UTCTimestamp;
      const last = out[out.length - 1];
      if (last && last.time === time) last.value = p.v;
      else out.push({ time, value: p.v });
    }
    return out;
  } catch {
    return [];
  }
}

function parseFeeBps(json?: string): number | null {
  if (!json) return null;
  try {
    const m: unknown = JSON.parse(json);
    const v = (m as Record<string, unknown>)?.feeBps ?? (m as Record<string, unknown>)?.FeeBps;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function MetricRow({ label, highlight = false, children }: { label: string; highlight?: boolean; children: ReactNode }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-1.5 ${highlight ? "bg-slate-800/40" : ""}`}>
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="font-mono text-xs tabular-nums">{children}</span>
    </div>
  );
}

export function BacktestScreen() {
  const adminUnlocked = Boolean(getSessionKey("admin"));
  const [selectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [activeTab, setActiveTab] = useState<"ml" | "ensemble">("ml");
  const [runs, setRuns] = useState<BacktestRunSummary[]>([]);
  const [selected, setSelected] = useState<(BacktestRunSummary & { trades: BacktestTradeItem[]; metricsJson?: string; equityCurveJson?: string }) | null>(null);
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ensTimeframe, setEnsTimeframe] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [ensMinConf, setEnsMinConf] = useState(0.55);
  const [ensFee, setEnsFee] = useState(5);
  const [ensCapital, setEnsCapital] = useState(10000);
  const [ensLoading, setEnsLoading] = useState(false);
  const [ensResult, setEnsResult] = useState<(BacktestRunSummary & { trades: BacktestTradeItem[]; equityCurve: EquityCurvePoint[] }) | null>(null);
  const [ensError, setEnsError] = useState("");
  const [optResult, setOptResult] = useState<WeightOptimizationResultDto | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const detailChartContainerRef = useRef<HTMLDivElement>(null);

  const detailEquity = useMemo(() => parseEquityCurve(selected?.equityCurveJson), [selected]);
  const selectedFeeBps = useMemo(() => parseFeeBps(selected?.metricsJson), [selected]);
  const selectedAvgHoldH = useMemo(() => {
    if (!selected || selected.trades.length === 0) return null;
    const totalMs = selected.trades.reduce((sum, t) => sum + (t.exitTimeMs - t.entryTimeMs), 0);
    return totalMs / selected.trades.length / 3_600_000;
  }, [selected]);
  const selectedStatus = selected ? runStatusOf(selected) : null;

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRuns(selectedSymbol, undefined, 50, includeLegacy);
      setRuns(data.items ?? []);
      setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load backtests");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, includeLegacy]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRunDetail(id, includeLegacy);
      setSelected(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load backtest detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const runEnsBacktest = async () => {
    setEnsLoading(true);
    setEnsError("");
    setEnsResult(null);
    try {
      const data = await runEnsembleBacktest({
        symbol: selectedSymbol,
        timeframe: ensTimeframe,
        initialCapital: ensCapital,
        feeBps: ensFee,
        minConfidence: ensMinConf,
      });
      setEnsResult(data);
    } catch (e: unknown) {
      setEnsError(e instanceof Error ? e.message : "Lỗi chạy ensemble backtest");
    } finally {
      setEnsLoading(false);
    }
  };

  const handleOptimize = async () => {
    setEnsLoading(true);
    setEnsError("");
    setOptResult(null);
    try {
      const data = await optimizeEnsembleWeights(selectedSymbol, ensTimeframe);
      setOptResult(data);
    } catch (e: unknown) {
      setEnsError(e instanceof Error ? e.message : "Lỗi optimize weights");
    } finally {
      setEnsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ensemble" && ensResult?.equityCurve && chartContainerRef.current) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      const container = chartContainerRef.current;
      const chart = createChart(container, {
        layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#64748b", fontSize: 10 },
        grid: { vertLines: { visible: false }, horzLines: { color: "rgba(30, 41, 59, 0.6)" } },
        width: container.clientWidth,
        height: 260,
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false },
      });
      const ls = chart.addSeries(LineSeries, { color: "#14b8a6", lineWidth: 2 });
      
      const pts = ensResult.equityCurve.map(p => ({ time: Math.floor(p.timeMs / 1000) as UTCTimestamp, value: p.cumulativeReturnPct }));
      ls.setData(pts);
      chart.timeScale().fitContent();

      chartRef.current = chart;
      lineSeriesRef.current = ls;

      const handleResize = () => chart.applyOptions({ width: container.clientWidth });
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
      };
    }
  }, [activeTab, ensResult]);

  // Equity curve cho run ML được chọn — chỉ render khi equityCurveJson có dữ liệu.
  useEffect(() => {
    if (activeTab !== "ml" || detailEquity.length < 2 || !detailChartContainerRef.current) return;
    const container = detailChartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontSize: 10,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(30, 41, 59, 0.6)" },
      },
      width: container.clientWidth,
      height: 140,
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: "#14b8a6",
      topColor: "rgba(20, 184, 166, 0.25)",
      bottomColor: "rgba(20, 184, 166, 0)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    series.setData(detailEquity);
    chart.timeScale().fitContent();

    const handleResize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [activeTab, detailEquity]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-100">Backtest</h2>
          <p className="hidden sm:block truncate text-xs text-slate-400">Kết quả backtest chiến lược trên {selectedSymbol.replace("USDT", "/USDT")}.</p>
        </div>
        <span className="shrink-0 text-xs font-bold text-teal-300">{selectedSymbol.replace("USDT", "/USDT")}</span>
      </div>

      <div className="flex gap-4 overflow-x-auto text-xs" role="tablist" aria-label="Chế độ backtest">
        <button
          role="tab"
          aria-selected={activeTab === "ml"}
          onClick={() => setActiveTab("ml")}
          className={`shrink-0 py-1 font-medium transition-colors border-b-2 ${activeTab === "ml" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Single Model Backtests
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "ensemble"}
          onClick={() => setActiveTab("ensemble")}
          className={`shrink-0 py-1 font-medium transition-colors border-b-2 ${activeTab === "ensemble" ? "border-teal-400 text-teal-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}
        >
          Ensemble (Experimental)
        </button>
      </div>

      {activeTab === "ml" && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          {/* Dominant region: danh sách run */}
          <section className="min-w-0 flex-1 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
            <div className="flex h-9 items-center justify-between gap-3 border-b border-slate-800 px-3">
              <span className="text-xs font-medium text-slate-200">
                Danh sách đợt chạy{runs.length > 0 ? ` (${runs.length})` : ""}
              </span>
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={includeLegacy}
                  onChange={(event) => setIncludeLegacy(event.target.checked)}
                  className="h-3.5 w-3.5 accent-teal-500"
                />
                Lab: hiện Legacy/Invalid
              </label>
            </div>

            {error && (
              <div className="mx-3 mt-3 rounded-md bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Desktop: bảng phẳng */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="h-7 border-b border-slate-800 text-[11px] font-medium text-slate-500">
                    <th className="px-3 py-1 font-medium">Run</th>
                    <th className="px-2 py-1 font-medium">Model</th>
                    <th className="px-2 py-1 font-medium">Khung</th>
                    <th className="px-2 py-1 font-medium">Cửa sổ test</th>
                    <th className="px-2 py-1 text-right font-medium">Số lệnh</th>
                    <th className="px-2 py-1 text-right font-medium">Win rate</th>
                    <th className="px-2 py-1 text-right font-medium">PnL</th>
                    <th className="px-3 py-1 text-right font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {runs.map((r) => {
                    const st = runStatusOf(r);
                    const isSel = selected?.id === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => void loadDetail(r.id)}
                        className={`h-8 cursor-pointer font-mono tabular-nums transition-colors ${isSel ? "bg-teal-500/[0.07]" : "hover:bg-slate-800/40"}`}
                      >
                        <td className={`border-l-2 px-3 py-1 font-medium ${isSel ? "border-l-teal-400 text-teal-300" : "border-l-transparent text-slate-400"}`}>
                          #{r.id}
                        </td>
                        <td className="px-2 py-1 text-slate-200">{r.modelName}</td>
                        <td className="px-2 py-1 text-slate-400">{r.timeframe}</td>
                        <td className="whitespace-nowrap px-2 py-1 text-slate-400">
                          {formatDate(r.startTimeMs)} → {formatDate(r.endTimeMs)}
                        </td>
                        <td className="px-2 py-1 text-right text-slate-200">{r.totalTrades}</td>
                        <td className="px-2 py-1 text-right text-slate-200">{(r.winRate * 100).toFixed(1)}%</td>
                        <td className={`px-2 py-1 text-right font-medium ${pnlCls(r)}`}>{formatPct(r.totalReturnPct)}</td>
                        <td className="px-3 py-1 text-right font-sans">
                          <span className={`text-[11px] font-medium ${st.textCls}`}>{st.label}</span>
                          {r.invalidReason && (
                            <div className="mt-0.5 max-w-48 truncate text-[10px] text-slate-500" title={r.invalidReason}>
                              {r.invalidReason}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {runs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-3 font-sans text-xs text-slate-400">
                        {includeLegacy
                          ? "Không có backtest nào khớp bộ lọc hiện tại (đang bật Lab: Legacy/Invalid)."
                          : "Không có backtest Valid. Bật bộ lọc Lab để xem Legacy/Invalid."}
                      </td>
                    </tr>
                  )}
                  {runs.length === 0 && loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-3 font-sans text-xs text-slate-500">Đang tải…</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked flat rows */}
            <div className="divide-y divide-slate-800/60 md:hidden">
              {runs.map((r) => {
                const st = runStatusOf(r);
                const isSel = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => void loadDetail(r.id)}
                    className={`block w-full border-l-2 px-3 py-2.5 text-left transition-colors ${isSel ? "border-l-teal-400 bg-teal-500/[0.07]" : "border-l-transparent hover:bg-slate-800/40"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`font-mono text-xs font-medium ${isSel ? "text-teal-300" : "text-slate-300"}`}>#{r.id}</span>
                        <span className="truncate font-mono text-[11px] text-slate-400">{r.modelName}</span>
                        <span className="shrink-0 rounded border border-slate-800 bg-slate-950 px-1 font-mono text-[10px] text-slate-400">{r.timeframe}</span>
                      </div>
                      <span className={`shrink-0 text-[10px] font-medium ${st.textCls}`}>{st.label}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[11px] tabular-nums">
                      <span className="text-slate-300">
                        PnL <span className={pnlCls(r)}>{formatPct(r.totalReturnPct)}</span>
                        {" "}· win {(r.winRate * 100).toFixed(1)}% · {r.totalTrades} lệnh
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-500">
                        {formatMonth(r.createdAtUtc)}
                        {isSel && <ChevronRight className="h-3.5 w-3.5 text-teal-400" />}
                      </span>
                    </div>
                  </button>
                );
              })}
              {runs.length === 0 && !loading && (
                <div className="px-4 py-3 text-xs text-slate-400">
                  {includeLegacy
                    ? "Không có backtest nào khớp bộ lọc hiện tại (đang bật Lab: Legacy/Invalid)."
                    : "Không có backtest Valid. Bật bộ lọc Lab để xem Legacy/Invalid."}
                </div>
              )}
              {runs.length === 0 && loading && (
                <div className="px-4 py-3 text-xs text-slate-500">Đang tải…</div>
              )}
            </div>

            {includeLegacy && (
              <div className="flex items-center gap-2 border-t border-slate-800 px-3 py-2 text-xs text-amber-400/90">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>Kết quả Legacy/Invalid chỉ phục vụ điều tra, không phải bằng chứng production.</span>
              </div>
            )}
          </section>

          {/* Secondary region: chi tiết run được chọn */}
          {selected && selectedStatus && (
            <section className="min-w-0 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-900 lg:w-[36%]">
              <div className="flex h-10 items-center justify-between gap-2 border-b border-slate-800 px-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-100">Chi tiết run #{selected.id}</span>
                  <span className="truncate font-mono text-[11px] text-slate-400">{selected.modelName}</span>
                </div>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${selectedStatus.badgeCls}`}>
                  {selectedStatus.label}
                </span>
              </div>

              <div className="space-y-3 p-3">
                {selected.invalidReason && (
                  <p className={`rounded px-2.5 py-1.5 text-[11px] ${selectedStatus.key === "experimental" ? "bg-amber-500/10 text-amber-300/90" : "bg-rose-500/10 text-rose-300/90"}`}>
                    {selected.invalidReason}
                  </p>
                )}

                {/* Equity curve — chỉ khi run có dữ liệu equityCurveJson */}
                <div className="rounded border border-slate-800 bg-slate-950/60 p-2.5">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tăng trưởng vốn lũy kế</span>
                    <span className={`font-mono font-semibold tabular-nums ${selected.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPct(selected.totalReturnPct)}
                    </span>
                  </div>
                  {detailEquity.length > 1 ? (
                    <div ref={detailChartContainerRef} className="h-[140px] w-full" />
                  ) : (
                    <div className="flex h-20 items-center justify-center text-[11px] text-slate-500">
                      Run này không có dữ liệu equity curve.
                    </div>
                  )}
                </div>

                {/* Metric rows phẳng */}
                <div className="divide-y divide-slate-800/70 rounded border border-slate-800 bg-slate-950/40">
                  <MetricRow label="Cửa sổ test">
                    <span className="text-slate-300">{formatDate(selected.startTimeMs)} → {formatDate(selected.endTimeMs)}</span>
                  </MetricRow>
                  <MetricRow label="Số lệnh">
                    <span className="text-slate-200">{selected.totalTrades}</span>
                  </MetricRow>
                  <MetricRow label="Tỷ lệ thắng">
                    <span className="text-slate-200">{(selected.winRate * 100).toFixed(1)}%</span>
                  </MetricRow>
                  <MetricRow label="Buy & Hold">
                    <span className={selected.buyHoldReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatPct(selected.buyHoldReturnPct)}</span>
                  </MetricRow>
                  <MetricRow label="Sụt giảm tối đa">
                    <span className="text-rose-400">{selected.maxDrawdownPct.toFixed(1)}%</span>
                  </MetricRow>
                  <MetricRow label="Tỷ số Sharpe">
                    <span className="text-slate-200">{selected.sharpeRatio.toFixed(2)}</span>
                  </MetricRow>
                  <MetricRow label="Hệ số lợi nhuận (PF)">
                    <span className="text-slate-200">{selected.profitFactor.toFixed(2)}</span>
                  </MetricRow>
                  {selectedFeeBps !== null && (
                    <MetricRow label="Phí (feeBps)">
                      <span className="text-slate-300">{selectedFeeBps} bps</span>
                    </MetricRow>
                  )}
                  {selectedAvgHoldH !== null && (
                    <MetricRow label="Thời gian nắm giữ TB">
                      <span className="text-slate-300">{selectedAvgHoldH.toFixed(1)}h</span>
                    </MetricRow>
                  )}
                  <MetricRow label="Lợi nhuận ròng" highlight={selectedStatus.key === "valid"}>
                    <span className={selectedStatus.key === "invalid" ? "text-slate-500" : selected.totalReturnPct >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
                      {formatPct(selected.totalReturnPct)}
                    </span>
                  </MetricRow>
                </div>

                <p className="font-mono text-[10px] text-slate-500">
                  pipeline {selected.pipelineVersion} · eval {selected.evaluationVersion}
                </p>

                {/* Lệnh gần nhất */}
                <div className="overflow-hidden rounded border border-slate-800">
                  <div className="flex h-8 items-center justify-between border-b border-slate-800 bg-slate-800/40 px-3">
                    <span className="text-[11px] font-medium text-slate-300">Lệnh gần nhất</span>
                    <span className="font-mono text-[10px] text-slate-500">{selected.trades.length} lệnh · khung {selected.timeframe}</span>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    <table className="w-full text-left font-mono text-[11px] tabular-nums">
                      <thead className="sticky top-0 bg-slate-900">
                        <tr className="h-6 border-b border-slate-800 text-[10px] font-medium text-slate-500">
                          <th className="px-2 py-0.5 font-medium">Vào</th>
                          <th className="px-2 py-0.5 font-medium">Ra</th>
                          <th className="px-2 py-0.5 font-medium">Vị thế</th>
                          <th className="px-2 py-0.5 text-right font-medium">Giá vào</th>
                          <th className="px-2 py-0.5 text-right font-medium">Giá ra</th>
                          <th className="px-2 py-0.5 text-right font-medium">PnL</th>
                          <th className="px-2 py-0.5 text-right font-medium">Conf</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selected.trades.map((t) => (
                          <tr key={t.id} className="h-7 hover:bg-slate-800/40">
                            <td className="whitespace-nowrap px-2 py-1 text-slate-400">{formatTime(t.entryTimeMs)}</td>
                            <td className="whitespace-nowrap px-2 py-1 text-slate-400">{formatTime(t.exitTimeMs)}</td>
                            <td className={`px-2 py-1 font-medium ${t.side === "long" ? "text-emerald-400" : "text-rose-400"}`}>
                              {t.side === "long" ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
                              {t.side}
                            </td>
                            <td className="px-2 py-1 text-right text-slate-200">{t.entryPrice.toLocaleString()}</td>
                            <td className="px-2 py-1 text-right text-slate-200">{t.exitPrice.toLocaleString()}</td>
                            <td className={`px-2 py-1 text-right font-medium ${t.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {formatPct(t.pnlPct)}
                            </td>
                            <td className="px-2 py-1 text-right text-slate-500">{(t.confidence * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                        {selected.trades.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 font-sans text-xs text-slate-500">Run này không có lệnh nào.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "ensemble" && (
        <div className="space-y-3">
          <section className="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
            <div className="flex h-9 items-center justify-between border-b border-slate-800 px-3">
              <span className="text-xs font-medium text-slate-200">Cấu hình Ensemble Backtest</span>
              <span className="text-[10px] font-medium text-amber-400">experimental</span>
            </div>

            <div className="p-3">
              <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Timeframe</label>
                  <select value={ensTimeframe} onChange={e => setEnsTimeframe(e.target.value as ActiveTimeframe)} className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-200">
                    {ACTIVE_TIMEFRAMES.map((timeframe) => (
                      <option key={timeframe} value={timeframe}>{timeframe}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Min Conf</label>
                  <input type="number" step="0.01" value={ensMinConf} onChange={e => setEnsMinConf(Number(e.target.value))} className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-200" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Fee Bps</label>
                  <input type="number" value={ensFee} onChange={e => setEnsFee(Number(e.target.value))} className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-200" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">Capital</label>
                  <input type="number" value={ensCapital} onChange={e => setEnsCapital(Number(e.target.value))} className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-200" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void runEnsBacktest()}
                  disabled={ensLoading || !adminUnlocked}
                  className="rounded-md bg-teal-500/15 px-3 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/25 disabled:opacity-50"
                >
                  {ensLoading ? "Running..." : "Run Ensemble Backtest"}
                </button>
                <button
                  onClick={() => void handleOptimize()}
                  disabled={ensLoading || !adminUnlocked}
                  className="rounded-md bg-teal-500/15 px-3 py-1.5 text-xs font-medium text-teal-300 hover:bg-teal-500/25 disabled:opacity-50"
                >
                  Optimize Weights
                </button>
              </div>

              {ensError && ensError.includes("INSUFFICIENT_POINT_IN_TIME_DATA") ? (
                <div className="mt-3 flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="mb-1 font-medium">Chưa hỗ trợ Ensemble Backtest trung thực</p>
                    <p className="text-amber-300/80">Hệ thống hiện thiếu dữ liệu dự đoán point-in-time lịch sử (không bị look-ahead bias). Việc dùng mô hình hiện tại để dự đoán ngược quá khứ sẽ gây sai số và làm kết quả Buy & Hold đẹp một cách giả tạo. Vui lòng thu thập đủ log dự đoán real-time trước khi backtest.</p>
                  </div>
                </div>
              ) : ensError ? (
                <div className="mt-3 text-xs text-rose-400">{ensError}</div>
              ) : null}
            </div>
          </section>

          {optResult && (
            <section className="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
              <div className="flex h-9 items-center justify-between border-b border-slate-800 px-3">
                <span className="text-xs font-medium text-slate-200">Kết quả Optimize Weights</span>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">{optResult.testedCombinationsCount} tổ hợp</span>
              </div>
              <div className="space-y-3 p-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {Object.entries(optResult.bestWeights).map(([k, v]) => (
                    <div key={k} className="rounded border border-slate-800 bg-slate-950/60 p-2 text-center">
                      <div className="font-mono text-[10px] text-slate-400">{k}</div>
                      <div className="font-mono text-sm font-medium tabular-nums text-teal-300">{v.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-slate-800/70 rounded border border-slate-800 bg-slate-950/40">
                  <MetricRow label="Return">
                    <span className={optResult.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatPct(optResult.totalReturnPct)}</span>
                  </MetricRow>
                  <MetricRow label="Win rate">
                    <span className="text-slate-200">{(optResult.winRate * 100).toFixed(1)}%</span>
                  </MetricRow>
                  <MetricRow label="Sharpe">
                    <span className="text-slate-200">{optResult.sharpeRatio.toFixed(2)}</span>
                  </MetricRow>
                </div>
              </div>
            </section>
          )}

          {ensResult && (
            <section className="overflow-hidden rounded-md border border-slate-800 bg-slate-900">
              <div className="flex h-9 items-center justify-between border-b border-slate-800 px-3">
                <span className="text-xs font-medium text-slate-200">Kết quả Ensemble Backtest</span>
                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">experimental</span>
              </div>
              <div className="space-y-3 p-3">
                {ensResult.invalidReason && (
                  <p className="rounded bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300/90">{ensResult.invalidReason}</p>
                )}
                <div className="divide-y divide-slate-800/70 rounded border border-slate-800 bg-slate-950/40">
                  <MetricRow label="Lợi nhuận ròng" highlight>
                    <span className={ensResult.totalReturnPct >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>{formatPct(ensResult.totalReturnPct)}</span>
                  </MetricRow>
                  <MetricRow label="Tỷ lệ thắng">
                    <span className="text-slate-200">{(ensResult.winRate * 100).toFixed(1)}%</span>
                  </MetricRow>
                  <MetricRow label="Tỷ số Sharpe">
                    <span className="text-slate-200">{ensResult.sharpeRatio.toFixed(2)}</span>
                  </MetricRow>
                  <MetricRow label="Sụt giảm tối đa">
                    <span className="text-rose-400">{ensResult.maxDrawdownPct.toFixed(1)}%</span>
                  </MetricRow>
                </div>

                <div className="rounded border border-slate-800 bg-slate-950/60 p-2.5">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tăng trưởng vốn lũy kế</span>
                    <span className={`font-mono font-semibold tabular-nums ${ensResult.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatPct(ensResult.totalReturnPct)}</span>
                  </div>
                  <div ref={chartContainerRef} className="h-[260px] w-full" />
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
