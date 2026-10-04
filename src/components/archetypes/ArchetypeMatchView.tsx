"use client";

import { RefreshCw } from "lucide-react";
import type { ArchetypeMatchDto } from "@/lib/types";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

interface ArchetypeMatchViewProps {
  timeframe: string;
  timeframeOptions: string[];
  matchData: ArchetypeMatchDto[];
  loading: boolean;
  onTimeframeChange: (tf: string) => void;
  onMatch: () => void;
}

export function ArchetypeMatchView({
  timeframe,
  timeframeOptions,
  matchData,
  loading,
  onTimeframeChange,
  onMatch,
}: ArchetypeMatchViewProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-3">
      <div className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-slate-800 pb-3">
        <div>
          <label className="block text-[11px] text-slate-400">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="mt-1 h-8 rounded-sm border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none"
          >
            {timeframeOptions.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onMatch}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-sm border border-slate-800 px-3 text-xs font-semibold text-teal-300 hover:bg-teal-500/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Match
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {matchData.map((m, i) => (
            <div
              key={i}
              className="rounded border border-slate-800 bg-slate-950 p-3"
            >
              <div className="mb-2 font-mono text-xs font-medium tabular-nums text-slate-300">
                Window {m.windowSize}
              </div>
              {m.archetype ? (
                <>
                  <div className="mb-2 font-mono text-sm font-semibold text-teal-400">
                    {m.archetype.archetypeCode}
                  </div>
                  <div className="mb-3 h-16 rounded-sm border border-slate-800/60 bg-slate-900 p-1">
                    {m.archetype.representativeOhlc && (
                      <ArchetypeGlyph bars={m.archetype.representativeOhlc} />
                    )}
                  </div>
                  <div className="mb-1 text-[11px] text-slate-400">Độ tương đồng</div>
                  <div
                    className={`font-mono text-xs font-bold tabular-nums ${
                      m.similarity > 0.8
                        ? "text-emerald-400"
                        : m.similarity > 0.6
                        ? "text-slate-400"
                        : "text-rose-400"
                    }`}
                  >
                    {(m.similarity * 100).toFixed(1)}%
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">— Không khớp —</div>
              )}
            </div>
          ))}
          {matchData.length === 0 && (
            <div className="md:col-span-2 lg:col-span-4 py-8 text-center text-slate-400">
              Không có kết quả khớp cho cấu hình này
            </div>
          )}
        </div>
      )}
    </div>
  );
}
