import { ACTIVE_TIMEFRAMES, type ActiveTimeframe } from "./timeframe.ts";

export type KlineIssueEvidence = {
  detectionMethod: string;
  sourceClassification: string;
  authoritativeRepairSource: string;
  sourceAttemptCount: number;
  lastSourceAttemptAtUtc: string | null;
  nextSourceRetryAtUtc: string | null;
  detail: string | null;
};

export type KlineDataIssue = {
  issueKey: string;
  symbol: "BTCUSDT";
  timeframe: ActiveTimeframe;
  issueType: string;
  causeCode: string;
  resolutionState: string;
  startOpenTimeMs: number;
  endOpenTimeMs: number;
  affectedBars: number;
  expectedDurationMs: number;
  actualDurationMs: number | null;
  firstDetectedAtUtc: string | null;
  updatedAtUtc: string | null;
  repairable: boolean;
  evidence: KlineIssueEvidence;
  affectedDownstreamArtifacts: string[];
};

export type KlineRepairAudit = {
  id: number;
  planSha256: string;
  sourceEvidenceSha256: string;
  issueType: string;
  startOpenTimeMs: number;
  endOpenTimeMs: number;
  requestedBars: number;
  verifiedSourceBars: number;
  insertedBars: number;
  replacedBars: number;
  noopBars: number;
  unresolvedBars: number;
  sourceClassification: string;
  sourceCheckedAtUtc: string;
  appliedAtUtc: string;
};

export type KlineDataIssuesResponse = {
  taxonomyVersion: string;
  symbol: "BTCUSDT";
  timeframe: ActiveTimeframe;
  generatedAtUtc: string;
  auditEndOpenTimeMs: number;
  totalKnownIssues: number;
  truncated: boolean;
  issues: KlineDataIssue[];
  recentRepairs: KlineRepairAudit[];
  limitations: string[];
};

export type KlineDataRepairResponse = {
  taxonomyVersion: string;
  symbol: "BTCUSDT";
  timeframe: ActiveTimeframe;
  issueType: string;
  dryRun: boolean;
  applied: boolean;
  alreadyApplied: boolean;
  startOpenTimeMs: number;
  endOpenTimeMs: number;
  requestedBars: number;
  sourceRows: number;
  verifiedSourceBars: number;
  insertedBars: number;
  replacedBars: number;
  noopBars: number;
  unresolvedOpenTimeMs: number[];
  sourceClassification: string;
  sourceEndpoint: string;
  sourceCheckedAtUtc: string;
  sourceEvidenceSha256: string;
  planSha256: string;
  repairAuditId: number | null;
  derivedRebuildRequired: boolean;
  affectedDownstreamArtifacts: string[];
  limitations: string[];
};

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`INVALID_DATA_QUALITY: ${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireKeys(source: Record<string, unknown>, label: string, keys: readonly string[]): void {
  const missing = keys.filter((key) => !Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined);
  if (missing.length) throw new Error(`INVALID_DATA_QUALITY: ${label} is missing ${missing.join(", ")}`);
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`INVALID_DATA_QUALITY: ${label} must be non-empty`);
  return value;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) throw new Error(`INVALID_DATA_QUALITY: ${label} must be an integer >= ${minimum}`);
  return value;
}

function nullableInteger(value: unknown, label: string): number | null {
  return value == null ? null : integer(value, label);
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`INVALID_DATA_QUALITY: ${label} must be boolean`);
  return value;
}

function date(value: unknown, label: string): string {
  const parsed = text(value, label);
  if (!Number.isFinite(Date.parse(parsed))) throw new Error(`INVALID_DATA_QUALITY: ${label} must be an ISO timestamp`);
  return parsed;
}

function nullableDate(value: unknown, label: string): string | null {
  return value == null ? null : date(value, label);
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`INVALID_DATA_QUALITY: ${label} must be an array`);
  return value.map((item, index) => text(item, `${label}[${index}]`));
}

function sha(value: unknown, label: string): string {
  const parsed = text(value, label);
  if (!/^[a-f0-9]{64}$/i.test(parsed)) throw new Error(`INVALID_DATA_QUALITY: ${label} must be a SHA-256 digest`);
  return parsed;
}

function timeframe(value: unknown, label: string): ActiveTimeframe {
  if (typeof value !== "string" || !ACTIVE_TIMEFRAMES.includes(value as ActiveTimeframe)) throw new Error(`INVALID_DATA_QUALITY: ${label} is outside 1h/4h/1d`);
  return value as ActiveTimeframe;
}

function issue(value: unknown, index: number, expectedTimeframe: ActiveTimeframe): KlineDataIssue {
  const label = `dataQuality.issues[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["issueKey", "symbol", "timeframe", "issueType", "causeCode", "resolutionState", "startOpenTimeMs", "endOpenTimeMs", "affectedBars", "expectedDurationMs", "actualDurationMs", "firstDetectedAtUtc", "updatedAtUtc", "repairable", "evidence", "affectedDownstreamArtifacts"]);
  if (source.symbol !== "BTCUSDT" || timeframe(source.timeframe, `${label}.timeframe`) !== expectedTimeframe) throw new Error(`INVALID_DATA_QUALITY: ${label} scope mismatch`);
  const startOpenTimeMs = integer(source.startOpenTimeMs, `${label}.startOpenTimeMs`);
  const endOpenTimeMs = integer(source.endOpenTimeMs, `${label}.endOpenTimeMs`);
  if (startOpenTimeMs > endOpenTimeMs) throw new Error(`INVALID_DATA_QUALITY: ${label} has reversed boundaries`);
  const evidence = object(source.evidence, `${label}.evidence`);
  requireKeys(evidence, `${label}.evidence`, ["detectionMethod", "sourceClassification", "authoritativeRepairSource", "sourceAttemptCount", "lastSourceAttemptAtUtc", "nextSourceRetryAtUtc", "detail"]);
  return {
    issueKey: text(source.issueKey, `${label}.issueKey`),
    symbol: "BTCUSDT",
    timeframe: expectedTimeframe,
    issueType: text(source.issueType, `${label}.issueType`),
    causeCode: text(source.causeCode, `${label}.causeCode`),
    resolutionState: text(source.resolutionState, `${label}.resolutionState`),
    startOpenTimeMs,
    endOpenTimeMs,
    affectedBars: integer(source.affectedBars, `${label}.affectedBars`, 1),
    expectedDurationMs: integer(source.expectedDurationMs, `${label}.expectedDurationMs`, 1),
    actualDurationMs: nullableInteger(source.actualDurationMs, `${label}.actualDurationMs`),
    firstDetectedAtUtc: nullableDate(source.firstDetectedAtUtc, `${label}.firstDetectedAtUtc`),
    updatedAtUtc: nullableDate(source.updatedAtUtc, `${label}.updatedAtUtc`),
    repairable: bool(source.repairable, `${label}.repairable`),
    evidence: {
      detectionMethod: text(evidence.detectionMethod, `${label}.evidence.detectionMethod`),
      sourceClassification: text(evidence.sourceClassification, `${label}.evidence.sourceClassification`),
      authoritativeRepairSource: text(evidence.authoritativeRepairSource, `${label}.evidence.authoritativeRepairSource`),
      sourceAttemptCount: integer(evidence.sourceAttemptCount, `${label}.evidence.sourceAttemptCount`),
      lastSourceAttemptAtUtc: nullableDate(evidence.lastSourceAttemptAtUtc, `${label}.evidence.lastSourceAttemptAtUtc`),
      nextSourceRetryAtUtc: nullableDate(evidence.nextSourceRetryAtUtc, `${label}.evidence.nextSourceRetryAtUtc`),
      detail: evidence.detail == null ? null : text(evidence.detail, `${label}.evidence.detail`),
    },
    affectedDownstreamArtifacts: strings(source.affectedDownstreamArtifacts, `${label}.affectedDownstreamArtifacts`),
  };
}

function repairAudit(value: unknown, index: number): KlineRepairAudit {
  const label = `dataQuality.recentRepairs[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["id", "planSha256", "sourceEvidenceSha256", "issueType", "startOpenTimeMs", "endOpenTimeMs", "requestedBars", "verifiedSourceBars", "insertedBars", "replacedBars", "noopBars", "unresolvedBars", "sourceClassification", "sourceCheckedAtUtc", "appliedAtUtc"]);
  const startOpenTimeMs = integer(source.startOpenTimeMs, `${label}.startOpenTimeMs`);
  const endOpenTimeMs = integer(source.endOpenTimeMs, `${label}.endOpenTimeMs`);
  if (startOpenTimeMs > endOpenTimeMs) throw new Error(`INVALID_DATA_QUALITY: ${label} has reversed boundaries`);
  return { id: integer(source.id, `${label}.id`, 1), planSha256: sha(source.planSha256, `${label}.planSha256`), sourceEvidenceSha256: sha(source.sourceEvidenceSha256, `${label}.sourceEvidenceSha256`), issueType: text(source.issueType, `${label}.issueType`), startOpenTimeMs, endOpenTimeMs, requestedBars: integer(source.requestedBars, `${label}.requestedBars`), verifiedSourceBars: integer(source.verifiedSourceBars, `${label}.verifiedSourceBars`), insertedBars: integer(source.insertedBars, `${label}.insertedBars`), replacedBars: integer(source.replacedBars, `${label}.replacedBars`), noopBars: integer(source.noopBars, `${label}.noopBars`), unresolvedBars: integer(source.unresolvedBars, `${label}.unresolvedBars`), sourceClassification: text(source.sourceClassification, `${label}.sourceClassification`), sourceCheckedAtUtc: date(source.sourceCheckedAtUtc, `${label}.sourceCheckedAtUtc`), appliedAtUtc: date(source.appliedAtUtc, `${label}.appliedAtUtc`) };
}

export function parseKlineDataIssues(value: unknown): KlineDataIssuesResponse {
  const source = object(value, "dataQuality");
  requireKeys(source, "dataQuality", ["taxonomyVersion", "symbol", "timeframe", "generatedAtUtc", "auditEndOpenTimeMs", "totalKnownIssues", "truncated", "issues", "recentRepairs", "limitations"]);
  if (source.symbol !== "BTCUSDT") throw new Error("INVALID_DATA_QUALITY: only BTCUSDT is supported");
  const tf = timeframe(source.timeframe, "dataQuality.timeframe");
  if (!Array.isArray(source.issues) || !Array.isArray(source.recentRepairs)) throw new Error("INVALID_DATA_QUALITY: issues and recentRepairs must be arrays");
  const issues = source.issues.map((item, index) => issue(item, index, tf));
  if (new Set(issues.map((item) => item.issueKey)).size !== issues.length) throw new Error("INVALID_DATA_QUALITY: issue keys must be unique");
  const totalKnownIssues = integer(source.totalKnownIssues, "dataQuality.totalKnownIssues");
  const truncated = bool(source.truncated, "dataQuality.truncated");
  if ((!truncated && totalKnownIssues !== issues.length) || (truncated && totalKnownIssues < issues.length)) throw new Error("INVALID_DATA_QUALITY: issue totals do not reconcile");
  return { taxonomyVersion: text(source.taxonomyVersion, "dataQuality.taxonomyVersion"), symbol: "BTCUSDT", timeframe: tf, generatedAtUtc: date(source.generatedAtUtc, "dataQuality.generatedAtUtc"), auditEndOpenTimeMs: integer(source.auditEndOpenTimeMs, "dataQuality.auditEndOpenTimeMs"), totalKnownIssues, truncated, issues, recentRepairs: source.recentRepairs.map(repairAudit), limitations: strings(source.limitations, "dataQuality.limitations") };
}

export function parseKlineDataRepair(value: unknown): KlineDataRepairResponse {
  const source = object(value, "dataRepair");
  requireKeys(source, "dataRepair", ["taxonomyVersion", "symbol", "timeframe", "issueType", "dryRun", "applied", "alreadyApplied", "startOpenTimeMs", "endOpenTimeMs", "requestedBars", "sourceRows", "verifiedSourceBars", "insertedBars", "replacedBars", "noopBars", "unresolvedOpenTimeMs", "sourceClassification", "sourceEndpoint", "sourceCheckedAtUtc", "sourceEvidenceSha256", "planSha256", "repairAuditId", "derivedRebuildRequired", "affectedDownstreamArtifacts", "limitations"]);
  if (source.symbol !== "BTCUSDT") throw new Error("INVALID_DATA_QUALITY: repair scope must be BTCUSDT");
  const dryRun = bool(source.dryRun, "dataRepair.dryRun");
  const applied = bool(source.applied, "dataRepair.applied");
  const alreadyApplied = bool(source.alreadyApplied, "dataRepair.alreadyApplied");
  if (dryRun && (applied || alreadyApplied || source.repairAuditId != null)) throw new Error("INVALID_DATA_QUALITY: dry-run cannot claim an applied repair");
  if (!dryRun && !applied && !alreadyApplied) throw new Error("INVALID_DATA_QUALITY: apply response must report an applied or idempotent repair");
  const startOpenTimeMs = integer(source.startOpenTimeMs, "dataRepair.startOpenTimeMs");
  const endOpenTimeMs = integer(source.endOpenTimeMs, "dataRepair.endOpenTimeMs");
  if (startOpenTimeMs > endOpenTimeMs) throw new Error("INVALID_DATA_QUALITY: repair boundaries are reversed");
  if (!Array.isArray(source.unresolvedOpenTimeMs)) throw new Error("INVALID_DATA_QUALITY: unresolvedOpenTimeMs must be an array");
  const unresolvedOpenTimeMs = source.unresolvedOpenTimeMs.map((item, index) => integer(item, `dataRepair.unresolvedOpenTimeMs[${index}]`));
  if (unresolvedOpenTimeMs.some((item) => item < startOpenTimeMs || item > endOpenTimeMs)) throw new Error("INVALID_DATA_QUALITY: unresolved candle is outside repair boundaries");
  return { taxonomyVersion: text(source.taxonomyVersion, "dataRepair.taxonomyVersion"), symbol: "BTCUSDT", timeframe: timeframe(source.timeframe, "dataRepair.timeframe"), issueType: text(source.issueType, "dataRepair.issueType"), dryRun, applied, alreadyApplied, startOpenTimeMs, endOpenTimeMs, requestedBars: integer(source.requestedBars, "dataRepair.requestedBars"), sourceRows: integer(source.sourceRows, "dataRepair.sourceRows"), verifiedSourceBars: integer(source.verifiedSourceBars, "dataRepair.verifiedSourceBars"), insertedBars: integer(source.insertedBars, "dataRepair.insertedBars"), replacedBars: integer(source.replacedBars, "dataRepair.replacedBars"), noopBars: integer(source.noopBars, "dataRepair.noopBars"), unresolvedOpenTimeMs, sourceClassification: text(source.sourceClassification, "dataRepair.sourceClassification"), sourceEndpoint: text(source.sourceEndpoint, "dataRepair.sourceEndpoint"), sourceCheckedAtUtc: date(source.sourceCheckedAtUtc, "dataRepair.sourceCheckedAtUtc"), sourceEvidenceSha256: sha(source.sourceEvidenceSha256, "dataRepair.sourceEvidenceSha256"), planSha256: sha(source.planSha256, "dataRepair.planSha256"), repairAuditId: nullableInteger(source.repairAuditId, "dataRepair.repairAuditId"), derivedRebuildRequired: bool(source.derivedRebuildRequired, "dataRepair.derivedRebuildRequired"), affectedDownstreamArtifacts: strings(source.affectedDownstreamArtifacts, "dataRepair.affectedDownstreamArtifacts"), limitations: strings(source.limitations, "dataRepair.limitations") };
}

export type RepairPreviewBinding = {
  requestToken: number;
  issueKey: string;
  timeframe: ActiveTimeframe;
  issueType: string;
  startOpenTimeMs: number;
  endOpenTimeMs: number;
  planSha256: string;
};

export function previewMatchesIssue(binding: RepairPreviewBinding | null, issue: KlineDataIssue | null, timeframeValue: ActiveTimeframe): boolean {
  return binding != null && issue != null && binding.issueKey === issue.issueKey && binding.timeframe === timeframeValue && binding.issueType === issue.issueType && binding.startOpenTimeMs === issue.startOpenTimeMs && binding.endOpenTimeMs === issue.endOpenTimeMs;
}
