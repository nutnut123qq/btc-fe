"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getEnsembleHistory,
  getEnsembleEvaluations,
} from "../lib/api";
import {
  EnsemblePredictionDto,
  PredictionEvaluationSummaryDto,
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
  const [showExperimental, setShowExperimental] = useState(false);
  const [ensemble, setEnsemble] = useState<EnsemblePredictionDto | null>(null);
  const [evalSummary, setEvalSummary] = useState<PredictionEvaluationSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [history, evalRes] = await Promise.all([
        getEnsembleHistory(symbol, timeframe, 50, true),
        getEnsembleEvaluations(symbol, true),
      ]);
      setEnsemble(history.find((item) => item.sourcePredictionId == null) ?? null);
      setEvalSummary(evalRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load ensemble data");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!showExperimental) return;
    void loadData();
    const interval = setInterval(() => void loadData(), 60000);
    return () => clearInterval(interval);
  }, [loadData, showExperimental]);

  if (!showExperimental) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/15 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-semibold text-amber-200">
              Ensemble challenger
              <span className="rounded border border-amber-500/50 px-2 py-0.5 text-[10px] font-bold uppercase">Experimental / Legacy</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Kết quả lịch sử chưa vượt promotion gate; chỉ mở số liệu trong phạm vi Lab.</p>
          </div>
          <button onClick={() => setShowExperimental(true)} className="rounded border border-amber-500/40 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10">
            Mở trong Lab
          </button>
        </div>
      </div>
    );
  }

  if (loading && !evalSummary) {
    return <div className="p-4 bg-gray-900 rounded shadow text-white animate-pulse">Đang tải ensemble experimental...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">
        <h3 className="font-bold mb-2">Không tải được ensemble experimental</h3>
        <p>{error}</p>
        <button onClick={loadData} className="mt-2 px-3 py-1 bg-red-800 rounded hover:bg-red-700">Retry</button>
      </div>
    );
  }

  const dirColor = ensemble?.finalDirection === "Bullish"
      ? "text-green-400 bg-green-400/10 border-green-400/30"
      : ensemble?.finalDirection === "Bearish"
      ? "text-red-400 bg-red-400/10 border-red-400/30"
      : "text-gray-300 bg-gray-400/10 border-gray-400/30";

  const layers = ensemble?.layers ?? [];

  return (
    <div className="flex flex-col gap-6">
      {ensemble ? (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span className="bg-amber-600 text-xs px-2 py-1 rounded text-white uppercase font-bold tracking-wider">Experimental</span>
              Ensemble challenger
            </h2>
            <div className="text-sm text-gray-400 mt-1">Nghiên cứu legacy cho {symbol} ({timeframe}); không phải tín hiệu production.</div>
            <div className="mt-1 text-xs text-amber-300">{ensemble.promotionReason}</div>
            <div className="mt-1 text-[11px] text-gray-500">{ensemble.validityStatus} · pipeline {ensemble.pipelineVersion} · evaluation {ensemble.evaluationVersion}</div>
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
      ) : (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-5 text-sm text-gray-400">Không có snapshot ensemble cho {symbol} ({timeframe}); bảng đánh giá legacy vẫn được giữ bên dưới.</div>
      )}

      {/* T / F / N Scoreboard & Evaluation History Table */}
      <div className="bg-gray-800 border border-teal-500/30 rounded-xl p-5 shadow-xl">
        <div className="mb-4 border-b border-gray-700 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Bảng đánh giá ensemble Experimental / Legacy (T / F / N)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Đánh giá thực nghiệm tự động: <span className="text-emerald-400 font-bold">T</span> (Đúng), <span className="text-rose-400 font-bold">F</span> (Sai), <span className="text-amber-400 font-bold">N</span> (Đang chờ 24h)
            </p>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/15 px-3 py-2 text-xs text-amber-200">
          {evalSummary?.promotionReason ?? "Ensemble chưa qua promotion gate."}
        </div>
        <div className="grid gap-4 xl:grid-cols-3 mb-6">
          <div className="rounded-lg border border-amber-500/30 bg-gray-900 p-3">
            <div className="mb-2 text-xs font-bold uppercase text-amber-300">Raw legacy · có thể chứa duplicate</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
              <div>Tổng<strong className="block text-lg text-white">{evalSummary?.totalPredictions ?? 0}</strong></div>
              <div>Đúng / Sai<strong className="block text-lg text-gray-200">{evalSummary?.trueCount ?? 0} / {evalSummary?.falseCount ?? 0}</strong></div>
              <div>Chờ<strong className="block text-lg text-amber-300">{evalSummary?.pendingCount ?? 0}</strong></div>
            </div>
            <div className="mt-2 text-center text-sm text-amber-200">Raw directional accuracy: <strong>{evalSummary?.winRatePct ?? 0}%</strong></div>
          </div>
          <div className="rounded-lg border border-indigo-500/30 bg-gray-900 p-3">
            <div className="mb-2 text-xs font-bold uppercase text-indigo-300">Canonical audit · deduplicated</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
              <div>Đã đánh giá<strong className="block text-lg text-white">{evalSummary?.canonicalEvaluatedCount ?? 0}</strong></div>
              <div>Đúng / Sai<strong className="block text-lg text-gray-200">{evalSummary?.canonicalTrueCount ?? 0} / {evalSummary?.canonicalFalseCount ?? 0}</strong></div>
              <div>Chờ<strong className="block text-lg text-amber-300">{evalSummary?.canonicalPendingCount ?? 0}</strong></div>
            </div>
            <div className="mt-2 text-center text-sm text-indigo-200">Canonical directional accuracy: <strong>{evalSummary?.canonicalWinRatePct ?? 0}%</strong></div>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-gray-900 p-3">
            <div className="mb-2 text-xs font-bold uppercase text-cyan-300">Versioned re-evaluation · Experimental · non-promotable</div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
              <div>Tổng<strong className="block text-lg text-white">{evalSummary?.reevaluatedCount ?? 0}</strong></div>
              <div>Đúng / Sai<strong className="block text-lg text-gray-200">{evalSummary?.reevaluatedTrueCount ?? 0} / {evalSummary?.reevaluatedFalseCount ?? 0}</strong></div>
              <div>Chờ<strong className="block text-lg text-amber-300">{evalSummary?.reevaluatedPendingCount ?? 0}</strong></div>
            </div>
            <div className="mt-2 text-center text-sm text-cyan-200">Re-evaluated directional accuracy: <strong>{evalSummary?.reevaluatedWinRatePct ?? 0}%</strong></div>
          </div>
        </div>

        {/* Records Table */}
        <h4 className="mb-2 text-xs font-bold uppercase text-amber-300">Raw legacy records</h4>
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
                    Chưa có bản ghi trong phạm vi Lab, hoặc các bản ghi đã được archive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h4 className="mb-2 mt-5 text-xs font-bold uppercase text-cyan-300">Versioned re-evaluation lineage</h4>
        <div className="overflow-x-auto rounded-lg border border-cyan-900/60 max-h-72">
          {evalSummary?.reevaluatedItems.length ? (
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="sticky top-0 border-b border-gray-700 bg-gray-900 text-gray-400 uppercase">
                <tr>
                  <th className="p-3">Source</th>
                  <th className="p-3">Record</th>
                  <th className="p-3">Evaluation version</th>
                  <th className="p-3">Khung</th>
                  <th className="p-3">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {evalSummary.reevaluatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 font-mono">#{item.sourcePredictionId}</td>
                    <td className="p-3 font-mono">#{item.id}</td>
                    <td className="p-3 text-cyan-300">{item.evaluationVersion}</td>
                    <td className="p-3">{item.timeframe}</td>
                    <td className="p-3">{item.evaluationStatus ?? "N"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5 text-center text-xs text-gray-500">Chưa có lineage re-evaluation v2; raw legacy vẫn được giữ nguyên và không bị ghi đè.</div>
          )}
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
