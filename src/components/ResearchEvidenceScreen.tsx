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
  if (tier === "live") return "border-emerald-700 bg-emerald-950/40 text-emerald-300";
  if (tier === "forward-observed") return "border-teal-700 bg-teal-950/40 text-teal-300";
  if (tier === "validated-predictive") return "border-cyan-700 bg-cyan-950/40 text-cyan-300";
  if (tier === "retrospective-selection-aware") return "border-violet-700 bg-violet-950/40 text-violet-300";
  if (tier === "predictive") return "border-sky-700 bg-sky-950/40 text-sky-300";
  if (tier === "economic-simulation") return "border-indigo-700 bg-indigo-950/40 text-indigo-300";
  if (tier === "unavailable") return "border-gray-700 bg-gray-900 text-gray-400";
  return "border-amber-800 bg-amber-950/30 text-amber-300";
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
    <div className="rounded-lg border border-gray-800 bg-gray-950/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{metric.label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-100">{formatValue(metric.value, metric.unit)}</div>
      <div className="mt-1 space-y-0.5 text-[11px] text-gray-500">
        <div className="font-mono text-[9px] text-gray-600">{metric.name}</div>
        {metric.baselineValue != null && <div>Baseline: {formatValue(metric.baselineValue, metric.unit)}</div>}
        {metric.lift != null && <div>Lift: {formatValue(metric.lift, metric.unit)}</div>}
        {(metric.intervalLow != null || metric.intervalHigh != null) && (
          <div>{descriptive ? "Khoảng thống kê" : "Khoảng bất định"}: [{formatValue(metric.intervalLow, metric.unit)}, {formatValue(metric.intervalHigh, metric.unit)}]</div>
        )}
        {metric.sampleCount != null && <div>n = {metric.sampleCount.toLocaleString("vi-VN")}</div>}
        {metric.baseline && <div>So với: <span className="font-mono text-gray-400">{metric.baseline}</span></div>}
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
      className={`w-full rounded-xl border p-4 text-left transition-colors ${selected ? "border-cyan-700 bg-cyan-950/20" : "border-gray-800 bg-gray-900/60 hover:border-gray-700"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{evidenceSectionLabel(item.kind)}</div>
          <h3 className="mt-1 font-semibold text-gray-100">{item.title}</h3>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${tierClass(item.tier)}`}>{TIER_LABELS[item.tier]}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">{item.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
        <span>{item.symbol}{item.timeframe ? ` · ${item.timeframe}` : ""}</span>
        <span className="rounded border border-gray-800 px-1.5 py-0.5 text-gray-400">kết luận: {item.status}</span>
        <span className={item.integrityVerified ? "text-emerald-400" : "text-rose-400"}>
          {item.integrityVerified ? "✓ hash đã xác minh" : item.status === "integrity-limited" ? "⚠ integrity hạn chế" : "✕ integrity chưa đạt"}
        </span>
        <span className="ml-auto inline-flex items-center text-cyan-400">Xem hồ sơ <ChevronRight className="h-3 w-3" /></span>
      </div>
    </button>
  );
}

function JsonRows({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return null;
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 8);
  return (
    <details className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-200">{title} ({rows.length.toLocaleString("vi-VN")})</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead className="border-b border-gray-800 text-gray-500"><tr>{keys.map((key) => <th key={key} className="p-2 text-left">{key}</th>)}</tr></thead>
          <tbody>{rows.slice(0, 100).map((row, index) => (
            <tr key={index} className="border-b border-gray-800/50">
              {keys.map((key) => <td key={key} className="max-w-48 truncate p-2 font-mono text-gray-400">{typeof row[key] === "object" ? JSON.stringify(row[key]) : String(row[key] ?? "—")}</td>)}
            </tr>
          ))}</tbody>
        </table>
      </div>
      {rows.length > 100 && <p className="mt-2 text-[10px] text-gray-500">UI chỉ hiển thị 100 dòng đầu; artifact gốc giữ toàn bộ.</p>}
    </details>
  );
}

function EvidenceDetailPanel({ detail, loading, error }: { detail: ResearchEvidenceDetail | null; loading: boolean; error: string | null }) {
  if (loading) return <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-sm text-gray-400">Đang kiểm tra và đọc artifact…</div>;
  if (error) return <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/30 p-4 text-sm text-rose-300">{error}</div>;
  if (!detail) return <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-sm text-gray-500">Chọn một artifact để xem chuỗi bằng chứng.</div>;
  const descriptive = detail.tier === "descriptive";
  const snapshotArtifact = detail.artifacts.find((artifact) => artifact.role === "datasetSnapshot" || artifact.role === "snapshot") ?? null;
  const predictionsArtifact = detail.artifacts.find((artifact) => artifact.role === "rowPredictions" || artifact.role === "ledger") ?? null;
  const predictionRowCount = detail.dataset?.predictionRowCount ?? predictionsArtifact?.rowCount ?? null;
  const predictionsSha256 = detail.dataset?.predictionsSha256 ?? predictionsArtifact?.sha256 ?? null;
  const immutable = detail.dataset?.immutable
    ?? (detail.integrityVerified && snapshotArtifact && predictionsArtifact ? true : null);
  return (
    <article className="min-w-0 space-y-4" aria-label={`Hồ sơ bằng chứng ${detail.title}`}>
      <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Hồ sơ kết luận</p>
            <h2 className="mt-1 text-xl font-bold text-gray-100">{detail.title}</h2>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${tierClass(detail.tier)}`}>{TIER_LABELS[detail.tier]}</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3"><div className="text-[10px] uppercase text-gray-500">Câu hỏi nghiên cứu</div><p className="mt-1 text-sm text-gray-300">{detail.question ?? detail.hypothesis ?? "Artifact chưa khai báo câu hỏi nghiên cứu."}</p></div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3"><div className="text-[10px] uppercase text-gray-500">Kết luận được phép</div><p className="mt-1 text-sm text-gray-300">{detail.conclusion ?? detail.summary}</p></div>
        </div>
        {descriptive && <div className="mt-3 rounded-lg border border-amber-800/70 bg-amber-950/30 p-3 text-xs leading-5 text-amber-200">Đây là bằng chứng mô tả các sự kiện đã quan sát. Giá trị và khoảng bên dưới không phải xác suất dự báo, tín hiệu giao dịch hay bằng chứng PnL.</div>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Database className="h-4 w-4 text-indigo-400" /> Snapshot dữ liệu</h3>
          {detail.dataset ? <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <dt className="text-gray-500">Nguồn</dt><dd className="text-right text-gray-300">{detail.dataset.source ?? "—"}</dd>
            <dt className="text-gray-500">Số dòng</dt><dd className="text-right text-gray-300">{detail.dataset.rowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt className="text-gray-500">{descriptive ? "Dòng event / ledger" : "Prediction rows"}</dt><dd className="text-right text-gray-300">{predictionRowCount?.toLocaleString("vi-VN") ?? "—"}</dd>
            <dt className="text-gray-500">Quyết định đầu</dt><dd className="text-right text-gray-300">{detail.dataset.startTimeUtc ? formatDate(detail.dataset.startTimeUtc) : formatTimeMs(detail.dataset.firstDecisionTimeMs)}</dd>
            <dt className="text-gray-500">Quyết định cuối / cutoff</dt><dd className="text-right text-gray-300">{detail.dataset.cutoffTimeUtc ? formatDate(detail.dataset.cutoffTimeUtc) : detail.dataset.endTimeUtc ? formatDate(detail.dataset.endTimeUtc) : formatTimeMs(detail.dataset.lastDecisionTimeMs)}</dd>
            <dt className="text-gray-500">Snapshot hash</dt><dd title={detail.dataset.snapshotSha256 ?? undefined} className="text-right font-mono text-gray-400">{shortHash(detail.dataset.snapshotSha256)}</dd>
            <dt className="text-gray-500">Predictions hash</dt><dd title={predictionsSha256 ?? undefined} className="text-right font-mono text-gray-400">{shortHash(predictionsSha256)}</dd>
            <dt className="text-gray-500">Bất biến</dt><dd className="text-right text-gray-300">{immutable == null ? "Chưa khai báo" : immutable ? "Có" : "Không"}</dd>
          </dl> : <p className="mt-3 text-xs text-amber-300">Artifact chưa cung cấp snapshot dữ liệu có thể truy nguyên.</p>}
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FlaskConical className="h-4 w-4 text-cyan-400" /> Protocol</h3>
          {detail.protocol ? <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <dt className="text-gray-500">Evaluator</dt><dd className="text-right text-gray-300">{detail.protocol.name ?? detail.protocol.version ?? "—"}</dd>
            <dt className="text-gray-500">Chronological OOS</dt><dd className="text-right text-gray-300">{detail.protocol.chronologicalOos == null ? "Chưa khai báo" : detail.protocol.chronologicalOos ? "Có" : "Không"}</dd>
            <dt className="text-gray-500">Số fold</dt><dd className="text-right text-gray-300">{detail.protocol.foldCount ?? detail.coverage?.foldCount ?? "—"}</dd>
            <dt className="text-gray-500">Decision time</dt><dd className="text-right text-gray-300">{detail.protocol.decisionTime ?? "—"}</dd>
            <dt className="text-gray-500">Outcome basis</dt><dd className="text-right text-gray-300">{detail.protocol.outcomePriceBasis ?? "—"}</dd>
            <dt className="text-gray-500">Multiple testing</dt><dd className="text-right text-gray-300">{detail.protocol.multipleTesting ?? "—"}</dd>
          </dl> : <p className="mt-3 text-xs text-amber-300">Artifact chưa khai báo protocol.</p>}
        </section>
      </div>

      {detail.artifacts.length > 0 && <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><FileCheck2 className="h-4 w-4 text-violet-400" /> Immutable bundle artifacts</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">{detail.artifacts.map((artifact) => <div key={artifact.role} className="rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-xs"><div className="font-semibold text-gray-200">{artifact.role}</div><div className="mt-1 text-gray-500">{artifact.rowCount == null ? "Không áp dụng số dòng" : `${artifact.rowCount.toLocaleString("vi-VN")} dòng`} · {artifact.bytes.toLocaleString("vi-VN")} bytes</div><div title={artifact.sha256} className="mt-2 font-mono text-[10px] text-violet-300">{shortHash(artifact.sha256)}</div></div>)}</div>
      </section>}

      <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-emerald-400" /> {descriptive ? "Thống kê mô tả, coverage và bất định" : "Kết quả, baseline và bất định"}</h3>
        {detail.metrics.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{detail.metrics.map((metric, index) => <MetricCard key={`${metric.name}-${index}`} metric={metric} descriptive={descriptive} />)}</div> : <p className="mt-3 text-xs text-amber-300">Không có metric định lượng trong artifact.</p>}
        {detail.uncertainty.length > 0 && <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">{descriptive ? "Khoảng thống kê mô tả" : "Uncertainty / interval"}</div><ul className="mt-2 space-y-1 text-gray-400">{detail.uncertainty.map((item) => <li key={item.name}><span className="font-mono text-gray-300">{item.name}</span>: [{formatValue(item.lower)}, {formatValue(item.upper)}]{item.confidenceLevel != null ? ` · mức interval ${(item.confidenceLevel * 100).toFixed(1)}%` : ""}{item.familywise ? " · familywise-adjusted" : ""}</li>)}</ul>{descriptive && <p className="mt-2 text-amber-300/80">Mức interval mô tả độ bất định của thống kê lịch sử; không phải xác suất sự kiện tương lai.</p>}</div>}
        {detail.findings.length > 0 && <div className="mt-3 overflow-x-auto rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">Kết luận theo trial / nhóm</div><table className="mt-2 w-full min-w-[640px]"><thead className="border-b border-gray-800 text-gray-500"><tr><th className="p-2 text-left">Finding</th><th className="p-2 text-left">Trạng thái</th><th className="p-2 text-right">Giá trị</th><th className="p-2 text-right">Khoảng</th><th className="p-2 text-right">n</th></tr></thead><tbody>{detail.findings.map((finding) => <tr key={finding.id} className="border-b border-gray-800/50"><td className="p-2"><div className="text-gray-300">{finding.label}</div><div className="font-mono text-[10px] text-gray-600">{finding.metricName}</div></td><td className="p-2 text-gray-400">{finding.status}</td><td className="p-2 text-right font-mono text-gray-300">{formatValue(finding.value)}</td><td className="p-2 text-right font-mono text-gray-400">[{formatValue(finding.lower)}, {formatValue(finding.upper)}]</td><td className="p-2 text-right text-gray-400">{finding.sampleSize?.toLocaleString("vi-VN") ?? "—"}</td></tr>)}</tbody></table></div>}
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">Baselines</div>{detail.baselines.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-gray-400">{detail.baselines.map((baseline) => <li key={baseline.id}>{baseline.name}{baseline.description ? ` — ${baseline.description}` : ""}</li>)}</ul> : <p className="mt-2 text-amber-300">Chưa khai báo baseline.</p>}</div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">Coverage & exclusions</div><p className="mt-2 text-gray-400">Evaluated {detail.coverage?.evaluatedRows?.toLocaleString("vi-VN") ?? "—"} / eligible {detail.coverage?.eligibleRows?.toLocaleString("vi-VN") ?? "—"} · ratio {detail.coverage?.ratio == null ? "—" : `${(detail.coverage.ratio * 100).toFixed(2)}%`} · folds {detail.coverage?.foldCount ?? "—"}</p><p className="mt-2 text-amber-300/80">Các trường hợp loại trừ chỉ được coi là đã công bố khi xuất hiện trong limitations/protocol của artifact; UI không tự suy diễn phần còn thiếu.</p></div>
        </div>
      </section>

      {detail.evidenceProfiles && <EvidenceProfilesPanel profiles={detail.evidenceProfiles} />}
      {detail.kind === "event" && detail.tier === "descriptive" && (
        <StatisticalEvidencePanel evidence={detail.statisticalEvidence} />
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-amber-900/70 bg-amber-950/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Giới hạn</h3>
          {detail.limitations.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100/70">{detail.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="mt-2 text-xs text-amber-200/70">Artifact chưa công bố giới hạn.</p>}
        </div>
        <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" /> Provenance & integrity</h3>
          <dl className="mt-2 grid grid-cols-[auto,1fr] gap-2 text-xs"><dt className="text-gray-500">Report</dt><dd title={detail.provenance.reportSha256 ?? undefined} className="truncate text-right font-mono text-gray-300">{shortHash(detail.provenance.reportSha256)}</dd><dt className="text-gray-500">Manifest</dt><dd title={detail.provenance.manifestSha256 ?? undefined} className="truncate text-right font-mono text-gray-300">{shortHash(detail.provenance.manifestSha256)}</dd><dt className="text-gray-500">Evaluator</dt><dd title={detail.provenance.evaluatorSha256 ?? undefined} className="truncate text-right font-mono text-gray-300">{shortHash(detail.provenance.evaluatorSha256)}</dd><dt className="text-gray-500">Research contract</dt><dd title={detail.provenance.researchContractSha256 ?? undefined} className="truncate text-right font-mono text-gray-300">{shortHash(detail.provenance.researchContractSha256)}</dd><dt className="text-gray-500">Git</dt><dd className="truncate text-right font-mono text-gray-300">{detail.provenance.codeVersion ?? "—"}{detail.provenance.gitDirty === true ? " (dirty)" : detail.provenance.gitDirty === false ? " (clean)" : ""}</dd><dt className="text-gray-500">Generated</dt><dd className="text-right text-gray-300">{formatDate(detail.provenance.generatedAtUtc)}</dd></dl>
        </div>
      </section>
      <JsonRows title="Fold drill-down" rows={detail.folds} />
      <JsonRows title="Prediction / event rows" rows={detail.rows} />
    </article>
  );
}

function EconomicStatus({ runs }: { runs: BacktestRunSummary[] | null }) {
  const valid = (runs ?? []).filter((run) => run.validityStatus === "Valid" && run.archivedAtUtc == null);
  const latest = valid[0] ?? null;
  return <section className="rounded-xl border border-indigo-900/70 bg-indigo-950/20 p-4 text-xs">
    <h3 className="font-semibold text-indigo-200">Economic evidence · historical simulation</h3>
    {!runs ? <p className="mt-2 text-gray-400">Endpoint backtest không khả dụng; không suy diễn PnL.</p> : !latest ? <p className="mt-2 text-amber-300">Chưa có backtest hợp lệ theo research contract.</p> : <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><div>Trades<br/><b>{latest.totalTrades}</b></div><div>Return<br/><b>{latest.totalReturnPct.toFixed(2)}%</b></div><div>Sharpe<br/><b>{latest.sharpeRatio.toFixed(2)}</b></div><div>Drawdown<br/><b>{latest.maxDrawdownPct.toFixed(2)}%</b></div><p className="col-span-full text-gray-500">{latest.modelName} · {latest.timeframe} · mô phỏng lịch sử, chưa phải forward/live.</p></div>}
  </section>;
}

function ForwardStatus({ observations }: { observations: PaperObservationListResponse | null }) {
  const items = observations?.items ?? [];
  const fills = items.filter((item) => item.fillPrice != null).length;
  const outcomes = items.filter((item) => item.outcomeReturn != null).length;
  return <section className="rounded-xl border border-teal-900/70 bg-teal-950/20 p-4 text-xs">
    <h3 className="font-semibold text-teal-200">Forward evidence · BTCUSDT 4h journal</h3>
    {!observations ? <p className="mt-2 text-gray-400">Forward journal không khả dụng; không dùng replay thay thế.</p> : !observations.available ? <p className="mt-2 text-amber-300">{observations.reason ?? "Forward journal chưa khả dụng."}</p> : <div className="mt-3 grid grid-cols-3 gap-2"><div>Decisions<br/><b>{items.length}</b></div><div>Fills quan sát<br/><b>{fills}</b></div><div>Outcomes quan sát<br/><b>{outcomes}</b></div><p className="col-span-full text-gray-500">Thiếu fill/outcome được giữ nguyên là thiếu; UI không backfill từ dữ liệu tương lai.</p></div>}
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
  if (!data) return <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-500">Capability registry không khả dụng; chưa thể chứng minh coverage chức năng.</section>;
  return <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-gray-100">Ma trận 20 năng lực kỹ thuật</h3><p className="mt-1 text-[11px] text-gray-500">Implementation readiness và evidence maturity được chấm riêng; cột màn FE cho biết nơi người dùng kiểm tra kết quả.</p></div><label className="text-[11px] text-gray-500">Nhóm <select value={filter} onChange={(event) => setFilter(event.target.value)} className="ml-2 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-gray-300"><option value="all">Tất cả ({data.items.length})</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[860px] text-xs"><thead className="border-b border-gray-800 text-gray-500"><tr><th className="p-2 text-left">Chức năng</th><th className="p-2 text-left">Implementation</th><th className="p-2 text-left">Evidence stage</th><th className="p-2 text-left">Evidence target</th><th className="p-2 text-left">Màn FE</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-gray-800/60 align-top"><td className="p-2"><div className="font-medium text-gray-200">{item.name}</div><div className="mt-1 font-mono text-[10px] text-gray-600">{item.id}</div></td><td className="p-2"><span className={`rounded border px-1.5 py-0.5 text-[10px] ${item.operationalStatus === "operational" ? "border-emerald-800 text-emerald-300" : item.operationalStatus === "degraded" ? "border-amber-800 text-amber-300" : "border-rose-900 text-rose-300"}`}>{item.operationalStatus}</span></td><td className="p-2 text-gray-300">{item.evidenceStage}</td><td className="p-2 text-gray-400">{item.evidenceTarget}</td><td className="p-2"><span className="rounded bg-gray-800 px-2 py-1 text-gray-300">{capabilityDestination(item)}</span><details className="mt-2 text-[10px] text-gray-500"><summary className="cursor-pointer">Mục đích & giới hạn</summary><p className="mt-1">{item.intendedUse}</p><p className="mt-1 text-amber-300/70">{item.limitation}</p></details></td></tr>)}</tbody></table></div>
    <p className="mt-2 text-[10px] text-gray-600">Registry {data.contractVersion} · {data.symbol} · hiển thị {items.length}/{data.items.length}</p>
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
  if (status === "available") return "border-emerald-800 bg-emerald-950/30 text-emerald-300";
  if (status === "partial") return "border-amber-800 bg-amber-950/30 text-amber-300";
  return "border-rose-900 bg-rose-950/30 text-rose-300";
}

function TechnicalDataCoverage({ audit, workers, error }: {
  audit: DataAuditResponse | null;
  workers: WorkersHealthDto | null;
  error: string | null;
}) {
  const summary = useMemo(() => buildTechnicalCoverageSummary(audit, workers), [audit, workers]);
  return <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4" aria-labelledby="technical-data-coverage-title">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h3 id="technical-data-coverage-title" className="text-sm font-semibold text-gray-100">Data Administration · technical coverage</h3><p className="mt-1 text-[11px] leading-5 text-gray-500">BTCUSDT 1h/4h/1d; gaps, quality và inventory dẫn xuất được báo riêng. Legacy không được tính vào coverage đang hoạt động.</p></div>
      <span className="rounded border border-gray-700 bg-gray-950 px-2 py-1 font-mono text-[10px] text-gray-400">{audit ? formatDate(audit.generatedAtUtc) : "audit unavailable"}</span>
    </div>
    {error && <div role="alert" className="mt-3 rounded-lg border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-300">{error}</div>}
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {summary.rows.map((row) => <article key={row.timeframe} className="rounded-lg border border-gray-800 bg-gray-950/50 p-3">
        <div className="flex items-center justify-between gap-2"><strong className="text-sm text-gray-100">{row.timeframe}</strong><span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${coverageStatusClass(row.availability)}`}>{row.availability}</span></div>
        {row.source ? <dl className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
          <dt className="text-gray-500">Coverage</dt><dd className="text-right text-gray-300">{row.source.dataCoveragePct.toFixed(2)}%</dd>
          <dt className="text-gray-500">Missing bars</dt><dd className="text-right text-gray-300">{row.source.missingBars.toLocaleString("vi-VN")}</dd>
          <dt className="text-gray-500">Gap ranges</dt><dd className="text-right text-gray-300">{row.source.gapRangeCount.toLocaleString("vi-VN")}</dd>
          <dt className="text-gray-500">Ledger</dt><dd className="text-right text-gray-300">{row.source.gapLedgerStatus}</dd>
          <dt className="text-gray-500">Finalized age</dt><dd className="text-right text-gray-300">{ageLabel(row.source.quality?.latestFinalizedAgeSeconds ?? row.source.latestCandleAgeSeconds)}</dd>
          <dt className="text-gray-500">Invalid duration</dt><dd className={`text-right ${(row.source.quality?.invalidDurationRows ?? 0) > 0 ? "text-rose-300" : "text-gray-300"}`}>{row.source.quality?.invalidDurationRows?.toLocaleString("vi-VN") ?? "—"}</dd>
          <dt className="text-gray-500">Indicators / patterns</dt><dd className="text-right text-gray-300">{row.source.technicalIndicators?.toLocaleString("vi-VN") ?? "—"} / {row.source.candlePatterns?.toLocaleString("vi-VN") ?? "—"}</dd>
        </dl> : <p className="mt-3 text-xs text-rose-300">Không có audit row; mọi pipeline của khung này phải coi là unavailable.</p>}
        {row.reasons.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-[10px] leading-4 text-amber-200/80">{row.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
        {row.source?.derivedTables && <details className="mt-3 text-[10px] text-gray-500"><summary className="cursor-pointer text-gray-400">Pipeline inventory ({row.source.derivedTables.length})</summary><ul className="mt-2 space-y-1">{row.source.derivedTables.map((table) => <li key={table.table} className="flex justify-between gap-2"><span className="truncate">{table.table}</span><span className={(table.missingRows ?? 0) > 0 ? "text-amber-300" : "text-gray-400"}>{table.rows.toLocaleString("vi-VN")} rows{table.missingRows == null ? "" : ` · thiếu ${table.missingRows.toLocaleString("vi-VN")}`}</span></li>)}</ul></details>}
      </article>)}
    </div>
    <div className="mt-3 grid gap-3 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">Pipeline workers</div>{summary.technicalWorkers.length ? <ul className="mt-2 space-y-1.5">{summary.technicalWorkers.map((worker) => <li key={worker.name} className="flex flex-wrap items-center justify-between gap-2 text-gray-400"><span className="font-mono text-[10px]">{worker.name}</span><span className={worker.status === "healthy" ? "text-emerald-300" : worker.status === "stale" ? "text-amber-300" : "text-rose-300"}>{worker.status} · age {ageLabel(worker.ageSeconds)}</span></li>)}</ul> : <p className="mt-2 text-amber-300">Worker health chưa công bố; không suy ra pipeline đang chạy chỉ từ inventory.</p>}</div>
      <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3 text-xs"><div className="font-semibold text-gray-300">Legacy & exclusions</div>{summary.legacyTimeframes.length ? <p className="mt-2 text-gray-400">{summary.legacyTimeframes.map((row) => row.timeframe).join(", ")} · chỉ giữ để audit lịch sử, không thuộc scope replay 1h/4h/1d.</p> : <p className="mt-2 text-gray-400">Không có timeframe legacy trong phản hồi audit.</p>}<p className="mt-2 text-amber-300/80">Unavailable và partial vẫn là thiếu bằng chứng; UI không đổi chúng thành “đủ” bằng fallback realtime.</p></div>
    </div>
  </section>;
}

function EvidencePipelineStatus({ pipeline }: { pipeline: ResearchEvidenceCatalog["pipeline"] }) {
  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 p-4" aria-label="Trạng thái pipeline evidence kỹ thuật">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="text-sm font-semibold text-gray-100">Descriptive evidence pipeline</h3><p className="mt-1 text-[11px] text-gray-500">Coverage artifact mô tả theo 1h/4h/1d; không phải xác suất dự báo.</p></div><span className={`min-w-0 break-all rounded border px-2 py-1 text-[10px] font-bold ${pipeline?.state === "succeeded" && pipeline.integrityVerified ? "border-emerald-800 text-emerald-300" : pipeline?.state === "running" ? "border-cyan-800 text-cyan-300" : "border-amber-800 text-amber-300"}`}>{pipeline?.state ?? "not reported"}</span></div>
    {!pipeline ? <p className="mt-3 text-xs text-amber-300">Catalog chưa công bố pipeline metadata; UI không suy ra trạng thái từ artifact count.</p> : <>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px]"><span className="rounded border border-gray-800 px-2 py-1 text-gray-400">integrity {pipeline.integrityVerified ? "verified" : "unverified"}</span><span className="rounded border border-gray-800 px-2 py-1 text-gray-400">running {pipeline.running ? "yes" : "no"}</span><span className="rounded border border-gray-800 px-2 py-1 text-gray-400">lock {pipeline.locked ? "held" : "free"}</span></div>
      <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-2 lg:grid-cols-5 [&>div]:min-w-0 [&_dd]:break-words"><div><dt className="text-gray-600">Started</dt><dd className="text-gray-400">{formatDate(pipeline.lastStartedAtUtc)}</dd></div><div><dt className="text-gray-600">Succeeded</dt><dd className="text-gray-400">{formatDate(pipeline.lastSucceededAtUtc)}</dd></div><div><dt className="text-gray-600">Failed</dt><dd className="text-gray-400">{formatDate(pipeline.lastFailedAtUtc)}</dd></div><div><dt className="text-gray-600">Updated</dt><dd className="text-gray-400">{formatDate(pipeline.updatedAtUtc)}</dd></div><div><dt className="text-gray-600">Stale after</dt><dd className="text-gray-400">{formatDate(pipeline.staleAfterUtc)}</dd></div></dl>
      {pipeline.lastError && <p role="alert" className="mt-3 max-w-full break-words rounded border border-rose-900/70 bg-rose-950/30 p-2 text-[10px] text-rose-200 [overflow-wrap:anywhere]">Lỗi gần nhất: {pipeline.lastError}</p>}
      {pipeline.timeframes.length ? <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-3">{pipeline.timeframes.map((row) => <article key={row.timeframe} className="min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-xs"><div className="flex min-w-0 items-start justify-between gap-2"><strong className="shrink-0">{row.timeframe}</strong><span className={`min-w-0 break-words text-right ${row.semanticVerification ? "text-emerald-300" : "text-rose-300"}`}>{row.semanticVerification ? "semantic verified" : "semantic failed"}</span></div><dl className="mt-2 grid min-w-0 grid-cols-2 gap-1 text-[11px] [&>dd]:min-w-0 [&>dd]:break-words"><dt className="text-gray-500">Stored</dt><dd className="text-right">{row.stored.toLocaleString("vi-VN")}</dd><dt className="text-gray-500">Eligible</dt><dd className="text-right">{row.eligible.toLocaleString("vi-VN")}</dd><dt className="text-gray-500">Excluded</dt><dd className="text-right">{row.excluded.toLocaleString("vi-VN")}</dd><dt className="text-gray-500">Realized horizon</dt><dd className="text-right">{row.realizedAtMaxHorizon.toLocaleString("vi-VN")}</dd><dt className="text-gray-500">Cutoff</dt><dd className="text-right">{formatTimeMs(row.cutoffMs)}</dd></dl><div title={row.manifestSha256} className="mt-2 max-w-full truncate font-mono text-[9px] text-gray-600">{row.manifestSha256}</div></article>)}</div> : <p className="mt-3 break-words text-xs text-amber-300">Pipeline không công bố coverage theo timeframe ở trạng thái này.</p>}
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

  return <div className="space-y-4">
    <header className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 to-cyan-950/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-cyan-400"><FileCheck2 className="h-5 w-5"/><span className="text-xs font-bold uppercase tracking-widest">Evidence Center</span></div><h2 className="mt-2 text-2xl font-bold">Nghiên cứu có thể kiểm chứng</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">Mỗi kết luận phải nối được với snapshot dữ liệu, protocol, baseline, bất định, coverage, giới hạn và hash artifact. Predictive evidence không tự động trở thành PnL hay live evidence.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>Làm mới</button></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Nhóm bằng chứng">{SECTIONS.map((item) => <button type="button" role="tab" aria-selected={section === item.key} key={item.key} onClick={() => { detailRequestRef.current += 1; setDetailLoading(false); setDetailError(null); setSection(item.key); setSelectedId(null); setDetail(null); }} className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium ${section === item.key ? "border-cyan-700 bg-cyan-950/40 text-cyan-300" : "border-gray-800 bg-gray-950/50 text-gray-500 hover:text-gray-300"}`}>{item.label}</button>)}</div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/30 p-4 text-sm text-rose-300">Evidence API chưa sẵn sàng: {error}. Các vùng economic/forward bên dưới vẫn giữ trạng thái độc lập.</div>}
    {catalog && catalog.integrity.rejectedArtifactCount > 0 && <div role="alert" className="rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-200">Có {catalog.integrity.rejectedArtifactCount.toLocaleString("vi-VN")} artifact bị catalog loại do integrity/contract không đạt; chúng không được dùng làm bằng chứng. Đã publish {catalog.integrity.publishedArtifactCount.toLocaleString("vi-VN")}/{catalog.integrity.scannedArtifactCount.toLocaleString("vi-VN")} artifact đã quét.</div>}
    {section === "overview" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3"><div className="text-2xl font-bold">{catalog?.items.length ?? 0}</div><div className="text-xs text-gray-500">artifact đã kiểm kê</div></div><div className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-3"><div className="text-2xl font-bold text-emerald-300">{catalog?.items.filter((item) => item.integrityVerified).length ?? 0}</div><div className="text-xs text-emerald-400/60">hash hợp lệ</div></div><div className="rounded-xl border border-cyan-900 bg-cyan-950/20 p-3"><div className="text-2xl font-bold text-cyan-300">{catalog?.items.filter((item) => item.status === "supported" && item.integrityVerified && (item.tier === "validated-predictive" || item.tier === "predictive")).length ?? 0}</div><div className="text-xs text-cyan-400/60">artifact có predictive support</div></div><div className="rounded-xl border border-teal-900 bg-teal-950/20 p-3"><div className="text-2xl font-bold text-teal-300">{observations?.items.length ?? 0}</div><div className="text-xs text-teal-400/60">forward decisions</div></div></div>}
    {section === "overview" && <TechnicalDataCoverage audit={dataAudit} workers={workers} error={coverageError}/>}
    {section === "overview" && <DataQualityAdministration/>}
    {section === "overview" && <EvidencePipelineStatus pipeline={catalog?.pipeline ?? null}/>}
    {section === "overview" && <TechnicalEvidenceAdministration/>}
    {section === "overview" && <CausalSmartMoneyAdministration/>}
    {section === "overview" && <CapabilityMatrix data={capabilities}/>}
    {(section === "overview" || section === "economic") && <EconomicStatus runs={backtests}/>}
    {(section === "overview" || section === "forward") && <ForwardStatus observations={observations}/>}

    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.6fr)]">
      <section className="min-w-0 space-y-2" aria-label="Danh sách artifact">
        {loading && !catalog && <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-500">Đang tải catalog…</div>}
        {!loading && visibleItems.length === 0 && <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-500"><CheckCircle2 className="mb-2 h-5 w-5"/>Chưa có artifact cho tầng này. Hệ thống không nâng cấp evidence bằng suy đoán.</div>}
        {visibleItems.map((item) => <ArtifactCard key={item.id} item={item} selected={selectedId === item.id} onSelect={() => void selectArtifact(item)}/>)}
        {catalog && <p className="px-1 text-[10px] text-gray-600">Contract {catalog.contractVersion} · catalog {formatDate(catalog.generatedAtUtc)}</p>}
      </section>
      <EvidenceDetailPanel detail={detail} loading={detailLoading} error={detailError}/>
    </div>
  </div>;
}
