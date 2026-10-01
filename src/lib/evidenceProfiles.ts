export const EVIDENCE_PROFILE_SCHEMA = "btc-technical-evidence-profiles/v1" as const;
export const EVIDENCE_PROFILE_DIMENSIONS = ["yearUtc", "timeframe", "regime"] as const;
export const EVIDENCE_PROFILE_METRICS = ["forwardReturn", "mfe", "mae"] as const;

export type EvidenceProfileDimension = (typeof EVIDENCE_PROFILE_DIMENSIONS)[number];
export type EvidenceProfileMetricName = (typeof EVIDENCE_PROFILE_METRICS)[number];

export type EvidenceProfileMetricSummary = {
  count: number;
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
};

export type EvidenceProfileHorizon = {
  eligible: number;
  realized: number;
  unrealized: number;
  nonPositiveForwardReturnCount: number;
  positiveForwardReturnCount: number;
  metrics: Record<EvidenceProfileMetricName, EvidenceProfileMetricSummary>;
};

export type EvidenceProfileGroup = {
  stored: number;
  eligible: number;
  excluded: number;
  exclusionReasons: Record<string, number>;
  horizons: Record<string, EvidenceProfileHorizon>;
};

export type EvidenceProfileBreakdowns = Record<EvidenceProfileDimension, Record<string, EvidenceProfileGroup>>;

export type EvidenceProfileCoverage = {
  candles: {
    rows: number;
    firstOpenTimeMs: number | null;
    lastOpenTimeMs: number | null;
    gapCount: number;
    estimatedMissingBars: number;
    irregularSpacingCount: number;
    segmentCount: number;
  };
  events: {
    rows: number;
    withoutDecisionTime: number;
    withoutUsableContext: number;
    withoutKnownLineage: number;
    unmatchedHistoricalControls: number;
    horizonMissingness: Record<string, number>;
  };
  modules: Record<string, {
    status: string;
    eventRowsInLedger: number;
    declaredEventRows: number | null;
  }>;
};

export type EvidenceProfileRetentionRow = {
  module: string | null;
  eventType: string | null;
  stored: number | null;
  eligible: number;
  realizedAtMaxHorizon: number;
  meanForwardReturnAtMaxHorizon: number | null;
  retentionClassification: "no_realized_sample_retained" | "non_positive_mean_retained" | "positive_mean_retained";
};

export type EvidenceProfileRetention = {
  rule: string;
  thresholdSelectionAllowed: false;
  eventTypes: Record<string, EvidenceProfileRetentionRow>;
  sensitivityVariants: Record<string, EvidenceProfileRetentionRow>;
};

export type TechnicalEvidenceProfiles = {
  schema: typeof EVIDENCE_PROFILE_SCHEMA;
  selectionPolicy: {
    dimensionsDeclaredBeforeOutcomes: EvidenceProfileDimension[];
    minimumSampleFilter: null;
    outcomeThresholdFilter: null;
    rankingOrWinnerSelection: false;
  };
  breakdowns: EvidenceProfileBreakdowns;
  byModule: Record<string, {
    breakdowns: EvidenceProfileBreakdowns;
    coverageAndMissingness: EvidenceProfileCoverage | null;
    negativeResultRetention: EvidenceProfileRetention;
  }>;
  coverageAndMissingness: EvidenceProfileCoverage;
  overlapAndDependence: {
    unit: string;
    eligibleDecisionCloses: number;
    baseModuleCountPerClose: Record<string, number>;
    uniqueDecisionClosesByModule: Record<string, number>;
    pairwiseSameCloseCounts: Record<string, number>;
    confluence: {
      eligibleRows: number;
      coLocatedBaseModuleCount: Record<string, number>;
      rowsWithFewerThanTwoBaseModules: number;
    };
    independenceClaimed: false;
    limitation: string;
  };
  negativeResultRetention: EvidenceProfileRetention;
  profileDefinitionsSha256: string;
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} must be a non-negative integer`);
  }
  return value;
}

function nullableNumber(value: unknown, label: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} must be finite or null`);
  }
  return value;
}

function nullableInteger(value: unknown, label: string): number | null {
  if (value == null) return null;
  return integer(value, label);
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} must be a non-empty string`);
  }
  return value;
}

function counts(value: unknown, label: string): Record<string, number> {
  const source = object(value, label);
  const parsed: Record<string, number> = {};
  for (const [key, raw] of Object.entries(source)) {
    if (key.trim() === "") throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} contains an empty key`);
    parsed[key] = integer(raw, `${label}.${key}`);
  }
  return parsed;
}

function metricSummary(value: unknown, label: string): EvidenceProfileMetricSummary {
  const source = object(value, label);
  const count = integer(source.count, `${label}.count`);
  const parsed = {
    count,
    mean: nullableNumber(source.mean, `${label}.mean`),
    median: nullableNumber(source.median, `${label}.median`),
    minimum: nullableNumber(source.minimum, `${label}.minimum`),
    maximum: nullableNumber(source.maximum, `${label}.maximum`),
  };
  if (count === 0 && Object.values(parsed).slice(1).some((item) => item !== null)) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} empty metric must retain null values`);
  }
  if (count > 0 && [parsed.mean, parsed.median, parsed.minimum, parsed.maximum].some((item) => item == null)) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} sampled metric cannot omit values`);
  }
  return parsed;
}

function group(value: unknown, label: string): EvidenceProfileGroup {
  const source = object(value, label);
  const stored = integer(source.stored, `${label}.stored`);
  const eligible = integer(source.eligible, `${label}.eligible`);
  const excluded = integer(source.excluded, `${label}.excluded`);
  if (eligible + excluded !== stored) throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} counts are inconsistent`);
  const exclusionReasons = counts(source.exclusionReasons, `${label}.exclusionReasons`);
  if (Object.values(exclusionReasons).reduce((sum, item) => sum + item, 0) !== excluded) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} exclusions do not reconcile`);
  }
  const horizonSource = object(source.horizons, `${label}.horizons`);
  const horizons: Record<string, EvidenceProfileHorizon> = {};
  for (const [horizon, raw] of Object.entries(horizonSource)) {
    if (!/^\d+$/.test(horizon)) throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} has an invalid horizon`);
    const item = object(raw, `${label}.horizons.${horizon}`);
    const horizonEligible = integer(item.eligible, `${label}.horizons.${horizon}.eligible`);
    const realized = integer(item.realized, `${label}.horizons.${horizon}.realized`);
    const unrealized = integer(item.unrealized, `${label}.horizons.${horizon}.unrealized`);
    const nonPositive = integer(item.nonPositiveForwardReturnCount, `${label}.horizons.${horizon}.nonPositiveForwardReturnCount`);
    const positive = integer(item.positiveForwardReturnCount, `${label}.horizons.${horizon}.positiveForwardReturnCount`);
    if (horizonEligible !== eligible || realized + unrealized !== eligible || nonPositive + positive !== realized) {
      throw new Error(`INVALID_EVIDENCE_PROFILES: ${label}.horizons.${horizon} counts are inconsistent`);
    }
    const metricsSource = object(item.metrics, `${label}.horizons.${horizon}.metrics`);
    const metrics = Object.fromEntries(EVIDENCE_PROFILE_METRICS.map((name) => {
      const parsed = metricSummary(metricsSource[name], `${label}.horizons.${horizon}.metrics.${name}`);
      if (parsed.count !== realized) throw new Error(`INVALID_EVIDENCE_PROFILES: ${label}.horizons.${horizon}.${name} count does not match realized rows`);
      return [name, parsed];
    })) as Record<EvidenceProfileMetricName, EvidenceProfileMetricSummary>;
    horizons[horizon] = { eligible: horizonEligible, realized, unrealized, nonPositiveForwardReturnCount: nonPositive, positiveForwardReturnCount: positive, metrics };
  }
  return { stored, eligible, excluded, exclusionReasons, horizons };
}

function breakdowns(value: unknown, label: string): EvidenceProfileBreakdowns {
  const source = object(value, label);
  return Object.fromEntries(EVIDENCE_PROFILE_DIMENSIONS.map((dimension) => {
    const groups = object(source[dimension], `${label}.${dimension}`);
    return [dimension, Object.fromEntries(Object.entries(groups).map(([key, raw]) => [key, group(raw, `${label}.${dimension}.${key}`)]))];
  })) as EvidenceProfileBreakdowns;
}

function coverage(value: unknown, label: string): EvidenceProfileCoverage {
  const source = object(value, label);
  const candles = object(source.candles, `${label}.candles`);
  const events = object(source.events, `${label}.events`);
  const moduleSource = object(source.modules, `${label}.modules`);
  return {
    candles: {
      rows: integer(candles.rows, `${label}.candles.rows`),
      firstOpenTimeMs: nullableInteger(candles.firstOpenTimeMs, `${label}.candles.firstOpenTimeMs`),
      lastOpenTimeMs: nullableInteger(candles.lastOpenTimeMs, `${label}.candles.lastOpenTimeMs`),
      gapCount: integer(candles.gapCount, `${label}.candles.gapCount`),
      estimatedMissingBars: integer(candles.estimatedMissingBars, `${label}.candles.estimatedMissingBars`),
      irregularSpacingCount: integer(candles.irregularSpacingCount, `${label}.candles.irregularSpacingCount`),
      segmentCount: integer(candles.segmentCount, `${label}.candles.segmentCount`),
    },
    events: {
      rows: integer(events.rows, `${label}.events.rows`),
      withoutDecisionTime: integer(events.withoutDecisionTime, `${label}.events.withoutDecisionTime`),
      withoutUsableContext: integer(events.withoutUsableContext, `${label}.events.withoutUsableContext`),
      withoutKnownLineage: integer(events.withoutKnownLineage, `${label}.events.withoutKnownLineage`),
      unmatchedHistoricalControls: integer(events.unmatchedHistoricalControls, `${label}.events.unmatchedHistoricalControls`),
      horizonMissingness: counts(events.horizonMissingness, `${label}.events.horizonMissingness`),
    },
    modules: Object.fromEntries(Object.entries(moduleSource).map(([key, raw]) => {
      const item = object(raw, `${label}.modules.${key}`);
      return [key, {
        status: nonBlank(item.status, `${label}.modules.${key}.status`),
        eventRowsInLedger: integer(item.eventRowsInLedger, `${label}.modules.${key}.eventRowsInLedger`),
        declaredEventRows: nullableInteger(item.declaredEventRows, `${label}.modules.${key}.declaredEventRows`),
      }];
    })),
  };
}

function optionalModuleCoverage(value: unknown, label: string): EvidenceProfileCoverage | null {
  const source = object(value, label);
  return Object.keys(source).length === 0 ? null : coverage(source, label);
}

const RETENTION_CLASSES = new Set(["no_realized_sample_retained", "non_positive_mean_retained", "positive_mean_retained"]);

function retentionRow(value: unknown, label: string, includeIdentity: boolean): EvidenceProfileRetentionRow {
  const source = object(value, label);
  const classification = nonBlank(source.retentionClassification, `${label}.retentionClassification`);
  if (!RETENTION_CLASSES.has(classification)) throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} has an invalid retention classification`);
  const mean = nullableNumber(source.meanForwardReturnAtMaxHorizon, `${label}.meanForwardReturnAtMaxHorizon`);
  if ((mean == null) !== (classification === "no_realized_sample_retained")) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} mean and retention classification disagree`);
  }
  if (mean != null && ((mean > 0) !== (classification === "positive_mean_retained"))) {
    throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} mean sign and retention classification disagree`);
  }
  return {
    module: includeIdentity ? nonBlank(source.module, `${label}.module`) : null,
    eventType: includeIdentity ? nonBlank(source.eventType, `${label}.eventType`) : null,
    stored: includeIdentity ? integer(source.stored, `${label}.stored`) : null,
    eligible: integer(source.eligible, `${label}.eligible`),
    realizedAtMaxHorizon: integer(source.realizedAtMaxHorizon, `${label}.realizedAtMaxHorizon`),
    meanForwardReturnAtMaxHorizon: mean,
    retentionClassification: classification as EvidenceProfileRetentionRow["retentionClassification"],
  };
}

function retention(value: unknown, label: string): EvidenceProfileRetention {
  const source = object(value, label);
  if (source.thresholdSelectionAllowed !== false) throw new Error(`INVALID_EVIDENCE_PROFILES: ${label} threshold selection must be disabled`);
  const eventTypes = object(source.eventTypes, `${label}.eventTypes`);
  const variants = object(source.sensitivityVariants, `${label}.sensitivityVariants`);
  return {
    rule: nonBlank(source.rule, `${label}.rule`),
    thresholdSelectionAllowed: false,
    eventTypes: Object.fromEntries(Object.entries(eventTypes).map(([key, raw]) => [key, retentionRow(raw, `${label}.eventTypes.${key}`, true)])),
    sensitivityVariants: Object.fromEntries(Object.entries(variants).map(([key, raw]) => [key, retentionRow(raw, `${label}.sensitivityVariants.${key}`, false)])),
  };
}

export function parseTechnicalEvidenceProfiles(value: unknown): TechnicalEvidenceProfiles {
  const source = object(value, "evidenceProfiles");
  if (source.schema !== EVIDENCE_PROFILE_SCHEMA) throw new Error("INVALID_EVIDENCE_PROFILES: unsupported schema");
  const policy = object(source.selectionPolicy, "evidenceProfiles.selectionPolicy");
  const declaredDimensions = policy.dimensionsDeclaredBeforeOutcomes;
  if (!Array.isArray(declaredDimensions)
    || declaredDimensions.length !== EVIDENCE_PROFILE_DIMENSIONS.length
    || EVIDENCE_PROFILE_DIMENSIONS.some((item) => !declaredDimensions.includes(item))) {
    throw new Error("INVALID_EVIDENCE_PROFILES: declared filter dimensions do not match the contract");
  }
  if (policy.minimumSampleFilter !== null || policy.outcomeThresholdFilter !== null || policy.rankingOrWinnerSelection !== false) {
    throw new Error("INVALID_EVIDENCE_PROFILES: outcome-driven selection or ranking is forbidden");
  }
  const byModuleSource = object(source.byModule, "evidenceProfiles.byModule");
  const overlap = object(source.overlapAndDependence, "evidenceProfiles.overlapAndDependence");
  const confluence = object(overlap.confluence, "evidenceProfiles.overlapAndDependence.confluence");
  if (overlap.independenceClaimed !== false) throw new Error("INVALID_EVIDENCE_PROFILES: event independence cannot be claimed");
  const profileDefinitionsSha256 = nonBlank(source.profileDefinitionsSha256, "evidenceProfiles.profileDefinitionsSha256");
  if (!/^[a-f0-9]{64}$/i.test(profileDefinitionsSha256)) throw new Error("INVALID_EVIDENCE_PROFILES: profileDefinitionsSha256 must be a SHA-256 digest");
  return {
    schema: EVIDENCE_PROFILE_SCHEMA,
    selectionPolicy: {
      dimensionsDeclaredBeforeOutcomes: [...EVIDENCE_PROFILE_DIMENSIONS],
      minimumSampleFilter: null,
      outcomeThresholdFilter: null,
      rankingOrWinnerSelection: false,
    },
    breakdowns: breakdowns(source.breakdowns, "evidenceProfiles.breakdowns"),
    byModule: Object.fromEntries(Object.entries(byModuleSource).map(([key, raw]) => {
      const item = object(raw, `evidenceProfiles.byModule.${key}`);
      return [key, {
        breakdowns: breakdowns(item.breakdowns, `evidenceProfiles.byModule.${key}.breakdowns`),
        coverageAndMissingness: optionalModuleCoverage(item.coverageAndMissingness, `evidenceProfiles.byModule.${key}.coverageAndMissingness`),
        negativeResultRetention: retention(item.negativeResultRetention, `evidenceProfiles.byModule.${key}.negativeResultRetention`),
      }];
    })),
    coverageAndMissingness: coverage(source.coverageAndMissingness, "evidenceProfiles.coverageAndMissingness"),
    overlapAndDependence: {
      unit: nonBlank(overlap.unit, "evidenceProfiles.overlapAndDependence.unit"),
      eligibleDecisionCloses: integer(overlap.eligibleDecisionCloses, "evidenceProfiles.overlapAndDependence.eligibleDecisionCloses"),
      baseModuleCountPerClose: counts(overlap.baseModuleCountPerClose, "evidenceProfiles.overlapAndDependence.baseModuleCountPerClose"),
      uniqueDecisionClosesByModule: counts(overlap.uniqueDecisionClosesByModule, "evidenceProfiles.overlapAndDependence.uniqueDecisionClosesByModule"),
      pairwiseSameCloseCounts: counts(overlap.pairwiseSameCloseCounts, "evidenceProfiles.overlapAndDependence.pairwiseSameCloseCounts"),
      confluence: {
        eligibleRows: integer(confluence.eligibleRows, "evidenceProfiles.overlapAndDependence.confluence.eligibleRows"),
        coLocatedBaseModuleCount: counts(confluence.coLocatedBaseModuleCount, "evidenceProfiles.overlapAndDependence.confluence.coLocatedBaseModuleCount"),
        rowsWithFewerThanTwoBaseModules: integer(confluence.rowsWithFewerThanTwoBaseModules, "evidenceProfiles.overlapAndDependence.confluence.rowsWithFewerThanTwoBaseModules"),
      },
      independenceClaimed: false,
      limitation: nonBlank(overlap.limitation, "evidenceProfiles.overlapAndDependence.limitation"),
    },
    negativeResultRetention: retention(source.negativeResultRetention, "evidenceProfiles.negativeResultRetention"),
    profileDefinitionsSha256,
  };
}
