import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_SYMBOL,
  ACTIVE_SYMBOL_LABEL,
  ACTIVE_SYMBOLS,
  INSTRUMENTS,
  activeTimeframesFor,
  canonicalizeSymbol,
  defaultTimeframeFor,
  getInstrument,
  isEnabledSymbol,
  isKnownSymbol,
  isTimeframeActiveFor,
  normalizeTimeframeFor,
} from "../src/lib/marketScope.ts";

test("legacy BTC scope exports stay unchanged", () => {
  assert.equal(ACTIVE_SYMBOL, "BTCUSDT");
  assert.equal(ACTIVE_SYMBOL_LABEL, "BTC/USDT");
  assert.deepEqual([...ACTIVE_SYMBOLS], ["BTCUSDT"]);
});

test("instrument registry declares the shared BTC/MBB contract", () => {
  assert.deepEqual(INSTRUMENTS.map((i) => i.symbol), ["BTCUSDT", "MBB"]);

  const btc = getInstrument("BTCUSDT");
  assert.equal(btc?.assetClass, "crypto");
  assert.equal(btc?.currency, "USDT");
  assert.equal(btc?.timezone, "UTC");
  assert.equal(btc?.dataProvider, "Binance");
  assert.equal(btc?.priceBasis, "raw");
  assert.equal(btc?.enabled, true);
  assert.deepEqual([...(btc?.activeTimeframes ?? [])], ["1h", "4h", "1d"]);
  assert.equal(btc?.defaultTimeframe, "4h");

  const mbb = getInstrument("MBB");
  assert.equal(mbb?.assetClass, "equity");
  assert.equal(mbb?.venue, "HOSE");
  assert.equal(mbb?.currency, "VND");
  assert.equal(mbb?.timezone, "Asia/Ho_Chi_Minh");
  assert.equal(mbb?.dataProvider, "VCI");
  assert.equal(mbb?.crossCheckDataProvider, "KBS");
  assert.equal(mbb?.priceBasis, "adjusted");
  assert.equal(mbb?.enabled, false);
  assert.deepEqual([...(mbb?.activeTimeframes ?? [])], ["1h", "1d"]); // no synthetic 4h
  assert.equal(mbb?.defaultTimeframe, "1d");
});

test("capability flags split technical analysis from crypto-only features", () => {
  const btc = getInstrument("BTCUSDT")!.capabilities;
  for (const value of Object.values(btc)) assert.equal(value, true);

  const mbb = getInstrument("MBB")!.capabilities;
  assert.equal(mbb.technicalAnalysis, true);
  for (const [name, value] of Object.entries(mbb)) {
    if (name !== "technicalAnalysis") assert.equal(value, false, name);
  }
});

test("canonicalizeSymbol keeps the BTC alias and MBB canonical form", () => {
  assert.equal(canonicalizeSymbol(" btc "), "BTCUSDT");
  assert.equal(canonicalizeSymbol("BTCUSDT"), "BTCUSDT");
  assert.equal(canonicalizeSymbol("mbb"), "MBB");
  assert.equal(canonicalizeSymbol("ETHUSDT"), "ETHUSDT"); // unknown passes through
  assert.equal(canonicalizeSymbol(undefined), "");
});

test("symbol awareness fails closed on unknown instruments", () => {
  assert.equal(isKnownSymbol("MBB"), true);
  assert.equal(isKnownSymbol("BTC"), true);
  assert.equal(isKnownSymbol("ETHUSDT"), false);
  assert.equal(isEnabledSymbol("MBB"), false);
  assert.equal(isEnabledSymbol("BTCUSDT"), true);
  assert.equal(isTimeframeActiveFor("ETHUSDT", "1d"), false);
  assert.equal(activeTimeframesFor("DOGE"), undefined);
  assert.equal(defaultTimeframeFor("DOGE"), undefined);
});

test("timeframe recovery is display-only and falls back to BTC default for malformed UI state", () => {
  assert.equal(normalizeTimeframeFor("DOGE", "1d"), "4h");
});

test("MBB accepts 1h/1d with 1d default and rejects 4h", () => {
  assert.equal(isTimeframeActiveFor("MBB", "1h"), true);
  assert.equal(isTimeframeActiveFor("MBB", "1d"), true);
  assert.equal(isTimeframeActiveFor("MBB", "4h"), false);
  assert.equal(normalizeTimeframeFor("MBB", "4h"), "1d");
  assert.equal(normalizeTimeframeFor("MBB", " 1H "), "1h");
  assert.equal(normalizeTimeframeFor("MBB", undefined), "1d");
  assert.equal(normalizeTimeframeFor("BTCUSDT", "15m"), "4h");
});
