"use client";

import { useEffect, useState } from "react";
import { MarketTicker } from "@/lib/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { MarketConnectionSnapshot } from "@/lib/marketTruth";
import { isMarketStreamStale } from "@/lib/marketTruth";

type Props = {
  selectedSymbol: string;
  ticker: MarketTicker | null;
  loading?: boolean;
  connection?: MarketConnectionSnapshot;
};

export function BinanceTickerHeader({ selectedSymbol, ticker, loading, connection }: Props) {
  const [clockMs, setClockMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClockMs(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);
  const isPositive = (ticker?.priceChangePercent ?? 0) >= 0;
  const baseAsset = selectedSymbol.replace(/USDT$/i, "");
  const tickerAgeMs = ticker?.closeTimeMs ? Math.max(0, clockMs - ticker.closeTimeMs) : null;
  const stale = connection
    ? isMarketStreamStale(connection, clockMs) || tickerAgeMs == null || tickerAgeMs > 15_000
    : tickerAgeMs == null || tickerAgeMs > 15_000;
  const sourceLabel = ticker?.source === "websocket" ? "WebSocket" : "REST";

  const formatPrice = (val?: number) => {
    if (val == null) return "--";
    if (val >= 1000) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  };

  const formatVol = (val?: number) => {
    if (val == null) return "--";
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
    return val.toFixed(2);
  };

  return (
    <section className="min-w-0 max-w-full border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1" aria-label="Giá thị trường realtime, độc lập với cutoff Technical Replay">
      {/* Active research symbol */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-teal-600 flex items-center justify-center font-bold text-xs text-slate-950">
          {baseAsset.slice(0, 3)}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-sm text-slate-100">{baseAsset}</span>
          <span className="text-xs text-slate-400">/USDT</span>
          <span className="hidden sm:inline text-xs text-slate-500">· Binance Spot</span>
        </div>
      </div>

      {/* Current Price + 24h change */}
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-slate-50 tabular-nums tracking-tight flex items-center gap-1.5">
          {ticker ? `$${formatPrice(ticker.lastPrice)}` : loading ? "Đang tải..." : "--"}
          {ticker && (
            isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <span className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {ticker ? `${isPositive ? "+" : ""}${formatPrice(ticker.priceChange)} (${isPositive ? "+" : ""}${ticker.priceChangePercent.toFixed(2)}%)` : "--"}
        </span>
      </div>

      {/* OHLC inline — TradingView-style */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 text-xs text-slate-400 tabular-nums">
        <span>Cao 24h <b className="font-medium text-slate-200">{ticker ? `$${formatPrice(ticker.highPrice)}` : "--"}</b></span>
        <span>Thấp 24h <b className="font-medium text-slate-200">{ticker ? `$${formatPrice(ticker.lowPrice)}` : "--"}</b></span>
        <span>KL <b className="font-medium text-slate-200">{ticker ? `$${formatVol(ticker.quoteVolume)}` : "--"}</b></span>
        <span className="hidden lg:inline">KL {baseAsset} <b className="font-medium text-slate-200">{ticker ? formatVol(ticker.volume) : "--"}</b></span>
      </div>

      {/* Realtime provenance — right-aligned, quiet */}
      <div className={`ml-auto text-xs ${stale ? "text-amber-400" : "text-slate-500"}`}>
        <strong>GIÁ REALTIME</strong> · {sourceLabel} · {connection?.state ?? "snapshot"} · {tickerAgeMs == null ? "chưa có timestamp" : `${Math.round(tickerAgeMs / 1000)}s trước`} · không phải giá tại as-of
      </div>
    </section>
  );
}
