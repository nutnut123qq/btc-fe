import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BacktestScreen } from "@/components/BacktestScreen";

export const metadata: Metadata = { title: "Backtest — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Backtest">
      {/* BacktestScreen uses useSearchParams (?run= deep-link); Next requires a Suspense boundary for prerendering. */}
      <Suspense fallback={<div className="px-4 py-4 text-[13px] text-slate-400">Đang tải…</div>}>
        <BacktestScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
