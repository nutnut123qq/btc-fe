import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BinanceTradeHistoryScreen } from "@/components/BinanceTradeHistoryScreen";

export const metadata: Metadata = { title: "Nhật ký Paper BTC — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Nhật ký Paper BTC">
      <BinanceTradeHistoryScreen />
    </ErrorBoundary>
  );
}
