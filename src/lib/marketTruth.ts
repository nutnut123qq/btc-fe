import { intervalToMs } from "./timeframe.ts";

export type MarketConnectionState = "connecting" | "open" | "reconnecting" | "closed";

export type MarketConnectionSnapshot = {
  state: MarketConnectionState;
  venue: "Binance Spot";
  transport: "WebSocket";
  lastMessageAtMs: number | null;
  reconnectAttempts: number;
};

export function isMarketStreamStale(
  snapshot: Pick<MarketConnectionSnapshot, "state" | "lastMessageAtMs">,
  nowMs = Date.now(),
  maxAgeMs = 15_000,
): boolean {
  if (snapshot.state !== "open" || snapshot.lastMessageAtMs == null) return true;
  return !Number.isFinite(snapshot.lastMessageAtMs) || nowMs - snapshot.lastMessageAtMs > maxAgeMs;
}

export function candleLifecycle(
  openTimeMs: number,
  timeframe: string,
  nowMs = Date.now(),
): "closed" | "forming" | "unknown" {
  if (!Number.isFinite(openTimeMs) || openTimeMs <= 0) return "unknown";
  const closeTimeMs = openTimeMs + intervalToMs(timeframe);
  return nowMs >= closeTimeMs ? "closed" : "forming";
}

export function latestCandleLifecycle(
  candles: Array<{ openTimeMs: number }>,
  timeframe: string,
  nowMs = Date.now(),
): "closed" | "forming" | "unknown" {
  const latest = candles.at(-1);
  return latest ? candleLifecycle(latest.openTimeMs, timeframe, nowMs) : "unknown";
}
