import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseKlineDataIssues, parseKlineDataRepair, previewMatchesIssue } from "../src/lib/dataQuality.ts";

const issue = {
  issueKey: "4h:gap:1000:2000",
  symbol: "BTCUSDT",
  timeframe: "4h",
  issueType: "gap",
  causeCode: "missing_open_time",
  resolutionState: "open",
  startOpenTimeMs: 1000,
  endOpenTimeMs: 2000,
  affectedBars: 2,
  expectedDurationMs: 14_400_000,
  actualDurationMs: null,
  firstDetectedAtUtc: "2026-09-22T00:00:00Z",
  updatedAtUtc: null,
  repairable: true,
  evidence: {
    detectionMethod: "adjacent finalized open-time interval",
    sourceClassification: "source_available",
    authoritativeRepairSource: "Binance Spot klines",
    sourceAttemptCount: 1,
    lastSourceAttemptAtUtc: "2026-09-22T00:01:00Z",
    nextSourceRetryAtUtc: null,
    detail: "two missing finalized opens",
  },
  affectedDownstreamArtifacts: ["TechnicalIndicators"],
};

const issuesResponse = {
  taxonomyVersion: "btc-kline-quality/v1",
  symbol: "BTCUSDT",
  timeframe: "4h",
  generatedAtUtc: "2026-09-22T00:02:00Z",
  auditEndOpenTimeMs: 3000,
  totalKnownIssues: 1,
  truncated: false,
  issues: [issue],
  recentRepairs: [],
  limitations: ["authoritative source can remain unavailable"],
};

const repair = {
  taxonomyVersion: "btc-kline-quality/v1",
  symbol: "BTCUSDT",
  timeframe: "4h",
  issueType: "gap",
  dryRun: true,
  applied: false,
  alreadyApplied: false,
  startOpenTimeMs: 1000,
  endOpenTimeMs: 2000,
  requestedBars: 2,
  sourceRows: 2,
  verifiedSourceBars: 2,
  insertedBars: 2,
  replacedBars: 0,
  noopBars: 0,
  unresolvedOpenTimeMs: [],
  sourceClassification: "source_available",
  sourceEndpoint: "api/v3/klines",
  sourceCheckedAtUtc: "2026-09-22T00:03:00Z",
  sourceEvidenceSha256: "a".repeat(64),
  planSha256: "b".repeat(64),
  repairAuditId: null,
  derivedRebuildRequired: true,
  affectedDownstreamArtifacts: ["TechnicalIndicators"],
  limitations: ["derived artifacts require explicit rebuild"],
};

test("data-quality issue parser preserves taxonomy, evidence, boundaries and explicit empty repair history", () => {
  const parsed = parseKlineDataIssues(issuesResponse);
  assert.equal(parsed.issues[0].evidence.authoritativeRepairSource, "Binance Spot klines");
  assert.equal(parsed.issues[0].actualDurationMs, null);
  assert.equal(parsed.recentRepairs.length, 0);
});

test("repair parser distinguishes dry-run from apply and requires immutable evidence hashes", () => {
  const preview = parseKlineDataRepair(repair);
  assert.equal(preview.dryRun, true);
  assert.equal(preview.repairAuditId, null);
  const applied = parseKlineDataRepair({ ...repair, dryRun: false, applied: true, repairAuditId: 9 });
  assert.equal(applied.applied, true);
  assert.throws(() => parseKlineDataRepair({ ...repair, sourceEvidenceSha256: "tampered" }), /SHA-256/);
  assert.throws(() => parseKlineDataRepair({ ...repair, dryRun: true, applied: true }), /dry-run cannot claim/);
});

test("repair apply binding is invalidated by timeframe, issue or exact boundary changes", () => {
  const parsedIssue = parseKlineDataIssues(issuesResponse).issues[0];
  const binding = { requestToken: 4, issueKey: parsedIssue.issueKey, timeframe: "4h" as const, issueType: parsedIssue.issueType, startOpenTimeMs: parsedIssue.startOpenTimeMs, endOpenTimeMs: parsedIssue.endOpenTimeMs, planSha256: "b".repeat(64) };
  assert.equal(previewMatchesIssue(binding, parsedIssue, "4h"), true);
  assert.equal(previewMatchesIssue(binding, { ...parsedIssue, endOpenTimeMs: 3000 }, "4h"), false);
  assert.equal(previewMatchesIssue(binding, parsedIssue, "1h"), false);
});

test("data-quality parser fails closed on scope, duplicate issue keys and inconsistent totals", () => {
  assert.throws(() => parseKlineDataIssues({ ...issuesResponse, symbol: "ETHUSDT" }), /only BTCUSDT/);
  assert.throws(() => parseKlineDataIssues({ ...issuesResponse, totalKnownIssues: 2 }), /totals do not reconcile/);
  assert.throws(() => parseKlineDataIssues({ ...issuesResponse, totalKnownIssues: 2, issues: [issue, issue] }), /issue keys must be unique/);
});

test("Evidence Center data-quality repair is preview-first, admin-guarded and mobile constrained", () => {
  const component = readFileSync(new URL("../src/components/DataQualityAdministration.tsx", import.meta.url), "utf8");
  const api = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
  const screen = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");
  assert.match(component, /Dry-run exact issue/);
  assert.match(component, /expectedPlanSha256: binding\.planSha256/);
  assert.match(component, /previewMatchesIssue/);
  assert.match(component, /repairRequestRef/);
  assert.match(component, /min-w-0 max-w-full overflow-hidden/);
  assert.match(api, /adminFetch\(`\$\{API_BASE\}\/api\/market\/data-quality\/repair`/);
  assert.match(screen, /<DataQualityAdministration\/>/);
});
