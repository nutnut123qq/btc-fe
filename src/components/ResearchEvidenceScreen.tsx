"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Database,
  FileCheck2,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  getBacktestRuns,
  getDataAudit,
  getHealthWorkers,
  getPaperObservations,
  getResearchEvidenceCatalog,
  getResearchEvidenceDetail,
  getTechnicalCapabilities,
} from "@/lib/api";
import { buildTechnicalCoverageSummary } from "@/lib/dataCoverage";
import {
  evidenceSectionLabel,
  type EvidenceMetric,
  type ResearchEvidenceCatalog,
  type ResearchEvidenceDetail,
  type ResearchEvidenceKind,
  type ResearchEvidenceSummary,
  type ResearchEvidenceTier,
} from "@/lib/researchEvidence";
import type {
  BacktestRunSummary,
  DataAuditResponse,
  PaperObservationListResponse,
  TechnicalCapabilitiesResponse,
  TechnicalCapabilityItem,
  TimeframeAuditSummary,
  WorkersHealthDto,
} from "@/lib/types";
import { TechnicalEvidenceAdministration } from "./TechnicalEvidenceAdministration";
import { CausalSmartMoneyAdministration } from "./CausalSmartMoneyAdministration";
import { EvidenceProfilesPanel } from "./EvidenceProfilesPanel";
import { DataQualityAdministration } from "./DataQualityAdministration";
import { StatisticalEvidencePanel } from "./StatisticalEvidencePanel";
import { CurrentConditionsPanel } from "./CurrentConditionsPanel";
import { GlossaryTerm } from "./GlossaryTerm";

type Section = "overview" | ResearchEvidenceKind;
const EVIDENCE_READ_TIMEOUT_MS = 60_000;

const SECTIONS: Array<{ key: Section; label: string }> = [
  { key: "overview", label: "Tổng quan" },
  { key: "model", label: "Mô hình" },
  { key: "feature", label: "Feature" },
  { key: "event", label: "Sự kiện" },
  { key: "economic", label: "Kinh tế" },
  { key: "forward", label: "Forward" },
];

const TIER_LABELS: Record<ResearchEvidenceTier, string> = {
  descriptive: "Mô tả lịch sử",
  predictive: "Đánh giá predictive",
  "validated-predictive": "Predictive OOS",
  "retrospective-selection-aware": "Retrospective · selection-aware",
  "economic-simulation": "Mô phỏng kinh tế",
  "forward-observed": "Forward observed",
  live: "Live",
  unavailable: "Chưa có bằng chứng",
};

function tierClass(tier: ResearchEvidenceTier): string {
  // Quiet slate for every tier — tier is a label, not an interaction or a
  // success signal. `unavailable` stays dimmer to mark missing evidence.
  if (tier === "unavailable") return "bg-slate-800/40 text-slate-500";
  return "bg-slate-800/40 text-slate-300";
}

function formatValue(value: number | null, unit: string | null = null): string {
  if (value == null) return "—";
  const formatted = Math.abs(value) >= 1_000
    ? value.toLocaleString("vi-VN", { maximumFractionDigits: 2 })
    : value.toLocaleString("vi-VN", { maximumFractionDigits: 6 });
  return unit === "%" || unit === "percent" ? `${formatted}%` : unit ? `${formatted} ${unit}` : formatted;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function formatTimeMs(value: number | null): string {
  return value == null ? "—" : new Date(value).toLocaleString("vi-VN");
}

function shortHash(value: string | null): string {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

function MetricCard({ metric, descriptive }: { metric: EvidenceMetric; descriptive: boolean }) {
  return (
    <div className="min-w-0 rounded-md border border-slate-800/70 bg-slate-950/40 p-3">
      <div className="text-[11px] font-medium text-slate-500">{metric.label}</div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-100">{formatValue(metric.value, metric.unit)}</div>
      <div className="mt-1 space-y-0.5 text-[11px] text-slate-400">
        <div className="font-mono text-[10px] text-slate-500">{metric.name}</div>
        {metric.baselineValue != null && <div><GlossaryTerm term="baseline">Baseline</GlossaryTerm>: <span className="font-mono tabular-nums">{formatValue(metric.baselineValue, metric.unit)}</span></div>}
        {metric.lift != null && <div><GlossaryTerm term="lift">Lift</GlossaryTerm>: <span className="font-mono tabular-nums">{formatValue(metric.lift, metric.unit)}</span></div>}
        {(metric.intervalLow != null || metric.intervalHigh != null) && (
          <div><GlossaryTerm term="interval">{descriptive ? "Khoảng thống kê" : "Khoảng bất định"}</GlossaryTerm>: <span className="font-mono tabular-nums">[{formatValue(metric.intervalLow, metric.unit)}, {formatValue(metric.intervalHigh, metric.unit)}]</span></div>
        )}
        {metric.sampleCount != null && <div><GlossaryTerm term="n">n</GlossaryTerm> = <span className="font-mono tabular-nums">{metric.sampleCount.toLocaleString("vi-VN")}</span></div>}
        {metric.baseline && <div>So với: <span className="font-mono text-slate-400">{metric.baseline}</span></div>}
        {metric.interpretation && <div>{metric.interpretation}</div>}
      </div>
    </div>
  );
}

function ArtifactCard({ item, selected, onSelect }: {
  item: ResearchEvidenceSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`block w-full border-l-2 px-4 py-3 text-left transition-colors ${selected ? "border-l-teal-500 bg-teal-950/20" : "border-l-transparent hover:bg-slate-800/30"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-500">{evidenceSectionLabel(item.kind)}</div>
          <h3 className="mt-0.5 break-words text-[13px] font-semibold text-slate-100">{item.title}</h3>
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${tierClass(item.tier)}`}>{TIER_LABELS[item.tier]}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span>{item.symbol}{item.timeframe ? ` · ${item.timeframe}` : ""}</span>
        <span title={item.id} className="font-mono tabular-nums">Hash: {shortHash(item.id)}{item.generatedAtUtc ? ` · ${formatDate(item.generatedAtUtc)}` : ""}</span>
        <span className="rounded bg-slate-800/50 px-1.5 py-0.5">kết luận: {item.status}</span>
        <span className={item.integrityVerified ? "text-slate-300" : item.status === "integrity-limited" ? "text-amber-300" : "text-rose-300"}>
          {item.integrityVerified ? "✓ hash đã xác minh" : item.status === "integrity-limited" ? "⚠ integrity hạn chế" : "✕ integrity chưa đạt"}
        </span>
        <span className="ml-auto inline-flex items-center text-teal-400">Xem hồ sơ <ChevronRight className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

function JsonRows({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return null;
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 8);
  return (
    <details className="min-w-0 rounded-md border border-slate-800 bg-slate-900/40 px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-semibold text-slate-200">{title} <span className="font-mono tabular-nums text-slate-400">({rows.length.toLocaleString("vi-VN")})</span></summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="border-b border-slate-800 text-slate-500"><tr>{keys.map((key) => <th key={key} className="p-2 text-left font-medium">{key}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800/50">{rows.slice(0, 100).map((row, index) => (
            <tr key={index}>
              {keys.map((key) => <td key={key} className="max-w-48 truncate p-2 font-mono tabular-nums text-slate-400">{typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "—")}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length > 100 && <p className="mt-2 text-[11px] text-slate-500">UI chỉ hiển thị 100 dòng đầu; <GlossaryTerm term="artifact">artifact</GlossaryTerm> gốc giữ toàn bộ.</p>}
    </details>
  );
}

function eventTypeDetailRows(detail: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!detail) return [];
  return Object.entries(detail).map(([eventType, value]) => {
    const row = typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : { detail: value };
    return { eventType, ...row };
  });
}

function EvidenceDetailPanel({ detail, loading, error }: { detail: ResearchEvidenceDetail | null; loading: boolean; error: string | null }) {
  if (loading) return <div className="rounded-md border border-slate-800 bg-slate-900/40 p-5 text-[13px] text-slate-400">Đang kiểm tra và đọc <GlossaryTerm term="artifact">artifact</GlossaryTerm>…</div>;
  if (error) return <div role="alert" className="rounded-md border border-rose-900/60 bg-rose-950/20 p-4 text-[13px] text-rose-300">{error}</div>;
  if (!detail) return <div className="rounded-md border border-slate-800 bg-slate-900/40 p-5 text-[13px] text-slate-400">Chọn một <GlossaryTerm term="artifact">artifact</GlossaryTerm> để xem chuỗi bằng chứng.</div>;
  const descriptive = detail.tier === "descriptive";
  const snapshotArtifact = detail.artifacts.find((artifact) => artifact.role === "datasetSnapshot" || artifact.role === "snapshot") ?? null;
  const predictionsArtifact = detail.artifacts.find((artifact) => artifact.role === "rowPredictions" || artifact.role === "ledger") ?? null;
  const predictionRowCount = detail.dataset?.predictionRowCount ?? predictionsArtifact?.rowCount ?? null;
  const predictionsSha256 = detail.dataset?.predictionsSha256 ?? predictionsArtifact?.sha256 ?? null;
  const immutable = detail.dataset?.immutable
    ?? (detail.integrityVerified && snapshotArtifact && predictionsArtifact ? true : null);
  return (
    <article className="min-w-0 space-y-3" aria-label={`Hồ sơ bằng chứng ${detail.title}`}>
      <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Hồ sơ kết luận</p>
            <h2 className="mt-0.5 break-words text-base font-semibold text-slate-100">{detail.title}</h2>
          </div>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${tierClass(detail.tier)}`}><GlossaryTerm term={detail.tier}>{TIER_LABELS[detail.tier]}</GlossaryTerm></span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="min-w-0 border-t border-slate-800/60 pt-2"><div className="text-[11px] text-slate-500">Câu hỏi nghiên cứu</div><p className="mt-1 text-[13px] text-slate-300">{detail.question ?? detail.hypothesis ?? <><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa khai báo câu hỏi nghiên cứu.</>}</p></div>
          <div className="min-w-0 border-t border-slate-800/60 pt-2"><div className="text-[11px] text-slate-500">Kết luận được phép</div><p className="mt-1 text-[13px] text-slate-300">{detail.conclusion ?? detail.summary}</p></div>
        </div>
        {descriptive && <div className="mt-3 border-t border-slate-800/60 pt-2 text-[11px] leading-5 text-slate-400">Đây là bằng chứng mô tả các sự kiện đã quan sát. Giá trị và khoảng bên dưới không phải xác suất dự báo, tín hiệu giao dịch hay bằng chứng <GlossaryTerm term="pnl">PnL</GlossaryTerm>.</div>}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><Database className="h-4 w-4 text-slate-500" /> <GlossaryTerm term="snapshot">Snapshot</GlossaryTerm> dữ liệu</h3>
          {detail.dataset ? <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1.5 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1.5 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300">
            <dt>Nguồn</dt><dd>{detail.dataset.source ?? "—"}</dd>
            <dt>Số dòng</dt><dd>{detail.dataset.rowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt>{descriptive ? "Dòng event / ledger" : "Prediction rows"}</dt><dd>{predictionRowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt>Quyết định đầu</dt><dd>{detail.dataset.startTimeUtc ? formatDate(detail.dataset.startTimeUtc) : formatTimeMs(detail.dataset.firstDecisionTimeMs)}</dd>
            <dt>Quyết định cuối / <GlossaryTerm term="cutoff">cutoff</GlossaryTerm></dt><dd>{detail.dataset.cutoffTimeUtc ? formatDate(detail.dataset.cutoffTimeUtc) : detail.dataset.endTimeUtc ? formatDate(detail.dataset.endTimeUtc) : formatTimeMs(detail.dataset.lastDecisionTimeMs)}</dd>
            <dt><GlossaryTerm term="sha256">Snapshot hash</GlossaryTerm></dt><dd title={detail.dataset.snapshotSha256 ?? undefined}>{shortHash(detail.dataset.snapshotSha256)}</dd>
            <dt><GlossaryTerm term="sha256">Predictions hash</GlossaryTerm></dt><dd title={predictionsSha256 ?? undefined}>{shortHash(predictionsSha256)}</dd>
            <dt><GlossaryTerm term="immutable">Bất biến</GlossaryTerm></dt><dd>{immutable == null ? "Chưa khai báo" : immutable ? "Có" : "Không"}</dd>
          </dl> : <p className="mt-3 text-xs text-slate-400"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa cung cấp <GlossaryTerm term="snapshot">snapshot</GlossaryTerm> dữ liệu có thể truy nguyên.</p>}
        </section>

        <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><FlaskConical className="h-4 w-4 text-slate-500" /> <GlossaryTerm term="protocol">Protocol</GlossaryTerm></h3>
          {detail.protocol ? <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1.5 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1.5 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300">
            <dt><GlossaryTerm term="evaluator">Evaluator</GlossaryTerm></dt><dd>{detail.protocol.name ?? detail.protocol.version ?? "—"}</dd>
            <dt><GlossaryTerm term="chronological-oos">Chronological OOS</GlossaryTerm></dt><dd>{detail.protocol.chronologicalOos == null ? "Chưa khai báo" : detail.protocol.chronologicalOos ? "Có" : "Không"}</dd>
            <dt>Số <GlossaryTerm term="fold">fold</GlossaryTerm></dt><dd>{detail.protocol.foldCount ?? detail.coverage?.foldCount ?? "—"}</dd>
            <dt><GlossaryTerm term="decision-time">Decision time</GlossaryTerm></dt><dd>{detail.protocol.decisionTime ?? "—"}</dd>
            <dt><GlossaryTerm term="outcome-basis">Outcome basis</GlossaryTerm></dt><dd>{detail.protocol.outcomePriceBasis ?? "—"}</dd>
            <dt><GlossaryTerm term="multiple-testing">Multiple testing</GlossaryTerm></dt><dd>{detail.protocol.multipleTesting ?? "—"}</dd>
          </dl> : <p className="mt-3 text-xs text-slate-400"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa khai báo <GlossaryTerm term="protocol">protocol</GlossaryTerm>.</p>}
        </section>
      </div>

      {detail.artifacts.length > 0 && <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><FileCheck2 className="h-4 w-4 text-slate-500" /> <GlossaryTerm term="immutable">Immutable</GlossaryTerm> bundle <GlossaryTerm term="artifact">artifacts</GlossaryTerm></h3>
        <ul className="mt-2 divide-y divide-slate-800/50">{detail.artifacts.map((artifact) => <li key={artifact.role} className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-xs"><span className="font-medium text-slate-200">{artifact.role}</span><span className="font-mono tabular-nums text-slate-400">{artifact.rowCount == null ? "Không áp dụng số dòng" : `${artifact.rowCount.toLocaleString("vi-VN")} dòng`} · {artifact.bytes.toLocaleString("vi-VN")} bytes</span><span title={artifact.sha256} className="ml-auto font-mono text-[10px] tabular-nums text-slate-500">{shortHash(artifact.sha256)}</span></li>)}</ul>
      </section>}

      <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><BarChart3 className="h-4 w-4 text-slate-500" /> {descriptive ? <>Thống kê mô tả, <GlossaryTerm term="coverage">coverage</GlossaryTerm> và bất định</> : <>Kết quả, <GlossaryTerm term="baseline">baseline</GlossaryTerm> và bất định</>}</h3>
        {detail.metrics.length > 0 ? <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{detail.metrics.slice(0, 24).map((metric, index) => <MetricCard key={`${metric.name}-${index}`} metric={metric} descriptive={descriptive} />)}</div>
          {detail.metrics.length > 24 && <p className="mt-2 text-[11px] text-slate-500">UI chỉ hiển thị 24/{detail.metrics.length.toLocaleString("vi-VN")} <GlossaryTerm term="metric">metric</GlossaryTerm> đầu; <GlossaryTerm term="artifact">artifact</GlossaryTerm> gốc giữ toàn bộ.</p>}
        </> : <p className="mt-3 text-xs text-slate-400">Không có <GlossaryTerm term="metric">metric</GlossaryTerm> định lượng trong <GlossaryTerm term="artifact">artifact</GlossaryTerm>.</p>}
        {detail.uncertainty.length > 0 && <div className="mt-3 border-t border-slate-800/60 pt-2 text-xs"><div className="font-semibold text-slate-300">{descriptive ? "Khoảng thống kê mô tả" : <GlossaryTerm term="interval">Uncertainty / interval</GlossaryTerm>}</div><ul className="mt-2 space-y-1 text-slate-400">{detail.uncertainty.slice(0, 40).map((item) => <li key={item.name} className="break-words"><span className="break-all font-mono text-slate-300">{item.name}</span>: <span className="font-mono tabular-nums">[{formatValue(item.lower)}, {formatValue(item.upper)}]{item.confidenceLevel != null ? ` · mức interval ${(item.confidenceLevel * 100).toFixed(1)}%` : ""}</span>{item.familywise ? <> · <GlossaryTerm term="familywise">familywise-adjusted</GlossaryTerm></> : ""}</li>)}</ul>{detail.uncertainty.length > 40 && <p className="mt-2 text-[11px] text-slate-500">UI chỉ hiển thị 40/{detail.uncertainty.length.toLocaleString("vi-VN")} khoảng đầu; <GlossaryTerm term="artifact">artifact</GlossaryTerm> gốc giữ toàn bộ.</p>}{descriptive && <p className="mt-2 text-amber-300/80">Mức interval mô tả độ bất định của thống kê lịch sử; không phải xác suất sự kiện tương lai.</p>}</div>}
        {detail.findings.length > 0 && <div className="mt-3 border-t border-slate-800/60 pt-2 text-xs"><div className="font-semibold text-slate-300">Kết luận theo trial / nhóm</div><div className="mt-2 overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b border-slate-800 text-slate-500"><tr><th className="p-2 text-left font-medium">Finding</th><th className="p-2 text-left font-medium">Trạng thái</th><th className="p-2 text-right font-medium">Giá trị</th><th className="p-2 text-right font-medium">Khoảng</th><th className="p-2 text-right font-medium"><GlossaryTerm term="n">n</GlossaryTerm></th></tr></thead><tbody className="divide-y divide-slate-800/50">{detail.findings.slice(0, 40).map((finding) => <tr key={finding.id}><td className="p-2"><div className="text-slate-300">{finding.label}</div><div className="font-mono text-[10px] text-slate-500">{finding.metricName}</div></td><td className="p-2 text-slate-400">{finding.status}</td><td className="p-2 text-right font-mono tabular-nums text-slate-300">{formatValue(finding.value)}</td><td className="p-2 text-right font-mono tabular-nums text-slate-400">[{formatValue(finding.lower)}, {formatValue(finding.upper)}]</td><td className="p-2 text-right font-mono tabular-nums text-slate-400">{finding.sampleSize?.toLocaleString("vi-VN") ?? "—"}</td></tr>)}</tbody></table></div>{detail.findings.length > 40 && <p className="mt-2 text-[11px] text-slate-500">UI chỉ hiển thị 40/{detail.findings.length.toLocaleString("vi-VN")} finding đầu; <GlossaryTerm term="artifact">artifact</GlossaryTerm> gốc giữ toàn bộ.</p>}</div>}
        <div className="mt-3 grid gap-3 border-t border-slate-800/60 pt-2 md:grid-cols-2">
          <div className="min-w-0 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="baseline">Baselines</GlossaryTerm></div>{detail.baselines.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-400">{detail.baselines.map((baseline) => <li key={baseline.id}>{baseline.name}{baseline.description ? ` — ${baseline.description}` : ""}</li>)}</ul> : <p className="mt-2 text-slate-400">Chưa khai báo <GlossaryTerm term="baseline">baseline</GlossaryTerm>.</p>}</div>
          <div className="min-w-0 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="coverage">Coverage</GlossaryTerm> & <GlossaryTerm term="excluded">exclusions</GlossaryTerm></div><p className="mt-2 text-slate-400">Evaluated <span className="font-mono tabular-nums">{detail.coverage?.evaluatedRows?.toLocaleString("vi-VN") ?? "—"}</span> / <GlossaryTerm term="eligible">eligible</GlossaryTerm> <span className="font-mono tabular-nums">{detail.coverage?.eligibleRows?.toLocaleString("vi-VN") ?? "—"}</span> · ratio <span className="font-mono tabular-nums">{detail.coverage?.ratio == null ? "—" : `${(detail.coverage.ratio * 100).toFixed(2)}%`}</span> · <GlossaryTerm term="fold">folds</GlossaryTerm> <span className="font-mono tabular-nums">{detail.coverage?.foldCount ?? "—"}</span></p><p className="mt-2 text-amber-300/80">Các trường hợp loại trừ chỉ được coi là đã công bố khi xuất hiện trong limitations/<GlossaryTerm term="protocol">protocol</GlossaryTerm> của <GlossaryTerm term="artifact">artifact</GlossaryTerm>; UI không tự suy diễn phần còn thiếu.</p></div>
        </div>
      </section>

      {detail.evidenceProfiles && <EvidenceProfilesPanel profiles={detail.evidenceProfiles} />}
      {detail.kind === "event" && detail.tier === "descriptive" && (
        <StatisticalEvidencePanel evidence={detail.statisticalEvidence} audit={detail.sensitivityAudit} />
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-md border border-amber-900/60 bg-amber-950/10 p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Giới hạn</h3>
          {detail.limitations.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/70">{detail.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-xs text-amber-200/70"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa công bố giới hạn.</p>}
        </div>
        <div className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><ShieldCheck className="h-4 w-4 text-slate-500" /> <GlossaryTerm term="provenance">Provenance</GlossaryTerm> & <GlossaryTerm term="integrity">integrity</GlossaryTerm></h3>
          <dl className="mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 text-xs [&>dt]:border-b [&>dt]:border-slate-800/50 [&>dt]:py-1.5 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:truncate [&>dd]:border-b [&>dd]:border-slate-800/50 [&>dd]:py-1.5 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Report</dt><dd title={detail.provenance.reportSha256 ?? undefined}>{shortHash(detail.provenance.reportSha256)}</dd><dt><GlossaryTerm term="manifest">Manifest</GlossaryTerm></dt><dd title={detail.provenance.manifestSha256 ?? undefined}>{shortHash(detail.provenance.manifestSha256)}</dd><dt><GlossaryTerm term="evaluator">Evaluator</GlossaryTerm></dt><dd title={detail.provenance.evaluatorSha256 ?? undefined}>{shortHash(detail.provenance.evaluatorSha256)}</dd><dt><GlossaryTerm term="research-contract">Research contract</GlossaryTerm></dt><dd title={detail.provenance.researchContractSha256 ?? undefined}>{shortHash(detail.provenance.researchContractSha256)}</dd><dt>Git</dt><dd>{detail.provenance.codeVersion ?? "—"}{detail.provenance.gitDirty === true ? " (dirty)" : detail.provenance.gitDirty === false ? " (clean)" : ""}</dd><dt>Generated</dt><dd>{formatDate(detail.provenance.generatedAtUtc)}</dd></dl>
        </div>
      </section>
      <JsonRows title="Fold drill-down" rows={detail.folds} />
      <JsonRows title="Prediction / event rows" rows={detail.rows} />
      <JsonRows title="Report exclusion reasons" rows={detail.reportExclusions ? [detail.reportExclusions] : []} />
      <JsonRows title="Event-type lifecycle & denominators" rows={eventTypeDetailRows(detail.eventTypeDetail)} />
    </article>
  );
}

function EconomicStatus({ runs }: { runs: BacktestRunSummary[] | null }) {
  const valid = (runs ?? []).filter((run) => run.validityStatus === "Valid" && run.archivedAtUtc == null);
  const latest = valid[0] ?? null;
  return <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4 text-xs">
    <h3 className="text-[13px] font-semibold text-slate-200"><GlossaryTerm term="economic-simulation">Economic evidence · historical simulation</GlossaryTerm></h3>
    {!runs ? <p className="mt-2 text-slate-400">Endpoint backtest không khả dụng; không suy diễn <GlossaryTerm term="pnl">PnL</GlossaryTerm>.</p> : !latest ? <p className="mt-2 text-slate-400">Chưa có backtest hợp lệ theo <GlossaryTerm term="research-contract">research contract</GlossaryTerm>.</p> : <><dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(4,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-3 [&>div]:border-b [&>div]:border-slate-800/50 [&>div]:py-1.5 [&>div]:sm:block [&>div]:sm:border-b-0 [&>div]:sm:border-l [&>div]:sm:border-slate-800/60 [&>div]:sm:pl-3"><div><dt className="text-slate-500">Trades</dt><dd className="font-mono tabular-nums text-slate-200">{latest.totalTrades}</dd></div><div><dt className="text-slate-500">Return</dt><dd className="font-mono tabular-nums text-slate-200">{latest.totalReturnPct.toFixed(2)}%</dd></div><div><dt className="text-slate-500"><GlossaryTerm term="sharpe">Sharpe</GlossaryTerm></dt><dd className="font-mono tabular-nums text-slate-200">{latest.sharpeRatio.toFixed(2)}</dd></div><div><dt className="text-slate-500"><GlossaryTerm term="drawdown">Drawdown</GlossaryTerm></dt><dd className="font-mono tabular-nums text-slate-200">{latest.maxDrawdownPct.toFixed(2)}%</dd></div></dl><p className="mt-1.5 text-slate-500">{latest.modelName} · {latest.timeframe} · mô phỏng lịch sử, chưa phải forward/live.</p></>}
  </section>;
}

function ForwardStatus({ observations }: { observations: PaperObservationListResponse | null }) {
  const items = observations?.items ?? [];
  const fills = items.filter((item) => item.fillPrice != null).length;
  const outcomes = items.filter((item) => item.outcomeReturn != null).length;
  return <section className="min-w-0 rounded-md border border-slate-800 bg-slate-900/50 p-4 text-xs">
    <h3 className="text-[13px] font-semibold text-slate-200"><GlossaryTerm term="forward-journal">Forward evidence · BTCUSDT 4h journal</GlossaryTerm></h3>
    {!observations ? <p className="mt-2 text-slate-400">Forward journal không khả dụng; không dùng replay thay thế.</p> : !observations.available ? <p className="mt-2 text-slate-300">{observations.reason ?? "Forward journal chưa khả dụng."}</p> : <><dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(3,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-3 [&>div]:border-b [&>div]:border-slate-800/50 [&>div]:py-1.5 [&>div]:sm:block [&>div]:sm:border-b-0 [&>div]:sm:border-l [&>div]:sm:border-slate-800/60 [&>div]:sm:pl-3"><div><dt className="text-slate-500">Decisions</dt><dd className="font-mono tabular-nums text-slate-200">{items.length}</dd></div><div><dt className="text-slate-500"><GlossaryTerm term="fill">Fills</GlossaryTerm> quan sát</dt><dd className="font-mono tabular-nums text-slate-200">{fills}</dd></div><div><dt className="text-slate-500"><GlossaryTerm term="outcome">Outcomes</GlossaryTerm> quan sát</dt><dd className="font-mono tabular-nums text-slate-200">{outcomes}</dd></div></dl><p className="mt-1.5 text-slate-500">Thiếu fill/outcome được giữ nguyên là thiếu; UI không backfill từ dữ liệu tương lai.</p></>}
  </section>;
}

function capabilityDestination(item: TechnicalCapabilityItem): string {
  const destinations: Record<string, string> = {
    "market-data": "Thị trường",
    "data-audit": "Cảnh báo / Quản trị dữ liệu",
    "technical-indicators": "Thị trường",
    "volume-anomaly": "Rules nến",
    "candle-patterns": "Thị trường / Mẫu nến",
    "market-regime": "Thị trường",
    "smart-money": "Thị trường",
    "volume-profile": "Thị trường",
    "futures-metrics": "Thị trường",
    "liquidation-estimates": "Thị trường",
    "historical-analog": "Mẫu nến",
    "temporal-archetype": "Mẫu nến",
    "markov-transitions": "Mẫu nến",
    "rule-discovery": "Rules nến",
    confluence: "Thị trường",
    "ml-prediction": "Dự đoán",
    ensemble: "Thị trường / Dự đoán",
    "historical-replay": "Backtest",
    "forward-paper": "Paper / Nhật ký Paper BTC",
    alerts: "Cảnh báo",
  };
  return destinations[item.id] ?? "Chưa có màn chuyên biệt";
}

function CapabilityMatrix({ data }: { data: TechnicalCapabilitiesResponse | null }) {
  const [filter, setFilter] = useState("all");
  const categories = useMemo(() => [...new Set((data?.items ?? []).map((item) => item.category))].sort(), [data]);
  const items = (data?.items ?? []).filter((item) => filter === "all" || item.category === filter);
  if (!data) return <section className="rounded-md border border-slate-800 bg-slate-900/40 p-4 text-[13px] text-slate-400"><GlossaryTerm term="capability">Capability registry</GlossaryTerm> không khả dụng; chưa thể chứng minh coverage chức năng.</section>;
  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-[13px] font-semibold text-slate-200">Ma trận 20 năng lực kỹ thuật</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">Implementation readiness và evidence maturity được chấm riêng; cột màn FE cho biết nơi người dùng kiểm tra kết quả.</p></div><label className="text-[11px] text-slate-500">Nhóm <select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 min-h-[36px] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"><option value="all">Tất cả ({data.items.length})</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[860px] text-xs"><thead className="border-b border-slate-800 text-slate-500"><tr><th className="p-2 text-left font-medium">Chức năng</th><th className="p-2 text-left font-medium">Implementation</th><th className="p-2 text-left font-medium"><GlossaryTerm term="evidence-stage">Evidence stage</GlossaryTerm></th><th className="p-2 text-left font-medium"><GlossaryTerm term="evidence-target">Evidence target</GlossaryTerm></th><th className="p-2 text-left font-medium">Màn FE</th></tr></thead><tbody className="divide-y divide-slate-800/50">{items.map((item) => <tr key={item.id} className="align-top"><td className="p-2"><div className="font-medium text-slate-200">{item.name}</div><div className="mt-1 font-mono text-[10px] text-slate-500">{item.id}</div></td><td className="p-2"><span className={`rounded px-1.5 py-0.5 text-[11px] ${item.operationalStatus === "operational" ? "bg-slate-800/50 text-slate-300" : item.operationalStatus === "degraded" ? "bg-amber-950/50 text-amber-300" : "bg-rose-950/50 text-rose-300"}`}><GlossaryTerm term={item.operationalStatus}>{item.operationalStatus}</GlossaryTerm></span></td><td className="p-2 text-slate-300">{item.evidenceStage}</td><td className="p-2 text-slate-400">{item.evidenceTarget}</td><td className="p-2"><span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-slate-300">{capabilityDestination(item)}</span><details className="mt-2 text-xs text-slate-400"><summary className="cursor-pointer">Mục đích & giới hạn</summary><p className="mt-1">{item.intendedUse}</p><p className="mt-1 text-amber-300/70">{item.limitation}</p></details></td></tr>)}</tbody></table></div>
    <p className="mt-2 text-[11px] text-slate-500"><GlossaryTerm term="registry">Registry</GlossaryTerm> <span className="font-mono">{data.contractVersion}</span> · {data.symbol} · hiển thị <span className="font-mono tabular-nums">{items.length}/{data.items.length}</span></p>
  </section>;
}

function ageLabel(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3_600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)}h`;
  return `${(seconds / 86_400).toFixed(1)}d`;
}

function coverageStatusClass(status: "available" | "partial" | "unavailable"): string {
  if (status === "available") return "bg-slate-800/50 text-slate-300";
  if (status === "partial") return "bg-amber-950/50 text-amber-300";
  return "bg-rose-950/50 text-rose-300";
}

function coverageGapText(source: TimeframeAuditSummary): { text: string; hasGaps: boolean } {
  const gaps = source.gapRangeCount;
  const missing = source.missingBars;
  return {
    text: `${gaps.toLocaleString("vi-VN")} gap · thiếu ${missing.toLocaleString("vi-VN")} nến`,
    hasGaps: gaps > 0 || missing > 0 || source.pendingGapCount > 0 || source.unavailableGapCount > 0,
  };
}

function TechnicalDataCoverage({ audit, workers, error, pending }: {
  audit: DataAuditResponse | null;
  workers: WorkersHealthDto | null;
  error: string | null;
  pending: boolean;
}) {
  const summary = useMemo(() => buildTechnicalCoverageSummary(audit, workers), [audit, workers]);
  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50" aria-labelledby="technical-data-coverage-title">
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/60 px-4 py-3">
      <div className="min-w-0"><h3 id="technical-data-coverage-title" className="text-[13px] font-semibold text-slate-200">Độ phủ dữ liệu kiểm định · technical <GlossaryTerm term="coverage">coverage</GlossaryTerm></h3><p className="mt-0.5 text-xs leading-5 text-slate-500">BTCUSDT 1h/4h/1d; gaps, quality và inventory dẫn xuất được báo riêng. <GlossaryTerm term="legacy">Legacy</GlossaryTerm> không được tính vào <GlossaryTerm term="coverage">coverage</GlossaryTerm> đang hoạt động.</p></div>
      <span className="rounded bg-slate-800/40 px-2 py-1 font-mono text-[11px] tabular-nums text-slate-400">{audit ? formatDate(audit.generatedAtUtc) : pending && !error ? "đang tải…" : <GlossaryTerm term="audit">audit unavailable</GlossaryTerm>}</span>
    </div>
    {error && <div role="alert" className="mx-4 mt-3 rounded bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}
    <div className="divide-y divide-slate-800/50">
      {pending && !audit && !error ? <p className="px-4 py-3 text-xs text-slate-500">Đang tải audit — coverage chưa thể kết luận; unavailable chỉ xác nhận sau khi audit trả về.</p> : <>
      {summary.rows.map((row) => {
        const gap = row.source ? coverageGapText(row.source) : null;
        return <article key={row.timeframe} className="min-w-0 max-w-full overflow-hidden px-4 py-2.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
            <strong className="w-8 shrink-0 font-mono text-[13px] text-slate-100">{row.timeframe}</strong>
            <span className="font-mono tabular-nums text-slate-200">{row.source ? `${row.source.totalKlines.toLocaleString("vi-VN")} nến` : "—"}</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-500">{row.source ? `${formatTimeMs(row.source.minOpenTimeMs)} → ${formatTimeMs(row.source.maxOpenTimeMs)}` : ""}</span>
            <span className={`font-mono tabular-nums ${gap?.hasGaps ? "text-amber-300" : "text-slate-400"}`}>{gap?.text ?? ""}</span>
            <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${coverageStatusClass(row.availability)}`}><GlossaryTerm term={row.availability}>{row.availability}</GlossaryTerm></span>
          </div>
          {row.source ? <details className="mt-1.5">
            <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-300">Chi tiết & chẩn đoán</summary>
            <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs sm:grid-cols-[repeat(4,minmax(0,1fr))] [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:sm:block [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300 [&>dd]:sm:mt-0.5">
            <div><dt><GlossaryTerm term="coverage">Coverage</GlossaryTerm></dt><dd>{row.source.dataCoveragePct.toFixed(2)}%</dd></div>
            <div><dt><GlossaryTerm term="gap-ranges">Gap ranges</GlossaryTerm></dt><dd>{row.source.gapRangeCount.toLocaleString("vi-VN")}</dd></div>
            <div><dt><GlossaryTerm term="ledger">Ledger</GlossaryTerm></dt><dd>{row.source.gapLedgerStatus}</dd></div>
            <div><dt><GlossaryTerm term="finalized-age">Finalized age</GlossaryTerm></dt><dd>{ageLabel(row.source.quality?.latestFinalizedAgeSeconds ?? row.source.latestCandleAgeSeconds)}</dd></div>
            <div><dt><GlossaryTerm term="missing-bars">Missing bars</GlossaryTerm></dt><dd>{row.source.missingBars.toLocaleString("vi-VN")}</dd></div>
            <div><dt><GlossaryTerm term="invalid-duration">Invalid duration</GlossaryTerm></dt><dd className={(row.source.quality?.invalidDurationRows ?? 0) > 0 ? "text-rose-300" : undefined}>{row.source.quality?.invalidDurationRows?.toLocaleString("vi-VN") ?? "—"}</dd></div>
            <div><dt><GlossaryTerm term="technical-indicators">Indicators</GlossaryTerm> / <GlossaryTerm term="candle-patterns">patterns</GlossaryTerm></dt><dd>{row.source.technicalIndicators?.toLocaleString("vi-VN") ?? "—"} / {row.source.candlePatterns?.toLocaleString("vi-VN") ?? "—"}</dd></div>
            <div><dt><GlossaryTerm term="expected-bars">Expected bars</GlossaryTerm></dt><dd>{row.source.expectedBars?.toLocaleString("vi-VN") ?? "—"}</dd></div>
          </dl>
          {row.reasons.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] leading-4 text-amber-200/80">{row.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
          {row.source.derivedTables && <details className="mt-2 text-[11px] text-slate-400"><summary className="cursor-pointer text-slate-500">Pipeline inventory ({row.source.derivedTables.length})</summary><ul className="mt-1.5 space-y-1">{row.source.derivedTables.map((table) => <li key={table.table} className="flex justify-between gap-2"><span className="truncate">{table.table}</span><span className={`font-mono tabular-nums ${(table.missingRows ?? 0) > 0 ? "text-slate-300" : "text-slate-500"}`}>{table.rows.toLocaleString("vi-VN")} rows{table.missingRows == null ? "" : ` · thiếu ${table.missingRows.toLocaleString("vi-VN")}`}</span></li>)}</ul></details>}
          </details> : <p className="mt-2 text-xs text-rose-300">Không có audit row; mọi pipeline của khung này phải coi là <GlossaryTerm term="unavailable">unavailable</GlossaryTerm>.</p>}
        </article>;
      })}
      {summary.legacyTimeframes.map((row) => {
        const gap = coverageGapText(row);
        return <article key={`legacy-${row.timeframe}`} className="min-w-0 max-w-full overflow-hidden bg-slate-950/30 px-4 py-2.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
            <strong className="w-8 shrink-0 font-mono text-[13px] text-slate-400">{row.timeframe}</strong>
            <span className="rounded bg-slate-800/50 px-1.5 py-0.5 text-[11px] text-slate-400"><GlossaryTerm term="legacy">legacy</GlossaryTerm> · buffer</span>
            <span className="font-mono tabular-nums text-slate-400">{row.totalKlines.toLocaleString("vi-VN")} nến</span>
            <span className="font-mono text-[11px] tabular-nums text-slate-500">{formatTimeMs(row.minOpenTimeMs)} → {formatTimeMs(row.maxOpenTimeMs)}</span>
            <span className={`font-mono tabular-nums ${gap.hasGaps ? "text-amber-300" : "text-slate-500"}`}>{gap.text}</span>
            <span className="ml-auto shrink-0 text-[11px] text-slate-500">chỉ audit lịch sử</span>
          </div>
        </article>;
      })}
      </>}
    </div>
    <div className="grid gap-3 border-t border-slate-800/60 px-4 py-3 lg:grid-cols-2">
      <div className="min-w-0 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="pipeline">Pipeline</GlossaryTerm> <GlossaryTerm term="worker">workers</GlossaryTerm></div>{summary.technicalWorkers.length ? <ul className="mt-2 divide-y divide-slate-800/40">{summary.technicalWorkers.map((worker) => <li key={worker.name} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-slate-400"><span className="font-mono text-[10px]">{worker.name}</span><span className={worker.status === "healthy" ? "text-slate-300" : worker.status === "stale" ? "text-amber-300" : "text-rose-300"}><GlossaryTerm term={worker.status}>{worker.status}</GlossaryTerm> · age <span className="font-mono tabular-nums">{ageLabel(worker.ageSeconds)}</span></span></li>)}</ul> : <p className="mt-2 text-slate-500"><GlossaryTerm term="worker">Worker</GlossaryTerm> health chưa công bố; không suy ra <GlossaryTerm term="pipeline">pipeline</GlossaryTerm> đang chạy chỉ từ inventory.</p>}</div>
      <div className="min-w-0 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="legacy">Legacy</GlossaryTerm> & exclusions</div>{summary.legacyTimeframes.length ? <p className="mt-2 text-slate-400">{summary.legacyTimeframes.map((row) => row.timeframe).join(", ")} · chỉ giữ để audit lịch sử, không thuộc scope replay 1h/4h/1d.</p> : <p className="mt-2 text-slate-500">Không có timeframe <GlossaryTerm term="legacy">legacy</GlossaryTerm> trong phản hồi audit.</p>}<p className="mt-2 text-amber-300/80"><GlossaryTerm term="unavailable">Unavailable</GlossaryTerm> và <GlossaryTerm term="partial">partial</GlossaryTerm> vẫn là thiếu bằng chứng; UI không đổi chúng thành “đủ” bằng fallback realtime.</p></div>
    </div>
  </section>;
}

function EvidencePipelineStatus({ pipeline }: { pipeline: ResearchEvidenceCatalog["pipeline"] }) {
  return <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-slate-800 bg-slate-900/50 p-4" aria-label="Trạng thái pipeline evidence kỹ thuật">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-[13px] font-semibold text-slate-200">Descriptive evidence pipeline</h3><p className="mt-0.5 text-xs text-slate-500"><GlossaryTerm term="coverage">Coverage</GlossaryTerm> <GlossaryTerm term="artifact">artifact</GlossaryTerm> mô tả theo 1h/4h/1d; không phải xác suất dự báo.</p></div><span className={`min-w-0 break-all rounded px-1.5 py-0.5 text-[11px] font-medium ${pipeline?.state === "succeeded" && pipeline.integrityVerified ? "bg-slate-800/50 text-slate-300" : pipeline?.state === "running" ? "bg-teal-950/50 text-teal-300" : pipeline?.state === "failed" ? "bg-rose-950/50 text-rose-300" : "bg-slate-800/50 text-slate-300"}`}>{pipeline?.state ?? "not reported"}</span></div>
    {!pipeline ? <p className="mt-3 text-xs text-slate-400">Catalog chưa công bố <GlossaryTerm term="pipeline">pipeline</GlossaryTerm> metadata; UI không suy ra trạng thái từ <GlossaryTerm term="artifact">artifact</GlossaryTerm> count.</p> : <>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]"><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400"><GlossaryTerm term="integrity">integrity</GlossaryTerm> {pipeline.integrityVerified ? "verified" : "unverified"}</span><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400">running {pipeline.running ? "yes" : "no"}</span><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400"><GlossaryTerm term="lock">lock</GlossaryTerm> {pipeline.locked ? "held" : "free"}</span></div>
      <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-5 [&>div]:min-w-0 [&>div]:flex [&>div]:items-baseline [&>div]:justify-between [&>div]:gap-2 [&>div]:border-b [&>div]:border-slate-800/50 [&>div]:py-1 [&>div]:sm:block [&>div]:sm:border-b-0 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:font-mono [&_dd]:tabular-nums [&_dd]:text-slate-300"><div><dt className="text-slate-500">Started</dt><dd>{formatDate(pipeline.lastStartedAtUtc)}</dd></div><div><dt className="text-slate-500">Succeeded</dt><dd>{formatDate(pipeline.lastSucceededAtUtc)}</dd></div><div><dt className="text-slate-500">Failed</dt><dd>{formatDate(pipeline.lastFailedAtUtc)}</dd></div><div><dt className="text-slate-500">Updated</dt><dd>{formatDate(pipeline.updatedAtUtc)}</dd></div><div><dt className="text-slate-500"><GlossaryTerm term="stale">Stale after</GlossaryTerm></dt><dd>{formatDate(pipeline.staleAfterUtc)}</dd></div></dl>
      {pipeline.lastError && <p role="alert" className="mt-3 max-w-full break-words rounded bg-rose-950/30 p-2 text-xs text-rose-200 [overflow-wrap:anywhere]">Lỗi gần nhất: {pipeline.lastError}</p>}
      {pipeline.timeframes.length ? <div className="mt-3 divide-y divide-slate-800/50 border-t border-slate-800/60">{pipeline.timeframes.map((row) => <article key={row.timeframe} className="min-w-0 max-w-full overflow-hidden py-2.5 text-xs"><div className="flex min-w-0 items-baseline justify-between gap-2"><strong className="shrink-0 font-mono text-[13px] text-slate-100">{row.timeframe}</strong><span className={`min-w-0 break-words text-right ${row.semanticVerification ? "text-slate-300" : "text-rose-300"}`}><GlossaryTerm term="semantic-verification">{row.semanticVerification ? "semantic verified" : "semantic failed"}</GlossaryTerm></span></div><dl className="mt-1.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs [&>dt]:py-1 [&>dt]:text-slate-500 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:py-1 [&>dd]:text-right [&>dd]:font-mono [&>dd]:tabular-nums [&>dd]:text-slate-300"><dt>Stored</dt><dd>{row.stored.toLocaleString("vi-VN")}</dd><dt><GlossaryTerm term="eligible">Eligible</GlossaryTerm></dt><dd>{row.eligible.toLocaleString("vi-VN")}</dd><dt><GlossaryTerm term="excluded">Excluded</GlossaryTerm></dt><dd>{row.excluded.toLocaleString("vi-VN")}</dd><dt><GlossaryTerm term="realized-horizon">Realized horizon</GlossaryTerm></dt><dd>{row.realizedAtMaxHorizon.toLocaleString("vi-VN")}</dd><dt><GlossaryTerm term="cutoff">Cutoff</GlossaryTerm></dt><dd>{formatTimeMs(row.cutoffMs)}</dd></dl><div title={row.manifestSha256} className="mt-1.5 max-w-full truncate font-mono text-[10px] text-slate-500">{row.manifestSha256}</div></article>)}</div> : <p className="mt-3 break-words text-xs text-slate-400"><GlossaryTerm term="pipeline">Pipeline</GlossaryTerm> không công bố <GlossaryTerm term="coverage">coverage</GlossaryTerm> theo timeframe ở trạng thái này.</p>}
    </>}
  </section>;
}

export function ResearchEvidenceScreen() {
  const [section, setSection] = useState<Section>("overview");
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof getResearchEvidenceCatalog>> | null>(null);
  const [backtests, setBacktests] = useState<BacktestRunSummary[] | null>(null);
  const [observations, setObservations] = useState<PaperObservationListResponse | null>(null);
  const [capabilities, setCapabilities] = useState<TechnicalCapabilitiesResponse | null>(null);
  const [dataAudit, setDataAudit] = useState<DataAuditResponse | null>(null);
  const [workers, setWorkers] = useState<WorkersHealthDto | null>(null);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ResearchEvidenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRequestRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCoverageError(null);
    const [catalogResult, backtestResult, observationResult, capabilityResult, auditResult, workersResult] = await Promise.allSettled([
      getResearchEvidenceCatalog(AbortSignal.timeout(EVIDENCE_READ_TIMEOUT_MS)),
      getBacktestRuns("BTCUSDT", undefined, 20, false),
      getPaperObservations("BTCUSDT", 100),
      getTechnicalCapabilities(AbortSignal.timeout(EVIDENCE_READ_TIMEOUT_MS)),
      getDataAudit("BTCUSDT", AbortSignal.timeout(EVIDENCE_READ_TIMEOUT_MS), true),
      getHealthWorkers(AbortSignal.timeout(EVIDENCE_READ_TIMEOUT_MS)),
    ]);
    if (catalogResult.status === "fulfilled") setCatalog(catalogResult.value);
    else {
      setCatalog(null);
      setError(catalogResult.reason instanceof Error ? catalogResult.reason.message : "Không tải được evidence catalog.");
    }
    setBacktests(backtestResult.status === "fulfilled" ? backtestResult.value.items : null);
    setObservations(observationResult.status === "fulfilled" ? observationResult.value : null);
    setCapabilities(capabilityResult.status === "fulfilled" ? capabilityResult.value : null);
    setDataAudit(auditResult.status === "fulfilled" ? auditResult.value : null);
    setWorkers(workersResult.status === "fulfilled" ? workersResult.value : null);
    if (auditResult.status === "rejected") {
      setCoverageError(auditResult.reason instanceof Error ? auditResult.reason.message : "Không tải được Data Audit.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const visibleItems = useMemo(() => {
    const items = catalog?.items ?? [];
    return section === "overview" ? items : items.filter((item) => item.kind === section);
  }, [catalog, section]);

  const selectArtifact = useCallback(async (item: ResearchEvidenceSummary) => {
    const requestId = ++detailRequestRef.current;
    setSelectedId(item.id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const nextDetail = await getResearchEvidenceDetail(item.id, AbortSignal.timeout(EVIDENCE_READ_TIMEOUT_MS));
      if (requestId === detailRequestRef.current) setDetail(nextDetail);
    }
    catch (cause) {
      if (requestId === detailRequestRef.current) setDetailError(cause instanceof Error ? cause.message : "Không đọc được artifact.");
    }
    finally {
      if (requestId === detailRequestRef.current) setDetailLoading(false);
    }
  }, []);

  // Conditions link to the dossier at manifest level: the catalog artifact id IS
  // the bundle manifest sha256, so we resolve it against the loaded catalog and
  // reuse the same selectArtifact → detail pipeline. No new detail view.
  const openDossierByManifest = useCallback((manifestSha256: string) => {
    const item = catalog?.items.find((entry) => entry.id === manifestSha256 || entry.manifestSha256 === manifestSha256) ?? null;
    if (item) {
      void selectArtifact(item);
      return;
    }
    detailRequestRef.current += 1;
    setSelectedId(null);
    setDetail(null);
    setDetailLoading(false);
    setDetailError("Chưa có artifact nào trong catalog khớp manifest này; không mở hồ sơ thay thế.");
  }, [catalog, selectArtifact]);

  return <div className="space-y-3">
    <header>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold flex items-center gap-2 text-slate-100"><FileCheck2 className="h-4 w-4 text-slate-400"/>Nghiên cứu có thể kiểm chứng</h2>
          <p className="hidden sm:block truncate text-xs text-slate-500">Mỗi kết luận nối được với <GlossaryTerm term="snapshot">snapshot</GlossaryTerm>, <GlossaryTerm term="protocol">protocol</GlossaryTerm>, <GlossaryTerm term="baseline">baseline</GlossaryTerm>, <GlossaryTerm term="coverage">coverage</GlossaryTerm> và hash <GlossaryTerm term="artifact">artifact</GlossaryTerm>.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="shrink-0 inline-flex min-h-10 items-center gap-2 rounded px-2 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}/>Làm mới</button>
      </div>
      <div className="mt-1 flex gap-4 overflow-x-auto border-b border-slate-800/60 text-[13px]" role="tablist" aria-label="Nhóm bằng chứng">{SECTIONS.map((item) => <button type="button" role="tab" aria-selected={section === item.key} key={item.key} onClick={() => { detailRequestRef.current += 1; setDetailLoading(false); setDetailError(null); setSection(item.key); setSelectedId(null); setDetail(null); }} className={`shrink-0 border-b-2 px-0.5 py-2.5 font-medium transition-colors ${section === item.key ? "border-teal-400 text-teal-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>{item.label}</button>)}</div>
    </header>

    {error && <div role="alert" className="rounded-md border border-rose-900/60 bg-rose-950/20 p-4 text-[13px] text-rose-300">Evidence API chưa sẵn sàng: {error}. Các vùng economic/forward bên dưới vẫn giữ trạng thái độc lập.</div>}
    {catalog && catalog.integrity.rejectedArtifactCount > 0 && <div role="alert" className="rounded-md border border-amber-900/60 bg-amber-950/15 px-4 py-2.5 text-xs text-amber-200">Có {catalog.integrity.rejectedArtifactCount.toLocaleString("vi-VN")} <GlossaryTerm term="artifact">artifact</GlossaryTerm> bị catalog loại do <GlossaryTerm term="integrity">integrity</GlossaryTerm>/contract không đạt; chúng không được dùng làm bằng chứng. Đã publish {catalog.integrity.publishedArtifactCount.toLocaleString("vi-VN")}/{catalog.integrity.scannedArtifactCount.toLocaleString("vi-VN")} <GlossaryTerm term="artifact">artifact</GlossaryTerm> đã quét.</div>}
    {section === "overview" && <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-slate-800/60 pb-2 text-[11px] text-slate-500"><span><strong className="font-mono text-sm font-semibold tabular-nums text-slate-100">{catalog?.items.length ?? 0}</strong> <GlossaryTerm term="artifact">artifact</GlossaryTerm> đã kiểm kê</span><span><strong className="font-mono text-sm font-semibold tabular-nums text-slate-100">{catalog?.items.filter((item) => item.integrityVerified).length ?? 0}</strong> <GlossaryTerm term="integrity">hash hợp lệ</GlossaryTerm></span><span><strong className="font-mono text-sm font-semibold tabular-nums text-slate-100">{catalog?.items.filter((item) => item.status === "supported" && item.integrityVerified && (item.tier === "validated-predictive" || item.tier === "predictive")).length ?? 0}</strong> <GlossaryTerm term="predictive">artifact có predictive support</GlossaryTerm></span><span><strong className="font-mono text-sm font-semibold tabular-nums text-slate-100">{observations?.items.length ?? 0}</strong> <GlossaryTerm term="forward-evidence">forward decisions</GlossaryTerm></span></div>}
    {(section === "overview" || section === "economic") && <EconomicStatus runs={backtests}/>}
    {(section === "overview" || section === "forward") && <ForwardStatus observations={observations}/>}

    <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <section className="min-w-0 self-start overflow-hidden rounded-md border border-slate-800 bg-slate-900/50" aria-label="Danh sách artifact">
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-800/60 px-4 py-2.5">
          <h3 className="text-[13px] font-semibold text-slate-200">Hồ sơ bằng chứng (Dossier)</h3>
          <span className="rounded bg-slate-800/40 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-400">{visibleItems.length}</span>
        </div>
        {loading && !catalog && <div className="px-4 py-4 text-[13px] text-slate-400">Đang tải catalog…</div>}
        {!loading && visibleItems.length === 0 && <div className="px-4 py-4 text-xs text-slate-400">Chưa có <GlossaryTerm term="artifact">artifact</GlossaryTerm> cho tầng này — hệ thống không nâng cấp evidence bằng suy đoán.</div>}
        <div className="divide-y divide-slate-800/50">{visibleItems.map((item) => <ArtifactCard key={item.id} item={item} selected={selectedId === item.id} onSelect={() => void selectArtifact(item)}/>)}</div>
        {catalog && <p className="border-t border-slate-800/60 px-4 py-2 text-[11px] text-slate-500"><GlossaryTerm term="research-contract">Contract</GlossaryTerm> <span className="font-mono">{catalog.contractVersion}</span> · catalog <span className="font-mono tabular-nums">{formatDate(catalog.generatedAtUtc)}</span></p>}
      </section>
      <EvidenceDetailPanel detail={detail} loading={detailLoading} error={detailError}/>
    </div>

    {(section === "overview" || section === "event") && <CurrentConditionsPanel onOpenDossier={openDossierByManifest}/>}

    {section === "overview" && <div className="space-y-3 border-t border-slate-800/60 pt-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vận hành & độ phủ dữ liệu</h3>
      <TechnicalDataCoverage audit={dataAudit} workers={workers} error={coverageError} pending={loading}/>
      <DataQualityAdministration/>
      <EvidencePipelineStatus pipeline={catalog?.pipeline ?? null}/>
      <TechnicalEvidenceAdministration/>
      <CausalSmartMoneyAdministration/>
      <CapabilityMatrix data={capabilities}/>
    </div>}
  </div>;
}
