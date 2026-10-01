// Minimal reader for the report-level `sensitivityAudit` passthrough.
// The audit is descriptive-only output of the technical-event pipeline: per-variant
// causal counts and metric deltas vs the contract baseline. Missing or malformed
// keys degrade to null/empty instead of failing the whole evidence detail.

export type SensitivityAuditHorizonMetric = {
  variantMean: number | null;
  baselineMean: number | null;
  meanDeltaVsBaseline: number | null;
};

export type SensitivityAuditHorizon = {
  elapsedTimeMs: number | null;
  realized: number | null;
  metrics: Record<string, SensitivityAuditHorizonMetric>;
};

export type SensitivityAuditVariant = {
  module: string | null;
  variantId: string | null;
  parameters: Record<string, unknown> | null;
  stored: number | null;
  eligible: number | null;
  excluded: number | null;
  realizedAtMaxHorizon: number | null;
  exclusionReasons: Record<string, number>;
  overlapCandidatesExcluded: number | null;
  eligibleDecisionTimeJaccardVsBaseline: number | null;
  horizons: Record<string, SensitivityAuditHorizon>;
};

export type TechnicalSensitivityAudit = {
  method: string | null;
  resultSelection: boolean | null;
  promotionAllowed: boolean | null;
  variantCount: number | null;
  declaredGridSha256: string | null;
  executedVariantIds: string[];
  variants: SensitivityAuditVariant[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function numberMap(value: unknown): Record<string, number> {
  const source = asRecord(value);
  if (!source) return {};
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(source)) {
    const parsed = asNumber(item);
    if (parsed != null) result[key] = parsed;
  }
  return result;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseHorizon(value: unknown): SensitivityAuditHorizon | null {
  const source = asRecord(value);
  if (!source) return null;
  const metricsSource = asRecord(source.metrics);
  const metrics: Record<string, SensitivityAuditHorizonMetric> = {};
  if (metricsSource) {
    for (const [metric, raw] of Object.entries(metricsSource)) {
      const metricSource = asRecord(raw);
      if (!metricSource) continue;
      const variantSummary = asRecord(metricSource.variant);
      metrics[metric] = {
        variantMean: variantSummary ? asNumber(variantSummary.mean) : null,
        baselineMean: asNumber(metricSource.baselineMean),
        meanDeltaVsBaseline: asNumber(metricSource.meanDeltaVsBaseline),
      };
    }
  }
  return {
    elapsedTimeMs: asNumber(source.elapsedTimeMs),
    realized: asNumber(source.realized),
    metrics,
  };
}

function parseVariant(value: unknown): SensitivityAuditVariant | null {
  const source = asRecord(value);
  if (!source) return null;
  const horizonsSource = asRecord(source.horizons);
  const horizons: Record<string, SensitivityAuditHorizon> = {};
  if (horizonsSource) {
    for (const [key, raw] of Object.entries(horizonsSource)) {
      const horizon = parseHorizon(raw);
      if (horizon) horizons[key] = horizon;
    }
  }
  return {
    module: asString(source.module),
    variantId: asString(source.variantId),
    parameters: asRecord(source.parameters),
    stored: asNumber(source.stored),
    eligible: asNumber(source.eligible),
    excluded: asNumber(source.excluded),
    realizedAtMaxHorizon: asNumber(source.realizedAtMaxHorizon),
    exclusionReasons: numberMap(source.exclusionReasons),
    overlapCandidatesExcluded: asNumber(source.overlapCandidatesExcluded),
    eligibleDecisionTimeJaccardVsBaseline: asNumber(source.eligibleDecisionTimeJaccardVsBaseline),
    horizons,
  };
}

export function parseTechnicalSensitivityAudit(value: unknown): TechnicalSensitivityAudit {
  const source = asRecord(value);
  if (!source) throw new Error("INVALID_SENSITIVITY_AUDIT: sensitivityAudit must be an object");
  const grid = asRecord(source.preRegisteredGrid);
  return {
    method: asString(source.method),
    resultSelection: asBoolean(source.resultSelection),
    promotionAllowed: asBoolean(source.promotionAllowed),
    variantCount: asNumber(source.variantCount),
    declaredGridSha256: grid ? asString(grid.declaredGridSha256) : null,
    executedVariantIds: grid ? stringList(grid.executedVariantIds) : [],
    variants: Array.isArray(source.variants)
      ? source.variants.map(parseVariant).filter((item): item is SensitivityAuditVariant => item != null)
      : [],
  };
}
