"use client";

import { useEffect, useState, useRef, memo, useCallback } from "react";
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
  const prevSymbolRef = useRef(symbol);

  // Initial REST fetch
  useEffect(() => {
    let isMounted = true;
    if (prevSymbolRef.current !== symbol) {
      setTrades([]);
      setLoading(true);
      prevSymbolRef.current = symbol;
    }

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      {/* Widget Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs text-gray-100 uppercase tracking-wider">
            Lịch sử khớp lệnh (Market Trades)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <Radio className="w-2.5 h-2.5 animate-pulse" />
          <span>Realtime 60FPS</span>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] font-semibold text-gray-400 border-b border-gray-800/60 bg-gray-950/60">
        <div className="col-span-4">Giá (USDT)</div>
        <div className="col-span-4 text-right">Số lượng</div>
        <div className="col-span-4 text-right">Thời gian</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/20 max-h-[380px] min-h-[220px]">
        {loading && trades.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" /> Đang cập nhật khớp lệnh...
          </div>
        ) : trades.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500">
            Chưa có dữ liệu khớp lệnh
          </div>
        ) : (
          trades.map((trade) => {
            const isBuy = trade.isBuyer; // true = taker buy (emerald), false = taker sell (rose)
            return (
              <div
                key={trade.id}
                className="grid grid-cols-12 px-3 py-1 text-xs items-center hover:bg-gray-800/40 transition-colors font-mono"
              >
                {/* Price */}
                <div className={`col-span-4 font-semibold ${isBuy ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatPrice(trade.price)}
                </div>

                {/* Amount / Qty */}
                <div className="col-span-4 text-right text-gray-200">
                  {formatQty(trade.qty)}
                </div>

                {/* Time */}
                <div className="col-span-4 text-right text-gray-500 text-[11px]">
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
