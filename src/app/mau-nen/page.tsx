import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArchetypeScreen } from "@/components/ArchetypeScreen";

export const metadata: Metadata = { title: "Mẫu nến — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Mẫu nến">
      <ArchetypeScreen />
    </ErrorBoundary>
  );
}
