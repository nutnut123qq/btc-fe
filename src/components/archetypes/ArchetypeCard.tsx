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
      className="w-full rounded border border-slate-800 bg-slate-950 p-3 text-left transition-colors hover:border-teal-500/50"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-sm border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-xs font-bold text-teal-400">
          {arc.archetypeCode}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-slate-400">{arc.timeframe} · {arc.windowSize} nến</span>
      </div>

      <div className="h-32 rounded-sm border border-slate-800/60 bg-slate-900 p-1.5">
        {arc.representativeOhlc && <ArchetypeGlyph bars={arc.representativeOhlc} />}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-slate-800 bg-slate-800/40 text-center text-xs">
        <div className="bg-slate-950 px-2 py-1.5">
          <div className="text-[11px] text-slate-400">Số mẫu gốc</div>
          <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-200">{arc.memberCount}</div>
        </div>
        <div className="bg-slate-950 px-2 py-1.5">
          <div className="text-[11px] text-slate-400">Độ phân tán</div>
          <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-200">{arc.intraClusterDistance.toFixed(3)}</div>
        </div>
      </div>
      <div className="mt-2 text-xs font-medium text-teal-400">Mở chi tiết mẫu</div>
    </button>
  );
}
