export const ACTIVE_TIMEFRAMES = ["1h", "4h", "1d"] as const;
export type ActiveTimeframe = (typeof ACTIVE_TIMEFRAMES)[number];
export const DEFAULT_TIMEFRAME: ActiveTimeframe = "4h";

export function isActiveTimeframe(value: unknown): value is ActiveTimeframe {
  return typeof value === "string" && ACTIVE_TIMEFRAMES.includes(value as ActiveTimeframe);
}

/** Convert persisted or API-provided selections to a supported production timeframe. */
export function normalizeActiveTimeframe(value: unknown): ActiveTimeframe {
  return isActiveTimeframe(value) ? value : DEFAULT_TIMEFRAME;
}

// Binance interval → milliseconds. Legacy intervals remain readable for historical records.
// Case-sensitive like Binance: "1m" = minute, "1M" = month. Unknown values use the 4h production default.
const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "6h": 21_600_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "3d": 259_200_000,
  "1w": 604_800_000,
  "1M": 2_592_000_000,
};

export function intervalToMs(interval: string): number {
  return INTERVAL_MS[interval] ?? INTERVAL_MS[DEFAULT_TIMEFRAME];
}
