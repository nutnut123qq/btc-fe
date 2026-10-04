"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Play, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import { runDiscovery, getDiscoveredRules, clearDiscoveredRules, evaluateSequenceRules } from "@/lib/api";
import { parseRuleConditions } from "@/lib/formatRuleCondition";
import { RuleConditionsDisplay } from "./RuleConditionsDisplay";
import { RuleDiscoverySummary } from "./RuleDiscoverySummary";
import { getSessionKey } from "@/lib/sessionAuth";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";
import { CapabilityStateBadge } from "./CapabilityStateBadge";
import { ruleEvidenceView } from "@/lib/evidencePresentation";

import type { CapabilityState, RuleDiscoveryRunResponse, SequenceRule } from "@/lib/types";

const QUIET_BTN =
  "inline-flex min-h-10 sm:min-h-0 items-center gap-1.5 rounded border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-850 hover:text-slate-100 disabled:opacity-50";
const QUIET_ICON_BTN =
  "inline-flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded border border-slate-800 bg-slate-900 text-slate-400 transition-colors hover:bg-slate-850 hover:text-slate-200 disabled:opacity-50";

export function DiscoveryScreen() {
  const adminUnlocked = Boolean(getSessionKey("admin"));
  const [symbol] = useState<string>(ACTIVE_SYMBOL);
  const timeframe = DEFAULT_TIMEFRAME;
  const [running, setRunning] = useState(false);
  const [rules, setRules] = useState<SequenceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RuleDiscoveryRunResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalResult, setEvalResult] = useState<{ bars?: number; signals?: Array<{ ruleName: string; message: string }> } | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDiscoveredRules({ symbol, timeframe });
      setRules(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải rules");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await runDiscovery(symbol, timeframe, 2000, 1, 0.50, 30, 0, true);
      setResult(res);
      await loadRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery thất bại");
    } finally {
      setRunning(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Xóa tất cả discovered rules?")) return;
    try {
      await clearDiscoveredRules();
      await loadRules();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xóa thất bại");
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await evaluateSequenceRules(symbol, timeframe, 50);
      setEvalResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Evaluate thất bại");
    } finally {
      setEvaluating(false);
    }
  };

  const insufficientCount = rules.filter((r) => !ruleEvidenceView(r).hasOos || r.rejectedReason).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-100">Rules nến</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Quét {symbol.replace("USDT", "/USDT")} {timeframe} — survivor experimental, không phải promotion.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => void handleRun()}
            disabled={running || !adminUnlocked}
            className={QUIET_BTN}
          >
            <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
            {running ? "Đang quét…" : "Chạy Discovery"}
          </button>
          <button
            onClick={() => setEvalOpen(true)}
            className={QUIET_BTN}
          >
            <Play className="w-3.5 h-3.5 text-slate-400" />
            Đánh giá
          </button>
          <button
            onClick={() => void loadRules()}
            disabled={loading || !adminUnlocked}
            title="Làm mới"
            aria-label="Làm mới"
            className={QUIET_ICON_BTN}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {rules.length > 0 && (
            <button
              onClick={() => void handleClear()}
              title="Xóa tất cả discovered rules"
              aria-label="Xóa tất cả discovered rules"
              className="inline-flex h-10 w-10 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded border border-rose-900/60 bg-slate-900 text-rose-300 transition-colors hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded bg-rose-950/30 px-4 py-2.5 text-xs text-rose-200 break-words whitespace-pre-wrap">{error}</div>}

      {result && (
        <div className="space-y-1 border-y border-slate-800/70 px-1 py-2.5 text-xs text-slate-400">
          <div className="font-medium text-teal-300">Discovery OOS hoàn tất · chưa phải promotion</div>
          <div>
            {result.method || "legacy/unversioned"} ·{" "}
            <span className="font-mono tabular-nums">{result.trialCount ?? "—"}/{result.candidateBudget ?? "—"}</span> trials ·{" "}
            <span className="font-mono tabular-nums">{result.rejected ?? "—"}</span> bị loại ·{" "}
            <span className="font-mono tabular-nums">{result.candidatesFound}</span> survivor experimental
          </div>
          <div>
            Selection: <span className="font-mono tabular-nums">{formatInterval(result.selectionInterval)}</span> ·
            Held-out: <span className="font-mono tabular-nums">{formatInterval(result.evaluationInterval)}</span>
          </div>
          <div>
            Label dead-zone <span className="font-mono tabular-nums">{result.labelDeadZonePct?.toFixed(2) ?? "—"}%</span> ·
            execution cost <span className="font-mono tabular-nums">{result.roundTripCostBps?.toFixed(0) ?? "—"} bps</span> round-trip ·
            survivor lưu ở trạng thái tắt
          </div>
        </div>
      )}

      {loading && rules.length === 0 && (
        <div className="border-y border-slate-800/60 px-1 py-3 text-xs text-slate-400">Đang tải rules…</div>
      )}

      {rules.length === 0 && !loading && (
        <div className="border-y border-slate-800/60 px-1 py-3 text-xs text-slate-400">
          Chưa có rule tự động nào — nhấn &quot;Chạy Discovery&quot; để quét dữ liệu lịch sử.
        </div>
      )}

      {rules.length > 0 && (
        <section aria-label="Discovered rules">
          <div className="divide-y divide-slate-800/70 border-y border-slate-800/70">
            {rules.map((rule) => (
              <DiscoveredRuleRow key={rule.id} rule={rule} />
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-slate-400">
            {rules.length} rules đã lập danh mục
            {insufficientCount > 0 && ` · ${insufficientCount} cảnh báo kiểm định`}
          </p>
        </section>
      )}

      <section className="rounded border border-slate-800/70 bg-slate-900/30">
        <button
          type="button"
          onClick={() => setEvalOpen((v) => !v)}
          aria-expanded={evalOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left sm:px-4"
        >
          <span className="min-w-0">
            <span className="text-xs font-semibold text-slate-200">Đánh giá sequence</span>
            <span className="ml-2 text-xs text-slate-400">
              Chạy rules engine trên các nến hiện tại của symbol/timeframe đã chọn
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${evalOpen ? "rotate-180" : ""}`} />
        </button>
        {evalOpen && (
          <div className="space-y-3 border-t border-slate-800/70 px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void handleEvaluate()}
                disabled={evaluating || rules.length === 0 || !adminUnlocked}
                className={QUIET_BTN}
              >
                <Play className="w-3.5 h-3.5 text-slate-400" />
                {evaluating ? "Đang chạy…" : "Thực hiện đánh giá"}
              </button>
              {evalResult && (
                <span className="font-mono text-xs tabular-nums text-slate-300">
                  {evalResult.bars != null ? `${evalResult.bars} nến · ` : ""}
                  Signals khớp: {evalResult.signals?.length ?? 0}
                </span>
              )}
            </div>
            {!evalResult && !evaluating && (
              <p className="text-xs text-slate-400">
                Đánh giá rules trên 50 nến {timeframe} gần nhất của {symbol.replace("USDT", "/USDT")} — đây là đánh giá trên dữ liệu hiện tại, không phải kiểm định trên tập hold-out.
              </p>
            )}
            {evalResult && (evalResult.signals ?? []).length > 0 && (
              <div className="divide-y divide-slate-800/60 border-y border-slate-800/60">
                {(evalResult.signals ?? []).map((s, i) => (
                  <div key={i} className="py-2">
                    <div className="text-xs font-medium text-teal-300">{s.ruleName}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{s.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DiscoveredRuleRow({ rule }: { rule: SequenceRule }) {
  const [expanded, setExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const conditions = parseRuleConditions(rule.conditionsJson);
  const evidence = ruleEvidenceView(rule);
  const capability = normalizeCapability(rule.capabilityState);
  const insufficient = !evidence.hasOos;

  const status = rule.rejectedReason
    ? { text: "bị loại", cls: "text-rose-400" }
    : insufficient
      ? { text: "thiếu mẫu", cls: "text-amber-400" }
      : { text: "khả dụng", cls: "text-slate-300" };

  const n = rule.oosSampleCount ?? rule.sampleCount;
  const winRate = finite(rule.oosWinRate) ? rule.oosWinRate : finite(rule.winRate) ? rule.winRate : null;
  const updatedAt = formatTimestamp(rule.updatedAtUtc ?? rule.createdAtUtc);

  return (
    <div className={insufficient && !rule.rejectedReason ? "bg-amber-500/[0.04]" : ""}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-900/50 sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-start gap-2">
              {insufficient && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />}
              <span className="text-sm font-medium leading-snug text-slate-100">{rule.name}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className={`text-xs ${status.cls}`}>{status.text}</span>
              <span className={`mt-0.5 block text-[11px] ${rule.isEnabled ? "text-rose-300" : "text-slate-400"}`}>
                {rule.isEnabled ? "đang phát alert" : "tắt"}
              </span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums text-slate-400">
            <span>{rule.symbol} {rule.timeframe}</span>
            <span>n={n ?? "—"}</span>
            <span>win {winRate != null ? `${(winRate * 100).toFixed(1)}%` : "—"}</span>
            {evidence.hasOos && <span>CI {evidence.ci95}</span>}
            {evidence.hasOos && <span>lift {evidence.lift}</span>}
            <span>cập nhật {updatedAt}</span>
          </div>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-800/50 px-3 py-3 text-xs text-slate-400 sm:px-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span>Cooldown <span className="font-mono tabular-nums text-slate-300">{rule.cooldownMinutes}</span> phút</span>
            <span>Cần tối thiểu <span className="font-mono tabular-nums text-slate-300">{rule.requiredBars}</span> nến trong buffer</span>
            {rule.isAutoDiscovered && <span>auto-discovered</span>}
            <span className="inline-flex items-center gap-1.5">
              Mức evidence: <CapabilityStateBadge state={capability} />
            </span>
          </div>
          {rule.rejectedReason && (
            <div className="text-rose-400">Bị loại: {rule.rejectedReason}</div>
          )}
          <RuleDiscoverySummary rule={rule} />
          <div className="space-y-1 border-t border-slate-800/50 pt-2">
            <div>Method: <span className="font-mono text-slate-300">{rule.methodVersion || "legacy/unversioned"}</span></div>
            <div>Selection: <span className="font-mono tabular-nums text-slate-300">{formatMsRange(rule.selectionStartTimeMs, rule.selectionEndTimeMs)} · n={rule.selectionSampleCount ?? "—"}</span></div>
            <div>Held-out: <span className="font-mono tabular-nums text-slate-300">{formatMsRange(rule.evaluationStartTimeMs, rule.evaluationEndTimeMs)} · n={rule.oosSampleCount ?? "—"}</span></div>
            <div>OOS win: <span className="font-mono tabular-nums text-slate-300">{evidence.oosWinRate}</span> · Wilson 95% CI <span className="font-mono tabular-nums text-slate-300">{evidence.ci95}</span></div>
            <div>Baseline: <span className="font-mono tabular-nums text-slate-300">{evidence.baselineWinRate}</span> · lift <span className="font-mono tabular-nums text-slate-300">{evidence.lift}</span></div>
            <div>Net average sau chi phí: <span className="font-mono tabular-nums text-slate-300">{evidence.netAverage}</span> · cost <span className="font-mono tabular-nums text-slate-300">{rule.roundTripCostBps?.toFixed(0) ?? "—"} bps</span></div>
            {!evidence.hasOos && <div className="text-amber-300/90">Record cũ không có held-out evidence; chỉ dùng mô tả lịch sử.</div>}
          </div>
          {conditions.length > 0 && <RuleConditionsDisplay conditions={conditions} />}
          <div>
            <button
              type="button"
              onClick={() => setShowRawJson((v) => !v)}
              className="text-xs text-slate-400 underline-offset-2 hover:text-slate-300 hover:underline"
            >
              {showRawJson ? "Ẩn JSON kỹ thuật" : "Xem JSON kỹ thuật"}
            </button>
            {showRawJson && (
              <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[10px] text-slate-400">
                {JSON.stringify(conditions, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeCapability(value?: string): CapabilityState {
  return (["descriptive", "experimental", "validated", "forward-observed", "retired"] as const).includes(value as CapabilityState)
    ? value as CapabilityState
    : "descriptive";
}

function formatTimestamp(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatInterval(interval?: { startTimeMs: number; endTimeMs: number }): string {
  return interval ? formatMsRange(interval.startTimeMs, interval.endTimeMs) : "Chưa có interval";
}

function formatMsRange(start?: number | null, end?: number | null): string {
  if (typeof start !== "number" || typeof end !== "number" || start <= 0 || end <= 0) return "Chưa có interval";
  return `${new Date(start).toLocaleDateString("vi-VN")} → ${new Date(end).toLocaleDateString("vi-VN")}`;
}
