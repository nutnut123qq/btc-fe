"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { BarChart3, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { getBacktestRuns, getBacktestRunDetail, runEnsembleBacktest, optimizeEnsembleWeights } from "@/lib/api";
import type { BacktestRunSummary, BacktestTradeItem, WeightOptimizationResultDto, EquityCurvePoint } from "@/lib/types";
import { createChart, LineSeries, ColorType, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";

function formatPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

const SYMBOL_OPTIONS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

export function BacktestScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [activeTab, setActiveTab] = useState<"ml" | "ensemble">("ml");
  const [runs, setRuns] = useState<BacktestRunSummary[]>([]);
  const [selected, setSelected] = useState<(BacktestRunSummary & { trades: BacktestTradeItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ensTimeframe, setEnsTimeframe] = useState("1h");
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

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRuns(selectedSymbol);
      setRuns(data.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load backtests");
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRunDetail(id);
      setSelected(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load backtest detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, [loadRuns, selectedSymbol]);

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
        layout: { background: { type: ColorType.Solid, color: "#111827" }, textColor: '#9ca3af' },
        grid: { vertLines: { color: 'rgba(31, 41, 55, 0.3)' }, horzLines: { color: 'rgba(31, 41, 55, 0.3)' } },
        width: container.clientWidth,
        height: 300,
      });
      const ls = chart.addSeries(LineSeries, { color: '#2dd4bf', lineWidth: 2 });
      
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <span className="text-xs font-semibold text-gray-400 px-2">Cặp coin:</span>
          {SYMBOL_OPTIONS.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSymbol === sym
                  ? "bg-teal-500 text-gray-950 shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {sym.replace("USDT", "/USDT")}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("ml")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "ml" ? "bg-teal-500/20 text-teal-400 border border-teal-500/40 font-bold" : "bg-gray-900 border border-gray-800 text-gray-400"}`}
          >
            Single Model Backtests
          </button>
          <button
            onClick={() => setActiveTab("ensemble")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "ensemble" ? "bg-teal-500/20 text-teal-400 border border-teal-500/40 font-bold" : "bg-gray-900 border border-gray-800 text-gray-400"}`}
          >
            Master Ensemble
          </button>
        </div>
      </div>

      {activeTab === "ml" && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-400" />
          Backtest chiến lược ML
        </h2>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr>
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">Model</th>
                <th className="text-left py-2 px-2">TF</th>
                <th className="text-left py-2 px-2">Horizon</th>
                <th className="text-right py-2 px-2">Trades</th>
                <th className="text-right py-2 px-2">Win rate</th>
                <th className="text-right py-2 px-2">Return</th>
                <th className="text-right py-2 px-2">Buy&Hold</th>
                <th className="text-right py-2 px-2">Max DD</th>
                <th className="text-right py-2 px-2">Sharpe</th>
                <th className="text-left py-2 px-2">Ngày chạy</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => void loadDetail(r.id)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                >
                  <td className="py-2 px-2 text-gray-400">{r.id}</td>
                  <td className="py-2 px-2">{r.modelName}</td>
                  <td className="py-2 px-2">{r.timeframe}</td>
                  <td className="py-2 px-2">{r.horizon}</td>
                  <td className="py-2 px-2 text-right">{r.totalTrades}</td>
                  <td className="py-2 px-2 text-right">{(r.winRate * 100).toFixed(1)}%</td>
                  <td className={`py-2 px-2 text-right font-medium ${r.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPct(r.totalReturnPct)}
                  </td>
                  <td className={`py-2 px-2 text-right ${r.buyHoldReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatPct(r.buyHoldReturnPct)}
                  </td>
                  <td className="py-2 px-2 text-right text-rose-400">{r.maxDrawdownPct.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-right">{r.sharpeRatio.toFixed(2)}</td>
                  <td className="py-2 px-2 text-gray-400">{new Date(r.createdAtUtc).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
              {runs.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="py-4 text-center text-gray-500">Chưa có backtest nào. Chạy script `ai/backtest_strategy.py` để tạo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Chi tiết backtest #{selected.id} — {selected.modelName}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Total return</div>
              <div className={`text-xl font-bold ${selected.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatPct(selected.totalReturnPct)}
              </div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Win rate</div>
              <div className="text-xl font-bold">{(selected.winRate * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Max drawdown</div>
              <div className="text-xl font-bold text-rose-400">{selected.maxDrawdownPct.toFixed(1)}%</div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Sharpe</div>
              <div className="text-xl font-bold">{selected.sharpeRatio.toFixed(2)}</div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 border-b border-gray-800 sticky top-0 bg-gray-900">
                <tr>
                  <th className="text-left py-2 px-2">Entry</th>
                  <th className="text-left py-2 px-2">Exit</th>
                  <th className="text-left py-2 px-2">Side</th>
                  <th className="text-right py-2 px-2">Entry price</th>
                  <th className="text-right py-2 px-2">Exit price</th>
                  <th className="text-right py-2 px-2">PnL</th>
                  <th className="text-right py-2 px-2">Conf</th>
                </tr>
              </thead>
              <tbody>
                {selected.trades.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50">
                    <td className="py-2 px-2">{formatTime(t.entryTimeMs)}</td>
                    <td className="py-2 px-2">{formatTime(t.exitTimeMs)}</td>
                    <td className={`py-2 px-2 font-medium ${t.side === "long" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.side === "long" ? <ArrowUpRight className="inline w-4 h-4" /> : <ArrowDownRight className="inline w-4 h-4" />}
                      {t.side}
                    </td>
                    <td className="py-2 px-2 text-right">{t.entryPrice.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right">{t.exitPrice.toLocaleString()}</td>
                    <td className={`py-2 px-2 text-right font-medium ${t.pnlPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {formatPct(t.pnlPct)}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-400">{(t.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>)}

      {activeTab === "ensemble" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Cấu hình Ensemble Backtest
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Timeframe</label>
                <select value={ensTimeframe} onChange={e => setEnsTimeframe(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-md px-3 py-1.5 text-sm">
                  <option value="15m">15m</option>
                  <option value="30m">30m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min Conf</label>
                <input type="number" step="0.01" value={ensMinConf} onChange={e => setEnsMinConf(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-md px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fee Bps</label>
                <input type="number" value={ensFee} onChange={e => setEnsFee(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-md px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Capital</label>
                <input type="number" value={ensCapital} onChange={e => setEnsCapital(Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-md px-3 py-1.5 text-sm" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => void runEnsBacktest()}
                disabled={ensLoading}
                className="px-4 py-2 bg-teal-500/20 text-teal-400 border border-teal-500/40 rounded-lg text-sm font-medium hover:bg-teal-500/30 disabled:opacity-50"
              >
                {ensLoading ? "Running..." : "Run Ensemble Backtest"}
              </button>
              <button
                onClick={() => void handleOptimize()}
                disabled={ensLoading}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
              >
                Optimize Weights
              </button>
            </div>

            {ensError && <div className="mt-4 text-sm text-rose-400">{ensError}</div>}
          </div>

          {optResult && (
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4">
              <h3 className="text-md font-semibold text-amber-400 mb-3">Kết quả Optimize Weights</h3>
              <p className="text-sm text-gray-300 mb-2">Đã test {optResult.testedCombinationsCount} tổ hợp trọng số.</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {Object.entries(optResult.bestWeights).map(([k, v]) => (
                  <div key={k} className="bg-gray-900 border border-gray-800 p-2 rounded text-center">
                    <div className="text-[10px] text-gray-400 uppercase">{k}</div>
                    <div className="font-bold text-teal-400">{v.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 text-sm">
                <div>Return: <span className="text-emerald-400 font-bold">{formatPct(optResult.totalReturnPct)}</span></div>
                <div>Win Rate: <span className="font-bold">{(optResult.winRate * 100).toFixed(1)}%</span></div>
                <div>Sharpe: <span className="font-bold">{optResult.sharpeRatio.toFixed(2)}</span></div>
              </div>
            </div>
          )}

          {ensResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Total Return</div>
                  <div className={`text-xl font-bold ${ensResult.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatPct(ensResult.totalReturnPct)}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Win Rate</div>
                  <div className="text-xl font-bold">{(ensResult.winRate * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Sharpe Ratio</div>
                  <div className="text-xl font-bold">{ensResult.sharpeRatio.toFixed(2)}</div>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Max DD</div>
                  <div className="text-xl font-bold text-rose-400">{ensResult.maxDrawdownPct.toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-4 text-gray-300">Equity Curve</h3>
                <div ref={chartContainerRef} className="w-full h-[300px]" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
