"use client";

import { RefreshCw } from "lucide-react";
import type { ArchetypeRankingDto } from "@/lib/types";
import { ArchetypeRankingsTable } from "./ArchetypeRankingsTable";

interface ArchetypeRankingsViewProps {
  timeframe: string;
  windowSize: number;
  horizon: string;
  timeframeOptions: string[];
  windowSizes: number[];
  rankings: ArchetypeRankingDto[];
  loading: boolean;
  onTimeframeChange: (tf: string) => void;
  onWindowSizeChange: (ws: number) => void;
  onHorizonChange: (h: string) => void;
}

export function ArchetypeRankingsView({
  timeframe,
  windowSize,
  horizon,
  timeframeOptions,
  windowSizes,
  rankings,
  loading,
  onTimeframeChange,
  onWindowSizeChange,
  onHorizonChange,
}: ArchetypeRankingsViewProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900">
      <div className="flex h-9 items-center border-b border-slate-800 bg-slate-850/60 px-3">
        <span className="truncate text-[13px] font-semibold text-slate-200">Bảng xếp hạng mẫu nến</span>
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-slate-800 px-3 py-2.5">
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
        <div>
          <label className="block text-[11px] text-slate-400">Window Size</label>
          <select
            value={windowSize}
            onChange={(e) => onWindowSizeChange(Number(e.target.value))}
            className="mt-1 h-8 rounded-sm border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none"
          >
            {windowSizes.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400">Horizon</label>
          <select
            value={horizon}
            onChange={(e) => onHorizonChange(e.target.value)}
            className="mt-1 h-8 rounded-sm border border-slate-800 bg-slate-950 px-2 font-mono text-xs tabular-nums text-slate-200 focus:border-teal-500/60 focus:outline-none"
          >
            {["1h", "4h", "1d"].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : (
        <ArchetypeRankingsTable rankings={rankings} />
      )}
    </div>
  );
}
