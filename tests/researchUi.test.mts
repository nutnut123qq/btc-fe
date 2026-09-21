import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_ANALYSIS_SYMBOL,
  canUseAiExplanation,
  getLlmUiState,
  formatCoverage,
  formatLift,
  isEnsembleUnavailable,
  normalizeCapabilityState,
  resolveEvidenceFreshness,
  getPaperModelLabel,
  getPredictionUnavailableMessage,
  getSimulatedPnlStatus,
  hasTransitionMatrixData,
  PAPER_JOURNAL_LABEL,
  SIMULATION_LABEL,
} from "../src/lib/researchUi.ts";

test("capability and evidence helpers preserve evidence semantics", () => {
  assert.equal(normalizeCapabilityState("Forward-Observed"), "forward-observed");
  assert.equal(normalizeCapabilityState("unknown", "descriptive"), "descriptive");
  assert.equal(formatCoverage(0.625), "62.5%");
  assert.equal(formatCoverage(62.5), "62.5%");
  assert.equal(formatLift(0.031, "fraction"), "+3.1 pp");
  assert.equal(formatLift(-2.25, "percentage-points"), "-2.3 pp");

  assert.equal(isEnsembleUnavailable(null), true);
  assert.equal(isEnsembleUnavailable({
    availability: "Unavailable",
    finalDirection: "Unavailable",
    validityStatus: "Invalid",
  }), true);
  assert.equal(isEnsembleUnavailable({
    availability: "Available",
    finalDirection: "Bullish",
    validityStatus: "Valid",
  }), false);
});

test("freshness prefers API metadata and otherwise applies timeframe-aware fallback", () => {
  const declared = { status: "stale" as const, reason: "collector delayed" };
  assert.equal(resolveEvidenceFreshness(declared, 10, "4h", 20), declared);
  assert.equal(resolveEvidenceFreshness(undefined, 1_000, "1h", 1_000 + 60 * 60_000).status, "fresh");
  assert.equal(resolveEvidenceFreshness(undefined, 1_000, "1h", 1_000 + 3 * 60 * 60_000).status, "stale");
  assert.equal(resolveEvidenceFreshness(undefined, null, "4h").status, "missing");
});

test("transition and prediction helpers preserve honest empty states", () => {
  assert.equal(hasTransitionMatrixData(null), false);
  assert.equal(hasTransitionMatrixData({
    symbol: "BTCUSDT",
    timeframe: "1h",
    windowSize: 15,
    archetypeCount: 0,
    totalTransitions: 0,
    cells: [],
  }), false);
  assert.equal(getPredictionUnavailableMessage({
    validated: false,
    reason: "Chưa có OOS validation.",
  }), "Chưa có OOS validation.");
});

test("LLM state treats null as unknown and permits an explicit fallback only", () => {
  assert.equal(getLlmUiState(null), "unknown");
  assert.equal(canUseAiExplanation(null), false);
  assert.equal(getLlmUiState({
    mlInference: true,
    llmExplanation: false,
    provider: "none",
    reason: null,
    fallbackExplanation: true,
  }), "off");
  assert.equal(canUseAiExplanation({
    mlInference: true,
    llmExplanation: false,
    provider: "none",
    reason: null,
    fallbackExplanation: true,
  }), true);
});

test("research labels never fabricate live execution or a model", () => {
  assert.equal(AI_ANALYSIS_SYMBOL, "BTCUSDT");
  assert.equal(PAPER_JOURNAL_LABEL, "Nhật ký Paper BTC");
  assert.equal(PAPER_JOURNAL_LABEL.includes("Binance"), false);
  assert.equal(SIMULATION_LABEL, "SIMULATION");
  assert.equal(getPaperModelLabel(null), "Chưa gắn model");
  assert.equal(getSimulatedPnlStatus(-1), "Lỗ mô phỏng đã ghi nhận");
});
