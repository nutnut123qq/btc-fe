// EQX-C2 — forecast journal (spec §8), LLM runs (§7, judge schema
// equity-llm-judge-v1), dossier as-of header (§7). Fail-closed parsers in the
// same posture as equity.ts: every ratio is a fraction (spec §11), LLM output is
// untrusted (only http/https links, sourceIds must resolve), and LLM numbers are
// never "validated".

import { barrierFraction, safeSourceUrl, type EquityBaseRates } from "./equity.ts";

const ERR = "INVALID_EQUITY_RESPONSE";

// --- primitives ---------------------------------------------------------------------

function object(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an object`);
  return value as Record<string, unknown>;
}

function requireKeys(source: Record<string, unknown>, label: string, keys: readonly string[]): void {
  const missing = keys.filter((key) => !Object.prototype.hasOwnProperty.call(source, key) || source[key] === undefined);
  if (missing.length > 0) throw new Error(`${ERR}: ${label} is missing required field(s): ${missing.join(", ")}`);
}

function nonBlank(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${ERR}: ${label} must be a non-empty string`);
  return value;
}

function nullableNonBlank(value: unknown, label: string): string | null {
  return value == null ? null : nonBlank(value, label);
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${ERR}: ${label} must be a finite number`);
  return value;
}

function nullableFinite(value: unknown, label: string): number | null {
  return value == null ? null : finite(value, label);
}

function count(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`${ERR}: ${label} must be an integer >= 0`);
  return value;
}

function probability(value: unknown, label: string): number | null {
  const parsed = nullableFinite(value, label);
  if (parsed != null && (parsed < 0 || parsed > 1)) throw new Error(`${ERR}: ${label} must be within [0, 1]`);
  return parsed;
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${ERR}: ${label} must be boolean`);
  return value;
}

function enumValue<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  const parsed = nonBlank(value, label);
  if (!(allowed as readonly string[]).includes(parsed)) throw new Error(`${ERR}: ${label} must be one of ${allowed.join("/")}; got "${parsed}"`);
  return parsed as T;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an array`);
  return value;
}

function stringArray(value: unknown, label: string): string[] {
  return array(value, label).map((item, index) => nonBlank(item, `${label}[${index}]`));
}

function requireSymbol(value: unknown, label: string, expected: string): string {
  const parsed = nonBlank(value, label);
  if (parsed !== expected) throw new Error(`${ERR}: ${label} must be "${expected}"; got "${parsed}"`);
  return parsed;
}

function pairProbabilities(pT: number | null, pS: number | null, label: string): void {
  if (pT != null && pS != null && pT + pS > 1 + 1e-9) throw new Error(`${ERR}: ${label} probTargetFirst + probStopFirst must be <= 1`);
}

// --- forecast journal (equity-forecast-journal-v1) --------------------------------------

export const FORECAST_JOURNAL_CONTRACT = "equity-forecast-journal-v1";
// session-research (EQX v2 §B): forecasts recorded from a research-session note — never validated.
export const FORECAST_SOURCES = ["quant-knn", "llm-judge", "session-research"] as const;
export type ForecastSource = (typeof FORECAST_SOURCES)[number];
export const OUTCOME_LABELS = ["target-first", "stop-first", "timeout"] as const;
export const SCORING_STATUSES = ["ok", "insufficient-sample", "no-data"] as const;

export interface ForecastOutcome {
  entryBarOpenTimeMs: number;
  entryPrice: number;
  label: (typeof OUTCOME_LABELS)[number];
  /** Fraction, net of fees/tax. */
  returnNet: number;
  resolvedBarOpenTimeMs: number;
  resolvedAtUtc: string;
}

export interface ForecastRecord {
  forecastId: string;
  source: ForecastSource;
  configId: string;
  targetPct: number;
  stopPct: number;
  horizonSessions: number;
  signalBarOpenTimeMs: number;
  availableTimeMs: number;
  createdAtUtc: string;
  probTargetFirst: number | null;
  probStopFirst: number | null;
  abstained: boolean;
  abstainReason: string | null;
  validated: boolean;
  methodVersion: string;
  modelId: string | null;
  promptVersion: string | null;
  llmRunId: string | null;
  /** null = pending ("chưa đáo hạn") — never inferred client-side. */
  outcome: ForecastOutcome | null;
}

export interface ForecastScoring {
  configId: string;
  status: (typeof SCORING_STATUSES)[number];
  pairedN: number;
  nEffective: number;
  brierQuant: number | null;
  brierLlm: number | null;
  brierDiff: number | null;
  coverageQuant: number | null;
  coverageLlm: number | null;
}

export interface ForecastJournal {
  contractVersion: string;
  symbol: string;
  items: ForecastRecord[];
  scoring: ForecastScoring[];
}

function idString(value: unknown, label: string): string {
  if (typeof value === "number" && Number.isSafeInteger(value)) return String(value);
  return nonBlank(value, label);
}

function forecastOutcome(value: unknown, label: string, signalBarOpenTimeMs: number): ForecastOutcome | null {
  if (value == null) return null;
  const source = object(value, label);
  requireKeys(source, label, ["entryBarOpenTimeMs", "entryPrice", "label", "returnNet", "resolvedBarOpenTimeMs", "resolvedAtUtc"]);
  const entryBarOpenTimeMs = finite(source.entryBarOpenTimeMs, `${label}.entryBarOpenTimeMs`);
  if (entryBarOpenTimeMs <= signalBarOpenTimeMs) throw new Error(`${ERR}: ${label}.entryBarOpenTimeMs must be after the signal bar`);
  const resolvedBarOpenTimeMs = finite(source.resolvedBarOpenTimeMs, `${label}.resolvedBarOpenTimeMs`);
  if (resolvedBarOpenTimeMs < entryBarOpenTimeMs) throw new Error(`${ERR}: ${label}.resolvedBarOpenTimeMs must not precede entry`);
  return {
    entryBarOpenTimeMs,
    entryPrice: finite(source.entryPrice, `${label}.entryPrice`),
    label: enumValue(source.label, `${label}.label`, OUTCOME_LABELS),
    returnNet: finite(source.returnNet, `${label}.returnNet`),
    resolvedBarOpenTimeMs,
    resolvedAtUtc: nonBlank(source.resolvedAtUtc, `${label}.resolvedAtUtc`),
  };
}

function forecastRecord(value: unknown, index: number): ForecastRecord {
  const label = `forecastJournal.items[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, [
    "forecastId", "source", "configId", "targetPct", "stopPct", "horizonSessions", "signalBarOpenTimeMs",
    "availableTimeMs", "createdAtUtc", "abstained", "validated", "methodVersion",
  ]);
  const kind = enumValue(source.source, `${label}.source`, FORECAST_SOURCES);
  const validated = bool(source.validated, `${label}.validated`);
  // Spec §8 CHECK: Source llm-judge / session-research ⇒ Validated=false. Never show one as validated.
  if (kind !== "quant-knn" && validated) throw new Error(`${ERR}: ${label} ${kind} forecasts are never validated`);
  const abstained = bool(source.abstained, `${label}.abstained`);
  const probTargetFirst = probability(source.probTargetFirst, `${label}.probTargetFirst`);
  const probStopFirst = probability(source.probStopFirst, `${label}.probStopFirst`);
  if (abstained && (probTargetFirst != null || probStopFirst != null)) throw new Error(`${ERR}: ${label} abstained forecasts carry no probabilities`);
  pairProbabilities(probTargetFirst, probStopFirst, label);
  const signalBarOpenTimeMs = finite(source.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`);
  const horizon = count(source.horizonSessions, `${label}.horizonSessions`);
  if (horizon < 1) throw new Error(`${ERR}: ${label}.horizonSessions must be >= 1`);
  return {
    forecastId: nonBlank(source.forecastId, `${label}.forecastId`),
    source: kind,
    configId: nonBlank(source.configId, `${label}.configId`),
    targetPct: barrierFraction(source.targetPct, `${label}.targetPct`),
    stopPct: barrierFraction(source.stopPct, `${label}.stopPct`),
    horizonSessions: horizon,
    signalBarOpenTimeMs,
    availableTimeMs: finite(source.availableTimeMs, `${label}.availableTimeMs`),
    createdAtUtc: nonBlank(source.createdAtUtc, `${label}.createdAtUtc`),
    probTargetFirst,
    probStopFirst,
    abstained,
    abstainReason: nullableNonBlank(source.abstainReason, `${label}.abstainReason`),
    validated,
    methodVersion: nonBlank(source.methodVersion, `${label}.methodVersion`),
    modelId: nullableNonBlank(source.modelId, `${label}.modelId`),
    promptVersion: nullableNonBlank(source.promptVersion, `${label}.promptVersion`),
    llmRunId: source.llmRunId == null ? null : idString(source.llmRunId, `${label}.llmRunId`),
    outcome: forecastOutcome(source.outcome, `${label}.outcome`, signalBarOpenTimeMs),
  };
}

function forecastScoring(value: unknown, index: number): ForecastScoring {
  const label = `forecastJournal.scoring[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["configId", "status", "pairedN", "nEffective"]);
  return {
    configId: nonBlank(source.configId, `${label}.configId`),
    status: enumValue(source.status, `${label}.status`, SCORING_STATUSES),
    pairedN: count(source.pairedN, `${label}.pairedN`),
    nEffective: count(source.nEffective, `${label}.nEffective`),
    brierQuant: nullableFinite(source.brierQuant, `${label}.brierQuant`),
    brierLlm: nullableFinite(source.brierLlm, `${label}.brierLlm`),
    brierDiff: nullableFinite(source.brierDiff, `${label}.brierDiff`),
    coverageQuant: probability(source.coverageQuant, `${label}.coverageQuant`),
    coverageLlm: probability(source.coverageLlm, `${label}.coverageLlm`),
  };
}

export function parseForecastJournal(value: unknown, symbol: string): ForecastJournal {
  const source = object(value, "forecastJournal");
  requireKeys(source, "forecastJournal", ["contractVersion", "symbol", "items"]);
  const contractVersion = nonBlank(source.contractVersion, "forecastJournal.contractVersion");
  if (contractVersion !== FORECAST_JOURNAL_CONTRACT) throw new Error(`${ERR}: forecastJournal.contractVersion must be "${FORECAST_JOURNAL_CONTRACT}"`);
  return {
    contractVersion,
    symbol: requireSymbol(source.symbol, "forecastJournal.symbol", symbol),
    items: array(source.items, "forecastJournal.items").map(forecastRecord),
    // Additive-tolerant: absent scoring degrades to "no scoring yet".
    scoring: source.scoring == null ? [] : array(source.scoring, "forecastJournal.scoring").map(forecastScoring),
  };
}

/** Scoring numbers are only a conclusion when status is ok (nEffective ≥ 30 per spec §8). */
export function scoringConclusive(scoring: ForecastScoring): boolean {
  return scoring.status === "ok" && scoring.brierDiff != null;
}

// --- LLM judge output (equity-llm-judge-v1) ------------------------------------------------

export const LLM_JUDGE_SCHEMA = "equity-llm-judge-v1";

export interface LlmSource {
  id: string;
  /** Sanitized: http/https only, else null (rendered as plain text). */
  url: string | null;
  title: string;
  publishedAt: string | null;
}

export interface LlmJudgeOutput {
  schemaVersion: string;
  symbol: string;
  signalBarOpenTimeMs: number;
  evidenceStatus: "sourced" | "insufficient";
  scenarios: { name: string; direction: "up" | "down" | "sideways"; description: string; sourceIds: string[] }[];
  warnings: { text: string; sourceIds: string[] }[];
  veto: { active: boolean; reason: string | null; sourceIds: string[] };
  sources: LlmSource[];
  adjustedForecasts: { configId: string; probTargetFirst: number | null; probStopFirst: number | null; rationale: string; sourceIds: string[] }[];
}

export function parseLlmJudgeOutput(value: unknown, symbol: string, label = "llmOutput"): LlmJudgeOutput {
  const source = object(value, label);
  requireKeys(source, label, ["schemaVersion", "symbol", "signalBarOpenTimeMs", "evidenceStatus", "scenarios", "warnings", "veto", "sources", "adjustedForecasts"]);
  const schemaVersion = nonBlank(source.schemaVersion, `${label}.schemaVersion`);
  if (schemaVersion !== LLM_JUDGE_SCHEMA) throw new Error(`${ERR}: ${label}.schemaVersion must be "${LLM_JUDGE_SCHEMA}"`);
  const sources = array(source.sources, `${label}.sources`).map((raw, index) => {
    const l = `${label}.sources[${index}]`;
    const s = object(raw, l);
    requireKeys(s, l, ["id", "url", "title"]);
    return {
      id: nonBlank(s.id, `${l}.id`),
      url: safeSourceUrl(s.url),
      title: nonBlank(s.title, `${l}.title`),
      publishedAt: nullableNonBlank(s.publishedAt, `${l}.publishedAt`),
    };
  });
  const known = new Set(sources.map((s) => s.id));
  const refs = (raw: unknown, l: string) => {
    const ids = stringArray(raw, l);
    const missing = ids.filter((id) => !known.has(id));
    if (missing.length > 0) throw new Error(`${ERR}: ${l} references unknown source(s): ${missing.join(", ")}`);
    return ids;
  };
  const veto = object(source.veto, `${label}.veto`);
  requireKeys(veto, `${label}.veto`, ["active"]);
  const vetoActive = bool(veto.active, `${label}.veto.active`);
  return {
    schemaVersion,
    symbol: requireSymbol(source.symbol, `${label}.symbol`, symbol),
    signalBarOpenTimeMs: finite(source.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`),
    evidenceStatus: enumValue(source.evidenceStatus, `${label}.evidenceStatus`, ["sourced", "insufficient"] as const),
    scenarios: array(source.scenarios, `${label}.scenarios`).map((raw, index) => {
      const l = `${label}.scenarios[${index}]`;
      const s = object(raw, l);
      requireKeys(s, l, ["name", "direction", "description"]);
      return {
        name: nonBlank(s.name, `${l}.name`),
        direction: enumValue(s.direction, `${l}.direction`, ["up", "down", "sideways"] as const),
        description: nonBlank(s.description, `${l}.description`),
        sourceIds: s.sourceIds == null ? [] : refs(s.sourceIds, `${l}.sourceIds`),
      };
    }),
    warnings: array(source.warnings, `${label}.warnings`).map((raw, index) => {
      const l = `${label}.warnings[${index}]`;
      const w = object(raw, l);
      requireKeys(w, l, ["text"]);
      return { text: nonBlank(w.text, `${l}.text`), sourceIds: w.sourceIds == null ? [] : refs(w.sourceIds, `${l}.sourceIds`) };
    }),
    veto: {
      active: vetoActive,
      reason: vetoActive ? nonBlank(veto.reason, `${label}.veto.reason`) : nullableNonBlank(veto.reason, `${label}.veto.reason`),
      sourceIds: veto.sourceIds == null ? [] : refs(veto.sourceIds, `${label}.veto.sourceIds`),
    },
    sources,
    adjustedForecasts: array(source.adjustedForecasts, `${label}.adjustedForecasts`).map((raw, index) => {
      const l = `${label}.adjustedForecasts[${index}]`;
      const f = object(raw, l);
      requireKeys(f, l, ["configId", "probTargetFirst", "probStopFirst", "rationale"]);
      const pT = probability(f.probTargetFirst, `${l}.probTargetFirst`);
      const pS = probability(f.probStopFirst, `${l}.probStopFirst`);
      pairProbabilities(pT, pS, l);
      return {
        configId: nonBlank(f.configId, `${l}.configId`),
        probTargetFirst: pT,
        probStopFirst: pS,
        rationale: nonBlank(f.rationale, `${l}.rationale`),
        sourceIds: f.sourceIds == null ? [] : refs(f.sourceIds, `${l}.sourceIds`),
      };
    }),
  };
}

// --- LLM runs ------------------------------------------------------------------------------

export const LLM_RUN_STATUSES = ["succeeded", "failed", "unavailable"] as const;

export interface LlmRun {
  runId: string;
  symbol: string;
  signalBarOpenTimeMs: number;
  createdAtUtc: string;
  status: (typeof LLM_RUN_STATUSES)[number];
  reason: string | null;
  researchModel: string | null;
  judgeModel: string | null;
  promptVersion: string | null;
  schemaVersion: string | null;
  /** Only ever parsed for succeeded runs; failed/unavailable runs render no output. */
  output: LlmJudgeOutput | null;
  durationMs: number | null;
}

export function parseLlmRun(value: unknown, symbol: string, label = "llmRun"): LlmRun {
  const source = object(value, label);
  requireKeys(source, label, ["runId", "symbol", "signalBarOpenTimeMs", "createdAtUtc", "status"]);
  const status = enumValue(source.status, `${label}.status`, LLM_RUN_STATUSES);
  const output = status === "succeeded" && source.output != null ? parseLlmJudgeOutput(source.output, symbol, `${label}.output`) : null;
  const signalBarOpenTimeMs = finite(source.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`);
  if (output && output.signalBarOpenTimeMs !== signalBarOpenTimeMs) throw new Error(`${ERR}: ${label}.output.signalBarOpenTimeMs must match the run`);
  return {
    runId: idString(source.runId, `${label}.runId`),
    symbol: requireSymbol(source.symbol, `${label}.symbol`, symbol),
    signalBarOpenTimeMs,
    createdAtUtc: nonBlank(source.createdAtUtc, `${label}.createdAtUtc`),
    status,
    reason: nullableNonBlank(source.reason, `${label}.reason`),
    researchModel: nullableNonBlank(source.researchModel, `${label}.researchModel`),
    judgeModel: nullableNonBlank(source.judgeModel, `${label}.judgeModel`),
    promptVersion: nullableNonBlank(source.promptVersion, `${label}.promptVersion`),
    schemaVersion: nullableNonBlank(source.schemaVersion, `${label}.schemaVersion`),
    output,
    durationMs: nullableFinite(source.durationMs, `${label}.durationMs`),
  };
}

export function parseLlmRuns(value: unknown, symbol: string): LlmRun[] {
  const source = object(value, "llmRuns");
  requireKeys(source, "llmRuns", ["items"]);
  return array(source.items, "llmRuns.items").map((item, index) => parseLlmRun(item, symbol, `llmRuns.items[${index}]`));
}

// --- quant ↔ LLM pairing ------------------------------------------------------------

export interface QuantReference {
  probTargetFirst: number | null;
  validated: boolean;
  /** Where the quant number came from — both are tied to the same signal bar. */
  source: "base-rates" | "journal";
}

/**
 * Quant number to show beside an LLM adjusted forecast. Only a quant forecast for
 * the SAME signal bar is a fair pair: the current base-rates when its bar matches,
 * else the quant-knn journal record for that bar, else null (rendered "—").
 */
export function quantReferenceFor(
  configId: string,
  signalBarOpenTimeMs: number,
  baseRates: EquityBaseRates | null,
  journal: ForecastJournal | null,
): QuantReference | null {
  const config = baseRates?.configs.find((c) => c.configId === configId);
  const baseBar = config?.research?.signalBarOpenTimeMs ?? baseRates?.artifact?.dataAsOfOpenTimeMs ?? null;
  if (config && baseBar === signalBarOpenTimeMs) {
    const probTargetFirst = config.decisionUse?.probTargetFirst ?? config.research?.probTargetFirst ?? null;
    if (probTargetFirst != null) return { probTargetFirst, validated: config.decisionUse != null, source: "base-rates" };
  }
  const record = journal?.items.find((item) =>
    item.source === "quant-knn" && item.configId === configId && item.signalBarOpenTimeMs === signalBarOpenTimeMs && !item.abstained);
  if (record && record.probTargetFirst != null) {
    return { probTargetFirst: record.probTargetFirst, validated: record.validated, source: "journal" };
  }
  return null;
}
