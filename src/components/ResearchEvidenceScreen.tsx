"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
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
  if (tier === "live") return "bg-emerald-950/40 text-emerald-300";
  if (tier === "forward-observed") return "bg-teal-950/40 text-teal-300";
  if (tier === "validated-predictive") return "bg-slate-800/40 text-slate-300";
  if (tier === "retrospective-selection-aware") return "bg-slate-800/40 text-slate-300";
  if (tier === "predictive") return "bg-slate-800/40 text-slate-300";
  if (tier === "economic-simulation") return "bg-slate-800/40 text-slate-300";
  if (tier === "unavailable") return "bg-slate-800/40 text-slate-400";
  return "bg-slate-800/40 text-slate-400";
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
    <div className="rounded-lg bg-slate-950/60 p-3">
      <div className="text-xs font-medium text-slate-400">{metric.label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-100 tabular-nums">{formatValue(metric.value, metric.unit)}</div>
      <div className="mt-1 space-y-0.5 text-xs text-slate-400">
        <div className="font-mono text-[9px] text-slate-400">{metric.name}</div>
        {metric.baselineValue != null && <div><GlossaryTerm term="baseline">Baseline</GlossaryTerm>: {formatValue(metric.baselineValue, metric.unit)}</div>}
        {metric.lift != null && <div><GlossaryTerm term="lift">Lift</GlossaryTerm>: {formatValue(metric.lift, metric.unit)}</div>}
        {(metric.intervalLow != null || metric.intervalHigh != null) && (
          <div><GlossaryTerm term="interval">{descriptive ? "Khoảng thống kê" : "Khoảng bất định"}</GlossaryTerm>: [{formatValue(metric.intervalLow, metric.unit)}, {formatValue(metric.intervalHigh, metric.unit)}]</div>
        )}
        {metric.sampleCount != null && <div><GlossaryTerm term="n">n</GlossaryTerm> = {metric.sampleCount.toLocaleString("vi-VN")}</div>}
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
      className={`w-full rounded-xl border p-5 text-left transition-colors ${selected ? "border-teal-700 bg-teal-950/20" : "border-slate-800 bg-slate-900/60 hover:border-slate-700"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-slate-400">{evidenceSectionLabel(item.kind)}</div>
          <h3 className="mt-1 font-semibold text-slate-100">{item.title}</h3>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${tierClass(item.tier)}`}>{TIER_LABELS[item.tier]}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>{item.symbol}{item.timeframe ? ` · ${item.timeframe}` : ""}</span>
        <span title={item.id} className="font-mono text-slate-400">{shortHash(item.id)}{item.generatedAtUtc ? ` · ${formatDate(item.generatedAtUtc)}` : ""}</span>
        <span className="rounded bg-slate-800/40 px-1.5 py-0.5 text-slate-400">kết luận: {item.status}</span>
        <span className={item.integrityVerified ? "text-emerald-400" : "text-rose-400"}>
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
    <details className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-200">{title} ({rows.length.toLocaleString("vi-VN")})</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="border-b border-slate-800 text-slate-400"><tr>{keys.map((key) => <th key={key} className="p-2 text-left">{key}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-800/50">{rows.slice(0, 100).map((row, index) => (
            <tr key={index}>
              {keys.map((key) => <td key={key} className="max-w-48 truncate p-2 font-mono text-slate-400">{typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "—")}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length > 100 && <p className="mt-2 text-xs text-slate-400">UI chỉ hiển thị 100 dòng đầu; <GlossaryTerm term="artifact">artifact</GlossaryTerm> gốc giữ toàn bộ.</p>}
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
  if (loading) return <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">Đang kiểm tra và đọc <GlossaryTerm term="artifact">artifact</GlossaryTerm>…</div>;
  if (error) return <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/30 p-5 text-sm text-rose-300">{error}</div>;
  if (!detail) return <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">Chọn một <GlossaryTerm term="artifact">artifact</GlossaryTerm> để xem chuỗi bằng chứng.</div>;
  const descriptive = detail.tier === "descriptive";
  const snapshotArtifact = detail.artifacts.find((artifact) => artifact.role === "datasetSnapshot" || artifact.role === "snapshot") ?? null;
  const predictionsArtifact = detail.artifacts.find((artifact) => artifact.role === "rowPredictions" || artifact.role === "ledger") ?? null;
  const predictionRowCount = detail.dataset?.predictionRowCount ?? predictionsArtifact?.rowCount ?? null;
  const predictionsSha256 = detail.dataset?.predictionsSha256 ?? predictionsArtifact?.sha256 ?? null;
  const immutable = detail.dataset?.immutable
    ?? (detail.integrityVerified && snapshotArtifact && predictionsArtifact ? true : null);
  return (
    <article className="min-w-0 space-y-4" aria-label={`Hồ sơ bằng chứng ${detail.title}`}>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-400">Hồ sơ kết luận</p>
            <h2 className="mt-1 text-lg font-bold text-slate-100">{detail.title}</h2>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tierClass(detail.tier)}`}><GlossaryTerm term={detail.tier}>{TIER_LABELS[detail.tier]}</GlossaryTerm></span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-slate-950/50 p-3"><div className="text-xs text-slate-400">Câu hỏi nghiên cứu</div><p className="mt-1 text-sm text-slate-300">{detail.question ?? detail.hypothesis ?? <><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa khai báo câu hỏi nghiên cứu.</>}</p></div>
          <div className="rounded-lg bg-slate-950/50 p-3"><div className="text-xs text-slate-400">Kết luận được phép</div><p className="mt-1 text-sm text-slate-300">{detail.conclusion ?? detail.summary}</p></div>
        </div>
        {descriptive && <div className="mt-3 rounded-lg bg-slate-800/40 p-3 text-xs leading-5 text-slate-300">Đây là bằng chứng mô tả các sự kiện đã quan sát. Giá trị và khoảng bên dưới không phải xác suất dự báo, tín hiệu giao dịch hay bằng chứng <GlossaryTerm term="pnl">PnL</GlossaryTerm>.</div>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Database className="h-4 w-4 text-slate-400" /> <GlossaryTerm term="snapshot">Snapshot</GlossaryTerm> dữ liệu</h3>
          {detail.dataset ? <dl className="mt-3 grid grid-cols-2 gap-2 text-xs [&>dd]:min-w-0 [&>dd]:break-words">
            <dt className="text-slate-400">Nguồn</dt><dd className="text-right text-slate-300">{detail.dataset.source ?? "—"}</dd>
            <dt className="text-slate-400">Số dòng</dt><dd className="text-right text-slate-300">{detail.dataset.rowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt className="text-slate-400">{descriptive ? "Dòng event / ledger" : "Prediction rows"}</dt><dd className="text-right text-slate-300">{predictionRowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt className="text-slate-400">Quyết định đầu</dt><dd className="text-right text-slate-300">{detail.dataset.startTimeUtc ? formatDate(detail.dataset.startTimeUtc) : formatTimeMs(detail.dataset.firstDecisionTimeMs)}</dd>
            <dt className="text-slate-400">Quyết định cuối / <GlossaryTerm term="cutoff">cutoff</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.dataset.cutoffTimeUtc ? formatDate(detail.dataset.cutoffTimeUtc) : detail.dataset.endTimeUtc ? formatDate(detail.dataset.endTimeUtc) : formatTimeMs(detail.dataset.lastDecisionTimeMs)}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="sha256">Snapshot hash</GlossaryTerm></dt><dd title={detail.dataset.snapshotSha256 ?? undefined} className="text-right font-mono text-slate-400">{shortHash(detail.dataset.snapshotSha256)}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="sha256">Predictions hash</GlossaryTerm></dt><dd title={predictionsSha256 ?? undefined} className="text-right font-mono text-slate-400">{shortHash(predictionsSha256)}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="immutable">Bất biến</GlossaryTerm></dt><dd className="text-right text-slate-300">{immutable == null ? "Chưa khai báo" : immutable ? "Có" : "Không"}</dd>
          </dl> : <p className="mt-3 text-xs text-slate-400"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa cung cấp <GlossaryTerm term="snapshot">snapshot</GlossaryTerm> dữ liệu có thể truy nguyên.</p>}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FlaskConical className="h-4 w-4 text-slate-400" /> <GlossaryTerm term="protocol">Protocol</GlossaryTerm></h3>
          {detail.protocol ? <dl className="mt-3 grid grid-cols-2 gap-2 text-xs [&>dd]:min-w-0 [&>dd]:break-words">
            <dt className="text-slate-400"><GlossaryTerm term="evaluator">Evaluator</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.name ?? detail.protocol.version ?? "—"}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="chronological-oos">Chronological OOS</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.chronologicalOos == null ? "Chưa khai báo" : detail.protocol.chronologicalOos ? "Có" : "Không"}</dd>
            <dt className="text-slate-400">Số <GlossaryTerm term="fold">fold</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.foldCount ?? detail.coverage?.foldCount ?? "—"}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="decision-time">Decision time</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.decisionTime ?? "—"}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="outcome-basis">Outcome basis</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.outcomePriceBasis ?? "—"}</dd>
            <dt className="text-slate-400"><GlossaryTerm term="multiple-testing">Multiple testing</GlossaryTerm></dt><dd className="text-right text-slate-300">{detail.protocol.multipleTesting ?? "—"}</dd>
          </dl> : <p className="mt-3 text-xs text-slate-400"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa khai báo <GlossaryTerm term="protocol">protocol</GlossaryTerm>.</p>}
        </section>
      </div>

      {detail.artifacts.length > 0 && <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><FileCheck2 className="h-4 w-4 text-slate-400" /> <GlossaryTerm term="immutable">Immutable</GlossaryTerm> bundle <GlossaryTerm term="artifact">artifacts</GlossaryTerm></h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">{detail.artifacts.map((artifact) => <div key={artifact.role} className="rounded-lg bg-slate-950/60 p-3 text-xs"><div className="font-semibold text-slate-200">{artifact.role}</div><div className="mt-1 text-slate-400">{artifact.rowCount == null ? "Không áp dụng số dòng" : `${artifact.rowCount.toLocaleString("vi-VN")} dòng`} · {artifact.bytes.toLocaleString("vi-VN")} bytes</div><div title={artifact.sha256} className="mt-2 font-mono text-[10px] text-slate-400">{shortHash(artifact.sha256)}</div></div>)}</div>
      </section>}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-emerald-400" /> {descriptive ? <>Thống kê mô tả, <GlossaryTerm term="coverage">coverage</GlossaryTerm> và bất định</> : <>Kết quả, <GlossaryTerm term="baseline">baseline</GlossaryTerm> và bất định</>}</h3>
        {detail.metrics.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{detail.metrics.map((metric, index) => <MetricCard key={`${metric.name}-${index}`} metric={metric} descriptive={descriptive} />)}</div> : <p className="mt-3 text-xs text-slate-400">Không có <GlossaryTerm term="metric">metric</GlossaryTerm> định lượng trong <GlossaryTerm term="artifact">artifact</GlossaryTerm>.</p>}
        {detail.uncertainty.length > 0 && <div className="mt-3 rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300">{descriptive ? "Khoảng thống kê mô tả" : <GlossaryTerm term="interval">Uncertainty / interval</GlossaryTerm>}</div><ul className="mt-2 space-y-1 text-slate-400">{detail.uncertainty.map((item) => <li key={item.name}><span className="break-all font-mono text-slate-300">{item.name}</span>: [{formatValue(item.lower)}, {formatValue(item.upper)}]{item.confidenceLevel != null ? ` · mức interval ${(item.confidenceLevel * 100).toFixed(1)}%` : ""}{item.familywise ? <> · <GlossaryTerm term="familywise">familywise-adjusted</GlossaryTerm></> : ""}</li>)}</ul>{descriptive && <p className="mt-2 text-amber-300/80">Mức interval mô tả độ bất định của thống kê lịch sử; không phải xác suất sự kiện tương lai.</p>}</div>}
        {detail.findings.length > 0 && <div className="mt-3 overflow-x-auto rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300">Kết luận theo trial / nhóm</div><table className="mt-2 w-full min-w-[640px]"><thead className="border-b border-slate-800 text-slate-400"><tr><th className="p-2 text-left">Finding</th><th className="p-2 text-left">Trạng thái</th><th className="p-2 text-right">Giá trị</th><th className="p-2 text-right">Khoảng</th><th className="p-2 text-right"><GlossaryTerm term="n">n</GlossaryTerm></th></tr></thead><tbody className="divide-y divide-slate-800/50">{detail.findings.map((finding) => <tr key={finding.id}><td className="p-2"><div className="text-slate-300">{finding.label}</div><div className="font-mono text-[10px] text-slate-400">{finding.metricName}</div></td><td className="p-2 text-slate-400">{finding.status}</td><td className="p-2 text-right font-mono text-slate-300">{formatValue(finding.value)}</td><td className="p-2 text-right font-mono text-slate-400">[{formatValue(finding.lower)}, {formatValue(finding.upper)}]</td><td className="p-2 text-right text-slate-400">{finding.sampleSize?.toLocaleString("vi-VN") ?? "—"}</td></tr>)}</tbody></table></div>}
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="baseline">Baselines</GlossaryTerm></div>{detail.baselines.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-400">{detail.baselines.map((baseline) => <li key={baseline.id}>{baseline.name}{baseline.description ? ` — ${baseline.description}` : ""}</li>)}</ul> : <p className="mt-2 text-slate-400">Chưa khai báo <GlossaryTerm term="baseline">baseline</GlossaryTerm>.</p>}</div>
          <div className="rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="coverage">Coverage</GlossaryTerm> & <GlossaryTerm term="excluded">exclusions</GlossaryTerm></div><p className="mt-2 text-slate-400">Evaluated {detail.coverage?.evaluatedRows?.toLocaleString("vi-VN") ?? "—"} / <GlossaryTerm term="eligible">eligible</GlossaryTerm> {detail.coverage?.eligibleRows?.toLocaleString("vi-VN") ?? "—"} · ratio {detail.coverage?.ratio == null ? "—" : `${(detail.coverage.ratio * 100).toFixed(2)}%`} · <GlossaryTerm term="fold">folds</GlossaryTerm> {detail.coverage?.foldCount ?? "—"}</p><p className="mt-2 text-amber-300/80">Các trường hợp loại trừ chỉ được coi là đã công bố khi xuất hiện trong limitations/<GlossaryTerm term="protocol">protocol</GlossaryTerm> của <GlossaryTerm term="artifact">artifact</GlossaryTerm>; UI không tự suy diễn phần còn thiếu.</p></div>
        </div>
      </section>

      {detail.evidenceProfiles && <EvidenceProfilesPanel profiles={detail.evidenceProfiles} />}
      {detail.kind === "event" && detail.tier === "descriptive" && (
        <StatisticalEvidencePanel evidence={detail.statisticalEvidence} audit={detail.sensitivityAudit} />
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-amber-900/70 bg-amber-950/20 px-4 py-2.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Giới hạn</h3>
          {detail.limitations.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/70">{detail.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-xs text-amber-200/70"><GlossaryTerm term="artifact">Artifact</GlossaryTerm> chưa công bố giới hạn.</p>}
        </div>
        <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/20 px-4 py-2.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" /> <GlossaryTerm term="provenance">Provenance</GlossaryTerm> & <GlossaryTerm term="integrity">integrity</GlossaryTerm></h3>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-2 text-xs"><dt className="text-slate-400">Report</dt><dd title={detail.provenance.reportSha256 ?? undefined} className="truncate text-right font-mono text-slate-300">{shortHash(detail.provenance.reportSha256)}</dd><dt className="text-slate-400"><GlossaryTerm term="manifest">Manifest</GlossaryTerm></dt><dd title={detail.provenance.manifestSha256 ?? undefined} className="truncate text-right font-mono text-slate-300">{shortHash(detail.provenance.manifestSha256)}</dd><dt className="text-slate-400"><GlossaryTerm term="evaluator">Evaluator</GlossaryTerm></dt><dd title={detail.provenance.evaluatorSha256 ?? undefined} className="truncate text-right font-mono text-slate-300">{shortHash(detail.provenance.evaluatorSha256)}</dd><dt className="text-slate-400"><GlossaryTerm term="research-contract">Research contract</GlossaryTerm></dt><dd title={detail.provenance.researchContractSha256 ?? undefined} className="truncate text-right font-mono text-slate-300">{shortHash(detail.provenance.researchContractSha256)}</dd><dt className="text-slate-400">Git</dt><dd className="truncate text-right font-mono text-slate-300">{detail.provenance.codeVersion ?? "—"}{detail.provenance.gitDirty === true ? " (dirty)" : detail.provenance.gitDirty === false ? " (clean)" : ""}</dd><dt className="text-slate-400">Generated</dt><dd className="text-right text-slate-300">{formatDate(detail.provenance.generatedAtUtc)}</dd></dl>
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
  return <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-xs">
    <h3 className="font-semibold text-slate-200"><GlossaryTerm term="economic-simulation">Economic evidence · historical simulation</GlossaryTerm></h3>
    {!runs ? <p className="mt-2 text-slate-400">Endpoint backtest không khả dụng; không suy diễn <GlossaryTerm term="pnl">PnL</GlossaryTerm>.</p> : !latest ? <p className="mt-2 text-slate-400">Chưa có backtest hợp lệ theo <GlossaryTerm term="research-contract">research contract</GlossaryTerm>.</p> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><div>Trades<br/><b>{latest.totalTrades}</b></div><div>Return<br/><b>{latest.totalReturnPct.toFixed(2)}%</b></div><div><GlossaryTerm term="sharpe">Sharpe</GlossaryTerm><br/><b>{latest.sharpeRatio.toFixed(2)}</b></div><div><GlossaryTerm term="drawdown">Drawdown</GlossaryTerm><br/><b>{latest.maxDrawdownPct.toFixed(2)}%</b></div><p className="col-span-full text-slate-400">{latest.modelName} · {latest.timeframe} · mô phỏng lịch sử, chưa phải forward/live.</p></div>}
  </section>;
}

function ForwardStatus({ observations }: { observations: PaperObservationListResponse | null }) {
  const items = observations?.items ?? [];
  const fills = items.filter((item) => item.fillPrice != null).length;
  const outcomes = items.filter((item) => item.outcomeReturn != null).length;
  return <section className="rounded-xl border border-teal-900/70 bg-teal-950/20 p-5 text-xs">
    <h3 className="font-semibold text-teal-200"><GlossaryTerm term="forward-journal">Forward evidence · BTCUSDT 4h journal</GlossaryTerm></h3>
    {!observations ? <p className="mt-2 text-slate-400">Forward journal không khả dụng; không dùng replay thay thế.</p> : !observations.available ? <p className="mt-2 text-slate-300">{observations.reason ?? "Forward journal chưa khả dụng."}</p> : <div className="mt-3 grid grid-cols-3 gap-2"><div>Decisions<br/><b>{items.length}</b></div><div><GlossaryTerm term="fill">Fills</GlossaryTerm> quan sát<br/><b>{fills}</b></div><div><GlossaryTerm term="outcome">Outcomes</GlossaryTerm> quan sát<br/><b>{outcomes}</b></div><p className="col-span-full text-slate-400">Thiếu fill/outcome được giữ nguyên là thiếu; UI không backfill từ dữ liệu tương lai.</p></div>}
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
  if (!data) return <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400"><GlossaryTerm term="capability">Capability registry</GlossaryTerm> không khả dụng; chưa thể chứng minh coverage chức năng.</section>;
  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-100">Ma trận 20 năng lực kỹ thuật</h3><p className="mt-1 text-xs text-slate-400">Implementation readiness và evidence maturity được chấm riêng; cột màn FE cho biết nơi người dùng kiểm tra kết quả.</p></div><label className="text-xs text-slate-400">Nhóm <select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-300"><option value="all">Tất cả ({data.items.length})</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[860px] text-xs"><thead className="border-b border-slate-800 text-slate-400"><tr><th className="p-2 text-left">Chức năng</th><th className="p-2 text-left">Implementation</th><th className="p-2 text-left"><GlossaryTerm term="evidence-stage">Evidence stage</GlossaryTerm></th><th className="p-2 text-left"><GlossaryTerm term="evidence-target">Evidence target</GlossaryTerm></th><th className="p-2 text-left">Màn FE</th></tr></thead><tbody className="divide-y divide-slate-800/60">{items.map((item) => <tr key={item.id} className="align-top"><td className="p-2"><div className="font-medium text-slate-200">{item.name}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{item.id}</div></td><td className="p-2"><span className={`rounded px-1.5 py-0.5 text-xs ${item.operationalStatus === "operational" ? "bg-emerald-950/50 text-emerald-300" : item.operationalStatus === "degraded" ? "bg-amber-950/50 text-amber-300" : "bg-rose-950/50 text-rose-300"}`}><GlossaryTerm term={item.operationalStatus}>{item.operationalStatus}</GlossaryTerm></span></td><td className="p-2 text-slate-300">{item.evidenceStage}</td><td className="p-2 text-slate-400">{item.evidenceTarget}</td><td className="p-2"><span className="rounded bg-slate-800 px-2 py-1 text-slate-300">{capabilityDestination(item)}</span><details className="mt-2 text-xs text-slate-400"><summary className="cursor-pointer">Mục đích & giới hạn</summary><p className="mt-1">{item.intendedUse}</p><p className="mt-1 text-amber-300/70">{item.limitation}</p></details></td></tr>)}</tbody></table></div>
    <p className="mt-2 text-xs text-slate-400"><GlossaryTerm term="registry">Registry</GlossaryTerm> {data.contractVersion} · {data.symbol} · hiển thị {items.length}/{data.items.length}</p>
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
  if (status === "available") return "text-slate-400";
  if (status === "partial") return "bg-amber-950/40 text-amber-300";
  return "bg-rose-950/50 text-rose-300";
}

function TechnicalDataCoverage({ audit, workers, error }: {
  audit: DataAuditResponse | null;
  workers: WorkersHealthDto | null;
  error: string | null;
}) {
  const summary = useMemo(() => buildTechnicalCoverageSummary(audit, workers), [audit, workers]);
  return <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="technical-data-coverage-title">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 id="technical-data-coverage-title" className="text-sm font-semibold text-slate-100">Data Administration · technical <GlossaryTerm term="coverage">coverage</GlossaryTerm></h3><p className="mt-1 text-xs leading-5 text-slate-400">BTCUSDT 1h/4h/1d; gaps, quality và inventory dẫn xuất được báo riêng. <GlossaryTerm term="legacy">Legacy</GlossaryTerm> không được tính vào <GlossaryTerm term="coverage">coverage</GlossaryTerm> đang hoạt động.</p></div>
      <span className="rounded bg-slate-800/40 px-2 py-1 font-mono text-xs text-slate-400">{audit ? formatDate(audit.generatedAtUtc) : <GlossaryTerm term="audit">audit unavailable</GlossaryTerm>}</span>
    </div>
    {error && <div role="alert" className="mt-3 rounded-lg bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {summary.rows.map((row) => <article key={row.timeframe} className="rounded-lg bg-slate-950/50 p-3">
        <div className="flex items-center justify-between gap-2"><strong className="text-sm text-slate-100">{row.timeframe}</strong><span className={`rounded px-2 py-0.5 text-xs font-bold ${coverageStatusClass(row.availability)}`}><GlossaryTerm term={row.availability}>{row.availability}</GlossaryTerm></span></div>
        {row.source ? <dl className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          <dt className="text-slate-400"><GlossaryTerm term="coverage">Coverage</GlossaryTerm></dt><dd className="text-right text-slate-300">{row.source.dataCoveragePct.toFixed(2)}%</dd>
          <dt className="text-slate-400"><GlossaryTerm term="missing-bars">Missing bars</GlossaryTerm></dt><dd className="text-right text-slate-300">{row.source.missingBars.toLocaleString("vi-VN")}</dd>
          <dt className="text-slate-400"><GlossaryTerm term="gap-ranges">Gap ranges</GlossaryTerm></dt><dd className="text-right text-slate-300">{row.source.gapRangeCount.toLocaleString("vi-VN")}</dd>
          <dt className="text-slate-400"><GlossaryTerm term="ledger">Ledger</GlossaryTerm></dt><dd className="text-right text-slate-300">{row.source.gapLedgerStatus}</dd>
          <dt className="text-slate-400"><GlossaryTerm term="finalized-age">Finalized age</GlossaryTerm></dt><dd className="text-right text-slate-300">{ageLabel(row.source.quality?.latestFinalizedAgeSeconds ?? row.source.latestCandleAgeSeconds)}</dd>
          <dt className="text-slate-400"><GlossaryTerm term="invalid-duration">Invalid duration</GlossaryTerm></dt><dd className={`text-right ${(row.source.quality?.invalidDurationRows ?? 0) > 0 ? "text-rose-300" : "text-slate-300"}`}>{row.source.quality?.invalidDurationRows?.toLocaleString("vi-VN") ?? "—"}</dd>
          <dt className="text-slate-400"><GlossaryTerm term="technical-indicators">Indicators</GlossaryTerm> / <GlossaryTerm term="candle-patterns">patterns</GlossaryTerm></dt><dd className="text-right text-slate-300">{row.source.technicalIndicators?.toLocaleString("vi-VN") ?? "—"} / {row.source.candlePatterns?.toLocaleString("vi-VN") ?? "—"}</dd>
        </dl> : <p className="mt-3 text-xs text-rose-300">Không có audit row; mọi pipeline của khung này phải coi là <GlossaryTerm term="unavailable">unavailable</GlossaryTerm>.</p>}
        {row.reasons.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-200/80">{row.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        {row.source?.derivedTables && <details className="mt-3 text-xs text-slate-400"><summary className="cursor-pointer text-slate-400">Pipeline inventory ({row.source.derivedTables.length})</summary><ul className="mt-2 space-y-1">{row.source.derivedTables.map((table) => <li key={table.table} className="flex justify-between gap-2"><span className="truncate">{table.table}</span><span className={(table.missingRows ?? 0) > 0 ? "text-slate-300" : "text-slate-400"}>{table.rows.toLocaleString("vi-VN")} rows{table.missingRows == null ? "" : ` · thiếu ${table.missingRows.toLocaleString("vi-VN")}`}</span></li>)}</ul></details>}
      </article>)}
    </div>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="pipeline">Pipeline</GlossaryTerm> <GlossaryTerm term="worker">workers</GlossaryTerm></div>{summary.technicalWorkers.length ? <ul className="mt-2 space-y-1.5">{summary.technicalWorkers.map((worker) => <li key={worker.name} className="flex flex-wrap items-center justify-between gap-2 text-slate-400"><span className="font-mono text-[10px]">{worker.name}</span><span className={worker.status === "healthy" ? "text-emerald-300" : worker.status === "stale" ? "text-slate-300" : "text-rose-300"}><GlossaryTerm term={worker.status}>{worker.status}</GlossaryTerm> · age {ageLabel(worker.ageSeconds)}</span></li>)}</ul> : <p className="mt-2 text-slate-400"><GlossaryTerm term="worker">Worker</GlossaryTerm> health chưa công bố; không suy ra <GlossaryTerm term="pipeline">pipeline</GlossaryTerm> đang chạy chỉ từ inventory.</p>}</div>
      <div className="rounded-lg bg-slate-950/50 p-3 text-xs"><div className="font-semibold text-slate-300"><GlossaryTerm term="legacy">Legacy</GlossaryTerm> & exclusions</div>{summary.legacyTimeframes.length ? <p className="mt-2 text-slate-400">{summary.legacyTimeframes.map((row) => row.timeframe).join(", ")} · chỉ giữ để audit lịch sử, không thuộc scope replay 1h/4h/1d.</p> : <p className="mt-2 text-slate-400">Không có timeframe <GlossaryTerm term="legacy">legacy</GlossaryTerm> trong phản hồi audit.</p>}<p className="mt-2 text-amber-300/80"><GlossaryTerm term="unavailable">Unavailable</GlossaryTerm> và <GlossaryTerm term="partial">partial</GlossaryTerm> vẫn là thiếu bằng chứng; UI không đổi chúng thành “đủ” bằng fallback realtime.</p></div>
    </div>
  </section>;
}

function EvidencePipelineStatus({ pipeline }: { pipeline: ResearchEvidenceCatalog["pipeline"] }) {
  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5" aria-label="Trạng thái pipeline evidence kỹ thuật">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-sm font-semibold text-slate-100">Descriptive evidence pipeline</h3><p className="mt-1 text-xs text-slate-400"><GlossaryTerm term="coverage">Coverage</GlossaryTerm> <GlossaryTerm term="artifact">artifact</GlossaryTerm> mô tả theo 1h/4h/1d; không phải xác suất dự báo.</p></div><span className={`min-w-0 break-all rounded px-2 py-1 text-xs font-bold ${pipeline?.state === "succeeded" && pipeline.integrityVerified ? "bg-slate-800/40 text-slate-300" : pipeline?.state === "running" ? "bg-teal-950/50 text-teal-300" : pipeline?.state === "failed" ? "bg-rose-950/50 text-rose-300" : "bg-slate-800/40 text-slate-300"}`}>{pipeline?.state ?? "not reported"}</span></div>
    {!pipeline ? <p className="mt-3 text-xs text-slate-400">Catalog chưa công bố <GlossaryTerm term="pipeline">pipeline</GlossaryTerm> metadata; UI không suy ra trạng thái từ <GlossaryTerm term="artifact">artifact</GlossaryTerm> count.</p> : <>
      <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400"><GlossaryTerm term="integrity">integrity</GlossaryTerm> {pipeline.integrityVerified ? "verified" : "unverified"}</span><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400">running {pipeline.running ? "yes" : "no"}</span><span className="rounded bg-slate-800/40 px-2 py-1 text-slate-400"><GlossaryTerm term="lock">lock</GlossaryTerm> {pipeline.locked ? "held" : "free"}</span></div>
      <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-5 [&>div]:min-w-0 [&_dd]:break-words"><div><dt className="text-slate-400">Started</dt><dd className="text-slate-400">{formatDate(pipeline.lastStartedAtUtc)}</dd></div><div><dt className="text-slate-400">Succeeded</dt><dd className="text-slate-400">{formatDate(pipeline.lastSucceededAtUtc)}</dd></div><div><dt className="text-slate-400">Failed</dt><dd className="text-slate-400">{formatDate(pipeline.lastFailedAtUtc)}</dd></div><div><dt className="text-slate-400">Updated</dt><dd className="text-slate-400">{formatDate(pipeline.updatedAtUtc)}</dd></div><div><dt className="text-slate-400"><GlossaryTerm term="stale">Stale after</GlossaryTerm></dt><dd className="text-slate-400">{formatDate(pipeline.staleAfterUtc)}</dd></div></dl>
      {pipeline.lastError && <p role="alert" className="mt-3 max-w-full break-words rounded bg-rose-950/30 p-2 text-xs text-rose-200 [overflow-wrap:anywhere]">Lỗi gần nhất: {pipeline.lastError}</p>}
      {pipeline.timeframes.length ? <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">{pipeline.timeframes.map((row) => <article key={row.timeframe} className="min-w-0 max-w-full overflow-hidden rounded-lg bg-slate-950/60 p-3 text-xs"><div className="flex min-w-0 items-start justify-between gap-2"><strong className="shrink-0">{row.timeframe}</strong><span className={`min-w-0 break-words text-right ${row.semanticVerification ? "text-emerald-300" : "text-rose-300"}`}><GlossaryTerm term="semantic-verification">{row.semanticVerification ? "semantic verified" : "semantic failed"}</GlossaryTerm></span></div><dl className="mt-2 grid min-w-0 grid-cols-2 gap-1 text-xs [&>dd]:min-w-0 [&>dd]:break-words"><dt className="text-slate-400">Stored</dt><dd className="text-right">{row.stored.toLocaleString("vi-VN")}</dd><dt className="text-slate-400"><GlossaryTerm term="eligible">Eligible</GlossaryTerm></dt><dd className="text-right">{row.eligible.toLocaleString("vi-VN")}</dd><dt className="text-slate-400"><GlossaryTerm term="excluded">Excluded</GlossaryTerm></dt><dd className="text-right">{row.excluded.toLocaleString("vi-VN")}</dd><dt className="text-slate-400"><GlossaryTerm term="realized-horizon">Realized horizon</GlossaryTerm></dt><dd className="text-right">{row.realizedAtMaxHorizon.toLocaleString("vi-VN")}</dd><dt className="text-slate-400"><GlossaryTerm term="cutoff">Cutoff</GlossaryTerm></dt><dd className="text-right">{formatTimeMs(row.cutoffMs)}</dd></dl><div title={row.manifestSha256} className="mt-2 max-w-full truncate font-mono text-[9px] text-slate-400">{row.manifestSha256}</div></article>)}</div> : <p className="mt-3 break-words text-xs text-slate-400"><GlossaryTerm term="pipeline">Pipeline</GlossaryTerm> không công bố <GlossaryTerm term="coverage">coverage</GlossaryTerm> theo timeframe ở trạng thái này.</p>}
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

  return <div className="space-y-4">
    <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-teal-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-teal-400"><FileCheck2 className="h-5 w-5"/><span className="text-xs font-bold">Evidence Center</span></div><h2 className="mt-2 text-lg font-bold text-slate-100">Nghiên cứu có thể kiểm chứng</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Mỗi kết luận phải nối được với <GlossaryTerm term="snapshot">snapshot</GlossaryTerm> dữ liệu, <GlossaryTerm term="protocol">protocol</GlossaryTerm>, <GlossaryTerm term="baseline">baseline</GlossaryTerm>, bất định, <GlossaryTerm term="coverage">coverage</GlossaryTerm>, giới hạn và hash <GlossaryTerm term="artifact">artifact</GlossaryTerm>. <GlossaryTerm term="predictive">Predictive</GlossaryTerm> evidence không tự động trở thành <GlossaryTerm term="pnl">PnL</GlossaryTerm> hay <GlossaryTerm term="live">live</GlossaryTerm> evidence.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>Làm mới</button></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Nhóm bằng chứng">{SECTIONS.map((item) => <button type="button" role="tab" aria-selected={section === item.key} key={item.key} onClick={() => { detailRequestRef.current += 1; setDetailLoading(false); setDetailError(null); setSection(item.key); setSelectedId(null); setDetail(null); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${section === item.key ? "bg-teal-500/15 text-teal-300" : "bg-slate-800/40 text-slate-400 hover:text-slate-300"}`}>{item.label}</button>)}</div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/30 p-5 text-sm text-rose-300">Evidence API chưa sẵn sàng: {error}. Các vùng economic/forward bên dưới vẫn giữ trạng thái độc lập.</div>}
    {catalog && catalog.integrity.rejectedArtifactCount > 0 && <div role="alert" className="rounded-xl border border-amber-900 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200">Có {catalog.integrity.rejectedArtifactCount.toLocaleString("vi-VN")} <GlossaryTerm term="artifact">artifact</GlossaryTerm> bị catalog loại do <GlossaryTerm term="integrity">integrity</GlossaryTerm>/contract không đạt; chúng không được dùng làm bằng chứng. Đã publish {catalog.integrity.publishedArtifactCount.toLocaleString("vi-VN")}/{catalog.integrity.scannedArtifactCount.toLocaleString("vi-VN")} <GlossaryTerm term="artifact">artifact</GlossaryTerm> đã quét.</div>}
    {section === "overview" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-2xl font-bold">{catalog?.items.length ?? 0}</div><div className="text-xs text-slate-400"><GlossaryTerm term="artifact">artifact</GlossaryTerm> đã kiểm kê</div></div><div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-2xl font-bold">{catalog?.items.filter((item) => item.integrityVerified).length ?? 0}</div><div className="text-xs text-slate-400"><GlossaryTerm term="integrity">hash hợp lệ</GlossaryTerm></div></div><div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-2xl font-bold">{catalog?.items.filter((item) => item.status === "supported" && item.integrityVerified && (item.tier === "validated-predictive" || item.tier === "predictive")).length ?? 0}</div><div className="text-xs text-slate-400"><GlossaryTerm term="predictive">artifact có predictive support</GlossaryTerm></div></div><div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"><div className="text-2xl font-bold">{observations?.items.length ?? 0}</div><div className="text-xs text-slate-400"><GlossaryTerm term="forward-evidence">forward decisions</GlossaryTerm></div></div></div>}
    {section === "overview" && <TechnicalDataCoverage audit={dataAudit} workers={workers} error={coverageError}/>}
    {section === "overview" && <DataQualityAdministration/>}
    {section === "overview" && <EvidencePipelineStatus pipeline={catalog?.pipeline ?? null}/>}
    {section === "overview" && <TechnicalEvidenceAdministration/>}
    {section === "overview" && <CausalSmartMoneyAdministration/>}
    {section === "overview" && <CapabilityMatrix data={capabilities}/>}
    {(section === "overview" || section === "economic") && <EconomicStatus runs={backtests}/>}
    {(section === "overview" || section === "forward") && <ForwardStatus observations={observations}/>}
    {(section === "overview" || section === "event") && <CurrentConditionsPanel onOpenDossier={openDossierByManifest}/>}

    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <section className="min-w-0 space-y-2" aria-label="Danh sách artifact">
        {loading && !catalog && <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400">Đang tải catalog…</div>}
        {!loading && visibleItems.length === 0 && <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400"><CheckCircle2 className="mb-2 h-5 w-5"/>Chưa có <GlossaryTerm term="artifact">artifact</GlossaryTerm> cho tầng này. Hệ thống không nâng cấp evidence bằng suy đoán.</div>}
        {visibleItems.map((item) => <ArtifactCard key={item.id} item={item} selected={selectedId === item.id} onSelect={() => void selectArtifact(item)}/>)}
        {catalog && <p className="px-1 text-xs text-slate-400"><GlossaryTerm term="research-contract">Contract</GlossaryTerm> {catalog.contractVersion} · catalog {formatDate(catalog.generatedAtUtc)}</p>}
      </section>
      <EvidenceDetailPanel detail={detail} loading={detailLoading} error={detailError}/>
    </div>
  </div>;
}
