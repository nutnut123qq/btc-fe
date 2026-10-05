import type { Metadata } from "next";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResearchEvidenceScreen } from "@/components/ResearchEvidenceScreen";

export const metadata: Metadata = { title: "Nghiên cứu — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Nghiên cứu">
      {/* ResearchEvidenceScreen uses useSearchParams (?dossier= deep-link); Next requires a Suspense boundary for prerendering. */}
      <Suspense fallback={<div className="px-4 py-4 text-[13px] text-slate-400">Đang tải…</div>}>
        <ResearchEvidenceScreen />
      </Suspense>
    </ErrorBoundary>
  );
}
