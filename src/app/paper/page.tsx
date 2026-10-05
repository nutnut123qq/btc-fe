import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PaperTradeScreen } from "@/components/PaperTradeScreen";

export const metadata: Metadata = { title: "Paper — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Paper Trading">
      <PaperTradeScreen />
    </ErrorBoundary>
  );
}
