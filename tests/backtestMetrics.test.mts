import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { profitFactorView } from "../src/lib/backtestMetrics.ts";

const win = (pnlPct: number) => ({ pnlPct });
const screen = readFileSync(new URL("../src/components/BacktestScreen.tsx", import.meta.url), "utf8");

test("PF 99.9 with a full ledger and no losing trade reads as the no-loss convention", () => {
  // A flat (0%) trade is not a loss: writers only add pnl < 0 to gross loss.
  assert.deepEqual(profitFactorView(99.9, [win(2), win(0), win(1.5)]), { text: "Không có lệnh lỗ", note: "quy ước 99.9" });
});

test("PF 99.9 contradicted by a losing trade in the ledger stays a measured number", () => {
  assert.deepEqual(profitFactorView(99.9, [win(2), win(-0.01), win(1.5)]), { text: "99.90", note: null });
});

test("PF 99.9 is judged on the loaded trades only, so a capped or empty ledger without a visible loss keeps the convention", () => {
  // profitFactorView never sees totalTrades: a ledger cut at 1000 trades is indistinguishable from a full one here.
  assert.deepEqual(profitFactorView(99.9, [win(1), win(3)]), { text: "Không có lệnh lỗ", note: "quy ước 99.9" });
  assert.deepEqual(profitFactorView(99.9, []), { text: "Không có lệnh lỗ", note: "quy ước 99.9" });
});

test("ordinary and zero PF print with two decimals, losses or not", () => {
  assert.deepEqual(profitFactorView(1.6, [win(2), win(-1)]), { text: "1.60", note: null });
  assert.deepEqual(profitFactorView(1.6, [win(2)]), { text: "1.60", note: null });
  assert.deepEqual(profitFactorView(0, [win(-1)]), { text: "0.00", note: null });
  assert.deepEqual(profitFactorView(0, []), { text: "0.00", note: null });
});

test("backtest detail renders PF through profitFactorView, never the raw sentinel", () => {
  assert.match(screen, /profitFactorView\(selected\.profitFactor, selected\.trades\)/);
  assert.match(screen, /\{selectedPf\?\.text\}/);
  assert.doesNotMatch(screen, /profitFactor\.toFixed/);
});
