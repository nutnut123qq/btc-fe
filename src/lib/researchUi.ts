import type {
  AiCapabilitiesDto,
  CapabilityState,
  EnsemblePredictionDto,
  EvidenceFreshnessDto,
  TransitionMatrixDto,
  TransitionPredictionDto,
} from "./types";

export const AI_ANALYSIS_SYMBOL = "BTCUSDT";
export const PAPER_JOURNAL_LABEL = "Nhật ký Paper BTC";
export const SIMULATION_LABEL = "SIMULATION";

export const CAPABILITY_LABELS: Record<CapabilityState, string> = {
  descriptive: "Descriptive",
  experimental: "Experimental",
  validated: "Validated",
  "forward-observed": "Forward-observed",
  retired: "Retired",
};

export function normalizeCapabilityState(
  value: string | null | undefined,
  fallback: CapabilityState = "experimental",
): CapabilityState {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "descriptive" || normalized === "experimental" || normalized === "validated"
    || normalized === "forward-observed" || normalized === "retired") {
    return normalized;
  }
  return fallback;
}

export function isEnsembleUnavailable(
  record: Pick<EnsemblePredictionDto, "availability" | "finalDirection" | "validityStatus"> | null,
): boolean {
  if (!record) return true;
  return record.availability === "Unavailable"
    || record.finalDirection === "Unavailable"
    || record.validityStatus === "Invalid";
}

const TIMEFRAME_MS: Record<string, number> = {
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
};

export function resolveEvidenceFreshness(
  freshness: EvidenceFreshnessDto | null | undefined,
  fallbackAsOfTimeMs: number | null | undefined,
  timeframe: string,
  nowMs = Date.now(),
): EvidenceFreshnessDto {
  if (freshness) return freshness;
  if (!fallbackAsOfTimeMs || !Number.isFinite(fallbackAsOfTimeMs)) {
    return { status: "missing", reason: "API không cung cấp thời điểm dữ liệu." };
  }
  const ageMs = Math.max(0, nowMs - fallbackAsOfTimeMs);
  const intervalMs = TIMEFRAME_MS[timeframe] ?? TIMEFRAME_MS["4h"];
  return {
    status: ageMs > intervalMs * 2 ? "stale" : "fresh",
    asOfTimeMs: fallbackAsOfTimeMs,
    ageSeconds: ageMs / 1000,
    reason: "Suy ra từ thời điểm nến đóng gần nhất vì API cũ chưa có freshness metadata.",
  };
}

export function formatCoverage(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const fraction = value > 1 ? value / 100 : value;
  return `${(fraction * 100).toFixed(1)}%`;
}

export function formatLift(
  value: number | null | undefined,
  unit: "fraction" | "percentage-points" | null | undefined,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const percentagePoints = unit === "fraction" ? value * 100 : value;
  return `${percentagePoints > 0 ? "+" : ""}${percentagePoints.toFixed(1)} pp`;
}

export type LlmUiState = "unknown" | "on" | "off";

export function getLlmUiState(capabilities: AiCapabilitiesDto | null): LlmUiState {
  if (!capabilities) return "unknown";
  return capabilities.llmExplanation ? "on" : "off";
}

export function canUseAiExplanation(capabilities: AiCapabilitiesDto | null): boolean {
  return capabilities !== null
    && (capabilities.llmExplanation || capabilities.fallbackExplanation);
}

export function hasTransitionMatrixData(matrix: TransitionMatrixDto | null): boolean {
  return Boolean(matrix?.cells.length);
}

export function getPredictionUnavailableMessage(
  prediction: Pick<TransitionPredictionDto, "validated" | "reason"> | null,
  fallback = "Chưa có dự báo đã được xác thực",
): string {
  if (prediction?.validated) return "";
  return prediction?.reason || fallback;
}

export function getPaperModelLabel(modelVersion: string | null | undefined): string {
  return modelVersion?.trim() ? modelVersion.replace(".joblib", "") : "Chưa gắn model";
}

export function getSimulatedPnlStatus(pnlUsdt: number): string {
  return pnlUsdt >= 0
    ? "Lãi mô phỏng đã ghi nhận"
    : "Lỗ mô phỏng đã ghi nhận";
}
