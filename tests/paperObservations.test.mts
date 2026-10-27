import assert from "node:assert/strict";
import test from "node:test";
import { forwardJournalCounts, parsePaperObservations } from "../src/lib/paperObservations.ts";

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

// FWDCOUNT-1: the journal totals are additive — an older backend omits them (AGENTS.md #30).
const filled = { ...item, decisionId: "btc-4h-2", decision: "long", modelVersion: "m1", confidence: 0.7, abstentionReason: null, fillPrice: 60100, fillObservedAtUtc: "2026-09-21T00:01:00Z" };
const page = { symbol: "BTCUSDT", available: true, reason: null, items: [item, filled] };

test("forward observation parser reads journal totals and degrades to null when an older backend omits them", () => {
  const parsed = parsePaperObservations({ ...page, total: 131, filledTotal: 7, outcomeTotal: 3 });
  assert.deepEqual([parsed.total, parsed.filledTotal, parsed.outcomeTotal], [131, 7, 3]);
  const legacy = parsePaperObservations(page);
  assert.deepEqual([legacy.total, legacy.filledTotal, legacy.outcomeTotal], [null, null, null]);
  const unavailable = parsePaperObservations({ symbol: "BTCUSDT", available: false, reason: "not initialized", items: [], total: 0, filledTotal: 0, outcomeTotal: 0 });
  assert.equal(unavailable.total, 0);
});

test("forward observation parser fails closed on malformed or inconsistent totals", () => {
  const bad = [
    { total: null, filledTotal: 0, outcomeTotal: 0 },
    { total: "131", filledTotal: 7, outcomeTotal: 3 },
    { total: 131.5, filledTotal: 7, outcomeTotal: 3 },
    { total: -1, filledTotal: 0, outcomeTotal: 0 },
    { total: 1, filledTotal: 1, outcomeTotal: 0 }, // fewer decisions than rows on the page
    { total: 131 }, // fills/outcomes missing once totals are present
    { total: 131, filledTotal: 0, outcomeTotal: 0 }, // fewer fills than on the page
    { total: 131, filledTotal: 132, outcomeTotal: 3 },
    { total: 131, filledTotal: 7, outcomeTotal: 8 }, // outcome without a fill
  ];
  for (const totals of bad) assert.throws(() => parsePaperObservations({ ...page, ...totals }), /INVALID_API_RESPONSE/, JSON.stringify(totals));
});

test("forward journal counts never present a loaded page as the journal total", () => {
  const withTotals = parsePaperObservations({ ...page, total: 131, filledTotal: 7, outcomeTotal: 3 });
  assert.deepEqual(forwardJournalCounts(withTotals, 2), { decisions: "131", fills: "7", outcomes: "3" });
  const legacy = parsePaperObservations(page);
  // A page as long as the request may hide older rows: at least, not exactly.
  assert.deepEqual(forwardJournalCounts(legacy, 2), { decisions: "≥ 2", fills: "≥ 1", outcomes: "≥ 0" });
  // A shorter page is the whole journal, so its counts are exact.
  assert.deepEqual(forwardJournalCounts(legacy, 100), { decisions: "2", fills: "1", outcomes: "0" });
});
