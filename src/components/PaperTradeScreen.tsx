"use client";

import { useEffect, useState, useRef } from "react";
import { LineChart, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, LayoutList } from "lucide-react";
import { getPaperTrades, getPaperTradeSummary, getPaperTradeEquityCurve, getOpenPaperTrades } from "@/lib/api";
import type { PaperTradeItem, PaperTradeSummary, EquityCurvePoint } from "@/lib/types";
import { createChart, LineSeries, ColorType, type IChartApi } from "lightweight-charts";

function formatPct(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

export function PaperTradeScreen() {
  const [selectedTf, setSelectedTf] = useState<string>("all");
  const [summary, setSummary] = useState<PaperTradeSummary | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTradeItem[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTradeItem[]>([]);
  const [equityPoints, setEquityPoints] = useState<EquityCurvePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<any>(null);

  const loadAll = async (tf = selectedTf) => {
    setLoading(true);
    setError("");
    try {
      const timeframeParam = tf === "all" ? undefined : tf;
      const [sumRes, openRes, closedRes, eqRes] = await Promise.all([
        getPaperTradeSummary("BTCUSDT", timeframeParam),
        getOpenPaperTrades("BTCUSDT"),
        getPaperTrades({ symbol: "BTCUSDT", timeframe: timeframeParam, status: "closed", take: 100 }),
        getPaperTradeEquityCurve("BTCUSDT", timeframeParam)
      ]);
      setSummary(sumRes);
      setOpenTrades(openRes.items ?? []);
      setClosedTrades(closedRes.items ?? []);
      setEquityPoints(eqRes.points ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Tải dữ liệu paper trading thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll(selectedTf);
  }, [selectedTf]);

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
        time: (p.timeMs / 1000) as any,
        value: p.cumulativeReturnPct
      })).sort((a, b) => (a.time as number) - (b.time as number));
      
      // Ensure unique sorted times
      const uniqueData = data.filter((v, i, a) => i === 0 || v.time !== a[i-1].time);
      lineSeriesRef.current.setData(uniqueData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [equityPoints]);

  const winRateColor = summary ? (summary.winRate >= 0.55 ? "text-emerald-400" : summary.winRate >= 0.45 ? "text-amber-400" : "text-rose-400") : "text-gray-400";
  const returnColor = summary ? (summary.totalNetReturnPct >= 0 ? "text-emerald-400" : "text-rose-400") : "text-gray-400";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LineChart className="text-teal-400" />
            Paper Trading
          </h2>
          <p className="text-xs text-gray-500">Theo dõi lệnh giao dịch mô phỏng realtime</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1">Khung thời gian:</span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "4h", label: "4h" },
              { id: "1h", label: "1h" },
              { id: "30m", label: "30m" },
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setSelectedTf(tf.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  selectedTf === tf.id
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-gray-900/60 text-gray-400 hover:text-gray-200 border border-gray-800"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => void loadAll(selectedTf)}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1 flex items-center justify-between">
            <span>Tổng giao dịch</span>
            <Activity className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-100 mb-2">
            {summary?.totalTrades ?? 0}
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Đóng: {summary?.closedTrades ?? 0}</span>
            <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Mở: {summary?.openTrades ?? 0}</span>
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Win Rate</div>
          <div className={`text-2xl font-bold ${winRateColor}`}>
            {summary ? (summary.winRate * 100).toFixed(1) + "%" : "0.0%"}
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Net Return</div>
          <div className={`text-2xl font-bold ${returnColor}`}>
            {summary ? formatPct(summary.totalNetReturnPct) : "0.00%"}
          </div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4 transition-all duration-200">
          <div className="text-xs text-gray-400 mb-1">Max Drawdown</div>
          <div className="text-2xl font-bold text-rose-400">
            {summary ? summary.maxDrawdownPct.toFixed(1) + "%" : "0.0%"}
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-4 text-gray-300">Đường vốn (Equity Curve)</h3>
        {equityPoints.length === 0 && !loading ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
            Chưa có dữ liệu
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-[300px]" />
        )}
      </div>

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Lệnh đang mở
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-800/50">
                <tr>
                  <th className="text-left py-2 px-2">Hướng</th>
                  <th className="text-right py-2 px-2">Giá vào</th>
                  <th className="text-right py-2 px-2">Confidence</th>
                  <th className="text-left py-2 px-2">Thời gian vào</th>
                  <th className="text-left py-2 px-2">Kỳ vọng ra</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/30 hover:bg-gray-800/50 transition-colors">
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${t.side === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                        {t.side === "long" ? <ArrowUpRight className="inline w-3 h-3 mr-1" /> : <ArrowDownRight className="inline w-3 h-3 mr-1" />}
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">{t.entryPrice?.toLocaleString() ?? "-"}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "-"}</td>
                    <td className="py-2 px-2 text-gray-400">{formatTime(t.entryTimeMs)}</td>
                    <td className="py-2 px-2 text-gray-400">{formatTime(t.windowEndMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closed Trades */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800/50 rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <LayoutList className="w-4 h-4 text-gray-400" />
          Lịch sử giao dịch (50 lệnh gần nhất)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-800/50">
              <tr>
                <th className="text-left py-2 px-2">Thời gian ra</th>
                <th className="text-left py-2 px-2">Hướng</th>
                <th className="text-right py-2 px-2">Giá vào</th>
                <th className="text-right py-2 px-2">Giá ra</th>
                <th className="text-right py-2 px-2">PnL %</th>
                <th className="text-right py-2 px-2">Conf</th>
                <th className="text-left py-2 px-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {closedTrades.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <td className="py-2 px-2 text-gray-400">{t.exitTimeMs ? formatTime(t.exitTimeMs) : "-"}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${t.side === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                      {t.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">{t.entryPrice?.toLocaleString() ?? "-"}</td>
                  <td className="py-2 px-2 text-right">{t.exitPrice?.toLocaleString() ?? "-"}</td>
                  <td className={`py-2 px-2 text-right font-medium ${t.netReturn && t.netReturn >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {t.netReturn != null ? formatPct(t.netReturn) : "-"}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-400">{t.confidence ? (t.confidence * 100).toFixed(0) + "%" : "-"}</td>
                  <td className="py-2 px-2 text-gray-400 text-xs">{t.modelVersion ?? "-"}</td>
                </tr>
              ))}
              {closedTrades.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">Chưa có giao dịch nào hoàn tất</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
