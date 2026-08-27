"use client";

import { useEffect, useState } from "react";
import { getSmartMoneyStructures } from "../lib/api";
import type { SmartMoneyStructureDto } from "../lib/types";

export function SmartMoneyWidget({ symbol = "BTCUSDT", timeframe = "1h" }) {
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

  if (loading) return <div className="p-4 rounded-lg bg-gray-800 animate-pulse text-gray-400">Loading Smart Money Data...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-900/50 text-red-400 border border-red-500/50">{error}</div>;
  if (!structures.length) return null;

  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Smart Money Concepts
        </h3>
        <div className="text-xs text-gray-500">Recent Signals</div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {structures.map((st) => {
          const isBull = st.eventType.includes("BULL");
          const isBear = st.eventType.includes("BEAR");
          const colorClass = isBull ? "text-green-400 bg-green-500/10 border-green-500/20" : isBear ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-gray-300 bg-gray-800 border-gray-700";
          
          return (
            <div key={st.id} className={`p-3 rounded border text-sm flex flex-col gap-1 ${colorClass}`}>
              <div className="flex justify-between items-start">
                <span className="font-bold">{st.eventType.replace("_", " ")}</span>
                <span className="text-xs opacity-70">
                  {new Date(st.timeMs).toLocaleString()}
                </span>
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
                  <span className={`px-1.5 py-0.5 rounded ${st.isMitigated ? 'bg-gray-700 text-gray-400' : 'bg-blue-500/20 text-blue-300'}`}>
                    {st.isMitigated ? "Mitigated" : "Active"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
