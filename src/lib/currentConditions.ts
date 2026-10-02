// Strict parser for the Đ1 backend envelope `GET /api/research/current-conditions`.
// Fail-closed like statisticalEvidence.ts: required keys must exist, documented
// invariants from the frozen contract are reconciled, and only fields the contract
// marks optional may be null or absent. All errors are descriptive and name fields.

const ERR = "INVALID_CURRENT_CONDITIONS";

export const CONDITION_KINDS = ["triggeredOnBar", "state", "activeZone", "operativeLeg"] as const;
export type CurrentConditionKind = (typeof CONDITION_KINDS)[number];

export const CONDITION_DIRECTIONS = ["bullish", "bearish", "neutral"] as const;
export type CurrentConditionDirection = (typeof CONDITION_DIRECTIONS)[number];

export const CONDITION_METRICS = ["forwardReturn", "mfe", "mae"] as const;
export type ConditionEvidenceMetric = (typeof CONDITION_METRICS)[number];

export const CONDITION_HORIZON_KEYS = ["1", "3", "6"] as const;
export type ConditionHorizonKey = (typeof CONDITION_HORIZON_KEYS)[number];
const CONDITION_HORIZON_NUMBERS = CONDITION_HORIZON_KEYS.map((key) => Number(key));

export type TestedEvidenceCell = {
  tested: true;
  rawP: number | null;
  adjustedQValue: number | null;
  passesDeclaredFdr: boolean | null;
  sufficientSample: boolean;
  nonOverlappingPairs: number;
  effect: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  meanPairedDifference: number | null;
};

export type UntestedEvidenceCell = { tested: false; reason: string };
export type ConditionEvidenceCell = TestedEvidenceCell | UntestedEvidenceCell;

/** A reported horizon always carries the full metric triple. */
export type ConditionHorizonEvidence = Record<ConditionEvidenceMetric, ConditionEvidenceCell>;

/**
 * Per-condition evidence map keyed by "1" | "3" | "6". A horizon key may be absent
 * when the backend did not report it; absent horizons render as "not reported",
 * never as a number.
 */
export type CurrentConditionEvidence = Partial<Record<ConditionHorizonKey, ConditionHorizonEvidence>>;

export type CurrentCondition = {
  module: string;
  eventType: string;
  kind: CurrentConditionKind;
  direction: CurrentConditionDirection;
  /** Contract: null for pure `state` conditions, non-blank string otherwise. */
  eventId: string | null;
  formedTimeMs: number;
  availableTimeMs: number;
  /** Present per contract but keys may be absent for pre-window events (e.g. an SMC zone whose decision candle predates the analysis window). */
  context: { trend: string | null; volatility: string | null };
  /** Contract-optional free-form details (e.g. FVG zone bounds, RSI value). */
  details: Record<string, unknown> | null;
  /** Backend-attached per-horizon evidence; null when the backend attached none. */
  evidence: CurrentConditionEvidence | null;
};

export type CurrentConditionsEvidence = {
  available: boolean;
  reason: string | null;
  runId: string | null;
  manifestSha256: string | null;
  specSha256: string | null;
  cutoffMs: number | null;
  evidenceAgeBars: number | null;
};

export type CurrentConditionsConflict = {
  horizon: number;
  metric: ConditionEvidenceMetric;
  bullish: string[];
  bearish: string[];
};

export type CurrentConditionsUnavailableModule = { module: string; reason: string };

export type CurrentConditionsResponse = {
  timeframe: "1h" | "4h" | "1d";
  asOfMs: number;
  conditions: CurrentCondition[];
  evidence: CurrentConditionsEvidence;
  conflicts: CurrentConditionsConflict[];
  warnings: string[];
  unavailableModules: CurrentConditionsUnavailableModule[];
  generatedAtMs: number;
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${ERR}: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireKeys(source: Record<string, unknown>, label: string, keys: readonly string[]): void {
  const missing = keys.filter((key) => !Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined);
  if (missing.length > 0) throw new Error(`${ERR}: ${label} is missing required field(s): ${missing.join(", ")}`);
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${ERR}: ${label} must be a non-empty string`);
  }
  return value;
}

function nullableNonBlank(value: unknown, label: string): string | null {
  return value == null ? null : nonBlank(value, label);
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${ERR}: ${label} must be an integer >= ${minimum}`);
  }
  return value;
}

function nullableInteger(value: unknown, label: string, minimum = 0): number | null {
  return value == null ? null : integer(value, label, minimum);
}

function nullableFinite(value: unknown, label: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${ERR}: ${label} must be finite or null`);
  }
  return value;
}

function nullableProbability(value: unknown, label: string): number | null {
  const parsed = nullableFinite(value, label);
  if (parsed != null && (parsed < 0 || parsed > 1)) throw new Error(`${ERR}: ${label} must be within [0, 1]`);
  return parsed;
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${ERR}: ${label} must be boolean`);
  return value;
}

function nullableBool(value: unknown, label: string): boolean | null {
  return value == null ? null : bool(value, label);
}

function nullableSha256(value: unknown, label: string): string | null {
  const parsed = nullableNonBlank(value, label);
  if (parsed != null && !/^[a-f0-9]{64}$/i.test(parsed)) throw new Error(`${ERR}: ${label} must be a SHA-256 digest or null`);
  return parsed;
}

function nonBlankStrings(value: unknown, label: string, minimum = 0): string[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an array`);
  const parsed = value.map((item, index) => nonBlank(item, `${label}[${index}]`));
  if (parsed.length < minimum) throw new Error(`${ERR}: ${label} must contain at least ${minimum} entr${minimum === 1 ? "y" : "ies"}`);
  if (new Set(parsed).size !== parsed.length) throw new Error(`${ERR}: ${label} contains duplicates`);
  return parsed;
}

function evidenceCell(value: unknown, label: string): ConditionEvidenceCell {
  const source = object(value, label);
  requireKeys(source, label, ["tested"]);
  const tested = source.tested;
  if (typeof tested !== "boolean") throw new Error(`${ERR}: ${label}.tested must be boolean`);
  if (!tested) {
    requireKeys(source, label, ["tested", "reason"]);
    return { tested: false, reason: nonBlank(source.reason, `${label}.reason`) };
  }
  requireKeys(source, label, ["tested", "rawP", "adjustedQValue", "passesDeclaredFdr", "sufficientSample", "nonOverlappingPairs", "effect", "ciLower", "ciUpper", "meanPairedDifference"]);
  const ciLower = nullableFinite(source.ciLower, `${label}.ciLower`);
  const ciUpper = nullableFinite(source.ciUpper, `${label}.ciUpper`);
  if (ciLower != null && ciUpper != null && ciLower > ciUpper) {
    throw new Error(`${ERR}: ${label} CI bounds are reversed`);
  }
  return {
    tested: true,
    rawP: nullableProbability(source.rawP, `${label}.rawP`),
    adjustedQValue: nullableProbability(source.adjustedQValue, `${label}.adjustedQValue`),
    passesDeclaredFdr: nullableBool(source.passesDeclaredFdr, `${label}.passesDeclaredFdr`),
    sufficientSample: bool(source.sufficientSample, `${label}.sufficientSample`),
    nonOverlappingPairs: integer(source.nonOverlappingPairs, `${label}.nonOverlappingPairs`),
    effect: nullableFinite(source.effect, `${label}.effect`),
    ciLower,
    ciUpper,
    meanPairedDifference: nullableFinite(source.meanPairedDifference, `${label}.meanPairedDifference`),
  };
}

function conditionEvidence(value: unknown, label: string): CurrentConditionEvidence | null {
  if (value == null) return null;
  const source = object(value, label);
  const parsed: CurrentConditionEvidence = {};
  for (const [horizon, raw] of Object.entries(source)) {
    if (!(CONDITION_HORIZON_KEYS as readonly string[]).includes(horizon)) {
      throw new Error(`${ERR}: ${label} has unsupported horizon key "${horizon}"`);
    }
    const horizonLabel = `${label}.${horizon}`;
    const horizonSource = object(raw, horizonLabel);
    requireKeys(horizonSource, horizonLabel, CONDITION_METRICS);
    parsed[horizon as ConditionHorizonKey] = {
      forwardReturn: evidenceCell(horizonSource.forwardReturn, `${horizonLabel}.forwardReturn`),
      mfe: evidenceCell(horizonSource.mfe, `${horizonLabel}.mfe`),
      mae: evidenceCell(horizonSource.mae, `${horizonLabel}.mae`),
    };
  }
  return parsed;
}

function condition(value: unknown, index: number, asOfMs: number): CurrentCondition {
  const label = `currentConditions.conditions[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["module", "eventType", "kind", "direction", "eventId", "formedTimeMs", "availableTimeMs", "context"]);
  const moduleName = nonBlank(source.module, `${label}.module`);
  const eventType = nonBlank(source.eventType, `${label}.eventType`);
  const kind = nonBlank(source.kind, `${label}.kind`);
  if (!(CONDITION_KINDS as readonly string[]).includes(kind)) throw new Error(`${ERR}: ${label}.kind is unsupported`);
  const direction = nonBlank(source.direction, `${label}.direction`);
  if (!(CONDITION_DIRECTIONS as readonly string[]).includes(direction)) throw new Error(`${ERR}: ${label}.direction is unsupported`);
  const formedTimeMs = integer(source.formedTimeMs, `${label}.formedTimeMs`);
  const availableTimeMs = integer(source.availableTimeMs, `${label}.availableTimeMs`);
  if (formedTimeMs > availableTimeMs) throw new Error(`${ERR}: ${label}.formedTimeMs must not be after availableTimeMs`);

  // Contract §1/§2 invariants: eventId is null exactly for pure state conditions;
  // triggeredOnBar and state conditions are anchored to the latest closed bar.
  const rawEventId = source.eventId;
  const isState = kind === "state";
  if (isState && rawEventId !== null) throw new Error(`${ERR}: ${label}.eventId must be null for state conditions`);
  if (!isState && (typeof rawEventId !== "string" || rawEventId.trim() === "")) {
    throw new Error(`${ERR}: ${label}.eventId must be a non-empty string for event conditions`);
  }
  const eventId = isState ? null : (rawEventId as string);
  if ((kind === "triggeredOnBar" || isState) && availableTimeMs !== asOfMs) {
    throw new Error(`${ERR}: ${label}.availableTimeMs must equal asOfMs for ${kind} conditions`);
  }
  if ((kind === "activeZone" || kind === "operativeLeg") && availableTimeMs > asOfMs) {
    throw new Error(`${ERR}: ${label}.availableTimeMs must not be after asOfMs for ${kind} conditions`);
  }

  const contextSource = object(source.context, `${label}.context`);
  const context = {
    trend: nullableNonBlank(contextSource.trend, `${label}.context.trend`),
    volatility: nullableNonBlank(contextSource.volatility, `${label}.context.volatility`),
  };
  const rawDetails = source.details;
  const details = rawDetails == null ? null : object(rawDetails, `${label}.details`);

  return {
    module: moduleName,
    eventType,
    kind: kind as CurrentConditionKind,
    direction: direction as CurrentConditionDirection,
    eventId,
    formedTimeMs,
    availableTimeMs,
    context,
    details,
    evidence: conditionEvidence(source.evidence, `${label}.evidence`),
  };
}

function evidenceSummary(value: unknown): CurrentConditionsEvidence {
  const source = object(value, "currentConditions.evidence");
  requireKeys(source, "currentConditions.evidence", ["available", "reason", "runId", "manifestSha256", "specSha256", "cutoffMs", "evidenceAgeBars"]);
  const available = bool(source.available, "currentConditions.evidence.available");
  const reason = nullableNonBlank(source.reason, "currentConditions.evidence.reason");
  const runId = nullableNonBlank(source.runId, "currentConditions.evidence.runId");
  const manifestSha256 = nullableSha256(source.manifestSha256, "currentConditions.evidence.manifestSha256");
  const specSha256 = nullableSha256(source.specSha256, "currentConditions.evidence.specSha256");
  const cutoffMs = nullableInteger(source.cutoffMs, "currentConditions.evidence.cutoffMs");
  const evidenceAgeBars = nullableInteger(source.evidenceAgeBars, "currentConditions.evidence.evidenceAgeBars");
  if (available) {
    if (reason != null) throw new Error(`${ERR}: available evidence cannot carry a reason`);
    if (runId == null || manifestSha256 == null || specSha256 == null || cutoffMs == null || evidenceAgeBars == null) {
      throw new Error(`${ERR}: available evidence must expose runId, manifestSha256, specSha256, cutoffMs and evidenceAgeBars`);
    }
  } else if (reason == null) {
    throw new Error(`${ERR}: unavailable evidence must declare a reason`);
  }
  return { available, reason, runId, manifestSha256, specSha256, cutoffMs, evidenceAgeBars };
}

function conflict(value: unknown, index: number): CurrentConditionsConflict {
  const label = `currentConditions.conflicts[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["horizon", "metric", "bullish", "bearish"]);
  const horizon = integer(source.horizon, `${label}.horizon`, 1);
  if (!CONDITION_HORIZON_NUMBERS.includes(horizon)) throw new Error(`${ERR}: ${label}.horizon is unsupported`);
  const metric = nonBlank(source.metric, `${label}.metric`);
  if (!(CONDITION_METRICS as readonly string[]).includes(metric)) throw new Error(`${ERR}: ${label}.metric is unsupported`);
  return {
    horizon,
    metric: metric as ConditionEvidenceMetric,
    bullish: nonBlankStrings(source.bullish, `${label}.bullish`, 1),
    bearish: nonBlankStrings(source.bearish, `${label}.bearish`, 1),
  };
}

function unavailableModule(value: unknown, index: number): CurrentConditionsUnavailableModule {
  const label = `currentConditions.unavailableModules[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["module", "reason"]);
  return {
    module: nonBlank(source.module, `${label}.module`),
    reason: nonBlank(source.reason, `${label}.reason`),
  };
}

export function parseCurrentConditionsResponse(value: unknown): CurrentConditionsResponse {
  const source = object(value, "currentConditions");
  requireKeys(source, "currentConditions", ["timeframe", "asOfMs", "conditions", "evidence", "conflicts", "warnings", "generatedAtMs"]);
  const timeframe = nonBlank(source.timeframe, "currentConditions.timeframe");
  if (timeframe !== "1h" && timeframe !== "4h" && timeframe !== "1d") {
    throw new Error(`${ERR}: currentConditions.timeframe must be 1h/4h/1d`);
  }
  const asOfMs = integer(source.asOfMs, "currentConditions.asOfMs");
  const generatedAtMs = integer(source.generatedAtMs, "currentConditions.generatedAtMs");
  if (!Array.isArray(source.conditions)) throw new Error(`${ERR}: currentConditions.conditions must be an array`);
  if (!Array.isArray(source.conflicts)) throw new Error(`${ERR}: currentConditions.conflicts must be an array`);
  if (!Array.isArray(source.warnings)) throw new Error(`${ERR}: currentConditions.warnings must be an array`);
  const conditions = source.conditions.map((item, index) => condition(item, index, asOfMs));
  const seen = new Set<string>();
  for (const item of conditions) {
    const identity = `${item.module}|${item.eventType}|${item.kind}|${item.eventId ?? "state"}`;
    if (seen.has(identity)) throw new Error(`${ERR}: duplicate condition identity ${item.module}:${item.eventType}:${item.kind}`);
    seen.add(identity);
  }
  const rawUnavailable = source.unavailableModules;
  if (rawUnavailable != null && !Array.isArray(rawUnavailable)) {
    throw new Error(`${ERR}: currentConditions.unavailableModules must be an array`);
  }
  return {
    timeframe,
    asOfMs,
    conditions,
    evidence: evidenceSummary(source.evidence),
    conflicts: source.conflicts.map(conflict),
    warnings: nonBlankStrings(source.warnings, "currentConditions.warnings"),
    unavailableModules: (rawUnavailable ?? []).map(unavailableModule),
    generatedAtMs,
  };
}
