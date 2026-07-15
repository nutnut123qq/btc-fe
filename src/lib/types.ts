export type KlineOHLC = {
  openTimeMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type NewsItem = {
  id: string;
  source: string;
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string | null;
};

export type AlertItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priceSnapshot: number | null;
  createdAt: string;
  isRead: boolean;
};

export type AlertSettingsDto = {
  userId: string;
  enabled: boolean;
  priceAboveUsd: number | null;
  priceBelowUsd: number | null;
  klineInterval: string;
  cooldownMinutes: number;
  updatedAt: string;
};

export type PatternSearchItem = {
  windowId: string;
  symbol: string;
  timeframe: string;
  featureType: string;
  startTimeMs: number;
  endTimeMs: number;
  distance: number;
  similarity: number;
  rank: number;
};

export type PatternSearchResponse = {
  requestId: string;
  symbol: string;
  timeframe: string;
  featureType: string;
  windowSize: number;
  topK: number;
  scannedWindows: number;
  latencyMs: number;
  fromVectorStore: boolean;
  items: PatternSearchItem[];
};

export type AnalysisResult = {
  symbol: string;
  forecast: string;
  confidence: number;
  reasoning: string;
  debate_summary: {
    news_agent: string;
    tech_agent: string;
    final_decision: string;
  };
  news_evidence: Array<{
    title: string;
    link: string;
    snippet: string;
    sentiment: string;
    why_it_matters: string;
  }>;
  tech_evidence: {
    first_close: number;
    last_close: number;
    change_pct: number;
    period_high: number;
    period_low: number;
    rsi: number;
  };
  risk_conditions: Array<{
    trigger: string;
    severity: string;
    what_to_watch: string;
    mitigation_hint: string;
  }>;
};

export const KLINE_OPTIONS = [
  "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M",
] as const;

export const FEATURE_TYPES = [
  { value: "open", label: "Open" },
  { value: "high", label: "High" },
  { value: "low", label: "Low" },
  { value: "close", label: "Close" },
  { value: "all", label: "All" },
  { value: "returns_shape", label: "Returns+Shape" },
] as const;

export type IndexCandlePatternsResponse = {
  requestId: string;
  symbol: string;
  timeframe: string;
  lookbackBars: number;
  indexed: number;
  durationMs: number;
};

export type CandlePatternItem = {
  id: number;
  symbol: string;
  timeframe: string;
  openTimeMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  patternType: string;
  patternCategory: string;
  trendDirection: string;
  createdAtUtc: string;
};

export type CandlePatternListResponse = {
  requestId: string;
  symbol: string;
  timeframe: string;
  fromMs?: number;
  toMs?: number;
  category?: string;
  patternType?: string;
  page: number;
  pageSize: number;
  total: number;
  items: CandlePatternItem[];
};

export const WINDOW_SIZES = [5, 10, 15, 20, 25] as const;

export type PredictionResult = {
  requestId: string;
  symbol: string;
  timeframe: string;
  windowSize: number;
  horizon: string;
  windowStartMs: number;
  windowEndMs: number;
  prediction: {
    label: number;
    confidence: number;
    prob_down: number;
    prob_sideways: number;
    prob_up: number;
    model_version: string;
    inference_ms: number;
  };
};

export type ModelPredictionItem = {
  id: number;
  symbol: string;
  timeframe: string;
  windowSize: number;
  horizon: string;
  predictedLabel: number;
  probDown: number;
  probSideways: number;
  probUp: number;
  targetReturn?: number | null;
  modelVersion: string;
  windowEndMs: number;
  createdAtUtc: string;
};

export type AvailableModel = {
  file: string;
  symbol: string;
  timeframe: string;
  window_size: number;
  horizon: string;
  model_name: string;
  metrics: {
    accuracy?: number;
    f1_weighted?: number;
  };
};

export type BacktestRunSummary = {
  id: number;
  symbol: string;
  timeframe: string;
  windowSize: number;
  horizon: string;
  modelName: string;
  startTimeMs: number;
  endTimeMs: number;
  totalTrades: number;
  winRate: number;
  totalReturnPct: number;
  buyHoldReturnPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  profitFactor: number;
  finalEquity: number;
  createdAtUtc: string;
};

export type BacktestTradeItem = {
  id: number;
  entryTimeMs: number;
  exitTimeMs: number;
  side: string;
  entryPrice: number;
  exitPrice: number;
  pnlPct: number;
  confidence: number;
  trueLabel: number;
};

export type SequenceRuleCondition = {
  type: string;
  direction?: string;
  count?: number;
  operator?: string;
  reference?: string;
  period?: number;
  multiplier?: number;
  value?: number;
  side?: string;
  position?: string;
  barOffset?: number;
};

export type SequenceRule = {
  id: number;
  name: string;
  description: string;
  symbol: string;
  timeframe: string;
  requiredBars: number;
  isEnabled: boolean;
  cooldownMinutes: number;
  conditionsJson: string;
  action: string;
  priority: number;
  createdAtUtc: string;
  updatedAtUtc?: string;
};

export type SequenceRuleSignal = {
  id: number;
  ruleId: number;
  symbol: string;
  timeframe: string;
  triggerTimeMs: number;
  closePrice: number;
  message: string;
  createdAtUtc: string;
};

// --- Sequence / structure analysis (api/market/{market-structure,sequence-scenarios,validate-candles}) ---
export type MarketStructureResponse = {
  symbol: string;
  interval: string;
  currentTrend: string;
  summaryText: string;
  swings: Array<{ index: number; timeMs: number; price: number; type: string; label: string }>;
  events: Array<{ timeMs: number; type: string; message: string; price: number }>;
};

export type SequenceScenario = {
  scenario: string;
  name: string;
  description: string;
  strength: number;
  suggestion: string;
  details: string[];
};

export type SequenceScenariosResponse = {
  symbol: string;
  timeframe: string;
  barsAnalyzed: number;
  summaryText: string;
  scenarios: SequenceScenario[];
};

export type ValidateCandlesResponse = {
  symbol: string;
  interval: string;
  limit: number;
  totalBars: number;
  validBars: number;
  isValid: boolean;
  summaryText: string;
  issues: Array<{ barIndex: number; code: string; message: string }>;
};
