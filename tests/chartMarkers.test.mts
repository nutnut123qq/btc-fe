import assert from "node:assert/strict";
import test from "node:test";
import { buildReplayPatternMarkers } from "../src/lib/chartMarkers.ts";

test("replay pattern markers use causal availability and are ready before chart rendering", () => {
  const markers = buildReplayPatternMarkers({
    events: [
      {
        patternType: "BULLISH_ENGULFING",
        patternCategory: "reversal",
        trendDirection: "bullish",
        originTimeMs: 14_400_000,
        availableTimeMs: 28_800_001,
        sourceOpenTimeMs: [14_400_000, 28_800_000],
      },
      {
        patternType: "SHOOTING_STAR_SHAPE",
        patternCategory: "shape",
        trendDirection: "bearish",
        originTimeMs: 43_200_000,
        availableTimeMs: 57_600_000,
        sourceOpenTimeMs: [43_200_000],
      },
    ],
  }, "4h");

  assert.deepEqual(markers, [
    {
      time: 28_800,
      position: "belowBar",
      color: "#34d399",
      shape: "arrowUp",
      size: 1,
      text: "BULLISH_ENGULFING",
    },
    {
      time: 57_600,
      position: "aboveBar",
      color: "#f87171",
      shape: "arrowDown",
      size: 1,
      text: "SHOOTING_STAR_SHAPE",
    },
  ]);
});

test("replay pattern marker builder returns no realtime fallback", () => {
  assert.deepEqual(buildReplayPatternMarkers(null, "4h"), []);
});

test("DOJI replay pattern is neutral instead of a fabricated bearish marker", () => {
  const [marker] = buildReplayPatternMarkers({
    events: [{
      patternType: "DOJI",
      patternCategory: "indecision",
      trendDirection: "neutral",
      originTimeMs: 14_400_000,
      availableTimeMs: 28_800_000,
      sourceOpenTimeMs: [14_400_000],
    }],
  }, "4h");

  assert.equal(marker.position, "inBar");
  assert.equal(marker.shape, "circle");
  assert.equal(marker.color, "#d1d5db");
});
