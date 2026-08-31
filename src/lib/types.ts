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
  sourceKey: string | null;
  archivedAtUtc: string | null;
};

export type AlertListResponse = {
  userId: string;
  unreadCount: number;
  items: AlertItem[];
};

export type ValidityStatus = "Valid" | "Legacy" | "Invalid";

export type VersionedResearchRecord = {
  pipelineVersion: string;
  evaluationVersion: string;
  validityStatus: ValidityStatus;
  invalidReason: string | null;
  archivedAtUtc: string | null;
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
    pipelineVersion: string;
    evaluationVersion: string;
    validityStatus: ValidityStatus;
  };
};

export type ModelPredictionItem = VersionedResearchRecord & {
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
  actualLabel?: number | null;
  isCorrect?: boolean | null;
  modelVersion: string;
  windowEndMs: number;
  createdAtUtc: string;
};

export type PredictionAccuracySummaryDto = {
  symbol: string;
  timeframe: string;
  totalPredictions: number;
  evaluatedCount: number;
  trueCount: number;
  falseCount: number;
  pendingCount: number;
  winRatePct: number;
  canonicalPredictionCount: number;
  canonicalEvaluatedCount: number;
  canonicalTrueCount: number;
  canonicalFalseCount: number;
  canonicalWinRatePct: number;
  validated: false;
  maturity: "Experimental";
  promotionEligible: false;
  promotionReason: string;
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

export type BacktestRunSummary = VersionedResearchRecord & {
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
  isAutoDiscovered?: boolean;
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

export type PaperTradeItem = {
  id: number;
  symbol: string;
  timeframe: string;
  windowEndMs: number;
  entryTimeMs: number;
  exitTimeMs: number;
  side: string;
  confidence: number | null;
  probDown: number | null;
  probSideways: number | null;
  probUp: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  netReturn: number | null;
  netReturnPct?: number | null;
  realizedPnLUsdt?: number | null;
  status: string;
  modelVersion: string | null;
  createdAtUtc: string;
  closedAtUtc: string | null;
  positionSizeUsdt?: number | null;
  executedQty?: number | null;
  takeProfitPrice?: number | null;
  stopLossPrice?: number | null;
  atr14?: number | null;
  exitReason?: string | null;
  balanceAfter?: number | null;
  ensembleDirection?: string | null;
  orderId?: number | null;
  clientOrderId?: string | null;
  commission?: number | null;
  tags?: string[];
};

export type BreakdownBySymbolItem = {
  symbol: string;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  realizedPnLUsdt: number;
  avgReturnPct: number;
  bestTradePct: number;
  worstTradePct: number;
};

export type PortfolioSummaryResponse = {
  initialBalance: number;
  currentBalance: number;
  realizedPnLUsdt: number;
  realizedPnLPct: number;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  breakdownBySymbol: Record<string, BreakdownBySymbolItem>;
};

export type PaperTradeFilterParams = {
  symbols?: string;
  timeframe?: string;
  status?: "all" | "open" | "closed";
  side?: "all" | "long" | "short";
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
};

export type PaginatedPaperTrades = {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: PaperTradeItem[];
};

export type PaperTradeSummary = {
  symbol: string;
  timeframe: string | null;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winRate: number;
  totalNetReturnPct: number;
  avgReturnPct: number;
  maxDrawdownPct: number;
  bestTradePct: number;
  worstTradePct: number;
  longCount: number;
  shortCount: number;
};

export type EquityCurvePoint = {
  timeMs: number;
  cumulativeReturnPct: number;
  tradeCount: number;
};

// --- Archetype types ---

export type ArchetypeOhlcBar = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type ArchetypeOutcomeDto = {
  horizon: string;
  totalSamples: number;
  upRate: number;
  downRate: number;
  sidewaysRate: number;
  avgReturnPct: number;
  medianReturnPct: number;
  maxReturnPct: number;
  minReturnPct: number;
  stdDevReturnPct: number;
  recentSamples: number;
  recentUpRate: number;
  recentDownRate: number;
  recentAvgReturnPct: number;
};

export type ArchetypeDto = {
  id: number;
  archetypeCode: string;
  symbol: string;
  timeframe: string;
  windowSize: number;
  memberCount: number;
  intraClusterDistance: number;
  representativeOhlc: ArchetypeOhlcBar[] | null;
  bestOutcome: ArchetypeOutcomeDto | null;
};

export type ArchetypeDetailDto = {
  id: number;
  archetypeCode: string;
  symbol: string;
  timeframe: string;
  windowSize: number;
  memberCount: number;
  intraClusterDistance: number;
  representativeOhlc: ArchetypeOhlcBar[] | null;
  outcomes: ArchetypeOutcomeDto[];
};

export type ArchetypeMatchDto = {
  windowSize: number;
  archetype: ArchetypeDto | null;
  similarity: number;
  confidenceLevel: string;
  outcomes: ArchetypeOutcomeDto[];
};

export type ArchetypeOccurrenceDto = {
  windowStartMs: number;
  windowEndMs: number;
  distanceToCentroid: number;
  label: number;
  targetReturn: number | null;
};

export type ArchetypeRankingDto = {
  rank: number;
  archetypeId: number;
  archetypeCode: string;
  windowSize: number;
  timeframe: string;
  memberCount: number;
  winRate: number;
  dominantDirection: string;
  totalSamples: number;
  recentAccuracy: number;
  avgReturnPct: number;
  trend: string;
};

export type WeightedSignal = {
  direction: string;
  confidence: number;
  upVotes: number;
  downVotes: number;
  sidewaysVotes: number;
};

// --- Transition Matrix types ---

export type ArchetypeTransitionDto = {
  id: number;
  fromArchetypeId: number;
  fromArchetypeCode: string;
  toArchetypeId: number;
  toArchetypeCode: string;
  transitionCount: number;
  transitionProbability: number;
  avgReturnPct: number;
  avgBarsToTransition: number;
  lastSeenMs: number;
};

export type TransitionPredictionDto = {
  currentArchetypeId: number | null;
  currentArchetypeCode: string | null;
  similarity: number;
  topTransitions: ArchetypeTransitionDto[];
  entropyBits: number;
  predictability: string; // "High" | "Medium" | "Low"
  validated: boolean;
  reason: string | null;
};

export type SequencePredictionDto = {
  previousArchetypeCode: string | null;
  currentArchetypeCode: string | null;
  topSequences: {
    thirdArchetypeId: number;
    thirdArchetypeCode: string;
    occurrenceCount: number;
    outcomeUpRate: number;
    outcomeDownRate: number;
    outcomeSidewaysRate: number;
    avgReturnPct: number;
  }[];
  validated: boolean;
  reason: string | null;
};

export type EntropyRankingDto = {
  rank: number;
  archetypeId: number;
  archetypeCode: string;
  timeframe: string;
  windowSize: number;
  memberCount: number;
  entropyBits: number;
  predictability: string;
  topTransitionCode: string;
  topTransitionProb: number;
  validated: false;
  maturity: "Experimental";
  reason: string;
};

export type EntropyRankingResponseDto = {
  validated: false;
  maturity: "Experimental";
  reason: string;
  items: EntropyRankingDto[];
};

export type TransitionMatrixCell = {
  fromId: number;
  fromCode: string;
  toId: number;
  toCode: string;
  probability: number;
  count: number;
};

export type TransitionMatrixDto = {
  symbol: string;
  timeframe: string;
  windowSize: number;
  archetypeCount: number;
  totalTransitions: number;
  cells: TransitionMatrixCell[];
};
// --- Market Regime ---

export type MarketRegimeDto = {
  id: number;
  symbol: string;
  timeframe: string;
  openTimeMs: number;
  regimeType: "TrendingUp" | "TrendingDown" | "RangeBound" | "Breakout" | "Compression";
  trendStrength: number;
  volatilityScore: number;
  adx: number;
  plusDi: number;
  minusDi: number;
  atrRatio: number;
  bollingerBandwidth: number;
  createdAtUtc: string;
};

export type RegimeSummaryDto = {
  symbol: string;
  timeframe: string;
  currentRegime: MarketRegimeDto | null;
  distribution: {
    trendingUpPct: number;
    trendingDownPct: number;
    rangeBoundPct: number;
    breakoutPct: number;
    compressionPct: number;
  };
  recentTransitionsCount: number;
};

export type TimeframeAlignmentItem = {
  timeframe: string;
  weight: number;
  direction: "Bullish" | "Bearish" | "Neutral";
  directionalScore: number;
  regimeType: string;
  archetypeCode: string | null;
};

export type AiCapabilitiesDto = {
  mlInference: boolean;
  llmExplanation: boolean;
  provider: string;
  reason: string | null;
  fallbackExplanation: boolean;
};

export type ConfluenceSnapshotDto = {
  id: number;
  symbol: string;
  timeMs: number;
  confluenceScore: number; // 0 - 100
  overallDirection: "StrongBullish" | "Bullish" | "Neutral" | "Bearish" | "StrongBearish";
  timeframeAlignments: TimeframeAlignmentItem[];
  hasConflict: boolean;
  conflictDetails: string | null;
  createdAtUtc: string;
};

// --- Volume Profile ---

export type VolumeBinDto = {
  priceLevel: number;
  volume: number;
  volumePct: number;
  isPoc: boolean;
  isValueArea: boolean;
};

export type VolumeProfileDto = {
  id: number;
  symbol: string;
  timeframe: string;
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  bins: VolumeBinDto[];
  createdAtUtc: string;
};

// --- Smart Money Concepts ---

export type SmartMoneyStructureDto = {
  id: number;
  symbol: string;
  timeframe: string;
  timeMs: number;
  eventType: "BOS_BULL" | "BOS_BEAR" | "CHOCH_BULL" | "CHOCH_BEAR" | "FVG_BULL" | "FVG_BEAR" | "SWING_HIGH" | "SWING_LOW";
  price: number;
  highPrice: number | null;
  lowPrice: number | null;
  isMitigated: boolean;
  description: string;
  createdAtUtc: string;
};

export type SentimentSnapshotDto = {
  id: number;
  symbol: string;
  timeMs: number;
  fearGreedScore: number;
  fundingRateZScore: number;
  longShortRatio: number;
  newsSentimentScore: number;
  aggregatedSentiment: number;
  sentimentLabel: "ExtremeFear" | "Fear" | "Neutral" | "Greed" | "ExtremeGreed";
  createdAtUtc: string;
};

export type EnsembleLayerVoteDto = {
  layerName: string;
  weight: number;
  direction: "Bullish" | "Bearish" | "Sideways";
  probUp: number;
  probDown: number;
  probSideways: number;
  summary: string;
};

export type EnsemblePredictionDto = VersionedResearchRecord & {
  id: number;
  symbol: string;
  timeframe: string;
  timeMs: number;
  entryPrice?: number;
  finalDirection: "Bullish" | "Bearish" | "Sideways";
  probUp: number;
  probDown: number;
  probSideways: number;
  ensembleConfidence: number;
  layers?: EnsembleLayerVoteDto[];
  layerBreakdownJson?: string;
  actualPrice24h?: number | null;
  actualReturnPct?: number | null;
  evaluationStatus?: "T" | "F" | "N";
  evaluatedAtMs?: number | null;
  sourcePredictionId: number | null;
  createdAtUtc: string;
  validated: false;
  maturity: "Experimental";
  promotionEligible: false;
  promotionReason: string;
};

export type PredictionEvaluationSummaryDto = {
  symbol: string;
  totalPredictions: number;
  trueCount: number;
  falseCount: number;
  pendingCount: number;
  winRatePct: number;
  canonicalEvaluatedCount: number;
  canonicalTrueCount: number;
  canonicalFalseCount: number;
  canonicalPendingCount: number;
  canonicalWinRatePct: number;
  reevaluatedCount: number;
  reevaluatedTrueCount: number;
  reevaluatedFalseCount: number;
  reevaluatedPendingCount: number;
  reevaluatedWinRatePct: number;
  validated: false;
  maturity: "Experimental";
  promotionEligible: false;
  promotionReason: string;
  items: EnsemblePredictionDto[];
  reevaluatedItems: EnsemblePredictionDto[];
};

export type EpochWinRateDto = {
  epochName: string;
  periodDescription: string;
  totalSamples: number;
  trueCount: number;
  falseCount: number;
  winRatePct: number;
};

export type BatchReplayResultDto = {
  symbol: string;
  timeframe: string;
  totalTestedSamples: number;
  overallTrueCount: number;
  overallFalseCount: number;
  overallWinRatePct: number;
  epochBreakdown: EpochWinRateDto[];
};

export type EnsembleBacktestRunRequest = {
  symbol?: string;
  timeframe?: string;
  initialCapital?: number;
  feeBps?: number;
  minConfidence?: number;
  customWeights?: Record<string, number>;
};

export type WeightOptimizationResultDto = {
  symbol: string;
  timeframe: string;
  bestWeights: {
    confluence: number;
    markovTransitions: number;
    regime: number;
    smcVolumeProfile: number;
    sentiment: number;
  };
  sharpeRatio: number;
  totalReturnPct: number;
  winRate: number;
  testedCombinationsCount: number;
};

// --- AI Chat / Explainer Types ---
export type AiChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  evidenceTags?: string[];
  timestampMs: number;
};

export type AiChatResponseDto = {
  prompt: string;
  answer: string;
  evidenceTags: string[];
  timestampMs: number;
};

// --- Binance Market Data Types ---
export type MarketTicker = {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume: number;
  bidPrice: number;
  askPrice: number;
  count: number;
  closeTimeMs: number;
};

export type MarketTrade = {
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  timeMs: number;
  isBuyerMaker: boolean;
  isBuyer: boolean;
};

export type OrderBookEntry = {
  price: number;
  qty: number;
  total: number;
};

export type OrderBookDepth = {
  symbol: string;
  lastUpdateId: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
};

// --- Liquidation Heatmap Types ---
export type LiquidationBinDto = {
  price: number;
  cumulative_vol_usdt: number;
  side: "LONG" | "SHORT";
  density_pct: number;
  leverage_breakdown: Record<string, number>;
  distance_pct: number;
};

export type LiquidationSnapshotDto = {
  id: number;
  symbol: string;
  timeframe: string;
  timestampUtc: string;
  currentPrice: number;
  totalLongLiqUsdt: number;
  totalShortLiqUsdt: number;
  heatmapJson: string;
  heatmapBins?: LiquidationBinDto[];
  createdAtUtc: string;
};

// --- Execution & Live Testnet Trading Types ---
export type BinancePositionDto = {
  symbol: string;
  positionAmount: number;
  entryPrice: number;
  markPrice: number;
  unrealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
  marginType: string;
};

export type BinanceAccountBalanceResult = {
  success: boolean;
  message: string;
  totalWalletBalance: number;
  availableBalance: number;
  totalUnrealizedProfit: number;
  positions: BinancePositionDto[];
};

export type BinanceOrderResult = {
  success: boolean;
  message: string;
  orderId?: number;
  clientOrderId?: string;
  symbol?: string;
  status?: string;
  executedQty?: number;
  avgPrice?: number;
};

export type BinanceOrderRequest = {
  symbol: string;
  side: "BUY" | "SELL" | "LONG" | "SHORT";
  quantity: number;
  stopPrice?: number;
};

export type StreamStatusDto = {
  connected: boolean;
  listenKey: string;
  lastKeepAliveTime: string;
  lastMessageTime: string;
  connectionDuration: string;
  reconnectCount: number;
};

export type WalletBalanceSnapshotDto = {
  id: number;
  asset: string;
  walletBalance: number;
  crossWalletBalance: number;
  balanceChange: number;
  totalUnrealizedProfit: number;
  eventReasonType: string;
  symbol?: string | null;
  positionAmount?: number | null;
  entryPrice?: number | null;
  unrealizedPnL?: number | null;
  timestamp: string;
};

// --- Data Audit & Backfill Types ---
export type TimeframeAuditSummary = {
  timeframe: string;
  totalKlines: number;
  minOpenTimeMs: number | null;
  maxOpenTimeMs: number | null;
  expectedCount: number | null;
  gapsCount: number;
  dataCoveragePct: number;
  largestGapMs: number;
  candlePatternsCount: number;
  technicalIndicatorsCount: number;
  windowVectorsCount: number;
  mlFeatureStoresCount: number;
  priceTargetsCount: number;
  windowClassificationDatasetsCount: number;
  gaps: Array<{ startMs: number; endMs: number; missingCount: number }>;
};

export type DataAuditResponse = {
  symbol: string;
  generatedAtUtc: string;
  timeframes: TimeframeAuditSummary[];
  news: {
    articles: number;
    chunks: number;
    minDate: string | null;
    maxDate: string | null;
  };
  rulesAlerts: { rules: number; signals: number; alerts: number };
};

export type BackfillStartInfo = {
  requestId: string;
  symbol: string;
  status: string;
  message: string;
  timeframes: string[];
};

export type PatternIndexStatusDto = {
  requestId: string;
  symbol: string;
  timeframe: string;
  featureType: string;
  windowSize: number;
  count: number;
  lastUpdatedUtc: string;
};

export type CandleVolumeStatItem = {
  id: number;
  symbol: string;
  timeframe: string;
  openTimeMs: number;
  volume: number;
  volumeZScore: number;
  isVolumeSpike: boolean;
  relativeVolumeRatio: number;
};
