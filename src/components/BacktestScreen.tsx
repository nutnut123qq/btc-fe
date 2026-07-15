"use client";

import { useEffect, useState } from "react";
import { BarChart3, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { getBacktestRuns, getBacktestRunDetail } from "@/lib/api";
import type { BacktestRunSummary, BacktestTradeItem } from "@/lib/types";

function formatPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

export function BacktestScreen() {
  const [runs, setRuns] = useState<BacktestRunSummary[]>([]);
  const [selected, setSelected] = useState<(BacktestRunSummary & { trades: BacktestTradeItem[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRuns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRuns("BTCUSDT");
      setRuns(data.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load backtests");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getBacktestRunDetail(id);
      setSelected(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load backtest detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRuns();
  }, []);

  return (
    <div className="space-y-4">
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
    </div>
  );
}
