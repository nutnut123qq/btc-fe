"use client";

import { useMemo, useState } from "react";
import {
  classifyStatisticalHypothesis,
  type StatisticalDisplayStatus,
  type StatisticalHypothesis,
  type StatisticalStability,
  type TechnicalStatisticalEvidence,
} from "@/lib/statisticalEvidence";

const STATUS_LABEL: Record<StatisticalDisplayStatus, string> = {
  difference_detected: "Khác biệt sau hiệu chỉnh",
  inconclusive: "Chưa đủ để phân biệt",
  insufficient: "Mẫu chưa đủ",
  no_sample: "Không có mẫu ghép",
};

function percent(value: number | null, digits = 3): string {
  return value == null ? "—" : `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: digits })}%`;
}

function decimal(value: number | null, digits = 4): string {
  return value == null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

function StabilityList({ title, value }: { title: string; value: StatisticalStability }) {
  const rows = Object.entries(value.groups);
  return <details className="min-w-0 rounded border border-gray-800 p-2">
    <summary className="cursor-pointer text-[10px] font-semibold text-gray-400">{title} · {rows.length} nhóm · đồng dấu {percent(value.pooledSignAgreementFraction, 1)}</summary>
    {rows.length === 0 ? <p className="mt-2 text-[10px] text-amber-300">Không có nhóm quan sát; không suy diễn tính ổn định.</p> : <ul className="mt-2 space-y-1">{rows.map(([key, row]) => <li key={key} className="grid min-w-0 grid-cols-[minmax(0,1fr),auto] gap-2 text-[10px]"><span className="break-all text-gray-500">{key}</span><span className="text-right text-gray-300">n={row.count} · mean {percent(row.meanPairedDifference)} · median {percent(row.medianPairedDifference)} · {row.sign}</span></li>)}</ul>}
  </details>;
}

function HypothesisCard({ value, alpha }: { value: StatisticalHypothesis; alpha: number }) {
  const status = classifyStatisticalHypothesis(value, alpha);
  const interval = value.blockBootstrap.meanDifferenceInterval;
  const effective = value.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize;
  return <article className="min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950/50 p-3">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h4 className="break-all font-mono text-[11px] text-gray-300">{value.hypothesisId}</h4><p className="mt-1 text-[10px] text-gray-600">{value.module} · {value.eventType} · h{value.horizonBars} · {value.metric}</p></div>
      <span className="rounded border border-amber-800/60 bg-amber-950/30 px-2 py-1 text-[10px] font-semibold text-amber-200">{STATUS_LABEL[status]}</span>
    </div>
    <p className="mt-2 text-[10px] leading-4 text-gray-500">Trạng thái UI: hypothesis phải test được, q ≤ {(alpha * 100).toLocaleString("vi-VN")}% và CI không cắt 0. Đây chỉ là khác biệt mô tả sau hiệu chỉnh, không phải dự báo hay chọn winner.</p>
    <dl className="mt-3 grid min-w-0 grid-cols-2 gap-1 text-[10px] sm:grid-cols-4 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:text-right">
      <dt className="text-gray-600">Raw pairs</dt><dd>{value.sampleDiagnostics.nominalMatchedPairs.toLocaleString("vi-VN")}</dd>
      <dt className="text-gray-600">Effective n</dt><dd>{decimal(effective.estimate, 2)}</dd>
      <dt className="text-gray-600">Unique times</dt><dd>{value.sampleDiagnostics.uniqueDecisionTimes.toLocaleString("vi-VN")}</dd>
      <dt className="text-gray-600">Non-overlap max</dt><dd>{value.sampleDiagnostics.maximumGreedyNonOverlappingOutcomeWindows.toLocaleString("vi-VN")}</dd>
      <dt className="text-gray-600">Mean paired effect</dt><dd>{percent(value.effectSize.meanPairedDifference)}</dd>
      <dt className="text-gray-600">Median paired effect</dt><dd>{percent(value.effectSize.medianPairedDifference)}</dd>
      <dt className="text-gray-600">Standardized effect</dt><dd>{decimal(value.effectSize.pairedStandardizedMeanDifference)}</dd>
      <dt className="text-gray-600">CI mean effect</dt><dd>{interval ? `[${percent(interval.lower)}, ${percent(interval.upper)}]` : "—"}</dd>
      <dt className="text-gray-600">Positive / tie / negative</dt><dd>{percent(value.effectSize.positiveFraction, 1)} / {percent(value.effectSize.tieFraction, 1)} / {percent(value.effectSize.negativeFraction, 1)}</dd>
      <dt className="text-gray-600">Raw p / adjusted q</dt><dd>{decimal(value.rawPValue)} / {decimal(value.adjustedQValue)}</dd>
      <dt className="text-gray-600">Pass declared FDR</dt><dd>{value.passesDeclaredFdr == null ? "Không test được" : value.passesDeclaredFdr ? "Có" : "Không"}</dd>
      <dt className="text-gray-600">Loại để lấy tập không chồng lấn</dt><dd>{value.sampleDiagnostics.observationsExcludedForMaximumNonOverlappingSet.toLocaleString("vi-VN")}</dd>
    </dl>
    <p className="mt-2 break-words rounded border border-gray-800/70 p-2 text-[10px] leading-4 text-gray-500">Null/baseline: {value.nullBaseline}</p>
    <div className="mt-2 grid min-w-0 gap-2 lg:grid-cols-2"><StabilityList title="Stability theo năm UTC" value={value.stability.yearUtc}/><StabilityList title="Stability theo regime" value={value.stability.regime}/></div>
  </article>;
}

export function StatisticalEvidencePanel({ evidence }: { evidence: TechnicalStatisticalEvidence | null }) {
  const [moduleKey, setModuleKey] = useState("all");
  const [statusKey, setStatusKey] = useState<StatisticalDisplayStatus | "all">("all");
  const modules = useMemo(() => [...new Set(evidence?.hypotheses.map((item) => item.module) ?? [])].sort(), [evidence]);
  const hypotheses = useMemo(() => evidence?.hypotheses.filter((item) => {
    const status = classifyStatisticalHypothesis(item, evidence.multipleTesting.declaredQAlpha);
    return (moduleKey === "all" || item.module === moduleKey) && (statusKey === "all" || status === statusKey);
  }) ?? [], [evidence, moduleKey, statusKey]);

  if (!evidence) return <section className="min-w-0 rounded-xl border border-amber-900/60 bg-amber-950/15 p-4" aria-labelledby="statistical-evidence-title"><h3 id="statistical-evidence-title" className="text-sm font-semibold text-amber-200">Statistical evidence v1</h3><p className="mt-2 text-xs leading-5 text-amber-100/70">Bundle này chưa công bố statisticalEvidence theo schema v1. UI giữ trạng thái unavailable và không suy diễn effect, CI, baseline hoặc độ ổn định từ các metric tổng hợp khác.</p></section>;

  const statusCounts = evidence.hypotheses.reduce<Record<StatisticalDisplayStatus, number>>((counts, item) => {
    counts[classifyStatisticalHypothesis(item, evidence.multipleTesting.declaredQAlpha)] += 1;
    return counts;
  }, { difference_detected: 0, inconclusive: 0, insufficient: 0, no_sample: 0 });

  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-cyan-900/70 bg-cyan-950/10 p-4" aria-labelledby="statistical-evidence-title">
    <div className="min-w-0"><h3 id="statistical-evidence-title" className="text-sm font-semibold text-cyan-200">Statistical evidence dossier · descriptive only</h3><p className="mt-1 break-words text-[11px] leading-5 text-gray-500">BTCUSDT {evidence.scope.timeframe}. Toàn bộ family được giữ lại, gồm kết quả âm, không có mẫu và chưa đủ mẫu. Không rank, chọn winner hoặc diễn giải thành prediction/PnL.</p></div>
    <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 text-[10px] sm:grid-cols-3 xl:grid-cols-6">
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">Family retained</span><div className="mt-1 text-sm font-semibold">{evidence.multipleTesting.familySizeAllRetained}</div><div className="mt-1 text-[9px] text-gray-600">{evidence.declaredFamily.moduleEventTypeIdentityCount} event identities</div></div>
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">Testable</span><div className="mt-1 text-sm font-semibold">{evidence.multipleTesting.testableFamilySize}</div></div>
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">Khác biệt</span><div className="mt-1 text-sm font-semibold">{statusCounts.difference_detected}</div></div>
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">Inconclusive</span><div className="mt-1 text-sm font-semibold">{statusCounts.inconclusive}</div></div>
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">Insufficient</span><div className="mt-1 text-sm font-semibold">{statusCounts.insufficient}</div></div>
      <div className="rounded border border-gray-800 p-2"><span className="text-gray-600">No sample</span><div className="mt-1 text-sm font-semibold">{statusCounts.no_sample}</div></div>
    </div>

    <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-2">
      <article className="min-w-0 rounded-lg border border-gray-800 bg-gray-950/40 p-3 text-[10px]"><strong className="text-xs text-gray-300">Method, null & cutoff semantics</strong><dl className="mt-2 grid grid-cols-[auto,minmax(0,1fr)] gap-1 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:text-right"><dt className="text-gray-600">Baseline</dt><dd>{evidence.nullBaseline.method}</dd><dt className="text-gray-600">Regime keys</dt><dd>{evidence.nullBaseline.regimeKeys.join(", ")}</dd><dt className="text-gray-600">Causality</dt><dd>{evidence.nullBaseline.causality}</dd><dt className="text-gray-600">Interval</dt><dd>{evidence.dependence.intervalMethod}</dd><dt className="text-gray-600">Bootstrap</dt><dd>{evidence.dependence.bootstrapSamples.toLocaleString("vi-VN")} samples · block {evidence.dependence.configuredBlockSizeEvents}</dd><dt className="text-gray-600">Method version</dt><dd>{evidence.schema}</dd><dt className="text-gray-600">Spec hash</dt><dd title={evidence.specSha256} className="truncate font-mono">{evidence.specSha256}</dd><dt className="text-gray-600">Family definitions</dt><dd title={evidence.declaredFamily.technicalModuleContractDefinitionsSha256} className="truncate font-mono">{evidence.declaredFamily.technicalModuleContractDefinitionsSha256}</dd></dl><p className="mt-2 break-words text-amber-200/70">{evidence.nullBaseline.limitation}</p></article>
      <article className="min-w-0 rounded-lg border border-gray-800 bg-gray-950/40 p-3 text-[10px]"><strong className="text-xs text-gray-300">Multiple testing & sensitivity</strong><dl className="mt-2 grid grid-cols-[auto,minmax(0,1fr)] gap-1 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:text-right"><dt className="text-gray-600">Method</dt><dd>{evidence.multipleTesting.method}</dd><dt className="text-gray-600">Declared q alpha</dt><dd>{percent(evidence.multipleTesting.declaredQAlpha, 1)}</dd><dt className="text-gray-600">Sensitivity variants</dt><dd>{evidence.sensitivityGrid.executedVariantIds.length}</dd><dt className="text-gray-600">Grid hash</dt><dd title={evidence.sensitivityGrid.declaredGridSha256 ?? undefined} className="truncate font-mono">{evidence.sensitivityGrid.declaredGridSha256 ?? "Chưa công bố"}</dd><dt className="text-gray-600">Outcome-driven selection</dt><dd>Không</dd><dt className="text-gray-600">Retain all variants</dt><dd>{evidence.sensitivityGrid.allExecutedVariantsRetained == null ? "Chưa công bố" : evidence.sensitivityGrid.allExecutedVariantsRetained ? "Có" : "Không"}</dd></dl><p className="mt-2 break-words text-amber-200/70">{evidence.multipleTesting.interpretation}</p><details className="mt-2"><summary className="cursor-pointer text-gray-400">Executed variant IDs ({evidence.sensitivityGrid.executedVariantIds.length})</summary>{evidence.sensitivityGrid.executedVariantIds.length === 0 ? <p className="mt-1 text-amber-300">Không có sensitivity variant được thực thi.</p> : <ul className="mt-1 space-y-1">{evidence.sensitivityGrid.executedVariantIds.map((id) => <li key={id} className="break-all font-mono text-gray-500">{id}</li>)}</ul>}</details></article>
    </div>

    <div className="mt-3 flex min-w-0 flex-wrap gap-3">
      <label className="min-w-0 text-[10px] uppercase tracking-wide text-gray-500">Module<select value={moduleKey} onChange={(event) => setModuleKey(event.target.value)} className="mt-1 block max-w-full rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs normal-case text-gray-200"><option value="all">Tất cả module</option>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="min-w-0 text-[10px] uppercase tracking-wide text-gray-500">Evidence state<select value={statusKey} onChange={(event) => setStatusKey(event.target.value as StatisticalDisplayStatus | "all")} className="mt-1 block max-w-full rounded border border-gray-700 bg-gray-950 px-2 py-1.5 text-xs normal-case text-gray-200"><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {hypotheses.length === 0 ? <div className="mt-3 rounded border border-amber-900 bg-amber-950/20 p-3 text-xs text-amber-300">Không có hypothesis khớp bộ lọc. Không thay thế bằng nhóm khác hoặc ẩn negative/no-sample.</div> : <div className="mt-3 space-y-2">{hypotheses.map((item) => <HypothesisCard key={item.hypothesisId} value={item} alpha={evidence.multipleTesting.declaredQAlpha}/>)}</div>}
    <p className="mt-3 break-words text-[10px] leading-4 text-gray-600">Retention policy: {evidence.retentionPolicy}. Independence claimed: no. Các nhóm stability không dùng minimum-sample filter.</p>
  </section>;
}
