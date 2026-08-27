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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-end gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            {timeframeOptions.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Window Size</label>
          <select
            value={windowSize}
            onChange={(e) => onWindowSizeChange(Number(e.target.value))}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm"
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
          className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Dự báo
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <ArchetypePredictView nextPred={nextPred} seqPred={seqPred} />
      )}
    </div>
  );
}
