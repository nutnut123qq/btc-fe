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
