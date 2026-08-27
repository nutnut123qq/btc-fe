"use client";

import { RefreshCw } from "lucide-react";
import type { ArchetypeDto } from "@/lib/types";
import { ArchetypeCard } from "./ArchetypeCard";

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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Timeframe</label>
          <div className="flex gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
            {["1h", "4h", "1d"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-xs rounded-md ${
                  timeframe === tf ? "bg-teal-600 text-white" : "text-gray-400"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Window Size</label>
          <div className="flex gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
            {windowSizes.map((ws) => (
              <button
                key={ws}
                onClick={() => onWindowSizeChange(ws)}
                className={`px-3 py-1 text-xs rounded-md ${
                  windowSize === ws ? "bg-teal-600 text-white" : "text-gray-400"
                }`}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Sắp xếp</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="winRate">Tỷ lệ thắng</option>
            <option value="samples">Số mẫu</option>
            <option value="recent">Gần đây</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archetypes.map((arc) => (
            <ArchetypeCard
              key={arc.id}
              archetype={arc}
              onClick={() => onSelectArchetype(arc.id)}
            />
          ))}
          {archetypes.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500">
              Không tìm thấy mẫu nến
            </div>
          )}
        </div>
      )}
    </div>
  );
}
