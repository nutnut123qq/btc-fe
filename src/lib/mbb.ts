// MBB instrument contract (MBB-06): strict fail-closed parsers + view helpers
// for the dedicated /api/mbb/* lane. Same posture as currentConditions.ts —
// required keys must exist, enums are contract-frozen, and only fields the
// backend contract marks optional may be null. Errors name the field.
//
// NOTE: /api/mbb/candles|conditions|data-quality are served by
// MbbMarketDataController but are not yet in the pinned openapi.json (contract
// regen for MBB-06A still pending) — these types mirror the C# DTOs in
// backend/Services/Models/InstrumentCandleModels.cs + MbbPositionModels.cs.

import { getInstrument, isTimeframeActiveFor } from "./marketScope.ts";
import type { KlineOHLC } from "./types.ts";

const ERR = "INVALID_MBB_RESPONSE";

export const MBB_SYMBOL = "MBB";

// Contract-frozen scope (MBB-00/01): HOSE equity, VND, VCI primary + KBS
// cross-check, adjusted price basis, exactly 1h/1d — no synthetic 4h.
export const MBB_TIMEFRAMES = (getInstrument(MBB_SYMBOL)?.activeTimeframes ?? []) as readonly string[];
export type MbbTimeframe = "1h" | "1d";
export const MBB_DEFAULT_TIMEFRAME: MbbTimeframe = "1d";

export function isMbbTimeframe(value: unknown): value is MbbTimeframe {
  return typeof value === "string" && isTimeframeActiveFor(MBB_SYMBOL, value);
}

export function normalizeMbbTimeframe(value: unknown): MbbTimeframe {
  return isMbbTimeframe(value) ? value : MBB_DEFAULT_TIMEFRAME;
}

export const MBB_ACTIONS = ["hold", "wait", "buy-more", "reduce", "sell", "conditional-sell"] as const;
export type MbbDecisionAction = (typeof MBB_ACTIONS)[number];

export const MBB_ACTION_LABELS: Record<MbbDecisionAction, string> = {
  hold: "Giữ",
  wait: "Chờ",
  "buy-more": "Mua thêm",
  reduce: "Giảm",
  sell: "Bán",
  "conditional-sell": "Bán có điều kiện",
};

export interface MbbCandle {
  openTimeMs: number;
  timeIso: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTimeMs: number;
  /** Binance-only fields — equity providers never publish them; null = absent, not zero. */
  quoteVolume: number | null;
  tradeCount: number | null;
  takerBuyVolume: number | null;
  takerBuyQuoteVolume: number | null;
}

export interface MbbDecisionTrigger {
  name: string;
  timeframe: MbbTimeframe;
  condition: string;
  /** e.g. "close-below" — the direction the conditional order watches. */
  direction: string | null;
  priceLevelVnd: number | null;
  /** null = trigger could not be band-checked (e.g. no reference price). */
  withinPriceBand: boolean | null;
  nonFillRisk: string | null;
}

export interface MbbPositionSummary {
  totalShares: number;
  settledShares: number;
  pendingShares: number;
  sellableSharesNow: number;
  avgCostPerShareVnd: number | null;
  lastPriceVnd: number | null;
  unrealizedPnlVnd: number | null;
  unrealizedPnlPct: number | null;
  netProceedsIfSellableNowVnd: number | null;
}

export interface MbbBuyMoreCapacity {
  maxBuyableShares: number;
  maxBuyableLots: number;
  estimatedCostVnd: number;
}

export interface MbbMarketContext {
  trend: string;
  rsiZone: string;
  rsi14: number | null;
  atr14: number | null;
  sma50: number | null;
  ema50: number | null;
  lastDailyCloseVnd: number | null;
  previousDailyCloseVnd: number | null;
  latestHourlyCloseVnd: number | null;
  ceilingPriceVnd: number | null;
  floorPriceVnd: number | null;
}

export interface MbbTimeframeFreshness {
  timeframe: MbbTimeframe;
  latestOpenTimeMs: number | null;
  latestExpectedFinalizedOpenMs: number | null;
  isStale: boolean;
}

export interface MbbDecision {
  symbol: string;
  action: MbbDecisionAction;
  reasons: string[];
  triggers: MbbDecisionTrigger[];
  invalidation: string | null;
  position: MbbPositionSummary;
  buyMore: MbbBuyMoreCapacity | null;
  market: MbbMarketContext;
  evidenceStatus: string;
  priceBasis: string;
  dataFreshness: MbbTimeframeFreshness[];
  generatedAtUtc: string;
}

export interface MbbPositionLot {
  id: number;
  quantity: number;
  costPerShareVnd: number;
  /** yyyy-MM-dd VN trade date. */
  acquireDate: string;
  settleDate: string;
  settled: boolean;
  source: string;
}

export interface MbbPosition {
  symbol: string;
  totalShares: number;
  settledShares: number;
  pendingShares: number;
  avgCostPerShareVnd: number | null;
  availableCashVnd: number;
  updatedAtUtc: string | null;
  lots: MbbPositionLot[];
}

export interface UpdateMbbPositionLotItem {
  quantity: number;
  costPerShareVnd: number;
  acquireDate: string;
}

export interface UpdateMbbPositionRequest {
  lots: UpdateMbbPositionLotItem[];
  availableCashVnd: number;
}

export interface MbbGapRange {
  startOpenTimeMs: number;
  endOpenTimeMs: number;
  missingBars: number;
}

export interface MbbTimeframeCoverage {
  timeframe: MbbTimeframe;
  totalBars: number;
  firstOpenUtc: string | null;
  lastOpenUtc: string | null;
  expectedBars: number;
  missingBars: number;
  coveragePct: number;
  gapRangeCount: number;
  topGaps: MbbGapRange[];
  unexpectedSessionBars: number;
  unexpectedSessionOpenTimeMs: number[];
  invalidOhlcvRows: number;
  latestExpectedFinalizedOpenUtc: string | null;
  latestBarAgeSeconds: number | null;
  isStale: boolean;
}

export interface MbbCoverageReport {
  symbol: string;
  provider: string;
  crossCheckProvider: string;
  priceBasis: string;
  venue: string;
  sourceTimezone: string;
  generatedAtUtc: string;
  timeframes: MbbTimeframeCoverage[];
  limitations: string[];
}

// --- parse primitives -------------------------------------------------------

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

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${ERR}: ${label} must be a finite number`);
  }
  return value;
}

function nullableFinite(value: unknown, label: string): number | null {
  return value == null ? null : finite(value, label);
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${ERR}: ${label} must be boolean`);
  return value;
}

function nullableBool(value: unknown, label: string): boolean | null {
  return value == null ? null : bool(value, label);
}

function stringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an array`);
  return value.map((item, index) => nonBlank(item, `${label}[${index}]`));
}

function integerArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: ${label} must be an array`);
  return value.map((item, index) => integer(item, `${label}[${index}]`));
}

function mbbTimeframe(value: unknown, label: string): MbbTimeframe {
  const parsed = nonBlank(value, label);
  if (!isMbbTimeframe(parsed)) {
    throw new Error(`${ERR}: ${label} must be one of ${MBB_TIMEFRAMES.join("/")}; got "${parsed}"`);
  }
  return parsed as MbbTimeframe;
}

function requireMbbSymbol(value: unknown, label: string): string {
  const parsed = nonBlank(value, label);
  if (parsed !== MBB_SYMBOL) throw new Error(`${ERR}: ${label} must be "${MBB_SYMBOL}"; got "${parsed}"`);
  return parsed;
}

// --- candles ----------------------------------------------------------------

function mbbCandle(value: unknown, index: number): MbbCandle {
  const label = `mbbCandles[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, [
    "openTimeMs", "timeIso", "open", "high", "low", "close", "volume", "closeTimeMs",
    "quoteVolume", "tradeCount", "takerBuyVolume", "takerBuyQuoteVolume",
  ]);
  const open = finite(source.open, `${label}.open`);
  const high = finite(source.high, `${label}.high`);
  const low = finite(source.low, `${label}.low`);
  const close = finite(source.close, `${label}.close`);
  const volume = finite(source.volume, `${label}.volume`);
  if (high < low) throw new Error(`${ERR}: ${label}.high must not be below low`);
  if (volume < 0) throw new Error(`${ERR}: ${label}.volume must not be negative`);
  return {
    openTimeMs: integer(source.openTimeMs, `${label}.openTimeMs`),
    timeIso: nonBlank(source.timeIso, `${label}.timeIso`),
    open,
    high,
    low,
    close,
    volume,
    closeTimeMs: integer(source.closeTimeMs, `${label}.closeTimeMs`),
    quoteVolume: nullableFinite(source.quoteVolume, `${label}.quoteVolume`),
    tradeCount: nullableInteger(source.tradeCount, `${label}.tradeCount`),
    takerBuyVolume: nullableFinite(source.takerBuyVolume, `${label}.takerBuyVolume`),
    takerBuyQuoteVolume: nullableFinite(source.takerBuyQuoteVolume, `${label}.takerBuyQuoteVolume`),
  };
}

export function parseMbbCandles(value: unknown): MbbCandle[] {
  if (!Array.isArray(value)) throw new Error(`${ERR}: mbbCandles must be an array`);
  const candles = value.map(mbbCandle);
  for (let index = 1; index < candles.length; index++) {
    if (candles[index].openTimeMs <= candles[index - 1].openTimeMs) {
      throw new Error(`${ERR}: mbbCandles must be in ascending openTimeMs order`);
    }
  }
  return candles;
}

/** Projection to the shared chart shape — Binance-only fields are dropped, never zero-filled. */
export function mbbCandleToKline(candle: MbbCandle): KlineOHLC {
  return {
    openTimeMs: candle.openTimeMs,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}

export function mbbCandlesToKlines(candles: MbbCandle[]): KlineOHLC[] {
  return candles.map(mbbCandleToKline);
}

// --- position ----------------------------------------------------------------

function mbbPositionLot(value: unknown, index: number): MbbPositionLot {
  const label = `mbbPosition.lots[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["id", "quantity", "costPerShareVnd", "acquireDate", "settleDate", "settled", "source"]);
  return {
    id: integer(source.id, `${label}.id`),
    quantity: integer(source.quantity, `${label}.quantity`, 1),
    costPerShareVnd: finite(source.costPerShareVnd, `${label}.costPerShareVnd`),
    acquireDate: nonBlank(source.acquireDate, `${label}.acquireDate`),
    settleDate: nonBlank(source.settleDate, `${label}.settleDate`),
    settled: bool(source.settled, `${label}.settled`),
    source: nonBlank(source.source, `${label}.source`),
  };
}

export function parseMbbPosition(value: unknown): MbbPosition {
  const source = object(value, "mbbPosition");
  requireKeys(source, "mbbPosition", [
    "symbol", "totalShares", "settledShares", "pendingShares", "avgCostPerShareVnd",
    "availableCashVnd", "updatedAtUtc", "lots",
  ]);
  if (!Array.isArray(source.lots)) throw new Error(`${ERR}: mbbPosition.lots must be an array`);
  return {
    symbol: requireMbbSymbol(source.symbol, "mbbPosition.symbol"),
    totalShares: integer(source.totalShares, "mbbPosition.totalShares"),
    settledShares: integer(source.settledShares, "mbbPosition.settledShares"),
    pendingShares: integer(source.pendingShares, "mbbPosition.pendingShares"),
    avgCostPerShareVnd: nullableFinite(source.avgCostPerShareVnd, "mbbPosition.avgCostPerShareVnd"),
    availableCashVnd: finite(source.availableCashVnd, "mbbPosition.availableCashVnd"),
    updatedAtUtc: nullableNonBlank(source.updatedAtUtc, "mbbPosition.updatedAtUtc"),
    lots: source.lots.map(mbbPositionLot),
  };
}

// --- decision ---------------------------------------------------------------

function decisionTrigger(value: unknown, index: number): MbbDecisionTrigger {
  const label = `mbbDecision.triggers[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["name", "timeframe", "condition", "direction", "priceLevelVnd", "withinPriceBand", "nonFillRisk"]);
  return {
    name: nonBlank(source.name, `${label}.name`),
    timeframe: mbbTimeframe(source.timeframe, `${label}.timeframe`),
    condition: nonBlank(source.condition, `${label}.condition`),
    direction: nullableNonBlank(source.direction, `${label}.direction`),
    priceLevelVnd: nullableFinite(source.priceLevelVnd, `${label}.priceLevelVnd`),
    withinPriceBand: nullableBool(source.withinPriceBand, `${label}.withinPriceBand`),
    nonFillRisk: nullableNonBlank(source.nonFillRisk, `${label}.nonFillRisk`),
  };
}

function positionSummary(value: unknown): MbbPositionSummary {
  const label = "mbbDecision.position";
  const source = object(value, label);
  requireKeys(source, label, [
    "totalShares", "settledShares", "pendingShares", "sellableSharesNow",
    "avgCostPerShareVnd", "lastPriceVnd", "unrealizedPnlVnd", "unrealizedPnlPct", "netProceedsIfSellableNowVnd",
  ]);
  return {
    totalShares: integer(source.totalShares, `${label}.totalShares`),
    settledShares: integer(source.settledShares, `${label}.settledShares`),
    pendingShares: integer(source.pendingShares, `${label}.pendingShares`),
    sellableSharesNow: integer(source.sellableSharesNow, `${label}.sellableSharesNow`),
    avgCostPerShareVnd: nullableFinite(source.avgCostPerShareVnd, `${label}.avgCostPerShareVnd`),
    lastPriceVnd: nullableFinite(source.lastPriceVnd, `${label}.lastPriceVnd`),
    unrealizedPnlVnd: nullableFinite(source.unrealizedPnlVnd, `${label}.unrealizedPnlVnd`),
    unrealizedPnlPct: nullableFinite(source.unrealizedPnlPct, `${label}.unrealizedPnlPct`),
    netProceedsIfSellableNowVnd: nullableFinite(source.netProceedsIfSellableNowVnd, `${label}.netProceedsIfSellableNowVnd`),
  };
}

function buyMoreCapacity(value: unknown): MbbBuyMoreCapacity | null {
  if (value == null) return null;
  const label = "mbbDecision.buyMore";
  const source = object(value, label);
  requireKeys(source, label, ["maxBuyableShares", "maxBuyableLots", "estimatedCostVnd"]);
  return {
    maxBuyableShares: integer(source.maxBuyableShares, `${label}.maxBuyableShares`),
    maxBuyableLots: integer(source.maxBuyableLots, `${label}.maxBuyableLots`),
    estimatedCostVnd: finite(source.estimatedCostVnd, `${label}.estimatedCostVnd`),
  };
}

function marketContext(value: unknown): MbbMarketContext {
  const label = "mbbDecision.market";
  const source = object(value, label);
  requireKeys(source, label, [
    "trend", "rsiZone", "rsi14", "atr14", "sma50", "ema50",
    "lastDailyCloseVnd", "previousDailyCloseVnd", "latestHourlyCloseVnd",
    "ceilingPriceVnd", "floorPriceVnd",
  ]);
  return {
    trend: nonBlank(source.trend, `${label}.trend`),
    rsiZone: nonBlank(source.rsiZone, `${label}.rsiZone`),
    rsi14: nullableFinite(source.rsi14, `${label}.rsi14`),
    atr14: nullableFinite(source.atr14, `${label}.atr14`),
    sma50: nullableFinite(source.sma50, `${label}.sma50`),
    ema50: nullableFinite(source.ema50, `${label}.ema50`),
    lastDailyCloseVnd: nullableFinite(source.lastDailyCloseVnd, `${label}.lastDailyCloseVnd`),
    previousDailyCloseVnd: nullableFinite(source.previousDailyCloseVnd, `${label}.previousDailyCloseVnd`),
    latestHourlyCloseVnd: nullableFinite(source.latestHourlyCloseVnd, `${label}.latestHourlyCloseVnd`),
    ceilingPriceVnd: nullableFinite(source.ceilingPriceVnd, `${label}.ceilingPriceVnd`),
    floorPriceVnd: nullableFinite(source.floorPriceVnd, `${label}.floorPriceVnd`),
  };
}

function timeframeFreshness(value: unknown, index: number): MbbTimeframeFreshness {
  const label = `mbbDecision.dataFreshness[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, ["timeframe", "latestOpenTimeMs", "latestExpectedFinalizedOpenMs", "isStale"]);
  return {
    timeframe: mbbTimeframe(source.timeframe, `${label}.timeframe`),
    latestOpenTimeMs: nullableInteger(source.latestOpenTimeMs, `${label}.latestOpenTimeMs`),
    latestExpectedFinalizedOpenMs: nullableInteger(source.latestExpectedFinalizedOpenMs, `${label}.latestExpectedFinalizedOpenMs`),
    isStale: bool(source.isStale, `${label}.isStale`),
  };
}

export function parseMbbDecision(value: unknown): MbbDecision {
  const source = object(value, "mbbDecision");
  requireKeys(source, "mbbDecision", [
    "symbol", "action", "reasons", "triggers", "invalidation", "position", "buyMore",
    "market", "evidenceStatus", "priceBasis", "dataFreshness", "generatedAtUtc",
  ]);
  const action = nonBlank(source.action, "mbbDecision.action");
  if (!(MBB_ACTIONS as readonly string[]).includes(action)) {
    throw new Error(`${ERR}: mbbDecision.action is unsupported ("${action}")`);
  }
  const priceBasis = nonBlank(source.priceBasis, "mbbDecision.priceBasis");
  if (priceBasis !== "adjusted") {
    throw new Error(`${ERR}: mbbDecision.priceBasis must be "adjusted"; got "${priceBasis}"`);
  }
  if (!Array.isArray(source.reasons)) throw new Error(`${ERR}: mbbDecision.reasons must be an array`);
  if (!Array.isArray(source.triggers)) throw new Error(`${ERR}: mbbDecision.triggers must be an array`);
  if (!Array.isArray(source.dataFreshness)) throw new Error(`${ERR}: mbbDecision.dataFreshness must be an array`);
  return {
    symbol: requireMbbSymbol(source.symbol, "mbbDecision.symbol"),
    action: action as MbbDecisionAction,
    reasons: stringArray(source.reasons, "mbbDecision.reasons"),
    triggers: source.triggers.map(decisionTrigger),
    invalidation: nullableNonBlank(source.invalidation, "mbbDecision.invalidation"),
    position: positionSummary(source.position),
    buyMore: buyMoreCapacity(source.buyMore),
    market: marketContext(source.market),
    evidenceStatus: nonBlank(source.evidenceStatus, "mbbDecision.evidenceStatus"),
    priceBasis,
    dataFreshness: source.dataFreshness.map(timeframeFreshness),
    generatedAtUtc: nonBlank(source.generatedAtUtc, "mbbDecision.generatedAtUtc"),
  };
}

// --- data quality -----------------------------------------------------------

function gapRange(value: unknown, label: string): MbbGapRange {
  const source = object(value, label);
  requireKeys(source, label, ["startOpenTimeMs", "endOpenTimeMs", "missingBars"]);
  return {
    startOpenTimeMs: integer(source.startOpenTimeMs, `${label}.startOpenTimeMs`),
    endOpenTimeMs: integer(source.endOpenTimeMs, `${label}.endOpenTimeMs`),
    missingBars: integer(source.missingBars, `${label}.missingBars`, 1),
  };
}

function timeframeCoverage(value: unknown, index: number): MbbTimeframeCoverage {
  const label = `mbbCoverage.timeframes[${index}]`;
  const source = object(value, label);
  requireKeys(source, label, [
    "timeframe", "totalBars", "firstOpenUtc", "lastOpenUtc", "expectedBars", "missingBars",
    "coveragePct", "gapRangeCount", "topGaps", "unexpectedSessionBars", "unexpectedSessionOpenTimeMs",
    "invalidOhlcvRows", "latestExpectedFinalizedOpenUtc", "latestBarAgeSeconds", "isStale",
  ]);
  if (!Array.isArray(source.topGaps)) throw new Error(`${ERR}: ${label}.topGaps must be an array`);
  const coveragePct = finite(source.coveragePct, `${label}.coveragePct`);
  if (coveragePct < 0 || coveragePct > 100) throw new Error(`${ERR}: ${label}.coveragePct must be within [0, 100]`);
  return {
    timeframe: mbbTimeframe(source.timeframe, `${label}.timeframe`),
    totalBars: integer(source.totalBars, `${label}.totalBars`),
    firstOpenUtc: nullableNonBlank(source.firstOpenUtc, `${label}.firstOpenUtc`),
    lastOpenUtc: nullableNonBlank(source.lastOpenUtc, `${label}.lastOpenUtc`),
    expectedBars: integer(source.expectedBars, `${label}.expectedBars`),
    missingBars: integer(source.missingBars, `${label}.missingBars`),
    coveragePct,
    gapRangeCount: integer(source.gapRangeCount, `${label}.gapRangeCount`),
    topGaps: source.topGaps.map((gap, gapIndex) => gapRange(gap, `${label}.topGaps[${gapIndex}]`)),
    unexpectedSessionBars: integer(source.unexpectedSessionBars, `${label}.unexpectedSessionBars`),
    unexpectedSessionOpenTimeMs: integerArray(source.unexpectedSessionOpenTimeMs, `${label}.unexpectedSessionOpenTimeMs`),
    invalidOhlcvRows: integer(source.invalidOhlcvRows, `${label}.invalidOhlcvRows`),
    latestExpectedFinalizedOpenUtc: nullableNonBlank(source.latestExpectedFinalizedOpenUtc, `${label}.latestExpectedFinalizedOpenUtc`),
    latestBarAgeSeconds: nullableFinite(source.latestBarAgeSeconds, `${label}.latestBarAgeSeconds`),
    isStale: bool(source.isStale, `${label}.isStale`),
  };
}

export function parseMbbCoverageReport(value: unknown): MbbCoverageReport {
  const source = object(value, "mbbCoverage");
  requireKeys(source, "mbbCoverage", [
    "symbol", "provider", "crossCheckProvider", "priceBasis", "venue", "sourceTimezone",
    "generatedAtUtc", "timeframes", "limitations",
  ]);
  if (!Array.isArray(source.timeframes)) throw new Error(`${ERR}: mbbCoverage.timeframes must be an array`);
  return {
    symbol: requireMbbSymbol(source.symbol, "mbbCoverage.symbol"),
    provider: nonBlank(source.provider, "mbbCoverage.provider"),
    crossCheckProvider: nonBlank(source.crossCheckProvider, "mbbCoverage.crossCheckProvider"),
    priceBasis: nonBlank(source.priceBasis, "mbbCoverage.priceBasis"),
    venue: nonBlank(source.venue, "mbbCoverage.venue"),
    sourceTimezone: nonBlank(source.sourceTimezone, "mbbCoverage.sourceTimezone"),
    generatedAtUtc: nonBlank(source.generatedAtUtc, "mbbCoverage.generatedAtUtc"),
    timeframes: source.timeframes.map(timeframeCoverage),
    limitations: stringArray(source.limitations, "mbbCoverage.limitations"),
  };
}

// --- formatting -------------------------------------------------------------

const VND_FORMATTER = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const SHARE_FORMATTER = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** VND money amount; null renders as an honest dash — never a fabricated 0. */
export function formatVnd(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${VND_FORMATTER.format(value)} ₫`;
}

export function formatShares(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? "—" : `${SHARE_FORMATTER.format(value)} cp`;
}

export function formatMbbPct(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : `${value.toLocaleString("vi-VN", { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

/** VN session wall-clock for a Unix-ms timestamp (HOSE timezone). */
export function formatVnDateTime(timeMs: number | null | undefined): string {
  if (timeMs == null || !Number.isFinite(timeMs)) return "—";
  return new Date(timeMs).toLocaleString("vi-VN", { hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
}
