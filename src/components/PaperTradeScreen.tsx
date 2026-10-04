"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Activity, ArrowUpRight, ArrowDownRight, LayoutList, Info, History, ChevronDown, TriangleAlert } from "lucide-react";
import { getPaperObservations, getPaperTrades, getPaperTradeSummary, getPaperTradeEquityCurve, getOpenPaperTrades } from "@/lib/api";
import type { PaperObservationListResponse, PaperObservationItem, PaperTradeItem, PaperTradeSummary, EquityCurvePoint } from "@/lib/types";
import { createChart, LineSeries, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { ACTIVE_TIMEFRAMES } from "@/lib/timeframe";
import { ACTIVE_SYMBOL, ACTIVE_SYMBOL_LABEL } from "@/lib/marketScope";
import { GlossaryTerm } from "./GlossaryTerm";

function formatPct(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

function decisionBadge(item: PaperObservationItem) {
  const label = item.decision.toUpperCase();
  if (item.decision === "abstain") {
    return (
      <span className="font-mono text-[11px] text-slate-400">
        <GlossaryTerm term={item.decision}>{label}</GlossaryTerm>
      </span>
    );
  }
  const cls = item.decision === "long"
    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
    : item.decision === "short"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
      : "text-slate-300 bg-slate-800 border-slate-700";
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold ${cls}`}>
      <GlossaryTerm term={item.decision}>{label}</GlossaryTerm>
    </span>
  );
}

function outcomeCell(item: PaperObservationItem) {
  if (item.outcomeReturn != null) {
    return (
      <span className={`font-mono tabular-nums ${item.outcomeReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
        {formatPct(item.outcomeReturn * 100)}
      </span>
    );
  }
  if (item.fillPrice != null) {
    return <span className="text-slate-500">đang chờ</span>;
  }
  return <span className="font-mono text-slate-500">—</span>;
}

function reasonCell(item: PaperObservationItem) {
  if (item.abstentionReason === "model_unavailable") {
    return (
      <span className="font-mono text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1 py-0.5 rounded">
        model_unavailable
      </span>
    );
  }
  if (item.abstentionReason) {
    return <span className="text-slate-400">{item.abstentionReason}</span>;
  }
  return <span className="text-slate-500">{item.modelVersion ?? "—"}</span>;
}

type ObsFilter = "all" | "filled" | "abstain";

export function PaperTradeScreen() {
  const [selectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [selectedTf, setSelectedTf] = useState<string>("all");
  const [summary, setSummary] = useState<PaperTradeSummary | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTradeItem[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTradeItem[]>([]);
  const [equityPoints, setEquityPoints] = useState<EquityCurvePoint[]>([]);
  const [observations, setObservations] = useState<PaperObservationListResponse | null>(null);
  const [obsFilter, setObsFilter] = useState<ObsFilter>("all");
  const [replayOpen, setReplayOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const loadAll = useCallback(async (sym = selectedSymbol, tf = selectedTf) => {
    setLoading(true);
    setError("");
    try {
      const symbolParam = sym;
      const timeframeParam = tf === "all" ? undefined : tf;
      const [legacyResult, observationResult] = await Promise.allSettled([
        Promise.all([
          getPaperTradeSummary(symbolParam, timeframeParam),
          getOpenPaperTrades(symbolParam),
          getPaperTrades({ symbol: symbolParam, timeframe: timeframeParam, status: "closed", take: 100 }),
          getPaperTradeEquityCurve(symbolParam, timeframeParam),
        ]),
        getPaperObservations(symbolParam, 25),
      ]);
      const errors: string[] = [];
      if (legacyResult.status === "fulfilled") {
        const [sumRes, openRes, closedRes, eqRes] = legacyResult.value;
        setSummary(sumRes);
        setOpenTrades(openRes.items ?? []);
        setClosedTrades(closedRes.items ?? []);
        setEquityPoints(eqRes.points ?? []);
      } else {
        setSummary(null);
        setOpenTrades([]);
        setClosedTrades([]);
        setEquityPoints([]);
        errors.push(legacyResult.reason instanceof Error ? legacyResult.reason.message : "Tải lịch sử replay thất bại");
      }
      if (observationResult.status === "fulfilled") {
        setObservations(observationResult.value);
      } else {
        setObservations(null);
        errors.push(observationResult.reason instanceof Error ? observationResult.reason.message : "Tải forward journal thất bại");
      }
      setError(errors.join(" · "));
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, selectedTf]);

  useEffect(() => {
    void loadAll(selectedSymbol, selectedTf);
  }, [loadAll, selectedSymbol, selectedTf]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#131b2e" },
        textColor: '#94a3bf',
      },
      grid: {
        vertLines: { color: 'rgba(28, 38, 62, 0.5)' },
        horzLines: { color: 'rgba(28, 38, 62, 0.5)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 300,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#14b8a6',
      lineWidth: 2,
    });
    
    chartRef.current = chart;
    lineSeriesRef.current = lineSeries;

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      lineSeriesRef.current = null;
    };
  }, [replayOpen]);

  useEffect(() => {
    if (lineSeriesRef.current && equityPoints.length > 0) {
      const data = equityPoints.map(p => ({
        time: Math.floor(p.timeMs / 1000) as UTCTimestamp,
        value: p.cumulativeReturnPct
      })).sort((a, b) => (a.time as number) - (b.time as number));
      
      // Ensure unique sorted times
      const uniqueData = data.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);
      lineSeriesRef.current.setData(uniqueData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [equityPoints, replayOpen]);

  const winRateColor = summary ? (summary.winRate >= 0.55 ? "text-emerald-400" : summary.winRate >= 0.45 ? "text-slate-400" : "text-rose-400") : "text-slate-400";
  const returnColor = summary ? (summary.totalNetReturnPct >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-400";

  const obsItems = observations?.items ?? [];
  const obsTotal = obsItems.length;
  const obsAbstain = obsItems.filter((i) => i.decision === "abstain").length;
  const obsFilled = obsItems.filter((i) => i.fillPrice != null).length;
  const obsOpen = obsItems.filter((i) => i.fillPrice != null && i.outcomeReturn == null).length;
  const abstainPct = obsTotal > 0 ? ((obsAbstain / obsTotal) * 100).toFixed(1) : null;
  const filteredObs = obsFilter === "filled"
    ? obsItems.filter((i) => i.fillPrice != null)
    : obsFilter === "abstain"
      ? obsItems.filter((i) => i.decision === "abstain")
      : obsItems;
  const lastObserved = obsItems.length > 0 ? Math.max(...obsItems.map((i) => i.signalBarCloseTimeMs)) : null;

  const obsFilterBtn = (id: ObsFilter, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setObsFilter(id)}
      className={`px-1.5 py-0.5 rounded border font-mono text-[11px] transition-colors ${
        obsFilter === id
          ? "bg-slate-800 border-slate-700 text-slate-200"
          : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Paper BTC</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Nhật ký quan sát forward theo nến 4h · {ACTIVE_SYMBOL_LABEL}. Quyết định ghi lúc quan sát, không suy diễn ngược.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastObserved != null && (
            <span className="hidden sm:inline text-xs text-slate-500">
              Nến tín hiệu gần nhất: <span className="font-mono tabular-nums text-slate-300">{formatTime(lastObserved)}</span>
            </span>
          )}
          <button
            onClick={() => void loadAll(selectedSymbol, selectedTf)}
            disabled={loading}
            className="h-7 px-2.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200 inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Quiet context note: forward journal ≠ historical replay */}
      <div className="flex items-start gap-2 bg-slate-900/60 border border-slate-800 rounded px-2.5 py-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          <GlossaryTerm term="forward-journal">Nhật ký forward</GlossaryTerm> — khác với mô phỏng lịch sử (replay) ở tab Nhật ký.
          Tín hiệu được ghi độc lập ngay tại thời điểm đóng nến, không tính hồi quy.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-900/50 text-rose-300 rounded px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {/* Ensemble quarantine notice (real warning, kept) */}
      <div className="bg-amber-950/20 border border-amber-900/50 rounded px-3 py-2 flex items-start gap-2">
        <TriangleAlert className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          <span className="text-amber-300 font-medium"><GlossaryTerm term="ensemble">Ensemble</GlossaryTerm> đang bị <GlossaryTerm term="quarantine">quarantine</GlossaryTerm>.</span>{" "}
          Pipeline <GlossaryTerm term="ensemble">ensemble</GlossaryTerm> <GlossaryTerm term="legacy">legacy</GlossaryTerm> chưa qua <GlossaryTerm term="promotion-gate">promotion gate</GlossaryTerm>; Paper Journal không tạo tín hiệu mới từ pipeline này.
        </p>
      </div>

      {/* Compact metric strip — forward journal */}
      <div className="bg-slate-900 border border-slate-800 rounded px-3 py-2.5 flex flex-wrap items-center gap-y-2">
        <div className="flex flex-wrap items-center divide-x divide-slate-800 text-xs">
          <div className="pr-4 flex items-center gap-2">
            <span className="text-slate-500">Quan sát:</span>
            <span className="font-mono tabular-nums text-slate-100 font-semibold">{obsTotal}</span>
          </div>
          <div className="px-4 flex items-center gap-2">
            <span className="text-slate-500"><GlossaryTerm term="abstain">Abstain</GlossaryTerm>:</span>
            <span className="font-mono tabular-nums text-amber-400 font-semibold">{obsAbstain}</span>
            {abstainPct != null && <span className="text-slate-500 font-mono tabular-nums">({abstainPct}%)</span>}
          </div>
          <div className="px-4 flex items-center gap-2">
            <span className="text-slate-500"><GlossaryTerm term="fill">Fill</GlossaryTerm>:</span>
            <span className="font-mono tabular-nums text-slate-100 font-semibold">{obsFilled}</span>
          </div>
          <div className="pl-4 flex items-center gap-2">
            <span className="text-slate-500">Đang mở:</span>
            <span className="font-mono tabular-nums text-teal-400 font-semibold">{obsOpen}</span>
          </div>
        </div>
        <span className="ml-auto text-[10px] text-slate-600">tính trên {obsTotal} bản ghi đã tải</span>
      </div>

      {/* Forward observation rows — dominant */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="min-h-9 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-850/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-200"><GlossaryTerm term="forward-journal">Dòng sự kiện forward</GlossaryTerm> (4h)</span>
            <span className="text-xs text-slate-500">— bản ghi <GlossaryTerm term="append-only">append-only</GlossaryTerm> tại thời điểm đóng nến; <GlossaryTerm term="fill">fill</GlossaryTerm>/<GlossaryTerm term="outcome">outcome</GlossaryTerm> chỉ hiện khi quan sát thật</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 mr-1">Bộ lọc:</span>
            {obsFilterBtn("all", "Tất cả", obsTotal)}
            {obsFilterBtn("filled", "Chỉ lệnh khớp", obsFilled)}
            {obsFilterBtn("abstain", "Abstain", obsAbstain)}
          </div>
        </div>

        {!observations?.available ? (
          <div className="px-3 py-3 text-xs text-amber-300/90">
            {observations?.reason ?? <>Chưa có <GlossaryTerm term="registry">registry</GlossaryTerm> forward observation.</>}
          </div>
        ) : obsTotal === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-400">Chưa có quyết định forward nào được ghi.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/60">
                    <th className="text-left py-2 px-3 font-medium">Nến tín hiệu</th>
                    <th className="text-left py-2 px-3 font-medium">Quyết định</th>
                    <th className="text-right py-2 px-3 font-medium"><GlossaryTerm term="quote">Quote lúc quyết định</GlossaryTerm></th>
                    <th className="text-right py-2 px-3 font-medium"><GlossaryTerm term="fill">Fill</GlossaryTerm></th>
                    <th className="text-right py-2 px-3 font-medium"><GlossaryTerm term="outcome">Kết quả</GlossaryTerm></th>
                    <th className="text-left py-2 px-4 font-medium">Lý do / model</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredObs.map((item) => {
                    const isAbstain = item.decision === "abstain";
                    return (
                      <tr key={item.decisionId} className="hover:bg-slate-800/40 transition-colors">
                        <td className={`py-2 px-3 whitespace-nowrap font-mono tabular-nums ${isAbstain ? "text-slate-500" : "text-slate-200"}`}>
                          {formatTime(item.signalBarCloseTimeMs)}
                          <span className="text-slate-600 ml-1.5">[{item.timeframe}]</span>
                        </td>
                        <td className="py-2 px-3">{decisionBadge(item)}</td>
                        <td className={`py-2 px-3 text-right font-mono tabular-nums ${isAbstain ? "text-slate-500" : "text-slate-200"}`}>
                          {item.quotePrice == null ? "—" : item.quotePrice.toLocaleString()}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono tabular-nums ${isAbstain ? "text-slate-500" : "text-slate-300"}`}>
                          {item.fillPrice == null ? "—" : item.fillPrice.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right">{outcomeCell(item)}</td>
                        <td className="py-2 px-4">{reasonCell(item)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked flat rows */}
            <div className="md:hidden divide-y divide-slate-800/60">
              {filteredObs.map((item) => {
                const isAbstain = item.decision === "abstain";
                return (
                  <div key={item.decisionId} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-mono text-[11px] tabular-nums ${isAbstain ? "text-slate-500" : "text-slate-200"}`}>
                          {formatTime(item.signalBarCloseTimeMs)}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-950 border border-slate-800 px-1 py-0.5 rounded flex-shrink-0">
                          {item.timeframe}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {decisionBadge(item)}
                        {outcomeCell(item)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums border-y border-slate-800/60 my-1.5 py-1.5">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Quote lúc quyết định</span>
                        <span className={isAbstain ? "text-slate-500" : "text-slate-200"}>
                          {item.quotePrice == null ? "—" : item.quotePrice.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Fill</span>
                        <span className={isAbstain ? "text-slate-500" : "text-slate-300"}>
                          {item.fillPrice == null ? "—" : item.fillPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px]">{reasonCell(item)}</div>
                  </div>
                );
              })}
            </div>

            {/* Count footer */}
            <div className="px-3 py-2 border-t border-slate-800/60 text-[11px] text-slate-500 bg-slate-950/60">
              Hiển thị <span className="font-mono tabular-nums text-slate-300">{filteredObs.length}</span> trên{" "}
              <span className="font-mono tabular-nums text-slate-300">{obsTotal}</span> bản ghi quan sát forward gần nhất
            </div>
          </>
        )}
      </div>

      {/* Historical replay — collapsed, amber experimental marking */}
      <div className="pt-1 border-t border-slate-800">
        <div className="bg-slate-900 border border-slate-800 rounded p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm font-semibold text-slate-200">Mô phỏng lịch sử (replay)</span>
              <span className="px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400">experimental</span>
            </div>
            <button
              type="button"
              onClick={() => setReplayOpen((v) => !v)}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
              aria-expanded={replayOpen}
            >
              {replayOpen ? "Thu gọn" : "Mở rộng chi tiết"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${replayOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-[11px] text-amber-300/90 flex items-start gap-2">
            <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="font-medium">Cảnh báo kiểm định:</strong> Kết quả replay chạy trên dữ liệu nến đã đóng với giả lập khớp lệnh lý tưởng — không phản ánh trượt giá hay rủi ro forward. Dữ liệu bên dưới hoàn toàn độc lập với Forward Journal phía trên.
            </span>
          </div>

          {replayOpen && (
            <div className="pt-2 border-t border-slate-800/60 space-y-4">
              {/* Bộ lọc khung — chỉ ảnh hưởng dữ liệu replay, không đụng forward journal */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">Khung:</span>
                {[{ id: "all", label: "Tất cả" }, ...ACTIVE_TIMEFRAMES.map((timeframe) => ({ id: timeframe, label: timeframe }))].map((tf) => (
                  <button
                    key={tf.id}
                    onClick={() => setSelectedTf(tf.id)}
                    className={`py-1 font-medium transition-colors border-b-2 ${
                      selectedTf === tf.id
                        ? "border-teal-400 text-teal-300"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                  <div className="text-xs text-slate-500 mb-1 flex items-center justify-between">
                    <span>Tổng giao dịch</span>
                    <Activity className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="text-xl font-semibold font-mono tabular-nums text-slate-100 mb-1.5">
                    {summary?.totalTrades ?? 0}
                  </div>
                  <div className="flex gap-2 text-[11px] font-mono tabular-nums">
                    <span className="text-emerald-400">Đóng: {summary?.closedTrades ?? 0}</span>
                    <span className="text-slate-500">Mở: {summary?.openTrades ?? 0}</span>
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                  <div className="text-xs text-slate-500 mb-1"><GlossaryTerm term="win-rate">Win Rate</GlossaryTerm></div>
                  <div className={`text-xl font-semibold font-mono tabular-nums ${winRateColor}`}>
                    {summary ? (summary.winRate * 100).toFixed(1) + "%" : "0.0%"}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                  <div className="text-xs text-slate-500 mb-1"><GlossaryTerm term="net-return">Net Return</GlossaryTerm></div>
                  <div className={`text-xl font-semibold font-mono tabular-nums ${returnColor}`}>
                    {summary ? formatPct(summary.totalNetReturnPct) : "0.00%"}
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                  <div className="text-xs text-slate-500 mb-1"><GlossaryTerm term="drawdown">Max Drawdown</GlossaryTerm></div>
                  <div className="text-xl font-semibold font-mono tabular-nums text-rose-400">
                    {summary ? summary.maxDrawdownPct.toFixed(1) + "%" : "0.0%"}
                  </div>
                </div>
              </div>

              {/* Equity curve */}
              <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                <h3 className="text-sm font-semibold mb-3 text-slate-300"><GlossaryTerm term="equity-curve">Đường vốn (Equity Curve)</GlossaryTerm></h3>
                {equityPoints.length === 0 && !loading ? (
                  <div className="h-[300px] flex items-center justify-center text-sm text-slate-500">
                    Chưa có dữ liệu
                  </div>
                ) : (
                  <div ref={chartContainerRef} className="w-full h-[300px]" />
                )}
              </div>

              {/* Open positions */}
              {openTrades.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-200">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    Lệnh đang mở
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="text-left py-2 px-2 font-medium">Hướng</th>
                          <th className="text-right py-2 px-2 font-medium">Giá vào</th>
                          <th className="text-right py-2 px-2 font-medium">Mục tiêu (<GlossaryTerm term="sl-tp">SL/TP</GlossaryTerm>)</th>
                          <th className="text-right py-2 px-2 font-medium"><GlossaryTerm term="confidence">Confidence</GlossaryTerm></th>
                          <th className="text-left py-2 px-2 font-medium">Tags / Model</th>
                          <th className="text-left py-2 px-2 font-medium">Thời gian vào</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openTrades.map((t) => (
                          <tr key={t.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                            <td className="py-2 px-2">
                              <span className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold ${t.side === "long" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
                                {t.side === "long" ? <ArrowUpRight className="inline w-3 h-3 mr-0.5" /> : <ArrowDownRight className="inline w-3 h-3 mr-0.5" />}
                                {t.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-200">{t.entryPrice?.toLocaleString() ?? "—"}</td>
                            <td className="py-2 px-2 text-right font-mono tabular-nums">
                              {t.stopLossPrice && <span className="text-rose-400 mr-2">SL: {t.stopLossPrice.toLocaleString()}</span>}
                              {t.takeProfitPrice && <span className="text-emerald-400">TP: {t.takeProfitPrice.toLocaleString()}</span>}
                              {(!t.stopLossPrice && !t.takeProfitPrice) && <span className="text-slate-500">—</span>}
                            </td>
                            <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-300">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "—"}</td>
                            <td className="py-2 px-2">
                              <div className="flex flex-wrap gap-1">
                                {t.tags?.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{tag}</span>
                                ))}
                                {(!t.tags || t.tags.length === 0) && <span className="text-[11px] text-slate-500">{t.modelVersion ?? "—"}</span>}
                              </div>
                            </td>
                            <td className="py-2 px-2 font-mono tabular-nums text-slate-400">{formatTime(t.entryTimeMs)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Closed trades */}
              <div className="bg-slate-950/60 border border-slate-800 rounded p-3">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-200">
                  <LayoutList className="w-4 h-4 text-slate-500" />
                  Lịch sử giao dịch (50 lệnh gần nhất)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-slate-500 border-b border-slate-800">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium">Thời gian ra</th>
                        <th className="text-left py-2 px-2 font-medium">Hướng</th>
                        <th className="text-right py-2 px-2 font-medium">Giá vào</th>
                        <th className="text-right py-2 px-2 font-medium">Giá ra</th>
                        <th className="text-right py-2 px-2 font-medium"><GlossaryTerm term="pnl">PnL</GlossaryTerm> %</th>
                        <th className="text-right py-2 px-2 font-medium"><GlossaryTerm term="confidence">Conf</GlossaryTerm></th>
                        <th className="text-left py-2 px-2 font-medium">Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedTrades.map((t) => (
                        <tr key={t.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-2 font-mono tabular-nums text-slate-400">{t.exitTimeMs ? formatTime(t.exitTimeMs) : "—"}</td>
                          <td className="py-2 px-2">
                            <span className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold ${t.side.toLowerCase() === "long" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-rose-400 bg-rose-500/10 border-rose-500/30"}`}>
                              {t.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-200">{t.entryPrice?.toLocaleString() ?? "—"}</td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-200">{t.exitPrice?.toLocaleString() ?? "—"}</td>
                          <td className={`py-2 px-2 text-right font-mono tabular-nums font-medium ${t.netReturn && t.netReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.netReturn != null ? formatPct(t.netReturnPct ?? t.netReturn * 100) : "—"}
                          </td>
                          <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-400">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "—"}</td>
                          <td className="py-2 px-2 text-slate-500 text-[11px]">{t.modelVersion ?? "—"}</td>
                        </tr>
                      ))}
                      {closedTrades.length === 0 && !loading && (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-slate-500">Chưa có giao dịch nào hoàn tất</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
