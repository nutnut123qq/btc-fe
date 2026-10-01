import { isActiveTimeframe, type ActiveTimeframe } from "./timeframe.ts";
import { TECHNICAL_LAYER_KEYS, TECHNICAL_REPLAY_SYMBOL, type TechnicalLayerKey } from "./technicalReplay.ts";

export type TechnicalEvidenceCoverage = {
  symbol: typeof TECHNICAL_REPLAY_SYMBOL;
  timeframe: ActiveTimeframe;
  moduleContractVersion: string;
  moduleContractSha256: string;
  lastProcessedCloseTimeMs: number | null;
  coverageStartCloseTimeMs: number | null;
  historicalBackfill: boolean;
  checkpointStatus: string;
  sparseRecordCount: number;
  recordsByLayer: Partial<Record<TechnicalLayerKey, number>>;
  storagePolicy: "sparse-events-only";
};

export type TechnicalEvidenceRebuildResult = {
  symbol: typeof TECHNICAL_REPLAY_SYMBOL;
  timeframe: ActiveTimeframe;
  dryRun: boolean;
  moduleContractVersion: string;
  moduleContractSha256: string;
  previousCheckpointCloseTimeMs: number | null;
  coverageStartCloseTimeMs: number | null;
  batchStartCloseTimeMs: number | null;
  historicalBackfill: boolean;
  lastProcessedCloseTimeMs: number | null;
  candidateCandles: number;
  estimatedSparseRecords: number;
  estimatedEnvelopeBytes: number;
  insertedRecords: number;
  existingRecords: number;
  status: string;
  limitations: string[];
};

export const TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES = 100;

export type TechnicalEvidenceRebuildPreview = {
  result: TechnicalEvidenceRebuildResult;
  requestedMaxCandles: number;
};

export function isTechnicalEvidencePreviewApplicable(
  preview: TechnicalEvidenceRebuildPreview | null,
  timeframe: ActiveTimeframe,
  maxCandles: number,
  coverage: TechnicalEvidenceCoverage | null,
): boolean {
  return preview != null
    && preview.result.dryRun
    && preview.result.timeframe === timeframe
    && preview.requestedMaxCandles === maxCandles
    && preview.result.candidateCandles > 0
    && preview.result.candidateCandles <= preview.requestedMaxCandles
    && coverage?.moduleContractVersion === preview.result.moduleContractVersion
    && coverage.moduleContractSha256 === preview.result.moduleContractSha256;
}

export function assertTechnicalEvidenceRebuildCap(result: TechnicalEvidenceRebuildResult, requestedMaxCandles: number): void {
  if (!Number.isSafeInteger(requestedMaxCandles) || requestedMaxCandles < 1 || requestedMaxCandles > TECHNICAL_EVIDENCE_REBUILD_MAX_CANDLES) {
    throw new Error("INVALID_TECHNICAL_EVIDENCE: requested rebuild cap must be between 1 and 100 candles");
  }
  if (result.candidateCandles > requestedMaxCandles) {
    throw new Error("INVALID_TECHNICAL_EVIDENCE: rebuild response exceeds the requested candle cap");
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`INVALID_TECHNICAL_EVIDENCE: ${label} must be an object`);
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`INVALID_TECHNICAL_EVIDENCE: ${label} must be a non-empty string`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`INVALID_TECHNICAL_EVIDENCE: ${label} must be a non-negative integer`);
  return value;
}

function nullableTime(value: unknown, label: string): number | null {
  if (value == null) return null;
  const parsed = integer(value, label);
  if (parsed <= 0) throw new Error(`INVALID_TECHNICAL_EVIDENCE: ${label} must be a positive Unix timestamp`);
  return parsed;
}

function sha256(value: unknown, label: string): string {
  const parsed = string(value, label);
  if (!/^[a-f0-9]{64}$/i.test(parsed)) throw new Error(`INVALID_TECHNICAL_EVIDENCE: ${label} must be a SHA-256 digest`);
  return parsed;
}

function scope(source: Record<string, unknown>): { symbol: typeof TECHNICAL_REPLAY_SYMBOL; timeframe: ActiveTimeframe } {
  if (source.symbol !== TECHNICAL_REPLAY_SYMBOL || !isActiveTimeframe(source.timeframe)) throw new Error("INVALID_TECHNICAL_EVIDENCE: scope must be BTCUSDT 1h/4h/1d");
  return { symbol: TECHNICAL_REPLAY_SYMBOL, timeframe: source.timeframe };
}

export function parseTechnicalEvidenceCoverage(value: unknown): TechnicalEvidenceCoverage {
  const source = record(value, "coverage");
  const parsedScope = scope(source);
  const rawCounts = record(source.recordsByLayer, "coverage.recordsByLayer");
  const recordsByLayer: Partial<Record<TechnicalLayerKey, number>> = {};
  for (const [key, count] of Object.entries(rawCounts)) {
    if (!TECHNICAL_LAYER_KEYS.includes(key as TechnicalLayerKey)) throw new Error(`INVALID_TECHNICAL_EVIDENCE: unsupported layer ${key}`);
    recordsByLayer[key as TechnicalLayerKey] = integer(count, `coverage.recordsByLayer.${key}`);
  }
  const sparseRecordCount = integer(source.sparseRecordCount, "coverage.sparseRecordCount");
  if (Object.values(recordsByLayer).reduce((sum, count) => sum + (count ?? 0), 0) !== sparseRecordCount) {
    throw new Error("INVALID_TECHNICAL_EVIDENCE: sparse record count does not match layer counts");
  }
  if (source.storagePolicy !== "sparse-events-only") throw new Error("INVALID_TECHNICAL_EVIDENCE: unsupported storage policy");
  if (typeof source.historicalBackfill !== "boolean") throw new Error("INVALID_TECHNICAL_EVIDENCE: coverage historicalBackfill must be boolean");
  return {
    ...parsedScope,
    moduleContractVersion: string(source.moduleContractVersion, "coverage.moduleContractVersion"),
    moduleContractSha256: sha256(source.moduleContractSha256, "coverage.moduleContractSha256"),
    lastProcessedCloseTimeMs: nullableTime(source.lastProcessedCloseTimeMs, "coverage.lastProcessedCloseTimeMs"),
    coverageStartCloseTimeMs: nullableTime(source.coverageStartCloseTimeMs, "coverage.coverageStartCloseTimeMs"),
    historicalBackfill: source.historicalBackfill,
    checkpointStatus: string(source.checkpointStatus, "coverage.checkpointStatus"),
    sparseRecordCount,
    recordsByLayer,
    storagePolicy: "sparse-events-only",
  };
}

export function parseTechnicalEvidenceRebuildResult(value: unknown): TechnicalEvidenceRebuildResult {
  const source = record(value, "rebuild result");
  const parsedScope = scope(source);
  if (typeof source.dryRun !== "boolean") throw new Error("INVALID_TECHNICAL_EVIDENCE: rebuild result dryRun must be boolean");
  if (typeof source.historicalBackfill !== "boolean") throw new Error("INVALID_TECHNICAL_EVIDENCE: rebuild result historicalBackfill must be boolean");
  if (!Array.isArray(source.limitations) || source.limitations.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error("INVALID_TECHNICAL_EVIDENCE: rebuild result limitations must be strings");
  }
  const insertedRecords = integer(source.insertedRecords, "rebuild result.insertedRecords");
  if (source.dryRun && insertedRecords !== 0) throw new Error("INVALID_TECHNICAL_EVIDENCE: dry-run cannot report inserted records");
  return {
    ...parsedScope,
    dryRun: source.dryRun,
    moduleContractVersion: string(source.moduleContractVersion, "rebuild result.moduleContractVersion"),
    moduleContractSha256: sha256(source.moduleContractSha256, "rebuild result.moduleContractSha256"),
    previousCheckpointCloseTimeMs: nullableTime(source.previousCheckpointCloseTimeMs, "rebuild result.previousCheckpointCloseTimeMs"),
    coverageStartCloseTimeMs: nullableTime(source.coverageStartCloseTimeMs, "rebuild result.coverageStartCloseTimeMs"),
    batchStartCloseTimeMs: nullableTime(source.batchStartCloseTimeMs, "rebuild result.batchStartCloseTimeMs"),
    historicalBackfill: source.historicalBackfill,
    lastProcessedCloseTimeMs: nullableTime(source.lastProcessedCloseTimeMs, "rebuild result.lastProcessedCloseTimeMs"),
    candidateCandles: integer(source.candidateCandles, "rebuild result.candidateCandles"),
    estimatedSparseRecords: integer(source.estimatedSparseRecords, "rebuild result.estimatedSparseRecords"),
    estimatedEnvelopeBytes: integer(source.estimatedEnvelopeBytes, "rebuild result.estimatedEnvelopeBytes"),
    insertedRecords,
    existingRecords: integer(source.existingRecords, "rebuild result.existingRecords"),
    status: string(source.status, "rebuild result.status"),
    limitations: source.limitations as string[],
  };
}
