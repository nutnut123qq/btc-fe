import assert from "node:assert/strict";
import test from "node:test";
import {
  assertHistoricalAnalogEnvelope,
  formatSignedPercent,
  formatSimilarity,
  getAnalogDirectionLabel,
  HISTORICAL_ANALOG_CONTRACT_VERSION,
} from "../src/lib/historicalAnalog.ts";

test("analog outcomes use research labels instead of win/loss wording", () => {
  assert.equal(getAnalogDirectionLabel(1), "TĂNG");
  assert.equal(getAnalogDirectionLabel(-1), "GIẢM");
  assert.equal(getAnalogDirectionLabel(0), "TRUNG TÍNH");
  assert.equal(getAnalogDirectionLabel(null), "CHƯA ĐỦ DỮ LIỆU");
});

test("analog envelope accepts unavailable query null and rejects method drift", () => {
  const response = {
    contractVersion: HISTORICAL_ANALOG_CONTRACT_VERSION,
    rankingMethod: "shape-similarity-desc-context-audit-only",
    query: null,
    summaries: [],
  };
  assert.doesNotThrow(() => assertHistoricalAnalogEnvelope(response));
  assert.throws(
    () => assertHistoricalAnalogEnvelope({ ...response, rankingMethod: "context-weighted" }),
    /unsupported ranking method/,
  );
  assert.throws(
    () => assertHistoricalAnalogEnvelope({ ...response, query: undefined }),
    /object or null/,
  );
});

test("similarity and return formatting remains explicit", () => {
  assert.equal(HISTORICAL_ANALOG_CONTRACT_VERSION, "2026-09-historical-analogs");
  assert.equal(formatSimilarity(0.9344), "93.4%");
  assert.equal(formatSimilarity(null), "Không đủ context");
  assert.equal(formatSignedPercent(1.234), "+1.23%");
  assert.equal(formatSignedPercent(-0.4), "-0.40%");
});
