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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* Next Prediction */}
      <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
        <h3 className="flex h-8 items-center gap-1.5 border-b border-slate-800 bg-slate-850/60 px-3 text-xs font-semibold text-slate-200">
          <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
          Dự đoán tiếp theo
        </h3>
        <div className="p-3">
          {nextPred?.validated ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 rounded-sm border border-slate-800 bg-slate-900 px-3 py-2">
                <div>
                  <div className="mb-0.5 text-[11px] text-slate-400">Mẫu hiện tại</div>
                  <div className="font-mono text-sm font-semibold text-teal-300">
                    {nextPred.currentArchetypeCode || "N/A"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-0.5 text-[11px] text-slate-400">Độ đo entropy (bits)</div>
                  <div className="font-mono font-semibold tabular-nums text-slate-300">
                    {nextPred.entropyBits?.toFixed(2) || "0.00"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-0.5 text-[11px] text-slate-400">Tính dự báo</div>
                  <div
                    className={`font-semibold ${
                      nextPred.predictability === "High"
                        ? "text-emerald-400"
                        : nextPred.predictability === "Medium"
                        ? "text-slate-400"
                        : "text-rose-400"
                    }`}
                  >
                    {nextPred.predictability || "Low"}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {nextPred.topTransitions?.map((t, i) => (
                  <div key={i} className="text-xs">
                    <div className="mb-1 flex justify-between">
                      <span className="font-mono text-teal-300">{t.toArchetypeCode}</span>
                      <span className="font-mono font-semibold tabular-nums text-teal-400">
                        {(t.transitionProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-teal-500"
                        style={{ width: `${t.transitionProbability * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!nextPred.topTransitions || nextPred.topTransitions.length === 0) && (
                  <div className="py-4 text-center text-sm text-slate-400">
                    Không có dự báo tiếp theo
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              <span className="mb-1 block text-[11px] font-semibold text-amber-400">EXPERIMENTAL</span>
              {getPredictionUnavailableMessage(nextPred)}
            </div>
          )}
        </div>
      </div>

      {/* Sequence Prediction */}
      <div className="overflow-hidden rounded border border-slate-800 bg-slate-950">
        <h3 className="flex h-8 items-center gap-1.5 border-b border-slate-800 bg-slate-850/60 px-3 text-xs font-semibold text-slate-200">
          <BarChart2 className="h-3.5 w-3.5 text-teal-400" />
          Dự đoán chuỗi
        </h3>
        <div className="p-3">
          {seqPred?.validated ? (
            <>
              <div className="mb-3 flex items-center gap-3 rounded-sm border border-slate-800 bg-slate-900 px-3 py-2">
                <span className="font-mono text-slate-400">
                  {seqPred.previousArchetypeCode || "?"}
                </span>
                <span className="text-slate-500">→</span>
                <span className="font-mono text-teal-300">
                  {seqPred.currentArchetypeCode || "?"}
                </span>
                <span className="text-slate-500">→</span>
                <span className="font-mono text-slate-600">?</span>
              </div>
              <div className="space-y-3">
                {seqPred.topSequences?.map((seq, i) => (
                  <div
                    key={i}
                    className="rounded-sm border border-slate-800 bg-slate-900 px-3 py-2"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono font-semibold text-teal-300">
                        {seq.thirdArchetypeCode}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-slate-400">
                        {seq.occurrenceCount} lần
                      </span>
                    </div>
                    <div className="mb-2 grid grid-cols-3 gap-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-emerald-500/20">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${seq.outcomeUpRate * 100}%` }}
                        />
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-rose-500/20">
                        <div
                          className="h-full bg-rose-500"
                          style={{ width: `${seq.outcomeDownRate * 100}%` }}
                        />
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-500/20">
                        <div
                          className="h-full bg-slate-500"
                          style={{ width: `${seq.outcomeSidewaysRate * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] tabular-nums">
                      <span className="text-emerald-400">
                        {(seq.outcomeUpRate * 100).toFixed(0)}% Tăng
                      </span>
                      <span
                        className={
                          seq.avgReturnPct > 0
                            ? "font-medium text-emerald-400"
                            : "font-medium text-rose-400"
                        }
                      >
                        {(seq.avgReturnPct * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
                {(!seqPred.topSequences || seqPred.topSequences.length === 0) && (
                  <div className="py-4 text-center text-sm text-slate-400">
                    Không có dự báo chuỗi
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-400">
              <span className="mb-1 block text-[11px] font-semibold text-amber-400">EXPERIMENTAL</span>
              {getPredictionUnavailableMessage(seqPred, "Chưa có dự báo chuỗi đã được xác thực")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
