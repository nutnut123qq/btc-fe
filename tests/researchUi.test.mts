import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_ANALYSIS_SYMBOL,
  canUseAiExplanation,
  getLlmUiState,
  getPaperModelLabel,
  getPredictionUnavailableMessage,
  getSimulatedPnlStatus,
  hasTransitionMatrixData,
  PAPER_JOURNAL_LABEL,
  SIMULATION_LABEL,
} from "../src/lib/researchUi.ts";

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
  assert.equal(PAPER_JOURNAL_LABEL, "Nhật ký Paper đa tài sản");
  assert.equal(PAPER_JOURNAL_LABEL.includes("Binance"), false);
  assert.equal(SIMULATION_LABEL, "SIMULATION");
  assert.equal(getPaperModelLabel(null), "Chưa gắn model");
  assert.equal(getSimulatedPnlStatus(-1), "Lỗ mô phỏng đã ghi nhận");
});
