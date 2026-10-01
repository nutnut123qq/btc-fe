import type { KlineOHLC, SmartMoneyStructureDto } from "./types.ts";
import { intervalToMs, isActiveTimeframe, type ActiveTimeframe } from "./timeframe.ts";

export const TECHNICAL_REPLAY_SYMBOL = "BTCUSDT" as const;
export const TECHNICAL_REPLAY_CONTEXT_RULE = "evaluate the latest gap-free, valid-duration stored history segment, then return events whose origin is inside the requested lookback window" as const;

const EVENT_TYPES = new Set<SmartMoneyStructureDto["eventType"]>([
  "BOS_BULL",
  "BOS_BEAR",
  "CHOCH_BULL",
  "CHOCH_BEAR",
  "FVG_BULL",
  "FVG_BEAR",
  "SWING_HIGH",
  "SWING_LOW",
]);

const EVENT_STATES = new Set(["confirmed", "active", "mitigated"] as const);

export type TechnicalReplayEventState = "confirmed" | "active" | "mitigated";

export type TechnicalReplaySourceCandle = {
  openTimeMs: number;
  closeTimeMs: number;
  role: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type TechnicalReplayCandle = KlineOHLC & {
  closeTimeMs: number;
};

export type TechnicalReplayEvent = SmartMoneyStructureDto & {
  eventId: string;
  originTimeMs: number;
  availableTimeMs: number;
  referenceTimeMs: number | null;
  mitigatedAtMs: number | null;
  invalidatedAtMs: number | null;
  mitigationRule: string | null;
  invalidationRule: null;
  calculationVersion: string;
  stateAtAsOf: TechnicalReplayEventState;
  sourceCandles: TechnicalReplaySourceCandle[];
  detectionConditions: string[];
  limitations: string[];
};

export const TECHNICAL_LAYER_KEYS = [
  "technicalIndicators",
  "candlePatterns",
  "volumeAnomaly",
  "marketRegime",
  "fibonacci",
  "volumeProfile",
  "confluence",
] as const;

export type TechnicalLayerKey = typeof TECHNICAL_LAYER_KEYS[number];
export type TechnicalLayerAvailability = "available" | "partial" | "unavailable";

export type TechnicalLayerLineage = {
  moduleContractVersion: string;
  moduleContractSha256: string;
  producer: string;
  calculationVersion: string;
  source: "stored-finalized-klines";
  evaluationMode: "point-in-time-reconstruction";
  requestedAsOfTimeMs: number;
  effectiveAsOfTimeMs: number | null;
  availableTimeMs: number | null;
  sourceStartTimeMs: number | null;
  sourceEndTimeMs: number | null;
  sourceCandleCount: number;
  requiredWarmupBars: number;
  isCausal: true;
  isPersisted: false;
};

export type TechnicalLayerEnvelope<T> = {
  layerKey: TechnicalLayerKey;
  availability: TechnicalLayerAvailability;
  lineage: TechnicalLayerLineage;
  unavailableReason: string | null;
  limitations: string[];
  payload: T | null;
};

export type TechnicalIndicatorReplay = {
  openTimeMs: number;
  availableTimeMs: number;
  rsi14: number | null;
  ema12: number | null;
  ema26: number | null;
  sma50: number | null;
  events: Array<{ eventType: string; direction: -1 | 1; value: number }>;
};

export type CandlePatternReplay = {
  events: Array<{
    patternType: string;
    patternCategory: string;
    trendDirection: string;
    originTimeMs: number;
    availableTimeMs: number;
    sourceOpenTimeMs: number[];
  }>;
};

export type VolumeAnomalyReplay = {
  openTimeMs: number;
  availableTimeMs: number;
  volume: number;
  volumeSma20: number;
  volumeAnomalyRatio: number;
  volumeVsPrevious: number;
  volumeVsMax10: number;
  volumeTrend: string;
  triggeredEvents: string[];
};

export type MarketRegimeReplay = {
  openTimeMs: number;
  availableTimeMs: number;
  regimeType: string;
  trend: string;
  volatility: string;
  eventType: string | null;
  upChanges: number;
  downChanges: number;
  currentTrueRangePct: number;
  priorMedianTrueRangePct: number;
  rangeRatio: number;
};

export type FibonacciReplay = {
  eventType: string;
  availableTimeMs: number;
  direction: string;
  anchorStartTimeMs: number;
  anchorEndTimeMs: number;
  anchorLow: number;
  anchorHigh: number;
  levels: Array<{ ratio: number; price: number }>;
};

export type VolumeProfileReplay = {
  method: string;
  binCount: number;
  valueAreaFraction: number;
  windowStartMs: number;
  windowEndMs: number;
  inputVolume: number;
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  bins: Array<{ priceLevel: number; volume: number; volumePct: number; isPoc: boolean; isValueArea: boolean }>;
  events: string[];
};

export type ConfluenceReplay = {
  availableTimeMs: number;
  eventType: string | null;
  triggeredEvents: string[];
  score: number;
  scoreKind: "descriptive_regime_index";
  isProbability: false;
  overallDirection: string;
  hasConflict: boolean;
  alignedDirectionalModules: number;
  moduleVotes: Array<{ layerKey: Exclude<TechnicalLayerKey, "confluence">; vote: -1 | 1; reason: string; availableTimeMs: number }>;
};

export type TechnicalReplayLayers = {
  indicators: TechnicalLayerEnvelope<TechnicalIndicatorReplay>;
  candlePatterns: TechnicalLayerEnvelope<CandlePatternReplay>;
  volumeAnomaly: TechnicalLayerEnvelope<VolumeAnomalyReplay>;
  marketRegime: TechnicalLayerEnvelope<MarketRegimeReplay>;
  fibonacci: TechnicalLayerEnvelope<FibonacciReplay>;
  volumeProfile: TechnicalLayerEnvelope<VolumeProfileReplay>;
  confluence: TechnicalLayerEnvelope<ConfluenceReplay>;
};

export type TechnicalLayerCoverage = {
  layerKey: TechnicalLayerKey;
  availability: TechnicalLayerAvailability;
  sourceBars: number;
  requiredWarmupBars: number;
  latestAvailableTimeMs: number | null;
  hasGapBoundary: boolean;
  checkpointStatus: string;
  storageStatus: "sparse_event_envelope_materialized" | "on_demand_state_checkpoint_processed" | "on_demand_state_not_checkpointed";
  isEventEnvelopeMaterializedAtAsOf: boolean;
};

export type TechnicalReplayEnvelope = {
  moduleContractVersion: string;
  moduleContractSha256: string;
  symbol: typeof TECHNICAL_REPLAY_SYMBOL;
  timeframe: ActiveTimeframe;
  requestedAsOfTimeMs: number;
  effectiveAsOfTimeMs: number | null;
  lastFinalizedCandleCloseTimeMs: number | null;
  requestedLookbackBars: number;
  replayWindowStartTimeMs: number | null;
  contiguousSegmentStartTimeMs: number | null;
  sourceCandleCount: number;
  analysisCandleCount: number;
  calculationVersion: string;
  provenance: {
    source: "stored-finalized-klines";
    evaluationMode: "point-in-time-reconstruction";
    availabilityRule: "candle.closeTimeMs <= requestedAsOfTimeMs";
    contextRule: typeof TECHNICAL_REPLAY_CONTEXT_RULE;
    persistedByReplay: false;
  };
  limitations: string[];
  candles: TechnicalReplayCandle[];
  events: TechnicalReplayEvent[];
  layers: TechnicalReplayLayers;
  coverage: TechnicalLayerCoverage[];
  administration: {
    hasGapBoundary: boolean;
    contextLimitBars: number;
    legacySmartMoneyStatus: string;
    rebuildRequired: boolean;
    rebuildReason: string | null;
  };
};

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be a non-empty string`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be a finite number`);
  }
  return value;
}

function requireNonNegativeInteger(value: unknown, label: string): number {
  const parsed = requireFiniteNumber(value, label);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be a non-negative integer`);
  }
  return parsed;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be a boolean`);
  }
  return value;
}

function requireSha256(value: unknown, label: string): string {
  const parsed = requireString(value, label);
  if (!/^[a-f0-9]{64}$/i.test(parsed)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be a SHA-256 digest`);
  }
  return parsed;
}

function nullableFiniteNumber(value: unknown, label: string): number | null {
  if (value == null) return null;
  return requireFiniteNumber(value, label);
}

function nullableString(value: unknown, label: string): string | null {
  if (value == null) return null;
  return requireString(value, label);
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must be an array`);
  }
  return value.map((item, index) => requireString(item, `${label}[${index}]`));
}

function parseSourceCandle(value: unknown, index: number): TechnicalReplaySourceCandle {
  const row = requireRecord(value, `events[].sourceCandles[${index}]`);
  const open = requireFiniteNumber(row.open, `sourceCandles[${index}].open`);
  const high = requireFiniteNumber(row.high, `sourceCandles[${index}].high`);
  const low = requireFiniteNumber(row.low, `sourceCandles[${index}].low`);
  const close = requireFiniteNumber(row.close, `sourceCandles[${index}].close`);
  if (high < low || high < Math.max(open, close) || low > Math.min(open, close)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: sourceCandles[${index}] has invalid OHLC geometry`);
  }
  const openTimeMs = requireFiniteNumber(row.openTimeMs, `sourceCandles[${index}].openTimeMs`);
  const closeTimeMs = requireFiniteNumber(row.closeTimeMs, `sourceCandles[${index}].closeTimeMs`);
  if (closeTimeMs <= openTimeMs) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: sourceCandles[${index}] close must be after open`);
  }
  return {
    openTimeMs,
    closeTimeMs,
    role: requireString(row.role, `sourceCandles[${index}].role`),
    open,
    high,
    low,
    close,
    volume: requireFiniteNumber(row.volume, `sourceCandles[${index}].volume`),
  };
}

function parseReplayCandle(value: unknown, index: number): TechnicalReplayCandle {
  const row = requireRecord(value, `candles[${index}]`);
  const openTimeMs = requireFiniteNumber(row.openTimeMs, `candles[${index}].openTimeMs`);
  const closeTimeMs = requireFiniteNumber(row.closeTimeMs, `candles[${index}].closeTimeMs`);
  const open = requireFiniteNumber(row.open, `candles[${index}].open`);
  const high = requireFiniteNumber(row.high, `candles[${index}].high`);
  const low = requireFiniteNumber(row.low, `candles[${index}].low`);
  const close = requireFiniteNumber(row.close, `candles[${index}].close`);
  const volume = requireFiniteNumber(row.volume, `candles[${index}].volume`);
  if (closeTimeMs <= openTimeMs || volume < 0 || high < low || high < Math.max(open, close) || low > Math.min(open, close)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: candles[${index}] has invalid finalized OHLCV data`);
  }
  return { openTimeMs, closeTimeMs, open, high, low, close, volume, isClosed: true };
}

function parseReplayEvent(value: unknown, index: number, envelope: {
  symbol: string;
  timeframe: ActiveTimeframe;
  effectiveAsOfTimeMs: number;
  calculationVersion: string;
}): TechnicalReplayEvent {
  const row = requireRecord(value, `events[${index}]`);
  const eventType = requireString(row.eventType, `events[${index}].eventType`);
  if (!EVENT_TYPES.has(eventType as SmartMoneyStructureDto["eventType"])) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}].eventType is unsupported`);
  }
  const state = requireString(row.stateAtAsOf, `events[${index}].stateAtAsOf`).toLowerCase();
  if (!EVENT_STATES.has(state as TechnicalReplayEventState)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}].stateAtAsOf is unsupported`);
  }
  const originTimeMs = requireFiniteNumber(row.originTimeMs, `events[${index}].originTimeMs`);
  const availableTimeMs = requireFiniteNumber(row.availableTimeMs, `events[${index}].availableTimeMs`);
  const referenceTimeMs = nullableFiniteNumber(row.referenceTimeMs, `events[${index}].referenceTimeMs`);
  const mitigatedAtMs = nullableFiniteNumber(row.mitigatedAtMs, `events[${index}].mitigatedAtMs`);
  const invalidatedAtMs = nullableFiniteNumber(row.invalidatedAtMs, `events[${index}].invalidatedAtMs`);
  const calculationVersion = requireString(row.calculationVersion, `events[${index}].calculationVersion`);
  if (availableTimeMs > envelope.effectiveAsOfTimeMs) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] was unavailable at effective as-of`);
  }
  if (originTimeMs > availableTimeMs) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] origin is after availability`);
  }
  if (calculationVersion !== envelope.calculationVersion) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] calculation version mismatch`);
  }
  if (state === "mitigated" && (mitigatedAtMs == null || mitigatedAtMs > envelope.effectiveAsOfTimeMs)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] mitigation is not available at as-of`);
  }
  if (invalidatedAtMs != null || row.invalidationRule != null) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] exposes unsupported invalidation state`);
  }
  if (!Array.isArray(row.sourceCandles) || row.sourceCandles.length === 0) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}].sourceCandles must not be empty`);
  }
  const sourceCandles = row.sourceCandles.map(parseSourceCandle);
  const mitigationSources = sourceCandles.filter((candle) => candle.role === "fvg-mitigation");
  for (const candle of sourceCandles) {
    if (candle.closeTimeMs > envelope.effectiveAsOfTimeMs) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] contains a source candle after effective as-of`);
    }
    if (candle.closeTimeMs > availableTimeMs) {
      const isProvenLifecycleSource = state === "mitigated"
        && candle.role === "fvg-mitigation"
        && mitigatedAtMs === candle.closeTimeMs;
      if (!isProvenLifecycleSource) {
        throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] contains an unproven future source candle`);
      }
    }
  }
  if (state === "mitigated" && (mitigationSources.length !== 1 || mitigationSources[0].closeTimeMs !== mitigatedAtMs)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] mitigation source does not prove state at as-of`);
  }
  if (state !== "mitigated" && mitigationSources.length > 0) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] has mitigation evidence without mitigated state`);
  }
  const price = requireFiniteNumber(row.price, `events[${index}].price`);
  const highPrice = nullableFiniteNumber(row.highPrice, `events[${index}].highPrice`);
  const lowPrice = nullableFiniteNumber(row.lowPrice, `events[${index}].lowPrice`);
  if (highPrice != null && lowPrice != null && highPrice < lowPrice) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: events[${index}] price range is inverted`);
  }
  return {
    id: index,
    eventId: requireString(row.eventId, `events[${index}].eventId`),
    symbol: envelope.symbol,
    timeframe: envelope.timeframe,
    timeMs: availableTimeMs,
    eventType: eventType as SmartMoneyStructureDto["eventType"],
    price,
    highPrice,
    lowPrice,
    isMitigated: state === "mitigated",
    description: requireString(row.description, `events[${index}].description`),
    createdAtUtc: new Date(availableTimeMs).toISOString(),
    originTimeMs,
    availableTimeMs,
    referenceTimeMs,
    mitigatedAtMs,
    invalidatedAtMs,
    mitigationRule: nullableString(row.mitigationRule, `events[${index}].mitigationRule`),
    invalidationRule: null,
    calculationVersion,
    stateAtAsOf: state as TechnicalReplayEventState,
    sourceCandles,
    detectionConditions: requireStringArray(row.detectionConditions, `events[${index}].detectionConditions`),
    limitations: requireStringArray(row.limitations, `events[${index}].limitations`),
  };
}

type LayerParseContext = {
  requestedAsOfTimeMs: number;
  effectiveAsOfTimeMs: number | null;
  moduleContractVersion: string;
  moduleContractSha256: string;
};

function parseLayerLineage(value: unknown, label: string, context: LayerParseContext): TechnicalLayerLineage {
  const row = requireRecord(value, `${label}.lineage`);
  const effectiveAsOfTimeMs = nullableFiniteNumber(row.effectiveAsOfTimeMs, `${label}.lineage.effectiveAsOfTimeMs`);
  const availableTimeMs = nullableFiniteNumber(row.availableTimeMs, `${label}.lineage.availableTimeMs`);
  const sourceStartTimeMs = nullableFiniteNumber(row.sourceStartTimeMs, `${label}.lineage.sourceStartTimeMs`);
  const sourceEndTimeMs = nullableFiniteNumber(row.sourceEndTimeMs, `${label}.lineage.sourceEndTimeMs`);
  if (
    row.moduleContractVersion !== context.moduleContractVersion
    || row.moduleContractSha256 !== context.moduleContractSha256
    || row.source !== "stored-finalized-klines"
    || row.evaluationMode !== "point-in-time-reconstruction"
    || row.requestedAsOfTimeMs !== context.requestedAsOfTimeMs
    || effectiveAsOfTimeMs !== context.effectiveAsOfTimeMs
    || row.isCausal !== true
    || row.isPersisted !== false
  ) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} lineage does not match the replay envelope`);
  }
  if (availableTimeMs != null && (effectiveAsOfTimeMs == null || availableTimeMs > effectiveAsOfTimeMs)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} is available after effective as-of`);
  }
  if ((sourceStartTimeMs == null) !== (sourceEndTimeMs == null)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} source boundaries are incomplete`);
  }
  if (sourceStartTimeMs != null && sourceEndTimeMs != null && (sourceStartTimeMs > sourceEndTimeMs || effectiveAsOfTimeMs == null || sourceEndTimeMs > effectiveAsOfTimeMs)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} source boundaries are not causal`);
  }
  return {
    moduleContractVersion: requireString(row.moduleContractVersion, `${label}.lineage.moduleContractVersion`),
    moduleContractSha256: requireSha256(row.moduleContractSha256, `${label}.lineage.moduleContractSha256`),
    producer: requireString(row.producer, `${label}.lineage.producer`),
    calculationVersion: requireString(row.calculationVersion, `${label}.lineage.calculationVersion`),
    source: "stored-finalized-klines",
    evaluationMode: "point-in-time-reconstruction",
    requestedAsOfTimeMs: context.requestedAsOfTimeMs,
    effectiveAsOfTimeMs,
    availableTimeMs,
    sourceStartTimeMs,
    sourceEndTimeMs,
    sourceCandleCount: requireNonNegativeInteger(row.sourceCandleCount, `${label}.lineage.sourceCandleCount`),
    requiredWarmupBars: requireNonNegativeInteger(row.requiredWarmupBars, `${label}.lineage.requiredWarmupBars`),
    isCausal: true,
    isPersisted: false,
  };
}

function parseLayer<T>(
  value: unknown,
  key: TechnicalLayerKey,
  context: LayerParseContext,
  parsePayload: (value: unknown, label: string, lineage: TechnicalLayerLineage) => T,
): TechnicalLayerEnvelope<T> {
  const label = `layers.${key}`;
  const row = requireRecord(value, label);
  if (row.layerKey !== key || !new Set(["available", "partial", "unavailable"]).has(String(row.availability))) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} key or availability is unsupported`);
  }
  const availability = row.availability as TechnicalLayerAvailability;
  const lineage = parseLayerLineage(row.lineage, label, context);
  const unavailableReason = nullableString(row.unavailableReason, `${label}.unavailableReason`);
  if (availability === "unavailable") {
    if (row.payload != null || unavailableReason == null || lineage.availableTimeMs != null) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} unavailable state is not explicit`);
    }
  } else if (row.payload == null || lineage.availableTimeMs == null) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} ${availability} state must contain a causal payload`);
  }
  return {
    layerKey: key,
    availability,
    lineage,
    unavailableReason,
    limitations: requireStringArray(row.limitations, `${label}.limitations`),
    payload: row.payload == null ? null : parsePayload(row.payload, `${label}.payload`, lineage),
  };
}

function requirePayloadTime(row: Record<string, unknown>, label: string, lineage: TechnicalLayerLineage): { openTimeMs: number; availableTimeMs: number } {
  const openTimeMs = requireFiniteNumber(row.openTimeMs, `${label}.openTimeMs`);
  const availableTimeMs = requireFiniteNumber(row.availableTimeMs, `${label}.availableTimeMs`);
  if (availableTimeMs !== lineage.availableTimeMs || openTimeMs > availableTimeMs) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} time does not match lineage availability`);
  }
  return { openTimeMs, availableTimeMs };
}

function parseIndicators(value: unknown, label: string, lineage: TechnicalLayerLineage): TechnicalIndicatorReplay {
  const row = requireRecord(value, label);
  const time = requirePayloadTime(row, label, lineage);
  if (!Array.isArray(row.events)) throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.events must be an array`);
  return {
    ...time,
    rsi14: nullableFiniteNumber(row.rsi14, `${label}.rsi14`),
    ema12: nullableFiniteNumber(row.ema12, `${label}.ema12`),
    ema26: nullableFiniteNumber(row.ema26, `${label}.ema26`),
    sma50: nullableFiniteNumber(row.sma50, `${label}.sma50`),
    events: row.events.map((value, index) => {
      const event = requireRecord(value, `${label}.events[${index}]`);
      const direction = requireFiniteNumber(event.direction, `${label}.events[${index}].direction`);
      if (direction !== -1 && direction !== 1) throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.events[${index}].direction is unsupported`);
      return { eventType: requireString(event.eventType, `${label}.events[${index}].eventType`), direction, value: requireFiniteNumber(event.value, `${label}.events[${index}].value`) };
    }),
  };
}

function parseCandlePatterns(value: unknown, label: string, lineage: TechnicalLayerLineage): CandlePatternReplay {
  const row = requireRecord(value, label);
  if (!Array.isArray(row.events)) throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.events must be an array`);
  return { events: row.events.map((value, index) => {
    const event = requireRecord(value, `${label}.events[${index}]`);
    const originTimeMs = requireFiniteNumber(event.originTimeMs, `${label}.events[${index}].originTimeMs`);
    const availableTimeMs = requireFiniteNumber(event.availableTimeMs, `${label}.events[${index}].availableTimeMs`);
    if (lineage.availableTimeMs == null || availableTimeMs > lineage.availableTimeMs || originTimeMs > availableTimeMs || !Array.isArray(event.sourceOpenTimeMs) || event.sourceOpenTimeMs.length === 0) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.events[${index}] is not causal`);
    }
    const sourceOpenTimeMs = event.sourceOpenTimeMs.map((time, sourceIndex) => requireFiniteNumber(time, `${label}.events[${index}].sourceOpenTimeMs[${sourceIndex}]`));
    if (sourceOpenTimeMs.some((time) => time > availableTimeMs)) throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.events[${index}] has a future source`);
    return {
      patternType: requireString(event.patternType, `${label}.events[${index}].patternType`),
      patternCategory: requireString(event.patternCategory, `${label}.events[${index}].patternCategory`),
      trendDirection: requireString(event.trendDirection, `${label}.events[${index}].trendDirection`),
      originTimeMs,
      availableTimeMs,
      sourceOpenTimeMs,
    };
  }) };
}

function parseVolumeAnomaly(value: unknown, label: string, lineage: TechnicalLayerLineage): VolumeAnomalyReplay {
  const row = requireRecord(value, label);
  return {
    ...requirePayloadTime(row, label, lineage),
    volume: requireFiniteNumber(row.volume, `${label}.volume`),
    volumeSma20: requireFiniteNumber(row.volumeSma20, `${label}.volumeSma20`),
    volumeAnomalyRatio: requireFiniteNumber(row.volumeAnomalyRatio, `${label}.volumeAnomalyRatio`),
    volumeVsPrevious: requireFiniteNumber(row.volumeVsPrevious, `${label}.volumeVsPrevious`),
    volumeVsMax10: requireFiniteNumber(row.volumeVsMax10, `${label}.volumeVsMax10`),
    volumeTrend: requireString(row.volumeTrend, `${label}.volumeTrend`),
    triggeredEvents: requireStringArray(row.triggeredEvents, `${label}.triggeredEvents`),
  };
}

function parseMarketRegime(value: unknown, label: string, lineage: TechnicalLayerLineage): MarketRegimeReplay {
  const row = requireRecord(value, label);
  return {
    ...requirePayloadTime(row, label, lineage),
    regimeType: requireString(row.regimeType, `${label}.regimeType`),
    trend: requireString(row.trend, `${label}.trend`),
    volatility: requireString(row.volatility, `${label}.volatility`),
    eventType: nullableString(row.eventType, `${label}.eventType`),
    upChanges: requireNonNegativeInteger(row.upChanges, `${label}.upChanges`),
    downChanges: requireNonNegativeInteger(row.downChanges, `${label}.downChanges`),
    currentTrueRangePct: requireFiniteNumber(row.currentTrueRangePct, `${label}.currentTrueRangePct`),
    priorMedianTrueRangePct: requireFiniteNumber(row.priorMedianTrueRangePct, `${label}.priorMedianTrueRangePct`),
    rangeRatio: requireFiniteNumber(row.rangeRatio, `${label}.rangeRatio`),
  };
}

function parseFibonacci(value: unknown, label: string, lineage: TechnicalLayerLineage): FibonacciReplay {
  const row = requireRecord(value, label);
  const availableTimeMs = requireFiniteNumber(row.availableTimeMs, `${label}.availableTimeMs`);
  const anchorStartTimeMs = requireFiniteNumber(row.anchorStartTimeMs, `${label}.anchorStartTimeMs`);
  const anchorEndTimeMs = requireFiniteNumber(row.anchorEndTimeMs, `${label}.anchorEndTimeMs`);
  const anchorLow = requireFiniteNumber(row.anchorLow, `${label}.anchorLow`);
  const anchorHigh = requireFiniteNumber(row.anchorHigh, `${label}.anchorHigh`);
  if (availableTimeMs !== lineage.availableTimeMs || anchorStartTimeMs > availableTimeMs || anchorEndTimeMs > availableTimeMs || anchorHigh < anchorLow || !Array.isArray(row.levels) || row.levels.length === 0) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} anchors or availability are invalid`);
  }
  return {
    eventType: requireString(row.eventType, `${label}.eventType`),
    availableTimeMs,
    direction: requireString(row.direction, `${label}.direction`),
    anchorStartTimeMs,
    anchorEndTimeMs,
    anchorLow,
    anchorHigh,
    levels: row.levels.map((value, index) => {
      const level = requireRecord(value, `${label}.levels[${index}]`);
      return { ratio: requireFiniteNumber(level.ratio, `${label}.levels[${index}].ratio`), price: requireFiniteNumber(level.price, `${label}.levels[${index}].price`) };
    }),
  };
}

function parseVolumeProfile(value: unknown, label: string, lineage: TechnicalLayerLineage): VolumeProfileReplay {
  const row = requireRecord(value, label);
  const binCount = requireNonNegativeInteger(row.binCount, `${label}.binCount`);
  const windowStartMs = requireFiniteNumber(row.windowStartMs, `${label}.windowStartMs`);
  const windowEndMs = requireFiniteNumber(row.windowEndMs, `${label}.windowEndMs`);
  if (lineage.availableTimeMs == null || windowStartMs > windowEndMs || windowEndMs !== lineage.availableTimeMs || !Array.isArray(row.bins) || row.bins.length !== binCount) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} window or bin count is invalid`);
  }
  return {
    method: requireString(row.method, `${label}.method`),
    binCount,
    valueAreaFraction: requireFiniteNumber(row.valueAreaFraction, `${label}.valueAreaFraction`),
    windowStartMs,
    windowEndMs,
    inputVolume: requireFiniteNumber(row.inputVolume, `${label}.inputVolume`),
    pocPrice: requireFiniteNumber(row.pocPrice, `${label}.pocPrice`),
    vahPrice: requireFiniteNumber(row.vahPrice, `${label}.vahPrice`),
    valPrice: requireFiniteNumber(row.valPrice, `${label}.valPrice`),
    bins: row.bins.map((value, index) => {
      const bin = requireRecord(value, `${label}.bins[${index}]`);
      return {
        priceLevel: requireFiniteNumber(bin.priceLevel, `${label}.bins[${index}].priceLevel`),
        volume: requireFiniteNumber(bin.volume, `${label}.bins[${index}].volume`),
        volumePct: requireFiniteNumber(bin.volumePct, `${label}.bins[${index}].volumePct`),
        isPoc: requireBoolean(bin.isPoc, `${label}.bins[${index}].isPoc`),
        isValueArea: requireBoolean(bin.isValueArea, `${label}.bins[${index}].isValueArea`),
      };
    }),
    events: requireStringArray(row.events, `${label}.events`),
  };
}

function parseConfluence(value: unknown, label: string, lineage: TechnicalLayerLineage): ConfluenceReplay {
  const row = requireRecord(value, label);
  if (row.scoreKind !== "descriptive_regime_index" || row.isProbability !== false || !Array.isArray(row.moduleVotes)) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} must remain a descriptive non-probability index`);
  }
  const availableTimeMs = requireFiniteNumber(row.availableTimeMs, `${label}.availableTimeMs`);
  const score = requireFiniteNumber(row.score, `${label}.score`);
  const hasConflict = requireBoolean(row.hasConflict, `${label}.hasConflict`);
  const triggeredEvents = requireStringArray(row.triggeredEvents, `${label}.triggeredEvents`);
  if (availableTimeMs !== lineage.availableTimeMs || score < -1 || score > 1) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} time or descriptive score is invalid`);
  }
  const moduleVotes = row.moduleVotes.map((value, index) => {
      const vote = requireRecord(value, `${label}.moduleVotes[${index}]`);
      const layerKey = requireString(vote.layerKey, `${label}.moduleVotes[${index}].layerKey`);
      const direction = requireFiniteNumber(vote.vote, `${label}.moduleVotes[${index}].vote`);
      const voteAvailableTimeMs = requireFiniteNumber(vote.availableTimeMs, `${label}.moduleVotes[${index}].availableTimeMs`);
      if (layerKey === "confluence" || !TECHNICAL_LAYER_KEYS.includes(layerKey as TechnicalLayerKey) || (direction !== -1 && direction !== 1) || voteAvailableTimeMs !== availableTimeMs) {
        throw new Error(`INVALID_TECHNICAL_REPLAY: ${label}.moduleVotes[${index}] is invalid`);
      }
      return { layerKey: layerKey as Exclude<TechnicalLayerKey, "confluence">, vote: direction as -1 | 1, reason: requireString(vote.reason, `${label}.moduleVotes[${index}].reason`), availableTimeMs: voteAvailableTimeMs };
    });
  if (new Set(moduleVotes.map((vote) => vote.layerKey)).size !== moduleVotes.length) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} contains duplicate module votes`);
  }
  const bullVotes = moduleVotes.filter((vote) => vote.vote === 1).length;
  const bearVotes = moduleVotes.filter((vote) => vote.vote === -1).length;
  const expectedAligned = Math.max(bullVotes, bearVotes);
  const expectedConflict = bullVotes >= 2 && bearVotes >= 2;
  const expectedDirection = expectedConflict ? "Conflict" : bullVotes >= 2 ? "Bullish" : bearVotes >= 2 ? "Bearish" : "Neutral";
  const expectedEvents = expectedConflict
    ? ["CONFLUENCE_BULL_2PLUS", "CONFLUENCE_BEAR_2PLUS"]
    : bullVotes >= 2 ? ["CONFLUENCE_BULL_2PLUS"]
    : bearVotes >= 2 ? ["CONFLUENCE_BEAR_2PLUS"] : [];
  const expectedEventType = expectedDirection === "Bullish" ? "CONFLUENCE_BULL_2PLUS"
    : expectedDirection === "Bearish" ? "CONFLUENCE_BEAR_2PLUS" : null;
  const alignedDirectionalModules = requireNonNegativeInteger(row.alignedDirectionalModules, `${label}.alignedDirectionalModules`);
  const overallDirection = requireString(row.overallDirection, `${label}.overallDirection`);
  const eventType = nullableString(row.eventType, `${label}.eventType`);
  const expectedScore = moduleVotes.length === 0 ? 0 : moduleVotes.reduce((total, vote) => total + vote.vote, 0) / moduleVotes.length;
  if (
    hasConflict !== expectedConflict
    || alignedDirectionalModules !== expectedAligned
    || overallDirection !== expectedDirection
    || eventType !== expectedEventType
    || triggeredEvents.length !== expectedEvents.length
    || triggeredEvents.some((event, index) => event !== expectedEvents[index])
    || Math.abs(score - expectedScore) > 1e-9
  ) {
    throw new Error(`INVALID_TECHNICAL_REPLAY: ${label} vote counts, direction, score and triggered events must reconcile`);
  }
  return {
    availableTimeMs,
    eventType,
    triggeredEvents,
    score,
    scoreKind: "descriptive_regime_index",
    isProbability: false,
    overallDirection,
    hasConflict,
    alignedDirectionalModules,
    moduleVotes,
  };
}

export function parseTechnicalReplayEnvelope(value: unknown): TechnicalReplayEnvelope {
  const row = requireRecord(value, "response");
  const moduleContractVersion = requireString(row.moduleContractVersion, "moduleContractVersion");
  const moduleContractSha256 = requireSha256(row.moduleContractSha256, "moduleContractSha256");
  const symbol = requireString(row.symbol, "symbol").toUpperCase();
  if (symbol !== TECHNICAL_REPLAY_SYMBOL) {
    throw new Error("INVALID_TECHNICAL_REPLAY: only BTCUSDT is accepted");
  }
  const timeframeRaw = requireString(row.timeframe, "timeframe");
  if (!isActiveTimeframe(timeframeRaw)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: timeframe must be 1h, 4h or 1d");
  }
  const requestedAsOfTimeMs = requireFiniteNumber(row.requestedAsOfTimeMs, "requestedAsOfTimeMs");
  const effectiveAsOfTimeMs = nullableFiniteNumber(row.effectiveAsOfTimeMs, "effectiveAsOfTimeMs");
  const lastFinalizedCandleCloseTimeMs = nullableFiniteNumber(row.lastFinalizedCandleCloseTimeMs, "lastFinalizedCandleCloseTimeMs");
  const requestedLookbackBars = requireFiniteNumber(row.requestedLookbackBars, "requestedLookbackBars");
  const replayWindowStartTimeMs = nullableFiniteNumber(row.replayWindowStartTimeMs, "replayWindowStartTimeMs");
  const contiguousSegmentStartTimeMs = nullableFiniteNumber(row.contiguousSegmentStartTimeMs, "contiguousSegmentStartTimeMs");
  const sourceCandleCount = requireFiniteNumber(row.sourceCandleCount, "sourceCandleCount");
  const analysisCandleCount = requireFiniteNumber(row.analysisCandleCount, "analysisCandleCount");
  if (!Number.isInteger(sourceCandleCount) || sourceCandleCount < 0) {
    throw new Error("INVALID_TECHNICAL_REPLAY: sourceCandleCount must be a non-negative integer");
  }
  if (!Number.isInteger(analysisCandleCount) || analysisCandleCount < sourceCandleCount) {
    throw new Error("INVALID_TECHNICAL_REPLAY: analysisCandleCount must cover displayed source candles");
  }
  if (!Number.isInteger(requestedLookbackBars) || requestedLookbackBars < 5 || requestedLookbackBars > 10_000) {
    throw new Error("INVALID_TECHNICAL_REPLAY: requestedLookbackBars is outside the supported range");
  }
  if ((effectiveAsOfTimeMs == null) !== (lastFinalizedCandleCloseTimeMs == null)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: effective and finalized boundaries must both be null or numbers");
  }
  if (effectiveAsOfTimeMs != null && lastFinalizedCandleCloseTimeMs != null && (effectiveAsOfTimeMs > requestedAsOfTimeMs || lastFinalizedCandleCloseTimeMs > effectiveAsOfTimeMs)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: response time boundaries are inconsistent");
  }
  if (replayWindowStartTimeMs != null && (effectiveAsOfTimeMs == null || replayWindowStartTimeMs > effectiveAsOfTimeMs)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: replay window is outside the effective as-of boundary");
  }
  if (contiguousSegmentStartTimeMs != null && replayWindowStartTimeMs != null && contiguousSegmentStartTimeMs > replayWindowStartTimeMs) {
    throw new Error("INVALID_TECHNICAL_REPLAY: contiguous history begins after the replay window");
  }
  const calculationVersion = requireString(row.calculationVersion, "calculationVersion");
  if (!Array.isArray(row.candles)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: candles must be an array");
  }
  const candles = row.candles.map(parseReplayCandle);
  if (candles.length !== sourceCandleCount || candles.length > requestedLookbackBars) {
    throw new Error("INVALID_TECHNICAL_REPLAY: candle count does not match the replay envelope");
  }
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    if (candle.closeTimeMs > requestedAsOfTimeMs || (effectiveAsOfTimeMs != null && candle.closeTimeMs > effectiveAsOfTimeMs)) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: candles[${index}] is not finalized at as-of`);
    }
    if (index > 0 && candle.openTimeMs - candles[index - 1].openTimeMs !== intervalToMs(timeframeRaw)) {
      throw new Error("INVALID_TECHNICAL_REPLAY: chart candles are not a contiguous timeframe sequence");
    }
  }
  if (candles.length > 0 && (
    replayWindowStartTimeMs !== candles[0].openTimeMs
    || effectiveAsOfTimeMs !== candles[candles.length - 1].closeTimeMs
  )) {
    throw new Error("INVALID_TECHNICAL_REPLAY: chart candle boundaries do not match the envelope");
  }
  if (candles.length === 0 && (sourceCandleCount !== 0 || replayWindowStartTimeMs != null)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: empty candle history has non-empty boundary metadata");
  }
  const base = { symbol, timeframe: timeframeRaw, effectiveAsOfTimeMs: effectiveAsOfTimeMs ?? requestedAsOfTimeMs, calculationVersion };
  if (!Array.isArray(row.events)) {
    throw new Error("INVALID_TECHNICAL_REPLAY: events must be an array");
  }
  const events = row.events.map((event, index) => parseReplayEvent(event, index, base));
  if (effectiveAsOfTimeMs == null && events.length > 0) {
    throw new Error("INVALID_TECHNICAL_REPLAY: response without finalized candles cannot contain events");
  }
  const eventIds = new Set(events.map((event) => event.eventId));
  if (eventIds.size !== events.length) {
    throw new Error("INVALID_TECHNICAL_REPLAY: eventId values must be unique");
  }
  const provenance = requireRecord(row.provenance, "provenance");
  if (
    provenance.source !== "stored-finalized-klines"
    || provenance.evaluationMode !== "point-in-time-reconstruction"
    || provenance.availabilityRule !== "candle.closeTimeMs <= requestedAsOfTimeMs"
    || provenance.contextRule !== TECHNICAL_REPLAY_CONTEXT_RULE
    || provenance.persistedByReplay !== false
  ) {
    throw new Error("INVALID_TECHNICAL_REPLAY: unsupported provenance");
  }
  const layerContext: LayerParseContext = {
    requestedAsOfTimeMs,
    effectiveAsOfTimeMs,
    moduleContractVersion,
    moduleContractSha256,
  };
  const rawLayers = requireRecord(row.layers, "layers");
  const layers: TechnicalReplayLayers = {
    indicators: parseLayer(rawLayers.indicators, "technicalIndicators", layerContext, parseIndicators),
    candlePatterns: parseLayer(rawLayers.candlePatterns, "candlePatterns", layerContext, parseCandlePatterns),
    volumeAnomaly: parseLayer(rawLayers.volumeAnomaly, "volumeAnomaly", layerContext, parseVolumeAnomaly),
    marketRegime: parseLayer(rawLayers.marketRegime, "marketRegime", layerContext, parseMarketRegime),
    fibonacci: parseLayer(rawLayers.fibonacci, "fibonacci", layerContext, parseFibonacci),
    volumeProfile: parseLayer(rawLayers.volumeProfile, "volumeProfile", layerContext, parseVolumeProfile),
    confluence: parseLayer(rawLayers.confluence, "confluence", layerContext, parseConfluence),
  };
  const rawAdministration = requireRecord(row.administration, "administration");
  const administration: TechnicalReplayEnvelope["administration"] = {
    hasGapBoundary: requireBoolean(rawAdministration.hasGapBoundary, "administration.hasGapBoundary"),
    contextLimitBars: requireNonNegativeInteger(rawAdministration.contextLimitBars, "administration.contextLimitBars"),
    legacySmartMoneyStatus: requireString(rawAdministration.legacySmartMoneyStatus, "administration.legacySmartMoneyStatus"),
    rebuildRequired: requireBoolean(rawAdministration.rebuildRequired, "administration.rebuildRequired"),
    rebuildReason: nullableString(rawAdministration.rebuildReason, "administration.rebuildReason"),
  };
  if (!Array.isArray(row.coverage) || row.coverage.length !== TECHNICAL_LAYER_KEYS.length) {
    throw new Error("INVALID_TECHNICAL_REPLAY: coverage must contain every technical layer exactly once");
  }
  const layerByKey = new Map<TechnicalLayerKey, TechnicalLayerEnvelope<unknown>>([
    ["technicalIndicators", layers.indicators],
    ["candlePatterns", layers.candlePatterns],
    ["volumeAnomaly", layers.volumeAnomaly],
    ["marketRegime", layers.marketRegime],
    ["fibonacci", layers.fibonacci],
    ["volumeProfile", layers.volumeProfile],
    ["confluence", layers.confluence],
  ]);
  const coverage = row.coverage.map((value, index): TechnicalLayerCoverage => {
    const item = requireRecord(value, `coverage[${index}]`);
    const layerKey = requireString(item.layerKey, `coverage[${index}].layerKey`) as TechnicalLayerKey;
    const layer = layerByKey.get(layerKey);
    if (!layer || item.availability !== layer.availability || item.requiredWarmupBars !== layer.lineage.requiredWarmupBars || item.latestAvailableTimeMs !== layer.lineage.availableTimeMs || item.hasGapBoundary !== administration.hasGapBoundary) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: coverage[${index}] does not match its layer`);
    }
    const sourceBars = requireNonNegativeInteger(item.sourceBars, `coverage[${index}].sourceBars`);
    if (sourceBars !== layer.lineage.sourceCandleCount) throw new Error(`INVALID_TECHNICAL_REPLAY: coverage[${index}].sourceBars does not match layer lineage`);
    const storageStatus = requireString(item.storageStatus, `coverage[${index}].storageStatus`);
    if (!new Set(["sparse_event_envelope_materialized", "on_demand_state_checkpoint_processed", "on_demand_state_not_checkpointed"]).has(storageStatus)) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: coverage[${index}].storageStatus is unsupported`);
    }
    const isEventEnvelopeMaterializedAtAsOf = requireBoolean(item.isEventEnvelopeMaterializedAtAsOf, `coverage[${index}].isEventEnvelopeMaterializedAtAsOf`);
    if (isEventEnvelopeMaterializedAtAsOf !== (storageStatus === "sparse_event_envelope_materialized")) {
      throw new Error(`INVALID_TECHNICAL_REPLAY: coverage[${index}] materialization state is inconsistent`);
    }
    return {
      layerKey,
      availability: layer.availability,
      sourceBars,
      requiredWarmupBars: layer.lineage.requiredWarmupBars,
      latestAvailableTimeMs: layer.lineage.availableTimeMs,
      hasGapBoundary: administration.hasGapBoundary,
      checkpointStatus: requireString(item.checkpointStatus, `coverage[${index}].checkpointStatus`),
      storageStatus: storageStatus as TechnicalLayerCoverage["storageStatus"],
      isEventEnvelopeMaterializedAtAsOf,
    };
  });
  if (new Set(coverage.map((item) => item.layerKey)).size !== TECHNICAL_LAYER_KEYS.length) {
    throw new Error("INVALID_TECHNICAL_REPLAY: coverage has duplicate or missing layer keys");
  }
  return {
    moduleContractVersion,
    moduleContractSha256,
    symbol,
    timeframe: timeframeRaw,
    requestedAsOfTimeMs,
    effectiveAsOfTimeMs,
    lastFinalizedCandleCloseTimeMs,
    requestedLookbackBars,
    replayWindowStartTimeMs,
    contiguousSegmentStartTimeMs,
    sourceCandleCount,
    analysisCandleCount,
    calculationVersion,
    provenance: provenance as TechnicalReplayEnvelope["provenance"],
    limitations: requireStringArray(row.limitations, "limitations"),
    candles,
    events,
    layers,
    coverage,
    administration,
  };
}

/** Last boundary at which every prior candle is finalized. */
export function latestFinalizedBoundaryMs(nowMs: number, timeframe: ActiveTimeframe): number {
  const step = intervalToMs(timeframe);
  return Math.floor(nowMs / step) * step;
}

export function normalizeReplayAsOfMs(value: unknown, timeframe: ActiveTimeframe, nowMs = Date.now()): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return latestFinalizedBoundaryMs(nowMs, timeframe);
  }
  const boundary = Math.floor(parsed / intervalToMs(timeframe)) * intervalToMs(timeframe);
  return Math.min(boundary, latestFinalizedBoundaryMs(nowMs, timeframe));
}

export function stepReplayAsOfMs(asOfTimeMs: number, timeframe: ActiveTimeframe, direction: -1 | 1, nowMs = Date.now()): number {
  const current = normalizeReplayAsOfMs(asOfTimeMs, timeframe, nowMs);
  return Math.min(current + direction * intervalToMs(timeframe), latestFinalizedBoundaryMs(nowMs, timeframe));
}

export class LatestRequestGate {
  #sequence = 0;

  begin(): number {
    this.#sequence += 1;
    return this.#sequence;
  }

  isCurrent(token: number): boolean {
    return token === this.#sequence;
  }
}

export function toDateTimeLocalValue(timeMs: number): string {
  const date = new Date(timeMs);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(timeMs - offsetMs).toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}
