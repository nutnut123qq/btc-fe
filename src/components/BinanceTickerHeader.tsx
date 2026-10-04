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
    <section className="flex min-h-11 min-w-0 max-w-full flex-wrap items-center gap-x-4 gap-y-1 rounded border border-slate-800 bg-slate-900 px-3 py-1.5" aria-label="Giá thị trường realtime, độc lập với cutoff Technical Replay">
      {/* Realtime marker + symbol */}
      <div className="flex items-center gap-2">
        <span className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-teal-300">Realtime<span className="sr-only"> — GIÁ REALTIME</span></span>
        <span className="text-sm font-semibold tracking-tight text-slate-100">
          {baseAsset}<span className="font-normal text-slate-500">/USDT</span>
        </span>
        <span className="hidden text-[11px] text-slate-500 sm:inline">Spot Binance</span>
      </div>
      <div className="hidden h-4 w-px bg-slate-800 sm:block" aria-hidden="true" />

      {/* Current Price + 24h change — mono tabular */}
      <div className="flex items-baseline gap-2">
        <span className="flex items-center gap-1 font-mono text-lg font-semibold tabular-nums tracking-tight text-slate-50">
          {ticker ? `$${formatPrice(ticker.lastPrice)}` : loading ? "Đang tải..." : "--"}
          {ticker && (
            isPositive ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          )}
        </span>
        <span className={`font-mono text-xs font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
          {ticker ? `${isPositive ? "+" : ""}${formatPrice(ticker.priceChange)} (${isPositive ? "+" : ""}${ticker.priceChangePercent.toFixed(2)}%)` : "--"}
        </span>
      </div>

      {/* 24h stats — quiet, mono */}
      <div className="hidden flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[11px] text-slate-500 md:flex">
        <span>Đỉnh 24h <b className="font-mono font-medium tabular-nums text-slate-200">{ticker ? `$${formatPrice(ticker.highPrice)}` : "--"}</b></span>
        <span>Đáy 24h <b className="font-mono font-medium tabular-nums text-slate-200">{ticker ? `$${formatPrice(ticker.lowPrice)}` : "--"}</b></span>
        <span>KL 24h <b className="font-mono font-medium tabular-nums text-slate-200">{ticker ? `$${formatVol(ticker.quoteVolume)}` : "--"}</b></span>
        <span className="hidden xl:inline">KL {baseAsset} <b className="font-mono font-medium tabular-nums text-slate-200">{ticker ? formatVol(ticker.volume) : "--"}</b></span>
      </div>

      {/* Realtime provenance — right-aligned, quiet, amber when stale */}
      <div className={`ml-auto font-mono text-[11px] tabular-nums ${stale ? "text-amber-400" : "text-slate-500"}`}>
        {sourceLabel} · {connection?.state ?? "snapshot"} · {tickerAgeMs == null ? "chưa có timestamp" : `${Math.round(tickerAgeMs / 1000)}s trước`} · không phải giá tại as-of
      </div>
    </section>
  );
}
