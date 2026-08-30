"use client";

import { MarketTicker } from "@/lib/types";
import { TrendingUp, TrendingDown, Search } from "lucide-react";

type Props = {
  selectedSymbol: string;
  ticker: MarketTicker | null;
  onOpenSelector: () => void;
  loading?: boolean;
};

export function BinanceTickerHeader({ selectedSymbol, ticker, onOpenSelector, loading }: Props) {
  const isPositive = (ticker?.priceChangePercent ?? 0) >= 0;
  const baseAsset = selectedSymbol.replace(/USDT$/i, "");

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
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-4">
      {/* Symbol & Pair Selector Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSelector}
          className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/60 transition-all cursor-pointer shadow-sm hover:border-teal-500/50"
          title="Chọn mã giao dịch khác"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-gray-950 shadow-inner">
            {baseAsset.slice(0, 3)}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-gray-100 group-hover:text-teal-300 transition-colors">
                {baseAsset}
              </span>
              <span className="text-xs text-gray-400">/USDT</span>
            </div>
            <span className="text-[10px] text-teal-400 flex items-center gap-0.5">
              <Search className="w-2.5 h-2.5" /> Đổi mã
            </span>
          </div>
        </button>

        {/* Current Price */}
        <div className="border-l border-gray-800 pl-3">
          <div className={`text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-1.5 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {ticker ? `$${formatPrice(ticker.lastPrice)}` : loading ? "Đang tải..." : "--"}
            {ticker && (
              isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
            )}
          </div>
          <div className="text-[11px] text-gray-400">
            Giá Binance Realtime
          </div>
        </div>
      </div>

      {/* 24h Stats */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* 24h Change */}
        <div className="bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Thay đổi 24h</div>
          <div className={`font-bold flex items-center gap-1 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {ticker ? (
              <>
                <span>{isPositive ? "+" : ""}{ticker.priceChangePercent.toFixed(2)}%</span>
                <span className="text-[10px] opacity-75 font-normal">({isPositive ? "+" : ""}{formatPrice(ticker.priceChange)})</span>
              </>
            ) : "--"}
          </div>
        </div>

        {/* 24h High */}
        <div className="bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Cao nhất 24h</div>
          <div className="font-semibold text-gray-200">
            {ticker ? `$${formatPrice(ticker.highPrice)}` : "--"}
          </div>
        </div>

        {/* 24h Low */}
        <div className="bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Thấp nhất 24h</div>
          <div className="font-semibold text-gray-200">
            {ticker ? `$${formatPrice(ticker.lowPrice)}` : "--"}
          </div>
        </div>

        {/* 24h Volume USDT */}
        <div className="bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Khối lượng 24h (USDT)</div>
          <div className="font-semibold text-teal-300">
            {ticker ? `$${formatVol(ticker.quoteVolume)}` : "--"}
          </div>
        </div>

        {/* 24h Volume Base */}
        <div className="hidden lg:block bg-gray-950/60 px-3 py-1.5 rounded-lg border border-gray-800/80">
          <div className="text-[10px] text-gray-400 uppercase font-medium">Khối lượng ({baseAsset})</div>
          <div className="font-semibold text-gray-300">
            {ticker ? `${formatVol(ticker.volume)} ${baseAsset}` : "--"}
          </div>
        </div>
      </div>
    </div>
  );
}
