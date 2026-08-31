import assert from "node:assert/strict";
import test from "node:test";
import { isCoreResearchRecord, requireArray, requireArrayField, requireExperimentalAccuracy, requireExperimentalEnsemble, requireExperimentalEnsembleSummary, requireRecord, requireVersionedResearchItems, safeApiErrorMessage } from "../src/lib/apiContract.ts";
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
