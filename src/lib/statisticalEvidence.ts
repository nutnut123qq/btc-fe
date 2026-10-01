export const TECHNICAL_STATISTICAL_EVIDENCE_SCHEMA = "btc-technical-evidence-statistics/v1" as const;

export const STATISTICAL_METRICS = ["forwardReturn", "mfe", "mae"] as const;
export type StatisticalMetric = (typeof STATISTICAL_METRICS)[number];
export type StatisticalHypothesisStatus = "tested" | "insufficient_or_no_matched_sample";
export type StatisticalDisplayStatus = "difference_detected" | "inconclusive" | "insufficient" | "no_sample";

export type StatisticalStabilityGroup = {
  count: number;
  meanPairedDifference: number;
  medianPairedDifference: number;
  sign: "positive" | "negative" | "zero";
};

export type StatisticalStability = {
  groups: Record<string, StatisticalStabilityGroup>;
  availableGroupCount: number;
  pooledSignAgreementFraction: number | null;
  minimumSampleFilter: null;
};

export type StatisticalHypothesis = {
  hypothesisId: string;
  module: string;
  eventType: string;
  horizonBars: number;
  metric: StatisticalMetric;
  status: StatisticalHypothesisStatus;
  nullBaseline: string;
  effectSize: {
    count: number;
    meanPairedDifference: number | null;
    medianPairedDifference: number | null;
    pairedStandardizedMeanDifference: number | null;
    positiveFraction: number | null;
    tieFraction: number | null;
    negativeFraction: number | null;
  };
  blockBootstrap: {
    samples: number;
    blockSizeEvents: number | null;
    meanDifferenceInterval: { lower: number; upper: number } | null;
    centeredTwoSidedPValue: number | null;
  };
  rawPValue: number | null;
  adjustedQValue: number | null;
  passesDeclaredFdr: boolean | null;
  sampleDiagnostics: {
    nominalMatchedPairs: number;
    uniqueDecisionTimes: number;
    maximumGreedyNonOverlappingOutcomeWindows: number;
    observationsExcludedForMaximumNonOverlappingSet: number;
    eventOrderAutocorrelationEffectiveSampleSize: {
      estimate: number;
      positiveAutocorrelationLagsUsed: number;
      maxLags: number;
    };
    independenceClaimed: false;
  };
  stability: { yearUtc: StatisticalStability; regime: StatisticalStability };
};

export type TechnicalStatisticalEvidence = {
  schema: typeof TECHNICAL_STATISTICAL_EVIDENCE_SCHEMA;
  specSha256: string;
  scope: { symbol: "BTCUSDT"; timeframe: "1h" | "4h" | "1d" };
  claimType: "descriptive_only";
  declaredFamily: {
    technicalModuleContractDefinitionsSha256: string;
    moduleEventTypes: Record<string, string[]>;
    moduleEventTypeIdentityCount: number;
    cartesianHypothesisCount: number;
    unknownObservedIdentityPolicy: "fail_closed";
    zeroEventPolicy: "retain_with_null_inferential_values";
  };
  nullBaseline: {
    method: string;
    regimeKeys: string[];
    causality: string;
    limitation: string;
  };
  dependence: {
    intervalMethod: string;
    blockLengthSource: string;
    nullPValue: string;
    assumptions: string[];
    configuredBlockSizeEvents: number;
    bootstrapSamples: number;
    randomSeed: number;
  };
  multipleTesting: {
    method: string;
    target: string;
    declaredQAlpha: number;
    dependenceAssumption: string;
    interpretation: string;
    familySizeAllRetained: number;
    testableFamilySize: number;
  };
  sampleDiagnosticsDefinition: { reported: string[] | null; independenceClaimed: false };
  stabilityDefinition: { dimensions: string[]; statistics: string[] | null; selection: string | null };
  sensitivityGrid: {
    declaredGridSha256: string | null;
    executedVariantIds: string[];
    allExecutedVariantsRetained: boolean | null;
    outcomeDrivenSelectionAllowed: false;
  };
  retentionPolicy: string;
  hypotheses: StatisticalHypothesis[];
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireKeys(source: Record<string, unknown>, label: string, keys: readonly string[]): void {
  const missing = keys.filter((key) => !Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined);
  if (missing.length > 0) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} is missing required field(s): ${missing.join(", ")}`);
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be a non-empty string`);
  }
  return value;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be finite`);
  }
  return value;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be an integer >= ${minimum}`);
  }
  return value;
}

function nullableFinite(value: unknown, label: string): number | null {
  return value == null ? null : finite(value, label);
}

function probability(value: unknown, label: string): number {
  const parsed = finite(value, label);
  if (parsed < 0 || parsed > 1) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be within [0, 1]`);
  return parsed;
}

function nullableProbability(value: unknown, label: string): number | null {
  return value == null ? null : probability(value, label);
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be an array`);
  const parsed = value.map((item, index) => nonBlank(item, `${label}[${index}]`));
  if (new Set(parsed).size !== parsed.length) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} contains duplicates`);
  return parsed;
}

function optionalStrings(value: unknown, label: string): string[] | null {
  return value == null ? null : strings(value, label);
}

function sha256(value: unknown, label: string): string {
  const parsed = nonBlank(value, label);
  if (!/^[a-f0-9]{64}$/i.test(parsed)) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} must be a SHA-256 digest`);
  return parsed;
}

function interval(value: unknown, label: string): { lower: number; upper: number } | null {
  if (value == null) return null;
  const source = object(value, label);
  requireKeys(source, label, ["lower", "upper"]);
  const lower = finite(source.lower, `${label}.lower`);
  const upper = finite(source.upper, `${label}.upper`);
  if (lower > upper) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} bounds are reversed`);
  return { lower, upper };
}

function stability(value: unknown, label: string, expectedCount: number): StatisticalStability {
  const source = object(value, label);
  requireKeys(source, label, ["groups", "availableGroupCount", "pooledSignAgreementFraction", "minimumSampleFilter"]);
  const groupSource = object(source.groups, `${label}.groups`);
  const groups = Object.fromEntries(Object.entries(groupSource).map(([key, raw]) => {
    if (!key.trim()) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.groups contains an empty key`);
    const item = object(raw, `${label}.groups.${key}`);
    requireKeys(item, `${label}.groups.${key}`, ["count", "meanPairedDifference", "medianPairedDifference", "sign"]);
    const count = integer(item.count, `${label}.groups.${key}.count`, 1);
    const mean = finite(item.meanPairedDifference, `${label}.groups.${key}.meanPairedDifference`);
    const median = finite(item.medianPairedDifference, `${label}.groups.${key}.medianPairedDifference`);
    const sign = nonBlank(item.sign, `${label}.groups.${key}.sign`);
    const expectedSign = mean > 0 ? "positive" : mean < 0 ? "negative" : "zero";
    if (sign !== expectedSign) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.groups.${key} sign disagrees with its mean`);
    return [key, { count, meanPairedDifference: mean, medianPairedDifference: median, sign: sign as StatisticalStabilityGroup["sign"] }];
  }));
  const availableGroupCount = integer(source.availableGroupCount, `${label}.availableGroupCount`);
  if (availableGroupCount !== Object.keys(groups).length) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} group count does not reconcile`);
  if (Object.values(groups).reduce((sum, item) => sum + item.count, 0) !== expectedCount) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} samples do not reconcile`);
  }
  const agreement = nullableProbability(source.pooledSignAgreementFraction, `${label}.pooledSignAgreementFraction`);
  if (source.minimumSampleFilter !== null) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} minimum-sample filtering is forbidden`);
  return { groups, availableGroupCount, pooledSignAgreementFraction: agreement, minimumSampleFilter: null };
}

function hypothesis(value: unknown, index: number, alpha: number, bootstrapSamples: number): StatisticalHypothesis {
  const label = `statisticalEvidence.hypotheses[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["hypothesisId", "module", "eventType", "horizonBars", "metric", "status", "nullBaseline", "effectSize", "blockBootstrap", "rawPValue", "adjustedQValue", "passesDeclaredFdr", "sampleDiagnostics", "stability"]);
  const module = nonBlank(source.module, `${label}.module`);
  const eventType = nonBlank(source.eventType, `${label}.eventType`);
  const horizonBars = integer(source.horizonBars, `${label}.horizonBars`, 1);
  if (![1, 3, 6].includes(horizonBars)) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.horizonBars is unsupported`);
  const metric = nonBlank(source.metric, `${label}.metric`);
  if (!STATISTICAL_METRICS.includes(metric as StatisticalMetric)) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.metric is unsupported`);
  const hypothesisId = nonBlank(source.hypothesisId, `${label}.hypothesisId`);
  if (hypothesisId !== `${module}:${eventType}:${horizonBars}:${metric}`) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} identity does not reconcile`);
  const status = nonBlank(source.status, `${label}.status`);
  if (status !== "tested" && status !== "insufficient_or_no_matched_sample") throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.status is unsupported`);

  const effectSource = object(source.effectSize, `${label}.effectSize`);
  requireKeys(effectSource, `${label}.effectSize`, ["count", "meanPairedDifference", "medianPairedDifference", "pairedStandardizedMeanDifference", "positiveFraction", "tieFraction", "negativeFraction"]);
  const count = integer(effectSource.count, `${label}.effectSize.count`);
  const effect = {
    count,
    meanPairedDifference: nullableFinite(effectSource.meanPairedDifference, `${label}.effectSize.meanPairedDifference`),
    medianPairedDifference: nullableFinite(effectSource.medianPairedDifference, `${label}.effectSize.medianPairedDifference`),
    pairedStandardizedMeanDifference: nullableFinite(effectSource.pairedStandardizedMeanDifference, `${label}.effectSize.pairedStandardizedMeanDifference`),
    positiveFraction: nullableProbability(effectSource.positiveFraction, `${label}.effectSize.positiveFraction`),
    tieFraction: nullableProbability(effectSource.tieFraction, `${label}.effectSize.tieFraction`),
    negativeFraction: nullableProbability(effectSource.negativeFraction, `${label}.effectSize.negativeFraction`),
  };
  const effectValues = [effect.meanPairedDifference, effect.medianPairedDifference, effect.positiveFraction, effect.tieFraction, effect.negativeFraction];
  if (count === 0 ? effectValues.some((item) => item != null) : effectValues.some((item) => item == null)) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.effectSize sample/value availability is inconsistent`);
  }
  if (count > 0 && Math.abs((effect.positiveFraction! + effect.tieFraction! + effect.negativeFraction!) - 1) > 1e-8) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.effectSize sign fractions do not sum to one`);
  }

  const blockSource = object(source.blockBootstrap, `${label}.blockBootstrap`);
  requireKeys(blockSource, `${label}.blockBootstrap`, ["samples", "blockSizeEvents", "meanDifferenceInterval", "centeredTwoSidedPValue"]);
  const blockSamples = integer(blockSource.samples, `${label}.blockBootstrap.samples`, 1);
  if (blockSamples !== bootstrapSamples) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} bootstrap sample count does not match the contract`);
  const blockSize = blockSource.blockSizeEvents == null ? null : integer(blockSource.blockSizeEvents, `${label}.blockBootstrap.blockSizeEvents`, 1);
  const meanDifferenceInterval = interval(blockSource.meanDifferenceInterval, `${label}.blockBootstrap.meanDifferenceInterval`);
  const centeredP = nullableProbability(blockSource.centeredTwoSidedPValue, `${label}.blockBootstrap.centeredTwoSidedPValue`);
  const rawPValue = nullableProbability(source.rawPValue, `${label}.rawPValue`);
  const adjustedQValue = nullableProbability(source.adjustedQValue, `${label}.adjustedQValue`);
  const passesDeclaredFdr = source.passesDeclaredFdr == null ? null : source.passesDeclaredFdr;
  if (passesDeclaredFdr != null && typeof passesDeclaredFdr !== "boolean") throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label}.passesDeclaredFdr must be boolean or null`);
  if (rawPValue !== centeredP) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} p-values do not reconcile`);

  const diagnosticSource = object(source.sampleDiagnostics, `${label}.sampleDiagnostics`);
  requireKeys(diagnosticSource, `${label}.sampleDiagnostics`, ["nominalMatchedPairs", "uniqueDecisionTimes", "maximumGreedyNonOverlappingOutcomeWindows", "observationsExcludedForMaximumNonOverlappingSet", "eventOrderAutocorrelationEffectiveSampleSize", "independenceClaimed"]);
  const nominalMatchedPairs = integer(diagnosticSource.nominalMatchedPairs, `${label}.sampleDiagnostics.nominalMatchedPairs`);
  const uniqueDecisionTimes = integer(diagnosticSource.uniqueDecisionTimes, `${label}.sampleDiagnostics.uniqueDecisionTimes`);
  const nonOverlapping = integer(diagnosticSource.maximumGreedyNonOverlappingOutcomeWindows, `${label}.sampleDiagnostics.maximumGreedyNonOverlappingOutcomeWindows`);
  const excludedForNonOverlap = integer(diagnosticSource.observationsExcludedForMaximumNonOverlappingSet, `${label}.sampleDiagnostics.observationsExcludedForMaximumNonOverlappingSet`);
  if (diagnosticSource.independenceClaimed !== false) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} cannot claim independent samples`);
  if (nominalMatchedPairs !== count || uniqueDecisionTimes > count || nonOverlapping + excludedForNonOverlap !== count) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} sample diagnostics do not reconcile`);
  }
  const effectiveSource = object(diagnosticSource.eventOrderAutocorrelationEffectiveSampleSize, `${label}.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize`);
  requireKeys(effectiveSource, `${label}.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize`, ["estimate", "positiveAutocorrelationLagsUsed", "maxLags"]);
  const estimate = finite(effectiveSource.estimate, `${label}.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize.estimate`);
  const lags = integer(effectiveSource.positiveAutocorrelationLagsUsed, `${label}.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize.positiveAutocorrelationLagsUsed`);
  const maxLags = integer(effectiveSource.maxLags, `${label}.sampleDiagnostics.eventOrderAutocorrelationEffectiveSampleSize.maxLags`);
  if (estimate < 0 || estimate > count || lags > maxLags) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} effective sample diagnostics are invalid`);

  const tested = status === "tested";
  if (tested && count < 2) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} tested status disagrees with its sample`);
  if (!tested && (adjustedQValue != null || passesDeclaredFdr != null)) throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} untested hypothesis cannot have adjusted inference`);
  if (adjustedQValue != null && passesDeclaredFdr !== (adjustedQValue <= alpha)) {
    throw new Error(`INVALID_STATISTICAL_EVIDENCE: ${label} FDR status disagrees with declared alpha`);
  }

  const stabilitySource = object(source.stability, `${label}.stability`);
  requireKeys(stabilitySource, `${label}.stability`, ["yearUtc", "regime"]);
  return {
    hypothesisId,
    module,
    eventType,
    horizonBars,
    metric: metric as StatisticalMetric,
    status: status as StatisticalHypothesisStatus,
    nullBaseline: nonBlank(source.nullBaseline, `${label}.nullBaseline`),
    effectSize: effect,
    blockBootstrap: { samples: blockSamples, blockSizeEvents: blockSize, meanDifferenceInterval, centeredTwoSidedPValue: centeredP },
    rawPValue,
    adjustedQValue,
    passesDeclaredFdr: passesDeclaredFdr as boolean | null,
    sampleDiagnostics: {
      nominalMatchedPairs,
      uniqueDecisionTimes,
      maximumGreedyNonOverlappingOutcomeWindows: nonOverlapping,
      observationsExcludedForMaximumNonOverlappingSet: excludedForNonOverlap,
      eventOrderAutocorrelationEffectiveSampleSize: { estimate, positiveAutocorrelationLagsUsed: lags, maxLags },
      independenceClaimed: false,
    },
    stability: {
      yearUtc: stability(stabilitySource.yearUtc, `${label}.stability.yearUtc`, count),
      regime: stability(stabilitySource.regime, `${label}.stability.regime`, count),
    },
  };
}

export function classifyStatisticalHypothesis(value: StatisticalHypothesis, alpha: number): StatisticalDisplayStatus {
  if (value.effectSize.count === 0) return "no_sample";
  if (value.status !== "tested") return "insufficient";
  const interval = value.blockBootstrap.meanDifferenceInterval;
  if (value.adjustedQValue == null || value.passesDeclaredFdr == null || interval == null) return "insufficient";
  const excludesZero = interval.lower > 0 || interval.upper < 0;
  return value.passesDeclaredFdr && value.adjustedQValue <= alpha && excludesZero ? "difference_detected" : "inconclusive";
}

export function parseTechnicalStatisticalEvidence(value: unknown): TechnicalStatisticalEvidence {
  const source = object(value, "statisticalEvidence");
  requireKeys(source, "statisticalEvidence", ["schema", "specSha256", "scope", "claimType", "declaredFamily", "nullBaseline", "dependence", "multipleTesting", "sampleDiagnosticsDefinition", "stabilityDefinition", "sensitivityGrid", "retentionPolicy", "hypotheses"]);
  if (source.schema !== TECHNICAL_STATISTICAL_EVIDENCE_SCHEMA) throw new Error("INVALID_STATISTICAL_EVIDENCE: unsupported schema");
  const scope = object(source.scope, "statisticalEvidence.scope");
  requireKeys(scope, "statisticalEvidence.scope", ["symbol", "timeframe"]);
  if (scope.symbol !== "BTCUSDT" || !["1h", "4h", "1d"].includes(String(scope.timeframe))) {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: scope must be BTCUSDT on 1h/4h/1d");
  }
  if (source.claimType !== "descriptive_only") throw new Error("INVALID_STATISTICAL_EVIDENCE: only descriptive evidence is allowed");
  const family = object(source.declaredFamily, "statisticalEvidence.declaredFamily");
  requireKeys(family, "statisticalEvidence.declaredFamily", ["technicalModuleContractDefinitionsSha256", "moduleEventTypes", "moduleEventTypeIdentityCount", "cartesianHypothesisCount", "unknownObservedIdentityPolicy", "zeroEventPolicy"]);
  const moduleEventTypesSource = object(family.moduleEventTypes, "statisticalEvidence.declaredFamily.moduleEventTypes");
  const moduleEventTypes = Object.fromEntries(Object.entries(moduleEventTypesSource).map(([module, raw]) => {
    if (!module.trim()) throw new Error("INVALID_STATISTICAL_EVIDENCE: declared family contains an empty module");
    const eventTypes = strings(raw, `statisticalEvidence.declaredFamily.moduleEventTypes.${module}`);
    if (eventTypes.length === 0) throw new Error("INVALID_STATISTICAL_EVIDENCE: declared family modules must contain event types");
    return [module, eventTypes];
  }));
  const identityCount = integer(family.moduleEventTypeIdentityCount, "statisticalEvidence.declaredFamily.moduleEventTypeIdentityCount", 1);
  if (Object.values(moduleEventTypes).reduce((sum, values) => sum + values.length, 0) !== identityCount) {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: declared family identity count does not reconcile");
  }
  const cartesianCount = integer(family.cartesianHypothesisCount, "statisticalEvidence.declaredFamily.cartesianHypothesisCount", 1);
  if (cartesianCount !== identityCount * 3 * STATISTICAL_METRICS.length) {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: declared family Cartesian count does not reconcile");
  }
  if (family.unknownObservedIdentityPolicy !== "fail_closed" || family.zeroEventPolicy !== "retain_with_null_inferential_values") {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: unsupported declared family policy");
  }
  const baseline = object(source.nullBaseline, "statisticalEvidence.nullBaseline");
  const dependence = object(source.dependence, "statisticalEvidence.dependence");
  const testing = object(source.multipleTesting, "statisticalEvidence.multipleTesting");
  requireKeys(testing, "statisticalEvidence.multipleTesting", ["method", "declaredQAlpha", "familySizeAllRetained", "testableFamilySize", "interpretation"]);
  if (testing.method !== "Benjamini-Yekutieli") throw new Error("INVALID_STATISTICAL_EVIDENCE: unsupported multiple-testing method");
  const alpha = probability(testing.declaredQAlpha, "statisticalEvidence.multipleTesting.declaredQAlpha");
  const configuredBlockSizeEvents = integer(dependence.configuredBlockSizeEvents, "statisticalEvidence.dependence.configuredBlockSizeEvents", 1);
  const bootstrapSamples = integer(dependence.bootstrapSamples, "statisticalEvidence.dependence.bootstrapSamples", 1);
  const diagnosticsDefinition = object(source.sampleDiagnosticsDefinition, "statisticalEvidence.sampleDiagnosticsDefinition");
  const stabilityDefinition = object(source.stabilityDefinition, "statisticalEvidence.stabilityDefinition");
  requireKeys(diagnosticsDefinition, "statisticalEvidence.sampleDiagnosticsDefinition", ["independenceClaimed"]);
  requireKeys(stabilityDefinition, "statisticalEvidence.stabilityDefinition", ["dimensions"]);
  if (diagnosticsDefinition.independenceClaimed !== false) throw new Error("INVALID_STATISTICAL_EVIDENCE: independence cannot be claimed");
  const sensitivity = object(source.sensitivityGrid, "statisticalEvidence.sensitivityGrid");
  requireKeys(sensitivity, "statisticalEvidence.sensitivityGrid", ["declaredGridSha256", "executedVariantIds", "allExecutedVariantsRetained", "outcomeDrivenSelectionAllowed"]);
  if (sensitivity.allExecutedVariantsRetained != null && typeof sensitivity.allExecutedVariantsRetained !== "boolean") throw new Error("INVALID_STATISTICAL_EVIDENCE: sensitivity retention must be boolean or null");
  if (sensitivity.outcomeDrivenSelectionAllowed !== false) throw new Error("INVALID_STATISTICAL_EVIDENCE: outcome-driven sensitivity selection is forbidden");
  if (!Array.isArray(source.hypotheses)) throw new Error("INVALID_STATISTICAL_EVIDENCE: hypotheses must be an array");
  const hypotheses = source.hypotheses.map((item, index) => hypothesis(item, index, alpha, bootstrapSamples));
  if (new Set(hypotheses.map((item) => item.hypothesisId)).size !== hypotheses.length) throw new Error("INVALID_STATISTICAL_EVIDENCE: hypothesis identities must be unique");
  const expectedHypotheses = new Set(Object.entries(moduleEventTypes).flatMap(([module, eventTypes]) =>
    eventTypes.flatMap((eventType) => [1, 3, 6].flatMap((horizon) =>
      STATISTICAL_METRICS.map((metric) => `${module}:${eventType}:${horizon}:${metric}`)))));
  if (expectedHypotheses.size !== cartesianCount || hypotheses.some((item) => !expectedHypotheses.has(item.hypothesisId))) {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: hypotheses disagree with the declared family");
  }
  const familySize = integer(testing.familySizeAllRetained, "statisticalEvidence.multipleTesting.familySizeAllRetained");
  const testableSize = integer(testing.testableFamilySize, "statisticalEvidence.multipleTesting.testableFamilySize");
  if (familySize !== cartesianCount || familySize !== hypotheses.length || testableSize !== hypotheses.filter((item) => item.status === "tested").length) {
    throw new Error("INVALID_STATISTICAL_EVIDENCE: multiple-testing family counts do not reconcile");
  }
  return {
    schema: TECHNICAL_STATISTICAL_EVIDENCE_SCHEMA,
    specSha256: sha256(source.specSha256, "statisticalEvidence.specSha256"),
    scope: { symbol: "BTCUSDT", timeframe: scope.timeframe as "1h" | "4h" | "1d" },
    claimType: "descriptive_only",
    declaredFamily: {
      technicalModuleContractDefinitionsSha256: sha256(family.technicalModuleContractDefinitionsSha256, "statisticalEvidence.declaredFamily.technicalModuleContractDefinitionsSha256"),
      moduleEventTypes,
      moduleEventTypeIdentityCount: identityCount,
      cartesianHypothesisCount: cartesianCount,
      unknownObservedIdentityPolicy: "fail_closed",
      zeroEventPolicy: "retain_with_null_inferential_values",
    },
    nullBaseline: {
      method: nonBlank(baseline.method, "statisticalEvidence.nullBaseline.method"),
      regimeKeys: strings(baseline.regimeKeys, "statisticalEvidence.nullBaseline.regimeKeys"),
      causality: nonBlank(baseline.causality, "statisticalEvidence.nullBaseline.causality"),
      limitation: nonBlank(baseline.limitation, "statisticalEvidence.nullBaseline.limitation"),
    },
    dependence: {
      intervalMethod: nonBlank(dependence.intervalMethod, "statisticalEvidence.dependence.intervalMethod"),
      blockLengthSource: nonBlank(dependence.blockLengthSource, "statisticalEvidence.dependence.blockLengthSource"),
      nullPValue: nonBlank(dependence.nullPValue, "statisticalEvidence.dependence.nullPValue"),
      assumptions: strings(dependence.assumptions, "statisticalEvidence.dependence.assumptions"),
      configuredBlockSizeEvents,
      bootstrapSamples,
      randomSeed: integer(dependence.randomSeed, "statisticalEvidence.dependence.randomSeed"),
    },
    multipleTesting: {
      method: "Benjamini-Yekutieli",
      target: nonBlank(testing.target, "statisticalEvidence.multipleTesting.target"),
      declaredQAlpha: alpha,
      dependenceAssumption: nonBlank(testing.dependenceAssumption, "statisticalEvidence.multipleTesting.dependenceAssumption"),
      interpretation: nonBlank(testing.interpretation, "statisticalEvidence.multipleTesting.interpretation"),
      familySizeAllRetained: familySize,
      testableFamilySize: testableSize,
    },
    sampleDiagnosticsDefinition: {
      reported: optionalStrings(diagnosticsDefinition.reported, "statisticalEvidence.sampleDiagnosticsDefinition.reported"),
      independenceClaimed: false,
    },
    stabilityDefinition: {
      dimensions: strings(stabilityDefinition.dimensions, "statisticalEvidence.stabilityDefinition.dimensions"),
      statistics: optionalStrings(stabilityDefinition.statistics, "statisticalEvidence.stabilityDefinition.statistics"),
      selection: stabilityDefinition.selection == null ? null : nonBlank(stabilityDefinition.selection, "statisticalEvidence.stabilityDefinition.selection"),
    },
    sensitivityGrid: {
      declaredGridSha256: sensitivity.declaredGridSha256 == null ? null : sha256(sensitivity.declaredGridSha256, "statisticalEvidence.sensitivityGrid.declaredGridSha256"),
      executedVariantIds: strings(sensitivity.executedVariantIds, "statisticalEvidence.sensitivityGrid.executedVariantIds"),
      allExecutedVariantsRetained: sensitivity.allExecutedVariantsRetained as boolean | null,
      outcomeDrivenSelectionAllowed: false,
    },
    retentionPolicy: nonBlank(source.retentionPolicy, "statisticalEvidence.retentionPolicy"),
    hypotheses,
  };
}
