import assert from "node:assert/strict";
import test from "node:test";
import { parsePaperObservations } from "../src/lib/paperObservations.ts";

const item = {
  id: "7d6fbbf9-9675-4691-ad67-6161a96ce68f",
  decisionId: "btc-4h-1",
  recorderVersion: "forward-paper-observation-v1",
  symbol: "BTCUSDT",
  timeframe: "4h",
  signalBarOpenTimeMs: 1000,
  signalBarCloseTimeMs: 1999,
  observedAtUtc: "2026-09-21T00:00:03Z",
  availableTimeMs: 3000,
  modelVersion: null,
  decision: "abstain",
  confidence: null,
  abstentionReason: "model-unavailable",
  quoteSource: "binance-spot-book-ticker",
  quotePrice: 60000,
  quoteReceivedAtUtc: "2026-09-21T00:00:02Z",
  quoteReceivedTimeMs: 2500,
  configProvenanceJson: "{}",
  evidenceProvenanceJson: "{}",
  fillPrice: null,
  fillObservedAtUtc: null,
  outcomeReturn: null,
  outcomeObservedAtUtc: null,
  outcomeHorizon: null,
};

test("forward observation parser preserves honest nullable fill and outcome", () => {
  const parsed = parsePaperObservations({ symbol: "BTCUSDT", available: true, reason: null, items: [item] });
  assert.equal(parsed.items[0].decision, "abstain");
  assert.equal(parsed.items[0].fillPrice, null);
  assert.equal(parsed.items[0].outcomeReturn, null);
});

test("forward observation parser fails closed on scope, chronology and duplicates", () => {
  assert.throws(() => parsePaperObservations({ symbol: "BTCUSDT", available: true, reason: null, items: [{ ...item, timeframe: "1h" }] }), /scope/);
  assert.throws(() => parsePaperObservations({ symbol: "BTCUSDT", available: true, reason: null, items: [{ ...item, availableTimeMs: 1000 }] }), /chronology/);
  assert.throws(() => parsePaperObservations({ symbol: "BTCUSDT", available: true, reason: null, items: [item, item] }), /duplicate/);
});
