import type { Metadata } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiscoveryScreen } from "@/components/DiscoveryScreen";

export const metadata: Metadata = { title: "Rules nến — Bitcoin AI Analyst" };

export default function Page() {
  return (
    <ErrorBoundary fallbackTitle="Lỗi tải trang Rules nến">
      <DiscoveryScreen />
    </ErrorBoundary>
  );
}
