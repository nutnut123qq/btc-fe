import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { begin, fail, idle, loadView, metric, succeed } from "../src/lib/loadState.ts";

// F02/F04 (live-audit-20261024) — a failed fetch must never render as a real 0 or an
// empty conclusion on Prediction / Paper / Journal. Source pins keep the old
// default-to-zero patterns from sneaking back; the behavioral cases pin the
// loadState semantics these screens rely on.

const component = (name: string) =>
  readFileSync(new URL(`../src/components/${name}`, import.meta.url), "utf8");

test("PredictionScreen: accuracy numbers come from metric(), not ?? 0", () => {
  const src = component("PredictionScreen.tsx");
  assert.doesNotMatch(src, /accuracy\?\.\w+ \?\? 0/);
  assert.match(src, /metric\(accuracy, \(a\) => a\.winRatePct/);
  assert.match(src, /<LoadNotice state=\{history\}/);
  // empty-history copy only in the successful-empty branch
  assert.match(src, /historyView === "empty" \? \(\s*<div[^>]*>\s*\{includeLegacy \? "Chưa có dự đoán nào" : "Không có dự đoán Valid/);
  // a failed model list is not "unavailable"
  assert.match(src, /const modelUnavailable = modelList\.data !== null && !canPredict;/);
});

test("PaperTradeScreen: counters and replay cards are dashes until a successful response", () => {
  const src = component("PaperTradeScreen.tsx");
  assert.doesNotMatch(src, /summary\?\.\w+ \?\? 0/);
  assert.doesNotMatch(src, /"0\.0%"|"0\.00%"/);
  assert.match(src, /const obsCount = \(n: number\) => metric\(observations, \(\) => n\);/);
  assert.match(src, /observations\.data === null \? null : !observations\.data\.available/);
  assert.match(src, /replay\.data !== null && closedTrades\.length === 0/);
});

test("BinanceTradeHistoryScreen: no 'Cập nhật' before a success, no 0 lệnh from a failure", () => {
  const src = component("BinanceTradeHistoryScreen.tsx");
  assert.doesNotMatch(src, /useState<Date>\(new Date\(\)\)/);
  assert.doesNotMatch(src, /totalCount \|\| 0/);
  assert.match(src, /trades\.succeededAt !== null && \(/);
  assert.match(src, /tradesView === "empty" \? \(/);
});

test("scope switch drops old data; late response for the old scope is ignored", () => {
  const a = succeed(idle<number[]>("BTCUSDT|4h|false"), [1, 2], 1000);
  const switched = begin(a, "BTCUSDT|1h|false");
  assert.equal(switched.data, null);
  assert.equal(metric(switched, (d) => d.length), "—");
  const late = succeed(switched, [9], 2000, "BTCUSDT|4h|false");
  assert.equal(late, switched);
  assert.equal(loadView(late), "loading");
});

test("failure before any success is error (not empty); failed refresh keeps as-of", () => {
  const failed = fail(begin(idle<{ items: number[] }>("p1")), new Error("HTTP 530"), 1000);
  assert.equal(loadView(failed), "error");
  assert.equal(failed.succeededAt, null);
  const ok = succeed(begin(failed), { items: [] }, 2000);
  assert.equal(loadView(ok), "empty");
  const refreshFailed = fail(begin(ok), new Error("HTTP 530"), 3000);
  assert.equal(refreshFailed.succeededAt, 2000);
  assert.equal(loadView(refreshFailed), "empty");
});
