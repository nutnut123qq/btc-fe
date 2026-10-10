import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseResearchEvidenceCatalog, parseResearchEvidenceDetail } from "../src/lib/researchEvidence.ts";

const id = "a".repeat(64);
const reportSha256 = "b".repeat(64);
const manifestSha256 = "c".repeat(64);
const catalogIntegrity = { scannedArtifactCount: 1, publishedArtifactCount: 1, rejectedArtifactCount: 0 };

const item = {
  id,
  kind: "model",
  title: "ML walk-forward v2",
  status: "supported",
  evidenceTier: "validated-predictive",
  symbol: "BTCUSDT",
  timeframe: "4h",
  createdAtUtc: "2026-09-20T00:00:00Z",
  manifestSha256,
  reportSha256,
  summary: "Brier score tốt hơn baseline trong OOS.",
  limitations: ["Chưa phải economic evidence."],
  integrity: {
    verified: true,
    manifestHashVerified: true,
    reportHashVerified: true,
    reportHashEmbedded: true,
  },
};

test("catalog accepts the fail-closed backend evidence contract", () => {
  const parsed = parseResearchEvidenceCatalog({
    contractVersion: "research-evidence-v1",
    symbol: "BTCUSDT",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    integrity: catalogIntegrity,
    items: [item],
  });
  assert.equal(parsed.items[0].tier, "validated-predictive");
  assert.equal(parsed.items[0].integrityVerified, true);
  assert.equal(parsed.items[0].reportSha256, reportSha256);
  assert.equal(parsed.pipeline, null);
});

test("catalog pipeline exposes verified descriptive coverage and rejects stale published rows", () => {
  const pipeline = {
    state: "succeeded",
    integrityVerified: true,
    running: false,
    locked: false,
    lastStartedAtUtc: "2026-09-21T00:00:00Z",
    lastSucceededAtUtc: "2026-09-21T00:05:00Z",
    lastFailedAtUtc: null,
    lastError: "Previous artifact write failed integrity verification.",
    updatedAtUtc: "2026-09-21T00:05:00Z",
    staleAfterUtc: "2026-09-22T00:05:00Z",
    timeframes: [{ timeframe: "4h", cutoffMs: 1_800_000_000_000, manifestSha256: "d".repeat(64), stored: 100, eligible: 80, excluded: 20, realizedAtMaxHorizon: 70, definitionsSha256: "e".repeat(64), semanticVerification: true }],
  };
  const parsed = parseResearchEvidenceCatalog({ contractVersion: "v1", generatedAtUtc: "2026-09-21T00:00:00Z", symbol: "BTCUSDT", integrity: catalogIntegrity, items: [item], pipeline });
  assert.equal(parsed.pipeline?.timeframes[0].eligible, 80);
  assert.equal(parsed.pipeline?.integrityVerified, true);
  assert.equal(parsed.pipeline?.lastError, "Previous artifact write failed integrity verification.");
  assert.throws(() => parseResearchEvidenceCatalog({ contractVersion: "v1", generatedAtUtc: "2026-09-21T00:00:00Z", symbol: "BTCUSDT", integrity: catalogIntegrity, items: [item], pipeline: { ...pipeline, state: "stale" } }), /stale evidence pipeline/);
});

test("catalog rejects available artifacts whose hashes were not verified", () => {
  assert.throws(() => parseResearchEvidenceCatalog({
    contractVersion: "research-evidence-v1",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    symbol: "BTCUSDT",
    integrity: catalogIntegrity,
    items: [{ ...item, integrity: { verified: false } }],
  }), /verified integrity/);
});

test("catalog exposes integrity-limited legacy artifacts without presenting them as verified", () => {
  const parsed = parseResearchEvidenceCatalog({
    contractVersion: "research-evidence-v1",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    symbol: "BTCUSDT",
    integrity: catalogIntegrity,
    items: [{ ...item, status: "integrity-limited", evidenceTier: "predictive", integrity: { verified: false } }],
  });
  assert.equal(parsed.items[0].status, "integrity-limited");
  assert.equal(parsed.items[0].integrityVerified, false);
  assert.equal(parsed.items[0].tier, "predictive");
});

test("catalog preserves retrospective selection-aware evidence without promoting it", () => {
  const parsed = parseResearchEvidenceCatalog({
    contractVersion: "research-evidence-v1",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    symbol: "BTCUSDT",
    integrity: catalogIntegrity,
    items: [{ ...item, status: "inconclusive", evidenceTier: "retrospective-selection-aware" }],
  });
  assert.equal(parsed.items[0].tier, "retrospective-selection-aware");
  assert.equal(parsed.items[0].status, "inconclusive");
});

test("detail preserves dataset, protocol, uncertainty and provenance", () => {
  const parsed = parseResearchEvidenceDetail({
    ...item,
    hypothesis: "Features improve proper scoring rules over historical priors.",
    dataset: {
      source: "WindowClassificationDatasets",
      rowCount: 13_680,
      firstDecisionTimeMs: 1_700_000_000_000,
      lastDecisionTimeMs: 1_760_000_000_000,
      datasetSha256: "d".repeat(64),
    },
    protocol: {
      evaluatorVersion: "v2",
      decisionTime: "bar close",
      outcomePriceBasis: "future close",
      chronologicalOos: true,
      multipleTesting: "Bonferroni",
    },
    baselines: [{ id: "expanding-prior", description: "Class prior known at decision time." }],
    metrics: [{ name: "brier", label: "Brier", value: 0.46, unit: "score", baseline: "rolling_class_prior", interpretation: "lower is better" }],
    findings: [{ id: "trial:hgb", label: "HGB", status: "supported", metricName: "brier", value: 0.46, lower: 0.10, upper: 0.11, sampleSize: 13_680 }],
    uncertainty: [{ name: "brier", lower: 0.10, upper: 0.11, confidenceLevel: 0.95, familywise: true }],
    coverage: { evaluatedRows: 13_680, eligibleRows: 13_680, ratio: 1, foldCount: 114 },
    conclusion: "Predictive gate passed only.",
    provenance: { evaluatorSha256: "e".repeat(64), gitCommit: "deadbeef", gitDirty: false },
    artifacts: [{ role: "datasetSnapshot", sha256: "f".repeat(64), bytes: 1024, rowCount: 13_680 }],
  });
  assert.equal(parsed.dataset?.rowCount, 13_680);
  assert.equal(parsed.dataset?.snapshotSha256, "d".repeat(64));
  assert.equal(parsed.protocol?.chronologicalOos, true);
  assert.deepEqual([parsed.metrics[0].intervalLow, parsed.metrics[0].intervalHigh], [0.10, 0.11]);
  assert.equal(parsed.uncertainty[0].familywise, true);
  assert.equal(parsed.metrics[0].baseline, "rolling_class_prior");
  assert.equal(parsed.metrics[0].interpretation, "lower is better");
  assert.equal(parsed.findings[0].sampleSize, 13_680);
  assert.equal(parsed.coverage?.foldCount, 114);
  assert.equal(parsed.baselines[0].id, "expanding-prior");
  assert.equal(parsed.artifacts[0].rowCount, 13_680);
});

test("descriptive technical bundle preserves coverage, exclusions and artifact roles without predictive promotion", () => {
  const statisticalEvidence = JSON.parse(readFileSync(new URL("../contracts/technical-evidence-statistics.example.json", import.meta.url), "utf8"));
  const parsed = parseResearchEvidenceDetail({
    ...item,
    kind: "event",
    title: "Technical-event descriptive history",
    status: "inconclusive",
    evidenceTier: "descriptive",
    summary: "Historical event distributions only.",
    conclusion: "No predictive probability or trading claim.",
    limitations: ["Legacy rows with unknown availability were excluded."],
    dataset: { source: "stored-finalized-klines", rowCount: 500, datasetSha256: "d".repeat(64) },
    protocol: { evaluatorVersion: "btc-technical-event-descriptive-evidence/v1", chronologicalOos: true, decisionTime: "finalized candle close" },
    metrics: [{ name: "events.eligible", label: "Causally eligible events", value: 420, unit: "count" }],
    findings: [{ id: "BOS_BULL:1:return:event", label: "BOS_BULL after one bar", status: "descriptive", metricName: "forwardReturn", value: 0.01, lower: -0.02, upper: 0.03, sampleSize: 120 }],
    uncertainty: [{ name: "BOS_BULL.1.forwardReturn.event.mean", lower: -0.02, upper: 0.03, confidenceLevel: 0.95, familywise: false }],
    coverage: { evaluatedRows: 400, eligibleRows: 420, ratio: 0.84, foldCount: null },
    provenance: { evaluatorSha256: "e".repeat(64), gitCommit: "deadbeef", gitDirty: false },
    artifacts: [
      { role: "snapshot", sha256: "f".repeat(64), bytes: 1024, rowCount: 500 },
      { role: "ledger", sha256: "1".repeat(64), bytes: 2048, rowCount: 500 },
      { role: "report", sha256: "2".repeat(64), bytes: 512, rowCount: null },
    ],
    statisticalEvidence,
  });
  assert.equal(parsed.kind, "event");
  assert.equal(parsed.tier, "descriptive");
  assert.equal(parsed.status, "inconclusive");
  assert.equal(parsed.findings[0].status, "descriptive");
  assert.equal(parsed.coverage?.evaluatedRows, 400);
  assert.match(parsed.limitations[0], /excluded/);
  assert.deepEqual(parsed.artifacts.map((artifact) => artifact.role), ["snapshot", "ledger", "report"]);
  assert.equal(parsed.statisticalEvidence?.schema, "btc-technical-evidence-statistics/v1");
});

test("detail maps sensitivityAudit, reportExclusions and eventTypeDetail passthroughs and tolerates absence", () => {
  const parsed = parseResearchEvidenceDetail({
    ...item,
    kind: "event",
    evidenceTier: "descriptive",
    sensitivityAudit: {
      method: "one_axis_at_a_time",
      resultSelection: false,
      promotionAllowed: false,
      variantCount: 1,
      preRegisteredGrid: { declaredGridSha256: "d".repeat(64), executedVariantIds: ["technicalIndicators:rsi-period-21"] },
      variants: [{
        module: "technicalIndicators",
        variantId: "rsi-period-21",
        parameters: { rsiPeriod: 21 },
        stored: 2,
        eligible: 1,
        excluded: 1,
        realizedAtMaxHorizon: 1,
        exclusionReasons: { unknown_availability: 1 },
        overlapCandidatesExcluded: 0,
        eligibleDecisionTimeJaccardVsBaseline: 0.5,
        horizons: {
          "1": {
            elapsedTimeMs: 14_400_000,
            realized: 1,
            metrics: {
              forwardReturn: { variant: { mean: 0.01 }, baselineMean: 0.008, meanDeltaVsBaseline: 0.002 },
            },
          },
        },
      }],
    },
    reportExclusions: { unknown_availability: 1 },
    eventTypeDetail: { BOS_BULL: { eligible: 1, lifecycleCoverage: { supported: 0, unavailable: 1 }, timeToFirstTouchBars: null } },
  });
  assert.equal(parsed.sensitivityAudit?.variants[0].variantId, "rsi-period-21");
  assert.equal(parsed.sensitivityAudit?.variants[0].eligibleDecisionTimeJaccardVsBaseline, 0.5);
  assert.equal(parsed.sensitivityAudit?.variants[0].horizons["1"].metrics.forwardReturn.meanDeltaVsBaseline, 0.002);
  assert.equal(parsed.sensitivityAudit?.declaredGridSha256, "d".repeat(64));
  assert.deepEqual(parsed.sensitivityAudit?.executedVariantIds, ["technicalIndicators:rsi-period-21"]);
  assert.deepEqual(parsed.reportExclusions, { unknown_availability: 1 });
  assert.equal((parsed.eventTypeDetail?.BOS_BULL as Record<string, unknown>)?.eligible, 1);

  const minimal = parseResearchEvidenceDetail({ ...item });
  assert.equal(minimal.sensitivityAudit, null);
  assert.equal(minimal.reportExclusions, null);
  assert.equal(minimal.eventTypeDetail, null);

  const partial = parseResearchEvidenceDetail({ ...item, sensitivityAudit: {} });
  assert.deepEqual(partial.sensitivityAudit?.variants, []);
  assert.equal(partial.sensitivityAudit?.method, null);
});

test("detail ignores keys absent from the emitted research-evidence contract", () => {
  // DEADFE-1 pin: folds/rows/question/abstentionRate and the raw dataset block
  // keys exist in source artifacts but are allow-listed out of the normalized
  // ResearchEvidenceDetailDto — the parser must not resurrect them.
  const parsed = parseResearchEvidenceDetail({
    ...item,
    folds: [{ fold: 1, rows: 100 }],
    rows: [{ decisionTimeMs: 1 }],
    predictions: [{ outcome: 1 }],
    question: "ignored",
    dataset: {
      source: "stored-finalized-klines",
      rowCount: 500,
      cutoffTimeUtc: "2026-09-21T00:00:00Z",
      predictionsSha256: "f".repeat(64),
      immutable: true,
      featureCount: 12,
      datasetSha256: "d".repeat(64),
    },
    protocol: { name: "ignored", foldCount: 99, purgeBars: 5, notes: ["x"], evaluatorVersion: "v1" },
    coverage: { evaluatedRows: 400, eligibleRows: 420, ratio: 0.84, abstentionRate: 0.16, foldCount: 8 },
    provenance: { artifactPath: "/secret", evaluatorSha256: "e".repeat(64) },
  });
  assert.equal("folds" in parsed, false);
  assert.equal("rows" in parsed, false);
  assert.equal("question" in parsed, false);
  assert.equal("rawSections" in parsed, false);
  assert.equal("abstentionRate" in (parsed.coverage ?? {}), false);
  assert.equal("predictionsSha256" in (parsed.dataset ?? {}), false);
  assert.equal("immutable" in (parsed.dataset ?? {}), false);
  assert.equal("artifactPath" in parsed.provenance, false);
  assert.equal("foldCount" in (parsed.protocol ?? {}), false);
  // Contracted fields still parse.
  assert.equal(parsed.dataset?.snapshotSha256, "d".repeat(64));
  assert.equal(parsed.coverage?.foldCount, 8);
  assert.equal(parsed.protocol?.version, "v1");
});

test("catalog rejects non-BTC evidence and duplicate ids", () => {
  assert.throws(() => parseResearchEvidenceCatalog({
    contractVersion: "v1",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    symbol: "BTCUSDT",
    integrity: catalogIntegrity,
    items: [{ ...item, symbol: "ETHUSDT" }],
  }), /BTCUSDT/);
  assert.throws(() => parseResearchEvidenceCatalog({
    contractVersion: "v1",
    generatedAtUtc: "2026-09-21T00:00:00Z",
    symbol: "BTCUSDT",
    integrity: catalogIntegrity,
    items: [item, item],
  }), /duplicate/);
});
