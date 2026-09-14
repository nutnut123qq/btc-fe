export type AnalogDirection = -1 | 0 | 1 | null;

export const HISTORICAL_ANALOG_CONTRACT_VERSION = "2026-09-historical-analogs";
export const HISTORICAL_ANALOG_RANKING_METHOD = "shape-similarity-desc-context-audit-only";

export function assertHistoricalAnalogEnvelope(record: Record<string, unknown>): void {
  if (record.contractVersion !== HISTORICAL_ANALOG_CONTRACT_VERSION) {
    throw new Error("historical analogs: unsupported contract version");
  }
  if (record.rankingMethod !== HISTORICAL_ANALOG_RANKING_METHOD) {
    throw new Error("historical analogs: unsupported ranking method");
  }
  if (!Array.isArray(record.summaries)) {
    throw new Error("historical analogs: summaries must be an array");
  }
  if (record.query !== null && (!record.query || typeof record.query !== "object")) {
    throw new Error("historical analogs: query must be an object or null");
  }
}

export function getAnalogDirectionLabel(direction: AnalogDirection): string {
  if (direction === 1) return "TĂNG";
  if (direction === -1) return "GIẢM";
  if (direction === 0) return "TRUNG TÍNH";
  return "CHƯA ĐỦ DỮ LIỆU";
}

export function formatSimilarity(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Không đủ context";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getDirectionTone(direction: AnalogDirection): string {
  if (direction === 1) return "text-emerald-400";
  if (direction === -1) return "text-rose-400";
  if (direction === 0) return "text-amber-300";
  return "text-gray-400";
}
