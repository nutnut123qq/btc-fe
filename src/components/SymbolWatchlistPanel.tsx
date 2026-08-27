"use client";

import { useState, useMemo } from "react";
import { MarketTicker } from "@/lib/types";
import { Search, Flame, TrendingUp, TrendingDown, X, Star } from "lucide-react";

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
    () => new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"])
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
    let list = tickers;

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

  return (
    <div
      className={`flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl ${
        isModal ? "max-h-[85vh] w-full max-w-2xl" : "h-full"
      }`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between gap-2 bg-gray-900/90">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-teal-400" />
          <span className="font-bold text-sm text-gray-100">Thị trường Binance (Tất cả mã)</span>
          <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
            {tickers.length} cặp USDT
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-800/80 bg-gray-950/40">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm coin (BTC, ETH, SOL, PEPE, DOGE...)"
            className="w-full bg-gray-900 border border-gray-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
            autoFocus={isModal}
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCategory("all")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              category === "all"
                ? "bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setCategory("top")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              category === "top"
                ? "bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            🔥 Top Vol
          </button>
          <button
            onClick={() => setCategory("gainers")}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
              category === "gainers"
                ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Tăng mạnh
          </button>
          <button
            onClick={() => setCategory("losers")}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
              category === "losers"
                ? "bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
          >
            <TrendingDown className="w-3 h-3 text-rose-400" /> Giảm mạnh
          </button>
        </div>
      </div>

      {/* Table List Header */}
      <div className="grid grid-cols-12 px-3 py-2 text-[11px] font-semibold text-gray-400 border-b border-gray-800/80 bg-gray-950/60">
        <div className="col-span-5">Cặp giao dịch</div>
        <div className="col-span-4 text-right">Giá gần nhất</div>
        <div className="col-span-3 text-right">24h (%)</div>
      </div>

      {/* Virtual/Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40 min-h-[300px] max-h-[460px]">
        {filteredTickers.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
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
                className={`grid grid-cols-12 px-3 py-2 text-xs items-center cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-teal-500/10 border-l-2 border-teal-400"
                    : "hover:bg-gray-800/60"
                }`}
              >
                {/* Symbol & Fav */}
                <div className="col-span-5 flex items-center gap-2">
                  <button
                    onClick={(e) => toggleFavorite(e, t.symbol)}
                    className="text-gray-600 hover:text-amber-400 transition-colors p-0.5"
                  >
                    <Star
                      className={`w-3 h-3 ${
                        isFav ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>
                  <div>
                    <span className="font-bold text-gray-100">{base}</span>
                    <span className="text-[10px] text-gray-500 ml-1">/USDT</span>
                    <div className="text-[10px] text-gray-500">
                      Vol: ${formatVol(t.quoteVolume)}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-4 text-right">
                  <div className="font-semibold text-gray-100">
                    ${formatPrice(t.lastPrice)}
                  </div>
                </div>

                {/* 24h Change */}
                <div className="col-span-3 text-right">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      isPos
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
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
