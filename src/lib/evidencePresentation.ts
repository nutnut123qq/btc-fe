import type { AlertItem, SequenceRule } from "./types";

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatEvidenceRate(value: number | null | undefined): string {
  return finite(value) ? `${(value * 100).toFixed(1)}%` : "Chưa có bằng chứng";
}

export function formatWilson95(rule: Pick<SequenceRule, "oosWinRateCi95Low" | "oosWinRateCi95High">): string {
  if (!finite(rule.oosWinRateCi95Low) || !finite(rule.oosWinRateCi95High)) return "Chưa có CI";
  return `${(rule.oosWinRateCi95Low * 100).toFixed(1)}–${(rule.oosWinRateCi95High * 100).toFixed(1)}%`;
}

export function ruleEvidenceView(rule: SequenceRule) {
  const hasOos = finite(rule.oosSampleCount) && rule.oosSampleCount > 0
    && finite(rule.oosWinRate) && finite(rule.baselineWinRate) && finite(rule.oosLift);
  return {
    hasOos,
    capability: rule.capabilityState || "descriptive",
    enabled: rule.isEnabled === true,
    oosWinRate: formatEvidenceRate(rule.oosWinRate),
    baselineWinRate: formatEvidenceRate(rule.baselineWinRate),
    lift: finite(rule.oosLift) ? `${rule.oosLift >= 0 ? "+" : ""}${(rule.oosLift * 100).toFixed(1)} điểm %` : "Chưa có bằng chứng",
    ci95: formatWilson95(rule),
    netAverage: finite(rule.oosNetAvgReturnPct) ? `${rule.oosNetAvgReturnPct.toFixed(2)}%` : "Chưa có bằng chứng",
  };
}

export function alertEvidenceView(alert: AlertItem) {
  const predictive = alert.evidenceKind === "validated-predictive";
  const kindLabel = predictive
    ? "Predictive đã qua gate được khai báo"
    : alert.evidenceKind === "observed-event"
      ? "Sự kiện quan sát được"
      : "Chưa có phân loại evidence";
  const deliveryLabel = alert.deliveryStatus === "delivered"
    ? "Đã gửi kênh ngoài"
    : alert.deliveryStatus === "failed-at-most-once"
      ? "Gửi ngoài thất bại · không tự retry"
      : alert.deliveryStatus === "not-configured"
        ? "Chỉ lưu trong ứng dụng"
        : alert.deliveryStatus === "historical-db-only"
          ? "Bản ghi lịch sử trong ứng dụng"
          : alert.deliveryStatus
            ? `Delivery: ${alert.deliveryStatus}`
            : "Chưa có trạng thái delivery";
  return { predictive, kindLabel, deliveryLabel };
}

export function formatEvidenceTime(timeMs: number | null | undefined): string {
  return finite(timeMs) && timeMs > 0 ? new Date(timeMs).toLocaleString() : "Chưa có available time";
}
