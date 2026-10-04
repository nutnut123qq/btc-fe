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
import { DEFAULT_TIMEFRAME, type ActiveTimeframe } from "../lib/timeframe";
import {
  isEnsembleUnavailable,
  normalizeCapabilityState,
  resolveEvidenceFreshness,
} from "../lib/researchUi";
import { CapabilityStateBadge } from "./CapabilityStateBadge";

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
  timeframe = DEFAULT_TIMEFRAME,
}: {
  symbol?: string;
  timeframe?: ActiveTimeframe;
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
      const [historyResult, evaluationResult] = await Promise.allSettled([
        getEnsembleHistory(symbol, timeframe, 50, true),
        getEnsembleEvaluations(symbol, true),
      ]);
      if (historyResult.status === "fulfilled") {
        setEnsemble(historyResult.value.find((item) => item.sourcePredictionId == null) ?? null);
      } else {
        setEnsemble(null);
      }
      if (evaluationResult.status === "fulfilled") {
        setEvalSummary(evaluationResult.value);
      } else {
        setEvalSummary(null);
      }
      if (historyResult.status === "rejected" && evaluationResult.status === "rejected") {
        const cause = historyResult.reason;
        setError(cause instanceof Error ? cause.message : "Failed to load ensemble data");
      }
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
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.03] px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CapabilityStateBadge state="experimental" />
            <span className="text-xs font-medium text-slate-200">Ensemble challenger</span>
            <span className="hidden sm:inline text-[11px] text-slate-400">Legacy records · chưa vượt promotion gate; chỉ mở số liệu trong phạm vi Lab.</span>
          </div>
          <button onClick={() => setShowExperimental(true)} className="shrink-0 rounded px-2 py-1 text-xs font-medium text-teal-300 hover:bg-teal-500/10">
            Mở trong Lab
          </button>
        </div>
      </div>
    );
  }

  if (loading && !evalSummary) {
    return <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-xs text-slate-400 animate-pulse">Đang tải ensemble experimental…</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-900/50 bg-rose-950/40 px-3 py-2.5 text-xs text-rose-200">
        <div className="font-semibold">Không tải được ensemble experimental</div>
        <p className="mt-1">{error}</p>
        <button onClick={loadData} className="mt-2 rounded bg-rose-900/60 px-2.5 py-1 text-[11px] font-medium text-rose-100 hover:bg-rose-800">Thử lại</button>
      </div>
    );
  }

  const dirColor = ensemble?.finalDirection === "Bullish"
      ? "text-emerald-400"
      : ensemble?.finalDirection === "Bearish"
      ? "text-rose-400"
      : "text-slate-300";

  const layers = ensemble?.layers ?? [];
  const unavailable = isEnsembleUnavailable(ensemble);
  const capabilityState = normalizeCapabilityState(ensemble?.capabilityState, "experimental");
  const freshness = ensemble
    ? resolveEvidenceFreshness(ensemble.freshness, ensemble.timeMs, timeframe)
    : null;
  const scoreLabel = ensemble?.isCalibratedProbability
    ? "Xác suất đã hiệu chỉnh"
    : "Điểm đồng thuận heuristic";

  return (
    <div className="flex flex-col gap-4">
      {ensemble ? (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-200 flex flex-wrap items-center gap-2">
              <CapabilityStateBadge state={capabilityState} />
              Ensemble challenger
            </h2>
            <div className="mt-1 text-xs text-slate-400">Nghiên cứu legacy cho {symbol} ({timeframe}); không phải tín hiệu production.</div>
            <div className="mt-1 text-xs text-slate-300">{ensemble.promotionReason}</div>
            <div className="mt-1 font-mono text-[11px] text-slate-400">{ensemble.validityStatus} · pipeline {ensemble.pipelineVersion} · evaluation {ensemble.evaluationVersion}</div>
            {freshness?.status === "stale" && <div className="mt-1 text-xs font-semibold text-rose-300">Stale snapshot · không dùng làm quyết định mới</div>}
          </div>
          <div className={`text-lg font-semibold ${dirColor}`}>
            {unavailable ? <span className="text-slate-400">Không khả dụng</span> : ensemble.finalDirection}
          </div>
        </div>

        {unavailable ? (
          <div role="status" className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
            <div className="text-xs font-semibold text-amber-200">Không có kết luận ensemble khả dụng</div>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {ensemble.availabilityReason || ensemble.invalidReason || "Thiếu đầu vào thật hoặc đầu vào chưa qua evidence gate."}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-500">Không thay thế dữ liệu thiếu bằng giá, xác suất hoặc điểm mặc định.</p>
          </div>
        ) : <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400">{scoreLabel}</div>
            <div className="mt-0.5 font-mono text-xl font-semibold tabular-nums text-slate-100">
              {(ensemble.ensembleConfidence * 100).toFixed(1)}{ensemble.isCalibratedProbability ? "%" : " / 100"}
            </div>
            {ensemble.entryPrice != null && (
              <div className="font-mono text-[10px] tabular-nums text-slate-500">Giá vào snapshot: ${ensemble.entryPrice.toLocaleString()}</div>
            )}
          </div>

          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400">
              {ensemble.isCalibratedProbability ? "Xác suất xu hướng đã hiệu chỉnh" : "Điểm bình chọn theo hướng · không phải xác suất"}
            </div>
            <div className="mt-1 space-y-0.5 font-mono text-xs tabular-nums">
              <div className="flex justify-between"><span className="text-emerald-400">Tăng</span><span className="text-slate-200">{(ensemble.probUp * 100).toFixed(1)}{ensemble.isCalibratedProbability ? "%" : "/100"}</span></div>
              <div className="flex justify-between"><span className="text-rose-400">Giảm</span><span className="text-slate-200">{(ensemble.probDown * 100).toFixed(1)}{ensemble.isCalibratedProbability ? "%" : "/100"}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Đi ngang</span><span className="text-slate-200">{(ensemble.probSideways * 100).toFixed(1)}{ensemble.isCalibratedProbability ? "%" : "/100"}</span></div>
            </div>
          </div>
        </div>}
      </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-xs text-slate-400">Không có snapshot ensemble cho {symbol} ({timeframe}); bảng đánh giá legacy vẫn được giữ bên dưới.</div>
      )}

      {/* T / F / N Scoreboard & Evaluation History Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Bảng đánh giá ensemble experimental / legacy (T / F / N)</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Đánh giá thực nghiệm tự động: <span className="text-emerald-400 font-semibold">T</span> (đúng), <span className="text-rose-400 font-semibold">F</span> (sai), <span className="text-slate-400 font-semibold">N</span> (đang chờ 24h)
          </p>
        </div>

        <div className="mt-3 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-200/90">
          {evalSummary?.promotionReason ?? "Ensemble chưa qua promotion gate."}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <div className="text-[10px] font-medium text-amber-300/90">Raw legacy · có thể chứa duplicate</div>
            <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-100">{evalSummary?.winRatePct ?? 0}%</div>
            <div className="font-mono text-[10px] tabular-nums text-slate-500">
              n={evalSummary?.totalPredictions ?? 0} · đúng {evalSummary?.trueCount ?? 0} · sai {evalSummary?.falseCount ?? 0} · chờ {evalSummary?.pendingCount ?? 0}
            </div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-400">Canonical audit · deduplicated</div>
            <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-100">{evalSummary?.canonicalWinRatePct ?? 0}%</div>
            <div className="font-mono text-[10px] tabular-nums text-slate-500">
              n={evalSummary?.canonicalEvaluatedCount ?? 0} · đúng {evalSummary?.canonicalTrueCount ?? 0} · sai {evalSummary?.canonicalFalseCount ?? 0} · chờ {evalSummary?.canonicalPendingCount ?? 0}
            </div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-400">Re-evaluation versioned · non-promotable</div>
            <div className="mt-1 font-mono text-sm font-semibold tabular-nums text-slate-100">{evalSummary?.reevaluatedWinRatePct ?? 0}%</div>
            <div className="font-mono text-[10px] tabular-nums text-slate-500">
              n={evalSummary?.reevaluatedCount ?? 0} · đúng {evalSummary?.reevaluatedTrueCount ?? 0} · sai {evalSummary?.reevaluatedFalseCount ?? 0} · chờ {evalSummary?.reevaluatedPendingCount ?? 0}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <h4 className="mb-1.5 mt-4 text-xs font-semibold text-slate-400">Raw legacy records</h4>
        <div className="overflow-x-auto rounded border border-slate-800 max-h-96">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 border-b border-slate-800 bg-slate-950 text-slate-400">
              <tr>
                <th className="px-3 py-2 font-medium">Thời gian</th>
                <th className="px-3 py-2 font-medium">Khung</th>
                <th className="px-3 py-2 font-medium">Kết luận heuristic</th>
                <th className="px-3 py-2 font-medium text-right">Giá lúc báo</th>
                <th className="px-3 py-2 font-medium text-right">Giá thực tế 24h</th>
                <th className="px-3 py-2 font-medium text-right">Biến động</th>
                <th className="px-3 py-2 font-medium text-center">Kết quả (T/F/N)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {evalSummary?.items && evalSummary.items.length > 0 ? (
                evalSummary.items.map((item) => {
                  const status = item.evaluationStatus || "N";
                  const statusColor =
                    status === "T"
                      ? "text-emerald-400"
                      : status === "F"
                      ? "text-rose-400"
                      : "text-slate-400";

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-slate-400">
                        {new Date(item.timeMs).toLocaleString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-300">{item.timeframe}</td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${item.finalDirection === "Bullish" ? "text-emerald-400" : item.finalDirection === "Bearish" ? "text-rose-400" : "text-slate-300"}`}>
                          {item.finalDirection} ({(item.ensembleConfidence * 100).toFixed(0)} điểm)
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">${item.entryPrice ? item.entryPrice.toLocaleString() : "N/A"}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{item.actualPrice24h ? `$${item.actualPrice24h.toLocaleString()}` : "Đang chờ nến…"}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {item.actualReturnPct != null ? (
                          <span className={item.actualReturnPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {item.actualReturnPct >= 0 ? "+" : ""}{item.actualReturnPct.toFixed(2)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={`px-3 py-2 text-center font-medium ${statusColor}`}>
                        {status === "T" && "T · đúng"}
                        {status === "F" && "F · sai"}
                        {status === "N" && "N · chờ"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                    Chưa có bản ghi trong phạm vi Lab, hoặc các bản ghi đã được archive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h4 className="mb-1.5 mt-4 text-xs font-semibold text-slate-400">Versioned re-evaluation lineage</h4>
        <div className="overflow-x-auto rounded border border-slate-800 max-h-72">
          {evalSummary?.reevaluatedItems.length ? (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 border-b border-slate-800 bg-slate-950 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Record</th>
                  <th className="px-3 py-2 font-medium">Evaluation version</th>
                  <th className="px-3 py-2 font-medium">Khung</th>
                  <th className="px-3 py-2 font-medium">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {evalSummary.reevaluatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-mono tabular-nums">#{item.sourcePredictionId}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">#{item.id}</td>
                    <td className="px-3 py-2 text-slate-300">{item.evaluationVersion}</td>
                    <td className="px-3 py-2 font-mono">{item.timeframe}</td>
                    <td className="px-3 py-2">{item.evaluationStatus ?? "N"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-3 py-4 text-center text-xs text-slate-400">Chưa có lineage re-evaluation v2; raw legacy vẫn được giữ nguyên và không bị ghi đè.</div>
          )}
        </div>
      </div>

      {/* Layer Breakdown */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {layers.map((layer: EnsembleLayer, idx: number) => (
          <div key={idx} className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-[10px] text-slate-500">L{idx + 1}</span>
                <h3 className="truncate text-xs font-semibold text-slate-200">{layer.layerName}</h3>
              </div>
              <span className={`text-[11px] font-medium ${
                layer.direction === "Bullish" ? "text-emerald-400" :
                layer.direction === "Bearish" ? "text-rose-400" :
                "text-slate-400"
              }`}>
                {layer.direction}
              </span>
            </div>

            <p className="mt-1.5 flex-1 text-xs leading-5 text-slate-400">{layer.summary}</p>

            <div className="mt-2 flex items-center justify-between border-t border-slate-800/50 pt-2 text-[11px]">
              <span className="font-mono tabular-nums text-slate-500" title="Trọng số">W {layer.weight.toFixed(2)}</span>
              <div className="flex gap-2 font-mono tabular-nums">
                <span className="text-emerald-400/80" title="Điểm heuristic tăng">↑{(layer.probUp * 100).toFixed(0)}</span>
                <span className="text-rose-400/80" title="Điểm heuristic giảm">↓{(layer.probDown * 100).toFixed(0)}</span>
                <span className="text-slate-400/80" title="Điểm heuristic đi ngang">→{(layer.probSideways * 100).toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
