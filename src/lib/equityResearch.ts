// EQX v2 — shared cash pool + buy budget semantics (spec v2 §A3) and the session
// research journal (spec v2 §B, equity-research-notes-v1). Same fail-closed posture
// as equity.ts for required fields; additive fields degrade (pitfall #30). Research
// notes are session output: never validated, probabilities only behind a declared
// reproducible method.

import type { MbbDecision, MbbPosition } from "./mbb.ts";

const ERR = "INVALID_EQUITY_RESPONSE";

// --- decision reason codes (A3) -------------------------------------------------------

/** Reason codes the decision emits for the shared cash pool / buy budget (spec v2 §A3). */
export const CASH_REASON_COPY: Record<string, string> = {
  "buy-budget-undeclared": "Chưa khai báo ngân sách mua thêm cho mã này — không đề xuất số lượng mua.",
  "cash-unknown": "Quỹ tiền mặt chung chưa được nhập — không biết sức mua, không đề xuất số lượng mua.",
  "budget-exceeds-cash": "Tổng ngân sách mua của các mã vượt quỹ tiền mặt chung — không đề xuất số lượng mua cho tới khi điều chỉnh.",
};

const CORPORATE_ACTION_UNCONVERTED = /^corporate-action-unconverted:([a-z0-9-]+)$/;

/** Human copy for one decision reason code; unknown codes are shown verbatim. */
export function describeDecisionReason(code: string): string {
  if (CASH_REASON_COPY[code]) return `${code} — ${CASH_REASON_COPY[code]}`;
  const converted = /^corporate-action-converted:([a-z0-9-]+)$/.exec(code);
  if (converted) return `${code} — lô mua trước GDKHQ đã được quy đổi theo sự kiện quyền "${converted[1]}" đã xác minh (số cổ phiếu/giá vốn sau quy đổi).`;
  const ca = CORPORATE_ACTION_UNCONVERTED.exec(code);
  if (ca) return `${code} — sự kiện quyền "${ca[1]}" chưa quy đổi được: không tính lãi/lỗ, tiền về và các mức theo giá vốn.`;
  return code;
}

/** `corporate-action-unconverted:{type}` codes on the decision (PnL/proceeds withheld). */
export function unconvertedCorporateActionReasons(decision: Pick<MbbDecision, "reasons">): string[] {
  return decision.reasons.filter((r) => CORPORATE_ACTION_UNCONVERTED.test(r));
}

export type BuyQuantityGate = { show: true } | { show: false; reason: string };

/**
 * A buy quantity is only ever shown with a declared budget (spec v2 §A3): the position
 * must report a non-null `buyBudgetVnd` and the decision must not carry a cash/budget
 * blocking reason. An older backend (no budget concept) therefore never shows one.
 */
export function buyQuantityGate(decision: Pick<MbbDecision, "reasons" | "buyMore">, position: MbbPosition | null): BuyQuantityGate {
  const blocking = decision.reasons.find((r) => r in CASH_REASON_COPY);
  if (blocking) return { show: false, reason: blocking };
  if (!position) return { show: false, reason: "position-not-loaded" };
  if (!position.cashPoolReported) return { show: false, reason: "budget-not-supported-by-backend" };
  if (position.sharedCashVnd == null) return { show: false, reason: "cash-unknown" };
  if (position.buyBudgetVnd == null) return { show: false, reason: "buy-budget-undeclared" };
  if (decision.buyMore == null) return { show: false, reason: "no-buy-capacity" };
  return { show: true };
}

export const BUY_GATE_COPY: Record<string, string> = {
  ...CASH_REASON_COPY,
  "position-not-loaded": "Chưa tải được vị thế — không đề xuất số lượng mua.",
  "budget-not-supported-by-backend": "Backend hiện tại chưa hỗ trợ ngân sách mua theo mã (quỹ tiền chung) — không đề xuất số lượng mua.",
  "no-buy-capacity": "Không có sức mua thêm.",
};

// --- research notes (equity-research-notes-v1) ---------------------------------------------

export const RESEARCH_NOTES_CONTRACT = "equity-research-notes-v1";
export const NOTE_MODES = ["forward", "retrospective"] as const;
export const NOTE_DIRECTIONS = ["up", "down", "sideways", "no-view"] as const;
export const NOTE_ACTION_VIEWS = ["buy-more", "hold", "reduce", "sell", "wait", "none"] as const;
export const NOTE_ACTION_BASES = ["position-aware", "market-only", "insufficient-input"] as const;

export interface NoteProbability {
  configId: string | null;
  probTargetFirst: number | null;
  probStopFirst: number | null;
  method: string;
  methodRef: string;
}

export interface ResearchNote {
  noteId: string;
  symbol: string;
  mode: (typeof NOTE_MODES)[number];
  requestedAsOfUtc: string;
  signalBarOpenTimeMs: number;
  signalBarCloseTimeMs: number;
  horizonSessions: number;
  snapshotId: string;
  snapshotSha256: string;
  snapshotVerified: boolean | null;
  skillVersion: string;
  methodVersion: string;
  direction: (typeof NOTE_DIRECTIONS)[number];
  actionView: (typeof NOTE_ACTION_VIEWS)[number];
  actionBasis: (typeof NOTE_ACTION_BASES)[number];
  thesis: string | null;
  /** Only when the note body declares a reproducible method (method + methodRef); else null. */
  probability: NoteProbability | null;
  availableTimeMs: number;
  createdAtUtc: string;
  forecastIds: string[];
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an object`);
  return value as Record<string, unknown>;
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${ERR}: ${label} must be a non-empty string`);
  return value;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${ERR}: ${label} must be a finite number`);
  return value;
}

function enumValue<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  const parsed = nonBlank(value, label);
  if (!(allowed as readonly string[]).includes(parsed)) throw new Error(`${ERR}: ${label} must be one of ${allowed.join("/")}; got "${parsed}"`);
  return parsed as T;
}

function probabilityOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * The note body is session-authored JSON: read leniently and never trusted for numbers
 * unless the probability block declares both a method and a methodRef (spec v2 §B).
 */
function noteProbability(body: Record<string, unknown> | null): NoteProbability | null {
  const raw = body?.probability;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  const method = text(p.method);
  const methodRef = text(p.methodRef);
  if (!method || !methodRef) return null;
  const probTargetFirst = probabilityOrNull(p.probTargetFirst);
  const probStopFirst = probabilityOrNull(p.probStopFirst);
  if (probTargetFirst == null && probStopFirst == null) return null;
  if (probTargetFirst != null && probStopFirst != null && probTargetFirst + probStopFirst > 1 + 1e-9) return null;
  return { configId: text(p.configId), probTargetFirst, probStopFirst, method, methodRef };
}

function researchNote(value: unknown, index: number, symbol: string): ResearchNote {
  const label = `researchNotes.items[${index}]`;
  const s = object(value, label);
  const sym = nonBlank(s.symbol, `${label}.symbol`);
  if (sym !== symbol) throw new Error(`${ERR}: ${label}.symbol must be "${symbol}"; got "${sym}"`);
  const body = s.body != null && typeof s.body === "object" && !Array.isArray(s.body) ? (s.body as Record<string, unknown>) : null;
  const horizonSessions = finite(s.horizonSessions, `${label}.horizonSessions`);
  if (!Number.isSafeInteger(horizonSessions) || horizonSessions < 1) throw new Error(`${ERR}: ${label}.horizonSessions must be an integer >= 1`);
  return {
    noteId: nonBlank(s.noteId, `${label}.noteId`),
    symbol: sym,
    mode: enumValue(s.mode, `${label}.mode`, NOTE_MODES),
    requestedAsOfUtc: nonBlank(s.requestedAsOfUtc, `${label}.requestedAsOfUtc`),
    signalBarOpenTimeMs: finite(s.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`),
    signalBarCloseTimeMs: finite(s.signalBarCloseTimeMs, `${label}.signalBarCloseTimeMs`),
    horizonSessions,
    snapshotId: nonBlank(s.snapshotId, `${label}.snapshotId`),
    snapshotSha256: nonBlank(s.snapshotSha256, `${label}.snapshotSha256`),
    snapshotVerified: typeof s.snapshotVerified === "boolean" ? s.snapshotVerified : null,
    skillVersion: nonBlank(s.skillVersion, `${label}.skillVersion`),
    methodVersion: nonBlank(s.methodVersion, `${label}.methodVersion`),
    direction: enumValue(s.direction, `${label}.direction`, NOTE_DIRECTIONS),
    actionView: enumValue(s.actionView, `${label}.actionView`, NOTE_ACTION_VIEWS),
    actionBasis: enumValue(s.actionBasis, `${label}.actionBasis`, NOTE_ACTION_BASES),
    thesis: text(body?.thesis),
    probability: noteProbability(body),
    availableTimeMs: finite(s.availableTimeMs, `${label}.availableTimeMs`),
    createdAtUtc: nonBlank(s.createdAtUtc, `${label}.createdAtUtc`),
    forecastIds: Array.isArray(s.forecastIds) ? s.forecastIds.filter((x): x is string => typeof x === "string") : [],
  };
}

export function parseResearchNotes(value: unknown, symbol: string): ResearchNote[] {
  const source = object(value, "researchNotes");
  const contract = nonBlank(source.contractVersion, "researchNotes.contractVersion");
  if (contract !== RESEARCH_NOTES_CONTRACT) throw new Error(`${ERR}: researchNotes.contractVersion must be "${RESEARCH_NOTES_CONTRACT}"`);
  const sym = nonBlank(source.symbol, "researchNotes.symbol");
  if (sym !== symbol) throw new Error(`${ERR}: researchNotes.symbol must be "${symbol}"; got "${sym}"`);
  if (!Array.isArray(source.items)) throw new Error(`${ERR}: researchNotes.items must be an array`);
  return source.items.map((item, index) => researchNote(item, index, symbol));
}

export const NOTE_DIRECTION_LABEL: Record<ResearchNote["direction"], string> = {
  up: "tăng", down: "giảm", sideways: "đi ngang", "no-view": "không có nhận định",
};

export const NOTE_ACTION_LABEL: Record<ResearchNote["actionView"], string> = {
  "buy-more": "mua thêm", hold: "giữ", reduce: "giảm", sell: "bán", wait: "chờ", none: "không đề xuất",
};

export const NOTE_BASIS_LABEL: Record<ResearchNote["actionBasis"], string> = {
  "position-aware": "theo vị thế", "market-only": "chỉ theo thị trường", "insufficient-input": "thiếu đầu vào",
};

// --- issuer source documents (equity-source-documents-v1, EQX v2 §C1) --------------------

export const SOURCE_DOCUMENTS_CONTRACT = "equity-source-documents-v1";

export interface SourceDocument {
  documentId: string;
  title: string;
  docType: string;
  provider: string;
  /** Sanitized: http/https only, else null. */
  sourceUrl: string | null;
  reportingPeriod: string | null;
  consolidation: string;
  auditStatus: string;
  publishedAtUtc: string | null;
  fetchedAtUtc: string | null;
  contentSha256: string;
  revision: number;
  /** From the extraction provenance (untrusted, read leniently): metrics found / missing. */
  extractedMetrics: string[];
  missingMetrics: string[];
  pagesWithText: number | null;
  pageCount: number | null;
}

function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function metricNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names = value.map((v) => (v && typeof v === "object" ? (v as Record<string, unknown>).metric : null)).filter((m): m is string => typeof m === "string");
  return [...new Set(names)];
}

function intOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function parseSourceDocuments(value: unknown, symbol: string): SourceDocument[] {
  const source = object(value, "sourceDocuments");
  const contract = nonBlank(source.contractVersion, "sourceDocuments.contractVersion");
  if (contract !== SOURCE_DOCUMENTS_CONTRACT) throw new Error(`${ERR}: sourceDocuments.contractVersion must be "${SOURCE_DOCUMENTS_CONTRACT}"`);
  const sym = nonBlank(source.symbol, "sourceDocuments.symbol");
  if (sym !== symbol) throw new Error(`${ERR}: sourceDocuments.symbol must be "${symbol}"; got "${sym}"`);
  if (!Array.isArray(source.items)) throw new Error(`${ERR}: sourceDocuments.items must be an array`);
  return source.items.map((raw, index) => {
    const label = `sourceDocuments.items[${index}]`;
    const d = object(raw, label);
    const extraction = d.extraction != null && typeof d.extraction === "object" && !Array.isArray(d.extraction)
      ? (d.extraction as Record<string, unknown>) : null;
    return {
      documentId: nonBlank(d.documentId, `${label}.documentId`),
      title: nonBlank(d.title, `${label}.title`),
      docType: nonBlank(d.docType, `${label}.docType`),
      provider: nonBlank(d.provider, `${label}.provider`),
      sourceUrl: safeHttpUrl(d.sourceUrl),
      reportingPeriod: text(d.reportingPeriod),
      consolidation: nonBlank(d.consolidation, `${label}.consolidation`),
      auditStatus: nonBlank(d.auditStatus, `${label}.auditStatus`),
      publishedAtUtc: text(d.publishedAtUtc),
      fetchedAtUtc: text(d.fetchedAtUtc),
      contentSha256: nonBlank(d.contentSha256, `${label}.contentSha256`),
      revision: finite(d.revision, `${label}.revision`),
      extractedMetrics: metricNames(extraction?.found),
      missingMetrics: metricNames(extraction?.missing),
      pagesWithText: intOrNull(extraction?.pagesWithText),
      pageCount: intOrNull(extraction?.pageCount),
    };
  });
}
