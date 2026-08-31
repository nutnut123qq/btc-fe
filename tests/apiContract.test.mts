import assert from "node:assert/strict";
import test from "node:test";
import { canUseApiMutations, EXPECTED_API_CONTRACT_VERSION, isApiContractCompatible, isCoreResearchRecord, requireAppMeta, requireArray, requireArrayField, requireDataAudit, requireExperimentalAccuracy, requireExperimentalEnsemble, requireExperimentalEnsembleSummary, requireFreshnessHealth, requireGapRetry, requireLiveHealth, requireMutationContract, requireReadyHealth, requireRecord, requireVersionedResearchItems, requireWorkersHealth, safeApiErrorMessage } from "../src/lib/apiContract.ts";
import { authenticatedFetch } from "../src/lib/sessionAuth.ts";

test("requireArrayField accepts the expected API shape", () => {
  const result = requireArrayField<number>({ items: [1, 2] }, "items", "history");
  assert.deepEqual(result.items, [1, 2]);
});

test("requireArrayField rejects object instead of array", () => {
  assert.throws(
    () => requireArrayField({ items: { one: 1 } }, "items", "history"),
    /INVALID_API_RESPONSE: history\.items must be an array/,
  );
});

test("requireRecord rejects arrays and requireArray rejects objects", () => {
  assert.throws(() => requireRecord([], "payload"), /must be an object/);
  assert.throws(() => requireArray({}, "payload"), /must be an array/);
});

test("authenticatedFetch fails closed outside an authenticated browser session", async () => {
  await assert.rejects(
    authenticatedFetch("admin", "https://example.invalid"),
    /ADMIN_AUTH_REQUIRED/,
  );
});

test("safeApiErrorMessage hides provider details", () => {
  assert.equal(
    safeApiErrorMessage('{"code":"LLM_NOT_CONFIGURED","message":"BLACKBOX_API_KEY missing"}', 503),
    "Giải thích LLM chưa được cấu hình; các chức năng định lượng vẫn hoạt động.",
  );
  assert.equal(
    safeApiErrorMessage("provider stack trace with secret", 500),
    "Dịch vụ tạm thời không khả dụng (HTTP 500).",
  );
  assert.equal(
    safeApiErrorMessage('{"code":"UNKNOWN","message":"secret provider detail"}', 400),
    "Yêu cầu không hợp lệ (HTTP 400).",
  );
  assert.equal(
    safeApiErrorMessage('{"code":"GAP_ALREADY_FILLED","message":"internal detail"}', 409),
    "Gap dữ liệu này đã được lấp; không cần retry.",
  );
});

test("versioned research records fail closed without validity metadata", () => {
  assert.deepEqual(
    requireVersionedResearchItems({ items: [{ validityStatus: "Legacy", pipelineVersion: "p1", evaluationVersion: "e1", invalidReason: "old", archivedAtUtc: null }] }, "items", "runs").items,
    [{ validityStatus: "Legacy", pipelineVersion: "p1", evaluationVersion: "e1", invalidReason: "old", archivedAtUtc: null }],
  );
  assert.throws(
    () => requireVersionedResearchItems({ items: [{ validityStatus: "Unknown", pipelineVersion: "p1", evaluationVersion: "e1", invalidReason: null, archivedAtUtc: null }] }, "items", "runs"),
    /validityStatus is invalid/,
  );
  assert.throws(
    () => requireVersionedResearchItems({ items: [{ validityStatus: "Valid", invalidReason: null }] }, "items", "runs"),
    /missing version metadata/,
  );
  assert.throws(
    () => requireVersionedResearchItems({ items: [{ validityStatus: "Valid", pipelineVersion: "p1", evaluationVersion: "e1", invalidReason: null }] }, "items", "runs"),
    /archivedAtUtc must be null or a string/,
  );
  assert.throws(
    () => requireVersionedResearchItems({ items: [{ validityStatus: "Valid", pipelineVersion: " ", evaluationVersion: "e1", invalidReason: null, archivedAtUtc: null }] }, "items", "runs"),
    /missing version metadata/,
  );
});

test("ensemble records cannot masquerade as production evidence", () => {
  const common = {
    validityStatus: "Legacy",
    pipelineVersion: "legacy-unversioned",
    evaluationVersion: "legacy-unversioned",
    invalidReason: "35.54% directional accuracy",
    archivedAtUtc: null,
  };
  assert.equal(requireExperimentalEnsemble({ ...common, validated: false, maturity: "Experimental", promotionEligible: false, promotionReason: "Gate failed" }, "ensemble").promotionEligible, false);
  assert.throws(
    () => requireExperimentalEnsemble({ ...common, validated: true, maturity: "Validated", promotionEligible: true, promotionReason: "" }, "ensemble"),
    /missing experimental promotion metadata/,
  );
  assert.throws(
    () => requireExperimentalEnsemble({ ...common, validated: false, maturity: "Experimental", promotionEligible: false, promotionReason: " " }, "ensemble"),
    /missing experimental promotion metadata/,
  );
});

test("prediction accuracy requires raw, canonical and non-promotable metadata", () => {
  const metrics = {
    totalPredictions: 10, evaluatedCount: 8, trueCount: 3, falseCount: 5, pendingCount: 2, winRatePct: 37.5,
    canonicalPredictionCount: 9, canonicalEvaluatedCount: 7, canonicalTrueCount: 3, canonicalFalseCount: 4, canonicalWinRatePct: 42.9,
    validated: false, maturity: "Experimental", promotionEligible: false, promotionReason: "Gate not passed",
  };
  assert.equal(requireExperimentalAccuracy(metrics).canonicalEvaluatedCount, 7);
  assert.throws(() => requireExperimentalAccuracy({ ...metrics, canonicalWinRatePct: undefined }), /missing raw or canonical metrics/);
  assert.throws(() => requireExperimentalAccuracy({ ...metrics, promotionReason: "" }), /missing experimental promotion metadata/);
});

test("ensemble summary requires versioned re-evaluation metrics and items", () => {
  const summary = {
    totalPredictions: 10, trueCount: 3, falseCount: 5, pendingCount: 2, winRatePct: 37.5,
    canonicalEvaluatedCount: 7, canonicalTrueCount: 3, canonicalFalseCount: 4, canonicalPendingCount: 1, canonicalWinRatePct: 42.9,
    reevaluatedCount: 6, reevaluatedTrueCount: 2, reevaluatedFalseCount: 3, reevaluatedPendingCount: 1, reevaluatedWinRatePct: 40,
    validated: false, maturity: "Experimental", promotionEligible: false, promotionReason: "Gate not passed",
    reevaluatedItems: [],
  };
  assert.equal(requireExperimentalEnsembleSummary(summary).reevaluatedCount, 6);
  assert.throws(() => requireExperimentalEnsembleSummary({ ...summary, reevaluatedCount: undefined }), /missing raw, canonical or re-evaluated metrics/);
  assert.throws(() => requireExperimentalEnsembleSummary({ ...summary, reevaluatedItems: undefined }), /reevaluatedItems must be an array/);
});

test("core scope excludes archived, Legacy and Invalid records", () => {
  assert.equal(isCoreResearchRecord({ validityStatus: "Valid", archivedAtUtc: null }), true);
  assert.equal(isCoreResearchRecord({ validityStatus: "Legacy", archivedAtUtc: null }), false);
  assert.equal(isCoreResearchRecord({ validityStatus: "Invalid", archivedAtUtc: null }), false);
  assert.equal(isCoreResearchRecord({ validityStatus: "Valid", archivedAtUtc: "2026-08-31T00:00:00Z" }), false);
});

test("health contracts distinguish liveness and database readiness", () => {
  assert.equal(requireLiveHealth({ status: "healthy", checkedAtUtc: "2026-08-31T00:00:00Z" }).status, "healthy");
  assert.equal(requireReadyHealth({ status: "not_ready", databaseReachable: false, checkedAtUtc: "2026-08-31T00:00:00Z", responseTimeMs: 30 }).status, "not_ready");
  assert.throws(() => requireLiveHealth({ status: "degraded", checkedAtUtc: "2026-08-31T00:00:00Z" }), /health live.status/);
  assert.throws(() => requireReadyHealth({ status: "ready", databaseReachable: true, checkedAtUtc: "2026-08-31T00:00:00Z" }), /responseTimeMs/);
});

test("freshness contract requires latest candle age and bounded status", () => {
  const response = {
    status: "degraded", databaseReachable: true, checkedAtUtc: "2026-08-31T00:00:00Z", symbol: "BTCUSDT",
    klines: [{ timeframe: "1h", status: "stale", latestOpenTimeUtc: "2026-08-30T22:00:00Z", ageSeconds: 7200, maxAgeSeconds: 5400 }],
  };
  assert.equal(requireFreshnessHealth(response).status, "degraded");
  assert.throws(() => requireFreshnessHealth({ ...response, klines: [{ ...response.klines[0], ageSeconds: undefined }] }), /ageSeconds/);
  assert.throws(() => requireFreshnessHealth({ ...response, klines: [{ ...response.klines[0], status: "unknown" }] }), /status is invalid/);
});

test("worker heartbeat contract fails closed on missing nullable fields", () => {
  const worker = {
    name: "KlinesIngestionWorker", status: "never", lastStartedAtUtc: null, lastSucceededAtUtc: null,
    lastFailedAtUtc: null, ageSeconds: null, maxAgeSeconds: 1800, lastDurationMs: null, message: null,
  };
  assert.equal(requireWorkersHealth({ checkedAtUtc: "2026-08-31T00:00:00Z", workers: [worker] }).workers instanceof Array, true);
  assert.throws(
    () => requireWorkersHealth({ checkedAtUtc: "2026-08-31T00:00:00Z", workers: [{ ...worker, lastFailedAtUtc: undefined }] }),
    /lastFailedAtUtc/,
  );
});

test("data audit requires classified gap state and latest candle age", () => {
  const timeframe = {
    timeframe: "1h", totalKlines: 10, minOpenTimeMs: 1, maxOpenTimeMs: 10, expectedBars: 12, missingBars: 2, gapRangeCount: 1,
    dataCoveragePct: 83.3, largestGapMs: 7200000, pendingGapCount: 1, unavailableGapCount: 0, gapLedgerStatus: "Reconciled",
    latestCandleAgeSeconds: 1800, candlePatterns: 3, technicalIndicators: 10, windowVectors: 2,
    mlFeatureStores: 8, priceTargets: 8, windowClassificationDatasets: 4,
    topGaps: [{ id: 7, startOpenTimeMs: 2, endOpenTimeMs: 3, missingBars: 2, status: "Pending", attemptCount: 1, nextRetryAtUtc: null, reason: null }],
  };
  const response = { symbol: "BTCUSDT", generatedAtUtc: "2026-08-31T00:00:00Z", timeframes: [timeframe], news: {}, rulesAlerts: {} };
  assert.equal(requireDataAudit(response).symbol, "BTCUSDT");
  const deferredInventory = Object.fromEntries([
    "candlePatterns", "technicalIndicators", "windowVectors", "mlFeatureStores", "priceTargets", "windowClassificationDatasets",
  ].map((field) => [field, null]));
  assert.equal(requireDataAudit({ ...response, timeframes: [{ ...timeframe, ...deferredInventory }] }).symbol, "BTCUSDT");
  assert.equal(requireDataAudit({ ...response, timeframes: [{ ...timeframe, gapLedgerStatus: "LiveFallback" }] }).symbol, "BTCUSDT");
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, gapLedgerStatus: "Unknown" }] }), /gapLedgerStatus/);
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, candlePatterns: undefined }] }), /candlePatterns/);
  assert.equal(requireDataAudit({ ...response, timeframes: [{ ...timeframe, expectedBars: null }] }).symbol, "BTCUSDT");
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, expectedBars: undefined }] }), /expectedBars/);
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, gapRangeCount: undefined }] }), /gapRangeCount/);
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, latestCandleAgeSeconds: undefined }] }), /latestCandleAgeSeconds/);
  assert.throws(() => requireDataAudit({ ...response, timeframes: [{ ...timeframe, topGaps: [{ ...timeframe.topGaps[0], status: "Unknown" }] }] }), /status is invalid/);
});

test("manual gap retry response must prove the reset state", () => {
  const response = { id: 7, status: "Pending", attemptCount: 0, nextRetryAtUtc: null, updatedAtUtc: "2026-08-31T00:00:00Z" };
  assert.equal(requireGapRetry(response).id, 7);
  assert.throws(() => requireGapRetry({ ...response, attemptCount: 1 }), /reset state is invalid/);
  assert.throws(() => requireGapRetry({ ...response, updatedAtUtc: "" }), /updatedAtUtc/);
});

test("startup meta pins Phase 3 contract and rejects incomplete metadata", () => {
  const meta = {
    appVersion: "1.0.0", apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
    dataPipelineVersion: "quant-pipeline-v3", evaluationVersion: "evaluation-v2", environment: "Research",
  };
  assert.equal(requireAppMeta(meta).apiContractVersion, EXPECTED_API_CONTRACT_VERSION);
  assert.equal(isApiContractCompatible(meta), true);
  assert.equal(isApiContractCompatible({ ...meta, apiContractVersion: "2026-08-phase2" }), false);
  assert.equal(canUseApiMutations("compatible"), true);
  assert.equal(canUseApiMutations("mismatch"), false);
  assert.equal(canUseApiMutations("unavailable"), false);
  assert.doesNotThrow(() => requireMutationContract(canUseApiMutations("compatible")));
  for (const state of ["mismatch", "unavailable"] as const) {
    assert.throws(
      () => requireMutationContract(canUseApiMutations(state)),
      (error: unknown) => error instanceof Error
        && error.message.includes("thao tác ghi đã bị khóa")
        && !error.message.includes("API_CONTRACT_UNVERIFIED"),
    );
  }
  assert.throws(() => requireAppMeta({ ...meta, dataPipelineVersion: "" }), /dataPipelineVersion/);
});
