import type {
  AiCapabilitiesDto,
  TransitionMatrixDto,
  TransitionPredictionDto,
} from "./types";

export const AI_ANALYSIS_SYMBOL = "BTCUSDT";
export const PAPER_JOURNAL_LABEL = "Nhật ký Paper đa tài sản";
export const SIMULATION_LABEL = "SIMULATION";

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
