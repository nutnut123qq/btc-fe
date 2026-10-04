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
    <div className="space-y-3">
      <section
        className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded border border-slate-800 bg-slate-900 px-3 py-2"
        aria-labelledby="canonical-technical-title"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
        <h2 id="canonical-technical-title" className="shrink-0 text-[13px] font-semibold text-slate-200">
          Technical Replay là bề mặt kỹ thuật chuẩn
        </h2>
        <p className="hidden min-w-0 flex-1 truncate text-xs text-slate-400 lg:block">
          BTCUSDT 1h/4h/1d từ nến đã đóng, cùng nguồn, cùng mốc as-of · snapshot legacy chưa kiểm chứng point-in-time đã bị cách ly
        </p>
        <button
          type="button"
          onClick={onOpenEvidence}
          className="ml-auto inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded border border-teal-500/40 bg-teal-500/10 px-2.5 text-xs font-medium text-teal-300 transition-colors hover:bg-teal-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 lg:ml-0"
        >
          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
          Mở Evidence Center
        </button>
      </section>

      <ErrorBoundary fallbackTitle="Lỗi tải Technical Replay">
        <BinanceTradingScreen />
      </ErrorBoundary>
    </div>
  );
}
