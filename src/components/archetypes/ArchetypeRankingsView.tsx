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
        <div>
          <label className="text-xs text-gray-400 block mb-1">Horizon</label>
          <select
            value={horizon}
            onChange={(e) => onHorizonChange(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm"
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
        <div className="py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <ArchetypeRankingsTable rankings={rankings} />
      )}
    </div>
  );
}
