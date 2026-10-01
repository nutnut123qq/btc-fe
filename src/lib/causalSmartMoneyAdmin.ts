import { isActiveTimeframe, type ActiveTimeframe } from "./timeframe.ts";

export const CAUSAL_SMC_SYMBOL = "BTCUSDT" as const;
export const CAUSAL_SMC_MAX_CANDIDATE_CANDLES = 5_000;
export const CAUSAL_SMC_MAX_CONTEXT_CANDLES = 100_000;
export const CAUSAL_SMC_MAX_EVENT_MUTATIONS = 50_000;
export const CAUSAL_SMC_MAX_EVIDENCE_BYTES = 20 * 1024 * 1024;

export type CausalSmartMoneyCoverage = {
  symbol: typeof CAUSAL_SMC_SYMBOL;
  timeframe: ActiveTimeframe;
  calculationVersion: string;
  lastProcessedOpenTimeMs: number | null;
  coverageStartOpenTimeMs: number | null;
  latestSegmentStartOpenTimeMs: number | null;
  processedCandleCount: number;
  materializedEventCount: number;
  checkpointStatus: string;
  persistedEventCount: number;
  eventsByType: Record<string, number>;
  invalidDurationRows: number;
  historicalPendingGapRanges: number;
  unavailableGapRanges: number;
  trailingNotYetFinalizedGapRanges: number;
  legacyStorageStatus: string;
};

export type CausalSmartMoneyGapBoundary = {
  previousOpenTimeMs: number | null;
  nextOpenTimeMs: number | null;
  invalidOpenTimeMs: number | null;
  missingBars: number;
  boundaryType: string;
  ledgerStatus: string;
  gapStateId: number | null;
};

export type CausalSmartMoneyRebuildResult = {
  symbol: typeof CAUSAL_SMC_SYMBOL;
  timeframe: ActiveTimeframe;
  calculationVersion: string;
  dryRun: boolean;
  previousCheckpointOpenTimeMs: number | null;
  coverageStartOpenTimeMs: number | null;
  batchStartOpenTimeMs: number | null;
  lastProcessedOpenTimeMs: number | null;
  candidateCandles: number;
  validCandidateCandles: number;
  invalidDurationCandles: number;
  contextCandles: number;
  contiguousSegments: number;
  estimatedEvents: number;
  estimatedEvidenceBytes: number;
  insertedEvents: number;
  updatedEvents: number;
  existingEvents: number;
  status: string;
  gapBoundaries: CausalSmartMoneyGapBoundary[];
  limitations: string[];
};

export type CausalSmartMoneyRebuildPreview = {
  result: CausalSmartMoneyRebuildResult;
  requestedMaxCandles: number;
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`INVALID_CAUSAL_SMC: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_CAUSAL_SMC: ${label} must be a non-empty string`);
  }
  return value;
}

function count(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`INVALID_CAUSAL_SMC: ${label} must be a non-negative integer`);
  }
  return value;
}

function nullableTime(value: unknown, label: string): number | null {
  if (value == null) return null;
  return count(value, label);
}

function scope(source: Record<string, unknown>): { symbol: typeof CAUSAL_SMC_SYMBOL; timeframe: ActiveTimeframe } {
  if (source.symbol !== CAUSAL_SMC_SYMBOL || !isActiveTimeframe(source.timeframe)) {
    throw new Error("INVALID_CAUSAL_SMC: scope must be BTCUSDT 1h/4h/1d");
  }
  return { symbol: CAUSAL_SMC_SYMBOL, timeframe: source.timeframe };
}

function countRecord(value: unknown, label: string): Record<string, number> {
  const source = object(value, label);
  const parsed: Record<string, number> = {};
  for (const [key, raw] of Object.entries(source)) {
    if (key.trim() === "") throw new Error(`INVALID_CAUSAL_SMC: ${label} contains an empty key`);
    parsed[key] = count(raw, `${label}.${key}`);
  }
  return parsed;
}

export function parseCausalSmartMoneyCoverage(value: unknown): CausalSmartMoneyCoverage {
  const source = object(value, "coverage");
  const parsedScope = scope(source);
  const eventsByType = countRecord(source.eventsByType, "coverage.eventsByType");
  const persistedEventCount = count(source.persistedEventCount, "coverage.persistedEventCount");
  if (Object.values(eventsByType).reduce((sum, item) => sum + item, 0) !== persistedEventCount) {
    throw new Error("INVALID_CAUSAL_SMC: persisted event total does not match eventsByType");
  }
  return {
    ...parsedScope,
    calculationVersion: nonBlank(source.calculationVersion, "coverage.calculationVersion"),
    lastProcessedOpenTimeMs: nullableTime(source.lastProcessedOpenTimeMs, "coverage.lastProcessedOpenTimeMs"),
    coverageStartOpenTimeMs: nullableTime(source.coverageStartOpenTimeMs, "coverage.coverageStartOpenTimeMs"),
    latestSegmentStartOpenTimeMs: nullableTime(source.latestSegmentStartOpenTimeMs, "coverage.latestSegmentStartOpenTimeMs"),
    processedCandleCount: count(source.processedCandleCount, "coverage.processedCandleCount"),
    materializedEventCount: count(source.materializedEventCount, "coverage.materializedEventCount"),
    checkpointStatus: nonBlank(source.checkpointStatus, "coverage.checkpointStatus"),
    persistedEventCount,
    eventsByType,
    invalidDurationRows: count(source.invalidDurationRows, "coverage.invalidDurationRows"),
    historicalPendingGapRanges: count(source.historicalPendingGapRanges, "coverage.historicalPendingGapRanges"),
    unavailableGapRanges: count(source.unavailableGapRanges, "coverage.unavailableGapRanges"),
    trailingNotYetFinalizedGapRanges: count(source.trailingNotYetFinalizedGapRanges, "coverage.trailingNotYetFinalizedGapRanges"),
    legacyStorageStatus: nonBlank(source.legacyStorageStatus, "coverage.legacyStorageStatus"),
  };
}

function parseGapBoundary(value: unknown, index: number): CausalSmartMoneyGapBoundary {
  const source = object(value, `rebuild.gapBoundaries[${index}]`);
  return {
    previousOpenTimeMs: nullableTime(source.previousOpenTimeMs, `rebuild.gapBoundaries[${index}].previousOpenTimeMs`),
    nextOpenTimeMs: nullableTime(source.nextOpenTimeMs, `rebuild.gapBoundaries[${index}].nextOpenTimeMs`),
    invalidOpenTimeMs: nullableTime(source.invalidOpenTimeMs, `rebuild.gapBoundaries[${index}].invalidOpenTimeMs`),
    missingBars: count(source.missingBars, `rebuild.gapBoundaries[${index}].missingBars`),
    boundaryType: nonBlank(source.boundaryType, `rebuild.gapBoundaries[${index}].boundaryType`),
    ledgerStatus: nonBlank(source.ledgerStatus, `rebuild.gapBoundaries[${index}].ledgerStatus`),
    gapStateId: nullableTime(source.gapStateId, `rebuild.gapBoundaries[${index}].gapStateId`),
  };
}

export function parseCausalSmartMoneyRebuildResult(value: unknown): CausalSmartMoneyRebuildResult {
  const source = object(value, "rebuild");
  const parsedScope = scope(source);
  if (typeof source.dryRun !== "boolean") throw new Error("INVALID_CAUSAL_SMC: rebuild.dryRun must be boolean");
  if (!Array.isArray(source.gapBoundaries)) throw new Error("INVALID_CAUSAL_SMC: rebuild.gapBoundaries must be an array");
  if (!Array.isArray(source.limitations) || source.limitations.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("INVALID_CAUSAL_SMC: rebuild.limitations must be non-empty strings");
  }
  const candidateCandles = count(source.candidateCandles, "rebuild.candidateCandles");
  const validCandidateCandles = count(source.validCandidateCandles, "rebuild.validCandidateCandles");
  const invalidDurationCandles = count(source.invalidDurationCandles, "rebuild.invalidDurationCandles");
  const insertedEvents = count(source.insertedEvents, "rebuild.insertedEvents");
  const updatedEvents = count(source.updatedEvents, "rebuild.updatedEvents");
  if (validCandidateCandles + invalidDurationCandles !== candidateCandles) {
    throw new Error("INVALID_CAUSAL_SMC: valid and invalid candidate counts must equal candidateCandles");
  }
  if (source.dryRun && (insertedEvents !== 0 || updatedEvents !== 0)) {
    throw new Error("INVALID_CAUSAL_SMC: dry-run cannot report writes");
  }
  return {
    ...parsedScope,
    calculationVersion: nonBlank(source.calculationVersion, "rebuild.calculationVersion"),
    dryRun: source.dryRun,
    previousCheckpointOpenTimeMs: nullableTime(source.previousCheckpointOpenTimeMs, "rebuild.previousCheckpointOpenTimeMs"),
    coverageStartOpenTimeMs: nullableTime(source.coverageStartOpenTimeMs, "rebuild.coverageStartOpenTimeMs"),
    batchStartOpenTimeMs: nullableTime(source.batchStartOpenTimeMs, "rebuild.batchStartOpenTimeMs"),
    lastProcessedOpenTimeMs: nullableTime(source.lastProcessedOpenTimeMs, "rebuild.lastProcessedOpenTimeMs"),
    candidateCandles,
    validCandidateCandles,
    invalidDurationCandles,
    contextCandles: count(source.contextCandles, "rebuild.contextCandles"),
    contiguousSegments: count(source.contiguousSegments, "rebuild.contiguousSegments"),
    estimatedEvents: count(source.estimatedEvents, "rebuild.estimatedEvents"),
    estimatedEvidenceBytes: count(source.estimatedEvidenceBytes, "rebuild.estimatedEvidenceBytes"),
    insertedEvents,
    updatedEvents,
    existingEvents: count(source.existingEvents, "rebuild.existingEvents"),
    status: nonBlank(source.status, "rebuild.status"),
    gapBoundaries: source.gapBoundaries.map(parseGapBoundary),
    limitations: source.limitations as string[],
  };
}

export function assertCausalSmartMoneyRebuildCaps(result: CausalSmartMoneyRebuildResult, requestedMaxCandles: number): void {
  if (!Number.isSafeInteger(requestedMaxCandles) || requestedMaxCandles < 1 || requestedMaxCandles > CAUSAL_SMC_MAX_CANDIDATE_CANDLES) {
    throw new Error("INVALID_CAUSAL_SMC: requested maxCandles exceeds the documented cap");
  }
  if (result.candidateCandles > requestedMaxCandles
    || result.contextCandles > CAUSAL_SMC_MAX_CONTEXT_CANDLES
    || result.estimatedEvents > CAUSAL_SMC_MAX_EVENT_MUTATIONS
    || result.estimatedEvidenceBytes > CAUSAL_SMC_MAX_EVIDENCE_BYTES) {
    throw new Error("INVALID_CAUSAL_SMC: rebuild estimate exceeds a documented hard cap");
  }
}

export function isCausalSmartMoneyPreviewApplicable(
  preview: CausalSmartMoneyRebuildPreview | null,
  timeframe: ActiveTimeframe,
  maxCandles: number,
  coverage: CausalSmartMoneyCoverage | null,
): boolean {
  return preview != null
    && coverage != null
    && preview.result.dryRun
    && preview.result.timeframe === timeframe
    && preview.requestedMaxCandles === maxCandles
    && preview.result.candidateCandles > 0
    && preview.result.candidateCandles <= maxCandles
    && preview.result.calculationVersion === coverage.calculationVersion
    && preview.result.previousCheckpointOpenTimeMs === coverage.lastProcessedOpenTimeMs;
}
