"use client";

import { useMemo, useState } from "react";
import { moduleLabel } from "@/lib/moduleLabels";
import type { TechnicalSensitivityAudit } from "@/lib/sensitivityAudit";
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
  return <details className="min-w-0 border-t border-slate-800/50 py-2">
    <summary className="cursor-pointer text-xs font-semibold text-slate-400">{title} · {rows.length} nhóm · đồng dấu {percent(value.pooledSignAgreementFraction, 1)}</summary>
    {rows.length === 0 ? <p className="mt-2 text-xs text-slate-300">Không có nhóm quan sát; không suy diễn tính ổn định.</p> : <ul className="mt-2 divide-y divide-slate-800/40">{rows.map(([key, row]) => <li key={key} className="grid min-w-0 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-2 py-1 text-xs"><span className="break-all text-slate-400">{key}</span><span className="text-right font-mono tabular-nums text-slate-300">n={row.count} · mean {percent(row.meanPairedDifference)} · median {percent(row.medianPairedDifference)} · {row.sign}</span></li>)}</ul>}
  </details>;
}

function HypothesisCard({ value, alpha }: { value: StatisticalHypothesis; alpha: number }) {
  const status = classifyStatisticalHypothesis(value, alpha);
  const interval = value.blockBootstrap.meanDifferenceInterval;
  const effective = value.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize;
  return <article className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800/70 p-3">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0"><h4 className="break-all font-mono text-xs text-slate-300">{value.hypothesisId}</h4><p className="mt-1 font-mono text-[10px] text-slate-500"><span title={value.module}>{moduleLabel(value.module)}</span> · {value.eventType} · h{value.horizonBars} · {value.metric}</p></div>
      <span className="shrink-0 rounded bg-slate-800/50 px-1.5 py-0.5 text-[11px] font-medium text-slate-300">{STATUS_LABEL[status]}</span>
    </div>
    <p className="mt-2 text-[11px] leading-4 text-slate-500">Trạng thái UI: hypothesis phải test được, q ≤ {(alpha * 100).toLocaleString("vi-VN")}% và CI không cắt 0. Đây chỉ là khác biệt mô tả sau hiệu chỉnh, không phải dự báo hay chọn winner.</p>
    <dl className="mt-2 grid min-w-0 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-3 text-xs [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300">
      <dt>Số cặp thô</dt><dd>{value.sampleDiagnostics.nominalMatchedPairs.toLocaleString("vi-VN")}</dd>
      <dt>n hiệu dụng</dt><dd>{decimal(effective.estimate, 2)}</dd>
      <dt>Số thời điểm riêng</dt><dd>{value.sampleDiagnostics.uniqueDecisionTimes.toLocaleString("vi-VN")}</dd>
      <dt>Tối đa không chồng lấn</dt><dd>{value.sampleDiagnostics.maximumGreedyNonOverlappingOutcomeWindows.toLocaleString("vi-VN")}</dd>
      <dt>Hiệu ứng paired trung bình</dt><dd>{percent(value.effectSize.meanPairedDifference)}</dd>
      <dt>Hiệu ứng paired trung vị</dt><dd>{percent(value.effectSize.medianPairedDifference)}</dd>
      <dt>Hiệu ứng chuẩn hóa</dt><dd>{decimal(value.effectSize.pairedStandardizedMeanDifference)}</dd>
      <dt>CI của mean effect</dt><dd>{interval ? `[${percent(interval.lower)}, ${percent(interval.upper)}]` : "—"}</dd>
      <dt>Dương / hòa / âm</dt><dd>{percent(value.effectSize.positiveFraction, 1)} / {percent(value.effectSize.tieFraction, 1)} / {percent(value.effectSize.negativeFraction, 1)}</dd>
      <dt>p thô / q đã hiệu chỉnh</dt><dd>{decimal(value.rawPValue)} / {decimal(value.adjustedQValue)}</dd>
      <dt>Đạt FDR khai báo</dt><dd>{value.passesDeclaredFdr == null ? "Không test được" : value.passesDeclaredFdr ? "Có" : "Không"}</dd>
      <dt>Đủ mẫu không chồng lấn (≥{value.minimumNonOverlappingPairs})</dt><dd>{value.sufficientSample ? "Có" : "Không"}</dd>
      <dt>Loại để lấy tập không chồng lấn</dt><dd>{value.sampleDiagnostics.observationsExcludedForMaximumNonOverlappingSet.toLocaleString("vi-VN")}</dd>
    </dl>
    <p className="mt-2 break-words border-t border-slate-800/50 pt-2 text-[11px] leading-5 text-slate-400">Null/baseline: {value.nullBaseline}</p>
    <div className="grid min-w-0 gap-2 lg:grid-cols-2"><StabilityList title="Stability theo năm UTC" value={value.stability.yearUtc}/><StabilityList title="Stability theo regime" value={value.stability.regime}/></div>
  </article>;
}

function SensitivityAuditSection({ audit }: { audit: TechnicalSensitivityAudit }) {
  const horizonKeys = [...new Set(audit.variants.flatMap((variant) => Object.keys(variant.horizons)))]
    .sort((a, b) => Number(a) - Number(b));
  return <details className="mt-3 min-w-0 rounded-md border border-slate-800/70 p-3 text-xs">
    <summary className="cursor-pointer text-xs font-semibold text-slate-300">Sensitivity audit · per-variant ({audit.variants.length.toLocaleString("vi-VN")})</summary>
    <p className="mt-2 break-words leading-4 text-slate-400">Audit {audit.method ?? "one-axis-at-a-time"}: mỗi variant re-run eligibility và đếm outcome độc lập. Delta là chênh lệch mean lịch sử vs baseline của contract — mô tả lịch sử, không phải chọn winner hay dự báo.{audit.declaredGridSha256 ? <> Grid <span className="break-all font-mono">{audit.declaredGridSha256}</span></> : null}</p>
    {audit.variants.length === 0 ? <p className="mt-2 text-amber-300">Audit không công bố variant nào.</p> : <div className="mt-2 min-w-0 overflow-x-auto"><table className="w-full min-w-[720px]">
      <thead className="border-b border-slate-800 text-slate-500"><tr><th className="p-2 text-left font-medium">Variant</th><th className="p-2 text-left font-medium">Tham số</th><th className="p-2 text-right font-medium">Đã lưu</th><th className="p-2 text-right font-medium">Đủ điều kiện</th><th className="p-2 text-right font-medium">Jaccard vs baseline</th>{horizonKeys.map((key) => <th key={key} className="p-2 text-right font-medium">h{key} Δ mean</th>)}</tr></thead>
      <tbody>{audit.variants.map((variant, index) => <tr key={variant.variantId ?? `${variant.module ?? "variant"}-${index}`} className="border-b border-slate-800/50 align-top">
        <td className="p-2"><div className="break-all font-mono text-slate-300">{variant.variantId ?? "—"}</div>{variant.module && <div className="break-all text-[10px] text-slate-500" title={variant.module}>{moduleLabel(variant.module)}</div>}</td>
        <td className="max-w-56 break-all p-2 font-mono text-slate-400">{variant.parameters == null ? "—" : JSON.stringify(variant.parameters)}</td>
        <td className="p-2 text-right font-mono tabular-nums text-slate-400">{variant.stored?.toLocaleString("vi-VN") ?? "—"}</td>
        <td className="p-2 text-right font-mono tabular-nums text-slate-300">{variant.eligible?.toLocaleString("vi-VN") ?? "—"}</td>
        <td className="p-2 text-right font-mono tabular-nums text-slate-300">{percent(variant.eligibleDecisionTimeJaccardVsBaseline, 1)}</td>
        {horizonKeys.map((key) => {
          const horizon = variant.horizons[key];
          return <td key={key} className="p-2 text-right font-mono tabular-nums text-slate-400">{horizon ? Object.entries(horizon.metrics).map(([metric, value]) => <div key={metric} className="whitespace-nowrap">{metric} {percent(value.meanDeltaVsBaseline, 3)}</div>) : "—"}</td>;
        })}
      </tr>)}</tbody>
    </table></div>}
  </details>;
}

export function StatisticalEvidencePanel({ evidence, audit }: { evidence: TechnicalStatisticalEvidence | null; audit?: TechnicalSensitivityAudit | null }) {
  const [moduleKey, setModuleKey] = useState("all");
  const [statusKey, setStatusKey] = useState<StatisticalDisplayStatus | "all">("all");
  const modules = useMemo(() => [...new Set(evidence?.hypotheses.map((item) => item.module) ?? [])].sort(), [evidence]);
  const hypotheses = useMemo(() => evidence?.hypotheses.filter((item) => {
    const status = classifyStatisticalHypothesis(item, evidence.multipleTesting.declaredQAlpha);
    return (moduleKey === "all" || item.module === moduleKey) && (statusKey === "all" || status === statusKey);
  }) ?? [], [evidence, moduleKey, statusKey]);

  if (!evidence) return <section className="min-w-0 rounded-md border border-amber-900/60 bg-amber-950/15 p-4" aria-labelledby="statistical-evidence-title"><h3 id="statistical-evidence-title" className="text-[13px] font-semibold text-amber-200">Statistical evidence v1</h3><p className="mt-2 text-xs leading-5 text-amber-100/70">Bundle này chưa công bố statisticalEvidence theo schema v1. UI giữ trạng thái unavailable và không suy diễn effect, CI, baseline hoặc độ ổn định từ các metric tổng hợp khác.</p></section>;

  const statusCounts = evidence.hypotheses.reduce<Record<StatisticalDisplayStatus, number>>((counts, item) => {
    counts[classifyStatisticalHypothesis(item, evidence.multipleTesting.declaredQAlpha)] += 1;
    return counts;
  }, { difference_detected: 0, inconclusive: 0, insufficient: 0, no_sample: 0 });

  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50 p-4" aria-labelledby="statistical-evidence-title">
    <div className="min-w-0"><h3 id="statistical-evidence-title" className="text-[13px] font-semibold text-slate-200">Statistical evidence dossier · descriptive only</h3><p className="mt-0.5 break-words text-xs leading-5 text-slate-500">BTCUSDT {evidence.scope.timeframe}. Toàn bộ family được giữ lại, gồm kết quả âm, không có mẫu và chưa đủ mẫu. Không rank, chọn winner hoặc diễn giải thành prediction/PnL.</p></div>
    <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 text-xs sm:grid-cols-3 xl:grid-cols-6">
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Family giữ lại</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{evidence.multipleTesting.familySizeAllRetained}</div><div className="mt-0.5 text-[11px] text-slate-500"><span className="font-mono tabular-nums">{evidence.declaredFamily.moduleEventTypeIdentityCount}</span> event identities</div></div>
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Test được</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{evidence.multipleTesting.testableFamilySize}</div></div>
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Khác biệt</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{statusCounts.difference_detected}</div></div>
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Chưa phân biệt</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{statusCounts.inconclusive}</div></div>
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Chưa đủ mẫu</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{statusCounts.insufficient}</div></div>
      <div className="border-l border-slate-800/60 pl-3"><span className="text-slate-500">Không có mẫu</span><div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">{statusCounts.no_sample}</div></div>
    </div>

    <div className="mt-3 grid min-w-0 gap-3 border-t border-slate-800/60 pt-3 lg:grid-cols-2">
      <article className="min-w-0 text-[11px]"><strong className="text-xs text-slate-300">Method, null & cutoff semantics</strong><dl className="mt-1.5 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-3 [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Baseline</dt><dd>{evidence.nullBaseline.method}</dd><dt>Regime keys</dt><dd>{evidence.nullBaseline.regimeKeys.join(", ")}</dd><dt>Causality</dt><dd>{evidence.nullBaseline.causality}</dd><dt>Interval</dt><dd>{evidence.dependence.intervalMethod}</dd><dt>Bootstrap</dt><dd>{evidence.dependence.bootstrapSamples.toLocaleString("vi-VN")} samples · block {evidence.dependence.configuredBlockSizeEvents}</dd><dt>Method version</dt><dd>{evidence.schema}</dd><dt>Spec hash</dt><dd title={evidence.specSha256} className="truncate">{evidence.specSha256}</dd><dt>Family definitions</dt><dd title={evidence.declaredFamily.technicalModuleContractDefinitionsSha256} className="truncate">{evidence.declaredFamily.technicalModuleContractDefinitionsSha256}</dd></dl><p className="mt-2 break-words text-slate-400">{evidence.nullBaseline.limitation}</p></article>
      <article className="min-w-0 text-[11px]"><strong className="text-xs text-slate-300">Multiple testing & sensitivity</strong><dl className="mt-1.5 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-x-3 [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Method</dt><dd>{evidence.multipleTesting.method}</dd><dt>Declared q alpha</dt><dd>{percent(evidence.multipleTesting.declaredQAlpha, 1)}</dd><dt>Sensitivity variants</dt><dd>{evidence.sensitivityGrid.executedVariantIds.length}</dd><dt>Grid hash</dt><dd title={evidence.sensitivityGrid.declaredGridSha256 ?? undefined} className="truncate">{evidence.sensitivityGrid.declaredGridSha256 ?? "Chưa công bố"}</dd><dt>Outcome-driven selection</dt><dd>Không</dd><dt>Retain all variants</dt><dd>{evidence.sensitivityGrid.allExecutedVariantsRetained == null ? "Chưa công bố" : evidence.sensitivityGrid.allExecutedVariantsRetained ? "Có" : "Không"}</dd></dl><p className="mt-2 break-words text-slate-400">{evidence.multipleTesting.interpretation}</p><details className="mt-2"><summary className="cursor-pointer text-slate-500">Executed variant IDs ({evidence.sensitivityGrid.executedVariantIds.length})</summary>{evidence.sensitivityGrid.executedVariantIds.length === 0 ? <p className="mt-1 text-slate-300">Không có sensitivity variant được thực thi.</p> : <ul className="mt-1 space-y-1">{evidence.sensitivityGrid.executedVariantIds.map((id) => <li key={id} className="break-all font-mono text-slate-400">{id}</li>)}</ul>}</details></article>
    </div>

    {audit && <SensitivityAuditSection audit={audit} />}

    <div className="mt-3 flex min-w-0 flex-wrap gap-3">
      <label className="min-w-0 text-[11px] font-medium text-slate-500">Module<select value={moduleKey} onChange={(event) => setModuleKey(event.target.value)} className="mt-1 block min-h-10 max-w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs normal-case text-slate-200"><option value="all">Tất cả module</option>{modules.map((item) => <option key={item} value={item}>{moduleLabel(item)}</option>)}</select></label>
      <label className="min-w-0 text-[11px] font-medium text-slate-500">Trạng thái evidence<select value={statusKey} onChange={(event) => setStatusKey(event.target.value as StatisticalDisplayStatus | "all")} className="mt-1 block min-h-10 max-w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs normal-case text-slate-200"><option value="all">Tất cả trạng thái</option>{Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {hypotheses.length === 0 ? <div className="mt-3 rounded-md border border-slate-800/70 p-3 text-xs text-slate-300">Không có hypothesis khớp bộ lọc. Không thay thế bằng nhóm khác hoặc ẩn negative/no-sample.</div> : <>
      <div className="mt-3 space-y-2">{hypotheses.slice(0, 40).map((item) => <HypothesisCard key={item.hypothesisId} value={item} alpha={evidence.multipleTesting.declaredQAlpha}/>)}</div>
      {hypotheses.length > 40 && <p className="mt-2 text-[11px] text-slate-500">UI chỉ hiển thị 40/{hypotheses.length.toLocaleString("vi-VN")} hypothesis đầu — dùng bộ lọc module/trạng thái để thu hẹp; artifact gốc giữ toàn bộ family kể cả negative/no-sample.</p>}
    </>}
    <p className="mt-3 break-words text-[11px] leading-4 text-slate-500">Chính sách giữ lại: {evidence.retentionPolicy}. Tuyên bố độc lập: không. Các nhóm stability không dùng minimum-sample filter.</p>
  </section>;
}
