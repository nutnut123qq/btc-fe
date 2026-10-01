import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const marketSource = readFileSync(new URL("../src/components/MarketScreen.tsx", import.meta.url), "utf8");
const shellSource = readFileSync(new URL("../src/components/AppShell.tsx", import.meta.url), "utf8");

test("primary market navigation mounts only canonical Technical Replay", () => {
  assert.match(marketSource, /<BinanceTradingScreen\s*\/>/);
  assert.match(marketSource, /Technical Replay là bề mặt kỹ thuật chuẩn/);

  for (const legacyWidget of [
    "RegimeBadge",
    "ConfluenceWidget",
    "VolumeProfileWidget",
    "SmartMoneyWidget",
    "ChartPanel",
  ]) {
    assert.doesNotMatch(marketSource, new RegExp(`import.+${legacyWidget}`));
    assert.doesNotMatch(marketSource, new RegExp(`<${legacyWidget}(?:\\s|\\/)`));
  }

  assert.doesNotMatch(marketSource, /Phân tích nâng cao/);
});

test("canonical market surface provides a primary-navigation route to Evidence Center", () => {
  assert.match(shellSource, /<MarketScreen onOpenEvidence=\{\(\) => handleTabChange\("research"\)\} \/>/);
  assert.match(shellSource, /\{ key: "research", label: "Nghiên cứu"/);
  assert.doesNotMatch(shellSource, /key: "advanced"|key: "classic"|Phân tích nâng cao/);
});
