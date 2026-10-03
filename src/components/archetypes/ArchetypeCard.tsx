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
      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-5 text-left transition-colors hover:border-teal-500/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded bg-slate-800 px-2 py-1 font-mono text-sm font-bold text-teal-400">
          {arc.archetypeCode}
        </span>
        <span className="text-xs text-slate-400">{arc.timeframe} · {arc.windowSize} nến</span>
      </div>

      <div className="h-40 rounded-lg bg-slate-900 p-2">
        {arc.representativeOhlc && <ArchetypeGlyph bars={arc.representativeOhlc} />}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 pt-3 text-xs">
        <div className="rounded bg-slate-900 p-2">
          <div className="text-slate-400">Số mẫu gốc</div>
          <div className="mt-1 font-semibold text-slate-200">{arc.memberCount}</div>
        </div>
        <div className="rounded bg-slate-900 p-2">
          <div className="text-slate-400">Độ phân tán</div>
          <div className="mt-1 font-semibold text-slate-200">{arc.intraClusterDistance.toFixed(3)}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-teal-400">Mở chi tiết mẫu</div>
    </button>
  );
}
