"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { OrderBookDepth } from "@/lib/types";
import { getOrderBookDepth } from "@/lib/api";
import { Layers, RefreshCw } from "lucide-react";

type Props = {
  symbol: string;
  limit?: number;
};

export function OrderBookWidget({ symbol, limit = 12 }: Props) {
  const [depth, setDepth] = useState<OrderBookDepth | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevSymbol, setPrevSymbol] = useState(symbol);

  if (prevSymbol !== symbol) {
    setPrevSymbol(symbol);
    setDepth(null);
    setLoading(true);
  }

  useEffect(() => {
    let isMounted = true;

    const fetchDepth = async () => {
      try {
        const data = await getOrderBookDepth(symbol, limit);
        if (isMounted && data) {
          setDepth(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load depth", err);
      }
    };

    void fetchDepth();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchDepth();
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol, limit]);

  const maxTotal = useMemo(() => {
    if (!depth) return 1;
    const bidMax = Math.max(...depth.bids.map((b) => b.total), 1);
    const askMax = Math.max(...depth.asks.map((a) => a.total), 1);
    return Math.max(bidMax, askMax);
  }, [depth]);

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  };

  const formatQty = (val: number) => {
    if (val >= 1000) return val.toFixed(2);
    if (val >= 1) return val.toFixed(4);
    return val.toFixed(5);
  };

  // Reverse asks so that lowest ask is at the bottom near the spread
  const reversedAsks = useMemo(() => {
    if (!depth) return [];
    return [...depth.asks].slice(0, limit).reverse();
  }, [depth, limit]);

  const topBids = useMemo(() => {
    if (!depth) return [];
    return [...depth.bids].slice(0, limit);
  }, [depth, limit]);

  const bestAsk = depth?.asks[0]?.price;
  const bestBid = depth?.bids[0]?.price;
  const spread = bestAsk != null && bestBid != null ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk != null && bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Widget Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <h3 className="font-bold text-xs text-gray-100 uppercase tracking-wider">
            Sổ lệnh (Order Book)
          </h3>
        </div>
        {spread > 0 && (
          <div className="text-[10px] text-gray-400">
            Spread: <span className="text-gray-200 font-mono">${spread.toFixed(2)}</span> ({spreadPct.toFixed(3)}%)
          </div>
        )}
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-semibold text-gray-400 border-b border-gray-800/60 bg-gray-950/60">
        <div className="col-span-4">Giá (USDT)</div>
        <div className="col-span-4 text-right">Số lượng</div>
        <div className="col-span-4 text-right">Tổng (USDT)</div>
      </div>

      {/* Orderbook Rows */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden p-1 font-mono text-xs">
        {loading && !depth ? (
          <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" /> Đang tải sổ lệnh...
          </div>
        ) : (
          <>
            {/* Asks (Sell Orders - Red) */}
            <div className="flex flex-col gap-0.5">
              {reversedAsks.map((ask, idx) => {
                const depthPct = Math.min(100, Math.round((ask.total / maxTotal) * 100));
                return (
                  <div key={`ask-${idx}`} className="relative grid grid-cols-12 px-2 py-0.5 items-center hover:bg-rose-500/10 transition-colors">
                    {/* Depth background bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none transition-all duration-300"
                      style={{ width: `${depthPct}%` }}
                    />
                    <div className="col-span-4 text-rose-400 font-semibold relative z-10">
                      {formatPrice(ask.price)}
                    </div>
                    <div className="col-span-4 text-right text-gray-200 relative z-10">
                      {formatQty(ask.qty)}
                    </div>
                    <div className="col-span-4 text-right text-gray-400 text-[11px] relative z-10">
                      {ask.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mid Price / Spread Bar */}
            <div className="my-1 py-1.5 px-3 bg-gray-950/80 border-y border-gray-800/80 flex items-center justify-between text-xs">
              <span className="text-gray-400 text-[10px] uppercase">Giá giữa:</span>
              <span className="font-bold text-gray-100 font-mono">
                ${bestAsk != null && bestBid != null ? formatPrice((bestAsk + bestBid) / 2) : "--"}
              </span>
            </div>

            {/* Bids (Buy Orders - Green) */}
            <div className="flex flex-col gap-0.5">
              {topBids.map((bid, idx) => {
                const depthPct = Math.min(100, Math.round((bid.total / maxTotal) * 100));
                return (
                  <div key={`bid-${idx}`} className="relative grid grid-cols-12 px-2 py-0.5 items-center hover:bg-emerald-500/10 transition-colors">
                    {/* Depth background bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none transition-all duration-300"
                      style={{ width: `${depthPct}%` }}
                    />
                    <div className="col-span-4 text-emerald-400 font-semibold relative z-10">
                      {formatPrice(bid.price)}
                    </div>
                    <div className="col-span-4 text-right text-gray-200 relative z-10">
                      {formatQty(bid.qty)}
                    </div>
                    <div className="col-span-4 text-right text-gray-400 text-[11px] relative z-10">
                      {bid.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export const MemoizedOrderBookWidget = memo(OrderBookWidget);
