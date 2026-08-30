"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentRegime, getRegimeSummary, buildRegimes } from "@/lib/api";
import { MarketRegimeDto, RegimeSummaryDto } from "@/lib/types";
import { RefreshCw, Activity, Layers, ArrowUpCircle, ArrowDownCircle, MinusCircle, Maximize, Minimize2 } from "lucide-react";
import { getSessionKey } from "@/lib/sessionAuth";

export function RegimeBadge({ symbol = "BTCUSDT", timeframe = "1h" }: { symbol?: string; timeframe?: string }) {
  const adminUnlocked = Boolean(getSessionKey("admin"));
  const [currentRegime, setCurrentRegime] = useState<MarketRegimeDto | null>(null);
  const [summary, setSummary] = useState<RegimeSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [regimeRes, summaryRes] = await Promise.all([
        getCurrentRegime(symbol, timeframe).catch(() => null),
        getRegimeSummary(symbol, timeframe).catch(() => null)
      ]);
      setCurrentRegime(regimeRes);
      setSummary(summaryRes);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuild = async () => {
    try {
      setIsLoading(true);
      await buildRegimes(symbol, timeframe, 2000);
      await fetchData();
    } catch (err) {
      console.error("Failed to build regimes:", err);
      setIsLoading(false);
    }
  };

  if (!currentRegime && !isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-[#111] rounded-xl border border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-200">Market Regime</h3>
            <span className="text-xs text-gray-500">{symbol} • {timeframe}</span>
          </div>
          <button 
            onClick={handleBuild}
            disabled={isLoading || !adminUnlocked}
            className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 disabled:opacity-50"
            title="Build / Re-calculate Regimes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-sm text-gray-400 text-center py-2">No regime data available.</div>
      </div>
    );
  }

  const getRegimeColor = (type?: string) => {
    switch (type) {
      case "TrendingUp": return "from-emerald-900/80 to-emerald-800/40 text-emerald-300 border-emerald-500/30";
      case "TrendingDown": return "from-rose-900/80 to-rose-800/40 text-rose-300 border-rose-500/30";
      case "RangeBound": return "from-cyan-900/80 to-cyan-800/40 text-cyan-300 border-cyan-500/30";
      case "Breakout": return "from-amber-900/80 to-amber-800/40 text-amber-300 border-amber-500/30";
      case "Compression": return "from-indigo-900/80 to-indigo-800/40 text-indigo-300 border-indigo-500/30";
      default: return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };
  
  const getRegimeIcon = (type?: string) => {
    switch (type) {
      case "TrendingUp": return <ArrowUpCircle className="w-5 h-5" />;
      case "TrendingDown": return <ArrowDownCircle className="w-5 h-5" />;
      case "RangeBound": return <MinusCircle className="w-5 h-5" />;
      case "Breakout": return <Maximize className="w-5 h-5" />;
      case "Compression": return <Minimize2 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getRegimeLabel = (type?: string) => {
    switch (type) {
      case "TrendingUp": return "Xu hướng Tăng";
      case "TrendingDown": return "Xu hướng Giảm";
      case "RangeBound": return "Đi ngang / Range";
      case "Breakout": return "Phá vỡ / Breakout";
      case "Compression": return "Nén biến động / Compression";
      default: return "Unknown";
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#111] rounded-xl border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-200">Market Regime</h3>
          <span className="text-xs text-gray-500">{symbol} • {timeframe}</span>
        </div>
        <button 
          onClick={handleBuild}
          disabled={isLoading || !adminUnlocked}
          className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 disabled:opacity-50"
          title="Build / Re-calculate Regimes"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {currentRegime && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r ${getRegimeColor(currentRegime.regimeType)}`}>
          {getRegimeIcon(currentRegime.regimeType)}
          <div>
            <div className="font-semibold">{getRegimeLabel(currentRegime.regimeType)}</div>
            <div className="text-xs opacity-80 flex items-center gap-3 mt-1">
              <span>Trend ADX: {currentRegime.trendStrength.toFixed(1)}</span>
              <span>ATR Volatility: {currentRegime.volatilityScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {summary && summary.distribution && (
        <div className="mt-2 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Regime Distribution</span>
            <span>{summary.recentTransitionsCount} transitions</span>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-gray-800">
            <div style={{ width: `${(summary.distribution.trendingUpPct * 100).toFixed(2)}%` }} className="bg-emerald-500" title="Trending Up" />
            <div style={{ width: `${(summary.distribution.trendingDownPct * 100).toFixed(2)}%` }} className="bg-rose-500" title="Trending Down" />
            <div style={{ width: `${(summary.distribution.rangeBoundPct * 100).toFixed(2)}%` }} className="bg-cyan-500" title="Range Bound" />
            <div style={{ width: `${(summary.distribution.breakoutPct * 100).toFixed(2)}%` }} className="bg-amber-500" title="Breakout" />
            <div style={{ width: `${(summary.distribution.compressionPct * 100).toFixed(2)}%` }} className="bg-indigo-500" title="Compression" />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 pt-1">
            <span className="text-emerald-500/80">Up {(summary.distribution.trendingUpPct * 100).toFixed(0)}%</span>
            <span className="text-rose-500/80">Down {(summary.distribution.trendingDownPct * 100).toFixed(0)}%</span>
            <span className="text-cyan-500/80">Range {(summary.distribution.rangeBoundPct * 100).toFixed(0)}%</span>
            <span className="text-amber-500/80">Brk {(summary.distribution.breakoutPct * 100).toFixed(0)}%</span>
            <span className="text-indigo-500/80">Comp {(summary.distribution.compressionPct * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
