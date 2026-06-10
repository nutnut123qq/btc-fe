export type DiscoveredRuleLike = {
  name?: string;
  description?: string;
  symbol?: string;
  timeframe?: string;
  winRate?: number;
  avgReturn?: number;
  sampleCount?: number;
};

export function parseDiscoveryDescription(description?: string | null): {
  futureBars?: number;
  profitFactor?: number;
} {
  if (!description) return {};
  const future = description.match(/Future\s+(\d+)\s+bars/i);
  const pf = description.match(/PF=([\d.]+)/i);
  return {
    futureBars: future ? parseInt(future[1], 10) : undefined,
    profitFactor: pf ? parseFloat(pf[1]) : undefined,
  };
}

/** Nhãn thời gian sau khi khớp (future bars × timeframe). */
export function formatFutureHorizon(timeframe: string, futureBars: number): string {
  const tf = (timeframe || "1h").toLowerCase();
  const minutesPerBar: Record<string, number> = {
    "1m": 1,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "4h": 240,
    "1d": 1440,
  };
  const mins = (minutesPerBar[tf] ?? 60) * futureBars;
  if (mins < 60) return `sau ${futureBars} nến ${tf} (~${mins} phút)`;
  if (mins % 60 === 0) {
    const h = mins / 60;
    return `sau ${futureBars} nến ${tf} (~${h} giờ)`;
  }
  const h = (mins / 60).toFixed(1);
  return `sau ${futureBars} nến ${tf} (~${h} giờ)`;
}
