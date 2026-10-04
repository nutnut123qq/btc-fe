"use client";

import { RefreshCw } from "lucide-react";
import type { TransitionPredictionDto, SequencePredictionDto } from "@/lib/types";
import { ArchetypePredictView } from "./ArchetypePredictView";

interface ArchetypePredictContainerProps {
  timeframe: string;
  windowSize: number;
  timeframeOptions: string[];
  windowSizes: number[];
  nextPred: TransitionPredictionDto | null;
  seqPred: SequencePredictionDto | null;
  loading: boolean;
  onTimeframeChange: (tf: string) => void;
  onWindowSizeChange: (ws: number) => void;
  onPredict: () => void;
}

export function ArchetypePredictContainer({
  timeframe,
  windowSize,
  timeframeOptions,
  windowSizes,
  nextPred,
  seqPred,
  loading,
  onTimeframeChange,
  onWindowSizeChange,
  onPredict,
}: ArchetypePredictContainerProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900">
      <div className="flex h-9 items-center border-b border-slate-800 bg-slate-850/60 px-3">
        <span className="truncate text-[13px] font-semibold text-slate-200">Dự báo mẫu nến (thử nghiệm)</span>
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
        <button
          onClick={onPredict}
          disabled={loading}
          className="flex h-8 items-center gap-1.5 rounded-sm border border-slate-800 px-3 text-xs font-semibold text-teal-300 hover:bg-teal-500/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Dự báo
        </button>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : (
          <ArchetypePredictView nextPred={nextPred} seqPred={seqPred} />
        )}
      </div>
    </div>
  );
}
