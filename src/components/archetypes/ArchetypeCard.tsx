"use client";

import type { ArchetypeDto } from "@/lib/types";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

interface ArchetypeCardProps {
  archetype: ArchetypeDto;
  onClick: () => void;
}

export function ArchetypeCard({ archetype: arc, onClick }: ArchetypeCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-950 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-teal-500/50 transition-colors"
    >
      <div className="flex justify-between items-center mb-3">
        <span className="bg-gray-800 text-teal-400 px-2 py-1 rounded text-xs font-mono">
          {arc.archetypeCode}
        </span>
        <span className="text-xs text-gray-400">{arc.memberCount} mẫu</span>
      </div>
      <div className="h-20 mb-4 bg-gray-900 rounded p-2">
        {arc.representativeOhlc && <ArchetypeGlyph bars={arc.representativeOhlc} />}
      </div>
      {arc.bestOutcome && (
        <div className="space-y-2 text-xs">
          <div>
            <div className="flex justify-between text-emerald-400 mb-1">
              <span>Tăng</span>
              <span>{(arc.bestOutcome.upRate * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${arc.bestOutcome.upRate * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-rose-400 mb-1">
              <span>Giảm</span>
              <span>{(arc.bestOutcome.downRate * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${arc.bestOutcome.downRate * 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-gray-400 mt-3 pt-2 border-t border-gray-800">
            <span>Lợi nhuận TB:</span>
            <span
              className={
                arc.bestOutcome.avgReturnPct > 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }
            >
              {(arc.bestOutcome.avgReturnPct).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
