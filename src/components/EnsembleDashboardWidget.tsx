"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getEnsemblePredict,
  getEnsembleEvaluations,
  evaluateEnsemblePredictions,
  runBatchReplay,
} from "../lib/api";
import {
  EnsemblePredictionDto,
  PredictionEvaluationSummaryDto,
  BatchReplayResultDto,
} from "../lib/types";

interface EnsembleLayer {
  layerName: string;
  direction: string;
  summary: string;
  weight: number;
  probUp: number;
  probDown: number;
  probSideways: number;
}

export function EnsembleDashboardWidget({
  symbol = "BTCUSDT",
  timeframe = "1h",
}: {
  symbol?: string;
  timeframe?: string;
}) {
  const [ensemble, setEnsemble] = useState<EnsemblePredictionDto | null>(null);
  const [evalSummary, setEvalSummary] = useState<PredictionEvaluationSummaryDto | null>(null);
  const [replayResult, setReplayResult] = useState<BatchReplayResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ensRes, evalRes] = await Promise.all([
        getEnsemblePredict(symbol, timeframe),
        getEnsembleEvaluations(symbol).catch(() => null),
      ]);
      setEnsemble(ensRes);
      if (evalRes) setEvalSummary(evalRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load ensemble data");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const updatedEval = await evaluateEnsemblePredictions(symbol);
      setEvalSummary(updatedEval);
    } catch (err: unknown) {
      alert("Lỗi khi chạy đánh giá T/F/N: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setEvaluating(false);
    }
  };

  const handleRunBatchReplay = async () => {
    setReplaying(true);
    try {
      const res = await runBatchReplay(2000, 0.60, symbol, timeframe);
      setReplayResult(res);
      // Reload evaluation list after batch replay
      const updatedEval = await getEnsembleEvaluations(symbol);
      setEvalSummary(updatedEval);
    } catch (err: unknown) {
      alert("Lỗi khi chạy Historical Batch Replay: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setReplaying(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !ensemble) {
    return <div className="p-4 bg-gray-900 rounded shadow text-white animate-pulse">Loading Ensemble Master Predictor...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
        <h3 className="font-bold mb-2">Ensemble Predictor Error</h3>
        <p>{error}</p>
        <button onClick={loadData} className="mt-2 px-3 py-1 bg-red-800 rounded hover:bg-red-700">Retry</button>
      </div>
    );
  }

  if (!ensemble) return null;

  const dirColor =
    ensemble.finalDirection === "Bullish"
      ? "text-green-400 bg-green-400/10 border-green-400/30"
      : ensemble.finalDirection === "Bearish"
      ? "text-red-400 bg-red-400/10 border-red-400/30"
      : "text-gray-300 bg-gray-400/10 border-gray-400/30";

  const layers = ensemble.layers || (ensemble.layerBreakdownJson ? JSON.parse(ensemble.layerBreakdownJson) : []);

  return (
    <div className="flex flex-col gap-6">
      {/* Master Prediction Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="bg-indigo-500 text-xs px-2 py-1 rounded text-white uppercase font-bold tracking-wider">AI Master</span>
              Ensemble Predictor
            </h2>
            <div className="text-sm text-gray-400 mt-1">Dự báo đồng thuận đa tác vụ cho {symbol} ({timeframe})</div>
          </div>
          <div className={`px-4 py-2 rounded-full border ${dirColor} font-bold text-lg shadow-sm flex items-center gap-2`}>
            {ensemble.finalDirection === "Bullish" && "🚀"}
            {ensemble.finalDirection === "Bearish" && "🩸"}
            {ensemble.finalDirection === "Sideways" && "⚖️"}
            {ensemble.finalDirection}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Gauge & Probabilities */}
          <div className="flex flex-col justify-center items-center p-4 bg-gray-900 rounded-lg border border-gray-700/50 relative">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Độ Tin Cậy Tổng Thể</div>
            <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-400">
              {(ensemble.ensembleConfidence * 100).toFixed(1)}%
            </div>
            {ensemble.entryPrice && (
              <div className="text-xs text-gray-400 mt-2 font-mono">Giá vào snapshot: ${ensemble.entryPrice.toLocaleString()}</div>
            )}
          </div>

          <div className="flex flex-col justify-center p-4 bg-gray-900 rounded-lg border border-gray-700/50 gap-3">
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Xác Suất Xu Hướng</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-16 text-sm text-green-400 font-semibold">TĂNG</span>
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-green-500" style={{ width: `${ensemble.probUp * 100}%` }}></div>
                </div>
                <span className="w-12 text-right text-sm text-gray-300">{(ensemble.probUp * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-sm text-red-400 font-semibold">GIẢM</span>
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-red-500" style={{ width: `${ensemble.probDown * 100}%` }}></div>
                </div>
                <span className="w-12 text-right text-sm text-gray-300">{(ensemble.probDown * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-sm text-gray-400 font-semibold">NGANG</span>
                <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gray-500" style={{ width: `${ensemble.probSideways * 100}%` }}></div>
                </div>
                <span className="w-12 text-right text-sm text-gray-300">{(ensemble.probSideways * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Batch Replay (2,000 Out-of-Sample Tests) Controls & Epoch Cards */}
      <div className="bg-gray-800 border border-indigo-500/40 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              ⏳ Historical Batch Replay Engine (Kiểm Định Quá Khứ 2020 – 2026)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cho AI &quot;du hành thời gian&quot; về 2,000 điểm quá khứ, nghiêm ngặt không lộ dữ liệu tương lai để thử thách Win Rate thực sự.
            </p>
          </div>
          <button
            onClick={handleRunBatchReplay}
            disabled={replaying}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {replaying ? "Đang Du Hành 2,000 Mẫu..." : "🚀 Kích Hoạt Batch Replay (2,000 Mẫu)"}
          </button>
        </div>

        {/* Epoch Breakdown Cards */}
        {replayResult && replayResult.epochBreakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {replayResult.epochBreakdown.map((ep, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-700 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{ep.epochName}</div>
                  <div className="text-sm font-semibold text-gray-200 mt-0.5">{ep.periodDescription}</div>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-gray-800 pt-3">
                  <div>
                    <div className="text-xs text-gray-400">Mẫu thử: {ep.totalSamples}</div>
                    <div className="text-xs text-emerald-400">Đúng T: {ep.trueCount} | Sai F: {ep.falseCount}</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{ep.winRatePct}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* T / F / N Scoreboard & Evaluation History Table */}
      <div className="bg-gray-800 border border-teal-500/30 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏆 Bảng Theo Dõi & Đối Chiếu Thực Tế (T / F / N)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Đánh giá thực nghiệm tự động: <span className="text-emerald-400 font-bold">T</span> (Đúng), <span className="text-rose-400 font-bold">F</span> (Sai), <span className="text-amber-400 font-bold">N</span> (Đang chờ 24h)
            </p>
          </div>
          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-gray-950 font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {evaluating ? "Đang Nối Nến..." : "⚡ Đối Chiếu & Cập Nhật T/F/N"}
          </button>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-900 p-3 rounded-lg border border-gray-700/60 text-center">
            <div className="text-[11px] text-gray-400 uppercase font-semibold">Tổng Dự Báo</div>
            <div className="text-2xl font-black text-white mt-1">{evalSummary?.totalPredictions ?? 0}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg border border-emerald-500/30 text-center">
            <div className="text-[11px] text-emerald-400 uppercase font-semibold">Đúng (T)</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{evalSummary?.trueCount ?? 0}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg border border-rose-500/30 text-center">
            <div className="text-[11px] text-rose-400 uppercase font-semibold">Sai (F)</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{evalSummary?.falseCount ?? 0}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg border border-amber-500/30 text-center">
            <div className="text-[11px] text-amber-400 uppercase font-semibold">Chờ 24h (N)</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{evalSummary?.pendingCount ?? 0}</div>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg border border-teal-500/30 text-center col-span-2 sm:col-span-1">
            <div className="text-[11px] text-teal-400 uppercase font-semibold">Tỷ Lệ Thắng</div>
            <div className="text-2xl font-black text-teal-300 mt-1">{evalSummary?.winRatePct ?? 0}%</div>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-700 max-h-96">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900 text-gray-400 uppercase font-mono border-b border-gray-700 sticky top-0">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Khung</th>
                <th className="p-3">Dự Báo AI</th>
                <th className="p-3">Giá Lúc Báo</th>
                <th className="p-3">Giá Thực Tế 24h</th>
                <th className="p-3">Biến Động</th>
                <th className="p-3 text-center">Kết Quả (T/F/N)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {evalSummary?.items && evalSummary.items.length > 0 ? (
                evalSummary.items.map((item) => {
                  const status = item.evaluationStatus || "N";
                  const statusColor =
                    status === "T"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : status === "F"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40";

                  return (
                    <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                      <td className="p-3 font-mono text-gray-400">
                        {new Date(item.timeMs).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="p-3 font-semibold text-gray-300">{item.timeframe}</td>
                      <td className="p-3">
                        <span className={`font-bold ${item.finalDirection === "Bullish" ? "text-emerald-400" : item.finalDirection === "Bearish" ? "text-rose-400" : "text-gray-300"}`}>
                          {item.finalDirection} ({(item.ensembleConfidence * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="p-3 font-mono">${item.entryPrice ? item.entryPrice.toLocaleString() : "N/A"}</td>
                      <td className="p-3 font-mono">{item.actualPrice24h ? `$${item.actualPrice24h.toLocaleString()}` : "Đang chờ nến..."}</td>
                      <td className="p-3 font-mono">
                        {item.actualReturnPct != null ? (
                          <span className={item.actualReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {item.actualReturnPct >= 0 ? "+" : ""}{item.actualReturnPct.toFixed(2)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-black rounded-full border ${statusColor}`}>
                          {status === "T" && "T (ĐÚNG)"}
                          {status === "F" && "F (SAI)"}
                          {status === "N" && "N (CHỜ)"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500 italic">
                    Chưa có bản ghi dự báo nào. Hãy gọi API dự báo hoặc bấm Batch Replay để kiểm định quá khứ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Layer Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {layers.map((layer: EnsembleLayer, idx: number) => (
          <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col hover:border-gray-500 transition-colors">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-xs">L{idx + 1}</span>
                <h3 className="font-semibold text-gray-200">{layer.layerName}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                layer.direction === "Bullish" ? "bg-green-500/20 text-green-400" :
                layer.direction === "Bearish" ? "bg-red-500/20 text-red-400" :
                "bg-gray-500/20 text-gray-300"
              }`}>
                {layer.direction}
              </span>
            </div>
            
            <p className="text-sm text-gray-400 mb-4 flex-1">{layer.summary}</p>
            
            <div className="flex items-center justify-between text-xs border-t border-gray-700 pt-3">
              <span className="text-gray-500" title="Trọng số">W: {layer.weight.toFixed(2)}</span>
              <div className="flex gap-2 font-mono">
                <span className="text-green-400/80">{(layer.probUp * 100).toFixed(0)}%</span>
                <span className="text-red-400/80">{(layer.probDown * 100).toFixed(0)}%</span>
                <span className="text-gray-400/80">{(layer.probSideways * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
