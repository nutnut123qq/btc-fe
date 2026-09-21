import assert from "node:assert/strict";
import test from "node:test";
import { candleLifecycle, isMarketStreamStale, latestCandleLifecycle } from "../src/lib/marketTruth.ts";

test("candle lifecycle never presents a forming candle as finalized", () => {
  const now = Date.parse("2026-09-21T12:00:00Z");
  assert.equal(candleLifecycle(now - 3_600_000, "1h", now), "closed");
  assert.equal(candleLifecycle(now - 30 * 60_000, "1h", now), "forming");
  assert.equal(latestCandleLifecycle([{ openTimeMs: now - 5 * 3_600_000 }, { openTimeMs: now - 30 * 60_000 }], "1h", now), "forming");
});

test("market stream fails closed when disconnected, missing or stale", () => {
  const now = 100_000;
  assert.equal(isMarketStreamStale({ state: "open", lastMessageAtMs: now - 1_000 }, now), false);
  assert.equal(isMarketStreamStale({ state: "open", lastMessageAtMs: now - 20_000 }, now), true);
  assert.equal(isMarketStreamStale({ state: "reconnecting", lastMessageAtMs: now - 1_000 }, now), true);
  assert.equal(isMarketStreamStale({ state: "open", lastMessageAtMs: null }, now), true);
});
