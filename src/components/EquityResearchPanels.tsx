"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import {
  baseRatesReasonLabel,
  formatBarrier,
  formatDecimal,
  formatFundamentalValue,
  formatFractionPct,
  formatProbability,
  isStaleReason,
  type BaseRatesConfig,
  type ContextSection,
  type ContextSectionStatus,
  type EquityBaseRates,
  type EquityContext,
  type EquityObservation,
  type EquityOptional,
} from "@/lib/equity";
import { MBB_ACTION_LABELS, formatVnd, formatVnDateTime, type MbbDecisionAction } from "@/lib/mbb";
import type { SourceDocument } from "@/lib/equityResearch";

export type PanelState<T> =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; value: T };

const SECTION = "overflow-hidden rounded border border-slate-800 bg-slate-900";
const SECTION_HEAD = "flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-1";

function RefreshButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} aria-label={label} className="inline-flex min-h-9 items-center px-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}

function ErrorBox({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <button type="button" onClick={onRetry} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
    </div>
  );
}

function UnavailableBox({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400" data-testid={testId}>
      {children}
    </p>
  );
}

function SourceLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-slate-600">không có link nguồn</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 text-teal-400 hover:text-teal-300">
      nguồn <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function unavailableCopy(result: { httpStatus: number; code: string | null }): string {
  if (result.code === "UNSUPPORTED_CAPABILITY") return "Backend báo mã này chưa có capability cho bề mặt này.";
  if (result.code === "UNKNOWN_SYMBOL") return "Backend chưa khai báo mã này trong catalog.";
  return `Backend hiện tại chưa cung cấp bề mặt này (HTTP ${result.httpStatus}) — không hiển thị số liệu thay thế.`;
}

// --- base rates ----------------------------------------------------------------------

const STATUS_BADGE: Record<string, string> = {
  ok: "bg-emerald-950/40 text-emerald-300",
  abstained: "bg-amber-950/50 text-amber-300",
  unavailable: "bg-slate-800 text-slate-400",
};

function Metric({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div title={title}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono tabular-nums text-slate-200">{value}</dd>
    </div>
  );
}

function BaseRatesConfigCard({ config }: { config: BaseRatesConfig }) {
  const v = config.validation;
  return (
    <li className="space-y-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2" data-testid={`base-rates-config-${config.configId}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-mono font-medium text-slate-200">{config.configId}</span>
        <span className="text-slate-500">
          mục tiêu {formatBarrier(config.targetPct, "+")} / dừng lỗ {formatBarrier(config.stopPct, "-")} · {config.horizonSessions} phiên
        </span>
        {config.abstained && <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[11px] text-amber-300">abstained</span>}
      </div>
      {config.abstained && config.abstainReasons.length > 0 && (
        <ul className="list-disc pl-5 text-[11px] text-amber-200/90">
          {config.abstainReasons.map((reason) => <li key={reason}>{baseRatesReasonLabel(reason)}</li>)}
        </ul>
      )}
      {config.decisionUse && (
        <div className="rounded border border-emerald-900/50 bg-emerald-950/20 px-2.5 py-1.5" data-testid="base-rates-decision-use">
          <p className="text-[11px] font-semibold text-emerald-300">Dùng cho quyết định — đã qua gate kiểm định</p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <Metric label="P(chạm mục tiêu trước)" value={formatProbability(config.decisionUse.probTargetFirst)} />
            <Metric label="P(chạm dừng lỗ trước)" value={formatProbability(config.decisionUse.probStopFirst)} />
            <Metric label="P(hết hạn)" value={formatProbability(config.decisionUse.probTimeout)} />
            <Metric label="EV ròng (sau phí/thuế)" value={formatFractionPct(config.decisionUse.evNetFraction, 2)} />
          </dl>
        </div>
      )}
      {config.research && (
        <div className="rounded border border-slate-800 px-2.5 py-1.5" data-testid="base-rates-research">
          <p className={`text-[11px] font-semibold ${config.research.label === "validated" ? "text-emerald-300" : "text-amber-300"}`}>
            {config.research.label === "validated"
              ? "Số nghiên cứu — đã kiểm định (validated)"
              : "Số nghiên cứu — chưa kiểm định / unvalidated, không dùng để ra quyết định"}
          </p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <Metric label="P(mục tiêu trước)" value={formatProbability(config.research.probTargetFirst)} />
            <Metric label="P(dừng lỗ trước)" value={formatProbability(config.research.probStopFirst)} />
            <Metric label="P(hết hạn)" value={formatProbability(config.research.probTimeout)} />
            <Metric label="EV ròng" value={formatFractionPct(config.research.evNetFraction, 2)} />
            <Metric label="Prior P(mục tiêu)" value={formatProbability(config.research.prior?.probTargetFirst)} />
            <Metric label="k láng giềng" value={config.research.k == null ? "—" : String(config.research.k)} />
            <Metric label="Mẫu đủ điều kiện" value={config.research.nEligible == null ? "—" : config.research.nEligible.toLocaleString("vi-VN")} />
            <Metric label="Nến tín hiệu" value={formatVnDateTime(config.research.signalBarOpenTimeMs)} />
          </dl>
        </div>
      )}
      {v ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Kiểm định walk-forward OOS ·{" "}
            <span className={v.gatePassed ? "text-emerald-300" : "text-amber-300"}>{v.gatePassed ? "qua gate" : "chưa qua gate"}</span>
          </p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
            <Metric label="n OOS" value={v.nOos == null ? "—" : v.nOos.toLocaleString("vi-VN")} />
            <Metric label="n hiệu dụng (không chồng lấn)" value={v.nEffective == null ? "—" : v.nEffective.toLocaleString("vi-VN")} />
            <Metric label="Brier kNN / prior" value={`${formatDecimal(v.brierKnn)} / ${formatDecimal(v.brierPrior)}`} />
            <Metric label="CI90 ΔBrier (kNN − prior)" value={v.brierDiffCi90 ? `[${formatDecimal(v.brierDiffCi90[0])}; ${formatDecimal(v.brierDiffCi90[1])}]` : "—"} />
            <Metric label="ECE" value={formatDecimal(v.ece)} />
            <Metric label="Coverage" value={formatProbability(v.coverage)} />
            <Metric label="Tỉ lệ abstain" value={formatProbability(v.abstentionRate)} />
            <Metric label="EV ròng OOS TB" value={formatFractionPct(v.evNetOosMean, 2)} />
          </dl>
          {!v.gatePassed && v.gateReasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-[11px] text-slate-400">
              {v.gateReasons.map((reason) => <li key={reason}>{baseRatesReasonLabel(reason)}</li>)}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">Chưa có số liệu kiểm định cho cấu hình này.</p>
      )}
    </li>
  );
}

export function EquityBaseRatesPanel({
  symbol,
  state,
  onReload,
}: {
  symbol: string;
  state: PanelState<EquityOptional<EquityBaseRates>>;
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-base-rates`;
  const ready = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  const stale = ready ? ready.reasons.some(isStaleReason) : false;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Base rates định lượng ({symbol} · 1d)</h3>
        <div className="flex items-center gap-2">
          {ready && <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${STATUS_BADGE[ready.status]}`}>{ready.status}</span>}
          {stale && <span className="rounded bg-amber-950/50 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">stale</span>}
          <RefreshButton onClick={onReload} loading={state.kind === "loading"} label={`Làm mới base rates ${symbol}`} />
        </div>
      </div>
      <div className="space-y-3 p-3">
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải base rates…</p>}
        {state.kind === "error" && <ErrorBox onRetry={onReload}>Không tải được base rates: {state.message}</ErrorBox>}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <UnavailableBox testId={`${testId}-unavailable`}>Base rates chưa khả dụng: {unavailableCopy(state.value)}</UnavailableBox>
        )}
        {ready && (
          <>
            <p className="text-[11px] text-slate-500">
              Xác suất chạm mục tiêu/dừng lỗ trước theo kNN trên OHLCV điều chỉnh của riêng {symbol}; entry giả lập = giá mở phiên kế tiếp, không phải lệnh khớp thật.
              Chỉ phần “dùng cho quyết định” đã qua gate (n hiệu dụng ≥ 30, CI90 ΔBrier &lt; 0, ECE ≤ 0,05).
            </p>
            {ready.reasons.length > 0 && (
              <ul className="space-y-1" data-testid={`${testId}-reasons`}>
                {ready.reasons.map((reason) => (
                  <li key={reason} className={`flex items-start gap-1.5 text-[11px] ${isStaleReason(reason) ? "text-amber-300" : "text-slate-400"}`}>
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {baseRatesReasonLabel(reason)}
                  </li>
                ))}
              </ul>
            )}
            {ready.status === "unavailable" && ready.configs.length === 0 && (
              <UnavailableBox testId={`${testId}-unavailable`}>Không có artifact base-rates hợp lệ cho {symbol} — không dùng số của mã khác thay thế.</UnavailableBox>
            )}
            {ready.artifact && (
              <p className="font-mono text-[11px] text-slate-500">
                artifact {formatVnDateTime(Date.parse(ready.artifact.generatedAtUtc))} · dữ liệu tới nến {formatVnDateTime(ready.artifact.dataAsOfOpenTimeMs)} · {ready.artifact.methodVersion} · {ready.artifact.protocolVersion} · basis {ready.artifact.priceBasis}
                {ready.artifact.datasetSha256 ? ` · sha ${ready.artifact.datasetSha256.slice(0, 12)}` : ""}
              </p>
            )}
            {ready.configs.length > 0 && (
              <ul className="space-y-2">
                {ready.configs.map((config) => <BaseRatesConfigCard key={config.configId} config={config} />)}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// --- context ------------------------------------------------------------------------

const SECTION_STATUS_LABEL: Record<ContextSectionStatus, string> = {
  ok: "có dữ liệu",
  empty: "trống",
  unavailable: "không khả dụng",
};

/** EQX v2 §A4 stale benchmark reasons — the returns are withheld, not shown as ok. */
const RS_STALE_COPY: Record<string, string> = {
  "benchmark-stale": "Nến mới nhất của benchmark cũ hơn nến của mã quá 1 phiên — không dùng để so sánh.",
  "aligned-window-ends-before-instrument-latest": "Cửa sổ phiên chung kết thúc trước nến mới nhất của mã — không dùng để so sánh.",
};

function SectionStatus<T>({ title, testId, section, children }: { title: string; testId: string; section: ContextSection<T>; children: ReactNode }) {
  return (
    <div className="space-y-1.5" data-testid={testId} data-status={section.status}>
      <div className="flex flex-wrap items-center gap-1.5">
        <h4 className="text-xs font-semibold text-slate-300">{title}</h4>
        <span className={`rounded px-1.5 py-0.5 text-[10px] ${section.status === "ok" ? "bg-emerald-950/40 text-emerald-300" : section.status === "empty" ? "bg-slate-800 text-slate-400" : "bg-amber-950/50 text-amber-300"}`}>
          {SECTION_STATUS_LABEL[section.status]}
        </span>
      </div>
      {section.status !== "ok" && (
        <p className="text-[11px] text-slate-500">{section.reason ?? (section.status === "empty" ? "Không có bản ghi." : "Nguồn chưa khả dụng.")}</p>
      )}
      {section.status === "ok" && children}
    </div>
  );
}

function formatAvailableAt(value: string | null): string {
  if (!value) return "—";
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? formatVnDateTime(ms) : value;
}

export function EquityContextPanel({
  symbol,
  state,
  onReload,
}: {
  symbol: string;
  state: PanelState<EquityOptional<EquityContext>>;
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-context`;
  const ctx = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  const windows = ctx
    ? [...new Set(ctx.relativeStrength.items.flatMap((b) => Object.keys(b.returns)))].sort((a, b) => Number(a) - Number(b))
    : [];
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Bối cảnh {symbol}</h3>
        <div className="flex items-center gap-2">
          {ctx && <span className="font-mono text-[11px] text-slate-500">tạo lúc {formatAvailableAt(ctx.generatedAtUtc)}</span>}
          <RefreshButton onClick={onReload} loading={state.kind === "loading"} label={`Làm mới bối cảnh ${symbol}`} />
        </div>
      </div>
      <div className="space-y-4 p-3">
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải bối cảnh…</p>}
        {state.kind === "error" && <ErrorBox onRetry={onReload}>Không tải được bối cảnh: {state.message}</ErrorBox>}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <UnavailableBox testId={`${testId}-unavailable`}>Bối cảnh chưa khả dụng: {unavailableCopy(state.value)}</UnavailableBox>
        )}
        {ctx && (
          <>
            <SectionStatus title="Sức mạnh tương đối (theo phiên chung)" testId={`${testId}-rs`} section={ctx.relativeStrength}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                      <th className="py-1 pr-3 font-medium">Benchmark</th>
                      <th className="py-1 pr-3 font-medium">Phiên chung</th>
                      {windows.map((w) => <th key={w} className="py-1 pr-3 font-medium">{w} phiên: {symbol} / BM / vượt trội</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ctx.relativeStrength.items.map((b) => (
                      <tr key={b.symbol} className="border-b border-slate-800/60 text-slate-300" data-testid={`${testId}-rs-${b.symbol}`} data-status={b.status}>
                        <td className="py-1 pr-3 font-mono">{b.symbol}{b.kind ? <span className="ml-1 text-[10px] text-slate-500">{b.kind === "index" ? "chỉ số" : "peer"}</span> : null}</td>
                        {b.status === "ok" ? (
                          <>
                            <td className="py-1 pr-3 font-mono tabular-nums">{b.alignedSessions ?? "—"}</td>
                            {windows.map((w) => {
                              const r = b.returns[w];
                              return (
                                <td key={w} className="py-1 pr-3 font-mono tabular-nums">
                                  {r ? `${formatFractionPct(r.instrument)} / ${formatFractionPct(r.benchmark)} / ${formatFractionPct(r.excess)}` : "—"}
                                </td>
                              );
                            })}
                          </>
                        ) : b.status === "stale" ? (
                          <td colSpan={1 + windows.length} className="py-1 pr-3 text-[11px] text-amber-300">
                            <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px]">benchmark cũ (stale)</span>{" "}
                            {RS_STALE_COPY[b.reason ?? ""] ?? "Benchmark chậm hơn dữ liệu của mã — không dùng để so sánh."}
                            {b.reason ? <span className="ml-1 font-mono text-slate-500">({b.reason})</span> : null}
                          </td>
                        ) : (
                          <td colSpan={1 + windows.length} className="py-1 pr-3 text-[11px] text-slate-500">
                            {SECTION_STATUS_LABEL[b.status]}{b.reason ? ` — ${b.reason}` : ""}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionStatus>

            <SectionStatus title="Sự kiện quyền (corporate actions)" testId={`${testId}-corporate-actions`} section={ctx.corporateActions}>
              <ul className="space-y-1">
                {ctx.corporateActions.items.map((item) => (
                  <li key={`${item.exDate}:${item.actionType}`} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    <span className="font-mono">GDKHQ {item.exDate}</span> · {item.actionType}
                    {item.ratioText ? ` · ${item.ratioText}` : ""}
                    {item.cashPerShareVnd != null ? ` · ${formatVnd(item.cashPerShareVnd)}/cp` : ""}
                    <span className="ml-1 text-[11px] text-slate-500">
                      [{item.verificationStatus ?? "unverified"} · {item.provenance ?? "nguồn?"} · khả dụng {formatAvailableAt(item.availableAtUtc)}]
                    </span>{" "}
                    <SourceLink url={item.sourceUrl} />
                  </li>
                ))}
              </ul>
            </SectionStatus>

            <SectionStatus title="Sự kiện doanh nghiệp" testId={`${testId}-events`} section={ctx.events}>
              <ul className="space-y-1">
                {ctx.events.items.map((item) => (
                  <li key={`${item.eventType}:${item.eventDate}:${item.title}`} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    <span className="font-mono">{item.eventDate}</span> · {item.eventType} · {item.title}
                    <span className="ml-1 text-[11px] text-slate-500">[khả dụng {formatAvailableAt(item.availableAtUtc)}]</span>{" "}
                    <SourceLink url={item.sourceUrl} />
                  </li>
                ))}
              </ul>
            </SectionStatus>

            <SectionStatus title="Chỉ tiêu cơ bản (point-in-time)" testId={`${testId}-fundamentals`} section={ctx.fundamentals}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                      <th className="py-1 pr-3 font-medium">Kỳ</th>
                      <th className="py-1 pr-3 font-medium">Chỉ tiêu</th>
                      <th className="py-1 pr-3 font-medium">Giá trị (đơn vị)</th>
                      <th className="py-1 pr-3 font-medium">Công bố</th>
                      <th className="py-1 pr-3 font-medium">Khả dụng từ</th>
                      <th className="py-1 font-medium">Nguồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ctx.fundamentals.items.map((item) => (
                      <tr key={`${item.period}:${item.metric}:${item.source ?? ""}`} className="border-b border-slate-800/60 text-slate-300">
                        <td className="py-1 pr-3 font-mono">{item.period}{item.periodEndDate ? <span className="block text-[10px] text-slate-500">kết thúc {item.periodEndDate}</span> : null}</td>
                        <td className="py-1 pr-3 font-mono">{item.metric}{item.note ? <span className="block text-[10px] font-sans text-slate-500">{item.note}</span> : null}</td>
                        <td className="py-1 pr-3 font-mono tabular-nums">
                          {item.value == null
                            ? <span className="text-[11px] text-slate-500">không khả dụng — {item.unavailableReason}</span>
                            : <>{formatFundamentalValue(item)} <span className="text-slate-500">({item.unit ?? "?"})</span></>}
                        </td>
                        <td className="py-1 pr-3 font-mono">{item.publishedDate ?? "—"}</td>
                        <td className="py-1 pr-3 font-mono">{formatAvailableAt(item.availableAtUtc)}</td>
                        <td className="py-1">
                          {item.source ?? "—"} <SourceLink url={item.sourceUrl} />
                          {item.sourceLocation ? (
                            <span className="block max-w-[28rem] text-[10px] text-slate-500" data-testid="fundamental-source-location">
                              {item.documentId ? <span className="font-mono">tài liệu {item.documentId.slice(0, 8)} · </span> : null}{item.sourceLocation}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionStatus>

            {ctx.limitations.length > 0 && (
              <ul className="space-y-1" data-testid={`${testId}-limitations`}>
                {ctx.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" /> {limitation}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// --- observations journal --------------------------------------------------------------

function actionLabel(decision: string): string {
  return MBB_ACTION_LABELS[decision as MbbDecisionAction] ?? decision;
}

export function EquityObservationsPanel({
  symbol,
  timeframe,
  state,
  onReload,
}: {
  symbol: string;
  timeframe: string;
  state: PanelState<EquityObservation[]> | { kind: "locked" };
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-observations`;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Nhật ký quan sát {symbol} ({timeframe})</h3>
        <RefreshButton onClick={onReload} loading={state.kind === "loading" || state.kind === "locked"} label={`Làm mới nhật ký ${symbol}`} />
      </div>
      <div className="space-y-2 p-3">
        <p className="text-[11px] text-slate-500">
          Nhật ký forward: mỗi nến đóng được ghi tối đa một quyết định; fill/kết quả ghi một lần khi quan sát được — nến bị lỡ không được backfill.
        </p>
        {state.kind === "locked" && (
          <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500" data-testid={`${testId}-locked`}>
            Nhật ký quan sát phản ánh quyết định theo vị thế (dữ liệu cá nhân) — mở khoá quản trị ở mục “Vị thế {symbol}” để xem.
          </p>
        )}
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải nhật ký…</p>}
        {state.kind === "error" && <ErrorBox onRetry={onReload}>Không tải được nhật ký quan sát: {state.message}</ErrorBox>}
        {state.kind === "ready" && state.value.length === 0 && (
          <p className="text-xs text-slate-500" data-testid={`${testId}-empty`}>Chưa có quan sát nào được ghi cho {symbol} {timeframe}.</p>
        )}
        {state.kind === "ready" && state.value.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                  <th className="py-1 pr-3 font-medium">Nến tín hiệu</th>
                  <th className="py-1 pr-3 font-medium">Quyết định</th>
                  <th className="py-1 pr-3 font-medium">Evidence</th>
                  <th className="py-1 pr-3 font-medium">Giá đóng</th>
                  <th className="py-1 pr-3 font-medium">Fill</th>
                  <th className="py-1 font-medium">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {state.value.map((row) => (
                  <tr key={row.decisionId} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-1 pr-3 font-mono">{formatVnDateTime(row.signalBarOpenTimeMs)}</td>
                    <td className="py-1 pr-3">{actionLabel(row.decision)}</td>
                    <td className="py-1 pr-3 font-mono text-[11px] text-slate-400">{row.evidenceStatus ?? "—"}</td>
                    <td className="py-1 pr-3 font-mono tabular-nums">{formatVnd(row.marketCloseVnd)}</td>
                    <td className="py-1 pr-3 font-mono tabular-nums">
                      {row.fillPrice == null ? <span className="text-slate-500">chưa quan sát</span> : `${formatVnd(row.fillPrice)}${row.fillSource ? ` (${row.fillSource})` : ""}`}
                    </td>
                    <td className="py-1 font-mono tabular-nums">
                      {row.outcomeReturn == null ? <span className="text-slate-500">chờ</span> : `${formatFractionPct(row.outcomeReturn, 2)}${row.outcomeHorizon ? ` · ${row.outcomeHorizon}` : ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// --- issuer source documents (EQX v2 §C1) ----------------------------------------------

const AUDIT_LABEL: Record<string, string> = {
  audited: "đã kiểm toán", reviewed: "đã soát xét", unaudited: "chưa kiểm toán", unknown: "kiểm toán: không nêu",
};

export function SourceDocumentsPanel({
  symbol,
  state,
  onReload,
}: {
  symbol: string;
  state: PanelState<EquityOptional<SourceDocument[]>>;
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-source-documents`;
  const docs = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Tài liệu gốc của tổ chức phát hành ({symbol})</h3>
        <RefreshButton onClick={onReload} loading={state.kind === "loading"} label={`Làm mới tài liệu gốc ${symbol}`} />
      </div>
      <div className="space-y-3 p-3">
        <p className="text-[11px] text-slate-500">
          Chỉ metadata + nguồn gốc (URL, sha256, kỳ, hợp nhất/riêng, trạng thái kiểm toán như tài liệu nêu); file gốc không được phục vụ qua web.
          Chỉ số chỉ được trích khi đọc được từ tài liệu kèm trang — phần còn lại liệt kê là thiếu.
        </p>
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải tài liệu gốc…</p>}
        {state.kind === "error" && <ErrorBox onRetry={onReload}>Không tải được tài liệu gốc: {state.message}</ErrorBox>}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <UnavailableBox testId={`${testId}-unavailable`}>Tài liệu gốc chưa khả dụng: {unavailableCopy(state.value)}</UnavailableBox>
        )}
        {docs && docs.length === 0 && <p className="text-xs text-slate-500" data-testid={`${testId}-empty`}>Chưa có tài liệu gốc nào được đăng ký cho {symbol}.</p>}
        {docs && docs.length > 0 && (
          <ul className="space-y-1.5">
            {docs.map((doc) => (
              <li key={doc.documentId} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300" data-testid="source-document">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-slate-200">{doc.reportingPeriod ?? "—"}</span>
                  <span>{doc.title}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{doc.consolidation === "consolidated" ? "hợp nhất" : doc.consolidation === "separate" ? "riêng" : "không rõ"}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{AUDIT_LABEL[doc.auditStatus] ?? doc.auditStatus}</span>
                  <SourceLink url={doc.sourceUrl} />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {doc.provider} · sha256 <span className="font-mono">{doc.contentSha256.slice(0, 12)}</span>
                  {doc.publishedAtUtc ? ` · công bố ${formatAvailableAt(doc.publishedAtUtc)}` : ""}
                  {doc.fetchedAtUtc ? ` · tải ${formatAvailableAt(doc.fetchedAtUtc)}` : ""}
                  {doc.pageCount != null ? ` · ${doc.pageCount} trang, ${doc.pagesWithText ?? 0} có lớp chữ` : ""}
                </p>
                <p className="mt-0.5 text-[11px]">
                  <span className="text-emerald-300/80">Trích được: {doc.extractedMetrics.length > 0 ? doc.extractedMetrics.join(", ") : "không có"}</span>
                  {doc.missingMetrics.length > 0 && <span className="text-slate-500"> · thiếu: {doc.missingMetrics.join(", ")}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
