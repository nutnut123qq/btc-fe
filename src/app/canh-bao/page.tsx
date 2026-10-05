import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertSettingsPage } from "@/components/ShellPages";

export const metadata: Metadata = { title: "Cảnh báo — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Cảnh báo">
      <AlertSettingsPage />
    </ErrorBoundary>
  );
}
