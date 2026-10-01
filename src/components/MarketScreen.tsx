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
        className="flex flex-col gap-3 rounded-xl border border-cyan-900/70 bg-cyan-950/20 p-3 sm:flex-row sm:items-center sm:justify-between"
        aria-labelledby="canonical-technical-title"
      >
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
          <div>
            <h2 id="canonical-technical-title" className="text-sm font-bold text-cyan-100">
              Technical Replay là bề mặt kỹ thuật chuẩn
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-cyan-200/80">
              Chỉ hiển thị BTCUSDT 1h/4h/1d từ nến đã đóng, cùng một nguồn và cùng mốc as-of.
              Các widget snapshot legacy chưa được kiểm chứng point-in-time đã bị cách ly khỏi điều hướng chính.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenEvidence}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-700 bg-cyan-950/60 px-3 py-2 text-xs font-bold text-cyan-100 transition-colors hover:bg-cyan-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
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
