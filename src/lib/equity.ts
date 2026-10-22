// EQX equity lane (spec backend/docs/plans/equity-expansion/spec.md §1/§2/§5/§6/§9):
// symbol scope, endpoint routing, and fail-closed parsers for the surfaces that
// only exist on the new backend (base-rates, context). The /api/mbb/* DTO
// parsers in mbb.ts are reused for candles/conditions/data-quality/position/
// decision via an EquityParseScope.
//
// Degrade rules (pitfall #30): fields the contract marks additive parse as
// `=== undefined ? null`; a 404/UNSUPPORTED_CAPABILITY on a new-only surface is an
// honest "unavailable" state, never a crash.

import type { EquityParseScope, MbbTimeframe } from "./mbb.ts";

const ERR = "INVALID_EQUITY_RESPONSE";

// --- symbol scope -----------------------------------------------------------

export const EQUITY_SYMBOLS = ["MBB", "BID"] as const;
export type EquitySymbol = (typeof EQUITY_SYMBOLS)[number];
export const DEFAULT_EQUITY_SYMBOL: EquitySymbol = "MBB";

export interface EquityProfile {
  symbol: EquitySymbol;
  name: string;
  venue: string;
  currency: string;
  dataProvider: string;
  crossCheckDataProvider: string;
  priceBasis: string;
  timeframes: readonly MbbTimeframe[];
  defaultTimeframe: MbbTimeframe;
}

// Static mirror of spec §1 — used until (or instead of, when it fails) the
// /api/instruments catalog. The catalog may only NARROW these timeframes.
export const STATIC_EQUITY_PROFILES: Readonly<Record<EquitySymbol, EquityProfile>> = {
  MBB: {
    symbol: "MBB",
    name: "MB Bank",
    venue: "HOSE",
    currency: "VND",
    dataProvider: "VCI",
    crossCheckDataProvider: "KBS",
    priceBasis: "adjusted",
    timeframes: ["1h", "1d"],
    defaultTimeframe: "1d",
  },
  BID: {
    symbol: "BID",
    name: "BIDV",
    venue: "HOSE",
    currency: "VND",
    dataProvider: "VCI",
    crossCheckDataProvider: "KBS",
    priceBasis: "adjusted",
    timeframes: ["1d"],
    defaultTimeframe: "1d",
  },
};

/** Known instruments that have no decision lane (spec §1) — honest copy instead of "unknown". */
const NON_DECISION_SYMBOLS: Readonly<Record<string, string>> = {
  VCB: "VCB chỉ dùng làm mã so sánh (peer relative strength), không có lane quyết định.",
  CTG: "CTG chỉ dùng làm mã so sánh (peer relative strength), không có lane quyết định.",
  VNINDEX: "VNINDEX là chỉ số (điểm), chỉ dùng làm benchmark — không giao dịch, không có vị thế.",
  BTCUSDT: "BTCUSDT thuộc lane crypto — xem trang BTC/USDT.",
  BTC: "BTC thuộc lane crypto — xem trang BTC/USDT.",
};

export function isEquitySymbol(value: unknown): value is EquitySymbol {
  return typeof value === "string" && (EQUITY_SYMBOLS as readonly string[]).includes(value);
}

export type EquitySymbolResolution =
  | { status: "ok"; profile: EquityProfile }
  | { status: "unsupported"; symbol: string; reason: string }
  | { status: "unknown"; symbol: string };

/**
 * URL `?symbol=` → profile. Missing/blank → MBB. Unknown or non-decision symbols
 * resolve to an error state so the page never fires a request for them.
 */
export function resolveEquitySymbol(raw: string | null | undefined, catalog?: EquityCatalog | null): EquitySymbolResolution {
  const normalized = (raw ?? "").trim().toUpperCase();
  if (normalized === "") return resolveEquitySymbol(DEFAULT_EQUITY_SYMBOL, catalog);
  if (!/^[A-Z0-9]{1,16}$/.test(normalized)) return { status: "unknown", symbol: normalized.slice(0, 16) };
  if (!isEquitySymbol(normalized)) {
    const reason = NON_DECISION_SYMBOLS[normalized];
    return reason ? { status: "unsupported", symbol: normalized, reason } : { status: "unknown", symbol: normalized };
  }
  const base = STATIC_EQUITY_PROFILES[normalized];
  const item = catalog?.items.find((entry) => entry.symbol === normalized);
  if (!item) return { status: "ok", profile: base };
  if (item.decision === false) {
    return { status: "unsupported", symbol: normalized, reason: `Catalog backend báo ${normalized} không có capability decision.` };
  }
  return { status: "ok", profile: applyCatalogTimeframes(base, item) };
}

function applyCatalogTimeframes(base: EquityProfile, item: EquityCatalogItem): EquityProfile {
  const narrowed = base.timeframes.filter((tf) => item.activeTimeframes.includes(tf));
  if (narrowed.length === 0) return base;
  const defaultTimeframe = narrowed.includes(item.defaultTimeframe as MbbTimeframe)
    ? (item.defaultTimeframe as MbbTimeframe)
    : narrowed.includes(base.defaultTimeframe) ? base.defaultTimeframe : narrowed[0];
  return { ...base, timeframes: narrowed, defaultTimeframe };
}

export function equityParseScope(profile: EquityProfile): EquityParseScope {
  return { symbol: profile.symbol, timeframes: profile.timeframes };
}

export function normalizeEquityTimeframe(profile: EquityProfile, value: unknown): MbbTimeframe {
  return typeof value === "string" && (profile.timeframes as readonly string[]).includes(value)
    ? (value as MbbTimeframe)
    : profile.defaultTimeframe;
}

// --- endpoint routing (spec §2 compatibility rule) ----------------------------

/** Surfaces that exist on both the legacy /api/mbb alias and /api/equities/{symbol}. */
export type EquityLegacySurface = "candles" | "conditions" | "data-quality" | "observations" | "position" | "decision";
/** Surfaces that only exist on the new backend. */
export type EquityNewSurface = "base-rates" | "context" | "forecast-journal" | "llm-runs" | "research-notes" | "source-documents";

/** MBB keeps /api/mbb/* for the surfaces it already had (safe against an older backend). */
export function equityLegacyPath(symbol: EquitySymbol, surface: EquityLegacySurface): string {
  return symbol === "MBB" ? `/api/mbb/${surface}` : `/api/equities/${encodeURIComponent(symbol)}/${surface}`;
}

export function equityNewPath(symbol: EquitySymbol, surface: EquityNewSurface): string {
  return `/api/equities/${encodeURIComponent(symbol)}/${surface}`;
}

// --- optional (new-backend) surfaces --------------------------------------------

export type EquityOptional<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; httpStatus: number; code: string | null };

/**
 * Classify a failed response on a new-only surface. 404 (route missing on an
 * older backend, or UNKNOWN_SYMBOL) and 400 UNSUPPORTED_CAPABILITY are honest
 * "unavailable" states; anything else stays an error. The body is untrusted:
 * only a code matching /^[A-Z_]+$/ is ever surfaced.
 */
export function classifyEquityUnavailable(status: number, bodyText: string): { code: string | null } | null {
  let code: string | null = null;
  try {
    const parsed = JSON.parse(bodyText) as { code?: unknown };
    if (typeof parsed?.code === "string" && /^[A-Z_]{1,64}$/.test(parsed.code)) code = parsed.code;
  } catch {
    // non-JSON body (e.g. framework 404 page) — still a 404
  }
  if (status === 404) return { code };
  if (status === 400 && code === "UNSUPPORTED_CAPABILITY") return { code };
  return null;
}

// --- parse primitives -----------------------------------------------------------

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

function nullableInteger(value: unknown, label: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${ERR}: ${label} must be an integer >= 0`);
  }
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

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an array`);
  return value.map((item, index) => nonBlank(item, `${label}[${index}]`));
}

/** Additive list: absent → [] (pitfall #30), present → validated. */
function additiveStringArray(value: unknown, label: string): string[] {
  return value === undefined || value === null ? [] : stringArray(value, label);
}

function enumValue<T extends string>(value: unknown, label: string, allowed: readonly T[]): T {
  const parsed = nonBlank(value, label);
  if (!(allowed as readonly string[]).includes(parsed)) {
    throw new Error(`${ERR}: ${label} must be one of ${allowed.join("/")}; got "${parsed}"`);
  }
  return parsed as T;
}

function requireSymbol(value: unknown, label: string, expected: string): string {
  const parsed = nonBlank(value, label);
  if (parsed !== expected) throw new Error(`${ERR}: ${label} must be "${expected}"; got "${parsed}"`);
  return parsed;
}

function requireContractVersion(value: unknown, label: string, expected: string): string {
  const parsed = nonBlank(value, label);
  if (parsed !== expected) throw new Error(`${ERR}: ${label} must be "${expected}"; got "${parsed}"`);
  return parsed;
}

/** Only http(s) links are ever rendered as hrefs (provider/admin data is untrusted). */
export function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// --- instrument catalog (instrument-catalog-v2, additive over v1) ---------------

export interface EquityCatalogItem {
  symbol: string;
  assetClass: string;
  currency: string;
  activeTimeframes: string[];
  defaultTimeframe: string;
  technicalAnalysis: boolean;
  /** null = v1 catalog without the flag (degrade, never inferred). */
  ingestion: boolean | null;
  decision: boolean | null;
}

export interface EquityCatalog {
  contractVersion: string;
  items: EquityCatalogItem[];
}

export function parseEquityCatalog(value: unknown): EquityCatalog {
  const source = object(value, "instrumentCatalog");
  requireKeys(source, "instrumentCatalog", ["contractVersion", "items"]);
  const contractVersion = nonBlank(source.contractVersion, "instrumentCatalog.contractVersion");
  if (!contractVersion.startsWith("instrument-catalog-v")) {
    throw new Error(`${ERR}: instrumentCatalog.contractVersion is unsupported ("${contractVersion}")`);
  }
  if (!Array.isArray(source.items)) throw new Error(`${ERR}: instrumentCatalog.items must be an array`);
  const items = source.items.map((raw, index) => {
    const label = `instrumentCatalog.items[${index}]`;
    const item = object(raw, label);
    requireKeys(item, label, ["symbol", "assetClass", "currency", "activeTimeframes", "defaultTimeframe", "capabilities"]);
    const capabilities = object(item.capabilities, `${label}.capabilities`);
    return {
      symbol: nonBlank(item.symbol, `${label}.symbol`).toUpperCase(),
      // "index" is additive in v2 — any non-blank asset class is accepted, never coerced.
      assetClass: nonBlank(item.assetClass, `${label}.assetClass`),
      currency: nonBlank(item.currency, `${label}.currency`),
      activeTimeframes: stringArray(item.activeTimeframes, `${label}.activeTimeframes`).map((tf) => tf.trim().toLowerCase()),
      defaultTimeframe: nonBlank(item.defaultTimeframe, `${label}.defaultTimeframe`).trim().toLowerCase(),
      technicalAnalysis: capabilities.technicalAnalysis === true,
      ingestion: capabilities.ingestion === undefined || capabilities.ingestion === null ? null : bool(capabilities.ingestion, `${label}.capabilities.ingestion`),
      decision: capabilities.decision === undefined || capabilities.decision === null ? null : bool(capabilities.decision, `${label}.capabilities.decision`),
    };
  });
  return { contractVersion, items };
}

// --- observations (MbbObservationDto + additive `symbol`) ----------------------

export interface EquityObservation {
  /** Additive in EQX; null when an older backend omits it. */
  symbol: string | null;
  decisionId: string;
  recorderVersion: string;
  timeframe: string;
  signalBarOpenTimeMs: number;
  signalBarCloseTimeMs: number;
  observedAtUtc: string;
  decision: string;
  evidenceStatus: string | null;
  priceBasis: string | null;
  marketCloseVnd: number | null;
  fillPrice: number | null;
  fillObservedAtUtc: string | null;
  fillSource: string | null;
  fillBarOpenTimeMs: number | null;
  /** Fraction (0.012 = +1.2%), write-once; null = not observed yet. */
  outcomeReturn: number | null;
  outcomeObservedAtUtc: string | null;
  outcomeHorizon: string | null;
}

export function parseEquityObservations(value: unknown, scope: EquityParseScope, timeframe: string): EquityObservation[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: observations must be an array`);
  return value.map((raw, index) => {
    const label = `observations[${index}]`;
    const source = object(raw, label);
    requireKeys(source, label, ["decisionId", "recorderVersion", "timeframe", "signalBarOpenTimeMs", "signalBarCloseTimeMs", "observedAtUtc", "decision"]);
    const symbol = source.symbol === undefined || source.symbol === null ? null : requireSymbol(source.symbol, `${label}.symbol`, scope.symbol);
    const tf = nonBlank(source.timeframe, `${label}.timeframe`);
    if (tf !== timeframe) throw new Error(`${ERR}: ${label}.timeframe must be "${timeframe}"; got "${tf}"`);
    return {
      symbol,
      decisionId: nonBlank(source.decisionId, `${label}.decisionId`),
      recorderVersion: nonBlank(source.recorderVersion, `${label}.recorderVersion`),
      timeframe: tf,
      signalBarOpenTimeMs: finite(source.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`),
      signalBarCloseTimeMs: finite(source.signalBarCloseTimeMs, `${label}.signalBarCloseTimeMs`),
      observedAtUtc: nonBlank(source.observedAtUtc, `${label}.observedAtUtc`),
      decision: nonBlank(source.decision, `${label}.decision`),
      evidenceStatus: nullableNonBlank(source.evidenceStatus, `${label}.evidenceStatus`),
      priceBasis: nullableNonBlank(source.priceBasis, `${label}.priceBasis`),
      marketCloseVnd: nullableFinite(source.marketCloseVnd, `${label}.marketCloseVnd`),
      fillPrice: nullableFinite(source.fillPrice, `${label}.fillPrice`),
      fillObservedAtUtc: nullableNonBlank(source.fillObservedAtUtc, `${label}.fillObservedAtUtc`),
      fillSource: nullableNonBlank(source.fillSource, `${label}.fillSource`),
      fillBarOpenTimeMs: nullableFinite(source.fillBarOpenTimeMs, `${label}.fillBarOpenTimeMs`),
      outcomeReturn: nullableFinite(source.outcomeReturn, `${label}.outcomeReturn`),
      outcomeObservedAtUtc: nullableNonBlank(source.outcomeObservedAtUtc, `${label}.outcomeObservedAtUtc`),
      outcomeHorizon: nullableNonBlank(source.outcomeHorizon, `${label}.outcomeHorizon`),
    };
  });
}

// --- base rates (equity-base-rates-v1, spec §5) ---------------------------------

export const BASE_RATES_CONTRACT = "equity-base-rates-v1";
export const BASE_RATES_STATUSES = ["ok", "abstained", "unavailable"] as const;
export type BaseRatesStatus = (typeof BASE_RATES_STATUSES)[number];

export interface BaseRatesProbabilities {
  probTargetFirst: number | null;
  probStopFirst: number | null;
  probTimeout: number | null;
}

export interface BaseRatesDecisionUse extends BaseRatesProbabilities {
  evNetFraction: number | null;
}

export interface BaseRatesResearch extends BaseRatesProbabilities {
  label: "validated" | "unvalidated";
  signalBarOpenTimeMs: number | null;
  evNetFraction: number | null;
  k: number | null;
  nEligible: number | null;
  prior: BaseRatesProbabilities | null;
}

export interface BaseRatesValidation {
  gatePassed: boolean;
  gateReasons: string[];
  nOos: number | null;
  nEffective: number | null;
  brierKnn: number | null;
  brierPrior: number | null;
  /** 90% CI of ΔBrier = kNN − prior (block bootstrap). */
  brierDiffCi90: [number, number] | null;
  ece: number | null;
  coverage: number | null;
  abstentionRate: number | null;
  evNetOosMean: number | null;
  evNetOosWhenPositive: number | null;
}

export interface BaseRatesConfig {
  configId: string;
  /** Fraction (spec §11): 0.05 = +5% target. */
  targetPct: number;
  /** Positive fraction (spec §11): 0.04 = −4% stop. */
  stopPct: number;
  horizonSessions: number;
  abstained: boolean;
  abstainReasons: string[];
  decisionUse: BaseRatesDecisionUse | null;
  research: BaseRatesResearch | null;
  validation: BaseRatesValidation | null;
}

export interface BaseRatesArtifact {
  generatedAtUtc: string;
  dataAsOfOpenTimeMs: number | null;
  priceBasis: string;
  methodVersion: string;
  protocolVersion: string;
  datasetSha256: string | null;
}

export interface EquityBaseRates {
  contractVersion: string;
  symbol: string;
  timeframe: string;
  status: BaseRatesStatus;
  reasons: string[];
  artifact: BaseRatesArtifact | null;
  configs: BaseRatesConfig[];
}

function probabilities(source: Record<string, unknown>, label: string): BaseRatesProbabilities {
  const result = {
    probTargetFirst: probability(source.probTargetFirst, `${label}.probTargetFirst`),
    probStopFirst: probability(source.probStopFirst, `${label}.probStopFirst`),
    probTimeout: probability(source.probTimeout, `${label}.probTimeout`),
  };
  if (result.probTargetFirst != null && result.probStopFirst != null && result.probTargetFirst + result.probStopFirst > 1 + 1e-9) {
    throw new Error(`${ERR}: ${label} probTargetFirst + probStopFirst must be <= 1`);
  }
  return result;
}

/** Spec §11: `[lower, upper]` or null — no object form. */
/**
 * Barrier distance as a positive fraction in (0, 1) — spec §11 pins 0.05, not 5.
 * A percent-number payload (5) is rejected rather than rendered as +500%.
 */
export function barrierFraction(value: unknown, label: string): number {
  const parsed = finite(value, label);
  if (!(parsed > 0 && parsed < 1)) throw new Error(`${ERR}: ${label} must be a positive fraction in (0, 1); got ${parsed}`);
  return parsed;
}

function ci90(value: unknown, label: string): [number, number] | null {
  if (value == null) return null;
  if (!Array.isArray(value) || value.length !== 2) throw new Error(`${ERR}: ${label} must be [lower, upper] or null`);
  const lower = finite(value[0], `${label}[0]`);
  const upper = finite(value[1], `${label}[1]`);
  if (lower > upper) throw new Error(`${ERR}: ${label} lower bound must not exceed upper`);
  return [lower, upper];
}

function validation(value: unknown, label: string): BaseRatesValidation | null {
  if (value == null) return null;
  const source = object(value, label);
  requireKeys(source, label, ["gatePassed"]);
  return {
    gatePassed: bool(source.gatePassed, `${label}.gatePassed`),
    gateReasons: additiveStringArray(source.gateReasons, `${label}.gateReasons`),
    nOos: nullableInteger(source.nOos, `${label}.nOos`),
    nEffective: nullableInteger(source.nEffective, `${label}.nEffective`),
    brierKnn: nullableFinite(source.brierKnn, `${label}.brierKnn`),
    brierPrior: nullableFinite(source.brierPrior, `${label}.brierPrior`),
    brierDiffCi90: ci90(source.brierDiffCi90, `${label}.brierDiffCi90`),
    ece: nullableFinite(source.ece, `${label}.ece`),
    coverage: probability(source.coverage, `${label}.coverage`),
    abstentionRate: probability(source.abstentionRate, `${label}.abstentionRate`),
    evNetOosMean: nullableFinite(source.evNetOosMean, `${label}.evNetOosMean`),
    evNetOosWhenPositive: nullableFinite(source.evNetOosWhenPositive, `${label}.evNetOosWhenPositive`),
  };
}

function research(value: unknown, label: string): BaseRatesResearch | null {
  if (value == null) return null;
  const source = object(value, label);
  requireKeys(source, label, ["label"]);
  const prior = source.prior == null ? null : probabilities(object(source.prior, `${label}.prior`), `${label}.prior`);
  return {
    label: enumValue(source.label, `${label}.label`, ["validated", "unvalidated"] as const),
    signalBarOpenTimeMs: nullableFinite(source.signalBarOpenTimeMs, `${label}.signalBarOpenTimeMs`),
    ...probabilities(source, label),
    evNetFraction: nullableFinite(source.evNetFraction, `${label}.evNetFraction`),
    k: nullableInteger(source.k, `${label}.k`),
    nEligible: nullableInteger(source.nEligible, `${label}.nEligible`),
    prior,
  };
}

function baseRatesConfig(value: unknown, index: number, status: BaseRatesStatus): BaseRatesConfig {
  const label = `baseRates.configs[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["configId", "targetPct", "stopPct", "horizonSessions", "abstained"]);
  const horizon = nullableInteger(source.horizonSessions, `${label}.horizonSessions`);
  if (horizon == null || horizon < 1) throw new Error(`${ERR}: ${label}.horizonSessions must be an integer >= 1`);
  const parsedValidation = validation(source.validation, `${label}.validation`);
  const abstained = bool(source.abstained, `${label}.abstained`);
  let decisionUse: BaseRatesDecisionUse | null = null;
  if (source.decisionUse != null) {
    // decisionUse is only legitimate when the frozen gate passed on a fresh
    // artifact; anything else would present unvalidated numbers as usable.
    if (status !== "ok" || abstained || parsedValidation?.gatePassed !== true) {
      throw new Error(`${ERR}: ${label}.decisionUse present without a passed gate on an ok, non-abstained config`);
    }
    const use = object(source.decisionUse, `${label}.decisionUse`);
    decisionUse = {
      ...probabilities(use, `${label}.decisionUse`),
      evNetFraction: nullableFinite(use.evNetFraction, `${label}.decisionUse.evNetFraction`),
    };
  }
  const parsedResearch = research(source.research, `${label}.research`);
  if (parsedResearch?.label === "validated" && parsedValidation?.gatePassed !== true) {
    throw new Error(`${ERR}: ${label}.research.label "validated" without a passed gate`);
  }
  return {
    configId: nonBlank(source.configId, `${label}.configId`),
    targetPct: barrierFraction(source.targetPct, `${label}.targetPct`),
    stopPct: barrierFraction(source.stopPct, `${label}.stopPct`),
    horizonSessions: horizon,
    abstained,
    abstainReasons: additiveStringArray(source.abstainReasons, `${label}.abstainReasons`),
    decisionUse,
    research: parsedResearch,
    validation: parsedValidation,
  };
}

export function parseEquityBaseRates(value: unknown, symbol: string): EquityBaseRates {
  const source = object(value, "baseRates");
  requireKeys(source, "baseRates", ["contractVersion", "symbol", "timeframe", "status", "configs"]);
  const status = enumValue(source.status, "baseRates.status", BASE_RATES_STATUSES);
  if (!Array.isArray(source.configs)) throw new Error(`${ERR}: baseRates.configs must be an array`);
  let artifact: BaseRatesArtifact | null = null;
  if (source.artifact != null) {
    const a = object(source.artifact, "baseRates.artifact");
    requireKeys(a, "baseRates.artifact", ["generatedAtUtc", "priceBasis", "methodVersion", "protocolVersion"]);
    artifact = {
      generatedAtUtc: nonBlank(a.generatedAtUtc, "baseRates.artifact.generatedAtUtc"),
      dataAsOfOpenTimeMs: nullableFinite(a.dataAsOfOpenTimeMs, "baseRates.artifact.dataAsOfOpenTimeMs"),
      priceBasis: nonBlank(a.priceBasis, "baseRates.artifact.priceBasis"),
      methodVersion: nonBlank(a.methodVersion, "baseRates.artifact.methodVersion"),
      protocolVersion: nonBlank(a.protocolVersion, "baseRates.artifact.protocolVersion"),
      datasetSha256: nullableNonBlank(a.datasetSha256, "baseRates.artifact.datasetSha256"),
    };
  }
  return {
    contractVersion: requireContractVersion(source.contractVersion, "baseRates.contractVersion", BASE_RATES_CONTRACT),
    symbol: requireSymbol(source.symbol, "baseRates.symbol", symbol),
    timeframe: enumValue(source.timeframe, "baseRates.timeframe", ["1d"] as const),
    status,
    reasons: additiveStringArray(source.reasons, "baseRates.reasons"),
    artifact,
    configs: source.configs.map((item, index) => baseRatesConfig(item, index, status)),
  };
}

const BASE_RATES_REASON_LABELS: Readonly<Record<string, string>> = {
  "artifact-missing": "Chưa có artifact base-rates cho mã này",
  "artifact-stale-revision": "Artifact cũ: dữ liệu nến đã bị nguồn sửa (revision) sau khi build",
  "artifact-stale-asof": "Artifact cũ: chưa build cho nến 1d finalized mới nhất",
  "gate-failed": "Chưa qua gate kiểm định",
  "gate-not-passed": "Chưa qua gate kiểm định — số liệu chỉ để nghiên cứu",
  "brier-diff-ci90-upper-not-below-zero": "CI90 ΔBrier (kNN − prior) chưa nằm hẳn dưới 0 — chưa tốt hơn prior",
  "ece-above-0.05": "ECE > 0,05 — hiệu chuẩn chưa đạt",
  "n-effective-below-30": "n hiệu dụng < 30",
  "insufficient-sample": "Không đủ mẫu",
};

export function baseRatesReasonLabel(code: string): string {
  return BASE_RATES_REASON_LABELS[code] ?? code;
}

export function isStaleReason(code: string): boolean {
  return code.startsWith("artifact-stale");
}

// --- context (equity-context-v1, spec §6) ---------------------------------------

export const CONTEXT_CONTRACT = "equity-context-v1";
export const CONTEXT_SECTION_STATUSES = ["ok", "empty", "unavailable"] as const;
export type ContextSectionStatus = (typeof CONTEXT_SECTION_STATUSES)[number];

export interface RsWindowReturn {
  instrument: number | null;
  benchmark: number | null;
  excess: number | null;
}

/** EQX v2 §A4: a benchmark whose bars lag the instrument is `stale`, never `ok`. */
export const RS_BENCHMARK_STATUSES = [...CONTEXT_SECTION_STATUSES, "stale"] as const;
export type RsBenchmarkStatus = (typeof RS_BENCHMARK_STATUSES)[number];
export const RS_STALE_REASONS = ["benchmark-stale", "aligned-window-ends-before-instrument-latest"] as const;

export interface RsBenchmark {
  symbol: string;
  /** index | peer (spec §11); null when an older payload omits it. */
  kind: string | null;
  status: RsBenchmarkStatus;
  reason: string | null;
  alignedSessions: number | null;
  /** window (sessions, as string key "20"/"60") → returns (fractions). */
  returns: Record<string, RsWindowReturn>;
}

export interface CorporateActionItem {
  exDate: string;
  actionType: string;
  ratioText: string | null;
  cashPerShareVnd: number | null;
  adjustmentFactor: number | null;
  recordDate: string | null;
  sourceUrl: string | null;
  provenance: string | null;
  verificationStatus: string | null;
  availableAtUtc: string | null;
}

export interface EventItem {
  eventType: string;
  eventDate: string;
  title: string;
  sourceUrl: string | null;
  provenance: string | null;
  availableAtUtc: string | null;
}

export interface FundamentalItem {
  period: string;
  periodEndDate: string | null;
  metric: string;
  value: number | null;
  unit: string | null;
  unavailableReason: string | null;
  publishedDate: string | null;
  availableAtUtc: string | null;
  asOfUtc: string | null;
  source: string | null;
  sourceUrl: string | null;
  note: string | null;
  /** EQX v2 C1 (additive): issuer document the value was copied from + where (page/row). */
  documentId: string | null;
  sourceLocation: string | null;
}

export interface ContextSection<T> {
  status: ContextSectionStatus;
  reason: string | null;
  items: T[];
}

export interface EquityContext {
  contractVersion: string;
  symbol: string;
  generatedAtUtc: string;
  relativeStrength: ContextSection<RsBenchmark>;
  corporateActions: ContextSection<CorporateActionItem>;
  events: ContextSection<EventItem>;
  fundamentals: ContextSection<FundamentalItem>;
  limitations: string[];
}

function section<T>(value: unknown, label: string, listKey: string, parseItem: (raw: unknown, itemLabel: string) => T): ContextSection<T> {
  const source = object(value, label);
  requireKeys(source, label, ["status"]);
  const declared = enumValue(source.status, `${label}.status`, CONTEXT_SECTION_STATUSES);
  const rawList = source[listKey];
  if (rawList != null && !Array.isArray(rawList)) throw new Error(`${ERR}: ${label}.${listKey} must be an array`);
  // An unavailable section never carries rows we would render.
  const items = declared === "unavailable"
    ? []
    : (rawList ?? []).map((raw: unknown, index: number) => parseItem(raw, `${label}.${listKey}[${index}]`));
  // "ok" with nothing to show is rendered as the honest empty state.
  const status: ContextSectionStatus = declared === "ok" && items.length === 0 ? "empty" : declared;
  return { status, reason: nullableNonBlank(source.reason, `${label}.reason`), items };
}

function rsBenchmark(raw: unknown, label: string): RsBenchmark {
  const source = object(raw, label);
  requireKeys(source, label, ["symbol", "status"]);
  const returns: Record<string, RsWindowReturn> = {};
  if (source.returns != null) {
    const windows = object(source.returns, `${label}.returns`);
    for (const [window, rawReturn] of Object.entries(windows)) {
      if (rawReturn == null) continue; // window without an aligned return (backend emits null)
      const r = object(rawReturn, `${label}.returns.${window}`);
      returns[window] = {
        instrument: nullableFinite(r.instrument, `${label}.returns.${window}.instrument`),
        benchmark: nullableFinite(r.benchmark, `${label}.returns.${window}.benchmark`),
        excess: nullableFinite(r.excess, `${label}.returns.${window}.excess`),
      };
    }
  }
  const declared = enumValue(source.status, `${label}.status`, RS_BENCHMARK_STATUSES);
  const reason = nullableNonBlank(source.reason, `${label}.reason`);
  // A stale-reason code can never render as ok, whatever status accompanies it.
  const stale = declared === "stale" || (reason != null && (RS_STALE_REASONS as readonly string[]).includes(reason));
  return {
    symbol: nonBlank(source.symbol, `${label}.symbol`),
    kind: source.kind == null ? null : enumValue(source.kind, `${label}.kind`, ["index", "peer"] as const),
    status: stale ? "stale" : declared,
    reason,
    alignedSessions: nullableInteger(source.alignedSessions, `${label}.alignedSessions`),
    returns,
  };
}

function corporateAction(raw: unknown, label: string): CorporateActionItem {
  const source = object(raw, label);
  requireKeys(source, label, ["exDate", "actionType"]);
  return {
    exDate: nonBlank(source.exDate, `${label}.exDate`),
    actionType: nonBlank(source.actionType, `${label}.actionType`),
    ratioText: nullableNonBlank(source.ratioText, `${label}.ratioText`),
    cashPerShareVnd: nullableFinite(source.cashPerShareVnd, `${label}.cashPerShareVnd`),
    adjustmentFactor: nullableFinite(source.adjustmentFactor, `${label}.adjustmentFactor`),
    recordDate: nullableNonBlank(source.recordDate, `${label}.recordDate`),
    sourceUrl: safeSourceUrl(source.sourceUrl),
    provenance: nullableNonBlank(source.provenance, `${label}.provenance`),
    verificationStatus: nullableNonBlank(source.verificationStatus, `${label}.verificationStatus`),
    availableAtUtc: nullableNonBlank(source.availableAtUtc, `${label}.availableAtUtc`),
  };
}

function eventItem(raw: unknown, label: string): EventItem {
  const source = object(raw, label);
  requireKeys(source, label, ["eventType", "eventDate", "title"]);
  return {
    eventType: nonBlank(source.eventType, `${label}.eventType`),
    eventDate: nonBlank(source.eventDate, `${label}.eventDate`),
    title: nonBlank(source.title, `${label}.title`),
    sourceUrl: safeSourceUrl(source.sourceUrl),
    provenance: nullableNonBlank(source.provenance, `${label}.provenance`),
    availableAtUtc: nullableNonBlank(source.availableAtUtc, `${label}.availableAtUtc`),
  };
}

function fundamental(raw: unknown, label: string): FundamentalItem {
  const source = object(raw, label);
  requireKeys(source, label, ["period", "metric", "value"]);
  const value = nullableFinite(source.value, `${label}.value`);
  const unavailableReason = nullableNonBlank(source.unavailableReason, `${label}.unavailableReason`);
  // Spec §3: Value null ⇔ UnavailableReason — never render a blank metric as 0.
  if (value == null && unavailableReason == null) {
    throw new Error(`${ERR}: ${label}.unavailableReason is required when value is null`);
  }
  return {
    period: nonBlank(source.period, `${label}.period`),
    periodEndDate: nullableNonBlank(source.periodEndDate, `${label}.periodEndDate`),
    metric: nonBlank(source.metric, `${label}.metric`),
    value,
    unit: nullableNonBlank(source.unit, `${label}.unit`),
    unavailableReason,
    publishedDate: nullableNonBlank(source.publishedDate, `${label}.publishedDate`),
    availableAtUtc: nullableNonBlank(source.availableAtUtc, `${label}.availableAtUtc`),
    asOfUtc: nullableNonBlank(source.asOfUtc, `${label}.asOfUtc`),
    source: nullableNonBlank(source.source, `${label}.source`),
    sourceUrl: safeSourceUrl(source.sourceUrl),
    note: nullableNonBlank(source.note, `${label}.note`),
    documentId: nullableNonBlank(source.documentId, `${label}.documentId`),
    sourceLocation: nullableNonBlank(source.sourceLocation, `${label}.sourceLocation`),
  };
}

export function parseEquityContext(value: unknown, symbol: string): EquityContext {
  const source = object(value, "context");
  requireKeys(source, "context", ["contractVersion", "symbol", "generatedAtUtc", "relativeStrength", "corporateActions", "events", "fundamentals"]);
  return {
    contractVersion: requireContractVersion(source.contractVersion, "context.contractVersion", CONTEXT_CONTRACT),
    symbol: requireSymbol(source.symbol, "context.symbol", symbol),
    generatedAtUtc: nonBlank(source.generatedAtUtc, "context.generatedAtUtc"),
    relativeStrength: section(source.relativeStrength, "context.relativeStrength", "benchmarks", rsBenchmark),
    corporateActions: section(source.corporateActions, "context.corporateActions", "items", corporateAction),
    events: section(source.events, "context.events", "items", eventItem),
    fundamentals: section(source.fundamentals, "context.fundamentals", "items", fundamental),
    limitations: additiveStringArray(source.limitations, "context.limitations"),
  };
}

// --- formatting -------------------------------------------------------------------

/**
 * Fundamentals value by unit (spec §11 — source-published values, never rescaled):
 * `percent` → already a percent number (ROE 18.2 → "18,20%"); `ratio` → a multiple
 * (PB 1.40 → "1,40×"); `VND` → money (BVPS). Null → dash (reason rendered separately).
 */
export function formatFundamentalValue(item: { metric: string; value: number | null; unit: string | null }): string {
  if (item.value == null || !Number.isFinite(item.value)) return "—";
  const fmt = (v: number) => v.toLocaleString("vi-VN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (item.unit === "VND") return `${Math.round(item.value).toLocaleString("vi-VN")} ₫`;
  if (item.unit === "percent") return `${fmt(item.value)}%`;
  if (item.unit === "ratio") return `${fmt(item.value)}×`;
  return `${fmt(item.value)}${item.unit ? ` ${item.unit}` : ""}`;
}

/** Barrier fraction → "+5%" / "−4%". */
export function formatBarrier(fraction: number, sign: "+" | "-"): string {
  const pct = Math.abs(fraction) * 100;
  return `${sign === "+" ? "+" : "−"}${pct.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%`;
}

/** Fraction → signed percent ("+1,20%"); null → honest dash. */
export function formatFractionPct(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toLocaleString("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function formatProbability(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 3): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
