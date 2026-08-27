import { KlineOHLC } from "./types";

export type IndicatorPoint = { time: number; value: number };

export function ema(data: KlineOHLC[], period: number): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    if (prev === 0) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      prev = sum / period;
    } else {
      prev = data[i].close * k + prev * (1 - k);
    }
    out.push({ time: Math.floor(data[i].openTimeMs / 1000), value: prev });
  }
  return out;
}

export function rsi(data: KlineOHLC[], period = 14): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  out.push({ time: Math.floor(data[period].openTimeMs / 1000), value: rsiValue(avgGain, avgLoss) });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push({ time: Math.floor(data[i].openTimeMs / 1000), value: rsiValue(avgGain, avgLoss) });
  }
  return out;
}

function rsiValue(avgGain: number, avgLoss: number) {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function bollinger(
  data: KlineOHLC[],
  period = 20,
  multiplier = 2
): { middle: IndicatorPoint[]; upper: IndicatorPoint[]; lower: IndicatorPoint[] } {
  const middle: IndicatorPoint[] = [];
  const upper: IndicatorPoint[] = [];
  const lower: IndicatorPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    const mean = sum / period;
    let sq = 0;
    for (let j = 0; j < period; j++) sq += Math.pow(data[i - j].close - mean, 2);
    const sd = Math.sqrt(sq / period);
    const t = Math.floor(data[i].openTimeMs / 1000);
    middle.push({ time: t, value: mean });
    upper.push({ time: t, value: mean + multiplier * sd });
    lower.push({ time: t, value: mean - multiplier * sd });
  }
  return { middle, upper, lower };
}

export function convertToHeikinAshi(data: KlineOHLC[]): KlineOHLC[] {
  if (!data || data.length === 0) return [];
  const result: KlineOHLC[] = [];

  for (let i = 0; i < data.length; i++) {
    const orig = data[i];
    const haClose = (orig.open + orig.high + orig.low + orig.close) / 4;

    let haOpen = (orig.open + orig.close) / 2;
    if (i > 0) {
      haOpen = (result[i - 1].open + result[i - 1].close) / 2;
    }

    const haHigh = Math.max(orig.high, haOpen, haClose);
    const haLow = Math.min(orig.low, haOpen, haClose);

    result.push({
      ...orig,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }

  return result;
}

export type FibLevel = { ratio: number; price: number; label: string; isGoldenPocket?: boolean };

export function calculateFibonacciLevels(data: KlineOHLC[]): FibLevel[] {
  if (!data || data.length === 0) return [];
  let maxHigh = -Infinity;
  let minLow = Infinity;

  for (const d of data) {
    if (d.high > maxHigh) maxHigh = d.high;
    if (d.low < minLow) minLow = d.low;
  }

  const diff = maxHigh - minLow;
  if (diff <= 0) return [];

  return [
    { ratio: 1.0, price: maxHigh, label: "Fib 1.000 (Top)" },
    { ratio: 0.786, price: minLow + diff * 0.786, label: "Fib 0.786" },
    { ratio: 0.65, price: minLow + diff * 0.65, label: "Fib 0.650 (GP Top)", isGoldenPocket: true },
    { ratio: 0.618, price: minLow + diff * 0.618, label: "Fib 0.618 (GP Bottom)", isGoldenPocket: true },
    { ratio: 0.5, price: minLow + diff * 0.5, label: "Fib 0.500 (Mid)" },
    { ratio: 0.382, price: minLow + diff * 0.382, label: "Fib 0.382" },
    { ratio: 0.236, price: minLow + diff * 0.236, label: "Fib 0.236" },
    { ratio: 0.0, price: minLow, label: "Fib 0.000 (Bottom)" },
  ];
}
