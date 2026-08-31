"use client";

import { TrendingUp, BarChart2 } from "lucide-react";
import type { TransitionPredictionDto, SequencePredictionDto } from "@/lib/types";
import { getPredictionUnavailableMessage } from "@/lib/researchUi";

interface ArchetypePredictViewProps {
  nextPred: TransitionPredictionDto | null;
  seqPred: SequencePredictionDto | null;
}

export function ArchetypePredictView({ nextPred, seqPred }: ArchetypePredictViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Next Prediction */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
        <h3 className="text-md font-semibold text-teal-400 mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Dự đoán tiếp theo
        </h3>
        {nextPred?.validated ? (
          <>
            <div className="flex items-center justify-between mb-4 bg-gray-900 p-3 rounded-lg border border-gray-800">
              <div>
                <div className="text-xs text-gray-500 mb-1">Mẫu hiện tại</div>
                <div className="font-mono text-lg text-teal-300">
                  {nextPred.currentArchetypeCode || "N/A"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Độ đo entropy (bits)</div>
                <div className="font-bold text-gray-300">
                  {nextPred.entropyBits?.toFixed(2) || "0.00"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Tính dự báo</div>
                <div
                  className={`font-bold ${
                    nextPred.predictability === "High"
                      ? "text-emerald-400"
                      : nextPred.predictability === "Medium"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {nextPred.predictability || "Low"}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {nextPred.topTransitions?.map((t, i) => (
                <div key={i} className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono text-amber-300">{t.toArchetypeCode}</span>
                    <span className="font-bold text-teal-400">
                      {(t.transitionProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500"
                      style={{ width: `${t.transitionProbability * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!nextPred.topTransitions || nextPred.topTransitions.length === 0) && (
                <div className="text-gray-500 text-sm text-center py-4">
                  Không có dự báo tiếp theo
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm py-8 text-center">
            <span className="mb-1 block text-amber-400">EXPERIMENTAL</span>
            {getPredictionUnavailableMessage(nextPred)}
          </div>
        )}
      </div>

      {/* Sequence Prediction */}
      <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
        <h3 className="text-md font-semibold text-teal-400 mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
          <BarChart2 className="w-4 h-4" />
          Dự đoán chuỗi
        </h3>
        {seqPred?.validated ? (
          <>
            <div className="mb-4 bg-gray-900 p-3 rounded-lg border border-gray-800 flex items-center gap-3">
              <span className="font-mono text-gray-400">
                {seqPred.previousArchetypeCode || "?"}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-teal-300">
                {seqPred.currentArchetypeCode || "?"}
              </span>
              <span className="text-gray-600">→</span>
              <span className="font-mono text-amber-400">?</span>
            </div>
            <div className="space-y-4">
              {seqPred.topSequences?.map((seq, i) => (
                <div
                  key={i}
                  className="bg-gray-900 p-3 rounded-lg border border-gray-800"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-amber-300 font-bold">
                      {seq.thirdArchetypeCode}
                    </span>
                    <span className="text-xs text-gray-500">
                      {seq.occurrenceCount} lần
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${seq.outcomeUpRate * 100}%` }}
                      />
                    </div>
                    <div className="h-1.5 bg-rose-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${seq.outcomeDownRate * 100}%` }}
                      />
                    </div>
                    <div className="h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${seq.outcomeSidewaysRate * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">
                      {(seq.outcomeUpRate * 100).toFixed(0)}% Tăng
                    </span>
                    <span
                      className={
                        seq.avgReturnPct > 0
                          ? "text-emerald-400 font-medium"
                          : "text-rose-400 font-medium"
                      }
                    >
                      {(seq.avgReturnPct * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
              {(!seqPred.topSequences || seqPred.topSequences.length === 0) && (
                <div className="text-gray-500 text-sm text-center py-4">
                  Không có dự báo chuỗi
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm py-8 text-center">
            <span className="mb-1 block text-amber-400">EXPERIMENTAL</span>
            {getPredictionUnavailableMessage(seqPred, "Chưa có dự báo chuỗi đã được xác thực")}
          </div>
        )}
      </div>
    </div>
  );
}
