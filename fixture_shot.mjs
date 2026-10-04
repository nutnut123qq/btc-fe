// Fixture-driven verification capture. Usage: node fixture_shot.mjs [mobile]
// Stubs /api/** with deterministic contract-valid fixtures (hand-built below +
// real prod responses captured in .psc-shots/fixtures-*.json), waits for
// specific rendered states (no fixed sleeps), and screenshots each screen.
// Any endpoint outside fixture scope gets an explicit 501 and is listed.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE = process.env.SHOT_BASE_URL || "http://127.0.0.1:3211";
const mobile = process.argv.includes("mobile");
const vp = mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 };
const PREFIX = mobile ? "fxm" : "fx";
const OUT = ".impl-shots";

// ---------- fixtures ----------
const contractSrc = readFileSync("src/lib/apiContract.ts", "utf8");
const expected = contractSrc.match(/EXPECTED_API_CONTRACT_VERSION\s*=\s*"([^"]+)"/)[1];
const META = {
  appVersion: "fixture",
  apiContractVersion: expected,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

const H4 = 4 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;
const ISO = (ms) => new Date(ms).toISOString();
const SHA = "a".repeat(64);

// Real prod responses captured earlier (contract-real data).
const psc = (name) => JSON.parse(readFileSync(`.psc-shots/${name}`, "utf8"));
const PSC_RESEARCH = psc("fixtures-research.json");
const PSC_PAPER = psc("fixtures-paper.json");
const PSC_JOURNAL = psc("fixtures-binanceHistory.json");
const PSC_SETTINGS = psc("fixtures-settings.json");

function replayCandles(n) {
  const firstOpen = NOW - n * H4;
  return Array.from({ length: n }, (_, i) => {
    const openTimeMs = firstOpen + i * H4;
    const open = 60_000 + Math.sin(i / 7) * 800 + i * 12;
    const close = open + Math.sin(i / 3) * 140;
    return {
      openTimeMs,
      closeTimeMs: openTimeMs + H4,
      open: +open.toFixed(2),
      high: +(Math.max(open, close) + 90).toFixed(2),
      low: +(Math.min(open, close) - 90).toFixed(2),
      close: +close.toFixed(2),
      volume: 1_000 + i * 7,
    };
  });
}

const LAYER_KEYS = [
  "technicalIndicators", "candlePatterns", "volumeAnomaly",
  "marketRegime", "fibonacci", "volumeProfile", "confluence",
];

function replayEnvelope() {
  const candles = replayCandles(120);
  const first = candles[0].openTimeMs;
  const last = candles[candles.length - 1].closeTimeMs;
  const lineage = {
    moduleContractVersion: "fixture-replay-v1",
    moduleContractSha256: SHA,
    producer: "fixture",
    calculationVersion: "fixture-calc-v1",
    source: "stored-finalized-klines",
    evaluationMode: "point-in-time-reconstruction",
    requestedAsOfTimeMs: last,
    effectiveAsOfTimeMs: last,
    availableTimeMs: null,
    sourceStartTimeMs: null,
    sourceEndTimeMs: null,
    sourceCandleCount: candles.length,
    requiredWarmupBars: 0,
    isCausal: true,
    isPersisted: false,
  };
  const layers = {};
  for (const layerKey of LAYER_KEYS) {
    layers[layerKey === "technicalIndicators" ? "indicators" : layerKey] = {
      layerKey,
      availability: "unavailable",
      lineage,
      unavailableReason: "fixture: layer data not supplied",
      limitations: [],
      payload: null,
    };
  }
  return {
    moduleContractVersion: "fixture-replay-v1",
    moduleContractSha256: SHA,
    symbol: "BTCUSDT",
    timeframe: "4h",
    requestedAsOfTimeMs: last,
    effectiveAsOfTimeMs: last,
    lastFinalizedCandleCloseTimeMs: last,
    requestedLookbackBars: 500,
    replayWindowStartTimeMs: first,
    contiguousSegmentStartTimeMs: first,
    sourceCandleCount: candles.length,
    analysisCandleCount: candles.length,
    calculationVersion: "fixture-calc-v1",
    provenance: {
      source: "stored-finalized-klines",
      evaluationMode: "point-in-time-reconstruction",
      availabilityRule: "candle.closeTimeMs <= requestedAsOfTimeMs",
      contextRule: "evaluate the latest gap-free, valid-duration stored history segment, then return events whose origin is inside the requested lookback window",
      persistedByReplay: false,
    },
    limitations: [],
    candles,
    events: [],
    layers,
    coverage: LAYER_KEYS.map((layerKey) => ({
      layerKey,
      availability: "unavailable",
      sourceBars: candles.length,
      requiredWarmupBars: 0,
      latestAvailableTimeMs: null,
      hasGapBoundary: false,
      checkpointStatus: "fixture",
      storageStatus: "on_demand_state_not_checkpointed",
      isEventEnvelopeMaterializedAtAsOf: false,
    })),
    administration: {
      hasGapBoundary: false,
      contextLimitBars: 0,
      legacySmartMoneyStatus: "not-applicable",
      rebuildRequired: false,
      rebuildReason: null,
    },
  };
}

const NEWS = {
  items: Array.from({ length: 12 }, (_, i) => ({
    id: `news-${i + 1}`,
    source: ["CoinDesk", "The Block", "Reuters", "Bloomberg"][i % 4],
    title: `BTC fixture headline ${i + 1}: ETF flows và cấu trúc thị trường tuần này`,
    link: `https://example.com/news/${i + 1}`,
    publishedAt: ISO(NOW - i * 3_600_000),
    summary: `Tóm tắt fixture ${i + 1} — dòng tiền ETF, đào coin và tâm lý vĩ mô.`,
  })),
};

const ANALYSIS = {
  symbol: "BTCUSDT",
  forecast: "SIDEWAYS",
  confidence: 50,
  reasoning:
    "BTC đang nén trong biên độ hẹp; dòng tiền ETF cân bằng và các chỉ báo kỹ thuật chưa cho hướng rõ. Tác tử rủi ro giữ quyết định trung lập chờ xác nhận khối lượng.",
  debate_summary: {
    news_agent: "24 bài RSS đa số trung tính; dòng tiền ETF cân bằng, không có xung lực định hướng mạnh.",
    tech_agent: "EMA20/EMA50 phẳng trên khung 4h; RSI 58 cho thấy cân bằng lực mua/bán.",
    final_decision: "Trọng tài rủi ro chọn kịch bản tích lũy; từ chối mở vị thế cho tới khi có xác nhận.",
  },
  news_evidence: [
    {
      title: "ETF Bitcoin ghi nhận dòng tiền cân bằng",
      link: "https://example.com/etf-flows",
      snippet: "Dòng vào/ra gần như bù trừ trong tuần qua.",
      sentiment: "neutral",
      why_it_matters: "Thiếu xung lực tổ chức → giá khó bứt phá biên.",
    },
    {
      title: "Lãi suất mở phái sinh ở mức cao",
      link: "https://example.com/oi",
      snippet: "OI duy trì ~38 tỷ USD, nguy cơ squeeze hai chiều.",
      sentiment: "cautious",
      why_it_matters: "Đòn bẩy cao làm tăng biên dao động khi phá vỡ.",
    },
  ],
  tech_evidence: {
    first_close: 67_200,
    last_close: 68_950,
    change_pct: 2.6,
    period_high: 69_500,
    period_low: 66_800,
    rsi: 58.2,
  },
  risk_conditions: [
    {
      trigger: "Phá vỡ giả dưới 68,950",
      severity: "medium",
      what_to_watch: "Khối lượng bán tăng kèm funding âm.",
      mitigation_hint: "Chờ retest thất bại trước khi suy luận tiếp.",
    },
  ],
};

const CAP_ON = {
  mlInference: true,
  llmExplanation: true,
  provider: "fixture-llm",
  reason: null,
  fallbackExplanation: true,
};
const CAP_OFF = {
  mlInference: false,
  llmExplanation: false,
  provider: "none",
  reason: "fixture: LLM off",
  fallbackExplanation: true,
};

const RUN = {
  pipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  validityStatus: "Valid",
  invalidReason: null,
  archivedAtUtc: null,
  id: 1,
  symbol: "BTCUSDT",
  timeframe: "4h",
  windowSize: 40,
  horizon: "1bar",
  modelName: "xgboost-4h-v3",
  startTimeMs: NOW - 200 * H4,
  endTimeMs: NOW,
  totalTrades: 42,
  winRate: 0.55,
  totalReturnPct: 12.4,
  buyHoldReturnPct: 8.1,
  maxDrawdownPct: -6.2,
  sharpeRatio: 1.35,
  profitFactor: 1.42,
  finalEquity: 11_240,
  createdAtUtc: ISO(NOW),
};
const EQUITY = Array.from({ length: 40 }, (_, i) => ({
  time: NOW - (40 - i) * H4,
  equity: 10_000 * (1 + 0.124 * (i / 39) + Math.sin(i / 4) * 0.01),
}));
const TRADES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  entryTimeMs: NOW - (60 - i * 4) * H4,
  exitTimeMs: NOW - (60 - i * 4 - 2) * H4,
  side: i % 3 === 0 ? "SHORT" : "LONG",
  entryPrice: 60_000 + i * 120,
  exitPrice: 60_000 + i * 120 + (i % 2 === 0 ? 240 : -160),
  pnlPct: i % 2 === 0 ? 0.4 : -0.27,
  confidence: 0.62,
  trueLabel: i % 2 === 0 ? 1 : -1,
}));
const RUN_DETAIL = { ...RUN, trades: TRADES, metricsJson: '{"feeBps":5}', equityCurveJson: JSON.stringify(EQUITY) };

const RULES = [
  {
    id: 1,
    name: "engulfing-then-breakout",
    description: "Engulfing tăng theo sau là nến phá vỡ trong 3 nến.",
    symbol: "BTCUSDT",
    timeframe: "4h",
    requiredBars: 4,
    isEnabled: true,
    cooldownMinutes: 60,
    conditionsJson: '[{"type":"candle-pattern","direction":1},{"type":"breakout","period":3}]',
    action: "signal",
    priority: 1,
    isAutoDiscovered: true,
    winRate: 0.58,
    avgReturn: 0.9,
    sampleCount: 43,
    capabilityState: "experimental",
    methodVersion: "discovery-v2",
    discoveryRunId: 7,
  },
  {
    id: 2,
    name: "volume-spike-reversal",
    description: "Volume bất thường >3x tại đỉnh cục bộ → đảo chiều trong 2 nến.",
    symbol: "BTCUSDT",
    timeframe: "4h",
    requiredBars: 3,
    isEnabled: true,
    cooldownMinutes: 30,
    conditionsJson: '[{"type":"volume-anomaly","multiplier":3}]',
    action: "signal",
    priority: 2,
    isAutoDiscovered: true,
    winRate: 0.51,
    avgReturn: -0.2,
    sampleCount: 18,
    capabilityState: "exploratory",
    methodVersion: "discovery-v2",
    discoveryRunId: 7,
  },
];

const ALERTS = {
  userId: "default",
  unreadCount: 1,
  items: [{
    id: "alert-1",
    userId: "default",
    type: "price-threshold",
    title: "BTC vượt ngưỡng 68,000",
    message: "Giá BTCUSDT chạm ngưỡng đã đặt trong cài đặt cảnh báo.",
    priceSnapshot: 68_120,
    createdAt: ISO(NOW),
    isRead: false,
    sourceKey: null,
    availableTimeMs: NOW,
    provenance: "alert-worker",
    deliveryStatus: "delivered",
    archivedAtUtc: null,
  }],
};

const ANALOG_PAGE = {
  requestId: "analog-fx", contractVersion: "2026-09-historical-analogs",
  method: "historical-analog-returns-shape-v1",
  rankingMethod: "shape-similarity-desc-context-audit-only",
  evaluationMethod: "fixed-horizon-close-to-close-economic-threshold",
  symbol: "BTCUSDT", timeframe: "4h", intervalMs: H4, windowSize: 15,
  lookbackBars: 20_000, neighborCount: 30, page: 1, pageSize: 8, total: 16,
  exclusionBars: 21, roundTripCostPct: 0.15, atrMultiplier: 0.25,
  rawCandidateCount: 1_200, independentCandidateCount: 120, effectiveSampleCount: 16,
  validation: {
    status: "exploratory", isOutOfSampleValidated: false,
    reason: "Chỉ dùng để nghiên cứu; chưa qua kiểm định walk-forward ngoài mẫu.",
  },
  query: {
    startTimeMs: NOW, endTimeMs: NOW + 14 * H4,
    ohlc: replayCandles(15).map((c) => ({ openTimeMs: c.openTimeMs, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })),
    context: { values: { atr14Pct: 0.2 }, availableFeatureCount: 1 },
  },
  summaries: [1, 3, 6].map((barsAhead, index) => ({
    barsAhead, totalSamples: 16,
    upCount: index === 0 ? 10 : 4, downCount: index === 1 ? 10 : 4,
    neutralCount: index === 2 ? 8 : 2,
    upRate: index === 0 ? 0.625 : 0.25, downRate: index === 1 ? 0.625 : 0.25,
    neutralRate: index === 2 ? 0.5 : 0.125,
    avgReturnPct: 0.8, medianReturnPct: 0.8,
    dominantDirection: index === 0 ? 1 : index === 1 ? -1 : 0,
  })),
  items: Array.from({ length: 8 }, (_, i) => {
    const rank = i + 1;
    const end = NOW - (rank + 2) * 21 * H4;
    const src = replayCandles(15);
    const fut = replayCandles(6);
    return {
      rank, windowId: rank, startTimeMs: end - 14 * H4, endTimeMs: end,
      futureEndTimeMs: end + 6 * H4,
      shapeSimilarity: 0.98 - rank / 1_000,
      contextSimilarity: rank % 2 === 0 ? null : 0.83,
      contextComparableFeatureCount: rank % 2 === 0 ? 0 : 6,
      atr14Pct: 0.2, thresholdPct: 0.2,
      ohlc: src.map((c) => ({ openTimeMs: c.openTimeMs, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })),
      futureOhlc: fut.map((c) => ({ openTimeMs: c.openTimeMs, open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume })),
      outcomes: [1, 3, 6].map((barsAhead, idx) => ({
        barsAhead, targetOpenTimeMs: end + barsAhead * H4,
        targetClose: 61_000, returnPct: [0.8, -0.6, 0.1][idx],
        thresholdPct: 0.2, direction: [1, -1, 0][idx],
      })),
    };
  }),
};

// --- Research evidence (hand-built, strict parser) ---
const EV_ID = "b".repeat(64);
const EV_REPORT_SHA = "c".repeat(64);
const EV_MANIFEST_SHA = "d".repeat(64);
const EV_ITEM = {
  id: EV_ID,
  title: "Đánh giá walk-forward XGBoost 4h",
  kind: "model",
  tier: "validated-predictive",
  status: "supported",
  integrityVerified: true,
  symbol: "BTCUSDT",
  timeframe: "4h",
  summary: "Win rate 55% trên cửa sổ test ngoài mẫu; PF 1.42.",
  limitations: ["Cỡ mẫu nhỏ (42 lệnh)", "Chưa kiểm tra multi-asset"],
  generatedAtUtc: ISO(NOW - 86_400_000),
  reportSha256: EV_REPORT_SHA,
  manifestSha256: EV_MANIFEST_SHA,
};
const EVIDENCE_CATALOG = {
  contractVersion: expected,
  symbol: "BTCUSDT",
  generatedAtUtc: ISO(NOW),
  integrity: { scannedArtifactCount: 4, publishedArtifactCount: 3, rejectedArtifactCount: 1 },
  items: [
    EV_ITEM,
    {
      id: "e".repeat(64),
      title: "Ablation nhóm feature funding rate",
      kind: "feature",
      tier: "descriptive",
      status: "inconclusive",
      integrityVerified: true,
      symbol: "BTCUSDT",
      timeframe: "4h",
      summary: "Loại bỏ funding không làm thay đổi đáng kể metrics.",
      limitations: [],
      generatedAtUtc: ISO(NOW - 2 * 86_400_000),
      reportSha256: "1".repeat(64),
      manifestSha256: "2".repeat(64),
    },
    {
      id: "f".repeat(64),
      title: "Evidence forward chưa đủ kỳ quan sát",
      kind: "forward",
      tier: "unavailable",
      status: "unavailable",
      available: false,
      integrityVerified: false,
      symbol: "BTCUSDT",
      timeframe: "4h",
      summary: "Forward observation chưa đủ số kỳ để kết luận.",
      limitations: [],
      generatedAtUtc: ISO(NOW - 3 * 86_400_000),
    },
  ],
  pipeline: null,
};
const EVIDENCE_DETAIL = {
  ...EV_ITEM,
  hypothesis: "Direction head 4h có giá trị dự báo ngoài mẫu.",
  question: "XGBoost 4h window-40 có vượt baseline buy & hold ngoài mẫu không?",
  conclusion: "Vượt nhẹ: +12.4% vs +8.1%; cần thêm mẫu trước khi kết luận chắc.",
  dataset: {
    snapshotId: "snapshot-fx-1",
    snapshotSha256: "3".repeat(64),
    predictionsSha256: "4".repeat(64),
    source: "stored-finalized-klines",
    rowCount: 1_240,
    predictionRowCount: 1_180,
    featureCount: 38,
    startTimeUtc: ISO(NOW - 400 * H4),
    endTimeUtc: ISO(NOW),
    cutoffTimeUtc: ISO(NOW - 60 * H4),
    immutable: true,
  },
  protocol: {
    name: "walk-forward",
    version: "wf-v2",
    foldCount: 5,
    purgeBars: 8,
    calibrationRows: 300,
    testRows: 42,
    notes: ["Expanding window", "Purge 8 bars giữa train/test"],
    chronologicalOos: true,
    multipleTesting: "benjamini-hochberg",
  },
  baselines: [
    {
      id: "buy-hold",
      name: "Buy & Hold",
      description: "Giữ BTC suốt cửa sổ test.",
      metrics: [{ name: "returnPct", label: "Return", value: 8.1, unit: "%" }],
    },
  ],
  metrics: [
    { name: "winRate", label: "Tỷ lệ thắng", value: 0.55, unit: "ratio", baselineValue: 0.5, lift: 0.05, sampleCount: 42 },
    { name: "profitFactor", label: "Profit factor", value: 1.42, unit: null, baselineValue: 1.0, lift: 0.42, sampleCount: 42 },
  ],
  findings: [
    { id: "f1", label: "Hiệu suất ngoài mẫu", status: "supported", metricName: "winRate", value: 0.55, lower: 0.48, upper: 0.62, sampleSize: 42 },
  ],
  uncertainty: [{ name: "winRate", lower: 0.48, upper: 0.62, confidenceLevel: 0.95 }],
  artifacts: [
    { role: "report", sha256: EV_REPORT_SHA, bytes: 12_480, rowCount: 42 },
    { role: "manifest", sha256: EV_MANIFEST_SHA, bytes: 2_048 },
  ],
  coverage: { evaluatedRows: 42, eligibleRows: 50, ratio: 0.84, abstentionRate: 0.16, foldCount: 5 },
  provenance: { codeVersion: "fixture", gitDirty: false, artifactPath: "evidence/fixture" },
};

const DATA_AUDIT = {
  symbol: "BTCUSDT",
  generatedAtUtc: ISO(NOW),
  news: { articles: 1240, chunks: 5200, embedded: 5100 },
  rulesAlerts: { rules: 7, alerts: 3 },
  timeframes: [
    {
      timeframe: "4h",
      totalKlines: 1_200, missingBars: 3, gapRangeCount: 1, dataCoveragePct: 99.75,
      largestGapMs: 3 * H4, pendingGapCount: 1, unavailableGapCount: 0,
      candlePatterns: 1_200, technicalIndicators: 1_200, windowVectors: 1_180,
      mlFeatureStores: 1_100, priceTargets: 1_100, windowClassificationDatasets: 1_000,
      gapLedgerStatus: "Reconciled",
      expectedBars: 1_203, minOpenTimeMs: NOW - 1_200 * H4, maxOpenTimeMs: NOW - H4,
      latestCandleAgeSeconds: 3_600,
      topGaps: [
        {
          id: 1, startOpenTimeMs: NOW - 500 * H4, endOpenTimeMs: NOW - 497 * H4,
          missingBars: 3, attemptCount: 1, status: "Pending",
          nextRetryAtUtc: ISO(NOW + 3_600_000), reason: "fixture: gap chưa lấp",
        },
      ],
    },
    {
      timeframe: "1h",
      totalKlines: 4_800, missingBars: 0, gapRangeCount: 0, dataCoveragePct: 100,
      largestGapMs: 0, pendingGapCount: 0, unavailableGapCount: 0,
      candlePatterns: 4_800, technicalIndicators: 4_800, windowVectors: 4_700,
      mlFeatureStores: 4_400, priceTargets: 4_400, windowClassificationDatasets: 4_000,
      gapLedgerStatus: "Reconciled",
      expectedBars: 4_800, minOpenTimeMs: NOW - 4_800 * 3_600_000, maxOpenTimeMs: NOW - 3_600_000,
      latestCandleAgeSeconds: 900,
      topGaps: [],
    },
  ],
};

const PRED_LATEST = {
  requestId: "fx-pred-1",
  symbol: "BTCUSDT",
  timeframe: "4h",
  windowSize: 5,
  horizon: "4h",
  windowStartMs: NOW - 5 * H4,
  windowEndMs: NOW - H4,
  prediction: {
    label: 1,
    confidence: 0.62,
    prob_down: 0.18,
    prob_sideways: 0.2,
    prob_up: 0.62,
    model_version: "xgboost-4h-v3",
    inference_ms: 12,
    pipelineVersion: "quant-pipeline-v3",
    evaluationVersion: "evaluation-v2",
    validityStatus: "Valid",
  },
};
const PRED_HISTORY = {
  symbol: "BTCUSDT",
  timeframe: "4h",
  count: 3,
  items: [0, 1, 2].map((i) => ({
    id: 100 + i,
    symbol: "BTCUSDT",
    timeframe: "4h",
    windowSize: 5,
    horizon: "4h",
    predictedLabel: i === 1 ? -1 : 1,
    probDown: i === 1 ? 0.61 : 0.18,
    probSideways: 0.2,
    probUp: i === 1 ? 0.19 : 0.62,
    targetReturn: i === 2 ? 0.004 : null,
    actualLabel: i === 2 ? 1 : null,
    isCorrect: i === 2 ? true : null,
    modelVersion: "xgboost-4h-v3",
    windowEndMs: NOW - (i + 1) * H4,
    createdAtUtc: ISO(NOW - (i + 1) * H4),
    pipelineVersion: "quant-pipeline-v3",
    evaluationVersion: "evaluation-v2",
    validityStatus: "Valid",
    invalidReason: null,
    archivedAtUtc: null,
  })),
};
const PRED_MODELS = {
  models: [{
    file: "xgb_BTCUSDT_4h_w5_4h.joblib",
    symbol: "BTCUSDT",
    timeframe: "4h",
    window_size: 5,
    horizon: "4h",
    model_name: "xgboost-4h-v3",
    metrics: { accuracy: 0.57, f1_weighted: 0.55 },
  }],
};
const PROMO = {
  validated: false,
  maturity: "Experimental",
  promotionEligible: false,
  promotionReason: "Đánh giá experimental; chưa đủ điều kiện promote.",
};
const PRED_ACCURACY = {
  symbol: "BTCUSDT",
  timeframe: "4h",
  totalPredictions: 120, evaluatedCount: 80, trueCount: 46, falseCount: 34,
  pendingCount: 40, winRatePct: 57.5,
  canonicalPredictionCount: 120, canonicalEvaluatedCount: 80,
  canonicalTrueCount: 46, canonicalFalseCount: 34, canonicalWinRatePct: 57.5,
  ...PROMO,
};
const ENSEMBLE_EVAL = {
  totalPredictions: 0, trueCount: 0, falseCount: 0, pendingCount: 0, winRatePct: 0,
  canonicalEvaluatedCount: 0, canonicalTrueCount: 0, canonicalFalseCount: 0,
  canonicalPendingCount: 0, canonicalWinRatePct: 0,
  reevaluatedCount: 0, reevaluatedTrueCount: 0, reevaluatedFalseCount: 0,
  reevaluatedPendingCount: 0, reevaluatedWinRatePct: 0,
  reevaluatedItems: [], items: [],
  ...PROMO,
};

const HEALTH_LIVE = { status: "healthy", checkedAtUtc: ISO(NOW) };
const HEALTH_READY = { status: "ready", databaseReachable: true, checkedAtUtc: ISO(NOW), responseTimeMs: 2 };
const HEALTH_FRESHNESS = {
  status: "degraded",
  databaseReachable: true,
  checkedAtUtc: ISO(NOW),
  symbol: "BTCUSDT",
  klines: [
    { timeframe: "1h", status: "fresh", active: true, latestOpenTimeUtc: ISO(NOW - 3_600_000), ageSeconds: 900, maxAgeSeconds: 7_200 },
    { timeframe: "4h", status: "fresh", active: true, latestOpenTimeUtc: ISO(NOW - H4), ageSeconds: 3_600, maxAgeSeconds: 14_400 },
    { timeframe: "1d", status: "stale", active: true, latestOpenTimeUtc: ISO(NOW - 3 * 86_400_000), ageSeconds: 90_000, maxAgeSeconds: 86_400 },
  ],
};

const CURRENT_CONDITIONS = {
  timeframe: "4h",
  asOfMs: NOW,
  generatedAtMs: NOW,
  conditions: [],
  conflicts: [],
  warnings: ["fixture: chưa có module nào publish điều kiện"],
  unavailableModules: [{ module: "technicalIndicators", reason: "fixture: layer unavailable" }],
  evidence: {
    available: false,
    reason: "fixture: chưa có run evidence point-in-time",
    runId: null,
    manifestSha256: null,
    specSha256: null,
    cutoffMs: null,
    evidenceAgeBars: null,
  },
};

// ---------- routing ----------
const unmatched = new Set();
function makeRoutes(llmOn) {
  return async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (p === "/api/meta") return route.fulfill({ json: META });
    if (p === "/api/ai-chat/capabilities") return route.fulfill({ json: llmOn ? CAP_ON : CAP_OFF });
    if (p === "/api/smart-money/replay") return route.fulfill({ json: replayEnvelope() });
    if (p === "/api/market/tickers") {
      return route.fulfill({ json: [{
        symbol: "BTCUSDT", lastPrice: 61_200.5, priceChangePercent: 1.8,
        priceChange: 1_080, highPrice: 62_000, lowPrice: 59_800,
        volume: 12_400, quoteVolume: 758_000_000, bidPrice: 61_199,
        askPrice: 61_201, count: 84_000, closeTimeMs: NOW,
      }] });
    }
    if (p === "/api/market/klines" || p === "/api/market/trades") return route.fulfill({ json: [] });
    if (p === "/api/market/depth") return route.fulfill({ json: { symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] } });
    if (p === "/api/news") return route.fulfill({ json: NEWS });
    if (p === "/api/analysis/analyze" || p === "/api/analysis/bitcoin") return route.fulfill({ json: ANALYSIS });
    if (p === "/api/backtest/runs") return route.fulfill({ json: { symbol: "BTCUSDT", count: 1, items: [RUN] } });
    if (p === "/api/backtest/runs/1" || p === "/api/backtest/1") return route.fulfill({ json: RUN_DETAIL });
    if (p === "/api/discovery/rules") return route.fulfill({ json: RULES });
    if (p === "/api/historical-analogs") return route.fulfill({ json: ANALOG_PAGE });
    if (p === "/api/alerts") return route.fulfill({ json: ALERTS });
    if (p === "/api/alerts/unread-count") return route.fulfill({ json: { unreadCount: 1 } });
    if (p === "/api/sentiment/current") {
      return route.fulfill({ json: { aggregatedSentiment: 0.1, sentimentLabel: "NEUTRAL", createdAtUtc: ISO(NOW) } });
    }
    // Research
    if (p === "/api/research/evidence") return route.fulfill({ json: EVIDENCE_CATALOG });
    if (p === `/api/research/evidence/${EV_ID}`) return route.fulfill({ json: EVIDENCE_DETAIL });
    if (p === "/api/research/capabilities") return route.fulfill({ json: PSC_RESEARCH["/api/research/capabilities"] });
    if (p === "/api/research/current-conditions") return route.fulfill({ json: CURRENT_CONDITIONS });
    if (p === "/api/market/data-audit") return route.fulfill({ json: DATA_AUDIT });
    if (p === "/api/market/data-quality/issues") return route.fulfill({ json: PSC_RESEARCH["/api/market/data-quality/issues"] });
    if (p === "/api/paper-trades/observations") return route.fulfill({ json: PSC_RESEARCH["/api/paper-trades/observations"] });
    // Predict
    if (p === "/api/prediction/latest") return route.fulfill({ json: PRED_LATEST });
    if (p === "/api/prediction/history") return route.fulfill({ json: PRED_HISTORY });
    if (p === "/api/prediction/models") return route.fulfill({ json: PRED_MODELS });
    if (p === "/api/prediction/accuracy") return route.fulfill({ json: PRED_ACCURACY });
    if (p === "/api/ensemble/history") return route.fulfill({ json: [] });
    if (p === "/api/ensemble/evaluations") return route.fulfill({ json: ENSEMBLE_EVAL });
    // Paper + journal (prod-captured contract responses)
    if (p === "/api/paper-trades/summary") return route.fulfill({ json: PSC_PAPER["/api/paper-trades/summary"] });
    if (p === "/api/paper-trades/open") return route.fulfill({ json: PSC_PAPER["/api/paper-trades/open"] });
    if (p === "/api/paper-trades/equity-curve") return route.fulfill({ json: PSC_PAPER["/api/paper-trades/equity-curve"] });
    if (p === "/api/paper-trades/portfolio-summary") return route.fulfill({ json: PSC_JOURNAL["/api/paper-trades/portfolio-summary"] });
    if (p === "/api/paper-trades") return route.fulfill({ json: PSC_PAPER["/api/paper-trades"] });
    // Settings
    if (p === "/api/alert-settings") return route.fulfill({ json: PSC_SETTINGS["/api/alert-settings"] });
    if (p === "/api/health/workers") return route.fulfill({ json: PSC_SETTINGS["/api/health/workers"] });
    if (p === "/api/health/live") return route.fulfill({ json: HEALTH_LIVE });
    if (p === "/api/health/ready") return route.fulfill({ json: HEALTH_READY });
    if (p === "/api/health/freshness") return route.fulfill({ json: HEALTH_FRESHNESS });
    // Strict fallback: anything else is out of fixture scope — fail loudly.
    unmatched.add(`${route.request().method()} ${p}`);
    return route.fulfill({
      status: 501,
      contentType: "application/json",
      body: JSON.stringify({ code: "FIXTURE_OUT_OF_SCOPE", message: `fixture_shot: ${p} ngoài fixture scope` }),
    });
  };
}

// ---------- capture ----------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.routeWebSocket(/stream\.binance\.com/, () => {});
await page.route("**/api/**", makeRoutes(true));

const nav = page.getByTestId(mobile ? "nav-groups-mobile" : "nav-groups");
const GROUP_LABEL = {
  news: "Tin tức & AI", ai: "Tin tức & AI",
  research: "Nghiên cứu", archetype: "Nghiên cứu", rules: "Nghiên cứu", backtest: "Nghiên cứu",
  predict: "Mô phỏng", paper: "Mô phỏng", journal: "Mô phỏng",
};
const TAB_LABEL = {
  market: "Thị trường", news: "Tin tức", ai: "AI",
  research: "Nghiên cứu", archetype: "Mẫu nến", rules: "Rules nến", backtest: "Backtest",
  predict: "Dự đoán", paper: "Paper", journal: "Nhật ký Paper BTC",
  settings: "Hệ thống",
};

async function openTab(key) {
  const group = GROUP_LABEL[key];
  if (!group) {
    // Single-child group (market, settings): the group button activates it directly.
    await nav.getByRole("button", { name: TAB_LABEL[key], exact: true }).click();
    return;
  }
  await nav.getByRole("button", { name: group, exact: true }).click();
  await page.getByTestId("nav-sub-row").getByRole("button", { name: TAB_LABEL[key], exact: true }).click();
}
const shot = (name) => page.screenshot({ path: `${OUT}/${PREFIX}-${name}.png`, fullPage: false });

await page.goto(BASE, { waitUntil: "domcontentloaded" });

// Market — candles + replay envelope rendered; layers honestly unavailable.
await page.getByText(/Nến cuối:/).waitFor({ timeout: 15_000 });
await page.waitForFunction(() => document.querySelectorAll("canvas").length > 0, null, { timeout: 10_000 });
await shot("market");
console.log("shot market");

// News — populated rows + monogram fallback; exercise a source filter.
await openTab("news");
await page.getByText("BTC fixture headline 1", { exact: false }).first().waitFor({ timeout: 15_000 });
await page.getByRole("button", { name: "CoinDesk", exact: true }).click();
await page.getByText("BTC fixture headline 5", { exact: false }).first().waitFor({ timeout: 5_000 });
await shot("news");
console.log("shot news");

// AI — click analyze, wait for verdict + expand agent disclosures.
await openTab("ai");
await page.getByRole("button", { name: "Phân tích BTC" }).click();
await page.getByTestId("ai-verdict").waitFor({ timeout: 15_000 });
await page.getByRole("button", { name: /Tranh luận tác tử/ }).click();
await page.getByText("Tác tử tin tức").waitFor();
await shot("ai");
console.log("shot ai");

// Research — populated catalog; then open an artifact detail.
await openTab("research");
await page.getByText("Đánh giá walk-forward XGBoost 4h").first().waitFor({ timeout: 15_000 });
await shot("research");
console.log("shot research");
await page.getByText("Đánh giá walk-forward XGBoost 4h").first().click();
await page.getByText("Hiệu suất ngoài mẫu").waitFor({ timeout: 10_000 });
await shot("research-detail");
console.log("shot research-detail");

// Archetype (historical analog explorer) — populated rows.
await openTab("archetype");
await page.getByTestId("analog-card").first().waitFor({ timeout: 15_000 });
await shot("archetype");
console.log("shot archetype");

// Rules — populated flat rows.
await openTab("rules");
await page.getByText("engulfing-then-breakout").waitFor({ timeout: 15_000 });
await shot("rules");
console.log("shot rules");

// Backtest — select the run; equity canvas + trades inside the detail region.
await openTab("backtest");
const runRow = mobile
  ? page.getByRole("button", { name: /xgboost-4h-v3/ })
  : page.getByRole("cell", { name: "xgboost-4h-v3" });
await runRow.waitFor({ timeout: 15_000 });
await runRow.click();
const runDetail = page.locator("section").filter({ hasText: "Chi tiết run #1" });
await runDetail.locator("canvas").first().waitFor({ timeout: 10_000 });
await runDetail.getByText("Lệnh gần nhất").waitFor({ timeout: 10_000 });
await runDetail.getByRole("row").filter({ hasText: /LONG|SHORT/ }).first().waitFor({ timeout: 10_000 });
await shot("backtest");
console.log("shot backtest");

// Predict — model compatible (no quarantine); run inference, wait for result.
await openTab("predict");
await page.locator("main").getByRole("button", { name: "Dự đoán", exact: true }).click();
await page.getByText(/P↓/).first().waitFor({ timeout: 15_000 });
await page.getByText("Lịch sử dự đoán").waitFor({ timeout: 10_000 });
await shot("predict");
console.log("shot predict");

// Paper — forward journal populated with real prod observations.
await openTab("paper");
await page.getByText("Dòng sự kiện forward").waitFor({ timeout: 15_000 });
await page.getByText("model-unavailable").filter({ visible: true }).first().waitFor({ timeout: 10_000 });
await shot("paper");
console.log("shot paper");

// Journal — portfolio summary + trade rows.
await openTab("journal");
await page.getByText(/PnL mô phỏng/).first().waitFor({ timeout: 15_000 });
await page.getByRole("row").filter({ hasText: /LONG|SHORT/ }).first().waitFor({ timeout: 10_000 });
await shot("journal");
console.log("shot journal");

// Settings — alert settings form + health panels populated.
await openTab("settings");
await page.getByRole("heading", { name: "Ngưỡng giá", exact: true }).waitFor({ timeout: 15_000 });
await shot("settings");
console.log("shot settings");

await browser.close();

// Second pass: AI unavailable state (llm off).
const b2 = await chromium.launch();
const p2 = await b2.newPage({ viewport: vp });
await p2.routeWebSocket(/stream\.binance\.com/, () => {});
await p2.route("**/api/**", makeRoutes(false));
await p2.goto(BASE, { waitUntil: "domcontentloaded" });
const nav2 = p2.getByTestId(mobile ? "nav-groups-mobile" : "nav-groups");
await nav2.getByRole("button", { name: "Tin tức & AI", exact: true }).click();
await p2.getByTestId("nav-sub-row").getByRole("button", { name: "AI", exact: true }).click();
await p2.getByRole("status").filter({ hasText: "LLM OFF" }).waitFor({ timeout: 15_000 });
await p2.screenshot({ path: `${OUT}/${PREFIX}-ai-llm-off.png` });
console.log("shot ai-llm-off");
await b2.close();

if (errs.length) console.log("PAGEERRORS:", errs);
if (unmatched.size) console.log("OUT-OF-SCOPE ENDPOINTS:", [...unmatched].sort().join("\n  "));
console.log("done");
