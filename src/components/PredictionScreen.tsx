"use client";

import { useCallback, useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock, Lock } from "lucide-react";
import { getLatestPrediction, getPredictionHistory, getAvailableModels, auditPredictions, getPredictionAccuracy } from "@/lib/api";
import type { PredictionResult, ModelPredictionItem, AvailableModel, PredictionAccuracySummaryDto } from "@/lib/types";
import { WINDOW_SIZES } from "@/lib/types";
import { EnsembleDashboardWidget } from "./EnsembleDashboardWidget";
import { getSessionKey } from "@/lib/sessionAuth";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, type ActiveTimeframe } from "@/lib/timeframe";
import { ACTIVE_SYMBOL, ACTIVE_SYMBOL_LABEL } from "@/lib/marketScope";
import { GlossaryTerm } from "./GlossaryTerm";

const SYMBOL_OPTIONS = [
  { value: ACTIVE_SYMBOL, label: ACTIVE_SYMBOL_LABEL },
];
const HORIZON_OPTIONS = ["1h", "4h", "1d"];

function labelText(label: number) {
  if (label === 1) return "Tăng";
  if (label === -1) return "Giảm";
  return "Đi ngang";
}

function labelColor(label: number) {
  if (label === 1) return "text-emerald-400";
  if (label === -1) return "text-rose-400";
  return "text-slate-400";
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

/** Machine reason code from an API error envelope, e.g. MODEL_ARTIFACT_INCOMPATIBLE. */
function extractReasonCode(message: string) {
  return message.match(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/)?.[0] ?? null;
}

/** Three-label probabilities as plain mono text; the predicted bucket is emphasized. */
function Probabilities({
  down,
  sideways,
  up,
  label,
  className = "text-sm",
}: {
  down: number;
  sideways: number;
  up: number;
  label: number;
  className?: string;
}) {
  return (
    <span className={`font-mono tabular-nums tracking-tight ${className}`}>
      <span className={label === -1 ? "text-rose-300 font-semibold" : "text-slate-400"}>P↓{down.toFixed(2)}</span>{" "}
      <span className={label === 0 ? "text-slate-200 font-semibold" : "text-slate-400"}>P→{sideways.toFixed(2)}</span>{" "}
      <span className={label === 1 ? "text-emerald-300 font-semibold" : "text-slate-400"}>P↑{up.toFixed(2)}</span>
    </span>
  );
}

function auditStatus(item: ModelPredictionItem) {
  if (item.isCorrect === true) return <span className="text-emerald-400">Đúng</span>;
  if (item.isCorrect === false) return <span className="text-rose-400">Sai</span>;
  return <span className="text-slate-400">Chờ</span>;
}

function validityBadge(item: ModelPredictionItem) {
  if (item.validityStatus === "Valid") {
    return <span className="text-slate-400"><GlossaryTerm term={item.validityStatus}>Valid</GlossaryTerm></span>;
  }
  const tone = item.validityStatus === "Invalid" ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>
      <GlossaryTerm term={item.validityStatus}>{item.validityStatus}</GlossaryTerm>
    </span>
  );
}

/** Non-Valid rows stay visibly honest: legacy = amber tint, invalid = rose tint. */
function rowTint(item: ModelPredictionItem) {
  if (item.validityStatus === "Invalid") return "bg-rose-500/[0.03]";
  if (item.validityStatus === "Legacy") return "bg-amber-500/[0.03]";
  return "";
}

export function PredictionScreen() {
  const adminUnlocked = Boolean(getSessionKey("admin"));
  const [symbol, setSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [timeframe, setTimeframe] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [windowSize, setWindowSize] = useState(5);
  const [horizon, setHorizon] = useState("4h");
  const [modelName, setModelName] = useState("");
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<ModelPredictionItem[]>([]);
  const [accuracy, setAccuracy] = useState<PredictionAccuracySummaryDto | null>(null);
  const [includeLegacy, setIncludeLegacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState("");
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  const loadModels = async () => {
    try {
      const data = await getAvailableModels();
      setModels(data.models ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setModelsLoaded(true);
    }
  };

  const runPrediction = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getLatestPrediction({
        symbol,
        timeframe,
        windowSize,
        horizon,
        modelName: modelName || undefined,
      });
      setPrediction(result);
      await loadHistory();
      await loadAccuracy();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally {
      setLastAttemptAt(Date.now());
      setLoading(false);
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      const data = await getPredictionHistory(symbol, timeframe, 50, includeLegacy);
      setHistory(data.items ?? []);
    } catch (e) {
      console.error(e);
    }
  }, [symbol, timeframe, includeLegacy]);

  const loadAccuracy = useCallback(async () => {
    try {
      const data = await getPredictionAccuracy(symbol, timeframe, includeLegacy);
      setAccuracy(data);
    } catch (e) {
      setAccuracy(null);
      setError(e instanceof Error ? e.message : "Không tải được prediction evaluation");
    }
  }, [symbol, timeframe, includeLegacy]);

  const handleAudit = async () => {
    setAuditing(true);
    try {
      await auditPredictions(symbol, timeframe, includeLegacy);
      await loadHistory();
      await loadAccuracy();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setAuditing(false);
    }
  };

  useEffect(() => {
    void loadModels();
  }, []);

  useEffect(() => {
    void loadHistory();
    void loadAccuracy();
  }, [loadHistory, loadAccuracy]);

  const compatibleModels = models.filter((model) =>
    model.symbol === symbol
    && model.timeframe === timeframe
    && model.window_size === windowSize
    && model.horizon === horizon
  );
  const availableModelNames = Array.from(new Set(compatibleModels.map((m) => m.model_name))).filter(Boolean);
  const canPredict = compatibleModels.some((model) => !modelName || model.model_name === modelName || model.file === modelName);
  const modelUnavailable = modelsLoaded && !canPredict;
  const reasonCode = error ? extractReasonCode(error) : null;

  const selectClass = "rounded border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-teal-500 focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Dự đoán
          </h2>
          <p className="hidden sm:block truncate text-xs text-slate-400">Dự đoán ML 3 nhãn (giảm/đi ngang/tăng) theo nến đóng; model có thể bị <GlossaryTerm term="quarantine">quarantine</GlossaryTerm>.</p>
        </div>
        <span className="shrink-0 font-mono text-xs text-teal-300 tabular-nums">{symbol.replace("USDT", "/USDT")} · {timeframe}</span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Controls strip — sau quarantine panel trên mobile, trước trên desktop */}
        <div className="order-2 md:order-1 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Cặp coin
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={`${selectClass} font-mono text-teal-300`}>
              {SYMBOL_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Khung
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value as ActiveTimeframe)} className={`${selectClass} font-mono`}>
              {ACTIVE_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Window
            <select value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))} className={`${selectClass} font-mono`}>
              {WINDOW_SIZES.map((ws) => (
                <option key={ws} value={ws}>{ws}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Horizon
            <select value={horizon} onChange={(e) => setHorizon(e.target.value)} className={`${selectClass} font-mono`}>
              {HORIZON_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            Model
            <select value={modelName} onChange={(e) => setModelName(e.target.value)} className={selectClass}>
              <option value="">Auto (best)</option>
              {availableModelNames.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => void runPrediction()}
            disabled={loading || !canPredict}
            className="ml-auto flex items-center gap-1.5 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Đang dự đoán…" : "Dự đoán"}
          </button>
        </div>

        {/* PRIMARY: availability / result block — đứng đầu trên mobile */}
        <div className="order-1 md:order-2 space-y-3">
          {modelUnavailable ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Model không khả dụng
                  </span>
                  {reasonCode && (
                    <span className="font-mono text-[11px] text-amber-300">{reasonCode}</span>
                  )}
                </div>
                {lastAttemptAt != null && (
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">
                    Lần thử gần nhất: <span className="text-slate-200">{formatTime(lastAttemptAt)}</span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                {error || (
                  <>Chưa có model tương thích đã qua <GlossaryTerm term="promotion-gate">promotion gate</GlossaryTerm> cho {symbol} · {timeframe} · window {windowSize} · horizon {horizon}. Pipeline dự đoán đang bị <GlossaryTerm term="quarantine">quarantine</GlossaryTerm> an toàn để tránh suy luận sai lệch; không có tín hiệu thay thế được tạo.</>
                )}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  disabled
                  className="flex cursor-not-allowed items-center gap-1.5 rounded border border-slate-700 bg-slate-800/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Dự đoán lại
                </button>
                <span className="text-[11px] text-slate-500">Retry chỉ mở khi có model đã qua promotion gate cho cấu hình hiện tại.</span>
              </div>
            </div>
          ) : prediction ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {prediction.prediction.label === 1
                    ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                    : prediction.prediction.label === -1
                    ? <TrendingDown className="w-5 h-5 text-rose-400" />
                    : <Minus className="w-5 h-5 text-slate-400" />}
                  <span className={`text-lg font-semibold ${labelColor(prediction.prediction.label)}`}>
                    {labelText(prediction.prediction.label)}
                  </span>
                  <span className="text-xs text-slate-400">
                    <GlossaryTerm term="confidence">Confidence</GlossaryTerm> <span className="font-mono tabular-nums text-slate-200">{(prediction.prediction.confidence * 100).toFixed(1)}%</span>
                  </span>
                </div>
                <Probabilities
                  down={prediction.prediction.prob_down}
                  sideways={prediction.prediction.prob_sideways}
                  up={prediction.prediction.prob_up}
                  label={prediction.prediction.label}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800/60 pt-2 font-mono text-[11px] tabular-nums text-slate-400">
                <span>model <span className="text-teal-300">{prediction.prediction.model_version}</span></span>
                <span>window {formatTime(prediction.windowStartMs)} → {formatTime(prediction.windowEndMs)}</span>
                <span><GlossaryTerm term="inference">inference</GlossaryTerm> {prediction.prediction.inference_ms.toFixed(1)} ms</span>
                <span><GlossaryTerm term="pipeline">pipeline</GlossaryTerm> {prediction.prediction.pipelineVersion}</span>
                <span><GlossaryTerm term="evaluation">evaluation</GlossaryTerm> {prediction.prediction.evaluationVersion}</span>
                <span className={prediction.prediction.validityStatus === "Valid" ? "text-slate-300" : "text-amber-300"}>
                  <GlossaryTerm term={prediction.prediction.validityStatus}>{prediction.prediction.validityStatus}</GlossaryTerm>
                </span>
              </div>
            </div>
          ) : !error && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-xs text-slate-400">
              Chọn cấu hình rồi bấm &ldquo;Dự đoán&rdquo; để chạy inference trên nến đóng gần nhất.
            </div>
          )}

          {error && canPredict && (
            <div className="rounded bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Historical evaluation strip — secondary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-200 flex flex-wrap items-center gap-2">
              <GlossaryTerm term="prediction-evaluation">Prediction evaluation</GlossaryTerm> ({timeframe})
              <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300"><GlossaryTerm term="experimental">experimental</GlossaryTerm> / <GlossaryTerm term="legacy">legacy</GlossaryTerm></span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Raw giữ nguyên bằng chứng lịch sử; canonical loại duplicate và bản ghi lỗi cấu trúc. Cả hai chưa phải <GlossaryTerm term="promotion-evidence">promotion evidence</GlossaryTerm>.
            </p>
          </div>
          <button
            onClick={() => void handleAudit()}
            disabled={auditing || !adminUnlocked}
            className="flex items-center gap-1.5 rounded bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${auditing ? "animate-spin" : ""}`} />
            {auditing ? "Đang audit…" : "Chạy audit kiểm định nến"}
          </button>
        </div>

        <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-200/90">
          {accuracy?.promotionReason ?? <GlossaryTerm term="promotion-gate">Prediction evaluation chưa qua promotion gate.</GlossaryTerm>}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400"><GlossaryTerm term="raw-legacy">Raw legacy</GlossaryTerm> · <GlossaryTerm term="directional-accuracy">accuracy</GlossaryTerm></div>
            <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-100">{accuracy?.winRatePct ?? 0}%</div>
            <div className="font-mono text-[10px] tabular-nums text-slate-500">n={accuracy?.evaluatedCount ?? 0}/{accuracy?.totalPredictions ?? 0}</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400">Raw đúng / sai / chờ</div>
            <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-200">{accuracy?.trueCount ?? 0} / {accuracy?.falseCount ?? 0} / {accuracy?.pendingCount ?? 0}</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400"><GlossaryTerm term="canonical-audit">Canonical</GlossaryTerm> · <GlossaryTerm term="directional-accuracy">accuracy</GlossaryTerm></div>
            <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-100">{accuracy?.canonicalWinRatePct ?? 0}%</div>
            <div className="font-mono text-[10px] tabular-nums text-slate-500">n={accuracy?.canonicalEvaluatedCount ?? 0}/{accuracy?.canonicalPredictionCount ?? 0}</div>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] text-slate-400">Canonical đúng / sai / chờ</div>
            <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-200">{accuracy?.canonicalTrueCount ?? 0} / {accuracy?.canonicalFalseCount ?? 0} / {(accuracy?.canonicalPredictionCount ?? 0) - (accuracy?.canonicalEvaluatedCount ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* Prediction history — flat rows */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Lịch sử dự đoán
            {history.length > 0 && <span className="font-mono text-[10px] font-normal text-slate-500">({history.length} phiên gần nhất)</span>}
          </h3>
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <input type="checkbox" checked={includeLegacy} onChange={(event) => setIncludeLegacy(event.target.checked)} className="accent-teal-500" />
            Lab: hiện Legacy/Invalid
          </label>
        </div>

        {history.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-slate-400">
            {includeLegacy ? "Chưa có dự đoán nào" : "Không có dự đoán Valid. Bật bộ lọc Lab để xem Legacy/Invalid."}
          </div>
        ) : (
          <>
            {/* Desktop: flat table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-slate-400">
                    <th className="px-3 py-2 font-medium">Thời điểm nến</th>
                    <th className="px-2 py-2 font-medium">Khung</th>
                    <th className="px-3 py-2 font-medium">Nhãn</th>
                    <th className="px-3 py-2 font-medium"><GlossaryTerm term="model-probability">Xác suất</GlossaryTerm></th>
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Kết quả / <GlossaryTerm term="validity">trạng thái</GlossaryTerm></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-800/30 ${rowTint(item)}`}>
                      <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-slate-300">{formatTime(item.windowEndMs)}</td>
                      <td className="px-2 py-2 font-mono text-slate-400">{item.timeframe}</td>
                      <td className={`px-3 py-2 font-medium ${labelColor(item.predictedLabel)}`}>{labelText(item.predictedLabel)}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <Probabilities down={item.probDown} sideways={item.probSideways} up={item.probUp} label={item.predictedLabel} className="text-[11px]" />
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                        {item.modelVersion}
                        <div className="text-[10px] text-slate-500">{item.pipelineVersion} · {item.evaluationVersion}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {auditStatus(item)}
                          {validityBadge(item)}
                        </div>
                        {item.invalidReason && <div className="mt-0.5 max-w-56 text-[10px] text-rose-300">{item.invalidReason}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked flat rows */}
            <div className="divide-y divide-slate-800/60 md:hidden">
              {history.map((item) => (
                <div key={item.id} className={`space-y-1.5 px-3 py-2.5 ${rowTint(item)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="font-mono text-[11px] tabular-nums text-slate-200">{formatTime(item.windowEndMs)}</span>
                      <span className="font-mono text-[10px] text-slate-500">{item.timeframe}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
                      <span className={`font-medium ${labelColor(item.predictedLabel)}`}>{labelText(item.predictedLabel)}</span>
                      <span className="text-slate-500">·</span>
                      {auditStatus(item)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/50 pt-1.5">
                    <Probabilities down={item.probDown} sideways={item.probSideways} up={item.probUp} label={item.predictedLabel} className="text-[10px]" />
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                      <span className="max-w-28 truncate">{item.modelVersion}</span>
                      {validityBadge(item)}
                    </div>
                  </div>
                  {item.invalidReason && <div className="text-[10px] text-rose-300">{item.invalidReason}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ensemble challenger — secondary, experimental */}
      <EnsembleDashboardWidget symbol={symbol} timeframe={timeframe} />
    </div>
  );
}
