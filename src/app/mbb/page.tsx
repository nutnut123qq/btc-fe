import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MbbPage } from "@/components/ShellPages";

export const metadata: Metadata = { title: "MBB — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang MBB">
      <MbbPage />
    </ErrorBoundary>
  );
}
