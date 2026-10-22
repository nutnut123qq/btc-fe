"use client";

import { AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import type { PanelState } from "./EquityResearchPanels";
import { formatBarrier, formatDecimal, formatFractionPct, formatProbability, type EquityOptional } from "@/lib/equity";
import {
  scoringConclusive,
  type ForecastJournal,
  type ForecastRecord,
  type ForecastScoring,
  type LlmRun,
  type LlmSource,
  type QuantReference,
} from "@/lib/equityJournal";
import {
  NOTE_ACTION_LABEL,
  NOTE_BASIS_LABEL,
  NOTE_DIRECTION_LABEL,
  type ResearchNote,
} from "@/lib/equityResearch";
import { formatVnDateTime } from "@/lib/mbb";

const SECTION = "overflow-hidden rounded border border-slate-800 bg-slate-900";
const SECTION_HEAD = "flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-1";

function unavailableCopy(result: { httpStatus: number; code: string | null }): string {
  if (result.code === "UNSUPPORTED_CAPABILITY") return "Backend báo mã này chưa có capability cho bề mặt này.";
  return `Backend hiện tại chưa cung cấp bề mặt này (HTTP ${result.httpStatus}).`;
}

function Refresh({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} aria-label={label} className="inline-flex min-h-9 items-center px-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50">
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}

function ErrorRow({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <button type="button" onClick={onRetry} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
    </div>
  );
}

function formatIso(value: string | null): string {
  if (!value) return "—";
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? formatVnDateTime(ms) : value;
}

// --- forecast journal ----------------------------------------------------------------------

const OUTCOME_LABEL: Record<string, string> = {
  "target-first": "chạm mục tiêu trước",
  "stop-first": "chạm dừng lỗ trước",
  timeout: "hết hạn",
};

function SourceBadge({ record }: { record: ForecastRecord }) {
  if (record.source === "llm-judge") {
    return <span className="rounded bg-violet-950/50 px-1.5 py-0.5 text-[10px] text-violet-300">LLM · chưa kiểm định</span>;
  }
  if (record.source === "session-research") {
    return <span className="rounded bg-sky-950/50 px-1.5 py-0.5 text-[10px] text-sky-300">session · chưa kiểm định</span>;
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] ${record.validated ? "bg-emerald-950/40 text-emerald-300" : "bg-amber-950/50 text-amber-300"}`}>
      quant · {record.validated ? "đã kiểm định" : "chưa kiểm định"}
    </span>
  );
}

function ScoringCard({ scoring }: { scoring: ForecastScoring }) {
  return (
    <li className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs" data-testid={`journal-scoring-${scoring.configId}`} data-status={scoring.status}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono font-medium text-slate-200">{scoring.configId}</span>
        <span className="text-slate-500">cặp quant/LLM đã đáo hạn: {scoring.pairedN} · n hiệu dụng {scoring.nEffective}</span>
      </div>
      {scoring.status === "no-data" && <p className="mt-1 text-slate-500">Chưa có cặp dự báo nào đã đáo hạn để chấm điểm.</p>}
      {scoring.status === "insufficient-sample" && (
        <p className="mt-1 text-amber-300">Chưa đủ mẫu (n hiệu dụng {scoring.nEffective} &lt; 30) — chưa kết luận nguồn nào tốt hơn.</p>
      )}
      {scoringConclusive(scoring) && (
        <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          <div><dt className="text-slate-500">Brier quant</dt><dd className="font-mono tabular-nums text-slate-200">{formatDecimal(scoring.brierQuant)}</dd></div>
          <div><dt className="text-slate-500">Brier LLM</dt><dd className="font-mono tabular-nums text-slate-200">{formatDecimal(scoring.brierLlm)}</dd></div>
          <div><dt className="text-slate-500">Δ (LLM − quant)</dt><dd className="font-mono tabular-nums text-slate-200">{formatDecimal(scoring.brierDiff)}</dd></div>
        </dl>
      )}
      <p className="mt-1 text-[11px] text-slate-500">
        Coverage quant {formatProbability(scoring.coverageQuant)} · LLM {formatProbability(scoring.coverageLlm)}
        {scoringConclusive(scoring) ? " · LLM không tự động được thăng hạng." : ""}
      </p>
    </li>
  );
}

export function ForecastJournalPanel({
  symbol,
  state,
  onReload,
}: {
  symbol: string;
  state: PanelState<EquityOptional<ForecastJournal>>;
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-journal`;
  const journal = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Nhật ký dự báo & chấm điểm ({symbol} · 1d)</h3>
        <Refresh onClick={onReload} loading={state.kind === "loading"} label={`Làm mới nhật ký dự báo ${symbol}`} />
      </div>
      <div className="space-y-3 p-3">
        <p className="text-[11px] text-slate-500">
          Dự báo ghi một lần cho nến 1d finalized mới nhất; kết quả chỉ điền khi đủ số phiên — chưa đủ thì là “chưa đáo hạn”, không đoán trước.
        </p>
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải nhật ký dự báo…</p>}
        {state.kind === "error" && <ErrorRow message={`Không tải được nhật ký dự báo: ${state.message}`} onRetry={onReload} />}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400" data-testid={`${testId}-unavailable`}>
            Nhật ký dự báo chưa khả dụng: {unavailableCopy(state.value)}
          </p>
        )}
        {journal && (
          <>
            {journal.scoring.length > 0 && <ul className="space-y-2">{journal.scoring.map((s) => <ScoringCard key={s.configId} scoring={s} />)}</ul>}
            {journal.items.length === 0 ? (
              <p className="text-xs text-slate-500" data-testid={`${testId}-empty`}>Chưa có dự báo nào được ghi cho {symbol}.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                      <th className="py-1 pr-3 font-medium">Nến tín hiệu</th>
                      <th className="py-1 pr-3 font-medium">Nguồn</th>
                      <th className="py-1 pr-3 font-medium">Cấu hình</th>
                      <th className="py-1 pr-3 font-medium">P(mục tiêu) / P(dừng lỗ)</th>
                      <th className="py-1 font-medium">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.items.map((item) => (
                      <tr key={item.forecastId} className="border-b border-slate-800/60 text-slate-300" data-testid="journal-row">
                        <td className="py-1 pr-3 font-mono">{formatVnDateTime(item.signalBarOpenTimeMs)}</td>
                        <td className="py-1 pr-3"><SourceBadge record={item} /></td>
                        <td className="py-1 pr-3 font-mono text-[11px]">
                          {item.configId} <span className="text-slate-500">{formatBarrier(item.targetPct, "+")}/{formatBarrier(item.stopPct, "-")} · {item.horizonSessions}p</span>
                        </td>
                        <td className="py-1 pr-3 font-mono tabular-nums">
                          {item.abstained
                            ? <span className="text-slate-500">abstain{item.abstainReason ? ` — ${item.abstainReason}` : ""}</span>
                            : `${formatProbability(item.probTargetFirst)} / ${formatProbability(item.probStopFirst)}`}
                        </td>
                        <td className="py-1 font-mono tabular-nums">
                          {item.outcome == null
                            ? <span className="text-slate-500">chưa đáo hạn</span>
                            : `${OUTCOME_LABEL[item.outcome.label]} · ${formatFractionPct(item.outcome.returnNet, 2)} ròng`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// --- LLM runs ------------------------------------------------------------------------------

const RUN_STATUS_BADGE: Record<string, string> = {
  succeeded: "bg-emerald-950/40 text-emerald-300",
  failed: "bg-rose-950/40 text-rose-300",
  unavailable: "bg-slate-800 text-slate-400",
};

const DIRECTION_LABEL: Record<string, string> = { up: "tăng", down: "giảm", sideways: "đi ngang" };

function SourceRefs({ ids, sources }: { ids: string[]; sources: LlmSource[] }) {
  if (ids.length === 0) return null;
  return (
    <span className="ml-1 text-[10px] text-slate-500">
      [{ids.map((id) => sources.findIndex((s) => s.id === id) + 1).map((n) => `#${n}`).join(", ")}]
    </span>
  );
}

/** Quant number for (configId, signal bar) — null unless a same-bar quant forecast exists. */
export type QuantLookup = (configId: string, signalBarOpenTimeMs: number) => QuantReference | null;

function LlmRunCard({ run, quantFor }: { run: LlmRun; quantFor: QuantLookup }) {
  const out = run.output;
  return (
    <li className="space-y-2 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs" data-testid="llm-run" data-status={run.status}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${RUN_STATUS_BADGE[run.status]}`}>{run.status}</span>
        <span className="text-slate-400">{formatIso(run.createdAtUtc)}</span>
        <span className="font-mono text-[11px] text-slate-500">
          nến {formatVnDateTime(run.signalBarOpenTimeMs)} · {run.researchModel ?? "—"} / {run.judgeModel ?? "—"} · {run.promptVersion ?? "—"}
          {run.durationMs != null ? ` · ${Math.round(run.durationMs / 1000)}s` : ""}
        </span>
      </div>
      {run.status === "unavailable" && (
        <p className="text-slate-400">LLM chưa khả dụng — chưa cấu hình khoá LLM / pending{run.reason ? ` (${run.reason})` : ""}.</p>
      )}
      {run.status === "failed" && <p className="text-rose-300">Run thất bại{run.reason ? `: ${run.reason}` : ""}. Không có output được dùng.</p>}
      {run.status === "succeeded" && !out && <p className="text-slate-500">Run không có output hợp lệ để hiển thị.</p>}
      {out && (
        <>
          <p className="text-[11px] text-slate-500">
            Bằng chứng: {out.evidenceStatus === "sourced" ? "có nguồn dẫn" : "không đủ nguồn — đọc như ý kiến"}
          </p>
          {out.veto.active && (
            <p className="flex items-start gap-1.5 rounded border border-amber-900/50 bg-amber-950/20 px-2.5 py-1.5 text-amber-200" data-testid="llm-veto">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Veto của LLM (chỉ là cảnh báo — không đổi quyết định đề xuất): {out.veto.reason}<SourceRefs ids={out.veto.sourceIds} sources={out.sources} /></span>
            </p>
          )}
          {out.scenarios.length > 0 && (
            <ul className="space-y-1">
              {out.scenarios.map((scenario, index) => (
                <li key={index} className="text-slate-300">
                  <span className="font-medium text-slate-200">{scenario.name}</span>{" "}
                  <span className="text-[11px] text-slate-500">({DIRECTION_LABEL[scenario.direction]})</span>: {scenario.description}
                  <SourceRefs ids={scenario.sourceIds} sources={out.sources} />
                </li>
              ))}
            </ul>
          )}
          {out.warnings.length > 0 && (
            <ul className="space-y-1">
              {out.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> <span>{warning.text}<SourceRefs ids={warning.sourceIds} sources={out.sources} /></span>
                </li>
              ))}
            </ul>
          )}
          {out.adjustedForecasts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs" data-testid="llm-adjusted-forecasts">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-500">
                    <th className="py-1 pr-3 font-medium">Cấu hình</th>
                    <th className="py-1 pr-3 font-medium">LLM P(mục tiêu)/P(dừng lỗ) · chưa kiểm định</th>
                    <th className="py-1 pr-3 font-medium">Quant P(mục tiêu) · cùng nến</th>
                    <th className="py-1 font-medium">Lập luận</th>
                  </tr>
                </thead>
                <tbody>
                  {out.adjustedForecasts.map((f) => {
                    const quant = quantFor(f.configId, run.signalBarOpenTimeMs);
                    return (
                      <tr key={f.configId} className="border-b border-slate-800/60 text-slate-300">
                        <td className="py-1 pr-3 font-mono">{f.configId}</td>
                        <td className="py-1 pr-3 font-mono tabular-nums">{formatProbability(f.probTargetFirst)} / {formatProbability(f.probStopFirst)}</td>
                        <td className="py-1 pr-3 font-mono tabular-nums">
                          {quant
                            ? `${formatProbability(quant.probTargetFirst)} (${quant.validated ? "đã kiểm định" : "chưa kiểm định"}${quant.source === "journal" ? " · nhật ký" : ""})`
                            : <span title="Không có dự báo quant cho cùng nến tín hiệu">—</span>}
                        </td>
                        <td className="py-1">{f.rationale}<SourceRefs ids={f.sourceIds} sources={out.sources} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {out.sources.length > 0 && (
            <ol className="list-decimal space-y-0.5 pl-5 text-[11px] text-slate-400">
              {out.sources.map((source) => (
                <li key={source.id}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-0.5 text-teal-400 hover:text-teal-300">
                      {source.title} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{source.title} <span className="text-slate-600">(link không hợp lệ — không hiển thị)</span></span>
                  )}
                  {source.publishedAt ? <span className="ml-1 text-slate-500">· {source.publishedAt}</span> : null}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </li>
  );
}

/** EQX v2 §B: the in-app LLM layer is disabled; research happens in a session. */
export const LLM_DISABLED_NOTE = "Lớp LLM trong app đã ngừng — nghiên cứu được thực hiện qua session (skill investment-research)";

/** Read-only history of the (now disabled) in-app LLM runs. Nothing here can create a run. */
export function LlmRunsPanel({
  symbol,
  state,
  onReload,
  quantFor,
}: {
  symbol: string;
  state: PanelState<EquityOptional<LlmRun[]>>;
  onReload: () => void;
  quantFor: QuantLookup;
}) {
  const testId = `${symbol.toLowerCase()}-llm`;
  const runs = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Phân tích LLM cũ ({symbol}) · chỉ đọc · chưa kiểm định</h3>
        <Refresh onClick={onReload} loading={state.kind === "loading"} label={`Làm mới phân tích LLM ${symbol}`} />
      </div>
      <div className="space-y-3 p-3">
        <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300" data-testid={`${testId}-disabled-note`}>
          {LLM_DISABLED_NOTE}.
        </p>
        <p className="text-[11px] text-slate-500">
          Các run LLM cũ chỉ để tham khảo lịch sử: không đổi hành động của quyết định đề xuất, không vượt hard gates; veto chỉ là cảnh báo.
        </p>
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải các run LLM…</p>}
        {state.kind === "error" && <ErrorRow message={`Không tải được các run LLM: ${state.message}`} onRetry={onReload} />}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400" data-testid={`${testId}-unavailable`}>
            Phân tích LLM chưa khả dụng: {unavailableCopy(state.value)}
          </p>
        )}
        {runs && runs.length === 0 && <p className="text-xs text-slate-500" data-testid={`${testId}-empty`}>Chưa có run LLM nào cho {symbol}.</p>}
        {runs && runs.length > 0 && (
          <ul className="space-y-2">{runs.map((run) => <LlmRunCard key={run.runId} run={run} quantFor={quantFor} />)}</ul>
        )}
      </div>
    </section>
  );
}

// --- session research notes (EQX v2 §B) --------------------------------------------------

function NoteCard({ note }: { note: ResearchNote }) {
  return (
    <li className="space-y-1.5 rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs" data-testid="research-note" data-mode={note.mode}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${note.mode === "forward" ? "bg-sky-950/50 text-sky-300" : "bg-slate-800 text-slate-300"}`}>
          {note.mode === "forward" ? "forward" : "retrospective · không chấm như dự báo"}
        </span>
        <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">chưa kiểm định</span>
        <span className="text-slate-400">as-of {formatIso(note.requestedAsOfUtc)}</span>
        <span className="font-mono text-[11px] text-slate-500">nến {formatVnDateTime(note.signalBarOpenTimeMs)} · {note.horizonSessions} phiên</span>
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        <div><dt className="inline text-slate-500">Hướng giá: </dt><dd className="inline text-slate-200">{NOTE_DIRECTION_LABEL[note.direction]}</dd></div>
        <div>
          <dt className="inline text-slate-500">Hành động: </dt>
          <dd className="inline text-slate-200">{NOTE_ACTION_LABEL[note.actionView]} <span className="text-slate-500">({NOTE_BASIS_LABEL[note.actionBasis]})</span></dd>
        </div>
        <div><dt className="inline text-slate-500">Skill / method: </dt><dd className="inline font-mono text-[11px] text-slate-300">{note.skillVersion} · {note.methodVersion}</dd></div>
        <div>
          <dt className="inline text-slate-500">Snapshot: </dt>
          <dd className="inline break-all font-mono text-[11px] text-slate-300">
            {note.snapshotId}
            {note.snapshotVerified === false ? <span className="ml-1 font-sans text-amber-300">(chưa xác minh)</span> : null}
          </dd>
        </div>
      </dl>
      {note.thesis && <p className="text-slate-300">{note.thesis}</p>}
      {note.probability ? (
        <p className="text-[11px] text-slate-400" data-testid="research-note-probability">
          Xác suất (chưa kiểm định{note.probability.configId ? ` · ${note.probability.configId}` : ""}): P(mục tiêu) {formatProbability(note.probability.probTargetFirst)} / P(dừng lỗ) {formatProbability(note.probability.probStopFirst)}
          {" "}— phương pháp {note.probability.method} ({note.probability.methodRef})
        </p>
      ) : (
        <p className="text-[11px] text-slate-500" data-testid="research-note-no-probability">Không có xác suất: ghi chú không khai báo phương pháp tái lập.</p>
      )}
    </li>
  );
}

export function ResearchNotesPanel({
  symbol,
  state,
  onReload,
}: {
  symbol: string;
  state: PanelState<EquityOptional<ResearchNote[]>> | { kind: "locked" };
  onReload: () => void;
}) {
  const testId = `${symbol.toLowerCase()}-research-notes`;
  const notes = state.kind === "ready" && state.value.status === "ok" ? state.value.data : null;
  return (
    <section className={SECTION} aria-labelledby={`${testId}-title`} data-testid={testId}>
      <div className={SECTION_HEAD}>
        <h3 id={`${testId}-title`} className="text-[13px] font-semibold text-slate-200">Ghi chú nghiên cứu session ({symbol}) · chỉ đọc · chưa kiểm định</h3>
        {state.kind !== "locked" && <Refresh onClick={onReload} loading={state.kind === "loading"} label={`Làm mới ghi chú nghiên cứu ${symbol}`} />}
      </div>
      <div className="space-y-3 p-3">
        <p className="text-[11px] text-slate-500">
          Ghi chú do session nghiên cứu (skill investment-research) ghi, bất biến sau khi ghi. Chỉ ghi chú forward mới được chấm như dự báo; retrospective chỉ để lưu.
        </p>
        {state.kind === "locked" && (
          <p className="text-xs text-slate-500" data-testid={`${testId}-locked`}>Ghi chú nghiên cứu có thể suy ra vị thế — cần khoá quản trị (mục “Vị thế {symbol}”).</p>
        )}
        {state.kind === "loading" && <p className="text-sm text-slate-500">Đang tải ghi chú nghiên cứu…</p>}
        {state.kind === "error" && <ErrorRow message={`Không tải được ghi chú nghiên cứu: ${state.message}`} onRetry={onReload} />}
        {state.kind === "ready" && state.value.status === "unavailable" && (
          <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400" data-testid={`${testId}-unavailable`}>
            Ghi chú nghiên cứu chưa khả dụng: {unavailableCopy(state.value)}
          </p>
        )}
        {notes && notes.length === 0 && <p className="text-xs text-slate-500" data-testid={`${testId}-empty`}>Chưa có ghi chú nghiên cứu nào cho {symbol}.</p>}
        {notes && notes.length > 0 && <ul className="space-y-2">{notes.map((note) => <NoteCard key={note.noteId} note={note} />)}</ul>}
      </div>
    </section>
  );
}
