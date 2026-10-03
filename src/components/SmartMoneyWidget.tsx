"use client";

import { useEffect, useState } from "react";
import { getSmartMoneyStructures } from "../lib/api";
import type { SmartMoneyStructureDto } from "../lib/types";
import { DEFAULT_TIMEFRAME, type ActiveTimeframe } from "../lib/timeframe";

export function SmartMoneyWidget({
  symbol = "BTCUSDT",
  timeframe = DEFAULT_TIMEFRAME,
}: {
  symbol?: string;
  timeframe?: ActiveTimeframe;
}) {
  const [structures, setStructures] = useState<SmartMoneyStructureDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getSmartMoneyStructures(symbol, timeframe)
      .then((res) => {
        if (isMounted) setStructures(res);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to fetch smart money structures");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  const [visibleCount, setVisibleCount] = useState(10);

  if (loading) return <div className="p-4 rounded-lg bg-slate-800 animate-pulse text-slate-400">Đang tải hình học giá SMC...</div>;
  if (error) return <div className="p-4 rounded-lg bg-rose-900/50 text-rose-400 border border-rose-500/50">{error}</div>;
  if (!structures.length) return <div className="p-4 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">Không có sự kiện hình học SMC.</div>;

  const visibleStructures = structures.slice(0, visibleCount);

  return (
    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Hình học giá SMC
        </h3>
        <div className="text-xs text-slate-400">Descriptive events</div>
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        BOS/CHOCH/FVG/swing là quy tắc hình học giá, không chứng minh dòng tiền tổ chức và không phải xác suất thắng.
      </p>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {visibleStructures.map((st) => {
          const isBull = st.eventType.includes("BULL");
          const isBear = st.eventType.includes("BEAR");
          const colorClass = isBull ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : isBear ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-slate-300 bg-slate-800 border-slate-700";
          
          return (
            <div key={st.id} className={`p-3 rounded border text-sm flex flex-col gap-1 ${colorClass}`}>
              <div className="flex justify-between items-start">
                <span className="font-bold">{st.eventType.replace("_", " ")}</span>
                <span className="text-xs opacity-70">
                  origin {new Date(st.originTimeMs ?? st.timeMs).toLocaleString()}
                </span>
              </div>
              <div className="text-[10px] opacity-70">
                Có thể biết từ: {new Date(st.availableTimeMs ?? st.timeMs).toLocaleString()}
              </div>
              <div className="flex justify-between items-end mt-1">
                <span className="opacity-90">{st.description}</span>
                <span className="font-mono text-xs opacity-80">
                  ${st.price.toFixed(2)}
                </span>
              </div>
              {st.eventType.startsWith("FVG") && (
                <div className="mt-2 text-xs flex justify-between items-center bg-black/20 p-1.5 rounded">
                  <span>Zone: ${st.lowPrice?.toFixed(2)} - ${st.highPrice?.toFixed(2)}</span>
                  <span className={`px-1.5 py-0.5 rounded ${st.isMitigated ? 'bg-slate-700 text-slate-400' : 'bg-teal-500/20 text-teal-300'}`}>
                    {st.isMitigated ? "Mitigated" : "Active"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {visibleCount < structures.length && (
          <button
            onClick={() => setVisibleCount(c => c + 10)}
            className="w-full py-2 mt-2 text-xs font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            Show More ({structures.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
