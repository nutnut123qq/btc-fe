import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MarketPage } from "@/components/ShellPages";

export const metadata: Metadata = { title: "Thị trường — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Thị trường">
      <MarketPage />
    </ErrorBoundary>
  );
}
