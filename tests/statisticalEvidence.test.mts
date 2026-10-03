import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  classifyStatisticalHypothesis,
  parseTechnicalStatisticalEvidence,
} from "../src/lib/statisticalEvidence.ts";

function stability(count: number, mean = 0.01) {
  if (count === 0) return { groups: {}, availableGroupCount: 0, pooledSignAgreementFraction: null, minimumSampleFilter: null };
  return {
    groups: { "2026": { count, meanPairedDifference: mean, medianPairedDifference: mean, sign: mean > 0 ? "positive" : mean < 0 ? "negative" : "zero" } },
    availableGroupCount: 1,
    pooledSignAgreementFraction: 1,
    minimumSampleFilter: null,
  };
}

function hypothesis(overrides: Record<string, unknown> = {}) {
  return {
    hypothesisId: "technicalIndicators:EMA_BULL_CROSS:1:forwardReturn",
    module: "technicalIndicators",
    eventType: "EMA_BULL_CROSS",
    horizonBars: 1,
    metric: "forwardReturn",
    status: "tested",
    nullBaseline: "strict-prior exact trend+volatility regime match without replacement",
    effectSize: {
      count: 3,
      meanPairedDifference: 0.01,
      medianPairedDifference: 0.008,
      pairedStandardizedMeanDifference: 0.7,
      positiveFraction: 2 / 3,
      tieFraction: 0,
      negativeFraction: 1 / 3,
    },
    blockBootstrap: {
      samples: 1000,
      blockSizeEvents: 1,
      meanDifferenceInterval: { lower: 0.002, upper: 0.02 },
      centeredTwoSidedPValue: 0.01,
    },
    rawPValue: 0.01,
    adjustedQValue: 0.04,
    passesDeclaredFdr: true,
    sufficientSample: true,
    minimumNonOverlappingPairs: 2,
    sampleDiagnostics: {
      nominalMatchedPairs: 3,
      uniqueDecisionTimes: 3,
      maximumGreedyNonOverlappingOutcomeWindows: 2,
      observationsExcludedForMaximumNonOverlappingSet: 1,
      eventOrderAutocorrelationEffectiveSampleSize: { estimate: 2.4, positiveAutocorrelationLagsUsed: 1, maxLags: 20 },
      independenceClaimed: false,
    },
    stability: { yearUtc: stability(3), regime: stability(3) },
    ...overrides,
  };
}

function fixture(hypotheses: unknown[] = [hypothesis()]) {
  const seeds = hypotheses as Array<Record<string, unknown>>;
  const identities = [...new Map(seeds.map((item) => [`${item.module}:${item.eventType}`, item])).values()];
  const expanded = identities.flatMap((seed) => [1, 3, 6].flatMap((horizonBars) =>
    ["forwardReturn", "mfe", "mae"].map((metric) => ({
      ...seed,
      horizonBars,
      metric,
      hypothesisId: `${seed.module}:${seed.eventType}:${horizonBars}:${metric}`,
    }))));
  const moduleEventTypes = Object.fromEntries(identities.reduce<Map<string, string[]>>((byModule, item) => {
    const moduleName = String(item.module);
    const eventType = String(item.eventType);
    byModule.set(moduleName, [...new Set([...(byModule.get(moduleName) ?? []), eventType])]);
    return byModule;
  }, new Map()));
  const testable = expanded.filter((item) => (item as { status?: string }).status === "tested").length;
  return {
    schema: "btc-technical-evidence-statistics/v1",
    specSha256: "a".repeat(64),
    scope: { symbol: "BTCUSDT", timeframe: "4h" },
    claimType: "descriptive_only",
    declaredFamily: {
      technicalModuleContractDefinitionsSha256: "c".repeat(64),
      moduleEventTypes,
      moduleEventTypeIdentityCount: identities.length,
      cartesianHypothesisCount: expanded.length,
      unknownObservedIdentityPolicy: "fail_closed",
      zeroEventPolicy: "retain_with_null_inferential_values",
    },
    nullBaseline: {
      method: "strict-prior exact-regime matched control without replacement",
      regimeKeys: ["trend", "volatility"],
      causality: "control outcome through max horizon finalized before event decision",
      limitation: "descriptive, not a randomized counterfactual",
    },
    dependence: {
      intervalMethod: "moving block bootstrap",
      blockLengthSource: "manifest blockSizeEvents",
      nullPValue: "two-sided centered moving-block bootstrap",
      assumptions: ["local dependence"],
      configuredBlockSizeEvents: 4,
      bootstrapSamples: 1000,
      randomSeed: 42,
    },
    multipleTesting: {
      method: "Benjamini-Yekutieli",
      target: "false discovery rate",
      declaredQAlpha: 0.05,
      dependenceAssumption: "arbitrary dependence",
      interpretation: "diagnostic only",
      familySizeAllRetained: expanded.length,
      testableFamilySize: testable,
    },
    sampleDiagnosticsDefinition: { reported: ["nominal matched pairs", "effective sample size"], independenceClaimed: false },
    stabilityDefinition: { dimensions: ["yearUtc", "regime"], statistics: ["count", "mean", "median", "sign"], selection: "all observed groups retained" },
    sensitivityGrid: {
      declaredGridSha256: "b".repeat(64),
      executedVariantIds: ["rsiBands=30_70"],
      allExecutedVariantsRetained: true,
      outcomeDrivenSelectionAllowed: false,
    },
    retentionPolicy: "retain positive, negative, non-significant, insufficient-sample, and no-sample identities",
    hypotheses: expanded,
  };
}

test("parses statistical evidence and derives state from the declared q threshold plus CI", () => {
  const parsed = parseTechnicalStatisticalEvidence(fixture());
  assert.equal(parsed.scope.symbol, "BTCUSDT");
  assert.equal(parsed.hypotheses[0].sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize.estimate, 2.4);
  assert.equal(classifyStatisticalHypothesis(parsed.hypotheses[0], parsed.multipleTesting.declaredQAlpha), "difference_detected");

  const inconclusive = parseTechnicalStatisticalEvidence(fixture([hypothesis({
    blockBootstrap: { samples: 1000, blockSizeEvents: 1, meanDifferenceInterval: { lower: -0.001, upper: 0.02 }, centeredTwoSidedPValue: 0.01 },
  })]));
  assert.equal(classifyStatisticalHypothesis(inconclusive.hypotheses[0], 0.05), "inconclusive");
});

test("retains no-sample and insufficient hypotheses without turning them into positive evidence", () => {
  const empty = hypothesis({
    status: "insufficient_or_no_matched_sample",
    effectSize: { count: 0, meanPairedDifference: null, medianPairedDifference: null, pairedStandardizedMeanDifference: null, positiveFraction: null, tieFraction: null, negativeFraction: null },
    blockBootstrap: { samples: 1000, blockSizeEvents: null, meanDifferenceInterval: null, centeredTwoSidedPValue: null },
    rawPValue: null,
    adjustedQValue: null,
    passesDeclaredFdr: null,
    sufficientSample: false,
    minimumNonOverlappingPairs: 2,
    sampleDiagnostics: { nominalMatchedPairs: 0, uniqueDecisionTimes: 0, maximumGreedyNonOverlappingOutcomeWindows: 0, observationsExcludedForMaximumNonOverlappingSet: 0, eventOrderAutocorrelationEffectiveSampleSize: { estimate: 0, positiveAutocorrelationLagsUsed: 0, maxLags: 20 }, independenceClaimed: false },
    stability: { yearUtc: stability(0), regime: stability(0) },
  });
  const parsed = parseTechnicalStatisticalEvidence(fixture([empty]));
  assert.equal(classifyStatisticalHypothesis(parsed.hypotheses[0], 0.05), "no_sample");
});

test("tested hypothesis below the non-overlap floor keeps q but loses the FDR flag", () => {
  const gated = hypothesis({
    minimumNonOverlappingPairs: 20,
    sufficientSample: false,
    passesDeclaredFdr: false,
  });
  const parsed = parseTechnicalStatisticalEvidence(fixture([gated]));
  assert.equal(parsed.hypotheses[0].passesDeclaredFdr, false);
  assert.equal(parsed.hypotheses[0].sufficientSample, false);
  assert.equal(classifyStatisticalHypothesis(parsed.hypotheses[0], 0.05), "inconclusive");

  assert.throws(
    () => parseTechnicalStatisticalEvidence(fixture([hypothesis({ sufficientSample: true, minimumNonOverlappingPairs: 20 })])),
    /sufficientSample disagrees/,
  );
  assert.throws(
    () => parseTechnicalStatisticalEvidence(fixture([hypothesis({ minimumNonOverlappingPairs: 0 })])),
    /minimumNonOverlappingPairs/,
  );
});

test("fails closed on pre-gate artifacts that lack the sufficiency fields", () => {
  const withoutSufficient: Record<string, unknown> = { ...hypothesis() };
  delete withoutSufficient.sufficientSample;
  const withoutFloor: Record<string, unknown> = { ...hypothesis() };
  delete withoutFloor.minimumNonOverlappingPairs;
  assert.throws(
    () => parseTechnicalStatisticalEvidence(fixture([withoutSufficient])),
    /missing required field\(s\): sufficientSample/,
  );
  assert.throws(
    () => parseTechnicalStatisticalEvidence(fixture([withoutFloor])),
    /missing required field\(s\): minimumNonOverlappingPairs/,
  );
});

test("fails closed when required inference or quantitative reconciliation is invalid", () => {
  assert.throws(() => parseTechnicalStatisticalEvidence({ ...fixture(), schema: "btc-technical-evidence-statistics/v0" }), /unsupported schema/);
  assert.throws(() => parseTechnicalStatisticalEvidence({ ...fixture(), specSha256: "tampered" }), /SHA-256 digest/);
  assert.throws(() => parseTechnicalStatisticalEvidence(fixture([hypothesis({ adjustedQValue: undefined })])), /missing required field/);
  assert.throws(() => parseTechnicalStatisticalEvidence(fixture([hypothesis({ passesDeclaredFdr: false })])), /FDR status disagrees/);
  const mismatchedIdentity = fixture();
  mismatchedIdentity.hypotheses[0].hypothesisId = "wrong";
  assert.throws(() => parseTechnicalStatisticalEvidence(mismatchedIdentity), /identity does not reconcile/);
  assert.throws(() => parseTechnicalStatisticalEvidence({ ...fixture(), multipleTesting: { ...fixture().multipleTesting, familySizeAllRetained: 2 } }), /family counts do not reconcile/);
  assert.throws(() => parseTechnicalStatisticalEvidence({ ...fixture(), declaredFamily: { ...fixture().declaredFamily, moduleEventTypeIdentityCount: 2 } }), /identity count does not reconcile/);
});

test("parses the producer's formal v1 example and preserves nullable unavailable fields", () => {
  const formal = JSON.parse(readFileSync(new URL("../contracts/technical-evidence-statistics.example.json", import.meta.url), "utf8"));
  const parsed = parseTechnicalStatisticalEvidence(formal);
  assert.equal(parsed.sensitivityGrid.declaredGridSha256, null);
  assert.equal(parsed.hypotheses[0].adjustedQValue, null);
  assert.equal(parsed.hypotheses[0].stability.yearUtc.pooledSignAgreementFraction, null);
  assert.equal(parsed.declaredFamily.cartesianHypothesisCount, 378);
  assert.equal(classifyStatisticalHypothesis(parsed.hypotheses[0], parsed.multipleTesting.declaredQAlpha), "no_sample");
});

test("statistical dossier has explicit unavailable, descriptive, sample, stability and sensitivity UX", () => {
  const source = readFileSync(new URL("../src/components/StatisticalEvidencePanel.tsx", import.meta.url), "utf8");
  assert.match(source, /chưa công bố statisticalEvidence theo schema v1/);
  assert.match(source, /Raw pairs/);
  assert.match(source, /Effective n/);
  assert.match(source, /Loại để lấy tập không chồng lấn/);
  assert.match(source, /Stability theo năm UTC/);
  assert.match(source, /Stability theo regime/);
  assert.match(source, /Outcome-driven selection/);
  assert.match(source, /Không rank, chọn winner/);
  assert.match(source, /không phải dự báo hay chọn winner/);
  assert.match(source, /min-w-0 max-w-full overflow-hidden/);
});
