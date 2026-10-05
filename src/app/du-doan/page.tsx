import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PredictionScreen } from "@/components/PredictionScreen";

export const metadata: Metadata = { title: "Dự đoán — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Dự đoán">
      <PredictionScreen />
    </ErrorBoundary>
  );
}
