"use client";

import { useCallback, useEffect, useState } from "react";
import { getConfluenceCurrent, calculateConfluence } from "../lib/api";
import type { ConfluenceSnapshotDto } from "../lib/types";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ConfluenceWidget({ symbol = "BTCUSDT" }: { symbol?: string }) {
  const [data, setData] = useState<ConfluenceSnapshotDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfluence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConfluenceCurrent(symbol);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load confluence");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  const handleRecalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await calculateConfluence(symbol);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to calculate confluence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfluence();
  }, [fetchConfluence]);

  if (error) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-red-400">
        <p>Error: {error}</p>
        <button onClick={fetchConfluence} className="mt-2 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  if (!data && loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex justify-center items-center h-[200px]">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const score = data.confluenceScore;
  let scoreColor = "text-emerald-500";
  let ringColor = "border-emerald-500";
  if (score < 45) {
    scoreColor = "text-rose-500";
    ringColor = "border-rose-500";
  } else if (score < 55) {
    scoreColor = "text-amber-500";
    ringColor = "border-amber-500";
  } else if (score <= 70) {
    scoreColor = "text-teal-500";
    ringColor = "border-teal-500";
  }

  const directionMap: Record<string, string> = {
    StrongBullish: "Tăng mạnh",
    Bullish: "Tăng",
    Neutral: "Trung lập",
    Bearish: "Giảm",
    StrongBearish: "Giảm mạnh",
  };

  const getDirectionColor = (dir: string) => {
    if (dir.includes("Bullish")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (dir.includes("Bearish")) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            Multi-Timeframe Confluence
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getDirectionColor(data.overallDirection)}`}>
              {directionMap[data.overallDirection] || data.overallDirection}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Tổng hợp tín hiệu từ đa khung thời gian ({symbol})</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Tính toán lại
        </button>
      </div>

      {data.hasConflict && (
        <div className="mb-6 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cảnh báo Xung đột (Conflict Alert)</p>
            <p className="opacity-90">{data.conflictDetails}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className={`w-32 h-32 rounded-full border-4 ${ringColor} flex flex-col items-center justify-center bg-zinc-950 shadow-inner`}>
            <span className={`text-4xl font-black ${scoreColor}`}>{Math.round(score)}</span>
            <span className="text-xs text-zinc-500 font-medium">/ 100</span>
          </div>
          <span className="mt-3 text-sm font-medium text-zinc-400">Confluence Score</span>
        </div>

        <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {data.timeframeAlignments.map((tf, i) => (
            <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-200">{tf.timeframe}</span>
                <span className="text-xs text-zinc-500 font-mono">w:{tf.weight}</span>
              </div>
              <div className={`text-sm font-semibold ${tf.direction === 'Bullish' ? 'text-emerald-400' : tf.direction === 'Bearish' ? 'text-rose-400' : 'text-zinc-400'}`}>
                {tf.direction}
              </div>
              <div className="text-xs text-zinc-400">
                Regime: <span className="text-zinc-300">{tf.regimeType || 'N/A'}</span>
              </div>
              <div className="text-xs text-zinc-400">
                Arch: <span className="text-zinc-300">{tf.archetypeCode || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
