"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck, Wrench } from "lucide-react";
import { getKlineDataIssues, repairKlineDataIssue } from "@/lib/api";
import {
  previewMatchesIssue,
  type KlineDataIssue,
  type KlineDataIssuesResponse,
  type KlineDataRepairResponse,
  type RepairPreviewBinding,
} from "@/lib/dataQuality";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, type ActiveTimeframe } from "@/lib/timeframe";

function time(value: number | string | null): string {
  if (value == null) return "—";
  const parsed = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString("vi-VN") : "—";
}

function shortHash(value: string): string {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function RepairResult({ value }: { value: KlineDataRepairResponse }) {
  return <article className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-[10px]">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><strong className="text-xs text-slate-100">{value.dryRun ? "Dry-run repair plan" : value.alreadyApplied ? "Repair đã được apply trước đó" : "Repair đã apply"}</strong><span className="rounded border border-slate-700 px-2 py-1 text-slate-400">{value.sourceClassification}</span></div>
    <dl className="mt-2 grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:text-right"><dt className="text-slate-400">Boundary</dt><dd>{time(value.startOpenTimeMs)} → {time(value.endOpenTimeMs)}</dd><dt className="text-slate-400">Requested / source</dt><dd>{value.requestedBars} / {value.sourceRows}</dd><dt className="text-slate-400">Verified</dt><dd>{value.verifiedSourceBars}</dd><dt className="text-slate-400">Insert / replace / noop</dt><dd>{value.insertedBars} / {value.replacedBars} / {value.noopBars}</dd><dt className="text-slate-400">Unresolved</dt><dd>{value.unresolvedOpenTimeMs.length}</dd><dt className="text-slate-400">Derived rebuild</dt><dd>{value.derivedRebuildRequired ? "Bắt buộc" : "Không"}</dd><dt className="text-slate-400">Source checked</dt><dd>{time(value.sourceCheckedAtUtc)}</dd><dt className="text-slate-400">Audit id</dt><dd>{value.repairAuditId ?? (value.dryRun ? "dry-run" : "—")}</dd></dl>
    <div className="mt-2 min-w-0 space-y-1 rounded border border-slate-800 p-2 font-mono text-[9px] text-slate-400"><div className="break-all">plan {value.planSha256}</div><div className="break-all">source evidence {value.sourceEvidenceSha256}</div><div className="break-all">source {value.sourceEndpoint}</div></div>
    {value.affectedDownstreamArtifacts.length > 0 && <p className="mt-2 break-words text-slate-300/80">Affected downstream: {value.affectedDownstreamArtifacts.join(", ")}</p>}
    {value.limitations.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-100/70">{value.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>}
  </article>;
}

export function DataQualityAdministration() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [data, setData] = useState<KlineDataIssuesResponse | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<KlineDataIssue | null>(null);
  const [preview, setPreview] = useState<KlineDataRepairResponse | null>(null);
  const [previewBinding, setPreviewBinding] = useState<RepairPreviewBinding | null>(null);
  const [result, setResult] = useState<KlineDataRepairResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRequestRef = useRef(0);
  const repairRequestRef = useRef(0);

  const load = useCallback(async (timeframe: ActiveTimeframe) => {
    const token = ++listRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await getKlineDataIssues(timeframe, AbortSignal.timeout(10_000));
      if (token !== listRequestRef.current) return;
      setData(next);
    } catch (cause) {
      if (token !== listRequestRef.current) return;
      setData(null);
      setError(cause instanceof Error ? cause.message : "Không tải được data-quality issues.");
    } finally {
      if (token === listRequestRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(selectedTimeframe), 0);
    return () => window.clearTimeout(timer);
  }, [load, selectedTimeframe]);

  const selectTimeframe = (timeframe: ActiveTimeframe) => {
    listRequestRef.current += 1;
    repairRequestRef.current += 1;
    setSelectedTimeframe(timeframe);
    setData(null);
    setSelectedIssue(null);
    setPreview(null);
    setPreviewBinding(null);
    setResult(null);
    setError(null);
  };

  const selectIssue = (issue: KlineDataIssue) => {
    repairRequestRef.current += 1;
    setSelectedIssue(issue);
    setPreview(null);
    setPreviewBinding(null);
    setResult(null);
    setError(null);
  };

  const dryRun = async () => {
    const issue = selectedIssue;
    if (!issue?.repairable) return;
    const token = ++repairRequestRef.current;
    setRepairing(true);
    setPreview(null);
    setPreviewBinding(null);
    setResult(null);
    setError(null);
    try {
      const next = await repairKlineDataIssue({ timeframe: selectedTimeframe, issueType: issue.issueType, startOpenTimeMs: issue.startOpenTimeMs, endOpenTimeMs: issue.endOpenTimeMs, dryRun: true });
      if (token !== repairRequestRef.current) return;
      if (!next.dryRun || next.timeframe !== selectedTimeframe || next.issueType !== issue.issueType || next.startOpenTimeMs !== issue.startOpenTimeMs || next.endOpenTimeMs !== issue.endOpenTimeMs) throw new Error("Dry-run response không khớp issue đã chọn.");
      setPreview(next);
      setPreviewBinding({ requestToken: token, issueKey: issue.issueKey, timeframe: selectedTimeframe, issueType: issue.issueType, startOpenTimeMs: issue.startOpenTimeMs, endOpenTimeMs: issue.endOpenTimeMs, planSha256: next.planSha256 });
    } catch (cause) {
      if (token === repairRequestRef.current) setError(cause instanceof Error ? cause.message : "Không tạo được dry-run repair plan.");
    } finally {
      if (token === repairRequestRef.current) setRepairing(false);
    }
  };

  const apply = async () => {
    const issue = selectedIssue;
    const binding = previewBinding;
    const applicable = previewMatchesIssue(binding, issue, selectedTimeframe) && preview?.planSha256 === binding?.planSha256;
    if (!issue || !binding || !applicable) return;
    if (!window.confirm(`Apply đúng repair plan ${shortHash(binding.planSha256)} cho BTCUSDT ${selectedTimeframe}, ${time(issue.startOpenTimeMs)} → ${time(issue.endOpenTimeMs)}?`)) return;
    const token = ++repairRequestRef.current;
    setRepairing(true);
    setResult(null);
    setError(null);
    try {
      const next = await repairKlineDataIssue({ timeframe: selectedTimeframe, issueType: issue.issueType, startOpenTimeMs: issue.startOpenTimeMs, endOpenTimeMs: issue.endOpenTimeMs, dryRun: false, expectedPlanSha256: binding.planSha256 });
      if (token !== repairRequestRef.current) return;
      if (next.timeframe !== selectedTimeframe || next.issueType !== issue.issueType || next.startOpenTimeMs !== issue.startOpenTimeMs || next.endOpenTimeMs !== issue.endOpenTimeMs || next.planSha256 !== binding.planSha256) throw new Error("Apply response không khớp dry-run đã xác nhận.");
      setResult(next);
      setPreview(null);
      setPreviewBinding(null);
      await load(selectedTimeframe);
    } catch (cause) {
      if (token === repairRequestRef.current) setError(cause instanceof Error ? cause.message : "Apply repair thất bại.");
    } finally {
      if (token === repairRequestRef.current) setRepairing(false);
    }
  };

  const canApply = previewMatchesIssue(previewBinding, selectedIssue, selectedTimeframe) && preview?.planSha256 === previewBinding?.planSha256;

  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4" aria-labelledby="data-quality-admin-title">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 id="data-quality-admin-title" className="flex items-center gap-2 text-sm font-semibold text-slate-100"><ShieldCheck className="h-4 w-4 text-slate-400"/> Data quality evidence & repair</h3><p className="mt-1 text-[11px] leading-5 text-slate-400">Taxonomy có provenance cho gap/duration issue. Repair luôn bắt đầu bằng dry-run, khóa theo exact boundary + plan hash; không tự động lặp hoặc tự rebuild downstream.</p></div><div className="flex shrink-0 items-center gap-2"><select value={selectedTimeframe} onChange={(event) => selectTimeframe(event.target.value as ActiveTimeframe)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200" aria-label="Timeframe data quality">{ACTIVE_TIMEFRAMES.map((item) => <option key={item}>{item}</option>)}</select><button type="button" onClick={() => void load(selectedTimeframe)} disabled={loading} className="rounded border border-slate-700 bg-slate-950 p-2 text-slate-400 disabled:opacity-50" aria-label="Làm mới data quality issues"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/></button></div></div>
    {loading && !data && <div role="status" className="mt-3 rounded border border-slate-800 p-3 text-xs text-slate-400">Đang tải issue ledger…</div>}
    {error && <div role="alert" className="mt-3 break-words rounded border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}
    {data && <>
      <div className="mt-3 flex min-w-0 flex-wrap gap-2 text-[10px]"><span className="rounded border border-slate-800 px-2 py-1">taxonomy {data.taxonomyVersion}</span><span className="rounded border border-slate-800 px-2 py-1">audit cutoff {time(data.auditEndOpenTimeMs)}</span><span className="rounded border border-slate-800 px-2 py-1">known {data.totalKnownIssues}</span>{data.truncated && <span className="rounded border border-amber-800 px-2 py-1 text-amber-300">Danh sách bị giới hạn 200 rows</span>}</div>
      {data.issues.length === 0 ? <div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3 text-xs text-emerald-300">Không có issue được taxonomy ghi nhận trong scope này.</div> : <div className="mt-3 space-y-2">{data.issues.map((issue) => <article key={issue.issueKey} className={`min-w-0 max-w-full overflow-hidden rounded-lg border p-3 text-[10px] ${selectedIssue?.issueKey === issue.issueKey ? "border-teal-700 bg-teal-950/20" : "border-slate-800 bg-slate-950/40"}`}><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><strong className="break-all text-xs text-slate-200">{issue.issueType} · {issue.causeCode}</strong><p className="mt-1 break-all font-mono text-[9px] text-slate-400">{issue.issueKey}</p></div><span className={`rounded border px-2 py-1 ${issue.repairable ? "border-amber-800 text-amber-300" : "border-slate-700 text-slate-400"}`}>{issue.resolutionState} · {issue.repairable ? "repairable" : "audit only"}</span></div><dl className="mt-2 grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4 [&>dd]:break-words [&>dd]:text-right"><dt className="text-slate-400">Boundary</dt><dd>{time(issue.startOpenTimeMs)} → {time(issue.endOpenTimeMs)}</dd><dt className="text-slate-400">Affected bars</dt><dd>{issue.affectedBars}</dd><dt className="text-slate-400">Expected / actual duration</dt><dd>{issue.expectedDurationMs} / {issue.actualDurationMs ?? "unavailable"} ms</dd><dt className="text-slate-400">Source attempts</dt><dd>{issue.evidence.sourceAttemptCount}</dd></dl><p className="mt-2 break-words text-slate-400">Detection: {issue.evidence.detectionMethod} · source class: {issue.evidence.sourceClassification} · authoritative repair source: {issue.evidence.authoritativeRepairSource}</p>{issue.evidence.detail && <p className="mt-1 break-words text-amber-200/70">{issue.evidence.detail}</p>}<div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="break-words text-slate-400">Downstream: {issue.affectedDownstreamArtifacts.length ? issue.affectedDownstreamArtifacts.join(", ") : "none declared"}</span><button type="button" onClick={() => selectIssue(issue)} disabled={!issue.repairable || repairing} className="rounded border border-teal-800 px-2 py-1 text-teal-300 disabled:opacity-40">Chọn để dry-run</button></div></article>)}</div>}
      {data.limitations.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-[10px] text-amber-100/70">{data.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      {selectedIssue && <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3"><span className="min-w-0 flex-1 break-all text-[10px] text-slate-400">Selected {selectedIssue.issueKey}</span><button type="button" onClick={() => void dryRun()} disabled={repairing || !selectedIssue.repairable} className="inline-flex items-center gap-1 rounded border border-teal-800 bg-teal-950/30 px-3 py-1.5 text-xs text-teal-300 disabled:opacity-40"><Wrench className="h-3.5 w-3.5"/> Dry-run exact issue</button><button type="button" onClick={() => void apply()} disabled={repairing || !canApply} className="inline-flex items-center gap-1 rounded border border-rose-800 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-40"><AlertTriangle className="h-3.5 w-3.5"/> Apply plan đã xác nhận</button></div>}
      {preview && <div className="mt-3"><RepairResult value={preview}/></div>}
      {result && <div className="mt-3"><RepairResult value={result}/></div>}
      <details className="mt-3 min-w-0 rounded-lg border border-slate-800 p-3 text-[10px]"><summary className="cursor-pointer font-semibold text-slate-400">Recent repair audit ({data.recentRepairs.length})</summary>{data.recentRepairs.length === 0 ? <p className="mt-2 text-slate-400">Chưa có repair audit.</p> : <ul className="mt-2 space-y-2">{data.recentRepairs.map((row) => <li key={row.id} className="min-w-0 rounded border border-slate-800 p-2"><div className="flex min-w-0 flex-wrap justify-between gap-2"><span>{row.issueType} · {time(row.startOpenTimeMs)} → {time(row.endOpenTimeMs)}</span><span>{time(row.appliedAtUtc)}</span></div><div className="mt-1 break-all font-mono text-slate-400">plan {row.planSha256}</div><div className="mt-1 text-slate-400">verified {row.verifiedSourceBars} · insert {row.insertedBars} · replace {row.replacedBars} · noop {row.noopBars} · unresolved {row.unresolvedBars}</div></li>)}</ul>}</details>
    </>}
  </section>;
}
