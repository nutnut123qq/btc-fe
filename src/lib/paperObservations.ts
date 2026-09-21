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
  return {
    symbol,
    available: value.available,
    reason: nullableString(value, "reason"),
    items,
  };
}
