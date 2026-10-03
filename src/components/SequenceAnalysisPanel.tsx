"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  MarketStructureResponse,
  SequenceScenariosResponse,
  ValidateCandlesResponse,
} from "@/lib/types";
import { getMarketStructure, getSequenceScenarios, validateCandles } from "@/lib/api";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, type ActiveTimeframe } from "@/lib/timeframe";

function TrendBadge({ trend }: { trend: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Uptrend: { cls: "text-emerald-400 bg-emerald-950/40", icon: <TrendingUp className="w-3 h-3" /> },
    Downtrend: { cls: "text-rose-400 bg-rose-950/40", icon: <TrendingDown className="w-3 h-3" /> },
    Sideways: { cls: "text-slate-400 bg-slate-800/60", icon: <Minus className="w-3 h-3" /> },
  };
  const s = map[trend] ?? map.Sideways;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${s.cls}`}>
      {s.icon} {trend}
    </span>
  );
}

export function SequenceAnalysisPanel({
  symbol = "BTCUSDT",
  timeframe = DEFAULT_TIMEFRAME,
  onTimeframeChange,
}: {
  symbol?: string;
  timeframe?: ActiveTimeframe;
  onTimeframeChange?: (timeframe: ActiveTimeframe) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structure, setStructure] = useState<MarketStructureResponse | null>(null);
  const [scenarios, setScenarios] = useState<SequenceScenariosResponse | null>(null);
  const [validation, setValidation] = useState<ValidateCandlesResponse | null>(null);

  const load = useCallback(async (tf: ActiveTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const [ms, sc, val] = await Promise.all([
        getMarketStructure(symbol, tf, 200),
        getSequenceScenarios(symbol, tf, 50),
        validateCandles(symbol, tf, 200),
      ]);
      setStructure(ms);
      setScenarios(sc);
      setValidation(val);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void load(timeframe);
  }, [symbol, timeframe, load]);

  return (
    <div className="space-y-4 border border-slate-800 rounded-xl p-5 bg-slate-900/40">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-100 inline-flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-400" /> Phân tích chuỗi & cấu trúc
        </h3>
        <div className="flex gap-1 ml-auto">
          {ACTIVE_TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
 timeframe === tf
 ? "bg-teal-600 text-white"
 : "bg-slate-900 text-slate-400"
 }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <button
          onClick={() => void load(timeframe)}
          disabled={loading}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800/60 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Tải lại
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/30 text-rose-200 text-xs">{error}</div>
      )}

      {/* Market structure */}
      <section className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Cấu trúc thị trường</span>
          {structure && <TrendBadge trend={structure.currentTrend} />}
        </div>
        {structure && (
          <>
            <p className="text-xs text-slate-400 whitespace-pre-line">{structure.summaryText}</p>
            {structure.events.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {structure.events.slice(-5).map((ev, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-xs ${
 ev.type === "CHoCH"
 ? "text-slate-300 bg-slate-900"
 : "text-slate-300 bg-slate-900"
 }`}
                    title={ev.message}
                  >
                    {ev.type} @ {ev.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Scenarios */}
      <section className="space-y-2">
        <span className="text-xs text-slate-400">Kịch bản chuỗi nến ({scenarios?.scenarios.length ?? 0})</span>
        {scenarios && scenarios.scenarios.length === 0 && (
          <p className="text-xs text-slate-400">Không phát hiện kịch bản đặc biệt.</p>
        )}
        <div className="space-y-2">
          {scenarios?.scenarios.map((s, i) => (
            <div key={i} className="rounded-lg bg-slate-800/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-200">{s.name}</span>
                <span className="text-xs text-slate-400">{Math.round(s.strength * 100)}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded mt-1 overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${Math.round(s.strength * 100)}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{s.suggestion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Validation */}
      {validation && (
        <section className="flex items-center gap-2 text-xs">
          {validation.isValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-slate-400">
            Dữ liệu: {validation.validBars}/{validation.totalBars} nến hợp lệ
            {validation.issues.length > 0 && ` · ${validation.issues.length} vấn đề`}
          </span>
        </section>
      )}
    </div>
  );
}
