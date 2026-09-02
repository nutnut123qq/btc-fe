import assert from "node:assert/strict";
import test from "node:test";
import { dataAgeMs, formatDataAge, isDataStale } from "../src/lib/freshness.ts";

const now = Date.parse("2026-09-02T12:00:00Z");

test("freshness helpers fail closed for stale and invalid timestamps", () => {
  assert.equal(dataAgeMs("2026-09-02T11:30:00Z", now), 30 * 60_000);
  assert.equal(isDataStale("2026-09-02T09:00:00Z", 2 * 60 * 60_000, now), true);
  assert.equal(isDataStale("invalid", 2 * 60 * 60_000, now), true);
  assert.equal(formatDataAge("2026-08-31T12:00:00Z", now), "2 ngày trước");
});
