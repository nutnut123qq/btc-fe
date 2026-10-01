import type { CandlePatternReplay } from "./technicalReplay.ts";
import { intervalToMs } from "./timeframe.ts";

export type ReplayPatternMarker = {
  time: number;
  position: "belowBar" | "aboveBar" | "inBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  size: number;
  text: string;
};

/** Build causal chart markers at the first time each replay pattern was knowable. */
export function buildReplayPatternMarkers(
  replayPatterns: CandlePatternReplay | null | undefined,
  timeframe: string,
): ReplayPatternMarker[] {
  if (!replayPatterns?.events.length) return [];

  const intervalMs = intervalToMs(timeframe);
  return replayPatterns.events.map((pattern) => {
    const markerOpenTimeMs = Math.floor(pattern.availableTimeMs / intervalMs) * intervalMs;
    const isNeutral = pattern.patternType.includes("DOJI") || pattern.trendDirection.toLowerCase() === "neutral";
    const isBullish = pattern.patternType.includes("BULLISH") || pattern.patternType === "HAMMER_SHAPE";
    return {
      time: Math.floor(markerOpenTimeMs / 1000),
      position: isNeutral ? "inBar" : isBullish ? "belowBar" : "aboveBar",
      color: isNeutral ? "#d1d5db" : isBullish ? "#34d399" : "#f87171",
      shape: isNeutral ? "circle" : isBullish ? "arrowUp" : "arrowDown",
      size: 1,
      text: pattern.patternType,
    };
  });
}
