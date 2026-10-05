import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BacktestScreen } from "@/components/BacktestScreen";

export const metadata: Metadata = { title: "Backtest — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Backtest">
      <BacktestScreen />
    </ErrorBoundary>
  );
}
