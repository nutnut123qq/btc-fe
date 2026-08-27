"use client";

import { RefreshCw } from "lucide-react";
import type { TransitionMatrixDto, ArchetypeTransitionDto } from "@/lib/types";
import { MarkovMatrixView } from "./MarkovMatrixView";

interface ArchetypeTransitionsViewProps {
  timeframe: string;
  windowSize: number;
  timeframeOptions: string[];
  windowSizes: number[];
  matrix: TransitionMatrixDto | null;
  loading: boolean;
  selectedArcForTrans: number | null;
  arcTransitions: ArchetypeTransitionDto[];
  arcTransLoading: boolean;
  onTimeframeChange: (tf: string) => void;
  onWindowSizeChange: (ws: number) => void;
  onSelectArc: (id: number) => void;
}

export function ArchetypeTransitionsView({
  timeframe,
  windowSize,
  timeframeOptions,
  windowSizes,
  matrix,
  loading,
  selectedArcForTrans,
  arcTransitions,
  arcTransLoading,
  onTimeframeChange,
  onWindowSizeChange,
  onSelectArc,
}: ArchetypeTransitionsViewProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm"
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
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm"
          >
            {windowSizes.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <MarkovMatrixView
          matrix={matrix}
          selectedArcForTrans={selectedArcForTrans}
          arcTransitions={arcTransitions}
          arcTransLoading={arcTransLoading}
          onSelectArc={onSelectArc}
        />
      )}
    </div>
  );
}
