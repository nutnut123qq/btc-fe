import assert from "node:assert/strict";
import test from "node:test";
import { buildTechnicalCoverageSummary } from "../src/lib/dataCoverage.ts";
import type { DataAuditResponse, TimeframeAuditSummary, WorkersHealthDto } from "../src/lib/types.ts";

function timeframe(timeframeValue: string, overrides: Partial<TimeframeAuditSummary> = {}): TimeframeAuditSummary {
  return {
    timeframe: timeframeValue,
    totalKlines: 100,
    minOpenTimeMs: 1,
    maxOpenTimeMs: 100,
    expectedBars: 100,
    missingBars: 0,
    gapRangeCount: 0,
    dataCoveragePct: 100,
    largestGapMs: 0,
    pendingGapCount: 0,
    unavailableGapCount: 0,
    gapLedgerStatus: "Reconciled",
    latestCandleAgeSeconds: 10,
    candlePatterns: 20,
    technicalIndicators: 100,
    windowVectors: 10,
    mlFeatureStores: null,
    priceTargets: null,
    windowClassificationDatasets: null,
    topGaps: [],
    quality: {
      finalizedRows: 100,
      formingRows: 0,
      invalidOhlcvRows: 0,
      invalidDurationRows: 0,
      duplicateOpenTimeRows: 0,
      latestFinalizedCloseTimeMs: 100,
      latestFinalizedAgeSeconds: 10,
      isStale: false,
    },
    derivedTables: [{
      table: "TechnicalIndicators",
      rows: 100,
      latestSourceTimeMs: 100,
      latestAgeSeconds: 10,
      expectedOnePerFinalizedBar: true,
      missingRows: 0,
    }],
    ...overrides,
  };
}

function audit(timeframes: TimeframeAuditSummary[]): DataAuditResponse {
  return {
    symbol: "BTCUSDT",
    generatedAtUtc: "2026-09-22T00:00:00Z",
    timeframes,
    news: { articles: 0, chunks: 0, minDate: null, maxDate: null },
    rulesAlerts: { rules: 0, signals: 0, alerts: 0 },
  };
}

test("coverage summary keeps only 1h/4h/1d active and separates legacy rows", () => {
  const summary = buildTechnicalCoverageSummary(audit([
    timeframe("1h"), timeframe("4h"), timeframe("1d"), timeframe("15m"),
  ]), null);
  assert.deepEqual(summary.rows.map((row) => row.timeframe), ["1h", "4h", "1d"]);
  assert.deepEqual(summary.rows.map((row) => row.availability), ["available", "available", "available"]);
  assert.deepEqual(summary.legacyTimeframes.map((row) => row.timeframe), ["15m"]);
});

test("coverage summary does not present missing, stale or unreported audit data as available", () => {
  const summary = buildTechnicalCoverageSummary(audit([
    timeframe("1h", { missingBars: 3 }),
    timeframe("4h", { quality: null, derivedTables: null }),
  ]), null);
  assert.equal(summary.rows[0].availability, "partial");
  assert.match(summary.rows[0].reasons.join(" "), /Thiếu 3 nến/);
  assert.equal(summary.rows[1].availability, "partial");
  assert.match(summary.rows[1].reasons.join(" "), /Chưa có quality audit/);
  assert.equal(summary.rows[2].availability, "unavailable");
});

test("invalid-duration rows are visible and keep technical coverage partial", () => {
  const invalidQuality = { ...timeframe("1h").quality!, invalidDurationRows: 2 };
  const summary = buildTechnicalCoverageSummary(audit([timeframe("1h", { quality: invalidQuality })]), null);
  assert.equal(summary.rows[0].availability, "partial");
  assert.match(summary.rows[0].reasons.join(" "), /2 dòng sai thời lượng timeframe/);
});

test("coverage summary exposes only technical pipeline workers without upgrading their status", () => {
  const workers: WorkersHealthDto = {
    checkedAtUtc: "2026-09-22T00:00:00Z",
    workers: [
      { name: "KlinesIngestionWorker", status: "healthy", lastStartedAtUtc: null, lastSucceededAtUtc: null, lastFailedAtUtc: null, ageSeconds: 1, maxAgeSeconds: 60, lastDurationMs: 10, message: null },
      { name: "IndexingBackgroundWorker", status: "failed", lastStartedAtUtc: null, lastSucceededAtUtc: null, lastFailedAtUtc: null, ageSeconds: 1, maxAgeSeconds: 60, lastDurationMs: 10, message: "failed" },
      { name: "RssIngestionService", status: "healthy", lastStartedAtUtc: null, lastSucceededAtUtc: null, lastFailedAtUtc: null, ageSeconds: 1, maxAgeSeconds: 60, lastDurationMs: 10, message: null },
    ],
  };
  const summary = buildTechnicalCoverageSummary(null, workers);
  assert.deepEqual(summary.technicalWorkers.map((worker) => worker.name), ["KlinesIngestionWorker", "IndexingBackgroundWorker"]);
  assert.equal(summary.technicalWorkers[1].status, "failed");
});
