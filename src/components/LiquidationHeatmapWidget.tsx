"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { getLiquidationSnapshot } from "../lib/api";
import type { LiquidationSnapshotDto, LiquidationBinDto } from "../lib/types";
import { formatDataAge, isDataStale } from "../lib/freshness";
import { DEFAULT_TIMEFRAME, type ActiveTimeframe } from "../lib/timeframe";
import { ACTIVE_SYMBOL, ACTIVE_SYMBOLS } from "../lib/marketScope";

interface LiquidationHeatmapWidgetProps {
  symbol?: string;
  timeframe?: ActiveTimeframe;
  onSymbolChange?: (s: string) => void;
}

export function LiquidationHeatmapWidget({
  symbol = ACTIVE_SYMBOL,
  timeframe = DEFAULT_TIMEFRAME,
  onSymbolChange,
}: LiquidationHeatmapWidgetProps) {
  const [data, setData] = useState<LiquidationSnapshotDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"heatmap" | "targets">("heatmap");
  const [prevParams, setPrevParams] = useState({ symbol, timeframe });

  if (prevParams.symbol !== symbol || prevParams.timeframe !== timeframe) {
    setPrevParams({ symbol, timeframe });
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    let isMounted = true;

    getLiquidationSnapshot(symbol, timeframe)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch liquidation heatmap");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [symbol, timeframe]);

  const bins = useMemo(() => {
    if (!data?.heatmapBins) return [];
    return [...data.heatmapBins].sort((a, b) => b.price - a.price); // High to Low
  }, [data]);

  const maxVolume = useMemo(() => {
    if (bins.length === 0) return 1;
    return Math.max(...bins.map((b) => b.cumulative_vol_usdt), 1);
  }, [bins]);

  const { shortSqueezeTargets, longFlushTargets } = useMemo(() => {
    if (!data || bins.length === 0) return { shortSqueezeTargets: [], longFlushTargets: [] };
    const curr = data.currentPrice;
    const shorts = bins.filter((b) => b.side === "SHORT" && b.price > curr);
    const longs = bins.filter((b) => b.side === "LONG" && b.price < curr);

    const topShorts = [...shorts].sort((a, b) => b.cumulative_vol_usdt - a.cumulative_vol_usdt).slice(0, 4);
    const topLongs = [...longs].sort((a, b) => b.cumulative_vol_usdt - a.cumulative_vol_usdt).slice(0, 4);

    return { shortSqueezeTargets: topShorts, longFlushTargets: topLongs };
  }, [data, bins]);

  const totalVol = (data?.totalLongLiqUsdt ?? 0) + (data?.totalShortLiqUsdt ?? 0);
  const stale = data ? isDataStale(data.timestampUtc, 2 * 60 * 60_000) : false;
  const longPct = totalVol > 0 ? ((data?.totalLongLiqUsdt ?? 0) / totalVol) * 100 : 50;
  const shortPct = totalVol > 0 ? ((data?.totalShortLiqUsdt ?? 0) / totalVol) * 100 : 50;
  const biasLabel = longPct > 55 ? "LONG FLUSH BIAS" : shortPct > 55 ? "SHORT SQUEEZE BIAS" : "BALANCED";
  const biasColor =
    longPct > 55
      ? "text-rose-400 bg-rose-950/40"
      : shortPct > 55
      ? "text-emerald-400 bg-emerald-900/40"
      : "text-slate-300 bg-slate-800/40";

  return (
    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2 text-base">
              Ước lượng vùng thanh lý
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 ">
                Descriptive estimate
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Mô hình giả định từ &Delta;OI, nấc đòn bẩy và swept filtering; không phải tổng thanh lý quan sát được
            </p>
          </div>
        </div>

        {/* Symbol Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          {ACTIVE_SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => onSymbolChange && onSymbolChange(s)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                symbol === s
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {s.replace("USDT", "")}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-8 rounded-xl bg-slate-950/50 text-center animate-pulse text-slate-400 flex flex-col items-center justify-center gap-2 border border-slate-800/50">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Calculating liquidation density matrix for {symbol}...</span>
        </div>
      )}

      {error && (
        <div className="p-5 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-800/40 text-xs">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-2.5 text-xs leading-relaxed text-amber-200/90">
            Estimator: {data.estimatorKind ?? "leverage-tier exposure model"} · assumptions {data.assumptionsVersion ?? "legacy/unversioned"} · leverage {(data.leverageTiers ?? [25, 50, 100]).join("x, ")}x.
            <span className="ml-1">Các con số là estimated exposure, không phải observed liquidation totals.</span>
            {data.limitation && <span className="ml-1">{data.limitation}</span>}
          </div>
          {stale && (
            <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-5 text-xs text-amber-300">
              Dữ liệu liquidation đã cũ ({formatDataAge(data.timestampUtc)}). Các mức giá dưới đây chỉ là snapshot lịch sử, không phải thị trường hiện tại.
            </div>
          )}
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Reference Price
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                ${data.currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${stale ? "bg-amber-400" : "bg-emerald-400"}`} />
                Snapshot: {formatDataAge(data.timestampUtc)} · {data.timeframe}
              </div>
            </div>

            <div className="p-5 bg-rose-950/20 rounded-xl border border-rose-800/30">
              <div className="text-xs text-rose-400 font-medium mb-1 flex items-center justify-between">
                <span>Estimated long exposure (Below)</span>
                <span className="font-mono">{longPct.toFixed(1)}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-rose-300">
                ${(data.totalLongLiqUsdt / 1_000_000).toFixed(1)}M
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all" style={{ width: `${longPct}%` }} />
              </div>
            </div>

            <div className="p-5 bg-emerald-900/20 rounded-xl border border-emerald-700/30">
              <div className="text-xs text-emerald-400 font-medium mb-1 flex items-center justify-between">
                <span>Estimated short exposure (Above)</span>
                <span className="font-mono">{shortPct.toFixed(1)}%</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                ${(data.totalShortLiqUsdt / 1_000_000).toFixed(1)}M
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${shortPct}%` }} />
              </div>
            </div>
          </div>

          {/* Bias Badge Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Estimated exposure imbalance:</span>
              <span className={`px-2.5 py-0.5 rounded-md font-bold ${biasColor}`}>
                {biasLabel}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("heatmap")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "heatmap"
                    ? "bg-slate-800 text-slate-100 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Heatmap Depth
              </button>
              <button
                onClick={() => setActiveTab("targets")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "targets"
                    ? "bg-slate-800 text-slate-100 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                High-estimate zones
              </button>
            </div>
          </div>

          {/* Tab 1: Heatmap Depth Bars */}
          {activeTab === "heatmap" && (
            <div className="bg-slate-950/90 rounded-xl p-5 border border-slate-800/80 space-y-1.5 max-h-96 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2 pb-1">
                <span>Price Level</span>
                <span className="hidden sm:inline">Distance %</span>
                <span>Est. Liquidation Volume ($)</span>
              </div>

              {bins.map((bin: LiquidationBinDto, idx: number) => {
                const isAbove = bin.price > data.currentPrice;
                const isClose = Math.abs(bin.distance_pct) < 0.6;
                const widthPct = Math.min(100, Math.max(3, (bin.cumulative_vol_usdt / maxVolume) * 100));

                return (
                  <div key={idx} className="relative group">
                    {/* Current Price Marker line */}
                    {isClose && (
                      <div className="my-1.5 flex items-center gap-2 px-2 py-0.5 bg-teal-500/10 rounded text-xs font-mono text-teal-400">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span>SNAPSHOT REFERENCE: ${data.currentPrice.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-mono py-1 px-2 rounded hover:bg-slate-800/40 relative z-10 transition-colors">
                      <div className="flex items-center gap-2 w-28">
                        <span className={isAbove ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                          ${bin.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="hidden sm:block text-xs text-slate-400 w-16 text-center">
                        {bin.distance_pct > 0 ? `+${bin.distance_pct.toFixed(2)}%` : `${bin.distance_pct.toFixed(2)}%`}
                      </div>

                      <div className="flex-1 max-w-xs sm:max-w-sm relative h-4 bg-slate-900 rounded overflow-hidden mx-2">
                        <div
                          className={`h-full rounded transition-all duration-300 ${
                            isAbove
                              ? "bg-gradient-to-r from-emerald-600/40 via-emerald-500/70 to-emerald-400"
                              : "bg-gradient-to-r from-rose-600/40 via-rose-500/70 to-rose-400"
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>

                      <div className="w-24 text-right font-medium text-slate-300 text-xs">
                        ${bin.cumulative_vol_usdt >= 1_000_000
                          ? `${(bin.cumulative_vol_usdt / 1_000_000).toFixed(2)}M`
                          : `${(bin.cumulative_vol_usdt / 1_000).toFixed(1)}k`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Hot Targets Card Grid */}
          {activeTab === "targets" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Short Squeeze Targets */}
              <div className="p-5 bg-emerald-900/10 border border-emerald-700/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 pb-1 border-b border-emerald-700/30">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  HIGH SHORT-EXPOSURE ESTIMATES ABOVE
                </div>
                {shortSqueezeTargets.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No active short clusters nearby</div>
                ) : (
                  shortSqueezeTargets.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg text-xs font-mono">
                      <div>
                        <span className="text-emerald-300 font-bold">${t.price.toFixed(2)}</span>
                        <span className="text-xs text-emerald-500 ml-1.5">+{t.distance_pct.toFixed(2)}%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-200 font-medium">${(t.cumulative_vol_usdt / 1_000_000).toFixed(2)}M</div>
                        <div className="text-xs text-slate-400">Density: {t.density_pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Long Flush Targets */}
              <div className="p-5 bg-rose-950/10 border border-rose-800/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 pb-1 border-b border-rose-800/30">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  HIGH LONG-EXPOSURE ESTIMATES BELOW
                </div>
                {longFlushTargets.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No active long clusters nearby</div>
                ) : (
                  longFlushTargets.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-lg text-xs font-mono">
                      <div>
                        <span className="text-rose-300 font-bold">${t.price.toFixed(2)}</span>
                        <span className="text-xs text-rose-500 ml-1.5">{t.distance_pct.toFixed(2)}%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-200 font-medium">${(t.cumulative_vol_usdt / 1_000_000).toFixed(2)}M</div>
                        <div className="text-xs text-slate-400">Density: {t.density_pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const MemoizedLiquidationHeatmapWidget = memo(LiquidationHeatmapWidget);
