"use client";

import { ChartPanel } from "./ChartPanel";
import { SequenceAnalysisPanel } from "./SequenceAnalysisPanel";

export function MarketScreen() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">BTC/USDT</h2>
        <p className="text-xs text-gray-500">Chart module (M1/M5/M15/M30/D1), indicator pipeline và jump window.</p>
      </div>
      <ChartPanel />
      <SequenceAnalysisPanel />
    </div>
  );
}
