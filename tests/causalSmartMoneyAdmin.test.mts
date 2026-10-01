import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertCausalSmartMoneyRebuildCaps,
  isCausalSmartMoneyPreviewApplicable,
  parseCausalSmartMoneyCoverage,
  parseCausalSmartMoneyRebuildResult,
} from "../src/lib/causalSmartMoneyAdmin.ts";

const coverageJson = {
  symbol: "BTCUSDT",
  timeframe: "4h",
  calculationVersion: "smc-causal-v7",
  lastProcessedOpenTimeMs: 1_800_000_000_000,
  coverageStartOpenTimeMs: 1_700_000_000_000,
  latestSegmentStartOpenTimeMs: 1_790_000_000_000,
  processedCandleCount: 500,
  materializedEventCount: 7,
  checkpointStatus: "running",
  persistedEventCount: 7,
  eventsByType: { BOS_BULL: 2, FVG_BEAR: 5 },
  invalidDurationRows: 3,
  historicalPendingGapRanges: 4,
  unavailableGapRanges: 1,
  trailingNotYetFinalizedGapRanges: 1,
  legacyStorageStatus: "isolated_not_read_or_overwritten",
};

const rebuildJson = {
  symbol: "BTCUSDT",
  timeframe: "4h",
  calculationVersion: "smc-causal-v7",
  dryRun: true,
  previousCheckpointOpenTimeMs: 1_800_000_000_000,
  coverageStartOpenTimeMs: 1_700_000_000_000,
  batchStartOpenTimeMs: 1_800_014_400_000,
  lastProcessedOpenTimeMs: 1_800_158_400_000,
  candidateCandles: 11,
  validCandidateCandles: 10,
  invalidDurationCandles: 1,
  contextCandles: 511,
  contiguousSegments: 2,
  estimatedEvents: 5,
  estimatedEvidenceBytes: 4096,
  insertedEvents: 0,
  updatedEvents: 0,
  existingEvents: 0,
  status: "dry_run",
  gapBoundaries: [{ previousOpenTimeMs: 10, nextOpenTimeMs: 30, invalidOpenTimeMs: null, missingBars: 1, boundaryType: "missing_candles", ledgerStatus: "Pending", gapStateId: 9 }],
  limitations: ["Only finalized stored BTCUSDT candles are used."],
};

test("causal coverage preserves checkpoints, event types, invalid-duration and distinct gap states", () => {
  const parsed = parseCausalSmartMoneyCoverage(coverageJson);
  assert.equal(parsed.persistedEventCount, 7);
  assert.equal(parsed.eventsByType.FVG_BEAR, 5);
  assert.equal(parsed.invalidDurationRows, 3);
  assert.equal(parsed.historicalPendingGapRanges, 4);
  assert.equal(parsed.trailingNotYetFinalizedGapRanges, 1);
  assert.equal(parsed.legacyStorageStatus, "isolated_not_read_or_overwritten");
  assert.throws(() => parseCausalSmartMoneyCoverage({ ...coverageJson, persistedEventCount: 8 }), /does not match/);
});

test("causal rebuild preview keeps gap boundaries and enforces documented caps", () => {
  const parsed = parseCausalSmartMoneyRebuildResult(rebuildJson);
  assert.equal(parsed.gapBoundaries[0]?.boundaryType, "missing_candles");
  assert.equal(parsed.invalidDurationCandles, 1);
  assert.doesNotThrow(() => assertCausalSmartMoneyRebuildCaps(parsed, 11));
  assert.throws(() => assertCausalSmartMoneyRebuildCaps({ ...parsed, candidateCandles: 12 }, 11), /hard cap/);
  assert.throws(() => parseCausalSmartMoneyRebuildResult({ ...rebuildJson, validCandidateCandles: 11 }), /must equal candidateCandles/);
  assert.throws(() => parseCausalSmartMoneyRebuildResult({ ...rebuildJson, insertedEvents: 1 }), /dry-run cannot report writes/);
});

test("causal apply is enabled only for the exact timeframe, cap, calculation version and checkpoint previewed", () => {
  const result = parseCausalSmartMoneyRebuildResult(rebuildJson);
  const coverage = parseCausalSmartMoneyCoverage(coverageJson);
  const preview = { result, requestedMaxCandles: 11 };
  assert.equal(isCausalSmartMoneyPreviewApplicable(preview, "4h", 11, coverage), true);
  assert.equal(isCausalSmartMoneyPreviewApplicable(preview, "1h", 11, coverage), false);
  assert.equal(isCausalSmartMoneyPreviewApplicable(preview, "4h", 10, coverage), false);
  assert.equal(isCausalSmartMoneyPreviewApplicable(preview, "4h", 11, { ...coverage, calculationVersion: "new" }), false);
  assert.equal(isCausalSmartMoneyPreviewApplicable(preview, "4h", 11, { ...coverage, lastProcessedOpenTimeMs: 1 }), false);
});

test("causal coverage is read-only while rebuild remains AdminGuard protected and non-looping", () => {
  const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
  const componentSource = readFileSync(new URL("../src/components/CausalSmartMoneyAdministration.tsx", import.meta.url), "utf8");
  assert.match(apiSource, /fetch\(`\$\{API_BASE\}\/api\/smart-money\/causal-coverage/);
  assert.match(apiSource, /adminFetch\(`\$\{API_BASE\}\/api\/smart-money\/causal-rebuild/);
  assert.match(componentSource, /window\.confirm/);
  assert.match(componentSource, /UI không tự lặp/);
  assert.doesNotMatch(componentSource, /while\s*\(|setInterval\s*\(/);
});
