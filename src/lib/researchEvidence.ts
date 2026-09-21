export const RESEARCH_EVIDENCE_KINDS = ["model", "feature", "event", "economic", "forward"] as const;

export type ResearchEvidenceKind = (typeof RESEARCH_EVIDENCE_KINDS)[number];

export type ResearchEvidenceTier =
  | "descriptive"
  | "predictive"
  | "validated-predictive"
  | "retrospective-selection-aware"
  | "economic-simulation"
  | "forward-observed"
  | "live"
  | "unavailable";

export type EvidenceMetric = {
  name: string;
  label: string;
  value: number | null;
  unit: string | null;
  baselineValue: number | null;
  lift: number | null;
  intervalLow: number | null;
  intervalHigh: number | null;
  sampleCount: number | null;
  baseline: string | null;
  interpretation: string | null;
};

export type EvidenceFinding = {
  id: string;
  label: string;
  status: string;
  metricName: string;
  value: number | null;
  lower: number | null;
  upper: number | null;
  sampleSize: number | null;
};

export type EvidenceBaseline = {
  id: string;
  name: string;
  description: string | null;
  metrics: EvidenceMetric[];
};

export type EvidenceDataset = {
  snapshotId: string | null;
  snapshotSha256: string | null;
  predictionsSha256: string | null;
  source: string | null;
  rowCount: number | null;
  predictionRowCount: number | null;
  featureCount: number | null;
  startTimeUtc: string | null;
  endTimeUtc: string | null;
  cutoffTimeUtc: string | null;
  firstDecisionTimeMs: number | null;
  lastDecisionTimeMs: number | null;
  immutable: boolean | null;
};

export type EvidenceProtocol = {
  name: string | null;
  version: string | null;
  foldCount: number | null;
  purgeBars: number | null;
  calibrationRows: number | null;
  testRows: number | null;
  notes: string[];
  decisionTime: string | null;
  outcomePriceBasis: string | null;
  chronologicalOos: boolean | null;
  multipleTesting: string | null;
};

export type EvidenceCoverage = {
  evaluatedRows: number | null;
  eligibleRows: number | null;
  ratio: number | null;
  abstentionRate: number | null;
  foldCount: number | null;
};

export type EvidenceUncertainty = {
  name: string;
  lower: number | null;
  upper: number | null;
  confidenceLevel: number | null;
  familywise: boolean | null;
};

export type EvidenceArtifact = {
  role: string;
  sha256: string;
  bytes: number;
  rowCount: number | null;
};

export type EvidenceProvenance = {
  reportSha256: string | null;
  manifestSha256: string | null;
  evaluatorSha256: string | null;
  researchContractSha256: string | null;
  codeVersion: string | null;
  gitDirty: boolean | null;
  generatedAtUtc: string | null;
  artifactPath: string | null;
};

export type ResearchEvidenceSummary = {
  id: string;
  title: string;
  kind: ResearchEvidenceKind;
  tier: ResearchEvidenceTier;
  available: boolean;
  status: "supported" | "inconclusive" | "unavailable" | "integrity-limited" | "available";
  integrityVerified: boolean;
  symbol: "BTCUSDT";
  timeframe: string | null;
  summary: string;
  limitations: string[];
  generatedAtUtc: string | null;
  reportSha256: string | null;
  manifestSha256: string | null;
};

export type ResearchEvidenceCatalog = {
  contractVersion: string;
  generatedAtUtc: string;
  integrity: {
    scannedArtifactCount: number;
    publishedArtifactCount: number;
    rejectedArtifactCount: number;
  };
  items: ResearchEvidenceSummary[];
};

export type ResearchEvidenceDetail = ResearchEvidenceSummary & {
  hypothesis: string | null;
  question: string | null;
  conclusion: string | null;
  dataset: EvidenceDataset | null;
  protocol: EvidenceProtocol | null;
  baselines: EvidenceBaseline[];
  metrics: EvidenceMetric[];
  findings: EvidenceFinding[];
  uncertainty: EvidenceUncertainty[];
  artifacts: EvidenceArtifact[];
  coverage: EvidenceCoverage | null;
  provenance: EvidenceProvenance;
  folds: Record<string, unknown>[];
  rows: Record<string, unknown>[];
  rawSections: Record<string, unknown>;
};

const KINDS = new Set<string>(RESEARCH_EVIDENCE_KINDS);
const TIERS = new Set<string>([
  "descriptive",
  "predictive",
  "validated-predictive",
  "retrospective-selection-aware",
  "economic-simulation",
  "forward-observed",
  "live",
  "unavailable",
]);

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function valueAt(source: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined) return source[key];
  }
  return undefined;
}

function requiredString(source: Record<string, unknown>, label: string, ...keys: string[]): string {
  const value = valueAt(source, ...keys);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`INVALID_API_RESPONSE: ${label} must be a non-empty string`);
  }
  return value;
}

function optionalString(source: Record<string, unknown>, ...keys: string[]): string | null {
  const value = valueAt(source, ...keys);
  if (value == null) return null;
  if (typeof value !== "string") throw new Error(`INVALID_API_RESPONSE: ${keys[0]} must be a string or null`);
  return value;
}

function optionalNumber(source: Record<string, unknown>, ...keys: string[]): number | null {
  const value = valueAt(source, ...keys);
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${keys[0]} must be a finite number or null`);
  }
  return value;
}

function optionalBoolean(source: Record<string, unknown>, ...keys: string[]): boolean | null {
  const value = valueAt(source, ...keys);
  if (value == null) return null;
  if (typeof value !== "boolean") throw new Error(`INVALID_API_RESPONSE: ${keys[0]} must be a boolean or null`);
  return value;
}

function requiredNonNegativeInteger(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`INVALID_API_RESPONSE: ${key} must be a non-negative integer`);
  }
  return value;
}

function strings(value: unknown, label: string): string[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`INVALID_API_RESPONSE: ${label} must be an array of strings`);
  }
  return value;
}

function objectRows(value: unknown, label: string): Record<string, unknown>[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`INVALID_API_RESPONSE: ${label} must be an array`);
  return value.map((item, index) => record(item, `${label}[${index}]`));
}

function requireSha256(value: string | null, label: string): string | null {
  if (value !== null && !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${label} must be a SHA-256 digest`);
  }
  return value;
}

function inferKind(source: Record<string, unknown>): ResearchEvidenceKind {
  const explicit = optionalString(source, "kind", "category", "evidenceKind")?.toLowerCase();
  if (explicit && KINDS.has(explicit)) return explicit as ResearchEvidenceKind;
  if (explicit === "ml-v2" || explicit === "model-evaluation") return "model";
  if (explicit === "feature-groups" || explicit === "feature-ablation") return "feature";
  if (explicit === "technical-events" || explicit === "technical-event") return "event";
  const id = optionalString(source, "id", "artifactId")?.toLowerCase() ?? "";
  if (id.includes("feature")) return "feature";
  if (id.includes("event") || id.includes("technical")) return "event";
  if (id.includes("economic") || id.includes("backtest")) return "economic";
  if (id.includes("forward") || id.includes("paper")) return "forward";
  return "model";
}

function inferTier(source: Record<string, unknown>): ResearchEvidenceTier {
  const explicit = optionalString(source, "tier", "evidenceTier", "stage")?.toLowerCase();
  if (explicit && TIERS.has(explicit)) return explicit as ResearchEvidenceTier;
  return optionalBoolean(source, "available") === false ? "unavailable" : "descriptive";
}

function parseSummary(value: unknown): ResearchEvidenceSummary {
  const source = record(value, "evidence summary");
  const symbol = optionalString(source, "symbol") ?? "BTCUSDT";
  if (symbol !== "BTCUSDT") throw new Error("INVALID_API_RESPONSE: research evidence must be BTCUSDT");
  const statusValue = optionalString(source, "status")?.toLowerCase() ?? "available";
  if (!new Set(["supported", "inconclusive", "unavailable", "integrity-limited", "available"]).has(statusValue)) {
    throw new Error(`INVALID_API_RESPONSE: unknown evidence status ${statusValue}`);
  }
  const status = statusValue as ResearchEvidenceSummary["status"];
  const available = optionalBoolean(source, "available") ?? status !== "unavailable";
  const integrityRaw = valueAt(source, "integrity");
  const integrity = integrityRaw == null ? null : record(integrityRaw, "evidence integrity");
  const integrityVerified = optionalBoolean(source, "integrityVerified", "integrityValid")
    ?? (integrity ? optionalBoolean(integrity, "verified") : null)
    ?? false;
  if (available && !integrityVerified && status !== "integrity-limited") {
    throw new Error("INVALID_API_RESPONSE: available evidence must have verified integrity");
  }
  const reportSha256 = optionalString(source, "reportSha256", "reportHash");
  const manifestSha256 = optionalString(source, "manifestSha256", "manifestHash");
  if (integrityVerified && (!reportSha256 || !manifestSha256)) {
    throw new Error("INVALID_API_RESPONSE: verified evidence must expose report and manifest hashes");
  }
  const id = requiredString(source, "evidence id", "id", "artifactId");
  requireSha256(id, "evidence id");
  requireSha256(reportSha256, "reportSha256");
  requireSha256(manifestSha256, "manifestSha256");
  return {
    id,
    title: requiredString(source, "evidence title", "title", "name"),
    kind: inferKind(source),
    tier: inferTier(source),
    available,
    status,
    integrityVerified,
    symbol: "BTCUSDT",
    timeframe: optionalString(source, "timeframe"),
    summary: optionalString(source, "summary", "conclusion") ?? "Chưa có tóm tắt kết luận.",
    limitations: strings(valueAt(source, "limitations", "caveats"), "limitations"),
    generatedAtUtc: optionalString(source, "generatedAtUtc", "createdAtUtc"),
    reportSha256,
    manifestSha256,
  };
}

function parseMetric(value: unknown): EvidenceMetric {
  const source = record(value, "metric");
  const interval = valueAt(source, "interval", "confidenceInterval");
  const intervalRecord = interval == null ? null : record(interval, "metric interval");
  return {
    name: requiredString(source, "metric name", "name", "metric"),
    label: optionalString(source, "label") ?? requiredString(source, "metric name", "name", "metric"),
    value: optionalNumber(source, "value"),
    unit: optionalString(source, "unit"),
    baselineValue: typeof valueAt(source, "baselineValue", "baseline") === "number"
      ? optionalNumber(source, "baselineValue", "baseline")
      : null,
    lift: optionalNumber(source, "lift"),
    intervalLow: optionalNumber(source, "intervalLow", "ciLow") ?? (intervalRecord ? optionalNumber(intervalRecord, "low") : null),
    intervalHigh: optionalNumber(source, "intervalHigh", "ciHigh") ?? (intervalRecord ? optionalNumber(intervalRecord, "high") : null),
    sampleCount: optionalNumber(source, "sampleCount", "n"),
    baseline: typeof valueAt(source, "baseline") === "string" ? optionalString(source, "baseline") : null,
    interpretation: optionalString(source, "interpretation"),
  };
}

function parseMetrics(value: unknown, label: string): EvidenceMetric[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(parseMetric);
  const source = record(value, label);
  return Object.entries(source)
    .filter(([, metricValue]) => typeof metricValue === "number" && Number.isFinite(metricValue))
    .map(([name, metricValue]) => ({
      name,
      label: name,
      value: metricValue as number,
      unit: null,
      baselineValue: null,
      lift: null,
      intervalLow: null,
      intervalHigh: null,
      sampleCount: null,
      baseline: null,
      interpretation: null,
    }));
}

export function parseResearchEvidenceCatalog(value: unknown): ResearchEvidenceCatalog {
  const source = record(value, "research evidence catalog");
  if (requiredString(source, "evidence symbol", "symbol") !== "BTCUSDT") {
    throw new Error("INVALID_API_RESPONSE: research evidence catalog must be BTCUSDT");
  }
  const integrity = record(valueAt(source, "integrity"), "evidence catalog integrity");
  const rawItems = valueAt(source, "items", "artifacts");
  if (!Array.isArray(rawItems)) throw new Error("INVALID_API_RESPONSE: evidence catalog items must be an array");
  const items = rawItems.map(parseSummary);
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error("INVALID_API_RESPONSE: duplicate research evidence id");
  }
  return {
    contractVersion: requiredString(source, "evidence contractVersion", "contractVersion"),
    generatedAtUtc: requiredString(source, "evidence generatedAtUtc", "generatedAtUtc"),
    integrity: {
      scannedArtifactCount: requiredNonNegativeInteger(integrity, "scannedArtifactCount"),
      publishedArtifactCount: requiredNonNegativeInteger(integrity, "publishedArtifactCount"),
      rejectedArtifactCount: requiredNonNegativeInteger(integrity, "rejectedArtifactCount"),
    },
    items,
  };
}

export function parseResearchEvidenceDetail(value: unknown): ResearchEvidenceDetail {
  const source = record(value, "research evidence detail");
  const summary = parseSummary(source);
  const datasetRaw = valueAt(source, "dataset", "dataSnapshot");
  const dataset = datasetRaw == null ? null : record(datasetRaw, "evidence dataset");
  const protocolRaw = valueAt(source, "protocol", "evaluationProtocol");
  const protocol = protocolRaw == null ? null : record(protocolRaw, "evidence protocol");
  const coverageRaw = valueAt(source, "coverage");
  const coverage = coverageRaw == null ? null : record(coverageRaw, "evidence coverage");
  const provenanceRaw = valueAt(source, "provenance");
  const provenance = provenanceRaw == null ? {} : record(provenanceRaw, "evidence provenance");
  const baselinesRaw = valueAt(source, "baselines");
  if (baselinesRaw != null && !Array.isArray(baselinesRaw)) {
    throw new Error("INVALID_API_RESPONSE: baselines must be an array");
  }
  const uncertaintyRaw = valueAt(source, "uncertainty");
  const uncertaintyRows = objectRows(uncertaintyRaw, "uncertainty");
  const artifactRows = objectRows(valueAt(source, "artifacts"), "artifacts");
  const findingRows = objectRows(valueAt(source, "findings"), "findings");
  const metrics = parseMetrics(valueAt(source, "metrics"), "metrics").map((metric) => {
    const interval = uncertaintyRows.find((item) => optionalString(item, "name") === metric.name);
    return interval ? {
      ...metric,
      intervalLow: optionalNumber(interval, "lower"),
      intervalHigh: optionalNumber(interval, "upper"),
    } : metric;
  });
  const datasetSnapshotSha256 = dataset
    ? requireSha256(optionalString(dataset, "snapshotSha256", "datasetSha256", "sha256"), "datasetSha256")
    : null;
  const datasetPredictionsSha256 = dataset
    ? requireSha256(optionalString(dataset, "predictionsSha256", "predictionSha256"), "predictionsSha256")
    : null;
  return {
    ...summary,
    hypothesis: optionalString(source, "hypothesis"),
    question: optionalString(source, "question", "researchQuestion"),
    conclusion: optionalString(source, "conclusion"),
    dataset: dataset ? {
      snapshotId: optionalString(dataset, "snapshotId", "id"),
      snapshotSha256: datasetSnapshotSha256,
      predictionsSha256: datasetPredictionsSha256,
      source: optionalString(dataset, "source"),
      rowCount: optionalNumber(dataset, "rowCount", "rows"),
      predictionRowCount: optionalNumber(dataset, "predictionRowCount", "predictionsCount"),
      featureCount: optionalNumber(dataset, "featureCount", "features"),
      startTimeUtc: optionalString(dataset, "startTimeUtc", "startUtc"),
      endTimeUtc: optionalString(dataset, "endTimeUtc", "endUtc"),
      cutoffTimeUtc: optionalString(dataset, "cutoffTimeUtc", "cutoffUtc"),
      firstDecisionTimeMs: optionalNumber(dataset, "firstDecisionTimeMs"),
      lastDecisionTimeMs: optionalNumber(dataset, "lastDecisionTimeMs"),
      immutable: optionalBoolean(dataset, "immutable"),
    } : null,
    protocol: protocol ? {
      name: optionalString(protocol, "name", "method"),
      version: optionalString(protocol, "version", "evaluatorVersion"),
      foldCount: optionalNumber(protocol, "foldCount", "folds"),
      purgeBars: optionalNumber(protocol, "purgeBars"),
      calibrationRows: optionalNumber(protocol, "calibrationRows"),
      testRows: optionalNumber(protocol, "testRows"),
      notes: strings(valueAt(protocol, "notes"), "protocol notes"),
      decisionTime: optionalString(protocol, "decisionTime"),
      outcomePriceBasis: optionalString(protocol, "outcomePriceBasis"),
      chronologicalOos: optionalBoolean(protocol, "chronologicalOos"),
      multipleTesting: optionalString(protocol, "multipleTesting"),
    } : null,
    baselines: (baselinesRaw as unknown[] | null ?? []).map((item) => {
      const baseline = record(item, "baseline");
      return {
        id: requiredString(baseline, "baseline id", "id", "name"),
        name: optionalString(baseline, "name") ?? requiredString(baseline, "baseline id", "id"),
        description: optionalString(baseline, "description"),
        metrics: parseMetrics(valueAt(baseline, "metrics"), "baseline metrics"),
      };
    }),
    metrics,
    findings: findingRows.map((item) => ({
      id: requiredString(item, "finding id", "id"),
      label: requiredString(item, "finding label", "label"),
      status: requiredString(item, "finding status", "status"),
      metricName: requiredString(item, "finding metricName", "metricName"),
      value: optionalNumber(item, "value"),
      lower: optionalNumber(item, "lower"),
      upper: optionalNumber(item, "upper"),
      sampleSize: optionalNumber(item, "sampleSize"),
    })),
    uncertainty: uncertaintyRows.map((item) => ({
      name: requiredString(item, "uncertainty name", "name"),
      lower: optionalNumber(item, "lower"),
      upper: optionalNumber(item, "upper"),
      confidenceLevel: optionalNumber(item, "confidenceLevel"),
      familywise: optionalBoolean(item, "familywise"),
    })),
    artifacts: artifactRows.map((item) => ({
      role: requiredString(item, "artifact role", "role"),
      sha256: requireSha256(requiredString(item, "artifact sha256", "sha256"), "artifact sha256")!,
      bytes: optionalNumber(item, "bytes") ?? 0,
      rowCount: optionalNumber(item, "rowCount"),
    })),
    coverage: coverage ? {
      evaluatedRows: optionalNumber(coverage, "evaluatedRows"),
      eligibleRows: optionalNumber(coverage, "eligibleRows"),
      ratio: optionalNumber(coverage, "ratio", "coverageRatio"),
      abstentionRate: optionalNumber(coverage, "abstentionRate"),
      foldCount: optionalNumber(coverage, "foldCount"),
    } : null,
    provenance: {
      reportSha256: optionalString(provenance, "reportSha256", "reportHash") ?? summary.reportSha256,
      manifestSha256: optionalString(provenance, "manifestSha256", "manifestHash") ?? summary.manifestSha256,
      evaluatorSha256: requireSha256(optionalString(provenance, "evaluatorSha256"), "evaluatorSha256"),
      researchContractSha256: requireSha256(optionalString(provenance, "researchContractSha256"), "researchContractSha256"),
      codeVersion: optionalString(provenance, "codeVersion", "gitCommit"),
      gitDirty: optionalBoolean(provenance, "gitDirty"),
      generatedAtUtc: optionalString(provenance, "generatedAtUtc") ?? summary.generatedAtUtc,
      artifactPath: optionalString(provenance, "artifactPath"),
    },
    folds: objectRows(valueAt(source, "folds"), "folds"),
    rows: objectRows(valueAt(source, "rows", "predictions"), "evidence rows"),
    rawSections: source,
  };
}

export function evidenceSectionLabel(kind: ResearchEvidenceKind): string {
  return ({ model: "Mô hình", feature: "Feature", event: "Sự kiện", economic: "Kinh tế", forward: "Forward" })[kind];
}
