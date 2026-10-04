"use client";

import { useState, useMemo } from "react";
import { MarketTicker } from "@/lib/types";
import { Search, Flame, TrendingUp, TrendingDown, X, Star } from "lucide-react";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";

type Props = {
  tickers: MarketTicker[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onClose?: () => void;
  isModal?: boolean;
};

type FilterCategory = "all" | "top" | "gainers" | "losers";

export function SymbolWatchlistPanel({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  onClose,
  isModal = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FilterCategory>("all");
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set([ACTIVE_SYMBOL])
  );

  const toggleFavorite = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  };

  const filteredTickers = useMemo(() => {
    let list = tickers.filter((ticker) => ticker.symbol.toUpperCase() === ACTIVE_SYMBOL);

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter((t) => t.symbol.includes(q));
    }

    // Category filter
    switch (category) {
      case "top":
        list = [...list].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 30);
        break;
      case "gainers":
        list = [...list].sort((a, b) => b.priceChangePercent - a.priceChangePercent);
        break;
      case "losers":
        list = [...list].sort((a, b) => a.priceChangePercent - b.priceChangePercent);
        break;
      default:
        // "all" - default sort by volume
        list = [...list].sort((a, b) => b.quoteVolume - a.quoteVolume);
        break;
    }

    return list;
  }, [tickers, search, category]);

  const formatPrice = (val?: number) => {
    if (val == null) return "--";
    if (val >= 1000) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const formatVol = (val?: number) => {
    if (val == null) return "--";
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toFixed(1);
  };

  const categoryClass = (active: boolean, tone: "teal" | "emerald" | "rose" = "teal") => {
    if (!active) return "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-200";
    if (tone === "emerald") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium";
    if (tone === "rose") return "border-rose-500/40 bg-rose-500/10 text-rose-300 font-medium";
    return "border-teal-500/40 bg-teal-500/10 text-teal-300 font-medium";
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded border border-slate-800 bg-slate-900 ${
        isModal ? "max-h-[85vh] w-full max-w-2xl" : "h-full"
      }`}
    >
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[13px] font-semibold text-slate-200">Thị trường Binance BTC</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            aria-label="Đóng danh sách theo dõi"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search + filters — compact */}
      <div className="border-b border-slate-800 px-2.5 py-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm BTC"
            className="w-full rounded border border-slate-800 bg-slate-950 py-1 pl-7 pr-2 text-[11px] text-slate-100 placeholder-slate-500 transition-colors focus:border-teal-500 focus:outline-none"
            autoFocus={isModal}
          />
        </div>

        {/* Category chips */}
        <div className="mt-1.5 flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
            className={`rounded border px-2 py-0.5 transition-colors ${categoryClass(category === "all")}`}
          >
            Tất cả
          </button>
          <button
            type="button"
            aria-pressed={category === "top"}
            onClick={() => setCategory("top")}
            className={`flex items-center gap-1 rounded border px-2 py-0.5 transition-colors ${categoryClass(category === "top")}`}
          >
            <Flame className="w-3 h-3" /> Top Vol
          </button>
          <button
            type="button"
            aria-pressed={category === "gainers"}
            onClick={() => setCategory("gainers")}
            className={`flex items-center gap-1 rounded border px-2 py-0.5 transition-colors ${categoryClass(category === "gainers", "emerald")}`}
          >
            <TrendingUp className="w-3 h-3" /> Tăng mạnh
          </button>
          <button
            type="button"
            aria-pressed={category === "losers"}
            onClick={() => setCategory("losers")}
            className={`flex items-center gap-1 rounded border px-2 py-0.5 transition-colors ${categoryClass(category === "losers", "rose")}`}
          >
            <TrendingDown className="w-3 h-3" /> Giảm mạnh
          </button>
        </div>
      </div>

      {/* Table List Header */}
      <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[10px] font-medium text-slate-500">
        <div className="col-span-5">Cặp giao dịch</div>
        <div className="col-span-4 text-right">Giá gần nhất</div>
        <div className="col-span-3 text-right">24h (%)</div>
      </div>

      {/* Virtual/Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 min-h-[300px] max-h-[460px]">
        {filteredTickers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Không tìm thấy cặp giao dịch phù hợp
          </div>
        ) : (
          filteredTickers.map((t) => {
            const isSelected = t.symbol.toUpperCase() === selectedSymbol.toUpperCase();
            const isPos = t.priceChangePercent >= 0;
            const isFav = favorites.has(t.symbol);
            const base = t.symbol.replace(/USDT$/i, "");

            return (
              <div
                key={t.symbol}
                onClick={() => {
                  onSelectSymbol(t.symbol);
                  if (onClose) onClose();
                }}
                className={`grid grid-cols-12 items-center px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-teal-500/10 shadow-[inset_2px_0_0_#14b8a6]"
                    : "hover:bg-slate-800/50"
                }`}
              >
                {/* Symbol & Fav */}
                <div className="col-span-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(e, t.symbol)}
                    className="p-0.5 text-slate-500 transition-colors hover:text-slate-300"
                    aria-label={isFav ? `Bỏ theo dõi ${t.symbol}` : `Theo dõi ${t.symbol}`}
                    aria-pressed={isFav}
                  >
                    <Star
                      className={`w-3 h-3 ${
                        isFav ? "fill-teal-400 text-teal-400" : ""
                      }`}
                    />
                  </button>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-100">{base}</span>
                    <span className="ml-1 text-[10px] text-slate-500">/USDT</span>
                    <div className="font-mono text-[10px] tabular-nums text-slate-500">
                      Vol: ${formatVol(t.quoteVolume)}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-4 text-right">
                  <div className="font-mono text-xs font-semibold tabular-nums text-slate-100">
                    ${formatPrice(t.lastPrice)}
                  </div>
                </div>

                {/* 24h Change — plain colored text, TradingView-style */}
                <div className="col-span-3 text-right">
                  <span
                    className={`inline-block font-mono text-[11px] font-semibold tabular-nums ${
                      isPos ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {isPos ? "+" : ""}
                    {t.priceChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
