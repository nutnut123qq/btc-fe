"use client";

import { FileCheck2, ShieldCheck } from "lucide-react";
import { BinanceTradingScreen } from "./BinanceTradingScreen";
import { ErrorBoundary } from "./ErrorBoundary";

type Props = {
  onOpenEvidence: () => void;
};

/** Canonical technical surface. Legacy snapshot widgets are intentionally not mounted here. */
export function MarketScreen({ onOpenEvidence }: Props) {
  return (
    <div className="space-y-4">
      <section
        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5"
        aria-labelledby="canonical-technical-title"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
        <h2 id="canonical-technical-title" className="shrink-0 text-sm font-semibold text-slate-200">
          Technical Replay là bề mặt kỹ thuật chuẩn
        </h2>
        <p className="hidden min-w-0 flex-1 truncate text-xs text-slate-400 lg:block">
          BTCUSDT 1h/4h/1d từ nến đã đóng, cùng nguồn, cùng mốc as-of · snapshot legacy chưa kiểm chứng point-in-time đã bị cách ly
        </p>
        <button
          type="button"
          onClick={onOpenEvidence}
          className="ml-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-teal-950/60 px-3 py-1.5 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 lg:ml-0"
        >
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
          Mở Evidence Center
        </button>
      </section>

      <ErrorBoundary fallbackTitle="Lỗi tải Technical Replay">
        <BinanceTradingScreen />
      </ErrorBoundary>
    </div>
  );
}
