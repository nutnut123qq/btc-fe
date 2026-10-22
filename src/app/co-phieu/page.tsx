import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EquityPage } from "@/components/ShellPages";

export const metadata: Metadata = { title: "Cổ phiếu — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang cổ phiếu">
      {/* EquityPage uses useSearchParams (?symbol= is the source of truth); Next requires a Suspense boundary for prerendering. */}
      <Suspense fallback={<div className="px-4 py-4 text-[13px] text-slate-400">Đang tải…</div>}>
        <EquityPage />
      </Suspense>
    </ErrorBoundary>
  );
}
