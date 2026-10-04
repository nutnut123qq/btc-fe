"use client";

import { useState } from "react";
import type {
  EvidenceProfileDimension,
  EvidenceProfileMetricSummary,
  EvidenceProfileRetention,
  TechnicalEvidenceProfiles,
} from "@/lib/evidenceProfiles";

function percent(value: number | null): string {
  return value == null ? "không có mẫu" : `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: 4 })}%`;
}

function time(value: number | null): string {
  return value == null ? "—" : new Date(value).toLocaleString("vi-VN");
}

function MetricSummary({ name, value }: { name: string; value: EvidenceProfileMetricSummary }) {
  return <div className="min-w-0 border-t border-slate-800/50 pt-2 text-xs"><strong className="break-words text-slate-300">{name}</strong><dl className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 [&>dt]:py-0.5 [&>dt]:text-slate-500 [&>dd]:py-0.5 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>n</dt><dd>{value.count.toLocaleString("vi-VN")}</dd><dt>Mean</dt><dd>{percent(value.mean)}</dd><dt>Median</dt><dd>{percent(value.median)}</dd><dt>Min / max</dt><dd>{percent(value.minimum)} / {percent(value.maximum)}</dd></dl></div>;
}

function RetentionList({ value }: { value: EvidenceProfileRetention }) {
  const rows = [
    ...Object.entries(value.eventTypes).map(([id, row]) => ({ id, kind: "event", ...row })),
    ...Object.entries(value.sensitivityVariants).map(([id, row]) => ({ id, kind: "variant", ...row })),
  ].sort((left, right) => left.id.localeCompare(right.id));
  return <details className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800/70 p-3"><summary className="cursor-pointer text-xs font-semibold text-slate-300">Negative/no-sample retention ({rows.length})</summary><p className="mt-2 break-words text-[11px] leading-4 text-slate-400">{value.rule}. Không lọc threshold, dấu kết quả hay cỡ mẫu.</p>{rows.length === 0 ? <p className="mt-2 text-[11px] text-slate-300">Không có event type/variant được khai báo trong scope này; empty state vẫn được giữ.</p> : <ul className="mt-2 divide-y divide-slate-800/50">{rows.map((row) => <li key={`${row.kind}-${row.id}`} className="min-w-0 max-w-full py-2 text-[11px] [overflow-wrap:anywhere]"><div className="flex min-w-0 flex-wrap justify-between gap-1"><span className="min-w-0 break-all font-mono text-slate-400">{row.id}</span><span className="text-slate-300">{row.retentionClassification}</span></div><div className="mt-1 font-mono tabular-nums text-slate-400">eligible {row.eligible.toLocaleString("vi-VN")} · realized {row.realizedAtMaxHorizon.toLocaleString("vi-VN")} · mean max horizon {percent(row.meanForwardReturnAtMaxHorizon)}</div></li>)}</ul>}</details>;
}

export function EvidenceProfilesPanel({ profiles }: { profiles: TechnicalEvidenceProfiles }) {
  const [moduleKey, setModuleKey] = useState("all");
  const [dimension, setDimension] = useState<EvidenceProfileDimension>("yearUtc");
  const [groupKey, setGroupKey] = useState("");
  const moduleProfile = moduleKey === "all" ? null : profiles.byModule[moduleKey] ?? null;
  const currentBreakdowns = moduleProfile?.breakdowns ?? profiles.breakdowns;
  const groups = currentBreakdowns[dimension];
  const groupOptions = Object.keys(groups);
  const selectedGroupKey = groupOptions.includes(groupKey) ? groupKey : groupOptions[0] ?? null;
  const selectedGroup = selectedGroupKey == null ? null : groups[selectedGroupKey];
  const coverage = moduleProfile ? moduleProfile.coverageAndMissingness : profiles.coverageAndMissingness;
  const retention = moduleProfile?.negativeResultRetention ?? profiles.negativeResultRetention;

  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50 p-4" aria-labelledby="evidence-profiles-title">
    <div className="min-w-0"><h3 id="evidence-profiles-title" className="text-[13px] font-semibold text-slate-200">Machine-readable technical evidence profiles</h3><p className="mt-0.5 break-words text-xs leading-5 text-slate-500">Các chiều year/timeframe/regime được khai báo trước outcome. UI không xếp hạng, chọn winner, đặt minimum-sample filter hay chỉ giữ kết quả dương.</p></div>
    <div className="mt-3 flex min-w-0 max-w-full flex-wrap gap-3">
      <label className="min-w-0 text-[11px] font-medium text-slate-500">Module<select value={moduleKey} onChange={(event) => { setModuleKey(event.target.value); setGroupKey(""); }} className="mt-1 block min-h-10 max-w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs normal-case text-slate-200"><option value="all">Tất cả module</option>{Object.keys(profiles.byModule).map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
      <label className="min-w-0 text-[11px] font-medium text-slate-500">Chiều lọc<select value={dimension} onChange={(event) => { setDimension(event.target.value as EvidenceProfileDimension); setGroupKey(""); }} className="mt-1 block min-h-10 max-w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs normal-case text-slate-200"><option value="yearUtc">Năm UTC</option><option value="timeframe">Timeframe</option><option value="regime">Regime</option></select></label>
      <label className="min-w-0 text-[11px] font-medium text-slate-500">Nhóm<select value={selectedGroupKey ?? ""} onChange={(event) => setGroupKey(event.target.value)} disabled={groupOptions.length === 0} className="mt-1 block min-h-10 max-w-[16rem] rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs normal-case text-slate-200 disabled:opacity-50">{groupOptions.length === 0 ? <option value="">Không có mẫu</option> : groupOptions.map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
    </div>

    {!selectedGroup ? <div className="mt-3 rounded-md border border-slate-800/70 p-3 text-xs text-slate-300">Scope này không có sample. Empty result được giữ nguyên, không bị ẩn khỏi hồ sơ.</div> : <>
      <dl className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(4,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:border-b [&>div]:border-slate-800/50 [&>div]:py-1.5 [&>div]:sm:block [&>div]:sm:border-b-0 [&>div]:sm:border-l [&>div]:sm:border-slate-800/60 [&>div]:sm:pl-3 [&>dt]:text-slate-500 [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-200"><div><dt>Stored</dt><dd>{selectedGroup.stored.toLocaleString("vi-VN")}</dd></div><div><dt>Eligible</dt><dd>{selectedGroup.eligible.toLocaleString("vi-VN")}</dd></div><div><dt>Excluded</dt><dd>{selectedGroup.excluded.toLocaleString("vi-VN")}</dd></div><div><dt>Exclusion types</dt><dd>{Object.keys(selectedGroup.exclusionReasons).length.toLocaleString("vi-VN")}</dd></div></dl>
      {Object.keys(selectedGroup.exclusionReasons).length > 0 && <div className="mt-2 flex min-w-0 flex-wrap gap-1">{Object.entries(selectedGroup.exclusionReasons).map(([key, value]) => <span key={key} className="max-w-full break-all rounded bg-slate-800/40 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-400">{key}: {value.toLocaleString("vi-VN")}</span>)}</div>}
      <div className="mt-3 divide-y divide-slate-800/50 border-t border-slate-800/60">{Object.entries(selectedGroup.horizons).sort(([left], [right]) => Number(left) - Number(right)).map(([horizon, value]) => <article key={horizon} className="min-w-0 max-w-full overflow-hidden py-2.5"><div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-xs"><strong className="text-[13px] text-slate-200">Horizon {horizon} bars</strong><span className="font-mono tabular-nums text-slate-400">eligible {value.eligible.toLocaleString("vi-VN")} · realized {value.realized.toLocaleString("vi-VN")} · unrealized {value.unrealized.toLocaleString("vi-VN")}</span></div><p className="mt-1 text-xs text-slate-400">Forward return: <span className="font-mono tabular-nums">{value.nonPositiveForwardReturnCount.toLocaleString("vi-VN")}</span> non-positive · <span className="font-mono tabular-nums">{value.positiveForwardReturnCount.toLocaleString("vi-VN")}</span> positive. Đây là thống kê mô tả, không phải tỷ lệ thắng.</p><div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-3"><MetricSummary name="Forward return" value={value.metrics.forwardReturn}/><MetricSummary name="MFE" value={value.metrics.mfe}/><MetricSummary name="MAE" value={value.metrics.mae}/></div></article>)}</div>
    </>}

    <div className="mt-3 grid min-w-0 gap-3 border-t border-slate-800/60 pt-3 lg:grid-cols-2">
      <article className="min-w-0 max-w-full overflow-hidden text-xs"><strong className="text-xs text-slate-300">Coverage & missingness</strong>{coverage ? <><dl className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Candles</dt><dd>{coverage.candles.rows.toLocaleString("vi-VN")}</dd><dt>Range</dt><dd>{time(coverage.candles.firstOpenTimeMs)} → {time(coverage.candles.lastOpenTimeMs)}</dd><dt>Gaps / missing bars</dt><dd>{coverage.candles.gapCount.toLocaleString("vi-VN")} / {coverage.candles.estimatedMissingBars.toLocaleString("vi-VN")}</dd><dt>Irregular / segments</dt><dd>{coverage.candles.irregularSpacingCount.toLocaleString("vi-VN")} / {coverage.candles.segmentCount.toLocaleString("vi-VN")}</dd><dt>Event rows</dt><dd>{coverage.events.rows.toLocaleString("vi-VN")}</dd><dt>Missing decision/context</dt><dd>{coverage.events.withoutDecisionTime.toLocaleString("vi-VN")} / {coverage.events.withoutUsableContext.toLocaleString("vi-VN")}</dd><dt>Unknown lineage</dt><dd>{coverage.events.withoutKnownLineage.toLocaleString("vi-VN")}</dd><dt>Unmatched controls</dt><dd>{coverage.events.unmatchedHistoricalControls.toLocaleString("vi-VN")}</dd></dl><div className="mt-2 flex flex-wrap gap-1">{Object.entries(coverage.events.horizonMissingness).map(([key, value]) => <span key={key} className="rounded bg-slate-800/40 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-400">h{key} missing {value.toLocaleString("vi-VN")}</span>)}</div></> : <p className="mt-2 text-slate-300">Module này chưa công bố coverage/missingness; UI không dùng coverage tổng để thay thế.</p>}</article>
      <article className="min-w-0 max-w-full overflow-hidden text-xs"><strong className="text-xs text-slate-300">Overlap, dependence & confluence</strong><p className="mt-1.5 break-words leading-4 text-slate-400">{profiles.overlapAndDependence.limitation}</p><dl className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Eligible decision closes</dt><dd>{profiles.overlapAndDependence.eligibleDecisionCloses.toLocaleString("vi-VN")}</dd><dt>Confluence rows</dt><dd>{profiles.overlapAndDependence.confluence.eligibleRows.toLocaleString("vi-VN")}</dd><dt>Confluence &lt;2 base modules</dt><dd>{profiles.overlapAndDependence.confluence.rowsWithFewerThanTwoBaseModules.toLocaleString("vi-VN")}</dd><dt>Independence claimed</dt><dd>no</dd></dl><details className="mt-2 text-[11px]"><summary className="cursor-pointer text-slate-500">Pairwise same-close overlap ({Object.keys(profiles.overlapAndDependence.pairwiseSameCloseCounts).length})</summary><ul className="mt-1 divide-y divide-slate-800/40">{Object.entries(profiles.overlapAndDependence.pairwiseSameCloseCounts).map(([key, value]) => <li key={key} className="flex min-w-0 justify-between gap-2 py-1"><span className="min-w-0 break-all">{key}</span><span className="font-mono tabular-nums">{value.toLocaleString("vi-VN")}</span></li>)}</ul></details></article>
    </div>

    <div className="mt-3"><RetentionList value={retention}/></div>
    <div title={profiles.profileDefinitionsSha256} className="mt-2 max-w-full truncate font-mono text-[10px] text-slate-500">{profiles.schema} · definitions {profiles.profileDefinitionsSha256}</div>
  </section>;
}
