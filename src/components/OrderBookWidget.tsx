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
  const [error, setError] = useState("");
  const [receivedAtMs, setReceivedAtMs] = useState<number | null>(null);
  const [clockMs, setClockMs] = useState(() => Date.now());
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
          const now = Date.now();
          setDepth({ ...data, venue: "Binance Spot", source: "rest_snapshot", receivedAtMs: now });
          setReceivedAtMs(now);
          setError("");
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Failed to load depth", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không tải được REST depth snapshot");
          setLoading(false);
        }
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

  useEffect(() => {
    const timer = setInterval(() => setClockMs(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

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
  const snapshotAgeMs = receivedAtMs == null ? null : Math.max(0, clockMs - receivedAtMs);
  const stale = snapshotAgeMs == null || snapshotAgeMs > 5_000 || Boolean(error);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-slate-800 bg-slate-900">
      {/* Widget Header */}
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-slate-200">Sổ lệnh</h3>
            <p className={`font-mono text-[10px] tabular-nums ${stale ? "text-amber-400" : "text-slate-500"}`}>
              REST snapshot 2s · {snapshotAgeMs == null ? "chưa nhận" : `${(snapshotAgeMs / 1000).toFixed(0)}s trước`}
            </p>
          </div>
        </div>
        {spread > 0 && (
          <div className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500">
            Spread <span className="font-semibold text-slate-200">${spread.toFixed(2)}</span> ({spreadPct.toFixed(3)}%)
          </div>
        )}
      </div>

      <div className="border-b border-slate-800 bg-slate-950/60 px-3 py-1 text-[10px] leading-relaxed text-slate-500">
        Không phải local order book đồng bộ theo sequence; mỗi lần tải là một ảnh chụp độc lập.
        {error && <span className="ml-1 text-amber-400">Lần tải gần nhất lỗi: {error}</span>}
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-950/60 px-3 py-1.5 text-[10px] font-medium text-slate-500">
        <div className="col-span-5 @max-[280px]:col-span-6 min-w-0">Giá (USDT)</div>
        <div className="col-span-3 @max-[280px]:col-span-6 text-right">Số lượng</div>
        <div className="col-span-4 @max-[280px]:hidden text-right">Tổng (USDT)</div>
      </div>

      {/* Orderbook Rows */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden p-1 font-mono text-xs">
        {loading && !depth ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
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
                    <div className="col-span-5 @max-[280px]:col-span-6 min-w-0 truncate text-rose-400 font-semibold tabular-nums relative z-10">
                      {formatPrice(ask.price)}
                    </div>
                    <div className="col-span-3 @max-[280px]:col-span-6 min-w-0 truncate text-right text-slate-200 tabular-nums relative z-10">
                      {formatQty(ask.qty)}
                    </div>
                    <div className="col-span-4 @max-[280px]:hidden min-w-0 truncate text-right text-slate-400 text-xs tabular-nums relative z-10">
                      {ask.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mid Price / Spread Bar */}
            <div className="my-1 flex items-center justify-between border-y border-slate-800 bg-slate-950 px-3 py-1 text-[11px]">
              <span className="text-slate-500">Giá giữa:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-100">
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
                    <div className="col-span-5 @max-[280px]:col-span-6 min-w-0 truncate text-emerald-400 font-semibold tabular-nums relative z-10">
                      {formatPrice(bid.price)}
                    </div>
                    <div className="col-span-3 @max-[280px]:col-span-6 min-w-0 truncate text-right text-slate-200 tabular-nums relative z-10">
                      {formatQty(bid.qty)}
                    </div>
                    <div className="col-span-4 @max-[280px]:hidden min-w-0 truncate text-right text-slate-400 text-xs tabular-nums relative z-10">
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
