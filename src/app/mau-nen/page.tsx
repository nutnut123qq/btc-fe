import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArchetypeScreen } from "@/components/ArchetypeScreen";

export const metadata: Metadata = { title: "Mẫu nến — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Mẫu nến">
      {/* ArchetypeScreen uses useSearchParams (?arc=/?from= deep-links); Next requires a Suspense boundary for prerendering. */}
      <Suspense fallback={<div className="px-4 py-4 text-[13px] text-slate-400">Đang tải…</div>}>
        <ArchetypeScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
