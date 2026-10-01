import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseTechnicalEvidenceProfiles } from "../src/lib/evidenceProfiles.ts";

function metric(count: number, mean: number | null) {
  return { count, mean, median: mean, minimum: mean, maximum: mean };
}

function group(stored = 2, eligible = 1) {
  return {
    stored,
    eligible,
    excluded: stored - eligible,
    exclusionReasons: stored === eligible ? {} : { non_contiguous_followup: stored - eligible },
    horizons: {
      "1": {
        eligible,
        realized: eligible,
        unrealized: 0,
        nonPositiveForwardReturnCount: eligible,
        positiveForwardReturnCount: 0,
        metrics: {
          forwardReturn: metric(eligible, eligible ? -0.01 : null),
          mfe: metric(eligible, eligible ? 0.02 : null),
          mae: metric(eligible, eligible ? -0.03 : null),
        },
      },
    },
  };
}

const coverage = {
  candles: { rows: 100, firstOpenTimeMs: 1, lastOpenTimeMs: 100, gapCount: 1, estimatedMissingBars: 2, irregularSpacingCount: 0, segmentCount: 2 },
  events: { rows: 2, withoutDecisionTime: 0, withoutUsableContext: 1, withoutKnownLineage: 0, unmatchedHistoricalControls: 1, horizonMissingness: { "1": 0 } },
  modules: { technicalIndicators: { status: "evaluable", eventRowsInLedger: 2, declaredEventRows: 2 } },
};

const retention = {
  rule: "retain every declared result",
  thresholdSelectionAllowed: false,
  eventTypes: {
    "technicalIndicators:NO_SAMPLE": { module: "technicalIndicators", eventType: "NO_SAMPLE", stored: 1, eligible: 0, realizedAtMaxHorizon: 0, meanForwardReturnAtMaxHorizon: null, retentionClassification: "no_realized_sample_retained" },
    "technicalIndicators:NEGATIVE": { module: "technicalIndicators", eventType: "NEGATIVE", stored: 1, eligible: 1, realizedAtMaxHorizon: 1, meanForwardReturnAtMaxHorizon: -0.01, retentionClassification: "non_positive_mean_retained" },
  },
  sensitivityVariants: {},
};

const breakdowns = {
  yearUtc: { "2026": group() },
  timeframe: { "4h": group() },
  regime: { "trend=bear|volatility=high": group() },
};

const profile = {
  schema: "btc-technical-evidence-profiles/v1",
  selectionPolicy: { dimensionsDeclaredBeforeOutcomes: ["yearUtc", "timeframe", "regime"], minimumSampleFilter: null, outcomeThresholdFilter: null, rankingOrWinnerSelection: false },
  breakdowns,
  byModule: { technicalIndicators: { breakdowns, coverageAndMissingness: coverage, negativeResultRetention: retention } },
  coverageAndMissingness: coverage,
  overlapAndDependence: {
    unit: "distinct module presence at the same finalized decision close",
    eligibleDecisionCloses: 1,
    baseModuleCountPerClose: { "1": 1 },
    uniqueDecisionClosesByModule: { technicalIndicators: 1 },
    pairwiseSameCloseCounts: {},
    confluence: { eligibleRows: 0, coLocatedBaseModuleCount: {}, rowsWithFewerThanTwoBaseModules: 0 },
    independenceClaimed: false,
    limitation: "overlap means rows are not independent trials",
  },
  negativeResultRetention: retention,
  profileDefinitionsSha256: "a".repeat(64),
};

test("evidence profiles preserve predeclared filters, horizon metrics, missingness and negative/no-sample results", () => {
  const parsed = parseTechnicalEvidenceProfiles(profile);
  assert.equal(parsed.breakdowns.regime["trend=bear|volatility=high"]?.horizons["1"]?.metrics.forwardReturn.mean, -0.01);
  assert.equal(parsed.coverageAndMissingness.candles.estimatedMissingBars, 2);
  assert.equal(parsed.overlapAndDependence.independenceClaimed, false);
  assert.equal(parsed.negativeResultRetention.eventTypes["technicalIndicators:NO_SAMPLE"]?.retentionClassification, "no_realized_sample_retained");
  assert.equal(parsed.negativeResultRetention.eventTypes["technicalIndicators:NEGATIVE"]?.meanForwardReturnAtMaxHorizon, -0.01);
  const unavailableModuleCoverage = parseTechnicalEvidenceProfiles({
    ...profile,
    byModule: { technicalIndicators: { breakdowns, coverageAndMissingness: {}, negativeResultRetention: retention } },
  });
  assert.equal(unavailableModuleCoverage.byModule.technicalIndicators?.coverageAndMissingness, null);
});

test("evidence profiles fail closed on winner selection and inconsistent sample counts", () => {
  assert.throws(() => parseTechnicalEvidenceProfiles({ ...profile, selectionPolicy: { ...profile.selectionPolicy, rankingOrWinnerSelection: true } }), /selection or ranking is forbidden/);
  const badGroup = group();
  badGroup.horizons["1"].positiveForwardReturnCount = 1;
  assert.throws(() => parseTechnicalEvidenceProfiles({ ...profile, breakdowns: { ...breakdowns, yearUtc: { "2026": badGroup } } }), /counts are inconsistent/);
});

test("Evidence Center exposes module/year/timeframe/regime filters without winner or probability language", () => {
  const source = readFileSync(new URL("../src/components/EvidenceProfilesPanel.tsx", import.meta.url), "utf8");
  const detailParserSource = readFileSync(new URL("../src/lib/researchEvidence.ts", import.meta.url), "utf8");
  const evidenceCenterSource = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");
  assert.match(source, /Tất cả module/);
  assert.match(source, /Năm UTC/);
  assert.match(source, /Timeframe/);
  assert.match(source, /Regime/);
  assert.match(source, /Negative\/no-sample retention/);
  assert.match(source, /không xếp hạng, chọn winner/);
  assert.match(source, /không phải tỷ lệ thắng/);
  assert.match(detailParserSource, /evidenceProfiles: evidenceProfilesRaw == null \? null : parseTechnicalEvidenceProfiles\(evidenceProfilesRaw\)/);
  assert.match(detailParserSource, /statisticalEvidence: statisticalEvidenceRaw == null \? null : parseTechnicalStatisticalEvidence\(statisticalEvidenceRaw\)/);
  assert.match(evidenceCenterSource, /detail\.evidenceProfiles && <EvidenceProfilesPanel profiles=\{detail\.evidenceProfiles\}/);
});
