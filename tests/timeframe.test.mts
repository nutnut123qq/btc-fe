import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_TIMEFRAMES,
  DEFAULT_TIMEFRAME,
  intervalToMs,
  isActiveTimeframe,
  normalizeActiveTimeframe,
} from "../src/lib/timeframe.ts";

test("production timeframe policy is exactly 1h, 4h and 1d with 4h as default", () => {
  assert.deepEqual(ACTIVE_TIMEFRAMES, ["1h", "4h", "1d"]);
  assert.equal(DEFAULT_TIMEFRAME, "4h");
  assert.equal(isActiveTimeframe("4h"), true);
  assert.equal(isActiveTimeframe("15m"), false);
});

test("legacy or invalid persisted selections recover to 4h", () => {
  assert.equal(normalizeActiveTimeframe("15m"), "4h");
  assert.equal(normalizeActiveTimeframe("30m"), "4h");
  assert.equal(normalizeActiveTimeframe(undefined), "4h");
  assert.equal(normalizeActiveTimeframe("1d"), "1d");
});

test("legacy intervals remain interpretable when rendering historical records", () => {
  assert.equal(intervalToMs("15m"), 900_000);
  assert.equal(intervalToMs("unknown"), intervalToMs(DEFAULT_TIMEFRAME));
});
