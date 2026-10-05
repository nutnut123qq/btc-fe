import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NewsScreen } from "@/components/NewsScreen";

export const metadata: Metadata = { title: "Tin tức — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Tin tức">
      <NewsScreen />
    </ErrorBoundary>
  );
}
