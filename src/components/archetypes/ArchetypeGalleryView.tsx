"use client";

import { RefreshCw } from "lucide-react";
import type { ArchetypeDto } from "@/lib/types";
import { ArchetypeCard } from "./ArchetypeCard";
import { ArchetypeEvidencePanel } from "./ArchetypeEvidencePanel";
import { ACTIVE_TIMEFRAMES } from "@/lib/timeframe";

interface ArchetypeGalleryViewProps {
  timeframe: string;
  windowSize: number;
  sortBy: string;
  windowSizes: number[];
  archetypes: ArchetypeDto[];
  loading: boolean;
  onTimeframeChange: (tf: string) => void;
  onWindowSizeChange: (ws: number) => void;
  onSortByChange: (sort: string) => void;
  onSelectArchetype: (id: number) => void;
}

export function ArchetypeGalleryView({
  timeframe,
  windowSize,
  sortBy,
  windowSizes,
  archetypes,
  loading,
  onTimeframeChange,
  onWindowSizeChange,
  onSortByChange,
  onSelectArchetype,
}: ArchetypeGalleryViewProps) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900">
      <div className="flex h-9 items-center justify-between gap-2 border-b border-slate-800 bg-slate-850/60 px-3">
        <span className="truncate text-[13px] font-semibold text-slate-200">Thư viện mẫu nến (audit)</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">{archetypes.length} mẫu</span>
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-slate-800 px-3 py-2.5">
        <div>
          <label className="block text-[11px] text-slate-400">Timeframe</label>
          <div className="mt-1 flex gap-px overflow-hidden rounded-sm border border-slate-800 bg-slate-950">
            {ACTIVE_TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`h-8 px-3 font-mono text-xs tabular-nums ${
                  timeframe === tf ? "bg-teal-600 font-semibold text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400">Window Size</label>
          <div className="mt-1 flex gap-px overflow-hidden rounded-sm border border-slate-800 bg-slate-950">
            {windowSizes.map((ws) => (
              <button
                key={ws}
                onClick={() => onWindowSizeChange(ws)}
                className={`h-8 px-3 font-mono text-xs tabular-nums ${
                  windowSize === ws ? "bg-teal-600 font-semibold text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400">Sắp xếp</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="mt-1 h-8 rounded-sm border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none"
          >
            <option value="memberCount">Số mẫu</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="space-y-3 p-3">
          {archetypes.map((arc) => (
            <div key={arc.id} className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <ArchetypeCard
                archetype={arc}
                onClick={() => onSelectArchetype(arc.id)}
              />
              <ArchetypeEvidencePanel
                key={`${arc.id}-${arc.bestOutcome?.horizon ?? "4h"}`}
                archetype={arc}
              />
            </div>
          ))}
          {archetypes.length === 0 && (
            <div className="py-8 text-center text-slate-400">
              Không tìm thấy mẫu nến
            </div>
          )}
        </div>
      )}
    </div>
  );
}
