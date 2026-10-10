import { parseTechnicalEvidenceProfiles, type TechnicalEvidenceProfiles } from "./evidenceProfiles.ts";
import { parseTechnicalSensitivityAudit, type TechnicalSensitivityAudit } from "./sensitivityAudit.ts";
import { parseTechnicalStatisticalEvidence, type TechnicalStatisticalEvidence } from "./statisticalEvidence.ts";

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
  intervalLow: number | null;
  intervalHigh: number | null;
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
};

export type EvidenceDataset = {
  snapshotSha256: string | null;
  source: string | null;
  rowCount: number | null;
  firstDecisionTimeMs: number | null;
  lastDecisionTimeMs: number | null;
};

export type EvidenceProtocol = {
  version: string | null;
  decisionTime: string | null;
  outcomePriceBasis: string | null;
  chronologicalOos: boolean | null;
  multipleTesting: string | null;
};

export type EvidenceCoverage = {
  evaluatedRows: number | null;
  eligibleRows: number | null;
  ratio: number | null;
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
};

export type ResearchEvidenceSummary = {
  id: string;
  title: string;
  kind: ResearchEvidenceKind;
  tier: ResearchEvidenceTier;
  available: boolean;
  status: "supported" | "inconclusive" | "unavailable" | "integrity-limited";
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
  pipeline: {
    state: "idle" | "running" | "succeeded" | "failed" | "stale" | "unavailable";
    integrityVerified: boolean;
    running: boolean;
    locked: boolean;
    lastStartedAtUtc: string | null;
    lastSucceededAtUtc: string | null;
    lastFailedAtUtc: string | null;
    lastError: string | null;
    updatedAtUtc: string | null;
    staleAfterUtc: string | null;
    timeframes: Array<{
      timeframe: "1h" | "4h" | "1d";
      cutoffMs: number;
      manifestSha256: string;
      stored: number;
      eligible: number;
      excluded: number;
      realizedAtMaxHorizon: number;
      definitionsSha256: string | null;
      semanticVerification: boolean;
    }>;
  } | null;
};

export type ResearchEvidenceDetail = ResearchEvidenceSummary & {
  hypothesis: string | null;
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
  evidenceProfiles: TechnicalEvidenceProfiles | null;
  statisticalEvidence: TechnicalStatisticalEvidence | null;
  sensitivityAudit: TechnicalSensitivityAudit | null;
  reportExclusions: Record<string, unknown> | null;
  eventTypeDetail: Record<string, unknown> | null;
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
  const explicit = optionalString(source, "kind")?.toLowerCase();
  return explicit && KINDS.has(explicit) ? (explicit as ResearchEvidenceKind) : "model";
}

function inferTier(source: Record<string, unknown>): ResearchEvidenceTier {
  const explicit = optionalString(source, "evidenceTier")?.toLowerCase();
  return explicit && TIERS.has(explicit) ? (explicit as ResearchEvidenceTier) : "descriptive";
}

function parseSummary(value: unknown): ResearchEvidenceSummary {
  const source = record(value, "evidence summary");
  const symbol = optionalString(source, "symbol") ?? "BTCUSDT";
  if (symbol !== "BTCUSDT") throw new Error("INVALID_API_RESPONSE: research evidence must be BTCUSDT");
  const statusValue = requiredString(source, "evidence status", "status").toLowerCase();
  if (!new Set(["supported", "inconclusive", "unavailable", "integrity-limited"]).has(statusValue)) {
    throw new Error(`INVALID_API_RESPONSE: unknown evidence status ${statusValue}`);
  }
  const status = statusValue as ResearchEvidenceSummary["status"];
  const available = status !== "unavailable";
  const integrityRaw = valueAt(source, "integrity");
  const integrity = integrityRaw == null ? null : record(integrityRaw, "evidence integrity");
  const integrityVerified = (integrity ? optionalBoolean(integrity, "verified") : null) ?? false;
  if (available && !integrityVerified && status !== "integrity-limited") {
    throw new Error("INVALID_API_RESPONSE: available evidence must have verified integrity");
  }
  const reportSha256 = optionalString(source, "reportSha256");
  const manifestSha256 = optionalString(source, "manifestSha256");
  if (integrityVerified && (!reportSha256 || !manifestSha256)) {
    throw new Error("INVALID_API_RESPONSE: verified evidence must expose report and manifest hashes");
  }
  const id = requiredString(source, "evidence id", "id");
  requireSha256(id, "evidence id");
  requireSha256(reportSha256, "reportSha256");
  requireSha256(manifestSha256, "manifestSha256");
  return {
    id,
    title: requiredString(source, "evidence title", "title"),
    kind: inferKind(source),
    tier: inferTier(source),
    available,
    status,
    integrityVerified,
    symbol: "BTCUSDT",
    timeframe: optionalString(source, "timeframe"),
    summary: optionalString(source, "summary") ?? "Chưa có tóm tắt kết luận.",
    limitations: strings(valueAt(source, "limitations"), "limitations"),
    generatedAtUtc: optionalString(source, "createdAtUtc"),
    reportSha256,
    manifestSha256,
  };
}

function parseMetric(value: unknown): EvidenceMetric {
  const source = record(value, "metric");
  return {
    name: requiredString(source, "metric name", "name"),
    label: optionalString(source, "label") ?? requiredString(source, "metric name", "name"),
    value: optionalNumber(source, "value"),
    unit: optionalString(source, "unit"),
    intervalLow: null,
    intervalHigh: null,
    baseline: optionalString(source, "baseline"),
    interpretation: optionalString(source, "interpretation"),
  };
}

function parseMetrics(value: unknown, label: string): EvidenceMetric[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`INVALID_API_RESPONSE: ${label} must be an array`);
  return value.map(parseMetric);
}

export function parseResearchEvidenceCatalog(value: unknown): ResearchEvidenceCatalog {
  const source = record(value, "research evidence catalog");
  if (requiredString(source, "evidence symbol", "symbol") !== "BTCUSDT") {
    throw new Error("INVALID_API_RESPONSE: research evidence catalog must be BTCUSDT");
  }
  const integrity = record(valueAt(source, "integrity"), "evidence catalog integrity");
  const rawItems = valueAt(source, "items");
  if (!Array.isArray(rawItems)) throw new Error("INVALID_API_RESPONSE: evidence catalog items must be an array");
  const items = rawItems.map(parseSummary);
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error("INVALID_API_RESPONSE: duplicate research evidence id");
  }
  const pipelineRaw = valueAt(source, "pipeline");
  const pipeline = pipelineRaw == null ? null : record(pipelineRaw, "evidence pipeline");
  const pipelineState = pipeline ? requiredString(pipeline, "evidence pipeline state", "state") : null;
  if (pipelineState != null && !new Set(["idle", "running", "succeeded", "failed", "stale", "unavailable"]).has(pipelineState)) {
    throw new Error(`INVALID_API_RESPONSE: unknown evidence pipeline state ${pipelineState}`);
  }
  const pipelineRows = pipeline ? objectRows(valueAt(pipeline, "timeframes"), "evidence pipeline timeframes") : [];
  const parsedPipelineRows = pipelineRows.map((item, index) => {
    const timeframe = requiredString(item, `evidence pipeline timeframes[${index}].timeframe`, "timeframe");
    if (!new Set(["1h", "4h", "1d"]).has(timeframe)) throw new Error("INVALID_API_RESPONSE: evidence pipeline timeframe is inactive");
    const cutoffMs = requiredNonNegativeInteger(item, "cutoffMs");
    const stored = requiredNonNegativeInteger(item, "stored");
    const eligible = requiredNonNegativeInteger(item, "eligible");
    const excluded = requiredNonNegativeInteger(item, "excluded");
    const realizedAtMaxHorizon = requiredNonNegativeInteger(item, "realizedAtMaxHorizon");
    if (cutoffMs <= 0 || eligible + excluded !== stored || realizedAtMaxHorizon > eligible) {
      throw new Error("INVALID_API_RESPONSE: evidence pipeline coverage counts are inconsistent");
    }
    if (typeof item.semanticVerification !== "boolean") throw new Error("INVALID_API_RESPONSE: evidence pipeline semanticVerification must be boolean");
    return {
      timeframe: timeframe as "1h" | "4h" | "1d",
      cutoffMs,
      manifestSha256: requireSha256(requiredString(item, "evidence pipeline manifestSha256", "manifestSha256"), "manifestSha256")!,
      stored,
      eligible,
      excluded,
      realizedAtMaxHorizon,
      definitionsSha256: requireSha256(optionalString(item, "definitionsSha256"), "definitionsSha256"),
      semanticVerification: item.semanticVerification,
    };
  });
  if (new Set(parsedPipelineRows.map((item) => item.timeframe)).size !== parsedPipelineRows.length) {
    throw new Error("INVALID_API_RESPONSE: duplicate evidence pipeline timeframe");
  }
  if (pipeline && (typeof pipeline.integrityVerified !== "boolean" || typeof pipeline.running !== "boolean" || typeof pipeline.locked !== "boolean")) {
    throw new Error("INVALID_API_RESPONSE: evidence pipeline state flags must be boolean");
  }
  if (pipeline && (!pipeline.integrityVerified || pipelineState === "stale" || pipelineState === "unavailable") && parsedPipelineRows.length > 0) {
    throw new Error("INVALID_API_RESPONSE: unverified or stale evidence pipeline cannot publish timeframe coverage");
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
    pipeline: pipeline ? {
      state: pipelineState as NonNullable<ResearchEvidenceCatalog["pipeline"]>["state"],
      integrityVerified: pipeline.integrityVerified as boolean,
      running: pipeline.running as boolean,
      locked: pipeline.locked as boolean,
      lastStartedAtUtc: optionalString(pipeline, "lastStartedAtUtc"),
      lastSucceededAtUtc: optionalString(pipeline, "lastSucceededAtUtc"),
      lastFailedAtUtc: optionalString(pipeline, "lastFailedAtUtc"),
      lastError: optionalString(pipeline, "lastError"),
      updatedAtUtc: optionalString(pipeline, "updatedAtUtc"),
      staleAfterUtc: optionalString(pipeline, "staleAfterUtc"),
      timeframes: parsedPipelineRows,
    } : null,
  };
}

export function parseResearchEvidenceDetail(value: unknown): ResearchEvidenceDetail {
  const source = record(value, "research evidence detail");
  const summary = parseSummary(source);
  const datasetRaw = valueAt(source, "dataset");
  const dataset = datasetRaw == null ? null : record(datasetRaw, "evidence dataset");
  const protocolRaw = valueAt(source, "protocol");
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
  const evidenceProfilesRaw = valueAt(source, "evidenceProfiles");
  const statisticalEvidenceRaw = valueAt(source, "statisticalEvidence");
  const sensitivityAuditRaw = valueAt(source, "sensitivityAudit");
  const reportExclusionsRaw = valueAt(source, "reportExclusions");
  const eventTypeDetailRaw = valueAt(source, "eventTypeDetail");
  const metrics = parseMetrics(valueAt(source, "metrics"), "metrics").map((metric) => {
    const interval = uncertaintyRows.find((item) => optionalString(item, "name") === metric.name);
    return interval ? {
      ...metric,
      intervalLow: optionalNumber(interval, "lower"),
      intervalHigh: optionalNumber(interval, "upper"),
    } : metric;
  });
  const datasetSnapshotSha256 = dataset
    ? requireSha256(optionalString(dataset, "datasetSha256"), "datasetSha256")
    : null;
  return {
    ...summary,
    hypothesis: optionalString(source, "hypothesis"),
    conclusion: optionalString(source, "conclusion"),
    dataset: dataset ? {
      snapshotSha256: datasetSnapshotSha256,
      source: optionalString(dataset, "source"),
      rowCount: optionalNumber(dataset, "rowCount"),
      firstDecisionTimeMs: optionalNumber(dataset, "firstDecisionTimeMs"),
      lastDecisionTimeMs: optionalNumber(dataset, "lastDecisionTimeMs"),
    } : null,
    protocol: protocol ? {
      version: optionalString(protocol, "evaluatorVersion"),
      decisionTime: optionalString(protocol, "decisionTime"),
      outcomePriceBasis: optionalString(protocol, "outcomePriceBasis"),
      chronologicalOos: optionalBoolean(protocol, "chronologicalOos"),
      multipleTesting: optionalString(protocol, "multipleTesting"),
    } : null,
    baselines: (baselinesRaw as unknown[] | null ?? []).map((item) => {
      const baseline = record(item, "baseline");
      const id = requiredString(baseline, "baseline id", "id");
      return { id, name: id, description: optionalString(baseline, "description") };
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
      ratio: optionalNumber(coverage, "ratio"),
      foldCount: optionalNumber(coverage, "foldCount"),
    } : null,
    provenance: {
      reportSha256: summary.reportSha256,
      manifestSha256: summary.manifestSha256,
      evaluatorSha256: requireSha256(optionalString(provenance, "evaluatorSha256"), "evaluatorSha256"),
      researchContractSha256: requireSha256(optionalString(provenance, "researchContractSha256"), "researchContractSha256"),
      codeVersion: optionalString(provenance, "gitCommit"),
      gitDirty: optionalBoolean(provenance, "gitDirty"),
      generatedAtUtc: summary.generatedAtUtc,
    },
    evidenceProfiles: evidenceProfilesRaw == null ? null : parseTechnicalEvidenceProfiles(evidenceProfilesRaw),
    statisticalEvidence: statisticalEvidenceRaw == null ? null : parseTechnicalStatisticalEvidence(statisticalEvidenceRaw),
    sensitivityAudit: sensitivityAuditRaw == null ? null : parseTechnicalSensitivityAudit(sensitivityAuditRaw),
    reportExclusions: reportExclusionsRaw == null ? null : record(reportExclusionsRaw, "report exclusion reasons"),
    eventTypeDetail: eventTypeDetailRaw == null ? null : record(eventTypeDetailRaw, "event type detail"),
  };
}

export function evidenceSectionLabel(kind: ResearchEvidenceKind): string {
  return ({ model: "Mô hình", feature: "Feature", event: "Sự kiện", economic: "Kinh tế", forward: "Forward" })[kind];
}
