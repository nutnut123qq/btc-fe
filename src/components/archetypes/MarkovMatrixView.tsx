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
    return <div className="py-12 text-center text-slate-400">Không có dữ liệu</div>;
  }

  if (!hasTransitionMatrixData(matrix)) {
    return <div className="py-12 text-center text-slate-400">Chưa có dữ liệu chuyển đổi cho cấu hình này</div>;
  }

  return (
    <div className="space-y-3">
      <div className="font-mono text-xs tabular-nums text-slate-400">
        Tổng số mẫu: {matrix.totalTransitions} · Số loại: {matrix.archetypeCount}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
          <div className="flex h-8 items-center border-b border-slate-800 bg-slate-850/60 px-3">
            <h3 className="text-xs font-semibold text-slate-200">Heatmap chuyển đổi (Top)</h3>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {matrix.cells
              .slice()
              .sort((a, b) => b.probability - a.probability)
              .slice(0, 30)
              .map((cell, i) => (
                <button
                  key={i}
                  type="button"
                  className={`flex w-full items-center justify-between border-b border-slate-800/60 px-3 py-2 text-left transition-colors last:border-b-0 ${
                    selectedArcForTrans === cell.fromId
                      ? "bg-slate-800/60"
                      : "hover:bg-slate-800/30"
                  }`}
                  onClick={() => onSelectArc(cell.fromId)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-teal-300">{cell.fromCode}</span>
                    <span className="text-xs text-slate-500">→</span>
                    <span className="font-mono text-xs text-teal-300">{cell.toCode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-[11px] tabular-nums text-slate-400">{cell.count} lần</div>
                    <div
                      className={`font-mono text-xs font-semibold tabular-nums ${
                        cell.probability > 0.15
                          ? "text-emerald-400"
                          : cell.probability > 0.05
                          ? "text-teal-400"
                          : "text-slate-400"
                      }`}
                    >
                      {(cell.probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
          <div className="flex h-8 items-center border-b border-slate-800 bg-slate-850/60 px-3">
            <h3 className="text-xs font-semibold text-slate-200">Top chuyển đổi tiếp theo</h3>
          </div>
          <div className="p-3">
            {selectedArcForTrans ? (
              arcTransLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {arcTransitions.map((t, i) => (
                    <div key={i} className="text-xs">
                      <div className="mb-1 flex justify-between">
                        <span className="font-mono text-teal-300">{t.toArchetypeCode}</span>
                        <span className="font-mono font-semibold tabular-nums text-slate-200">
                          {(t.transitionProbability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-teal-500"
                          style={{ width: `${t.transitionProbability * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-slate-400">
                        <span>
                          Lợi nhuận:{" "}
                          <span
                            className={
                              t.avgReturnPct > 0 ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {t.avgReturnPct.toFixed(2)}%
                          </span>
                        </span>
                        <span>TB: {t.avgBarsToTransition.toFixed(1)} nến</span>
                      </div>
                    </div>
                  ))}
                  {arcTransitions.length === 0 && (
                    <div className="py-4 text-sm text-slate-400">Không có dữ liệu chuyển đổi</div>
                  )}
                </div>
              )
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
                Chọn một mẫu ở cột trái để xem chi tiết chuyển đổi
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
