"use client";

import type { ArchetypeRankingDto } from "@/lib/types";

interface ArchetypeRankingsTableProps {
  rankings: ArchetypeRankingDto[];
}

export function ArchetypeRankingsTable({ rankings }: ArchetypeRankingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-[11px] text-slate-400">
            <th className="px-3 py-1.5 text-center font-semibold">Hạng</th>
            <th className="px-3 py-1.5 font-semibold">Mã</th>
            <th className="px-3 py-1.5 text-center font-semibold">WS</th>
            <th className="px-3 py-1.5 text-center font-semibold">TF</th>
            <th className="px-3 py-1.5 text-right font-semibold">Số mẫu</th>
            <th className="px-3 py-1.5 text-right font-semibold">Tỷ lệ thắng</th>
            <th className="px-3 py-1.5 text-center font-semibold">Hướng</th>
            <th className="px-3 py-1.5 text-right font-semibold">Lợi nhuận TB</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rankings.map((r) => (
            <tr
              key={r.archetypeId}
              className="hover:bg-slate-800/30"
            >
              <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-300">#{r.rank}</td>
              <td className="px-3 py-2 font-mono font-medium text-teal-400">{r.archetypeCode}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-300">{r.windowSize}</td>
              <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-300">{r.timeframe}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-300">{r.memberCount}</td>
              <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-200">{(r.winRate * 100).toFixed(1)}%</td>
              <td className="px-3 py-2 text-center">
                {r.dominantDirection === "UP" ? (
                  <span className="text-[11px] font-semibold text-emerald-400">TĂNG</span>
                ) : r.dominantDirection === "DOWN" ? (
                  <span className="text-[11px] font-semibold text-rose-400">GIẢM</span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-300">NGANG</span>
                )}
              </td>
              <td
                className={`px-3 py-2 text-right font-mono font-medium tabular-nums ${
                  r.avgReturnPct > 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {r.avgReturnPct.toFixed(2)}%
              </td>
            </tr>
          ))}
          {rankings.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-sm text-slate-400">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
