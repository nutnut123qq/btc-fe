"use client";

import { RefreshCw } from "lucide-react";
import type { TransitionMatrixDto, ArchetypeTransitionDto } from "@/lib/types";
import { hasTransitionMatrixData } from "@/lib/researchUi";

interface MarkovMatrixViewProps {
  matrix: TransitionMatrixDto | null;
  selectedArcForTrans: number | null;
  arcTransitions: ArchetypeTransitionDto[];
  arcTransLoading: boolean;
  onSelectArc: (id: number) => void;
}

export function MarkovMatrixView({
  matrix,
  selectedArcForTrans,
  arcTransitions,
  arcTransLoading,
  onSelectArc,
}: MarkovMatrixViewProps) {
  if (!matrix) {
    return <div className="py-12 text-center text-gray-500">Không có dữ liệu</div>;
  }

  if (!hasTransitionMatrixData(matrix)) {
    return <div className="py-12 text-center text-gray-500">Chưa có dữ liệu chuyển đổi cho cấu hình này</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-300">
        Tổng số mẫu: {matrix.totalTransitions} | Số loại: {matrix.archetypeCount}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3 text-teal-400">Heatmap Chuyển đổi (Top)</h3>
          <div className="space-y-2">
            {matrix.cells
              .slice()
              .sort((a, b) => b.probability - a.probability)
              .slice(0, 30)
              .map((cell, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border border-gray-800 cursor-pointer flex items-center justify-between transition-colors ${
                    selectedArcForTrans === cell.fromId
                      ? "bg-gray-800 border-teal-500/50"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                  onClick={() => onSelectArc(cell.fromId)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-teal-300 text-xs">{cell.fromCode}</span>
                    <span className="text-gray-500 text-xs">→</span>
                    <span className="font-mono text-amber-300 text-xs">{cell.toCode}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">{cell.count} lần</div>
                    <div
                      className={`text-sm font-bold ${
                        cell.probability > 0.15
                          ? "text-emerald-400"
                          : cell.probability > 0.05
                          ? "text-teal-400"
                          : "text-gray-400"
                      }`}
                    >
                      {(cell.probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
          {selectedArcForTrans ? (
            arcTransLoading ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold mb-4 text-teal-400 border-b border-gray-800 pb-2">
                  Top chuyển đổi tiếp theo
                </h3>
                <div className="space-y-4">
                  {arcTransitions.map((t, i) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-amber-300">{t.toArchetypeCode}</span>
                        <span>{(t.transitionProbability * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500"
                          style={{ width: `${t.transitionProbability * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>
                          Lợi nhuận:{" "}
                          <span
                            className={
                              t.avgReturnPct > 0 ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {(t.avgReturnPct * 100).toFixed(2)}%
                          </span>
                        </span>
                        <span>TB: {t.avgBarsToTransition.toFixed(1)} nến</span>
                      </div>
                    </div>
                  ))}
                  {arcTransitions.length === 0 && (
                    <div className="text-gray-500 text-sm py-4">Không có dữ liệu chuyển đổi</div>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              Chọn một mẫu ở cột trái để xem chi tiết chuyển đổi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
