import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  STATIC_EQUITY_PROFILES,
  classifyEquityUnavailable,
  equityLegacyPath,
  equityNewPath,
  equityParseScope,
  normalizeEquityTimeframe,
  parseEquityBaseRates,
  parseEquityCatalog,
  parseEquityContext,
  parseEquityObservations,
  resolveEquitySymbol,
  safeSourceUrl,
  barrierFraction,
  formatBarrier,
  formatFundamentalValue,
} from "../src/lib/equity.ts";
import { parseMbbCoverageReport, parseMbbDecision, parseMbbPosition } from "../src/lib/mbb.ts";

const BID_SCOPE = equityParseScope(STATIC_EQUITY_PROFILES.BID);
const MBB_SCOPE = equityParseScope(STATIC_EQUITY_PROFILES.MBB);

const catalogItem = (symbol: string, timeframes: string[], capabilities: Record<string, unknown>, assetClass = "equity") => ({
  symbol,
  label: symbol,
  venue: "HOSE",
  assetClass,
  currency: assetClass === "index" ? "index-points" : "VND",
  timezone: "Asia/Ho_Chi_Minh",
  dataProvider: "VCI",
  crossCheckDataProvider: "KBS",
  priceBasis: "adjusted",
  aliases: [],
  activeTimeframes: timeframes,
  defaultTimeframe: timeframes[timeframes.length - 1],
  enabled: false,
  capabilities: { technicalAnalysis: true, news: false, sentiment: false, futures: false, liquidation: false, orderBook: false, execution: false, paperTrading: false, ...capabilities },
});

const CATALOG_V2 = {
  contractVersion: "instrument-catalog-v2",
  generatedAtUtc: "2026-10-16T03:00:00Z",
  items: [
    catalogItem("MBB", ["1h", "1d"], { ingestion: true, decision: true }),
    catalogItem("BID", ["1d"], { ingestion: true, decision: true }),
    catalogItem("VCB", ["1d"], { technicalAnalysis: false, ingestion: true, decision: false }),
    catalogItem("VNINDEX", ["1d"], { technicalAnalysis: false, ingestion: true, decision: false }, "index"),
  ],
};

// --- symbol scope ------------------------------------------------------------------

test("symbol resolution: default MBB, BID 1d only, unknown/unsupported never resolve", () => {
  const def = resolveEquitySymbol(null);
  assert.equal(def.status, "ok");
  assert.equal(def.status === "ok" && def.profile.symbol, "MBB");
  assert.equal(resolveEquitySymbol("  bid ").status, "ok");

  const bid = resolveEquitySymbol("BID");
  assert.ok(bid.status === "ok");
  assert.deepEqual([...bid.profile.timeframes], ["1d"]);
  assert.equal(normalizeEquityTimeframe(bid.profile, "1h"), "1d");

  const mbb = resolveEquitySymbol("MBB");
  assert.ok(mbb.status === "ok");
  assert.deepEqual([...mbb.profile.timeframes], ["1h", "1d"]);

  assert.equal(resolveEquitySymbol("VCB").status, "unsupported");
  assert.equal(resolveEquitySymbol("VNINDEX").status, "unsupported");
  assert.equal(resolveEquitySymbol("BTCUSDT").status, "unsupported");
  assert.equal(resolveEquitySymbol("XYZ").status, "unknown");
  assert.equal(resolveEquitySymbol("../api/market").status, "unknown");
});

test("catalog v2 parses additive flags, index asset class, and narrows (never widens) timeframes", () => {
  const catalog = parseEquityCatalog(CATALOG_V2);
  const vnindex = catalog.items.find((i) => i.symbol === "VNINDEX")!;
  assert.equal(vnindex.assetClass, "index");
  assert.equal(vnindex.currency, "index-points");
  assert.equal(vnindex.decision, false);

  // A catalog claiming 1h for BID must not make BID request 1h.
  const widened = parseEquityCatalog({
    ...CATALOG_V2,
    items: [catalogItem("BID", ["1h", "1d"], { ingestion: true, decision: true })],
  });
  const bid = resolveEquitySymbol("BID", widened);
  assert.ok(bid.status === "ok");
  assert.deepEqual([...bid.profile.timeframes], ["1d"]);

  // Narrowing is honoured.
  const narrowed = parseEquityCatalog({ ...CATALOG_V2, items: [catalogItem("MBB", ["1d"], { decision: true })] });
  const mbb = resolveEquitySymbol("MBB", narrowed);
  assert.ok(mbb.status === "ok");
  assert.deepEqual([...mbb.profile.timeframes], ["1d"]);

  // Explicit decision=false demotes even a static symbol.
  const demoted = parseEquityCatalog({ ...CATALOG_V2, items: [catalogItem("BID", ["1d"], { decision: false })] });
  assert.equal(resolveEquitySymbol("BID", demoted).status, "unsupported");
});

test("catalog v1 without ingestion/decision degrades to null, not false", () => {
  const v1 = parseEquityCatalog({
    contractVersion: "instrument-catalog-v1",
    items: [catalogItem("MBB", ["1h", "1d"], {})],
  });
  assert.equal(v1.items[0].decision, null);
  assert.equal(v1.items[0].ingestion, null);
  assert.equal(resolveEquitySymbol("MBB", v1).status, "ok");
  assert.throws(() => parseEquityCatalog({ contractVersion: "other", items: [] }), /contractVersion/);
});

test("endpoint routing: MBB keeps /api/mbb for legacy surfaces, BID and new surfaces use /api/equities", () => {
  assert.equal(equityLegacyPath("MBB", "candles"), "/api/mbb/candles");
  assert.equal(equityLegacyPath("MBB", "position"), "/api/mbb/position");
  assert.equal(equityLegacyPath("BID", "candles"), "/api/equities/BID/candles");
  assert.equal(equityLegacyPath("BID", "decision"), "/api/equities/BID/decision");
  assert.equal(equityNewPath("MBB", "base-rates"), "/api/equities/MBB/base-rates");
  assert.equal(equityNewPath("BID", "context"), "/api/equities/BID/context");
});

test("404 / UNSUPPORTED_CAPABILITY → unavailable; other failures stay errors; untrusted codes dropped", () => {
  assert.deepEqual(classifyEquityUnavailable(404, ""), { code: null });
  assert.deepEqual(classifyEquityUnavailable(404, JSON.stringify({ code: "UNKNOWN_SYMBOL" })), { code: "UNKNOWN_SYMBOL" });
  assert.deepEqual(classifyEquityUnavailable(400, JSON.stringify({ code: "UNSUPPORTED_CAPABILITY" })), { code: "UNSUPPORTED_CAPABILITY" });
  assert.equal(classifyEquityUnavailable(400, JSON.stringify({ code: "INVALID_TIMEFRAME" })), null);
  assert.equal(classifyEquityUnavailable(500, ""), null);
  assert.equal(classifyEquityUnavailable(409, JSON.stringify({ code: "LANE_BUSY" })), null);
  assert.deepEqual(classifyEquityUnavailable(404, JSON.stringify({ code: "<script>" })), { code: null });
});

// --- shared DTO parsers per symbol ---------------------------------------------------------

test("BID scope rejects MBB payloads and 1h rows; MBB scope stays the default", () => {
  const position = {
    symbol: "BID", totalShares: 100, settledShares: 100, pendingShares: 0, avgCostPerShareVnd: 40000,
    availableCashVnd: 0, updatedAtUtc: null, lots: [],
  };
  assert.equal(parseMbbPosition(position, BID_SCOPE).symbol, "BID");
  // Never show the other symbol's holdings.
  assert.throws(() => parseMbbPosition({ ...position, symbol: "MBB" }, BID_SCOPE), /must be "BID"/);
  assert.throws(() => parseMbbPosition(position), /must be "MBB"/);
  assert.equal(parseMbbPosition({ ...position, symbol: "MBB" }, MBB_SCOPE).symbol, "MBB");

  const coverage = (timeframe: string) => ({
    symbol: "BID", provider: "VCI", crossCheckProvider: "KBS", priceBasis: "adjusted", venue: "HOSE",
    sourceTimezone: "Asia/Ho_Chi_Minh", generatedAtUtc: "2026-10-16T03:00:00Z", limitations: [],
    timeframes: [{
      timeframe, totalBars: 10, firstOpenUtc: null, lastOpenUtc: null, expectedBars: 10, missingBars: 0,
      coveragePct: 100, gapRangeCount: 0, topGaps: [], unexpectedSessionBars: 0, unexpectedSessionOpenTimeMs: [],
      invalidOhlcvRows: 0, latestExpectedFinalizedOpenUtc: null, latestBarAgeSeconds: null, isStale: false,
    }],
  });
  assert.equal(parseMbbCoverageReport(coverage("1d"), BID_SCOPE).timeframes[0].timeframe, "1d");
  assert.throws(() => parseMbbCoverageReport(coverage("1h"), BID_SCOPE), /must be one of 1d/);

  const decision = {
    symbol: "BID", action: "wait", reasons: [], triggers: [], invalidation: null,
    position: { totalShares: 0, settledShares: 0, pendingShares: 0, sellableSharesNow: 0, avgCostPerShareVnd: null, lastPriceVnd: null, unrealizedPnlVnd: null, unrealizedPnlPct: null, netProceedsIfSellableNowVnd: null },
    buyMore: null,
    market: { trend: "sideways", rsiZone: "neutral", rsi14: null, atr14: null, sma50: null, ema50: null, lastDailyCloseVnd: null, previousDailyCloseVnd: null, latestHourlyCloseVnd: null, ceilingPriceVnd: null, floorPriceVnd: null },
    evidenceStatus: "rules-only", priceBasis: "adjusted",
    dataFreshness: [{ timeframe: "1d", latestOpenTimeMs: 1, latestExpectedFinalizedOpenMs: 1, isStale: true }],
    generatedAtUtc: "2026-10-16T03:00:00Z",
  };
  assert.equal(parseMbbDecision(decision, BID_SCOPE).dataFreshness[0].isStale, true);
  // Additive cost-basis flags degrade to null on an older backend…
  assert.equal(parseMbbDecision(decision, BID_SCOPE).position.costBasisComparable, null);
  assert.equal(parseMbbDecision(decision, BID_SCOPE).position.costBasisNote, null);
  // …and parse when present (P&L withheld when not comparable).
  const incomparable = parseMbbDecision({
    ...decision,
    position: { ...decision.position, costBasisComparable: false, costBasisNote: "giá vốn thật chưa quy đổi theo sự kiện quyền" },
  }, BID_SCOPE);
  assert.equal(incomparable.position.costBasisComparable, false);
  assert.equal(incomparable.position.unrealizedPnlVnd, null);
  assert.match(incomparable.position.costBasisNote ?? "", /chưa quy đổi/);
  assert.throws(() => parseMbbDecision({ ...decision, position: { ...decision.position, costBasisComparable: "no" } }, BID_SCOPE), /costBasisComparable/);
  assert.throws(
    () => parseMbbDecision({ ...decision, dataFreshness: [{ timeframe: "1h", latestOpenTimeMs: 1, latestExpectedFinalizedOpenMs: 1, isStale: false }] }, BID_SCOPE),
    /must be one of 1d/,
  );
});

test("observations: additive symbol degrades to null, wrong symbol/timeframe rejected", () => {
  const row = {
    decisionId: "mbb-observe/MBB/1d/1", recorderVersion: "mbb-observe-v1", timeframe: "1d",
    signalBarOpenTimeMs: 1, signalBarCloseTimeMs: 2, observedAtUtc: "2026-10-16T08:00:00Z", decision: "hold",
    evidenceStatus: "rules-only", priceBasis: "adjusted", marketCloseVnd: 23800, fillPrice: null,
    fillObservedAtUtc: null, fillSource: null, fillBarOpenTimeMs: null, outcomeReturn: null,
    outcomeObservedAtUtc: null, outcomeHorizon: null,
  };
  const legacy = parseEquityObservations([row], MBB_SCOPE, "1d");
  assert.equal(legacy[0].symbol, null);
  assert.equal(parseEquityObservations([{ ...row, symbol: "MBB" }], MBB_SCOPE, "1d")[0].symbol, "MBB");
  assert.throws(() => parseEquityObservations([{ ...row, symbol: "MBB" }], BID_SCOPE, "1d"), /must be "BID"/);
  assert.throws(() => parseEquityObservations([row], MBB_SCOPE, "1h"), /timeframe must be "1h"/);
  // Write-once fill fields that an older backend omits degrade to null.
  const { fillPrice: _omit, ...withoutFill } = row;
  void _omit;
  assert.equal(parseEquityObservations([withoutFill], MBB_SCOPE, "1d")[0].fillPrice, null);
});

// --- base rates ------------------------------------------------------------------------

const VALIDATION_FAIL = {
  gatePassed: false, gateReasons: ["gate-failed"], nOos: 812, nEffective: 24, brierKnn: 0.231, brierPrior: 0.229,
  brierDiffCi90: [-0.004, 0.009], ece: 0.071, calibrationBins: [], coverage: 0.93, abstentionRate: 0.07,
  evNetOosMean: -0.0012, evNetOosWhenPositive: 0.0004,
};

const baseRates = (overrides: Record<string, unknown> = {}, config: Record<string, unknown> = {}) => ({
  contractVersion: "equity-base-rates-v1",
  symbol: "BID",
  timeframe: "1d",
  status: "abstained",
  reasons: ["gate-failed"],
  artifact: {
    generatedAtUtc: "2026-10-16T09:00:00Z", dataAsOfOpenTimeMs: 1760544000000, priceBasis: "adjusted",
    methodVersion: "equity-knn-v1", protocolVersion: "equity-base-rates-protocol-v1", datasetSha256: "a".repeat(64),
  },
  configs: [{
    configId: "tb-p5-s4-h20", targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, abstained: true,
    abstainReasons: ["gate-failed"], decisionUse: null,
    research: {
      label: "unvalidated", signalBarOpenTimeMs: 1760544000000, probTargetFirst: 0.41, probStopFirst: 0.38,
      probTimeout: 0.21, evNetFraction: -0.002, k: 50, nEligible: 2400,
      prior: { probTargetFirst: 0.39, probStopFirst: 0.4, probTimeout: 0.21 },
    },
    validation: VALIDATION_FAIL,
    ...config,
  }],
  ...overrides,
});

test("base rates: abstained/unvalidated parse; decisionUse only allowed behind a passed gate", () => {
  const parsed = parseEquityBaseRates(baseRates(), "BID");
  assert.equal(parsed.status, "abstained");
  assert.equal(parsed.configs[0].decisionUse, null);
  assert.equal(parsed.configs[0].research?.label, "unvalidated");
  assert.deepEqual(parsed.configs[0].validation?.brierDiffCi90, [-0.004, 0.009]);

  const use = { probTargetFirst: 0.45, probStopFirst: 0.35, probTimeout: 0.2, evNetFraction: 0.004 };
  assert.throws(
    () => parseEquityBaseRates(baseRates({ status: "ok" }, { abstained: false, decisionUse: use }), "BID"),
    /decisionUse present without a passed gate/,
  );
  const ok = parseEquityBaseRates(
    baseRates({ status: "ok", reasons: [] }, {
      abstained: false, abstainReasons: [], decisionUse: use,
      validation: { ...VALIDATION_FAIL, gatePassed: true, gateReasons: [], brierDiffCi90: [-0.01, -0.002] },
      research: { label: "validated", probTargetFirst: 0.45, probStopFirst: 0.35, probTimeout: 0.2 },
    }),
    "BID",
  );
  assert.equal(ok.configs[0].decisionUse?.probTargetFirst, 0.45);
  assert.deepEqual(ok.configs[0].validation?.brierDiffCi90, [-0.01, -0.002]);
  // Spec §11: CI is [lower, upper] or null only.
  assert.throws(
    () => parseEquityBaseRates(baseRates({}, { validation: { ...VALIDATION_FAIL, brierDiffCi90: { lower: -0.01, upper: 0.01 } } }), "BID"),
    /\[lower, upper\] or null/,
  );
  assert.equal(parseEquityBaseRates(baseRates({}, { validation: { ...VALIDATION_FAIL, brierDiffCi90: null } }), "BID").configs[0].validation?.brierDiffCi90, null);
  assert.throws(
    () => parseEquityBaseRates(baseRates({}, { research: { label: "validated" } }), "BID"),
    /"validated" without a passed gate/,
  );
});

test("base rates: unavailable artifact-missing, symbol/contract/probability guards, additive lists degrade", () => {
  const missing = parseEquityBaseRates(
    { contractVersion: "equity-base-rates-v1", symbol: "MBB", timeframe: "1d", status: "unavailable", reasons: ["artifact-missing"], artifact: null, configs: [] },
    "MBB",
  );
  assert.equal(missing.status, "unavailable");
  assert.equal(missing.artifact, null);
  // Never accept another symbol's artifact as a fallback.
  assert.throws(() => parseEquityBaseRates(baseRates(), "MBB"), /must be "MBB"/);
  assert.throws(() => parseEquityBaseRates(baseRates({ contractVersion: "equity-base-rates-v2" }), "BID"), /contractVersion/);
  assert.throws(() => parseEquityBaseRates(baseRates({ timeframe: "1h" }), "BID"), /timeframe/);
  assert.throws(
    () => parseEquityBaseRates(baseRates({}, { research: { label: "unvalidated", probTargetFirst: 0.7, probStopFirst: 0.5 } }), "BID"),
    /<= 1/,
  );
  const noReasons = { ...baseRates() } as Record<string, unknown>;
  delete noReasons.reasons;
  assert.deepEqual(parseEquityBaseRates(noReasons, "BID").reasons, []);
});

test("base rates: targetPct/stopPct are fractions (spec §11) and format as percent", () => {
  const parsed = parseEquityBaseRates(baseRates(), "BID");
  assert.equal(parsed.configs[0].targetPct, 0.05);
  assert.equal(parsed.configs[0].stopPct, 0.04);
  assert.equal(formatBarrier(parsed.configs[0].targetPct, "+"), "+5%");
  assert.equal(formatBarrier(parsed.configs[0].stopPct, "-"), "−4%");
  assert.equal(formatBarrier(0.1, "+"), "+10%");
  // A percent-number payload must fail closed instead of rendering +500%.
  assert.throws(() => parseEquityBaseRates(baseRates({}, { targetPct: 5 }), "BID"), /positive fraction/);
  assert.throws(() => parseEquityBaseRates(baseRates({}, { stopPct: -0.04 }), "BID"), /positive fraction/);
  assert.throws(() => barrierFraction(0, "x"), /positive fraction/);
});

// --- context ---------------------------------------------------------------------------

const CONTEXT = {
  contractVersion: "equity-context-v1",
  symbol: "BID",
  generatedAtUtc: "2026-10-16T09:00:00Z",
  relativeStrength: {
    status: "ok",
    benchmarks: [
      { symbol: "VNINDEX", kind: "index", status: "ok", alignedSessions: 60, returns: { "20": { instrument: 0.03, benchmark: 0.01, excess: 0.02 }, "60": { instrument: -0.02, benchmark: 0.04, excess: -0.06 } } },
      { symbol: "CTG", kind: "peer", status: "unavailable", reason: "not enough aligned sessions", alignedSessions: 12 },
    ],
  },
  corporateActions: { status: "unavailable", reason: "VCI events source unavailable" },
  events: { status: "empty", items: [] },
  fundamentals: {
    status: "ok",
    items: [
      { period: "2026Q2", periodEndDate: "2026-06-30", metric: "ROE", value: 18.2, unit: "percent", note: "theo quý, không annualize", publishedDate: "2026-07-30", availableAtUtc: "2026-07-30T17:00:00Z", asOfUtc: "2026-10-16T00:00:00Z", source: "KBS", sourceUrl: "https://kbs.example/fin" },
      { period: "2026Q2", metric: "NPL", value: null, unit: "percent", unavailableReason: "no point-in-time source verified", source: null, sourceUrl: "javascript:alert(1)" },
    ],
  },
  limitations: ["NIM theo quý, không annualize."],
};

test("context: sections parse with status/reason; unavailable sections carry no rows; links sanitized", () => {
  const ctx = parseEquityContext(CONTEXT, "BID");
  assert.equal(ctx.relativeStrength.items.length, 2);
  assert.equal(ctx.relativeStrength.items[0].returns["20"].excess, 0.02);
  assert.equal(ctx.relativeStrength.items[1].status, "unavailable");
  assert.equal(ctx.relativeStrength.items[0].kind, "index");
  assert.equal(ctx.fundamentals.items[0].periodEndDate, "2026-06-30");
  assert.equal(ctx.fundamentals.items[0].note, "theo quý, không annualize");
  const badKind = structuredClone(CONTEXT);
  (badKind.relativeStrength.benchmarks[0] as Record<string, unknown>).kind = "sector";
  assert.throws(() => parseEquityContext(badKind, "BID"), /kind/);
  assert.equal(ctx.corporateActions.status, "unavailable");
  assert.equal(ctx.corporateActions.reason, "VCI events source unavailable");
  assert.deepEqual(ctx.corporateActions.items, []);
  assert.equal(ctx.events.status, "empty");
  assert.equal(ctx.fundamentals.items[1].value, null);
  assert.equal(ctx.fundamentals.items[1].sourceUrl, null);
  assert.equal(ctx.fundamentals.items[0].sourceUrl, "https://kbs.example/fin");
  assert.equal(safeSourceUrl("ftp://x"), null);
});

test("fundamentals formatting keeps source-published values: percent as-is, ratio as multiple, VND money", () => {
  assert.equal(formatFundamentalValue({ metric: "ROE", value: 18.2, unit: "percent" }), "18,20%");
  assert.equal(formatFundamentalValue({ metric: "PB", value: 1.4, unit: "ratio" }), "1,40×");
  assert.equal(formatFundamentalValue({ metric: "BVPS", value: 21000, unit: "VND" }), "21.000 ₫");
  assert.equal(formatFundamentalValue({ metric: "NPL", value: null, unit: "percent" }), "—");
});

test("context: null metric needs a reason; ok-without-rows renders as empty; wrong symbol rejected", () => {
  const badMetric = structuredClone(CONTEXT);
  badMetric.fundamentals.items[1].unavailableReason = undefined as unknown as string;
  assert.throws(() => parseEquityContext(badMetric, "BID"), /unavailableReason is required/);

  const okEmpty = structuredClone(CONTEXT) as Record<string, unknown>;
  okEmpty.events = { status: "ok", items: [] };
  assert.equal(parseEquityContext(okEmpty, "BID").events.status, "empty");

  assert.throws(() => parseEquityContext(CONTEXT, "MBB"), /must be "MBB"/);
  const noLimitations = structuredClone(CONTEXT) as Record<string, unknown>;
  delete noLimitations.limitations;
  assert.deepEqual(parseEquityContext(noLimitations, "BID").limitations, []);
});

// --- source pins (screen wiring) ----------------------------------------------------------

const screenSource = readFileSync(new URL("../src/components/EquityScreen.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");

test("observations are AdminGuard'd: fetched with the admin key, locked (no request) without one", () => {
  assert.match(apiSource, /authenticatedFetch\("admin", `\$\{API_BASE\}\$\{equityLegacyPath\(scope\.symbol, "observations"\)\}/);
  assert.match(screenSource, /if \(!getSessionKey\("admin"\)\) \{\s*setObservations\(\{ kind: "locked" \}\);/);
  // 429 from the "expensive" policy is an honest rate-limit state.
  assert.match(apiSource, /if \(res\.status === 429\) throw new Error\(EQUITY_RATE_LIMITED_MESSAGE\)/);
});
const shellSource = readFileSync(new URL("../src/components/AppShell.tsx", import.meta.url), "utf8");

test("equity screen: URL-driven symbol, per-symbol remount, no crypto/Binance wiring", () => {
  // Handler only navigates; re-selecting reloads (pitfalls #21/#28).
  assert.match(screenSource, /router\.push\(`\$\{EQUITY_PATH\}\?symbol=\$\{symbol\}`/);
  assert.match(screenSource, /setReloadEpoch\(\(n\) => n \+ 1\)/);
  // Symbol switch remounts the view so no prior-symbol response can land.
  assert.match(screenSource, /key=\{resolution\.profile\.symbol\}/);
  assert.doesNotMatch(screenSource, /binanceWs|BinanceTicker|getKlines|\/api\/market/);
  assert.match(shellSource, /equity: "\/co-phieu"/);
  assert.match(shellSource, /\{ key: "equity", label: "Cổ phiếu"/);
  // /mbb stays a working alias of the equity screen, without a duplicate nav entry (F09).
  assert.match(shellSource, /\["\/mbb", "equity"\]/);
  assert.doesNotMatch(shellSource, /\{ key: "mbb", label:/);
});
