import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResearchEvidenceScreen } from "@/components/ResearchEvidenceScreen";

export const metadata: Metadata = { title: "Nghiên cứu — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Nghiên cứu">
      <ResearchEvidenceScreen />
    </ErrorBoundary>
  );
}
