"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, RefreshCw, ShieldAlert } from "lucide-react";
import { getTechnicalEvidenceCoverage, rebuildTechnicalEvidence } from "@/lib/api";
import { ACTIVE_TIMEFRAMES, type ActiveTimeframe } from "@/lib/timeframe";
import {
  assertTechnicalEvidenceRebuildCap,
  isTechnicalEvidencePreviewApplicable,
  TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES,
  type TechnicalEvidenceCoverage,
  type TechnicalEvidenceRebuildPreview,
  type TechnicalEvidenceRebuildResult,
} from "@/lib/technicalEvidenceAdmin";
import { LatestRequestGate } from "@/lib/technicalReplay";

const COVERAGE_READ_TIMEOUT_MS = 30_000;

function time(value: number | null): string {
  return value == null ? "—" : new Date(value).toLocaleString("vi-VN");
}

export function TechnicalEvidenceAdministration() {
  const [coverage, setCoverage] = useState<TechnicalEvidenceCoverage[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ActiveTimeframe>("4h");
  const [maxCandles, setMaxCandles] = useState(25);
  const [preview, setPreview] = useState<TechnicalEvidenceRebuildPreview | null>(null);
  const [result, setResult] = useState<TechnicalEvidenceRebuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rebuildGate = useRef(new LatestRequestGate());

  const loadCoverage = useCallback(async () => {
    setLoading(true);
    setError(null);
    const settled = await Promise.allSettled(ACTIVE_TIMEFRAMES.map((timeframe) => getTechnicalEvidenceCoverage(timeframe, AbortSignal.timeout(COVERAGE_READ_TIMEOUT_MS))));
    const available = settled.filter((item): item is PromiseFulfilledResult<TechnicalEvidenceCoverage> => item.status === "fulfilled").map((item) => item.value);
    setCoverage(available);
    if (available.length !== ACTIVE_TIMEFRAMES.length) setError(`Coverage endpoint chỉ trả ${available.length}/${ACTIVE_TIMEFRAMES.length} timeframe; phần thiếu vẫn là unavailable.`);
    setLoading(false);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void loadCoverage(), 0); return () => window.clearTimeout(timer); }, [loadCoverage]);

  const run = async (dryRun: boolean) => {
    const selectedCoverage = coverage.find((item) => item.timeframe === selectedTimeframe) ?? null;
    const applicablePreview = isTechnicalEvidencePreviewApplicable(preview, selectedTimeframe, maxCandles, selectedCoverage) ? preview : null;
    if (!dryRun) {
      if (!applicablePreview) return;
      if (!window.confirm(`Apply sparse technical evidence rebuild cho BTCUSDT ${selectedTimeframe}, tối đa ${applicablePreview.requestedMaxCandles} nến theo estimate vừa xem?`)) return;
    }
    const requestTimeframe = selectedTimeframe;
    const requestMaxCandles = dryRun ? maxCandles : applicablePreview!.requestedMaxCandles;
    const requestId = rebuildGate.current.begin();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const next = await rebuildTechnicalEvidence({ timeframe: requestTimeframe, dryRun, maxCandles: requestMaxCandles });
      if (!rebuildGate.current.isCurrent(requestId)) return;
      assertTechnicalEvidenceRebuildCap(next, requestMaxCandles);
      if (next.timeframe !== requestTimeframe || next.dryRun !== dryRun) throw new Error("Rebuild response không khớp request đã gửi.");
      if (dryRun) setPreview({ result: next, requestedMaxCandles: requestMaxCandles });
      else {
        setResult(next);
        setPreview(null);
        await loadCoverage();
      }
    } catch (cause) {
      if (rebuildGate.current.isCurrent(requestId)) setError(cause instanceof Error ? cause.message : "Không chạy được technical evidence rebuild.");
    } finally {
      if (rebuildGate.current.isCurrent(requestId)) setLoading(false);
    }
  };

  const selectedCoverage = coverage.find((item) => item.timeframe === selectedTimeframe) ?? null;
  const previewMatches = isTechnicalEvidencePreviewApplicable(preview, selectedTimeframe, maxCandles, selectedCoverage);
  const invalidatePreview = () => {
    rebuildGate.current.begin();
    setPreview(null);
    setLoading(false);
  };
  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50" aria-labelledby="technical-evidence-admin-title">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-slate-800/60 px-4 py-3"><div className="min-w-0"><h3 id="technical-evidence-admin-title" className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><Database className="h-4 w-4 shrink-0 text-slate-500"/> Sparse replay evidence administration</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Chỉ materialize envelope có event. Legacy không bị xóa/ghi đè; trạng thái không-event được dựng lại on demand.</p></div><button type="button" onClick={() => void loadCoverage()} disabled={loading} className="inline-flex min-h-10 shrink-0 items-center rounded bg-slate-950/60 px-2 text-slate-400 hover:text-slate-200 disabled:opacity-50" aria-label="Làm mới sparse evidence coverage"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/></button></div>
    {error && <div role="alert" className="mx-4 mt-3 rounded bg-rose-900/30 p-3 text-xs text-rose-300">{error}</div>}
    <div className="divide-y divide-slate-800/50">{ACTIVE_TIMEFRAMES.map((timeframe) => {
      const item = coverage.find((row) => row.timeframe === timeframe);
      return <article key={timeframe} className="min-w-0 max-w-full overflow-hidden px-4 py-2.5 text-xs"><div className="flex min-w-0 items-baseline justify-between gap-2"><strong className="shrink-0 font-mono text-[13px] text-slate-100">{timeframe}</strong><span className={`min-w-0 break-all text-right ${item ? "text-slate-300" : "text-rose-300"}`}>{item?.checkpointStatus ?? "unavailable"}</span></div>{item ? <><dl className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Coverage start</dt><dd>{time(item.coverageStartCloseTimeMs)}</dd><dt>Checkpoint</dt><dd>{time(item.lastProcessedCloseTimeMs)}</dd><dt>Historical backfill</dt><dd>{item.historicalBackfill ? "yes" : "no"}</dd><dt>Sparse records</dt><dd>{item.sparseRecordCount.toLocaleString("vi-VN")}</dd><dt>Storage</dt><dd>{item.storagePolicy}</dd></dl><details className="mt-1.5 min-w-0 max-w-full overflow-hidden text-[11px] text-slate-400"><summary className="cursor-pointer">Records by layer</summary><ul className="mt-1 divide-y divide-slate-800/40">{Object.entries(item.recordsByLayer).map(([key, count]) => <li key={key} className="flex min-w-0 justify-between gap-2 py-1"><span className="min-w-0 break-all">{key}</span><span className="shrink-0 font-mono tabular-nums">{count?.toLocaleString("vi-VN")}</span></li>)}</ul></details><div title={item.moduleContractSha256} className="mt-1.5 max-w-full truncate font-mono text-[10px] text-slate-500">{item.moduleContractVersion} · {item.moduleContractSha256}</div></> : <p className="mt-1.5 break-words text-rose-300">Không có contract-hash coverage.</p>}</article>;
    })}</div>
    <div className="min-w-0 max-w-full overflow-hidden border-t border-slate-800/60 px-4 py-3">
      <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3"><label className="text-[11px] font-medium text-slate-500">Timeframe<select value={selectedTimeframe} onChange={(event) => { invalidatePreview(); setSelectedTimeframe(event.target.value as ActiveTimeframe); }} className="mt-1 block min-h-10 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200">{ACTIVE_TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-[11px] font-medium text-slate-500">Batch cap (1–100)<input type="number" min={1} max={TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES} value={maxCandles} onChange={(event) => { invalidatePreview(); setMaxCandles(Math.max(1, Math.min(TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES, Number(event.target.value) || 1))); }} className="mt-1 block min-h-10 w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-xs tabular-nums text-slate-200"/></label><button type="button" onClick={() => void run(true)} disabled={loading} className="min-h-10 rounded bg-teal-950/30 px-3 py-2 text-xs font-semibold text-teal-300 disabled:opacity-50">1. Ước tính dry-run</button><button type="button" onClick={() => void run(false)} disabled={loading || !previewMatches} className="min-h-10 rounded bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40">2. Apply batch đã preview</button></div>
      <p className="mt-2 flex min-w-0 items-start gap-1 text-xs text-slate-500"><ShieldAlert className="h-3 w-3 shrink-0"/> <span className="min-w-0 break-words">Apply đi qua AdminGuard và chỉ được mở sau dry-run cùng timeframe/batch. UI không cung cấp thao tác xóa legacy.</span></p>
      {preview && <div className="mt-3 min-w-0 max-w-full break-words rounded-md border border-slate-800/70 p-3 text-xs text-slate-200"><strong className="font-mono tabular-nums">Dry-run estimate · {preview.result.timeframe} · cap {preview.requestedMaxCandles}</strong><dl className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(4,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:sm:block [&>dt]:text-slate-500 [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-200"><div><dt>Candidates</dt><dd>{preview.result.candidateCandles.toLocaleString("vi-VN")}</dd></div><div><dt>Sparse records</dt><dd>{preview.result.estimatedSparseRecords.toLocaleString("vi-VN")}</dd></div><div><dt>Envelope bytes</dt><dd>{preview.result.estimatedEnvelopeBytes.toLocaleString("vi-VN")}</dd></div><div><dt>Checkpoint →</dt><dd>{time(preview.result.lastProcessedCloseTimeMs)}</dd></div></dl><ul className="mt-2 list-disc break-words pl-4 text-[11px] text-amber-200/70">{preview.result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {result && <div className="mt-3 min-w-0 max-w-full break-words rounded-md border border-slate-800/70 p-3 text-xs text-slate-300">Apply {result.status}: inserted <span className="font-mono tabular-nums">{result.insertedRecords.toLocaleString("vi-VN")}</span>, existing <span className="font-mono tabular-nums">{result.existingRecords.toLocaleString("vi-VN")}</span>, checkpoint <span className="font-mono tabular-nums">{time(result.lastProcessedCloseTimeMs)}</span>.</div>}
    </div>
  </section>;
}
