import assert from "node:assert/strict";
import test from "node:test";
import { sentimentBand, sentimentMeterPercent } from "../src/lib/sentiment.ts";

test("sentiment helpers use the backend -100 to +100 scale", () => {
  assert.equal(sentimentBand(-70), "extreme-fear");
  assert.equal(sentimentBand(-10), "neutral");
  assert.equal(sentimentBand(40), "greed");
  assert.equal(sentimentBand(0, "EXTREME_FEAR"), "extreme-fear");
  assert.equal(sentimentMeterPercent(-100), 0);
  assert.equal(sentimentMeterPercent(0), 50);
  assert.equal(sentimentMeterPercent(100), 100);
});
