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
        className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="canonical-technical-title"
      >
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
          <div>
            <h2 id="canonical-technical-title" className="text-sm font-semibold text-slate-200">
              Technical Replay là bề mặt kỹ thuật chuẩn
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
              Chỉ hiển thị BTCUSDT 1h/4h/1d từ nến đã đóng, cùng một nguồn và cùng mốc as-of.
              Các widget snapshot legacy chưa được kiểm chứng point-in-time đã bị cách ly khỏi điều hướng chính.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenEvidence}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-teal-950/60 px-3 py-2 text-xs font-semibold text-teal-200 transition-colors hover:bg-teal-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
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
