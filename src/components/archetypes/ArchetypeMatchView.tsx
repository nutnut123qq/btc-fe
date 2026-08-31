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
        <button
          onClick={onMatch}
          disabled={loading}
          className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Match
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {matchData.map((m, i) => (
            <div
              key={i}
              className="bg-gray-950 border border-gray-800 rounded-xl p-4"
            >
              <div className="text-sm font-medium mb-2 text-gray-300">
                Window {m.windowSize}
              </div>
              {m.archetype ? (
                <>
                  <div className="text-teal-400 font-mono text-lg mb-2">
                    {m.archetype.archetypeCode}
                  </div>
                  <div className="h-16 bg-gray-900 rounded p-1 mb-3">
                    {m.archetype.representativeOhlc && (
                      <ArchetypeGlyph bars={m.archetype.representativeOhlc} />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">Độ tương đồng</div>
                  <div
                    className={`text-sm font-bold mb-3 ${
                      m.similarity > 0.8
                        ? "text-emerald-400"
                        : m.similarity > 0.6
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {(m.similarity * 100).toFixed(1)}%
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">— Không khớp —</div>
              )}
            </div>
          ))}
          {matchData.length === 0 && (
            <div className="md:col-span-2 lg:col-span-4 py-8 text-center text-gray-500">
              Không có kết quả khớp cho cấu hình này
            </div>
          )}
        </div>
      )}
    </div>
  );
}
