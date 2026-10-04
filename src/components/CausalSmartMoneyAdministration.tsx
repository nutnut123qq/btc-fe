"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DatabaseZap, RefreshCw, ShieldAlert } from "lucide-react";
import { getCausalSmartMoneyCoverage, rebuildCausalSmartMoney } from "@/lib/api";
import {
  assertCausalSmartMoneyRebuildCaps,
  CAUSAL_SMC_MAX_CANDIDATE_CANDLES,
  CAUSAL_SMC_MAX_CONTEXT_CANDLES,
  CAUSAL_SMC_MAX_EVENT_MUTATIONS,
  CAUSAL_SMC_MAX_EVIDENCE_BYTES,
  isCausalSmartMoneyPreviewApplicable,
  type CausalSmartMoneyCoverage,
  type CausalSmartMoneyRebuildPreview,
  type CausalSmartMoneyRebuildResult,
} from "@/lib/causalSmartMoneyAdmin";
import { ACTIVE_TIMEFRAMES, type ActiveTimeframe } from "@/lib/timeframe";
import { LatestRequestGate } from "@/lib/technicalReplay";

const COVERAGE_READ_TIMEOUT_MS = 30_000;

function time(value: number | null): string {
  return value == null ? "—" : new Date(value).toLocaleString("vi-VN");
}

export function CausalSmartMoneyAdministration() {
  const [coverage, setCoverage] = useState<CausalSmartMoneyCoverage[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ActiveTimeframe>("4h");
  const [maxCandles, setMaxCandles] = useState(1_000);
  const [preview, setPreview] = useState<CausalSmartMoneyRebuildPreview | null>(null);
  const [result, setResult] = useState<CausalSmartMoneyRebuildResult | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverageGate = useRef(new LatestRequestGate());
  const rebuildGate = useRef(new LatestRequestGate());

  const loadCoverage = useCallback(async () => {
    const requestId = coverageGate.current.begin();
    setCoverageLoading(true);
    setError(null);
    const settled = await Promise.allSettled(
      ACTIVE_TIMEFRAMES.map((timeframe) => getCausalSmartMoneyCoverage(timeframe, AbortSignal.timeout(COVERAGE_READ_TIMEOUT_MS))),
    );
    if (!coverageGate.current.isCurrent(requestId)) return;
    const available = settled
      .filter((item): item is PromiseFulfilledResult<CausalSmartMoneyCoverage> => item.status === "fulfilled")
      .map((item) => item.value);
    setCoverage(available);
    if (available.length !== ACTIVE_TIMEFRAMES.length) {
      setError(`Causal coverage chỉ trả ${available.length}/${ACTIVE_TIMEFRAMES.length} timeframe; phần thiếu vẫn là unavailable.`);
    }
    setCoverageLoading(false);
  }, []);

  useEffect(() => {
    const coverageRequestGate = coverageGate.current;
    const rebuildRequestGate = rebuildGate.current;
    const timer = window.setTimeout(() => void loadCoverage(), 0);
    return () => {
      window.clearTimeout(timer);
      coverageRequestGate.begin();
      rebuildRequestGate.begin();
    };
  }, [loadCoverage]);

  const selectedCoverage = coverage.find((item) => item.timeframe === selectedTimeframe) ?? null;
  const previewMatches = isCausalSmartMoneyPreviewApplicable(preview, selectedTimeframe, maxCandles, selectedCoverage);

  const invalidatePreview = () => {
    rebuildGate.current.begin();
    setPreview(null);
    setResult(null);
    setRebuildLoading(false);
  };

  const run = async (dryRun: boolean) => {
    const applicablePreview = isCausalSmartMoneyPreviewApplicable(preview, selectedTimeframe, maxCandles, selectedCoverage)
      ? preview
      : null;
    if (!dryRun) {
      if (!applicablePreview) return;
      if (!window.confirm(`Apply causal SMC rebuild cho BTCUSDT ${selectedTimeframe}, tối đa ${applicablePreview.requestedMaxCandles} nến theo đúng dry-run vừa xem?`)) return;
    }

    const requestTimeframe = selectedTimeframe;
    const requestMaxCandles = dryRun ? maxCandles : applicablePreview!.requestedMaxCandles;
    const requestId = rebuildGate.current.begin();
    setRebuildLoading(true);
    setError(null);
    setResult(null);
    try {
      const next = await rebuildCausalSmartMoney({ timeframe: requestTimeframe, dryRun, maxCandles: requestMaxCandles });
      if (!rebuildGate.current.isCurrent(requestId)) return;
      assertCausalSmartMoneyRebuildCaps(next, requestMaxCandles);
      if (next.timeframe !== requestTimeframe || next.dryRun !== dryRun) {
        throw new Error("Causal rebuild response không khớp request đã gửi.");
      }
      if (dryRun) {
        setPreview({ result: next, requestedMaxCandles: requestMaxCandles });
      } else {
        setResult(next);
        setPreview(null);
        await loadCoverage();
      }
    } catch (cause) {
      if (rebuildGate.current.isCurrent(requestId)) {
        setError(cause instanceof Error ? cause.message : "Không chạy được causal SMC rebuild.");
      }
    } finally {
      if (rebuildGate.current.isCurrent(requestId)) setRebuildLoading(false);
    }
  };

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50" aria-labelledby="causal-smc-admin-title">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-slate-800/60 px-4 py-3">
        <div className="min-w-0">
          <h3 id="causal-smc-admin-title" className="flex items-center gap-2 text-[13px] font-semibold text-slate-200">
            <DatabaseZap className="h-4 w-4 shrink-0 text-slate-500" /> Causal SMC ledger administration
          </h3>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">Ledger SMC lịch sử dùng nến đã chốt và reset state tại gap/invalid-duration. Event count là coverage mô tả, không phải xác suất hay tín hiệu giao dịch.</p>
        </div>
        <button type="button" onClick={() => void loadCoverage()} disabled={coverageLoading} className="inline-flex min-h-10 shrink-0 items-center rounded bg-slate-950/60 px-2 text-slate-400 hover:text-slate-200 disabled:opacity-50" aria-label="Làm mới causal SMC coverage">
          <RefreshCw className={`h-4 w-4 ${coverageLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <div role="alert" className="mx-4 mt-3 max-w-full break-words rounded bg-rose-900/30 p-3 text-xs text-rose-300 [overflow-wrap:anywhere]">{error}</div>}

      <div className="divide-y divide-slate-800/50">
        {ACTIVE_TIMEFRAMES.map((timeframe) => {
          const item = coverage.find((row) => row.timeframe === timeframe);
          return (
            <article key={timeframe} className="min-w-0 max-w-full overflow-hidden px-4 py-2.5 text-xs">
              <div className="flex min-w-0 items-baseline justify-between gap-2"><strong className="shrink-0 font-mono text-[13px] text-slate-100">{timeframe}</strong><span className={`min-w-0 break-all text-right ${item ? "text-slate-300" : "text-rose-300"}`}>{item?.checkpointStatus ?? "unavailable"}</span></div>
              {item ? <>
                <dl className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300">
                  <dt>Coverage start</dt><dd>{time(item.coverageStartOpenTimeMs)}</dd>
                  <dt>Checkpoint</dt><dd>{time(item.lastProcessedOpenTimeMs)}</dd>
                  <dt>Latest segment</dt><dd>{time(item.latestSegmentStartOpenTimeMs)}</dd>
                  <dt>Processed candles</dt><dd>{item.processedCandleCount.toLocaleString("vi-VN")}</dd>
                  <dt>Persisted events</dt><dd>{item.persistedEventCount.toLocaleString("vi-VN")}</dd>
                  <dt>Materialized checkpoint</dt><dd>{item.materializedEventCount.toLocaleString("vi-VN")}</dd>
                  <dt>Invalid duration</dt><dd className={item.invalidDurationRows > 0 ? "text-rose-300" : undefined}>{item.invalidDurationRows.toLocaleString("vi-VN")}</dd>
                  <dt>Historical gaps</dt><dd>{item.historicalPendingGapRanges.toLocaleString("vi-VN")}</dd>
                  <dt>Unavailable gaps</dt><dd>{item.unavailableGapRanges.toLocaleString("vi-VN")}</dd>
                  <dt>Trailing gaps</dt><dd>{item.trailingNotYetFinalizedGapRanges.toLocaleString("vi-VN")}</dd>
                </dl>
                <details className="mt-1.5 min-w-0 max-w-full overflow-hidden text-[11px] text-slate-400"><summary className="cursor-pointer">Persisted event types ({Object.keys(item.eventsByType).length})</summary><ul className="mt-1 divide-y divide-slate-800/40">{Object.entries(item.eventsByType).map(([key, value]) => <li key={key} className="flex min-w-0 justify-between gap-2 py-1"><span className="min-w-0 break-all">{key}</span><span className="shrink-0 font-mono tabular-nums">{value.toLocaleString("vi-VN")}</span></li>)}</ul></details>
                <div className="mt-1.5 max-w-full break-all font-mono text-[10px] text-slate-500">{item.calculationVersion}</div>
                <div className="mt-1 max-w-full break-words text-[11px] text-slate-500">Legacy: {item.legacyStorageStatus}</div>
              </> : <p className="mt-1.5 break-words text-rose-300">Không có causal coverage contract cho khung này.</p>}
            </article>
          );
        })}
      </div>

      <div className="min-w-0 max-w-full overflow-hidden border-t border-slate-800/60 px-4 py-3">
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span>Candidate cap <b className="font-mono tabular-nums text-slate-300">{CAUSAL_SMC_MAX_CANDIDATE_CANDLES.toLocaleString("vi-VN")}</b></span>
          <span>Context cap <b className="font-mono tabular-nums text-slate-300">{CAUSAL_SMC_MAX_CONTEXT_CANDLES.toLocaleString("vi-VN")}</b></span>
          <span>Event mutation cap <b className="font-mono tabular-nums text-slate-300">{CAUSAL_SMC_MAX_EVENT_MUTATIONS.toLocaleString("vi-VN")}</b></span>
          <span>Evidence cap <b className="font-mono tabular-nums text-slate-300">{(CAUSAL_SMC_MAX_EVIDENCE_BYTES / 1024 / 1024).toLocaleString("vi-VN")} MiB</b></span>
        </div>
        <div className="mt-3 flex min-w-0 max-w-full flex-wrap items-end gap-3">
          <label className="text-[11px] font-medium text-slate-500">Timeframe<select value={selectedTimeframe} onChange={(event) => { invalidatePreview(); setSelectedTimeframe(event.target.value as ActiveTimeframe); }} className="mt-1 block min-h-10 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200">{ACTIVE_TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-[11px] font-medium text-slate-500">Batch cap (1–5.000)<input type="number" min={1} max={CAUSAL_SMC_MAX_CANDIDATE_CANDLES} value={maxCandles} onChange={(event) => { invalidatePreview(); setMaxCandles(Math.max(1, Math.min(CAUSAL_SMC_MAX_CANDIDATE_CANDLES, Number(event.target.value) || 1))); }} className="mt-1 block min-h-10 w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-xs tabular-nums text-slate-200" /></label>
          <button type="button" onClick={() => void run(true)} disabled={rebuildLoading} className="min-h-10 rounded bg-teal-950/30 px-3 py-2 text-xs font-semibold text-teal-300 disabled:opacity-50">1. Ước tính dry-run</button>
          <button type="button" onClick={() => void run(false)} disabled={rebuildLoading || !previewMatches} className="min-h-10 rounded bg-slate-800/40 px-3 py-2 text-xs font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-40">2. Apply batch đã preview</button>
        </div>
        <p className="mt-2 flex min-w-0 items-start gap-1 text-xs text-slate-500"><ShieldAlert className="h-3 w-3 shrink-0" /><span className="min-w-0 break-words">Apply đi qua AdminGuard, cần xác nhận và chỉ mở sau dry-run cùng timeframe, cap, calculation version và checkpoint. Mỗi lần bấm chỉ chạy một batch; UI không tự lặp.</span></p>

        {preview && <div className="mt-3 min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800/70 p-3 text-xs text-slate-100">
          <strong className="break-words font-mono tabular-nums">Dry-run · {preview.result.timeframe} · cap {preview.requestedMaxCandles.toLocaleString("vi-VN")}</strong>
          <dl className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(4,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:sm:block [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-200">
            <div><dt>Candidates</dt><dd>{preview.result.candidateCandles.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Valid / invalid</dt><dd>{preview.result.validCandidateCandles.toLocaleString("vi-VN")} / {preview.result.invalidDurationCandles.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Context</dt><dd>{preview.result.contextCandles.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Segments</dt><dd>{preview.result.contiguousSegments.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Estimated events</dt><dd>{preview.result.estimatedEvents.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Evidence bytes</dt><dd>{preview.result.estimatedEvidenceBytes.toLocaleString("vi-VN")}</dd></div>
            <div><dt>Batch start</dt><dd>{time(preview.result.batchStartOpenTimeMs)}</dd></div>
            <div><dt>Checkpoint →</dt><dd>{time(preview.result.lastProcessedOpenTimeMs)}</dd></div>
          </dl>
          <details className="mt-3 min-w-0 max-w-full text-[11px]"><summary className="cursor-pointer text-slate-300">Gap boundaries ({preview.result.gapBoundaries.length})</summary>{preview.result.gapBoundaries.length === 0 ? <p className="mt-2 text-slate-400">Không có boundary trong batch.</p> : <ul className="mt-2 divide-y divide-slate-800/40">{preview.result.gapBoundaries.map((gap, index) => <li key={`${gap.boundaryType}-${gap.invalidOpenTimeMs ?? gap.nextOpenTimeMs ?? index}`} className="min-w-0 max-w-full break-words py-1.5 [overflow-wrap:anywhere]">{gap.boundaryType} · ledger {gap.ledgerStatus} · missing {gap.missingBars.toLocaleString("vi-VN")} · prev {time(gap.previousOpenTimeMs)} · next {time(gap.nextOpenTimeMs)} · invalid {time(gap.invalidOpenTimeMs)}</li>)}</ul>}</details>
          <ul className="mt-3 list-disc space-y-1 break-words pl-4 text-[11px] text-amber-200/70">{preview.result.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>}

        {result && <div className="mt-3 min-w-0 max-w-full break-words rounded-md border border-slate-800/70 p-3 text-xs text-slate-300 [overflow-wrap:anywhere]">Apply {result.status}: inserted <span className="font-mono tabular-nums">{result.insertedEvents.toLocaleString("vi-VN")}</span>, updated <span className="font-mono tabular-nums">{result.updatedEvents.toLocaleString("vi-VN")}</span>, existing <span className="font-mono tabular-nums">{result.existingEvents.toLocaleString("vi-VN")}</span>; checkpoint <span className="font-mono tabular-nums">{time(result.lastProcessedOpenTimeMs)}</span>.</div>}
      </div>
    </section>
  );
}
