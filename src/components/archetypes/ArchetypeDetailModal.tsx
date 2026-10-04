"use client";

import { Shapes, Clock, X } from "lucide-react";
import type { ArchetypeDetailDto, ArchetypeOccurrenceDto } from "@/lib/types";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

interface ArchetypeDetailModalProps {
  detail: ArchetypeDetailDto | null;
  occurrences: ArchetypeOccurrenceDto[];
  onClose: () => void;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

export function ArchetypeDetailModal({
  detail,
  occurrences,
  onClose,
}: ArchetypeDetailModalProps) {
  if (!detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-3 py-2.5 backdrop-blur">
          <h3 className="flex items-center gap-2 font-mono text-sm font-bold text-teal-400">
            <Shapes className="h-4 w-4" />
            {detail.archetypeCode}
          </h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-sm text-slate-400 hover:bg-slate-800"
            aria-label="Đóng"
          >
            <X />
          </button>
        </div>

        <div className="space-y-3 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="col-span-1 rounded border border-slate-800 bg-slate-950 p-3">
              <div className="mb-2 text-xs text-slate-400">
                Đại diện (<span className="font-mono tabular-nums">{detail.windowSize}</span> nến)
              </div>
              <div className="h-40 rounded-sm border border-slate-800/60 bg-slate-900 p-1.5">
                {detail.representativeOhlc && (
                  <ArchetypeGlyph bars={detail.representativeOhlc} />
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-slate-800 bg-slate-800/40 text-center text-sm">
                <div className="bg-slate-950 px-2 py-1.5">
                  <div className="text-[11px] text-slate-400">Số mẫu</div>
                  <div className="font-mono font-medium tabular-nums">{detail.memberCount}</div>
                </div>
                <div className="bg-slate-950 px-2 py-1.5">
                  <div className="text-[11px] text-slate-400">Độ phân tán</div>
                  <div className="font-mono font-medium tabular-nums">
                    {detail.intraClusterDistance.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 rounded border border-slate-800 bg-slate-950 p-3">
              <h4 className="text-[13px] font-semibold text-slate-200">Cách kiểm chứng hiện tại</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Kết quả được tính trực tiếp từ giá đóng cửa cây cuối mẫu đến giá đóng cửa sau 1, 3 và 6 nến.
                Các thống kê Triple Barrier cũ không được dùng trong phần kiểm chứng này.
              </p>
              <p className="mt-3 text-xs text-slate-400">
                ĐÚNG HƯỚNG nghĩa là hướng thực tế trùng hướng chủ đạo lịch sử của nhóm tại cùng mốc; đây không phải lợi nhuận của một giao dịch.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
            <h4 className="flex h-8 items-center gap-1.5 border-b border-slate-800 bg-slate-850/60 px-3 text-xs font-semibold text-slate-200">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Các lần xuất hiện gần đây
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="px-3 py-1.5 font-semibold">Thời gian kết thúc</th>
                    <th className="px-3 py-1.5 text-center font-semibold">Khoảng cách</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Sau 1 nến</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Sau 3 nến</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Sau 6 nến</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {occurrences.map((occ, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-300">
                        {formatTime(occ.windowEndMs)}
                      </td>
                      <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-400">
                        {occ.distanceToCentroid.toFixed(3)}
                      </td>
                      {[1, 3, 6].map((barsAhead) => {
                        const result = (occ.fixedHorizonOutcomes ?? []).find((item) => item.barsAhead === barsAhead);
                        return (
                          <td key={barsAhead} className={`px-3 py-2 text-right font-mono tabular-nums ${(result?.returnPct ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {result?.available && result.returnPct != null ? `${result.returnPct.toFixed(2)}%` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {occurrences.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                        Chưa có lần xuất hiện gần đây
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
