import assert from "node:assert/strict";
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
  status: "available",
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
