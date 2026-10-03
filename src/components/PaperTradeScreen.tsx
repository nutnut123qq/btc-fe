"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LineChart, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, LayoutList } from "lucide-react";
import { getPaperObservations, getPaperTrades, getPaperTradeSummary, getPaperTradeEquityCurve, getOpenPaperTrades } from "@/lib/api";
import type { PaperObservationListResponse, PaperTradeItem, PaperTradeSummary, EquityCurvePoint } from "@/lib/types";
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

const SYMBOL_OPTIONS = [
  { id: ACTIVE_SYMBOL, label: ACTIVE_SYMBOL_LABEL },
];

export function PaperTradeScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [selectedTf, setSelectedTf] = useState<string>("all");
  const [summary, setSummary] = useState<PaperTradeSummary | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTradeItem[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTradeItem[]>([]);
  const [equityPoints, setEquityPoints] = useState<EquityCurvePoint[]>([]);
  const [observations, setObservations] = useState<PaperObservationListResponse | null>(null);
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
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(31, 41, 55, 0.3)' },
        horzLines: { color: 'rgba(31, 41, 55, 0.3)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: 300,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#2dd4bf', // teal-400
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
  }, []);

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
  }, [equityPoints]);

  const winRateColor = summary ? (summary.winRate >= 0.55 ? "text-emerald-400" : summary.winRate >= 0.45 ? "text-slate-400" : "text-rose-400") : "text-slate-400";
  const returnColor = summary ? (summary.totalNetReturnPct >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-400";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LineChart className="text-teal-400" />
            Paper Trading
          </h2>
          <p className="text-xs text-slate-400">Theo dõi lệnh giao dịch mô phỏng realtime</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 px-1">Cặp coin:</span>
            {SYMBOL_OPTIONS.map((sym) => (
              <button
                key={sym.id}
                onClick={() => setSelectedSymbol(sym.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedSymbol === sym.id
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sym.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium px-1">Khung:</span>
            {[{ id: "all", label: "Tất cả (kể cả lịch sử)" }, ...ACTIVE_TIMEFRAMES.map((timeframe) => ({ id: timeframe, label: timeframe }))].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTf(tf.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
 selectedTf === tf.id
 ? "bg-teal-500/20 text-teal-300 font-bold"
 : "text-slate-400 hover:text-slate-200"
 }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => void loadAll(selectedSymbol, selectedTf)}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 text-rose-300 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="bg-amber-950/20 border border-amber-900/50 rounded-2xl px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-amber-300"><GlossaryTerm term="ensemble">Ensemble</GlossaryTerm> đang được <GlossaryTerm term="quarantine">quarantine</GlossaryTerm></h3>
          <p className="text-xs text-slate-400 mt-1">Pipeline <GlossaryTerm term="ensemble">ensemble</GlossaryTerm> <GlossaryTerm term="legacy">legacy</GlossaryTerm> chưa qua <GlossaryTerm term="promotion-gate">promotion gate</GlossaryTerm>; Paper Journal không tạo tín hiệu mới từ pipeline này.</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200"><GlossaryTerm term="forward-journal">Forward observation journal</GlossaryTerm> · BTCUSDT 4h cố định</h3>
            <p className="text-xs text-slate-400 mt-1">Độc lập với bộ lọc lịch sử phía trên. Bản ghi <GlossaryTerm term="append-only">append-only</GlossaryTerm> tại thời điểm quyết định; <GlossaryTerm term="fill">fill</GlossaryTerm>, <GlossaryTerm term="outcome">outcome</GlossaryTerm> và <GlossaryTerm term="pnl">PnL</GlossaryTerm> chỉ hiện khi được quan sát thật.</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${observations?.available ? " bg-emerald-950/40 text-emerald-300" : " bg-amber-950/40 text-amber-300"}`}>
            {observations?.available ? `${observations.items.length} bản ghi` : "Chưa khả dụng"}
          </span>
        </div>
        {!observations?.available ? (
          <div className="text-xs text-amber-300/90">{observations?.reason ?? <>Chưa có <GlossaryTerm term="registry">registry</GlossaryTerm> forward observation.</>}</div>
        ) : observations.items.length === 0 ? (
          <div className="text-sm text-slate-400 py-3">Chưa có quyết định forward nào được ghi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 border-b border-slate-800/60">
                <tr>
                  <th className="text-left py-2 px-2">Nến đóng</th>
                  <th className="text-left py-2 px-2">Khung</th>
                  <th className="text-left py-2 px-2">Quyết định</th>
                  <th className="text-left py-2 px-2">Lý do / model</th>
                  <th className="text-right py-2 px-2"><GlossaryTerm term="quote">Quote thật</GlossaryTerm></th>
                  <th className="text-right py-2 px-2"><GlossaryTerm term="fill">Fill</GlossaryTerm></th>
                  <th className="text-right py-2 px-2"><GlossaryTerm term="outcome">Outcome</GlossaryTerm></th>
                </tr>
              </thead>
              <tbody>
                {observations.items.map((item) => (
                  <tr key={item.decisionId} className="border-b border-slate-800/30">
                    <td className="py-2 px-2 text-slate-400 whitespace-nowrap">{formatTime(item.signalBarCloseTimeMs)}</td>
                    <td className="py-2 px-2 text-slate-400">{item.timeframe}</td>
                    <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded font-medium ${item.decision === "abstain" ? "bg-amber-500/15 text-amber-300" : "bg-teal-500/15 text-teal-300"}`}><GlossaryTerm term={item.decision}>{item.decision}</GlossaryTerm></span></td>
                    <td className="py-2 px-2 text-slate-400">{item.abstentionReason ?? item.modelVersion ?? "-"}</td>
                    <td className="py-2 px-2 text-right text-slate-300">{item.quotePrice == null ? "-" : item.quotePrice.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-400">{item.fillPrice == null ? "Chưa có" : item.fillPrice.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-slate-400">{item.outcomeReturn == null ? "Chưa có" : formatPct(item.outcomeReturn * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>Tổng giao dịch</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mb-2">
            {summary?.totalTrades ?? 0}
          </div>
          <div className="flex gap-2 text-xs">
            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Đóng: {summary?.closedTrades ?? 0}</span>
            <span className="bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">Mở: {summary?.openTrades ?? 0}</span>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-slate-400 mb-1"><GlossaryTerm term="win-rate">Win Rate</GlossaryTerm></div>
          <div className={`text-2xl font-bold ${winRateColor}`}>
            {summary ? (summary.winRate * 100).toFixed(1) + "%" : "0.0%"}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-slate-400 mb-1"><GlossaryTerm term="net-return">Net Return</GlossaryTerm></div>
          <div className={`text-2xl font-bold ${returnColor}`}>
            {summary ? formatPct(summary.totalNetReturnPct) : "0.00%"}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-slate-400 mb-1"><GlossaryTerm term="drawdown">Max Drawdown</GlossaryTerm></div>
          <div className="text-2xl font-bold text-rose-400">
            {summary ? summary.maxDrawdownPct.toFixed(1) + "%" : "0.0%"}
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-4 text-slate-300"><GlossaryTerm term="equity-curve">Đường vốn (Equity Curve)</GlossaryTerm></h3>
        {equityPoints.length === 0 && !loading ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-[300px]" />
        )}
      </div>

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Lệnh đang mở
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-800/50">
                <tr>
                  <th className="text-left py-2 px-2">Hướng</th>
                  <th className="text-right py-2 px-2">Giá vào</th>
                  <th className="text-right py-2 px-2">Mục tiêu (<GlossaryTerm term="sl-tp">SL/TP</GlossaryTerm>)</th>
                  <th className="text-right py-2 px-2"><GlossaryTerm term="confidence">Confidence</GlossaryTerm></th>
                  <th className="text-left py-2 px-2">Tags / Model</th>
                  <th className="text-left py-2 px-2">Thời gian vào</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t) => (
                  <tr key={t.id} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.side === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                        {t.side === "long" ? <ArrowUpRight className="inline w-3 h-3 mr-1" /> : <ArrowDownRight className="inline w-3 h-3 mr-1" />}
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">{t.entryPrice?.toLocaleString() ?? "-"}</td>
                    <td className="py-2 px-2 text-right">
                      {t.stopLossPrice && <span className="text-rose-400 text-xs mr-2">SL: {t.stopLossPrice.toLocaleString()}</span>}
                      {t.takeProfitPrice && <span className="text-emerald-400 text-xs">TP: {t.takeProfitPrice.toLocaleString()}</span>}
                      {(!t.stopLossPrice && !t.takeProfitPrice) && <span className="text-slate-400 text-xs">-</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-300">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "-"}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {t.tags?.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">{tag}</span>
                        ))}
                        {(!t.tags || t.tags.length === 0) && <span className="text-xs text-slate-400">{t.modelVersion ?? "-"}</span>}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-400">{formatTime(t.entryTimeMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closed Trades */}
      <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-slate-400" />
          Lịch sử giao dịch (50 lệnh gần nhất)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-800/50">
              <tr>
                <th className="text-left py-2 px-2">Thời gian ra</th>
                <th className="text-left py-2 px-2">Hướng</th>
                <th className="text-right py-2 px-2">Giá vào</th>
                <th className="text-right py-2 px-2">Giá ra</th>
                <th className="text-right py-2 px-2"><GlossaryTerm term="pnl">PnL</GlossaryTerm> %</th>
                <th className="text-right py-2 px-2"><GlossaryTerm term="confidence">Conf</GlossaryTerm></th>
                <th className="text-left py-2 px-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {closedTrades.map((t) => (
                <tr key={t.id} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                  <td className="py-2 px-2 text-slate-400">{t.exitTimeMs ? formatTime(t.exitTimeMs) : "-"}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.side.toLowerCase() === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {t.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">{t.entryPrice?.toLocaleString() ?? "-"}</td>
                  <td className="py-2 px-2 text-right">{t.exitPrice?.toLocaleString() ?? "-"}</td>
                  <td className={`py-2 px-2 text-right font-medium ${t.netReturn && t.netReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.netReturn != null ? formatPct(t.netReturnPct ?? t.netReturn * 100) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right text-slate-400">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "-"}</td>
                  <td className="py-2 px-2 text-slate-400 text-xs">{t.modelVersion ?? "-"}</td>
                </tr>
              ))}
              {closedTrades.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">Chưa có giao dịch nào hoàn tất</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
