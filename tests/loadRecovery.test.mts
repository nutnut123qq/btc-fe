import assert from "node:assert/strict";
import test from "node:test";
import { begin, fail, idle, isStale, loadView, metric, settle, succeed } from "../src/lib/loadState.ts";
import { backoffDelayMs, isRestorableHref } from "../src/lib/reconnect.ts";
import { getLlmUiState, LLM_STATE_LABEL } from "../src/lib/researchUi.ts";

const T0 = Date.parse("2026-10-24T05:00:00Z");

test("load states: pending, 5xx, success-empty and success-data are distinct", () => {
  const pending = idle<number[]>("BTCUSDT|4h");
  assert.equal(loadView(pending), "loading");
  assert.equal(metric(pending, (d) => d.length), "—");

  const failed = fail(begin(pending), new Error("Dịch vụ tạm thời không khả dụng (HTTP 530)."), T0);
  assert.equal(loadView(failed), "error");
  assert.equal(failed.succeededAt, null, "a failure never invents a success time");
  assert.equal(metric(failed, (d) => d.length), "—", "a failure never renders 0");

  const empty = succeed(begin(failed), [], T0 + 1_000);
  assert.equal(loadView(empty), "empty");
  assert.equal(metric(empty, (d) => d.length), "0", "0 only from a successful response");

  const data = succeed(begin(empty), [1, 2, 3], T0 + 2_000);
  assert.equal(loadView(data), "data");
  assert.equal(metric(data, (d) => d.length), "3");
});

test("a failed refresh keeps the last good data and its success time, marked stale", () => {
  const ok = succeed(idle<number[]>("s"), [7], T0);
  const refreshed = fail(begin(ok), new Error("HTTP 502"), T0 + 60_000);
  assert.deepEqual(refreshed.data, [7]);
  assert.equal(refreshed.succeededAt, T0);
  assert.equal(refreshed.attemptedAt, T0 + 60_000);
  assert.equal(isStale(refreshed), true);
  const recovered = succeed(begin(refreshed), [8], T0 + 120_000);
  assert.equal(isStale(recovered), false);
  assert.equal(recovered.succeededAt, T0 + 120_000);
});

test("switching symbol/filter never shows the previous scope's data, and late responses are dropped", () => {
  const btc = succeed(idle<string>("MBB|1d"), "MBB data", T0);
  const switched = begin(btc, "BID|1d");
  assert.equal(switched.data, null);
  assert.equal(loadView(switched), "loading");
  const late = succeed(switched, "MBB data (late)", T0 + 5, "MBB|1d");
  assert.equal(late, switched, "a response for the old scope is ignored");
  const lateFail = fail(switched, new Error("x"), T0 + 6, "MBB|1d");
  assert.equal(lateFail, switched);
});

test("partial success via allSettled keeps the fulfilled part and reports the rejected one", async () => {
  const [a, b] = await Promise.allSettled([Promise.resolve([1]), Promise.reject(new Error("HTTP 530"))]);
  const okPart = settle(idle<number[]>(), a, T0);
  const badPart = settle(idle<number[]>(), b as PromiseSettledResult<number[]>, T0);
  assert.equal(loadView(okPart), "data");
  assert.equal(loadView(badPart), "error");
  assert.equal(badPart.error, "HTTP 530");
});

test("reconnect backoff grows exponentially and is capped", () => {
  assert.equal(backoffDelayMs(0, 4_000, 60_000), 4_000);
  assert.equal(backoffDelayMs(1, 4_000, 60_000), 8_000);
  assert.equal(backoffDelayMs(2, 4_000, 60_000), 16_000);
  assert.equal(backoffDelayMs(10, 4_000, 60_000), 60_000);
  assert.equal(backoffDelayMs(Number.NaN, 5_000, 60_000), 5_000);
});

test("nav memory only restores in-app paths of known screens", () => {
  const allowed = new Set(["/", "/co-phieu", "/mbb", "/tin-tuc"]);
  assert.equal(isRestorableHref("/co-phieu?symbol=BID", allowed), true);
  assert.equal(isRestorableHref("/mbb", allowed), true);
  assert.equal(isRestorableHref("//evil.example/co-phieu", allowed), false);
  assert.equal(isRestorableHref("https://evil.example/", allowed), false);
  assert.equal(isRestorableHref("/khong-ton-tai?x=1", allowed), false);
  assert.equal(isRestorableHref(42, allowed), false);
});

test("capability states: unverified/unavailable are never labelled as configured-off", () => {
  assert.equal(getLlmUiState(null, true), "unverified");
  assert.doesNotMatch(LLM_STATE_LABEL.unverified, /OFF/);
  assert.doesNotMatch(LLM_STATE_LABEL.unavailable, /OFF/);
  for (const label of Object.values(LLM_STATE_LABEL)) {
    assert.doesNotMatch(label, /định lượng vẫn hoạt động/);
  }
});
