import type { DataAuditResponse, TimeframeAuditSummary, WorkerHealthDto, WorkersHealthDto } from "./types.ts";
import { ACTIVE_TIMEFRAMES, type ActiveTimeframe } from "./timeframe.ts";

export type CoverageAvailability = "available" | "partial" | "unavailable";

export type TechnicalCoverageRow = {
  timeframe: ActiveTimeframe;
  availability: CoverageAvailability;
  source: TimeframeAuditSummary | null;
  reasons: string[];
};

export type TechnicalCoverageSummary = {
  rows: TechnicalCoverageRow[];
  legacyTimeframes: TimeframeAuditSummary[];
  technicalWorkers: WorkerHealthDto[];
};

const TECHNICAL_WORKER_PATTERN = /(kline|index|technical|pattern|window)/i;

export function buildTechnicalCoverageSummary(
  audit: DataAuditResponse | null,
  workers: WorkersHealthDto | null,
): TechnicalCoverageSummary {
  const byTimeframe = new Map((audit?.timeframes ?? []).map((item) => [item.timeframe, item]));
  const rows = ACTIVE_TIMEFRAMES.map((timeframe): TechnicalCoverageRow => {
    const source = byTimeframe.get(timeframe) ?? null;
    if (!source) {
      return { timeframe, availability: "unavailable", source: null, reasons: ["Data Audit không công bố khung thời gian này."] };
    }

    const reasons: string[] = [];
    if (source.gapLedgerStatus !== "Reconciled") reasons.push("Gap ledger đang dùng live fallback.");
    if (source.missingBars > 0) reasons.push(`Thiếu ${source.missingBars.toLocaleString("vi-VN")} nến.`);
    if (source.pendingGapCount > 0) reasons.push(`${source.pendingGapCount.toLocaleString("vi-VN")} gap đang chờ xử lý.`);
    if (source.unavailableGapCount > 0) reasons.push(`${source.unavailableGapCount.toLocaleString("vi-VN")} gap được xác nhận chưa thể lấp.`);
    if (!source.quality) reasons.push("Chưa có quality audit chi tiết.");
    if (source.quality?.isStale) reasons.push("Nến finalized mới nhất đã stale.");
    if ((source.quality?.invalidOhlcvRows ?? 0) > 0) reasons.push(`${source.quality!.invalidOhlcvRows.toLocaleString("vi-VN")} dòng OHLCV không hợp lệ.`);
    if ((source.quality?.invalidDurationRows ?? 0) > 0) reasons.push(`${source.quality!.invalidDurationRows.toLocaleString("vi-VN")} dòng sai thời lượng timeframe.`);
    if ((source.quality?.duplicateOpenTimeRows ?? 0) > 0) reasons.push(`${source.quality!.duplicateOpenTimeRows.toLocaleString("vi-VN")} open-time trùng.`);
    if (!source.derivedTables) reasons.push("Chưa có inventory pipeline chi tiết.");
    else if (source.derivedTables.some((table) => (table.missingRows ?? 0) > 0)) reasons.push("Một hoặc nhiều bảng dẫn xuất còn thiếu hàng.");

    return {
      timeframe,
      availability: reasons.length === 0 ? "available" : "partial",
      source,
      reasons,
    };
  });

  return {
    rows,
    legacyTimeframes: (audit?.timeframes ?? []).filter((item) => !ACTIVE_TIMEFRAMES.includes(item.timeframe as ActiveTimeframe)),
    technicalWorkers: (workers?.workers ?? []).filter((worker) => TECHNICAL_WORKER_PATTERN.test(worker.name)),
  };
}
