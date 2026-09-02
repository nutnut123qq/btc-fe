export type SentimentBand = "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";

export function sentimentBand(score: number, label?: string): SentimentBand {
  const normalized = label?.replaceAll("_", "").toUpperCase();
  if (normalized === "EXTREMEFEAR" || score <= -60) return "extreme-fear";
  if (normalized === "FEAR" || score <= -15) return "fear";
  if (normalized === "NEUTRAL" || score <= 15) return "neutral";
  if (normalized === "GREED" || score <= 60) return "greed";
  return "extreme-greed";
}

export function sentimentMeterPercent(score: number): number {
  return Math.min(100, Math.max(0, (score + 100) / 2));
}
