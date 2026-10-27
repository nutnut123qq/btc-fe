import type { PaperObservationItem, PaperObservationListResponse } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`INVALID_API_RESPONSE: paper observation ${key} must be a string`);
  }
  return value;
}

function finiteNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_API_RESPONSE: paper observation ${key} must be finite`);
  }
  return value;
}

function nullableNumber(record: Record<string, unknown>, key: string): number | null {
  return record[key] === null ? null : finiteNumber(record, key);
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`INVALID_API_RESPONSE: paper observation ${key} must be string or null`);
  }
  return value;
}

function parseItem(value: unknown): PaperObservationItem {
  if (!isRecord(value)) throw new Error("INVALID_API_RESPONSE: paper observation item must be an object");
  const symbol = stringField(value, "symbol");
  const timeframe = stringField(value, "timeframe");
  const decision = stringField(value, "decision");
  if (symbol !== "BTCUSDT" || timeframe !== "4h") {
    throw new Error("INVALID_API_RESPONSE: forward observation scope must be BTCUSDT 4h");
  }
  if (!new Set(["abstain", "long", "short"]).has(decision)) {
    throw new Error(`INVALID_API_RESPONSE: unknown paper observation decision ${decision}`);
  }
  const signalBarOpenTimeMs = finiteNumber(value, "signalBarOpenTimeMs");
  const signalBarCloseTimeMs = finiteNumber(value, "signalBarCloseTimeMs");
  const availableTimeMs = finiteNumber(value, "availableTimeMs");
  if (signalBarOpenTimeMs >= signalBarCloseTimeMs || availableTimeMs < signalBarCloseTimeMs) {
    throw new Error("INVALID_API_RESPONSE: paper observation chronology is invalid");
  }
  const quotePrice = nullableNumber(value, "quotePrice");
  const fillPrice = nullableNumber(value, "fillPrice");
  if ((quotePrice !== null && quotePrice <= 0) || (fillPrice !== null && fillPrice <= 0)) {
    throw new Error("INVALID_API_RESPONSE: paper observation prices must be positive");
  }
  return {
    id: stringField(value, "id"),
    decisionId: stringField(value, "decisionId"),
    recorderVersion: stringField(value, "recorderVersion"),
    symbol,
    timeframe,
    signalBarOpenTimeMs,
    signalBarCloseTimeMs,
    observedAtUtc: stringField(value, "observedAtUtc"),
    availableTimeMs,
    modelVersion: nullableString(value, "modelVersion"),
    decision,
    confidence: nullableNumber(value, "confidence"),
    abstentionReason: nullableString(value, "abstentionReason"),
    quoteSource: stringField(value, "quoteSource"),
    quotePrice,
    quoteReceivedAtUtc: nullableString(value, "quoteReceivedAtUtc"),
    quoteReceivedTimeMs: nullableNumber(value, "quoteReceivedTimeMs"),
    configProvenanceJson: stringField(value, "configProvenanceJson"),
    evidenceProvenanceJson: stringField(value, "evidenceProvenanceJson"),
    fillPrice,
    fillObservedAtUtc: nullableString(value, "fillObservedAtUtc"),
    outcomeReturn: nullableNumber(value, "outcomeReturn"),
    outcomeObservedAtUtc: nullableString(value, "outcomeObservedAtUtc"),
    outcomeHorizon: nullableString(value, "outcomeHorizon"),
  };
}

const hasFill = (item: PaperObservationItem) => item.fillPrice != null;
const hasOutcome = (item: PaperObservationItem) => item.outcomeReturn != null;

function count(record: Record<string, unknown>, key: string, min: number, max: number): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`INVALID_API_RESPONSE: paper observations ${key} must be an integer in [${min}, ${max}]`);
  }
  return value;
}

export function parsePaperObservations(value: unknown): PaperObservationListResponse {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.available !== "boolean") {
    throw new Error("INVALID_API_RESPONSE: paper observations response is malformed");
  }
  const symbol = stringField(value, "symbol");
  if (symbol !== "BTCUSDT") throw new Error("INVALID_API_RESPONSE: paper observations must be BTCUSDT");
  const items = value.items.map(parseItem);
  if (new Set(items.map((item) => item.decisionId)).size !== items.length) {
    throw new Error("INVALID_API_RESPONSE: duplicate paper observation decisionId");
  }
  if (!value.available && items.length > 0) {
    throw new Error("INVALID_API_RESPONSE: unavailable paper observations cannot contain items");
  }
  // Older backends omit the journal totals (AGENTS.md #30): degrade to null, never fail the panel.
  let total: number | null = null, filledTotal: number | null = null, outcomeTotal: number | null = null;
  if (value.total !== undefined) {
    total = count(value, "total", items.length, Number.MAX_SAFE_INTEGER);
    filledTotal = count(value, "filledTotal", items.filter(hasFill).length, total);
    // An outcome requires a fill (recorder CHECK), so outcomes are bounded by fills.
    outcomeTotal = count(value, "outcomeTotal", items.filter(hasOutcome).length, filledTotal);
  }
  return {
    symbol,
    available: value.available,
    reason: nullableString(value, "reason"),
    items,
    total,
    filledTotal,
    outcomeTotal,
  };
}

/**
 * Display counts for the forward journal. With journal totals they are exact; without them (older
 * backend) a page filled up to `requested` may hide older rows, so counts read as "≥ n", never as totals.
 */
export function forwardJournalCounts(observations: PaperObservationListResponse, requested: number) {
  const { items } = observations;
  if (observations.total !== null) {
    return { decisions: String(observations.total), fills: String(observations.filledTotal), outcomes: String(observations.outcomeTotal) };
  }
  const prefix = items.length >= requested ? "≥ " : "";
  return {
    decisions: `${prefix}${items.length}`,
    fills: `${prefix}${items.filter(hasFill).length}`,
    outcomes: `${prefix}${items.filter(hasOutcome).length}`,
  };
}
