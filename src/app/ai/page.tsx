import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AiAnalysisPage } from "@/components/ShellPages";

export const metadata: Metadata = { title: "AI — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang AI">
      <AiAnalysisPage />
    </ErrorBoundary>
  );
}
