import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTechnicalEvidenceRebuildCap,
  isTechnicalEvidencePreviewApplicable,
  parseTechnicalEvidenceCoverage,
  parseTechnicalEvidenceRebuildResult,
} from "../src/lib/technicalEvidenceAdmin.ts";

const sha = "a".repeat(64);

test("technical evidence coverage preserves sparse per-layer counts and contract lineage", () => {
  const parsed = parseTechnicalEvidenceCoverage({
    symbol: "BTCUSDT",
    timeframe: "4h",
    moduleContractVersion: "btc-causal-technical-modules/v1",
    moduleContractSha256: sha,
    lastProcessedCloseTimeMs: 1_800_000_000_000,
    coverageStartCloseTimeMs: 1_700_000_000_000,
    historicalBackfill: true,
    checkpointStatus: "checkpointed",
    sparseRecordCount: 5,
    recordsByLayer: { technicalIndicators: 2, candlePatterns: 3 },
    storagePolicy: "sparse-events-only",
  });
  assert.equal(parsed.recordsByLayer.candlePatterns, 3);
  assert.equal(parsed.sparseRecordCount, 5);
  assert.equal(parsed.checkpointStatus, "checkpointed");
});

test("technical evidence coverage fails closed on unknown layers and inconsistent totals", () => {
  const base = { symbol: "BTCUSDT", timeframe: "1h", moduleContractVersion: "v1", moduleContractSha256: sha, lastProcessedCloseTimeMs: null, coverageStartCloseTimeMs: null, historicalBackfill: false, checkpointStatus: "not_started", sparseRecordCount: 1, recordsByLayer: { confluence: 1 }, storagePolicy: "sparse-events-only" };
  assert.throws(() => parseTechnicalEvidenceCoverage({ ...base, recordsByLayer: { mystery: 1 } }), /unsupported layer/);
  assert.throws(() => parseTechnicalEvidenceCoverage({ ...base, sparseRecordCount: 2 }), /does not match/);
});

test("rebuild result keeps dry-run estimate separate from explicit writes", () => {
  const result = parseTechnicalEvidenceRebuildResult({
    symbol: "BTCUSDT",
    timeframe: "1d",
    dryRun: true,
    moduleContractVersion: "btc-causal-technical-modules/v1",
    moduleContractSha256: sha,
    previousCheckpointCloseTimeMs: null,
    coverageStartCloseTimeMs: 1_700_000_000_000,
    batchStartCloseTimeMs: 1_700_000_000_000,
    historicalBackfill: true,
    lastProcessedCloseTimeMs: 1_800_000_000_000,
    candidateCandles: 25,
    estimatedSparseRecords: 8,
    estimatedEnvelopeBytes: 4096,
    insertedRecords: 0,
    existingRecords: 0,
    status: "dry_run",
    limitations: ["Sparse events only."],
  });
  assert.equal(result.dryRun, true);
  assert.equal(result.estimatedSparseRecords, 8);
  assert.throws(() => parseTechnicalEvidenceRebuildResult({ ...result, insertedRecords: 1 }), /dry-run cannot/);

  const coverage = parseTechnicalEvidenceCoverage({
    symbol: "BTCUSDT",
    timeframe: "1d",
    moduleContractVersion: result.moduleContractVersion,
    moduleContractSha256: result.moduleContractSha256,
    lastProcessedCloseTimeMs: null,
    coverageStartCloseTimeMs: null,
    historicalBackfill: false,
    checkpointStatus: "not_started",
    sparseRecordCount: 0,
    recordsByLayer: {},
    storagePolicy: "sparse-events-only",
  });
  const preview = { result, requestedMaxCandles: 25 };
  assert.equal(isTechnicalEvidencePreviewApplicable(preview, "1d", 25, coverage), true);
  assert.equal(isTechnicalEvidencePreviewApplicable(preview, "1d", 24, coverage), false);
  assert.equal(isTechnicalEvidencePreviewApplicable(preview, "4h", 25, coverage), false);
  assert.doesNotThrow(() => assertTechnicalEvidenceRebuildCap(result, 25));
  assert.throws(() => assertTechnicalEvidenceRebuildCap({ ...result, candidateCandles: 26 }, 25), /exceeds the requested candle cap/);
});
