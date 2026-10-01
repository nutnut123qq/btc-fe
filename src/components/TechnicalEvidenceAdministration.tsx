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
  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 p-4" aria-labelledby="technical-evidence-admin-title">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 id="technical-evidence-admin-title" className="flex items-center gap-2 text-sm font-semibold text-gray-100"><Database className="h-4 w-4 shrink-0 text-cyan-400"/> Sparse replay evidence administration</h3><p className="mt-1 text-[11px] leading-5 text-gray-500">Chỉ materialize envelope có event. Legacy không bị xóa/ghi đè; trạng thái không-event được dựng lại on demand.</p></div><button type="button" onClick={() => void loadCoverage()} disabled={loading} className="shrink-0 rounded border border-gray-700 bg-gray-950 p-2 text-gray-400 hover:text-gray-200 disabled:opacity-50" aria-label="Làm mới sparse evidence coverage"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/></button></div>
    {error && <div role="alert" className="mt-3 rounded border border-amber-900 bg-amber-950/30 p-3 text-xs text-amber-200">{error}</div>}
    <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">{ACTIVE_TIMEFRAMES.map((timeframe) => {
      const item = coverage.find((row) => row.timeframe === timeframe);
      return <article key={timeframe} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-xs"><div className="flex min-w-0 items-start justify-between gap-2"><strong className="shrink-0">{timeframe}</strong><span className={`min-w-0 break-all text-right ${item ? "text-cyan-300" : "text-rose-300"}`}>{item?.checkpointStatus ?? "unavailable"}</span></div>{item ? <><dl className="mt-2 grid min-w-0 grid-cols-2 gap-1 text-[11px] [&>dd]:min-w-0 [&>dd]:break-words"><dt className="text-gray-500">Coverage start</dt><dd className="text-right">{time(item.coverageStartCloseTimeMs)}</dd><dt className="text-gray-500">Checkpoint</dt><dd className="text-right">{time(item.lastProcessedCloseTimeMs)}</dd><dt className="text-gray-500">Historical backfill</dt><dd className="text-right">{item.historicalBackfill ? "yes" : "no"}</dd><dt className="text-gray-500">Sparse records</dt><dd className="text-right">{item.sparseRecordCount.toLocaleString("vi-VN")}</dd><dt className="text-gray-500">Storage</dt><dd className="text-right">{item.storagePolicy}</dd></dl><details className="mt-2 min-w-0 max-w-full overflow-hidden text-[10px] text-gray-500"><summary className="cursor-pointer">Records by layer</summary><ul className="mt-1">{Object.entries(item.recordsByLayer).map(([key, count]) => <li key={key} className="flex min-w-0 justify-between gap-2"><span className="min-w-0 break-all">{key}</span><span className="shrink-0">{count?.toLocaleString("vi-VN")}</span></li>)}</ul></details><div title={item.moduleContractSha256} className="mt-2 max-w-full truncate font-mono text-[9px] text-gray-600">{item.moduleContractVersion} · {item.moduleContractSha256}</div></> : <p className="mt-2 break-words text-rose-300">Không có contract-hash coverage.</p>}</article>;
    })}</div>
    <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950/60 p-3">
      <div className="flex min-w-0 max-w-full flex-wrap items-end gap-3"><label className="text-[10px] uppercase tracking-wide text-gray-500">Timeframe<select value={selectedTimeframe} onChange={(event) => { invalidatePreview(); setSelectedTimeframe(event.target.value as ActiveTimeframe); }} className="mt-1 block rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-200">{ACTIVE_TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label className="text-[10px] uppercase tracking-wide text-gray-500">Batch cap (1–100)<input type="number" min={1} max={TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES} value={maxCandles} onChange={(event) => { invalidatePreview(); setMaxCandles(Math.max(1, Math.min(TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES, Number(event.target.value) || 1))); }} className="mt-1 block w-24 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs text-gray-200"/></label><button type="button" onClick={() => void run(true)} disabled={loading} className="rounded border border-cyan-800 bg-cyan-950/30 px-3 py-2 text-xs font-semibold text-cyan-300 disabled:opacity-50">1. Ước tính dry-run</button><button type="button" onClick={() => void run(false)} disabled={loading || !previewMatches} className="rounded border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs font-semibold text-amber-300 disabled:cursor-not-allowed disabled:opacity-40">2. Apply batch đã preview</button></div>
      <p className="mt-2 flex min-w-0 items-start gap-1 text-[10px] text-gray-500"><ShieldAlert className="h-3 w-3 shrink-0"/> <span className="min-w-0 break-words">Apply đi qua AdminGuard và chỉ được mở sau dry-run cùng timeframe/batch. UI không cung cấp thao tác xóa legacy.</span></p>
      {preview && <div className="mt-3 min-w-0 max-w-full break-words rounded border border-cyan-900 bg-cyan-950/20 p-3 text-xs text-cyan-100"><strong>Dry-run estimate · {preview.result.timeframe} · cap {preview.requestedMaxCandles}</strong><div className="mt-2 grid min-w-0 grid-cols-2 gap-1 sm:grid-cols-4"><span>Candidates <b>{preview.result.candidateCandles}</b></span><span>Sparse records <b>{preview.result.estimatedSparseRecords}</b></span><span>Envelope bytes <b>{preview.result.estimatedEnvelopeBytes.toLocaleString("vi-VN")}</b></span><span>Checkpoint → <b>{time(preview.result.lastProcessedCloseTimeMs)}</b></span></div><ul className="mt-2 list-disc break-words pl-4 text-[10px] text-cyan-200/70">{preview.result.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {result && <div className="mt-3 min-w-0 max-w-full break-words rounded border border-emerald-900 bg-emerald-950/20 p-3 text-xs text-emerald-200">Apply {result.status}: inserted {result.insertedRecords.toLocaleString("vi-VN")}, existing {result.existingRecords.toLocaleString("vi-VN")}, checkpoint {time(result.lastProcessedCloseTimeMs)}.</div>}
    </div>
  </section>;
}
