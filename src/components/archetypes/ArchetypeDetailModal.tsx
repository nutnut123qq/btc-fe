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
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gray-900/90 backdrop-blur border-b border-gray-800 p-4 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-teal-400 font-mono flex items-center gap-2">
            <Shapes className="w-5 h-5" />
            {detail.archetypeCode}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg text-gray-400"
            aria-label="Đóng"
          >
            <X />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 bg-gray-950 border border-gray-800 rounded-xl p-4">
              <div className="text-sm text-gray-400 mb-2">
                Đại diện ({detail.windowSize} nến)
              </div>
              <div className="h-40 bg-gray-900 rounded-lg p-2">
                {detail.representativeOhlc && (
                  <ArchetypeGlyph bars={detail.representativeOhlc} />
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-gray-500 text-xs">Số mẫu</div>
                  <div className="font-medium">{detail.memberCount}</div>
                </div>
                <div className="bg-gray-900 p-2 rounded">
                  <div className="text-gray-500 text-xs">Độ phân tán</div>
                  <div className="font-medium">
                    {detail.intraClusterDistance.toFixed(3)}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {detail.outcomes.map((out) => (
                <div
                  key={out.horizon}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-4"
                >
                  <div className="text-sm font-medium mb-3 text-center border-b border-gray-800 pb-2">
                    Horizon {out.horizon}
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-emerald-400 mb-1">
                        <span>Tăng</span>
                        <span>{(out.upRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-900 rounded-full">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${out.upRate * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-rose-400 mb-1">
                        <span>Giảm</span>
                        <span>{(out.downRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-900 rounded-full">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${out.downRate * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-amber-400 mb-1">
                        <span>Ngang</span>
                        <span>{(out.sidewaysRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-900 rounded-full">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${out.sidewaysRate * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-center mt-4 text-lg font-bold ${
                      out.avgReturnPct > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {(out.avgReturnPct).toFixed(2)}%
                  </div>
                  <div className="text-center text-gray-500 text-xs">Lợi nhuận TB</div>
                </div>
              ))}
              {detail.outcomes.length === 0 && (
                <div className="sm:col-span-3 py-8 text-center text-sm text-gray-500">
                  Chưa có thống kê kết quả cho mẫu này
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
            <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Các lần xuất hiện gần đây
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="text-left py-2 px-2">Thời gian kết thúc</th>
                    <th className="text-center py-2 px-2">Khoảng cách</th>
                    <th className="text-center py-2 px-2">Kết quả</th>
                    <th className="text-right py-2 px-2">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {occurrences.map((occ, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 px-2 text-gray-300">
                        {formatTime(occ.windowEndMs)}
                      </td>
                      <td className="py-2 px-2 text-center text-gray-400">
                        {occ.distanceToCentroid.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {occ.label === 1 ? (
                          <span className="text-emerald-400">TĂNG</span>
                        ) : occ.label === -1 ? (
                          <span className="text-rose-400">GIẢM</span>
                        ) : (
                          <span className="text-amber-400">NGANG</span>
                        )}
                      </td>
                      <td
                        className={`py-2 px-2 text-right ${
                          occ.targetReturn && occ.targetReturn > 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {occ.targetReturn
                          ? (occ.targetReturn).toFixed(2) + "%"
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {occurrences.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
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
