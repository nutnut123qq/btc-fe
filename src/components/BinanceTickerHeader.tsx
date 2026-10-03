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
    <section className="min-w-0 max-w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4" aria-label="Giá thị trường realtime, độc lập với cutoff Technical Replay">
      {/* Active research symbol */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-teal-600 flex items-center justify-center font-bold text-xs text-slate-950 shadow-inner">
            {baseAsset.slice(0, 3)}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100">
                {baseAsset}
              </span>
              <span className="text-xs text-slate-400">/USDT</span>
            </div>
            <span className="text-[10px] text-teal-400">Binance Spot · Tài sản nghiên cứu</span>
          </div>
        </div>

        {/* Current Price */}
        <div className="border-l border-slate-800 pl-3">
          <div className={`text-3xl font-semibold text-slate-50 tabular-nums tracking-tight flex items-center gap-1.5`}>
            {ticker ? `$${formatPrice(ticker.lastPrice)}` : loading ? "Đang tải..." : "--"}
            {ticker && (
              isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`max-w-[18rem] text-[11px] leading-relaxed ${stale ? "text-amber-400" : "text-slate-400"}`}>
            <strong>GIÁ REALTIME</strong> · {sourceLabel} · {connection?.state ?? "snapshot"} · {tickerAgeMs == null ? "chưa có timestamp" : `${Math.round(tickerAgeMs / 1000)}s trước`} · không phải giá tại as-of
          </div>
        </div>
      </div>

      {/* 24h Stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* 24h Change */}
        <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400">Thay đổi 24h</div>
          <div className={`font-semibold flex items-center gap-1 tabular-nums ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {ticker ? (
              <>
                <span>{isPositive ? "+" : ""}{ticker.priceChangePercent.toFixed(2)}%</span>
                <span className="text-[10px] opacity-75 font-normal">({isPositive ? "+" : ""}{formatPrice(ticker.priceChange)})</span>
              </>
            ) : "--"}
          </div>
        </div>

        {/* 24h High */}
        <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400">Cao nhất 24h</div>
          <div className="font-medium text-slate-100 tabular-nums">
            {ticker ? `$${formatPrice(ticker.highPrice)}` : "--"}
          </div>
        </div>

        {/* 24h Low */}
        <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400">Thấp nhất 24h</div>
          <div className="font-medium text-slate-100 tabular-nums">
            {ticker ? `$${formatPrice(ticker.lowPrice)}` : "--"}
          </div>
        </div>

        {/* 24h Volume USDT */}
        <div className="bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400">Khối lượng 24h (USDT)</div>
          <div className="font-medium text-slate-100 tabular-nums">
            {ticker ? `$${formatVol(ticker.quoteVolume)}` : "--"}
          </div>
        </div>

        {/* 24h Volume Base */}
        <div className="hidden lg:block bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="text-xs text-slate-400">Khối lượng ({baseAsset})</div>
          <div className="font-medium text-slate-100 tabular-nums">
            {ticker ? `${formatVol(ticker.volume)} ${baseAsset}` : "--"}
          </div>
        </div>
      </div>
    </section>
  );
}
