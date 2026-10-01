import assert from "node:assert/strict";
import test from "node:test";
import {
  LatestRequestGate,
  latestFinalizedBoundaryMs,
  normalizeReplayAsOfMs,
  parseTechnicalReplayEnvelope,
  stepReplayAsOfMs,
  TECHNICAL_REPLAY_CONTEXT_RULE,
} from "../src/lib/technicalReplay.ts";

const moduleContractVersion = "btc-causal-technical-modules/v1";
const moduleContractSha256 = "a".repeat(64);
const layerKeys = ["technicalIndicators", "candlePatterns", "volumeAnomaly", "marketRegime", "fibonacci", "volumeProfile", "confluence"] as const;

function unavailableLayer(layerKey: typeof layerKeys[number], requiredWarmupBars: number) {
  return {
    layerKey,
    availability: "unavailable",
    lineage: {
      moduleContractVersion,
      moduleContractSha256,
      producer: "Backend.TechnicalReplayLayerService",
      calculationVersion: `${layerKey}-v1`,
      source: "stored-finalized-klines",
      evaluationMode: "point-in-time-reconstruction",
      requestedAsOfTimeMs: 1_000_000,
      effectiveAsOfTimeMs: 900_000,
      availableTimeMs: null,
      sourceStartTimeMs: 400_000,
      sourceEndTimeMs: 900_000,
      sourceCandleCount: 1,
      requiredWarmupBars,
      isCausal: true,
      isPersisted: false,
    },
    unavailableReason: `Requires ${requiredWarmupBars} finalized candles.`,
    limitations: [],
    payload: null,
  };
}

function replayPayload() {
  return {
    moduleContractVersion,
    moduleContractSha256,
    symbol: "BTCUSDT",
    timeframe: "4h",
    requestedAsOfTimeMs: 1_000_000,
    effectiveAsOfTimeMs: 900_000,
    lastFinalizedCandleCloseTimeMs: 900_000,
    requestedLookbackBars: 500,
    replayWindowStartTimeMs: 400_000,
    contiguousSegmentStartTimeMs: 50_000,
    sourceCandleCount: 1,
    analysisCandleCount: 3,
    calculationVersion: "smc-replay-v1",
    provenance: {
      source: "stored-finalized-klines",
      evaluationMode: "point-in-time-reconstruction",
      availabilityRule: "candle.closeTimeMs <= requestedAsOfTimeMs",
      contextRule: TECHNICAL_REPLAY_CONTEXT_RULE,
      persistedByReplay: false,
    },
    limitations: ["OHLC geometry only"],
    events: [{
      eventId: "BTCUSDT:4h:BOS_BULL:400000",
      eventType: "BOS_BULL",
      description: "Close broke the prior swing high.",
      originTimeMs: 300_000,
      availableTimeMs: 900_000,
      referenceTimeMs: 200_000,
      price: 60_000,
      highPrice: null as number | null,
      lowPrice: null as number | null,
      calculationVersion: "smc-replay-v1",
      stateAtAsOf: "confirmed" as "confirmed" | "active" | "mitigated",
      mitigatedAtMs: null as number | null,
      invalidatedAtMs: null,
      mitigationRule: null as string | null,
      invalidationRule: null,
      sourceCandles: [{
        role: "breakout",
        openTimeMs: 400_000,
        closeTimeMs: 900_000,
        open: 59_000,
        high: 61_000,
        low: 58_500,
        close: 60_500,
        volume: 120,
      }],
      detectionConditions: ["close > prior swing high"],
      limitations: ["Descriptive price geometry"],
    }],
    candles: [{
      openTimeMs: 400_000,
      closeTimeMs: 900_000,
      open: 59_000,
      high: 61_000,
      low: 58_500,
      close: 60_500,
      volume: 120,
    }],
    layers: {
      indicators: unavailableLayer("technicalIndicators", 61),
      candlePatterns: unavailableLayer("candlePatterns", 2),
      volumeAnomaly: unavailableLayer("volumeAnomaly", 21),
      marketRegime: unavailableLayer("marketRegime", 12),
      fibonacci: unavailableLayer("fibonacci", 5),
      volumeProfile: unavailableLayer("volumeProfile", 100),
      confluence: unavailableLayer("confluence", 2),
    },
    coverage: layerKeys.map((layerKey) => {
      const requiredWarmupBars = ({ technicalIndicators: 61, candlePatterns: 2, volumeAnomaly: 21, marketRegime: 12, fibonacci: 5, volumeProfile: 100, confluence: 2 })[layerKey];
      return { layerKey, availability: "unavailable", sourceBars: 1, requiredWarmupBars, latestAvailableTimeMs: null, hasGapBoundary: false, checkpointStatus: "not_processed_at_as_of", storageStatus: "on_demand_state_not_checkpointed", isEventEnvelopeMaterializedAtAsOf: false };
    }),
    administration: { hasGapBoundary: false, contextLimitBars: 10_000, legacySmartMoneyStatus: "isolated", rebuildRequired: false, rebuildReason: null },
  };
}

function syncLayerMetadata(payload: ReturnType<typeof replayPayload>) {
  const sourceStartTimeMs = payload.candles[0]?.openTimeMs ?? null;
  for (const layer of Object.values(payload.layers)) {
    layer.lineage.requestedAsOfTimeMs = payload.requestedAsOfTimeMs;
    layer.lineage.effectiveAsOfTimeMs = payload.effectiveAsOfTimeMs;
    layer.lineage.sourceStartTimeMs = sourceStartTimeMs;
    layer.lineage.sourceEndTimeMs = payload.effectiveAsOfTimeMs;
    layer.lineage.sourceCandleCount = payload.sourceCandleCount;
  }
  for (const coverage of payload.coverage) coverage.sourceBars = payload.sourceCandleCount;
}

test("technical replay parser accepts the exact backend point-in-time contract", () => {
  const parsed = parseTechnicalReplayEnvelope(replayPayload());
  assert.equal(parsed.symbol, "BTCUSDT");
  assert.equal(parsed.events[0].stateAtAsOf, "confirmed");
  assert.equal(parsed.events[0].sourceCandles[0].closeTimeMs, 900_000);
  assert.equal(parsed.candles[0].isClosed, true);
  assert.equal(parsed.provenance.persistedByReplay, false);
  assert.equal(parsed.coverage[0].storageStatus, "on_demand_state_not_checkpointed");

  const inconsistentStorage = replayPayload();
  inconsistentStorage.coverage[0].storageStatus = "sparse_event_envelope_materialized";
  assert.throws(() => parseTechnicalReplayEnvelope(inconsistentStorage), /materialization state is inconsistent/);
});

test("technical replay parser accepts exact regime, volume-profile and descriptive confluence payloads", () => {
  const raw = replayPayload();
  Object.assign(raw.layers.marketRegime, {
    ...raw.layers.marketRegime,
    availability: "available",
    unavailableReason: null,
    lineage: { ...raw.layers.marketRegime.lineage, availableTimeMs: 900_000 },
    payload: { openTimeMs: 400_000, availableTimeMs: 900_000, regimeType: "up_normal", trend: "up", volatility: "normal", eventType: "REGIME_BULL_NORMAL", upChanges: 4, downChanges: 1, currentTrueRangePct: 0.02, priorMedianTrueRangePct: 0.015, rangeRatio: 1.333 },
  });
  Object.assign(raw.layers.volumeProfile, {
    ...raw.layers.volumeProfile,
    availability: "available",
    unavailableReason: null,
    lineage: { ...raw.layers.volumeProfile.lineage, availableTimeMs: 900_000 },
    payload: { method: "full-bar-volume-at-typical-price", binCount: 2, valueAreaFraction: 0.7, windowStartMs: 400_000, windowEndMs: 900_000, inputVolume: 120, pocPrice: 60_000, vahPrice: 61_000, valPrice: 59_000, bins: [{ priceLevel: 59_000, volume: 40, volumePct: 50, isPoc: false, isValueArea: true }, { priceLevel: 60_000, volume: 80, volumePct: 100, isPoc: true, isValueArea: true }], events: ["VOLUME_PROFILE_CLOSE_ABOVE_POC"] },
  });
  Object.assign(raw.layers.confluence, {
    ...raw.layers.confluence,
    availability: "partial",
    unavailableReason: "Fewer than two modules align.",
    lineage: { ...raw.layers.confluence.lineage, availableTimeMs: 900_000 },
    payload: { availableTimeMs: 900_000, eventType: null, triggeredEvents: [], score: 1, scoreKind: "descriptive_regime_index", isProbability: false, overallDirection: "Neutral", hasConflict: false, alignedDirectionalModules: 1, moduleVotes: [{ layerKey: "marketRegime", vote: 1, reason: "REGIME_BULL_NORMAL", availableTimeMs: 900_000 }] },
  });
  for (const key of ["marketRegime", "volumeProfile", "confluence"] as const) {
    const coverage = raw.coverage.find((item) => item.layerKey === key)!;
    Object.assign(coverage, {
      availability: raw.layers[key].availability,
      latestAvailableTimeMs: 900_000,
    });
  }
  const parsed = parseTechnicalReplayEnvelope(raw);
  assert.equal(parsed.layers.marketRegime.payload?.currentTrueRangePct, 0.02);
  assert.equal(parsed.layers.volumeProfile.payload?.windowEndMs, 900_000);
  assert.equal(parsed.layers.confluence.payload?.isProbability, false);

  const invalidConflict = structuredClone(raw);
  Object.assign(invalidConflict.layers.confluence.payload!, {
    hasConflict: true,
    overallDirection: "Conflict",
    alignedDirectionalModules: 2,
    score: 0,
    moduleVotes: [
      { layerKey: "technicalIndicators", vote: 1, reason: "bull", availableTimeMs: 900_000 },
      { layerKey: "marketRegime", vote: 1, reason: "bull", availableTimeMs: 900_000 },
      { layerKey: "candlePatterns", vote: -1, reason: "bear", availableTimeMs: 900_000 },
      { layerKey: "volumeProfile", vote: -1, reason: "bear", availableTimeMs: 900_000 },
    ],
    triggeredEvents: ["CONFLUENCE_BEAR_2PLUS", "CONFLUENCE_BULL_2PLUS"],
  });
  assert.throws(() => parseTechnicalReplayEnvelope(invalidConflict), /must reconcile/);

  const staleVote = structuredClone(raw);
  Object.assign(staleVote.layers.confluence.payload!, {
    moduleVotes: [{ layerKey: "marketRegime", vote: 1, reason: "stale vote", availableTimeMs: 899_999 }],
  });
  assert.throws(() => parseTechnicalReplayEnvelope(staleVote), /moduleVotes\[0\] is invalid/);
});

test("technical replay parser fails closed for a future event or source candle", () => {
  const futureEvent = replayPayload();
  futureEvent.events[0].availableTimeMs = 1_100_000;
  assert.throws(() => parseTechnicalReplayEnvelope(futureEvent), /unavailable at effective as-of/);

  const futureSource = replayPayload();
  futureSource.requestedAsOfTimeMs = 1_100_000;
  futureSource.effectiveAsOfTimeMs = 1_000_000;
  futureSource.lastFinalizedCandleCloseTimeMs = 1_000_000;
  futureSource.candles[0].closeTimeMs = 1_000_000;
  futureSource.events[0].sourceCandles[0].closeTimeMs = 950_000;
  assert.throws(() => parseTechnicalReplayEnvelope(futureSource), /unproven future source candle/);

  const futureChartCandle = replayPayload();
  futureChartCandle.candles[0].closeTimeMs = 950_000;
  assert.throws(() => parseTechnicalReplayEnvelope(futureChartCandle), /not finalized at as-of/);
});

test("a later FVG mitigation candle is accepted only as causal lifecycle evidence available by as-of", () => {
  const mitigated = replayPayload();
  mitigated.requestedAsOfTimeMs = 1_500_000;
  mitigated.effectiveAsOfTimeMs = 1_400_000;
  mitigated.lastFinalizedCandleCloseTimeMs = 1_400_000;
  mitigated.candles[0].closeTimeMs = 1_400_000;
  syncLayerMetadata(mitigated);
  const event = mitigated.events[0];
  event.eventId = "BTCUSDT:4h:FVG_BEAR:400000";
  event.eventType = "FVG_BEAR";
  event.highPrice = 60_000;
  event.lowPrice = 59_000;
  event.stateAtAsOf = "mitigated";
  event.mitigatedAtMs = 1_300_000;
  event.mitigationRule = "Later finalized candle completely fills the gap.";
  event.sourceCandles.push({
    role: "fvg-mitigation",
    openTimeMs: 1_000_000,
    closeTimeMs: 1_300_000,
    open: 59_000,
    high: 60_500,
    low: 58_900,
    close: 60_100,
    volume: 200,
  });

  const parsed = parseTechnicalReplayEnvelope(mitigated);
  assert.equal(parsed.events[0].stateAtAsOf, "mitigated");
  assert.equal(parsed.events[0].sourceCandles.at(-1)?.closeTimeMs, 1_300_000);

  const afterAsOf = structuredClone(mitigated);
  afterAsOf.events[0].sourceCandles.at(-1)!.closeTimeMs = 1_450_000;
  assert.throws(() => parseTechnicalReplayEnvelope(afterAsOf), /source candle after effective as-of/);
});

test("technical replay parser accepts an empty history with null finalized boundaries", () => {
  const empty = replayPayload();
  empty.effectiveAsOfTimeMs = null as unknown as number;
  empty.lastFinalizedCandleCloseTimeMs = null as unknown as number;
  empty.sourceCandleCount = 0;
  empty.analysisCandleCount = 0;
  empty.replayWindowStartTimeMs = null as unknown as number;
  empty.contiguousSegmentStartTimeMs = null as unknown as number;
  empty.events = [];
  empty.candles = [];
  syncLayerMetadata(empty);
  const parsed = parseTechnicalReplayEnvelope(empty);
  assert.equal(parsed.effectiveAsOfTimeMs, null);
  assert.deepEqual(parsed.events, []);
});

test("as-of normalization and stepping use UTC timeframe boundaries and never enter the forming bar", () => {
  const hour = 3_600_000;
  const now = 10 * hour + 1_234;
  assert.equal(latestFinalizedBoundaryMs(now, "1h"), 10 * hour);
  assert.equal(normalizeReplayAsOfMs(9 * hour + 50_000, "1h", now), 9 * hour);
  assert.equal(normalizeReplayAsOfMs(20 * hour, "1h", now), 10 * hour);
  assert.equal(stepReplayAsOfMs(9 * hour, "1h", 1, now), 10 * hour);
  assert.equal(stepReplayAsOfMs(10 * hour, "1h", 1, now), 10 * hour);
  assert.equal(stepReplayAsOfMs(9 * hour, "1h", -1, now), 8 * hour);
});

test("latest request gate prevents an older response from overwriting newer state", () => {
  const gate = new LatestRequestGate();
  const oldRequest = gate.begin();
  const newestRequest = gate.begin();
  assert.equal(gate.isCurrent(oldRequest), false);
  assert.equal(gate.isCurrent(newestRequest), true);
});
