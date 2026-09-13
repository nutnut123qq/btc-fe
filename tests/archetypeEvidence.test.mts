import assert from "node:assert/strict";
import test from "node:test";
import {
  getDominantOutcomeLabel,
  getOutcomeLabelText,
  isWinningOccurrence,
} from "../src/lib/archetypeEvidence.ts";
import type { ArchetypeOutcomeDto } from "../src/lib/types.ts";

function outcome(upRate: number, downRate: number, sidewaysRate: number): ArchetypeOutcomeDto {
  return {
    horizon: "4h",
    totalSamples: 8,
    upRate,
    downRate,
    sidewaysRate,
    avgReturnPct: 0.5,
    medianReturnPct: 0.4,
    maxReturnPct: 2,
    minReturnPct: -1,
    stdDevReturnPct: 0.2,
    recentSamples: 4,
    recentUpRate: upRate,
    recentDownRate: downRate,
    recentAvgReturnPct: 0.5,
  };
}

test("dominant outcome considers up, down and sideways", () => {
  assert.equal(getDominantOutcomeLabel(outcome(0.6, 0.2, 0.2)), 1);
  assert.equal(getDominantOutcomeLabel(outcome(0.2, 0.6, 0.2)), -1);
  assert.equal(getDominantOutcomeLabel(outcome(0.2, 0.2, 0.6)), 0);
  assert.equal(getDominantOutcomeLabel(null), null);
});

test("win means the actual label matches the archetype dominant direction", () => {
  assert.equal(isWinningOccurrence(1, 1), true);
  assert.equal(isWinningOccurrence(-1, 1), false);
  assert.equal(isWinningOccurrence(0, null), null);
  assert.equal(getOutcomeLabelText(1), "TĂNG");
  assert.equal(getOutcomeLabelText(-1), "GIẢM");
  assert.equal(getOutcomeLabelText(0), "NGANG");
});
