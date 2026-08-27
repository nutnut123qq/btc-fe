"use client";

import { useEffect, useState } from "react";
import { getVolumeProfile } from "../lib/api";
import type { VolumeProfileDto } from "../lib/types";

export function VolumeProfileWidget({ symbol = "BTCUSDT", timeframe = "1h" }) {
  const [data, setData] = useState<VolumeProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    getVolumeProfile(symbol, timeframe)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to fetch volume profile");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  if (loading) return <div className="p-4 rounded-lg bg-gray-800 animate-pulse text-gray-400">Loading Volume Profile...</div>;
  if (error) return <div className="p-4 rounded-lg bg-red-900/50 text-red-400 border border-red-500/50">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Volume Profile (VPVR)
        </h3>
        <div className="text-xs text-gray-500">Lookback: 200 bars</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-800/50 p-2 rounded text-center">
          <div className="text-xs text-gray-400 mb-1">Value Area High</div>
          <div className="text-sm font-mono text-gray-300">${data.vahPrice.toFixed(2)}</div>
        </div>
        <div className="bg-amber-500/10 p-2 rounded text-center ring-1 ring-amber-500/30">
          <div className="text-xs text-amber-500 mb-1 font-semibold">Point of Control</div>
          <div className="text-sm font-mono text-amber-400">${data.pocPrice.toFixed(2)}</div>
        </div>
        <div className="bg-gray-800/50 p-2 rounded text-center">
          <div className="text-xs text-gray-400 mb-1">Value Area Low</div>
          <div className="text-sm font-mono text-gray-300">${data.valPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="relative h-48 border-l border-gray-800 pl-2">
        {data.bins.map((bin, i) => (
          <div
            key={i}
            className="flex items-center absolute w-full"
            style={{
              bottom: `${(i / data.bins.length) * 100}%`,
              height: `${100 / data.bins.length}%`
            }}
          >
            <div
              className={`h-full ${
                bin.isPoc
                  ? "bg-amber-500 opacity-90"
                  : bin.isValueArea
                  ? "bg-blue-500 opacity-40"
                  : "bg-gray-600 opacity-20"
              }`}
              style={{ width: `${bin.volumePct}%`, minWidth: '2px' }}
            />
            {bin.isPoc && (
              <span className="absolute left-0 text-[10px] text-amber-500 ml-1 bg-gray-900/80 px-1 rounded z-10 font-mono">
                POC
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
