import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseEquityContext } from "../src/lib/equity.ts";
import { parseForecastJournal } from "../src/lib/equityJournal.ts";
import {
  buyQuantityGate,
  describeDecisionReason,
  parseResearchNotes,
  unconvertedCorporateActionReasons,
} from "../src/lib/equityResearch.ts";
import { parseMbbPosition, type MbbPosition } from "../src/lib/mbb.ts";

// EQX v2 — shared cash pool / buy budget (§A3), stale benchmarks (§A4),
// session research notes + session-research forecasts (§B).

const BID_SCOPE = { symbol: "BID", timeframes: ["1d"] };
const SIGNAL = 1_760_544_000_000;
const DAY = 86_400_000;

const legacyPosition = {
  symbol: "BID", totalShares: 100, settledShares: 100, pendingShares: 0, avgCostPerShareVnd: 41_700,
  availableCashVnd: 1_000_000, updatedAtUtc: "2026-10-16T03:00:00Z",
  lots: [{ id: 1, quantity: 100, costPerShareVnd: 41_700, acquireDate: "2026-10-10", settleDate: "2026-10-14", settled: true, source: "manual" }],
};

test("position: shared cash pool fields are additive — absent means older backend, never 'unknown cash'", () => {
  const legacy = parseMbbPosition(legacyPosition, BID_SCOPE);
  assert.equal(legacy.cashPoolReported, false);
  assert.equal(legacy.sharedCashVnd, null);
  assert.equal(legacy.buyBudgetVnd, null);

  const pooled = parseMbbPosition({ ...legacyPosition, sharedCashVnd: 50_000_000, buyBudgetVnd: 20_000_000, cashSource: "shared-pool" }, BID_SCOPE);
  assert.equal(pooled.cashPoolReported, true);
  assert.equal(pooled.sharedCashVnd, 50_000_000);
  assert.equal(pooled.buyBudgetVnd, 20_000_000);
  assert.equal(pooled.cashSource, "shared-pool");

  const unknown = parseMbbPosition({ ...legacyPosition, sharedCashVnd: null, buyBudgetVnd: null, cashSource: null }, BID_SCOPE);
  assert.equal(unknown.cashPoolReported, true);
  assert.equal(unknown.sharedCashVnd, null);
  assert.throws(() => parseMbbPosition({ ...legacyPosition, buyBudgetVnd: -1 }, BID_SCOPE), /buyBudgetVnd must be >= 0/);
  assert.throws(() => parseMbbPosition({ ...legacyPosition, sharedCashVnd: "lots" }, BID_SCOPE), /sharedCashVnd/);
});

const buyMore = { maxBuyableShares: 400, maxBuyableLots: 4, estimatedCostVnd: 16_600_000 };
const pos = (over: Partial<MbbPosition>): MbbPosition => ({ ...parseMbbPosition(legacyPosition, BID_SCOPE), ...over });

test("buy quantity only behind a declared budget; cash/budget reason codes always withhold it", () => {
  const declared = pos({ cashPoolReported: true, sharedCashVnd: 50_000_000, buyBudgetVnd: 20_000_000 });
  assert.deepEqual(buyQuantityGate({ reasons: ["trend-constructive"], buyMore }, declared), { show: true });
  assert.deepEqual(buyQuantityGate({ reasons: ["budget-exceeds-cash"], buyMore }, declared), { show: false, reason: "budget-exceeds-cash" });
  assert.deepEqual(buyQuantityGate({ reasons: [], buyMore }, pos({ cashPoolReported: true, sharedCashVnd: 50_000_000, buyBudgetVnd: null })),
    { show: false, reason: "buy-budget-undeclared" });
  assert.deepEqual(buyQuantityGate({ reasons: [], buyMore }, pos({ cashPoolReported: true, sharedCashVnd: null, buyBudgetVnd: 1 })),
    { show: false, reason: "cash-unknown" });
  // Older backend (per-symbol cash, no budget concept) never shows a quantity.
  assert.deepEqual(buyQuantityGate({ reasons: [], buyMore }, pos({})), { show: false, reason: "budget-not-supported-by-backend" });
  assert.deepEqual(buyQuantityGate({ reasons: [], buyMore }, null), { show: false, reason: "position-not-loaded" });
  assert.deepEqual(buyQuantityGate({ reasons: [], buyMore: null }, declared), { show: false, reason: "no-buy-capacity" });
});

test("decision reasons: A3 codes and corporate-action-unconverted:{type} get honest copy", () => {
  assert.match(describeDecisionReason("buy-budget-undeclared"), /^buy-budget-undeclared — Chưa khai báo ngân sách/);
  assert.match(describeDecisionReason("cash-unknown"), /Quỹ tiền mặt chung chưa được nhập/);
  assert.match(describeDecisionReason("budget-exceeds-cash"), /vượt quỹ tiền mặt chung/);
  assert.match(describeDecisionReason("corporate-action-unconverted:rights-issue"), /"rights-issue" chưa quy đổi được: không tính lãi\/lỗ, tiền về/);
  assert.equal(describeDecisionReason("trend-bearish"), "trend-bearish");
  assert.deepEqual(unconvertedCorporateActionReasons({ reasons: ["no-trigger", "corporate-action-unconverted:other", "corporate-action-unconverted:"] }),
    ["corporate-action-unconverted:other"]);
});

const contextBody = (benchmarks: unknown[]) => ({
  contractVersion: "equity-context-v1", symbol: "BID", generatedAtUtc: "2026-10-16T09:00:00Z",
  relativeStrength: { status: "ok", benchmarks },
  corporateActions: { status: "empty", items: [] }, events: { status: "empty", items: [] }, fundamentals: { status: "empty", items: [] },
  limitations: [],
});

test("relative strength: stale benchmarks render stale (never ok), null windows tolerated", () => {
  const ctx = parseEquityContext(contextBody([
    { symbol: "VNINDEX", kind: "index", status: "stale", reason: "benchmark-stale", alignedSessions: 60, returns: { "20": null } },
    // A stale reason can never be shown as ok, whatever status accompanies it.
    { symbol: "VCB", kind: "peer", status: "ok", reason: "aligned-window-ends-before-instrument-latest", alignedSessions: 58, returns: { "20": { instrument: 0.01, benchmark: 0.02, excess: -0.01 } } },
    { symbol: "CTG", kind: "peer", status: "ok", reason: null, alignedSessions: 60, returns: { "20": { instrument: 0.01, benchmark: 0.0, excess: 0.01 }, "60": null } },
  ]), "BID");
  const [vnindex, vcb, ctg] = ctx.relativeStrength.items;
  assert.equal(vnindex.status, "stale");
  assert.deepEqual(vnindex.returns, {});
  assert.equal(vcb.status, "stale");
  assert.equal(ctg.status, "ok");
  assert.deepEqual(Object.keys(ctg.returns), ["20"]);
  assert.throws(() => parseEquityContext(contextBody([{ symbol: "X", status: "fresh" }]), "BID"), /status must be one of/);
});

const note = (over: Record<string, unknown> = {}) => ({
  noteId: `session/BID/${SIGNAL}/abc123`, symbol: "BID", mode: "forward", requestedAsOfUtc: "2026-10-16T09:00:00Z",
  signalBarOpenTimeMs: SIGNAL, signalBarCloseTimeMs: SIGNAL + DAY - 1, horizonSessions: 20,
  snapshotId: `snap/BID/${SIGNAL}/0123456789ab`, snapshotSha256: "a".repeat(64), snapshotVerified: true,
  skillVersion: "investment-research-v1", methodVersion: "equity-research-snapshot-method-v1",
  direction: "sideways", actionView: "wait", actionBasis: "market-only",
  body: { schemaVersion: "equity-research-note-v1", thesis: "Đi ngang chờ KQKD" },
  availableTimeMs: SIGNAL + DAY + 3_600_000, createdAtUtc: "2026-10-16T10:00:00Z", forecastIds: [],
  ...over,
});
const notes = (items: unknown[]) => ({ contractVersion: "equity-research-notes-v1", symbol: "BID", items });

test("research notes: parse, probability only with a declared reproducible method", () => {
  const [plain] = parseResearchNotes(notes([note()]), "BID");
  assert.equal(plain.mode, "forward");
  assert.equal(plain.thesis, "Đi ngang chờ KQKD");
  assert.equal(plain.probability, null);

  const withMethod = note({ body: { probability: { configId: "tb-p5-s4-h20", probTargetFirst: 0.4, probStopFirst: 0.35, method: "beta-binomial", methodRef: "ai/skills/investment-research/scripts/rate.py" } } });
  assert.deepEqual(parseResearchNotes(notes([withMethod]), "BID")[0].probability,
    { configId: "tb-p5-s4-h20", probTargetFirst: 0.4, probStopFirst: 0.35, method: "beta-binomial", methodRef: "ai/skills/investment-research/scripts/rate.py" });
  // No method / no methodRef / impossible pair ⇒ no probability is ever presented.
  for (const probability of [
    { probTargetFirst: 0.4, probStopFirst: 0.3 },
    { probTargetFirst: 0.4, method: "gut feel" },
    { probTargetFirst: 0.8, probStopFirst: 0.5, method: "m", methodRef: "r" },
  ]) {
    assert.equal(parseResearchNotes(notes([note({ body: { probability } })]), "BID")[0].probability, null);
  }
  const retro = parseResearchNotes(notes([note({ mode: "retrospective", body: null })]), "BID")[0];
  assert.equal(retro.mode, "retrospective");
  assert.equal(retro.thesis, null);
});

test("research notes: contract, symbol and enums are fail-closed", () => {
  assert.throws(() => parseResearchNotes({ ...notes([]), contractVersion: "v0" }, "BID"), /contractVersion/);
  assert.throws(() => parseResearchNotes(notes([note({ symbol: "MBB" })]), "BID"), /must be "BID"/);
  assert.throws(() => parseResearchNotes(notes([note({ mode: "live" })]), "BID"), /mode/);
  assert.throws(() => parseResearchNotes(notes([note({ direction: "moon" })]), "BID"), /direction/);
  assert.throws(() => parseResearchNotes(notes([note({ actionView: "short" })]), "BID"), /actionView/);
  assert.throws(() => parseResearchNotes(notes([note({ horizonSessions: 0 })]), "BID"), /horizonSessions/);
});

test("forecast journal accepts session-research rows but never as validated", () => {
  const row = {
    forecastId: `session-research/BID/tb-p5-s4-h20/${SIGNAL}`, source: "session-research", configId: "tb-p5-s4-h20",
    targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, signalBarOpenTimeMs: SIGNAL, availableTimeMs: SIGNAL + DAY,
    createdAtUtc: "2026-10-16T10:00:00Z", probTargetFirst: 0.4, probStopFirst: 0.35, abstained: false, validated: false,
    methodVersion: "beta-binomial", outcome: null,
  };
  const journal = { contractVersion: "equity-forecast-journal-v1", symbol: "BID", items: [row] };
  assert.equal(parseForecastJournal(journal, "BID").items[0].source, "session-research");
  assert.throws(() => parseForecastJournal({ ...journal, items: [{ ...row, validated: true }] }, "BID"), /never validated/);
});

const screen = readFileSync(new URL("../src/components/EquityScreen.tsx", import.meta.url), "utf8");

test("decision card: buy quantity rendered only through the budget gate; withheld reason shown", () => {
  assert.match(screen, /\{decision\.buyMore && buyGate\?\.show && \(/);
  assert.match(screen, /Không đề xuất số lượng mua: \{BUY_GATE_COPY\[buyGate\.reason\]/);
  assert.match(screen, /Quỹ tiền mặt chung \(MBB \+ BID\)/);
});

test("MBBSIZE-1: buy cost shown as an upper bound at the next ceiling only when the backend says it sized there", () => {
  // Literal code (not the export) so this test also runs, and fails on the assertion, against the pre-MBBSIZE source.
  assert.match(describeDecisionReason("buy-sized-at-next-session-ceiling"), /^buy-sized-at-next-session-ceiling — khối lượng mua thêm tính theo giá trần phiên kế .*không vượt ngân sách kể cả khi khớp ở giá trần/);
  assert.match(screen, /decision\.reasons\.includes\(BUY_SIZED_AT_CEILING\)\s*\?\s*<>, chi phí tối đa \{formatVnd\(decision\.buyMore\.estimatedCostVnd\)\} nếu khớp ở giá trần phiên kế\.<\/>/);
  // Older backend (no code, cost priced at the last close): keep the approximate copy, never claim an upper bound.
  assert.match(screen, /:\s*<> ≈ \{formatVnd\(decision\.buyMore\.estimatedCostVnd\)\}\.<\/>\}/);
  assert.doesNotMatch(screen, /\(\{decision\.buyMore\.maxBuyableLots\} lô 100\) ≈/);
  // Not a cash/budget blocker: the gate still shows the quantity.
  const declared = pos({ cashPoolReported: true, sharedCashVnd: 50_000_000, buyBudgetVnd: 20_000_000 });
  assert.deepEqual(buyQuantityGate({ reasons: ["trend-constructive", "buy-sized-at-next-session-ceiling"], buyMore }, declared), { show: true });
});

test("MBBSTALE-1: an action blocked by a stale 1d bar says which action and why, in Vietnamese", () => {
  for (const [action, label] of [["sell", "Bán"], ["reduce", "Giảm"], ["conditional-sell", "Bán có điều kiện"], ["buy-more", "Mua thêm"]]) {
    assert.equal(describeDecisionReason(`stale-data-blocked:${action}`),
      `stale-data-blocked:${action} — theo giá đóng cửa 1d cũ, luật lẽ ra cho "${label}", nhưng nến 1d chưa cập nhật nên chưa đề xuất lệnh — chờ dữ liệu mới.`);
  }
  // An action this FE does not know is still named, verbatim.
  assert.match(describeDecisionReason("stale-data-blocked:short"), /luật lẽ ra cho "short"/);
  assert.match(describeDecisionReason("stale-data-blocked:constructor"), /luật lẽ ra cho "constructor"/);
  assert.equal(describeDecisionReason("stale-data-blocked:"), "stale-data-blocked:");
});

test("source documents: metadata + extraction summary; unsafe links dropped; contract/symbol fail-closed", async () => {
  const { parseSourceDocuments } = await import("../src/lib/equityResearch.ts");
  const doc = {
    documentId: "b905cf9d-753b-429c-b7d8-0b7b81cb2725", symbol: "BID", entity: "BIDV", docType: "financial-statement",
    title: "BCTC hợp nhất Q2/2026", sourceUrl: "https://bidv.com.vn/x.pdf", provider: "issuer:BIDV", contentSha256: "d".repeat(64),
    storagePath: "BID/x.pdf", byteSize: 10, mimeType: "application/pdf", reportingPeriod: "2026Q2", consolidation: "consolidated",
    auditStatus: "unknown", publishedAtUtc: null, firstSeenAtUtc: "2026-10-18T08:26:32Z", fetchedAtUtc: "2026-10-18T08:27:03Z",
    revision: 1, supersedesDocumentId: null, createdAtUtc: "2026-10-18T09:20:26Z",
    extraction: { pageCount: 37, pagesWithText: 0, found: [{ metric: "NET_PROFIT" }], missing: [{ metric: "TOTAL_ASSETS" }, { metric: "TOTAL_ASSETS" }, { metric: "CAR" }] },
  };
  const body = (items: unknown[]) => ({ contractVersion: "equity-source-documents-v1", symbol: "BID", items });
  const [parsed] = parseSourceDocuments(body([doc]), "BID");
  assert.deepEqual(parsed.extractedMetrics, ["NET_PROFIT"]);
  assert.deepEqual(parsed.missingMetrics, ["TOTAL_ASSETS", "CAR"]);
  assert.equal(parsed.pagesWithText, 0);
  assert.equal(parseSourceDocuments(body([{ ...doc, sourceUrl: "javascript:alert(1)", extraction: null }]), "BID")[0].sourceUrl, null);
  assert.deepEqual(parseSourceDocuments(body([{ ...doc, extraction: null }]), "BID")[0].missingMetrics, []);
  assert.throws(() => parseSourceDocuments({ ...body([]), contractVersion: "x" }, "BID"), /contractVersion/);
  assert.throws(() => parseSourceDocuments({ ...body([]), symbol: "MBB" }, "BID"), /must be "BID"/);
});

test("position: totalDeclaredBudgetsVnd / cashNotes are additive; context fundamentals carry document provenance", () => {
  const pooled = parseMbbPosition({ ...legacyPosition, sharedCashVnd: null, buyBudgetVnd: null, cashSource: "unknown", totalDeclaredBudgetsVnd: 0, cashNotes: ["Cash is ONE shared pool", 3, ""] }, BID_SCOPE);
  assert.equal(pooled.totalDeclaredBudgetsVnd, 0);
  assert.deepEqual(pooled.cashNotes, ["Cash is ONE shared pool"]);
  assert.deepEqual(parseMbbPosition(legacyPosition, BID_SCOPE).cashNotes, []);
  const ctx = parseEquityContext({
    ...contextBody([]),
    fundamentals: { status: "ok", items: [{ period: "2026Q2", metric: "NET_PROFIT", value: 8_445_473_000_000, unit: "VND", source: "issuer-report",
      sourceUrl: "https://www.mbbank.com.vn/q2.pdf", documentId: "95d7f525-f5c8-47ab-878d-a2014c35ed36", sourceLocation: "page 6: row" }] },
  }, "BID");
  assert.equal(ctx.fundamentals.items[0].documentId, "95d7f525-f5c8-47ab-878d-a2014c35ed36");
  assert.equal(ctx.fundamentals.items[0].sourceLocation, "page 6: row");
  assert.match(describeDecisionReason("corporate-action-converted:stock-dividend"), /đã được quy đổi theo sự kiện quyền "stock-dividend"/);
});

test("position PUT cash validation codes from the live backend map to honest copy (not a bare HTTP 400)", async () => {
  const { safeApiErrorMessage } = await import("../src/lib/apiContract.ts");
  // Real body from BE 5297 when declaring a budget before the shared pool exists.
  const live = JSON.stringify({ code: "CASH_UNKNOWN", message: "buyBudgetVnd needs the shared cash pool: set it first", retryable: false });
  assert.match(safeApiErrorMessage(live, 400), /Chưa nhập quỹ tiền mặt chung/);
  assert.match(safeApiErrorMessage(JSON.stringify({ code: "BUDGET_EXCEEDS_CASH" }), 400), /vượt quỹ tiền mặt chung/);
  assert.equal(safeApiErrorMessage(JSON.stringify({ code: "SOMETHING_ELSE" }), 400), "Yêu cầu không hợp lệ (HTTP 400).");
});
