"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Play, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { runDiscovery, getDiscoveredRules, clearDiscoveredRules, evaluateSequenceRules } from "@/lib/api";
import { parseRuleConditions } from "@/lib/formatRuleCondition";
import { RuleConditionsDisplay } from "./RuleConditionsDisplay";
import { RuleDiscoverySummary } from "./RuleDiscoverySummary";
import { getSessionKey } from "@/lib/sessionAuth";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";
import { ACTIVE_SYMBOL, ACTIVE_SYMBOL_LABEL } from "@/lib/marketScope";
import { CapabilityStateBadge } from "./CapabilityStateBadge";
import { ruleEvidenceView } from "@/lib/evidencePresentation";

import type { CapabilityState, RuleDiscoveryRunResponse, SequenceRule } from "@/lib/types";

const SYMBOL_OPTIONS = [
  { value: ACTIVE_SYMBOL, label: ACTIVE_SYMBOL_LABEL },
];

export function DiscoveryScreen() {
  const adminUnlocked = Boolean(getSessionKey("admin"));
  const [symbol, setSymbol] = useState<string>(ACTIVE_SYMBOL);
  const timeframe = DEFAULT_TIMEFRAME;
  const [running, setRunning] = useState(false);
  const [rules, setRules] = useState<SequenceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RuleDiscoveryRunResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{ signals?: Array<{ ruleName: string; message: string }> } | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="text-teal-400" />
            Rule Discovery
          </h2>
          <p className="hidden sm:block truncate text-xs text-slate-400">Quét {symbol.replace("USDT", "/USDT")} {timeframe} — survivor experimental, không phải promotion.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => void handleEvaluate()}
            disabled={evaluating || rules.length === 0 || !adminUnlocked}
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {evaluating ? "Đang chạy…" : "Evaluate"}
          </button>
          <button
            onClick={() => void loadRules()}
            disabled={loading || !adminUnlocked}
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={() => void handleRun()}
            disabled={running || !adminUnlocked}
            className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {running ? "Đang quét…" : "Chạy Discovery"}
          </button>
          {rules.length > 0 && (
            <button
              onClick={() => void handleClear()}
              className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 "
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-rose-400 text-xs break-words whitespace-pre-wrap">{error}</div>}

      {result && (
        <div className="bg-slate-900/60 rounded-xl border border-teal-900/40 p-5 text-xs space-y-1">
          <div className="text-teal-400 font-medium">Discovery OOS hoàn tất · chưa phải promotion</div>
          <div className="text-slate-400">
            {result.method || "legacy/unversioned"} · {result.trialCount ?? "—"}/{result.candidateBudget ?? "—"} trials · {result.rejected ?? "—"} bị loại · {result.candidatesFound} survivor experimental
          </div>
          <div className="text-slate-400">
            Selection: {formatInterval(result.selectionInterval)} · Held-out: {formatInterval(result.evaluationInterval)}
          </div>
          <div className="text-slate-400">
            Label dead-zone {result.labelDeadZonePct?.toFixed(2) ?? "—"}% · execution cost {result.roundTripCostBps?.toFixed(0) ?? "—"} bps round-trip · survivor lưu ở trạng thái tắt
          </div>
        </div>
      )}

      {evalResult && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 text-xs space-y-2">
          <div className="text-emerald-400 font-medium">Evaluate hiện tại</div>
          <div className="text-slate-400">Signals khớp: {evalResult.signals?.length ?? 0}</div>
          {(evalResult.signals ?? []).map((s: { ruleName: string; message: string }, i: number) => (
            <div key={i} className="bg-slate-950 rounded-lg p-2 ">
              <div className="text-teal-400 font-medium">{s.ruleName}</div>
              <div className="text-slate-400">{s.message}</div>
            </div>
          ))}
        </div>
      )}

      {rules.length === 0 && !loading && (
        <div className="rounded bg-slate-800/40 px-4 py-2.5 text-xs text-slate-400">
          Chưa có rule tự động nào — nhấn &quot;Chạy Discovery&quot; để quét dữ liệu lịch sử.
        </div>
      )}

      <div className="space-y-4">
        {rules.map((rule) => (
          <DiscoveredRuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function DiscoveredRuleCard({ rule }: { rule: SequenceRule }) {
  const [expanded, setExpanded] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const conditions = parseRuleConditions(rule.conditionsJson);
  const evidence = ruleEvidenceView(rule);
  const capability = normalizeCapability(rule.capabilityState);

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-200">{rule.name}</span>
          <span className="text-xs text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded ">
            {rule.symbol} {rule.timeframe}
          </span>
          {rule.isAutoDiscovered && (
            <span className="text-xs text-teal-500/90 bg-teal-950/30 px-1.5 py-0.5 rounded ">
              Auto
            </span>
          )}
          <CapabilityStateBadge state={capability} />
          <span className={`text-xs rounded px-1.5 py-0.5 ${rule.isEnabled ? "bg-rose-500/15 text-rose-300" : "bg-slate-800/60 text-slate-400"}`}>
            {rule.isEnabled ? "Đang phát alert" : "Tắt · không phát alert"}
          </span>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="p-1 text-slate-400 hover:text-slate-300">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <div className="mt-2">
        <RuleDiscoverySummary rule={rule} />
      </div>
      {conditions.length > 0 && !expanded && (
        <div className="mt-2">
          <RuleConditionsDisplay conditions={conditions} compact />
        </div>
      )}
      {expanded && (
        <div className="mt-3 space-y-4 text-xs text-slate-400">
          <div className="flex flex-wrap gap-3 text-slate-400">
            <span>Cooldown: {rule.cooldownMinutes} phút</span>
            <span>·</span>
            <span>Cần tối thiểu {rule.requiredBars} nến trong buffer</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3 space-y-1">
            <div>Method: <span className="text-slate-300">{rule.methodVersion || "legacy/unversioned"}</span></div>
            <div>Selection: <span className="text-slate-300">{formatMsRange(rule.selectionStartTimeMs, rule.selectionEndTimeMs)} · n={rule.selectionSampleCount ?? "—"}</span></div>
            <div>Held-out: <span className="text-slate-300">{formatMsRange(rule.evaluationStartTimeMs, rule.evaluationEndTimeMs)} · n={rule.oosSampleCount ?? "—"}</span></div>
            <div>OOS win: <span className="text-slate-300">{evidence.oosWinRate}</span> · Wilson 95% CI <span className="text-slate-300">{evidence.ci95}</span></div>
            <div>Baseline: <span className="text-slate-300">{evidence.baselineWinRate}</span> · lift <span className="text-slate-300">{evidence.lift}</span></div>
            <div>Net average sau chi phí: <span className="text-slate-300">{evidence.netAverage}</span> · cost {rule.roundTripCostBps?.toFixed(0) ?? "—"} bps</div>
            {!evidence.hasOos && <div className="text-slate-300">Record cũ không có held-out evidence; chỉ dùng mô tả lịch sử.</div>}
          </div>
          <RuleConditionsDisplay conditions={conditions} />
          <button
            type="button"
            onClick={() => setShowRawJson((v) => !v)}
            className="text-xs text-slate-400 hover:text-slate-400 underline-offset-2 hover:underline"
          >
            {showRawJson ? "Ẩn JSON kỹ thuật" : "Xem JSON kỹ thuật"}
          </button>
          {showRawJson && (
            <pre className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 overflow-x-auto">
              {JSON.stringify(conditions, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeCapability(value?: string): CapabilityState {
  return (["descriptive", "experimental", "validated", "forward-observed", "retired"] as const).includes(value as CapabilityState)
    ? value as CapabilityState
    : "descriptive";
}

function formatInterval(interval?: { startTimeMs: number; endTimeMs: number }): string {
  return interval ? formatMsRange(interval.startTimeMs, interval.endTimeMs) : "Chưa có interval";
}

function formatMsRange(start?: number | null, end?: number | null): string {
  if (typeof start !== "number" || typeof end !== "number" || start <= 0 || end <= 0) return "Chưa có interval";
  return `${new Date(start).toLocaleDateString()} → ${new Date(end).toLocaleDateString()}`;
}
