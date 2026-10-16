import assert from "node:assert/strict";
import test from "node:test";
import {
  MBB_DEFAULT_TIMEFRAME,
  MBB_TIMEFRAMES,
  formatShares,
  formatVnd,
  formatVnDateTime,
  isMbbTimeframe,
  mbbCandleToKline,
  mbbCandlesToKlines,
  normalizeMbbTimeframe,
  parseMbbCandles,
  parseMbbCoverageReport,
  parseMbbDecision,
  parseMbbPosition,
} from "../src/lib/mbb.ts";

const VALID_DECISION = {
  symbol: "MBB",
  action: "hold",
  reasons: ["Xu hướng 1d trung lập", "Không đủ căn cứ mua thêm"],
  triggers: [
    {
      name: "stop-loss",
      timeframe: "1d",
      condition: "close < avgCost * 0.92",
      priceLevelVnd: 22540,
      withinPriceBand: true,
      nonFillRisk: null,
    },
  ],
  invalidation: null,
  position: {
    totalShares: 200,
    settledShares: 200,
    pendingShares: 0,
    sellableSharesNow: 200,
    avgCostPerShareVnd: 24500,
    lastPriceVnd: 23800,
    unrealizedPnlVnd: -140000,
    unrealizedPnlPct: -2.857,
    netProceedsIfSellableNowVnd: 4750440,
  },
  buyMore: null,
  market: {
    trend: "sideways",
    rsiZone: "neutral",
    rsi14: 48.2,
    atr14: 510,
    sma50: 24100,
    ema50: 24000,
    lastDailyCloseVnd: 23800,
    previousDailyCloseVnd: 24000,
    latestHourlyCloseVnd: 23800,
    ceilingPriceVnd: 25480,
    floorPriceVnd: 22120,
  },
  evidenceStatus: "rules-only",
  priceBasis: "adjusted",
  dataFreshness: [
    { timeframe: "1h", latestOpenTimeMs: 1760600000000, latestExpectedFinalizedOpenMs: 1760600000000, isStale: false },
    { timeframe: "1d", latestOpenTimeMs: 1760544000000, latestExpectedFinalizedOpenMs: 1760544000000, isStale: false },
  ],
  generatedAtUtc: "2026-10-16T03:00:00Z",
};

const VALID_CANDLE = {
  openTimeMs: 1760544000000,
  timeIso: "2026-10-15T00:00:00.0000000Z",
  open: 24000,
  high: 24300,
  low: 23700,
  close: 23800,
  volume: 1520000,
  closeTimeMs: 1760576399000,
  quoteVolume: null,
  tradeCount: null,
  takerBuyVolume: null,
  takerBuyQuoteVolume: null,
};

const VALID_POSITION = {
  symbol: "MBB",
  totalShares: 200,
  settledShares: 200,
  pendingShares: 0,
  avgCostPerShareVnd: 24500,
  availableCashVnd: 5000000,
  updatedAtUtc: "2026-10-16T03:00:00Z",
  lots: [
    {
      id: 1,
      quantity: 200,
      costPerShareVnd: 24500,
      acquireDate: "2026-10-10",
      settleDate: "2026-10-14",
      settled: true,
      source: "manual",
    },
  ],
};

const VALID_COVERAGE = {
  symbol: "MBB",
  provider: "VCI",
  crossCheckProvider: "KBS",
  priceBasis: "adjusted",
  venue: "HOSE",
  sourceTimezone: "Asia/Ho_Chi_Minh",
  generatedAtUtc: "2026-10-16T03:00:00Z",
  timeframes: [
    {
      timeframe: "1d",
      totalBars: 3732,
      firstOpenUtc: "2011-11-01T00:00:00Z",
      lastOpenUtc: "2026-10-15T00:00:00Z",
      expectedBars: 3826,
      missingBars: 94,
      coveragePct: 97.5,
      gapRangeCount: 3,
      topGaps: [{ startOpenTimeMs: 1, endOpenTimeMs: 2, missingBars: 4 }],
      unexpectedSessionBars: 1,
      unexpectedSessionOpenTimeMs: [1718870400000],
      invalidOhlcvRows: 0,
      latestExpectedFinalizedOpenUtc: "2026-10-15T00:00:00Z",
      latestBarAgeSeconds: 3600,
      isStale: false,
    },
  ],
  limitations: ["Không có nến 4h native"],
};

test("MBB timeframe scope is exactly 1h/1d — 4h and crypto frames rejected", () => {
  assert.deepEqual([...MBB_TIMEFRAMES], ["1h", "1d"]);
  assert.equal(MBB_DEFAULT_TIMEFRAME, "1d");
  assert.equal(isMbbTimeframe("1h"), true);
  assert.equal(isMbbTimeframe("1d"), true);
  assert.equal(isMbbTimeframe("4h"), false);
  assert.equal(isMbbTimeframe("15m"), false);
  assert.equal(isMbbTimeframe("1w"), false);
  assert.equal(isMbbTimeframe(""), false);
  assert.equal(isMbbTimeframe(null), false);
  assert.equal(normalizeMbbTimeframe("4h"), "1d");
  assert.equal(normalizeMbbTimeframe("1h"), "1h");
  assert.equal(normalizeMbbTimeframe(undefined), "1d");
});

test("parseMbbCandles accepts ascending provider bars and keeps null Binance fields null", () => {
  const second = { ...VALID_CANDLE, openTimeMs: VALID_CANDLE.openTimeMs + 86_400_000 };
  const candles = parseMbbCandles([VALID_CANDLE, second]);
  assert.equal(candles.length, 2);
  assert.equal(candles[0].quoteVolume, null);
  assert.equal(candles[0].tradeCount, null);
  assert.equal(candles[0].takerBuyVolume, null);
  assert.equal(candles[0].takerBuyQuoteVolume, null);
});

test("parseMbbCandles fails closed on malformed input", () => {
  assert.throws(() => parseMbbCandles(null), /must be an array/);
  assert.throws(() => parseMbbCandles({}), /must be an array/);
  const missingKey = { ...VALID_CANDLE };
  delete (missingKey as Record<string, unknown>).close;
  assert.throws(() => parseMbbCandles([missingKey]), /close/);
  // Fabricated Binance fields are still allowed to be real numbers — but NaN is not.
  assert.throws(() => parseMbbCandles([{ ...VALID_CANDLE, volume: Number.NaN }]), /volume/);
  // Descending / duplicate open times are a contract violation.
  const second = { ...VALID_CANDLE, openTimeMs: VALID_CANDLE.openTimeMs - 86_400_000 };
  assert.throws(() => parseMbbCandles([VALID_CANDLE, second]), /ascending/);
  // OHLC sanity: high must not be below low.
  assert.throws(() => parseMbbCandles([{ ...VALID_CANDLE, high: 100, low: 200 }]), /high/);
});

test("mbbCandleToKline projects only shared OHLCV fields", () => {
  const kline = mbbCandleToKline(parseMbbCandles([VALID_CANDLE])[0]);
  assert.deepEqual(kline, {
    openTimeMs: VALID_CANDLE.openTimeMs,
    open: 24000,
    high: 24300,
    low: 23700,
    close: 23800,
    volume: 1520000,
  });
  assert.equal("quoteVolume" in kline, false);
  assert.equal("tradeCount" in kline, false);
  const klines = mbbCandlesToKlines(parseMbbCandles([VALID_CANDLE]));
  assert.equal(klines.length, 1);
});

test("parseMbbDecision accepts the contract payload", () => {
  const decision = parseMbbDecision(VALID_DECISION);
  assert.equal(decision.symbol, "MBB");
  assert.equal(decision.action, "hold");
  assert.equal(decision.evidenceStatus, "rules-only");
  assert.equal(decision.priceBasis, "adjusted");
  assert.equal(decision.triggers[0].withinPriceBand, true);
  assert.equal(decision.triggers[0].nonFillRisk, null);
  assert.equal(decision.buyMore, null);
  assert.equal(decision.position.sellableSharesNow, 200);
  assert.equal(decision.dataFreshness.length, 2);
});

test("parseMbbDecision fails closed on missing keys, bad enum, wrong scope", () => {
  assert.throws(() => parseMbbDecision(null), /must be an object/);
  assert.throws(() => parseMbbDecision({}), /missing required field/);
  assert.throws(() => parseMbbDecision({ ...VALID_DECISION, action: "buy" }), /action/);
  assert.throws(() => parseMbbDecision({ ...VALID_DECISION, symbol: "BTCUSDT" }), /symbol/);
  assert.throws(() => parseMbbDecision({ ...VALID_DECISION, priceBasis: "raw" }), /priceBasis/);
  assert.throws(() => parseMbbDecision({ ...VALID_DECISION, reasons: "nope" }), /reasons/);
  // Trigger timeframe must stay inside the MBB lane.
  const badTrigger = {
    ...VALID_DECISION,
    triggers: [{ ...VALID_DECISION.triggers[0], timeframe: "4h" }],
  };
  assert.throws(() => parseMbbDecision(badTrigger), /timeframe/);
  // A missing position summary must not silently zero-fill.
  const noPosition = { ...VALID_DECISION };
  delete (noPosition as Record<string, unknown>).position;
  assert.throws(() => parseMbbDecision(noPosition), /position/);
});

test("parseMbbDecision accepts buy-more with capacity and conditional-sell nonFillRisk", () => {
  const buyMore = {
    ...VALID_DECISION,
    action: "buy-more",
    buyMore: { maxBuyableShares: 200, maxBuyableLots: 2, estimatedCostVnd: 4760000 },
  };
  const parsed = parseMbbDecision(buyMore);
  assert.equal(parsed.action, "buy-more");
  assert.equal(parsed.buyMore?.maxBuyableLots, 2);

  const conditional = {
    ...VALID_DECISION,
    action: "conditional-sell",
    triggers: [
      {
        name: "band-stop",
        timeframe: "1h",
        condition: "close < 22000",
        priceLevelVnd: 22000,
        withinPriceBand: null,
        nonFillRisk: "Giá mục tiêu dưới sàn — lệnh có thể không khớp.",
      },
    ],
  };
  const parsedConditional = parseMbbDecision(conditional);
  assert.equal(parsedConditional.action, "conditional-sell");
  assert.equal(parsedConditional.triggers[0].withinPriceBand, null);
  assert.match(parsedConditional.triggers[0].nonFillRisk ?? "", /không khớp/);
});

test("parseMbbPosition parses lots and rejects wrong symbol", () => {
  const position = parseMbbPosition(VALID_POSITION);
  assert.equal(position.symbol, "MBB");
  assert.equal(position.lots.length, 1);
  assert.equal(position.lots[0].settled, true);
  assert.equal(position.availableCashVnd, 5000000);
  assert.throws(() => parseMbbPosition({ ...VALID_POSITION, symbol: "BTC" }), /symbol/);
  assert.throws(() => parseMbbPosition({ ...VALID_POSITION, lots: {} }), /lots/);
  assert.throws(() => parseMbbPosition({ ...VALID_POSITION, lots: [{ ...VALID_POSITION.lots[0], quantity: 0 }] }), /quantity/);
});

test("parseMbbCoverageReport parses per-timeframe coverage", () => {
  const report = parseMbbCoverageReport(VALID_COVERAGE);
  assert.equal(report.symbol, "MBB");
  assert.equal(report.timeframes[0].coveragePct, 97.5);
  assert.equal(report.timeframes[0].isStale, false);
  assert.equal(report.timeframes[0].topGaps[0].missingBars, 4);
  assert.throws(() => parseMbbCoverageReport({ ...VALID_COVERAGE, symbol: "BTCUSDT" }), /symbol/);
  const badTf = { ...VALID_COVERAGE, timeframes: [{ ...VALID_COVERAGE.timeframes[0], timeframe: "4h" }] };
  assert.throws(() => parseMbbCoverageReport(badTf), /timeframe/);
});

test("VND/share formatters never fabricate numbers for null", () => {
  assert.equal(formatVnd(null), "—");
  assert.equal(formatVnd(undefined), "—");
  assert.equal(formatVnd(Number.NaN), "—");
  assert.match(formatVnd(24500), /24[.,\s]?500/);
  assert.match(formatVnd(24500), /₫/);
  assert.equal(formatShares(null), "—");
  assert.match(formatShares(200), /200 cp/);
  assert.match(formatVnDateTime(1760544000000), /\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
  assert.equal(formatVnDateTime(null), "—");
});
