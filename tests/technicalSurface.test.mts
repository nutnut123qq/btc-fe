import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const tradingSource = readFileSync(new URL("../src/components/BinanceTradingScreen.tsx", import.meta.url), "utf8");
const replayPanelSource = readFileSync(new URL("../src/components/TechnicalReplayPanel.tsx", import.meta.url), "utf8");
const tickerSource = readFileSync(new URL("../src/components/BinanceTickerHeader.tsx", import.meta.url), "utf8");

test("primary technical surface does not mount legacy technical widgets with a different cutoff", () => {
  for (const legacyWidget of ["RegimeBadge", "ConfluenceWidget", "SentimentBadge", "LiquidationHeatmapWidget"]) {
    assert.doesNotMatch(tradingSource, new RegExp(`(?:import|<|dynamic\\().*${legacyWidget}`));
  }
  assert.doesNotMatch(tradingSource, /liquidation_heatmap|rightTab === "ai"/);
  assert.doesNotMatch(
    tradingSource,
    /paper_trades|getPaperTradeSummary|getOpenPaperTrades|paperSummary|openPaperTrades/,
    "paper/PnL belongs to its dedicated app surface, not the canonical technical replay",
  );
});

test("chart and seven historical layers are mapped from one Technical Replay envelope", () => {
  assert.match(tradingSource, /setKlines\(replay\.candles\)/);
  assert.match(tradingSource, /setSmartMoney\(replay\.events\)/);
  assert.match(tradingSource, /volumeProfile=\{showVolumeProfile \? technicalReplay\?\.layers\.volumeProfile\.payload/);
  assert.match(tradingSource, /replayPatterns=\{showPatterns \? technicalReplay\?\.layers\.candlePatterns\.payload/);
  assert.match(tradingSource, /replayIndicators=\{showIndicators \? technicalReplay\?\.layers\.indicators\.payload/);
  assert.match(tradingSource, /replayFibonacci=\{technicalReplay\?\.layers\.fibonacci\.payload/);
  assert.match(tradingSource, /symbol=\{ACTIVE_SYMBOL\}[\s\S]*timeframe=\{selectedTf\}[\s\S]*asOfTimeMs=\{asOfTimeMs\}/);
  assert.match(replayPanelSource, /Bảy lớp phân tích kỹ thuật point-in-time/);
});

test("timeframe and as-of transitions invalidate in-flight replay before changing scope", () => {
  assert.match(tradingSource, /const invalidateReplayRequest = useCallback[\s\S]*requestGateRef\.current\.begin\(\)/);
  assert.match(tradingSource, /invalidateReplayRequest\(\);\s*setSelectedTf\(tf\.value\)/);
  assert.match(tradingSource, /invalidateReplayRequest\(\);\s*setAsOfTimeMs\(normalized\)/);
  assert.match(tradingSource, /invalidateReplayRequest\(\);\s*setAsOfTimeMs\(\(current\) =>[\s\S]*stepReplayAsOfMs\(base, selectedTf, direction\)/);
  assert.match(tradingSource, /requestGateRef\.current\.isCurrent\(requestToken\)/);
});

test("canonical replay exposes loading, empty and error states without realtime fallback", () => {
  assert.match(replayPanelSource, /loading && !replay && <div role="status"/);
  assert.match(replayPanelSource, /error && <div role="alert"/);
  assert.match(replayPanelSource, /!loading && !error && !replay/);
  assert.match(replayPanelSource, /không thay bằng widget legacy hoặc dữ liệu realtime/);
  assert.match(replayPanelSource, /replay && replay\.candles\.length === 0/);
});

test("live ticker and market microstructure are explicitly separate from replay cutoff", () => {
  assert.match(tickerSource, /GIÁ REALTIME/);
  assert.match(tickerSource, /không phải giá tại as-of/);
  assert.match(tradingSource, /REALTIME MARKET DATA/);
  assert.match(tradingSource, /không thuộc cutoff/);
});
