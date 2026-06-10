import { KlineOHLC } from "./types";

export type IndicatorPoint = { time: number; value: number };

export function sma(data: KlineOHLC[], period: number): IndicatorPoint[] {
  const out: IndicatorPoint[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    out.push({ time: Math.floor(data[i].openTimeMs / 1000), value: sum / period });
  }
  return out;
}

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

export function macd(
  data: KlineOHLC[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: IndicatorPoint[]; signal: IndicatorPoint[]; histogram: IndicatorPoint[] } {
  const emaFast = pureEmaCloses(data.map((d) => d.close), fast);
  const emaSlow = pureEmaCloses(data.map((d) => d.close), slow);
  const macdLine: IndicatorPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] == null || emaSlow[i] == null) continue;
    macdLine.push({ time: Math.floor(data[i].openTimeMs / 1000), value: emaFast[i]! - emaSlow[i]! });
  }
  const signalValues = pureEma(macdLine.map((d) => d.value), signal);
  const signalOut: IndicatorPoint[] = [];
  const histogramOut: IndicatorPoint[] = [];
  let si = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (si < signalValues.length && signalValues[si] != null) {
      const s = signalValues[si]!;
      signalOut.push({ time: macdLine[i].time, value: s });
      histogramOut.push({ time: macdLine[i].time, value: macdLine[i].value - s });
      si++;
    }
  }
  return { macd: macdLine, signal: signalOut, histogram: histogramOut };
}

function pureEmaCloses(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (prev == null) {
      if (i >= period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += values[i - j];
        prev = sum / period;
        out[i] = prev;
      }
    } else {
      prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

function pureEma(values: number[], period: number): (number | null)[] {
  return pureEmaCloses(values, period);
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
