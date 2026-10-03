"use client";

import { useEffect, useState, memo, useCallback } from "react";
import { MarketTrade } from "@/lib/types";
import { getMarketTrades } from "@/lib/api";
import { subscribeBinanceTrade, BinanceLiveTrade } from "@/lib/binanceWs";
import { ArrowDownUp, RefreshCw, Radio } from "lucide-react";

type Props = {
  symbol: string;
  limit?: number;
};

export function MarketTradesWidget({ symbol, limit = 40 }: Props) {
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevSymbol, setPrevSymbol] = useState(symbol);

  if (prevSymbol !== symbol) {
    setPrevSymbol(symbol);
    setTrades([]);
    setLoading(true);
  }

  // Initial REST fetch
  useEffect(() => {
    let isMounted = true;

    const fetchTrades = async () => {
      try {
        const data = await getMarketTrades(symbol, limit);
        if (isMounted && data) {
          setTrades(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load trades", err);
      }
    };

    void fetchTrades();

    // Subscribe to multiplexed live WebSocket stream
    const unsubscribe = subscribeBinanceTrade(symbol, (liveTrade: BinanceLiveTrade) => {
      if (!isMounted) return;

      const newTrade: MarketTrade = {
        id: liveTrade.timeMs + Math.floor(Math.random() * 1000),
        price: liveTrade.price,
        qty: liveTrade.quantity,
        quoteQty: liveTrade.price * liveTrade.quantity,
        timeMs: liveTrade.timeMs,
        isBuyerMaker: liveTrade.isBuyerMaker,
        isBuyer: !liveTrade.isBuyerMaker,
      };

      setTrades((prev) => {
        const updated = [newTrade, ...prev.filter((t) => t.id !== newTrade.id)];
        return updated.slice(0, limit);
      });
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [symbol, limit]);

  const formatPrice = useCallback((val: number) => {
    if (val >= 1000) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return val.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  }, []);

  const formatQty = useCallback((val: number) => {
    if (val >= 1000) return val.toFixed(2);
    if (val >= 1) return val.toFixed(4);
    return val.toFixed(5);
  }, []);

  const formatTime = useCallback((ms: number) => {
    const d = new Date(ms);
    return d.toTimeString().split(" ")[0]; // HH:mm:ss
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Widget Header */}
      <div className="p-3 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Lịch sử khớp lệnh (Market Trades)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full ">
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          <span>Realtime 60FPS</span>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-950/60">
        <div className="col-span-5 @max-[280px]:col-span-6 min-w-0">Giá (USDT)</div>
        <div className="col-span-3 @max-[280px]:col-span-6 text-right">Số lượng</div>
        <div className="col-span-4 @max-[280px]:hidden text-right">Thời gian</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/20 max-h-[380px] min-h-[220px]">
        {loading && trades.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" /> Đang cập nhật khớp lệnh...
          </div>
        ) : trades.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Chưa có dữ liệu khớp lệnh
          </div>
        ) : (
          trades.map((trade) => {
            const isBuy = trade.isBuyer; // true = taker buy (emerald), false = taker sell (rose)
            return (
              <div
                key={trade.id}
                className="grid grid-cols-12 px-3 py-1 text-xs items-center hover:bg-slate-800/40 transition-colors font-mono"
              >
                {/* Price */}
                <div className={`col-span-5 @max-[280px]:col-span-6 min-w-0 truncate font-semibold tabular-nums ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatPrice(trade.price)}
                </div>

                {/* Amount / Qty */}
                <div className="col-span-3 @max-[280px]:col-span-6 min-w-0 truncate text-right text-slate-200 tabular-nums">
                  {formatQty(trade.qty)}
                </div>

                {/* Time */}
                <div className="col-span-4 @max-[280px]:hidden min-w-0 truncate text-right text-slate-400 text-xs tabular-nums">
                  {formatTime(trade.timeMs)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const MemoizedMarketTradesWidget = memo(MarketTradesWidget);
