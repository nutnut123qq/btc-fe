import type {
  CapabilityState,
  EvidenceTarget,
  OperationalStatus,
  TechnicalCapabilitiesResponse,
  TechnicalCapabilityItem,
} from "./types";

const OPERATIONAL_STATUSES = new Set<OperationalStatus>(["operational", "degraded", "unavailable"]);
const EVIDENCE_STAGES = new Set<CapabilityState>([
  "descriptive",
  "experimental",
  "validated",
  "forward-observed",
  "retired",
]);
const EVIDENCE_TARGETS = new Set<EvidenceTarget>([
  "data-integrity",
  "calculation-correctness",
  "predictive",
  "economic-simulation",
  "prospective-observation",
  "operational-delivery",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_API_RESPONSE: research capabilities ${key} must be a non-empty string`);
  }
  return value;
}

function parseItem(value: unknown, index: number): TechnicalCapabilityItem {
  if (!isRecord(value)) {
    throw new Error(`INVALID_API_RESPONSE: research capabilities item ${index} must be an object`);
  }
  const operationalStatus = requireString(value, "operationalStatus") as OperationalStatus;
  const evidenceStage = requireString(value, "evidenceStage") as CapabilityState;
  const evidenceTarget = requireString(value, "evidenceTarget") as EvidenceTarget;
  if (!OPERATIONAL_STATUSES.has(operationalStatus)) {
    throw new Error(`INVALID_API_RESPONSE: unknown operationalStatus ${operationalStatus}`);
  }
  if (!EVIDENCE_STAGES.has(evidenceStage)) {
    throw new Error(`INVALID_API_RESPONSE: unknown evidenceStage ${evidenceStage}`);
  }
  if (!EVIDENCE_TARGETS.has(evidenceTarget)) {
    throw new Error(`INVALID_API_RESPONSE: unknown evidenceTarget ${evidenceTarget}`);
  }
  return {
    id: requireString(value, "id"),
    name: requireString(value, "name"),
    category: requireString(value, "category"),
    operationalStatus,
    evidenceStage,
    evidenceTarget,
    intendedUse: requireString(value, "intendedUse"),
    limitation: requireString(value, "limitation"),
    endpoint: requireString(value, "endpoint"),
    version: requireString(value, "version"),
  };
}

export function parseTechnicalCapabilities(value: unknown): TechnicalCapabilitiesResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("INVALID_API_RESPONSE: research capabilities response is malformed");
  }
  const symbol = requireString(value, "symbol");
  if (symbol !== "BTCUSDT") {
    throw new Error(`INVALID_API_RESPONSE: unsupported research symbol ${symbol}`);
  }
  const items = value.items.map(parseItem);
  if (items.length === 0 || new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error("INVALID_API_RESPONSE: research capabilities require unique non-empty items");
  }
  return {
    contractVersion: requireString(value, "contractVersion"),
    symbol,
    generatedAtUtc: requireString(value, "generatedAtUtc"),
    items,
  };
}

export function countCapabilityStates(items: TechnicalCapabilityItem[]) {
  return {
    operational: items.filter((item) => item.operationalStatus === "operational").length,
    unavailable: items.filter((item) => item.operationalStatus === "unavailable").length,
    validated: items.filter((item) => item.evidenceStage === "validated").length,
    forwardObserved: items.filter((item) => item.evidenceStage === "forward-observed").length,
  };
}
