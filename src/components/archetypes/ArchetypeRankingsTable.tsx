"use client";

import type { ArchetypeRankingDto } from "@/lib/types";

interface ArchetypeRankingsTableProps {
  rankings: ArchetypeRankingDto[];
}

export function ArchetypeRankingsTable({ rankings }: ArchetypeRankingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-400 border-b border-gray-800">
          <tr>
            <th className="text-left py-2 px-2">Hạng</th>
            <th className="text-left py-2 px-2">Mã</th>
            <th className="text-center py-2 px-2">WS</th>
            <th className="text-center py-2 px-2">TF</th>
            <th className="text-right py-2 px-2">Số mẫu</th>
            <th className="text-right py-2 px-2">Tỷ lệ thắng</th>
            <th className="text-center py-2 px-2">Hướng</th>
            <th className="text-right py-2 px-2">Lợi nhuận TB</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => (
            <tr
              key={r.archetypeId}
              className="border-b border-gray-800/50 hover:bg-gray-800/30"
            >
              <td className="py-2 px-2">#{r.rank}</td>
              <td className="py-2 px-2 font-mono text-teal-400">{r.archetypeCode}</td>
              <td className="py-2 px-2 text-center">{r.windowSize}</td>
              <td className="py-2 px-2 text-center">{r.timeframe}</td>
              <td className="py-2 px-2 text-right">{r.memberCount}</td>
              <td className="py-2 px-2 text-right">{(r.winRate * 100).toFixed(1)}%</td>
              <td className="py-2 px-2 text-center">
                {r.dominantDirection === "UP" ? (
                  <span className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded text-xs">
                    TĂNG
                  </span>
                ) : r.dominantDirection === "DOWN" ? (
                  <span className="text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded text-xs">
                    GIẢM
                  </span>
                ) : (
                  <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-xs">
                    NGANG
                  </span>
                )}
              </td>
              <td
                className={`py-2 px-2 text-right ${
                  r.avgReturnPct > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {(r.avgReturnPct * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
          {rankings.length === 0 && (
            <tr>
              <td colSpan={8} className="py-4 text-center text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
