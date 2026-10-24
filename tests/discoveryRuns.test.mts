import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const types = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const screen = readFileSync(new URL("../src/components/DiscoveryScreen.tsx", import.meta.url), "utf8");

// DISCGAP-1 — prod showed identical "Chưa có rule tự động nào" for a timeframe
// never discovered (4h: zero RuleDiscoveryRuns rows) and one discovered-but-rejected
// (1h: runs exist, all candidates failed the gate). The new GET /api/discovery/runs
// ledger read lets the empty state distinguish the two honestly.
test("getDiscoveryRuns hits the run-ledger endpoint with symbol/timeframe/take params", () => {
  assert.match(api, /export async function getDiscoveryRuns\(/);
  assert.match(api, /`\$\{API_BASE\}\/api\/discovery\/runs\?\$\{qs\}`/);
  assert.match(api, /qs\.set\("take", String\(params\.take\)\)/);
  // Plain fetch like getDiscoveredRules — read-only GET, no AdminGuard.
  assert.match(api, /getDiscoveryRuns[\s\S]*?return getJson\(res\) as Promise<import\("\.\/types"\)\.DiscoveryRun\[\]>/);
});

test("DiscoveryRun type mirrors the run-ledger row fields (no trials)", () => {
  const body = types.slice(types.indexOf("export type DiscoveryRun"));
  for (const field of [
    "id: number",
    "methodVersion: string",
    "symbol: string",
    "timeframe: string",
    "futureBars: number",
    "candidateBudget: number",
    "trialCount: number",
    "labelDeadZonePct: number",
    "roundTripCostBps: number",
    "selectionStartTimeMs: number",
    "selectionEndTimeMs: number",
    "evaluationStartTimeMs: number",
    "evaluationEndTimeMs: number",
    "createdAtUtc: string",
  ]) {
    assert.ok(body.includes(field), `DiscoveryRun missing field: ${field}`);
  }
  assert.doesNotMatch(body, /trials\?:/);
});

test("empty state fetches the latest run lazily, only when the catalog is empty", () => {
  // Wired inside loadRules after setRules — no eager fetch when rules exist.
  assert.match(screen, /if \(data\.length === 0\) \{\s*try \{\s*const runs = await getDiscoveryRuns\(/);
  assert.match(screen, /getDiscoveryRuns\(\{ symbol, timeframe, take: 1 \}\)/);
  // Fetch failure degrades to the neutral copy instead of fabricating run info.
  assert.match(screen, /\} catch \{\s*setRunsInfo\(null\)/);
  // Stale/mismatched run info (another symbol/timeframe) also falls back.
  assert.match(screen, /runsInfo\.symbol === symbol && runsInfo\.timeframe === timeframe/);
});

test("empty state copy covers never-run vs ran-but-zero-survivors vs neutral", () => {
  // (a) No run rows for this timeframe — phrase it about the ledger, not
  // absolute history: pre-ledger-era discoveries leave no RuleDiscoveryRuns row
  // and /clear removes rules without touching runs, so "chưa từng chạy" could lie.
  assert.match(screen, /Không có lần quét nào được ghi ở khung \{timeframe\}/);
  // (b) A run exists — report scan stats + local-formatted timestamp and the
  // plain fact the catalog is empty. trialCount is candidates tried, NOT
  // survivors, and /clear can delete gated rules while keeping the run row —
  // the copy must never infer "0 rules qua gate" (reviewer F1).
  assert.match(screen, /Lần quét gần nhất \{formatTimestamp\(runsInfo\.runs\[0\]\.createdAtUtc\)\}/);
  assert.match(screen, /runsInfo\.runs\[0\]\.trialCount\}<\/span> candidates/);
  assert.match(screen, /hiện chưa có rule nào trong danh mục/);
  assert.doesNotMatch(screen, /qua gate/);
  // (c) Neutral fallback (catalog read succeeded empty, ledger read failed)
  // keeps the pre-existing copy verbatim.
  assert.match(screen, /Chưa có rule tự động nào — nhấn &quot;Chạy Discovery&quot; để quét dữ liệu lịch sử\./);
});

test("empty copy only follows a successful empty catalog read; a failed read is not 'no rules'", () => {
  // F02 live audit: HTTP 530 rendered "Chưa có rule tự động nào" — failure must
  // render LoadNotice, and the empty block is gated on the success-only view.
  assert.match(screen, /const rulesView = loadView\(rulesState\)/);
  assert.match(screen, /\{rulesView === "empty" && !loading && \(/);
  assert.match(screen, /<LoadNotice state=\{rulesState\} what="danh mục rules" \/>/);
  assert.match(screen, /setRulesState\(\(prev\) => fail\(prev, e, Date\.now\(\), scope\)\)/);
  assert.doesNotMatch(screen, /\{rules\.length === 0 && !loading && \(/);
});

test("empty copy never advises pressing the Discovery button while it is disabled", () => {
  // The button is disabled={running || !adminUnlocked}; advice is gated on the inverse.
  assert.match(screen, /disabled=\{running \|\| !adminUnlocked\}/);
  assert.match(screen, /const canRunDiscovery = adminUnlocked && !running;/);
  assert.equal(screen.match(/canRunDiscovery \? \(/g)?.length, 2);
  assert.match(screen, /<>Không có lần quét nào được ghi ở khung \{timeframe\}\.<\/>/);
  assert.match(screen, /<>Chưa có rule tự động nào ở khung \{timeframe\}\.<\/>/);
});
