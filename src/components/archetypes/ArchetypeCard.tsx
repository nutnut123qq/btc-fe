"use client";

import type { ArchetypeDto } from "@/lib/types";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

interface ArchetypeCardProps {
  archetype: ArchetypeDto;
  onClick: () => void;
}

export function ArchetypeCard({ archetype: arc, onClick }: ArchetypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-gray-800 bg-gray-950 p-4 text-left transition-colors hover:border-teal-500/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-gray-800 px-2 py-1 font-mono text-sm font-bold text-teal-400">
          {arc.archetypeCode}
        </span>
        <span className="text-xs text-gray-500">{arc.timeframe} · {arc.windowSize} nến</span>
      </div>

      <div className="h-40 rounded-lg bg-gray-900 p-2">
        {arc.representativeOhlc && <ArchetypeGlyph bars={arc.representativeOhlc} />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-800 pt-3 text-xs">
        <div className="rounded bg-gray-900 p-2">
          <div className="text-gray-500">Số mẫu gốc</div>
          <div className="mt-1 font-semibold text-gray-200">{arc.memberCount}</div>
        </div>
        <div className="rounded bg-gray-900 p-2">
          <div className="text-gray-500">Độ phân tán</div>
          <div className="mt-1 font-semibold text-gray-200">{arc.intraClusterDistance.toFixed(3)}</div>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-teal-400">Mở chi tiết mẫu</div>
    </button>
  );
}
