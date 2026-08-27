const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getBtcKlines({
  symbol = "BTCUSDT",
  interval = "1h",
  limit = 200,
  startTimeMs,
  endTimeMs,
}: {
  symbol?: string;
  interval?: string;
  limit?: number;
  startTimeMs?: number;
  endTimeMs?: number;
} = {}) {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  if (startTimeMs != null) params.set("startTimeMs", String(startTimeMs));
  if (endTimeMs != null) params.set("endTimeMs", String(endTimeMs));
  const res = await fetch(`${API_BASE}/api/market/klines?${params}`);
  return getJson(res);
}

export async function getMarketTickers() {
  const res = await fetch(`${API_BASE}/api/market/tickers`);
  return getJson(res);
}

export async function getMarketTrades(symbol = "BTCUSDT", limit = 50) {
  const params = new URLSearchParams({ symbol, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/trades?${params}`);
  return getJson(res);
}

export async function getOrderBookDepth(symbol = "BTCUSDT", limit = 20) {
  const params = new URLSearchParams({ symbol, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/depth?${params}`);
  return getJson(res);
}


export async function getCandlesAround({
  symbol,
  timeframe,
  timeMs,
  beforeBars = 120,
  afterBars = 120,
}: {
  symbol: string;
  timeframe: string;
  timeMs: number;
  beforeBars?: number;
  afterBars?: number;
}) {
  const params = new URLSearchParams({
    symbol,
    timeframe,
    timeMs: String(timeMs),
    beforeBars: String(beforeBars),
    afterBars: String(afterBars),
  });
  const res = await fetch(`${API_BASE}/api/market/candles/around?${params}`);
  return getJson(res);
}

export async function searchPatterns(payload: {
  symbol: string;
  timeframe: string;
  featureType: string;
  lookbackBars?: number;
  windowSize?: number;
  topK?: number;
  minGapBars?: number;
}) {
  const res = await fetch(`${API_BASE}/api/market/pattern-search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lookbackBars: 3000,
      windowSize: 10,
      topK: 10,
      minGapBars: 10,
      ...payload,
    }),
  });
  return getJson(res);
}

export async function getNews({ page = 1, pageSize = 12 } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`${API_BASE}/api/news?${params}`);
  const data = await getJson(res);
  return (data.items ?? []) as import("./types").NewsItem[];
}

export async function getAlertSettings(userId: string) {
  const res = await fetch(`${API_BASE}/api/alert-settings?userId=${encodeURIComponent(userId)}`);
  if (res.status === 404) return null;
  return getJson(res);
}

export async function putAlertSettings(userId: string, body: import("./types").AlertSettingsDto) {
  const res = await fetch(`${API_BASE}/api/alert-settings?userId=${encodeURIComponent(userId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return getJson(res);
}

export async function getAlerts(userId: string, take = 30) {
  const params = new URLSearchParams({ userId, take: String(take) });
  const res = await fetch(`${API_BASE}/api/alerts?${params}`);
  return getJson(res);
}

export async function getUnreadCount(userId: string) {
  const res = await fetch(`${API_BASE}/api/alerts/unread-count?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) return 0;
  const data = await res.json().catch(() => ({}));
  return typeof data.unreadCount === "number" ? data.unreadCount : Number(data.unreadCount) || 0;
}

export async function markAlertRead(id: string) {
  const res = await fetch(`${API_BASE}/api/alerts/${id}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Mark read failed");
}

export async function markAllAlertsRead(userId: string) {
  const res = await fetch(`${API_BASE}/api/alerts/read-all?userId=${encodeURIComponent(userId)}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Mark all read failed");
}

export async function deleteAlert(id: string, userId: string) {
  const res = await fetch(`${API_BASE}/api/alerts/${id}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete failed");
}

export async function deleteAllAlerts(userId: string) {
  const res = await fetch(`${API_BASE}/api/alerts?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Delete all failed");
}

export async function indexCandlePatterns(payload: {
  symbol?: string;
  timeframe?: string;
  lookbackBars?: number;
}) {
  const { symbol = "BTCUSDT", timeframe = "1h", lookbackBars = 500 } = payload;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    lookbackBars: String(lookbackBars),
  });
  const res = await fetch(`${API_BASE}/api/market/candle-patterns/index?${params}`, {
    method: "POST",
  });
  return getJson(res) as Promise<import("./types").IndexCandlePatternsResponse>;
}

export async function getCandlePatternsByType(payload: {
  symbol?: string;
  timeframe?: string;
  patternType: string;
  page?: number;
  pageSize?: number;
}) {
  const {
    symbol = "BTCUSDT",
    timeframe = "1h",
    patternType,
    page = 1,
    pageSize = 50,
  } = payload;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    patternType,
    page: String(page),
    pageSize: String(pageSize),
  });
  const res = await fetch(`${API_BASE}/api/market/candle-patterns?${params}`);
  return getJson(res) as Promise<import("./types").CandlePatternListResponse>;
}

export async function getBitcoinAnalysis(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/analysis/analyze?${params}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return JSON.parse(text) as import("./types").AnalysisResult;
}

// --- Sequence Rules / Discovery ---
export async function evaluateSequenceRules(symbol = "BTCUSDT", timeframe = "1h", limit = 50) {
  const params = new URLSearchParams({ symbol, timeframe, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/discovery/evaluate?${params}`, { method: "POST" });
  return getJson(res);
}

export async function runDiscovery(
  symbol = "BTCUSDT",
  timeframe = "1h",
  lookbackBars = 2000,
  futureBars = 5,
  minWinRate = 0.55,
  minSamples = 15,
  minAvgReturnPct = 0.3,
  saveToDb = true
) {
  const params = new URLSearchParams({
    symbol,
    timeframe,
    lookbackBars: String(lookbackBars),
    futureBars: String(futureBars),
    minWinRate: String(minWinRate),
    minSamples: String(minSamples),
    minAvgReturnPct: String(minAvgReturnPct),
    saveToDb: String(saveToDb),
  });
  const res = await fetch(`${API_BASE}/api/discovery/run?${params}`, { method: "POST" });
  return getJson(res);
}

export async function getDiscoveredRules(params?: { symbol?: string; timeframe?: string }) {
  const qs = new URLSearchParams();
  if (params?.symbol) qs.set("symbol", params.symbol);
  if (params?.timeframe) qs.set("timeframe", params.timeframe);
  const res = await fetch(`${API_BASE}/api/discovery/rules?${qs}`);
  return getJson(res) as Promise<import("./types").SequenceRule[]>;
}

export async function clearDiscoveredRules() {
  const res = await fetch(`${API_BASE}/api/discovery/clear`, { method: "POST" });
  return getJson(res);
}

// --- Sequence / structure analysis ---
export async function getMarketStructure(symbol = "BTCUSDT", interval = "1h", limit = 200) {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/market-structure?${params}`);
  return getJson(res) as Promise<import("./types").MarketStructureResponse>;
}

export async function getSequenceScenarios(symbol = "BTCUSDT", interval = "1h", limit = 50) {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/sequence-scenarios?${params}`);
  return getJson(res) as Promise<import("./types").SequenceScenariosResponse>;
}

export async function validateCandles(symbol = "BTCUSDT", interval = "1h", limit = 100) {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/validate-candles?${params}`);
  return getJson(res) as Promise<import("./types").ValidateCandlesResponse>;
}

// --- Prediction / Backtest ---

export async function getLatestPrediction(payload: {
  symbol?: string;
  timeframe?: string;
  windowSize?: number;
  horizon?: string;
  modelName?: string;
}) {
  const { symbol = "BTCUSDT", timeframe = "1h", windowSize = 5, horizon = "1h", modelName } = payload;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    windowSize: String(windowSize),
    horizon,
  });
  if (modelName) params.set("modelName", modelName);
  const res = await fetch(`${API_BASE}/api/prediction/latest?${params}`);
  return getJson(res) as Promise<import("./types").PredictionResult>;
}

export async function getPredictionHistory(symbol = "BTCUSDT", timeframe = "1h", take = 100) {
  const params = new URLSearchParams({ symbol, timeframe, take: String(take) });
  const res = await fetch(`${API_BASE}/api/prediction/history?${params}`);
  return getJson(res) as Promise<{ symbol: string; timeframe: string; count: number; items: import("./types").ModelPredictionItem[] }>;
}

export async function getAvailableModels() {
  const res = await fetch(`${API_BASE}/api/prediction/models`);
  return getJson(res) as Promise<{ models: import("./types").AvailableModel[] }>;
}

export async function auditPredictions(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/prediction/audit?${params}`, { method: "POST" });
  return getJson(res) as Promise<{ symbol: string; timeframe: string; totalPending: number; evaluatedCount: number; message: string }>;
}

export async function getPredictionAccuracy(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/prediction/accuracy?${params}`);
  return getJson(res) as Promise<import("./types").PredictionAccuracySummaryDto>;
}

export async function getBacktestRuns(symbol = "BTCUSDT", timeframe?: string, take = 50) {
  const params = new URLSearchParams({ symbol, take: String(take) });
  if (timeframe) params.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/backtest/runs?${params}`);
  return getJson(res) as Promise<{ symbol: string; timeframe?: string; count: number; items: import("./types").BacktestRunSummary[] }>;
}

export async function getBacktestRunDetail(id: number) {
  const res = await fetch(`${API_BASE}/api/backtest/runs/${id}`);
  return getJson(res) as Promise<import("./types").BacktestRunSummary & { trades: import("./types").BacktestTradeItem[]; metricsJson: string; equityCurveJson: string }>;
}

// --- Paper Trading ---
export async function getPaperTrades(params?: {
  symbol?: string;
  timeframe?: string;
  status?: string;
  side?: string;
  take?: number;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.symbol) qs.set("symbol", params.symbol);
  if (params?.timeframe) qs.set("timeframe", params.timeframe);
  if (params?.status) qs.set("status", params.status);
  if (params?.side) qs.set("side", params.side);
  if (params?.take) qs.set("take", String(params.take));
  if (params?.page) qs.set("page", String(params.page));
  const res = await fetch(`${API_BASE}/api/paper-trades?${qs}`);
  return getJson(res) as Promise<{ symbol: string; count: number; items: import("./types").PaperTradeItem[] }>;
}

export async function getPaperTradeSummary(symbol = "BTCUSDT", timeframe?: string) {
  const qs = new URLSearchParams({ symbol });
  if (timeframe) qs.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/paper-trades/summary?${qs}`);
  return getJson(res) as Promise<import("./types").PaperTradeSummary>;
}

export async function getPaperTradeEquityCurve(symbol = "BTCUSDT", timeframe?: string) {
  const qs = new URLSearchParams({ symbol });
  if (timeframe) qs.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/paper-trades/equity-curve?${qs}`);
  return getJson(res) as Promise<{ symbol: string; points: import("./types").EquityCurvePoint[] }>;
}

export async function getPortfolioSummary(): Promise<import("./types").PortfolioSummaryResponse> {
  const res = await fetch(`${API_BASE}/api/paper-trades/portfolio-summary`);
  return getJson(res) as Promise<import("./types").PortfolioSummaryResponse>;
}

export async function getMultiAssetPaperTrades(
  params: import("./types").PaperTradeFilterParams
): Promise<import("./types").PaginatedPaperTrades> {
  const qs = new URLSearchParams();
  if (params.symbols) qs.set("symbols", params.symbols);
  if (params.timeframe && params.timeframe !== "all") qs.set("timeframe", params.timeframe);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.side && params.side !== "all") qs.set("side", params.side);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.fromDate) qs.set("fromDate", params.fromDate);
  if (params.toDate) qs.set("toDate", params.toDate);
  const res = await fetch(`${API_BASE}/api/paper-trades?${qs}`);
  return getJson(res) as Promise<import("./types").PaginatedPaperTrades>;
}

export async function getOpenPaperTrades(symbol = "BTCUSDT") {
  const res = await fetch(`${API_BASE}/api/paper-trades/open?symbol=${encodeURIComponent(symbol)}`);
  return getJson(res) as Promise<{ symbol: string; count: number; items: import("./types").PaperTradeItem[] }>;
}

// --- Telegram ---
export async function testTelegram() {
  const res = await fetch(`${API_BASE}/api/telegram/test`, { method: "POST" });
  return getJson(res) as Promise<{ success: boolean; message: string }>;
}

export async function getTelegramStatus() {
  const res = await fetch(`${API_BASE}/api/telegram/status`);
  return getJson(res) as Promise<{ enabled: boolean; configured: boolean }>;
}

// --- Archetype API ---

export async function getArchetypes(params: {
  symbol?: string; timeframe?: string; windowSize?: number;
  sortBy?: string; page?: number; pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const res = await fetch(`${API_BASE}/api/archetypes?${qs}`);
  return getJson(res);
}

export async function getArchetypeDetail(id: number) {
  const res = await fetch(`${API_BASE}/api/archetypes/${id}`);
  return getJson(res);
}

export async function getArchetypeOccurrences(id: number, params: {
  horizon?: string; page?: number; pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params.horizon) qs.set("horizon", params.horizon);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  const res = await fetch(`${API_BASE}/api/archetypes/${id}/occurrences?${qs}`);
  return getJson(res);
}

export async function matchCurrentArchetype(params: {
  symbol?: string; timeframe?: string; windowSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  const res = await fetch(`${API_BASE}/api/archetypes/match?${qs}`);
  return getJson(res);
}

export async function matchMultiWindow(symbol?: string, timeframe?: string) {
  const qs = new URLSearchParams();
  if (symbol) qs.set("symbol", symbol);
  if (timeframe) qs.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/archetypes/match-multi?${qs}`);
  return getJson(res);
}

export async function getArchetypeRankings(params: {
  symbol?: string; timeframe?: string; windowSize?: number;
  horizon?: string; sortBy?: string; top?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  if (params.horizon) qs.set("horizon", params.horizon);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.top) qs.set("top", String(params.top));
  const res = await fetch(`${API_BASE}/api/archetypes/rankings?${qs}`);
  return getJson(res);
}

// --- Transition Matrix API ---

export async function getTransitionsFrom(id: number, top = 10) {
  const res = await fetch(`${API_BASE}/api/transitions/from/${id}?top=${top}`);
  return getJson(res) as Promise<{ archetypeId: number; transitions: import("./types").ArchetypeTransitionDto[] }>;
}

export async function getTransitionsTo(id: number, top = 10) {
  const res = await fetch(`${API_BASE}/api/transitions/to/${id}?top=${top}`);
  return getJson(res) as Promise<{ archetypeId: number; transitions: import("./types").ArchetypeTransitionDto[] }>;
}

export async function predictNextArchetype(params: {
  symbol?: string; timeframe?: string; windowSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  const res = await fetch(`${API_BASE}/api/transitions/predict?${qs}`);
  return getJson(res) as Promise<import("./types").TransitionPredictionDto>;
}

export async function predictSequence(params: {
  symbol?: string; timeframe?: string; windowSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  const res = await fetch(`${API_BASE}/api/transitions/predict-sequence?${qs}`);
  return getJson(res) as Promise<import("./types").SequencePredictionDto>;
}

export async function getEntropyRanking(params: {
  symbol?: string; timeframe?: string; windowSize?: number; top?: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  if (params.windowSize) qs.set("windowSize", String(params.windowSize));
  if (params.top) qs.set("top", String(params.top));
  const res = await fetch(`${API_BASE}/api/transitions/entropy-ranking?${qs}`);
  return getJson(res) as Promise<{ items: import("./types").EntropyRankingDto[] }>;
}

export async function getTransitionMatrix(params: {
  symbol?: string; timeframe?: string; windowSize: number;
}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", params.symbol);
  if (params.timeframe) qs.set("timeframe", params.timeframe);
  qs.set("windowSize", String(params.windowSize));
  const res = await fetch(`${API_BASE}/api/transitions/matrix?${qs}`);
  return getJson(res) as Promise<import("./types").TransitionMatrixDto>;
}

// --- Market Regime ---

export async function getCurrentRegime(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/regime/current?${params}`);
  return getJson(res) as Promise<import("./types").MarketRegimeDto>;
}

export async function getRegimeHistory(symbol = "BTCUSDT", timeframe = "1h", limit = 100) {
  const params = new URLSearchParams({ symbol, timeframe, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/regime/history?${params}`);
  return getJson(res) as Promise<import("./types").MarketRegimeDto[]>;
}

export async function getRegimeSummary(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/regime/summary?${params}`);
  return getJson(res) as Promise<import("./types").RegimeSummaryDto>;
}

export async function buildRegimes(symbol = "BTCUSDT", timeframe = "1h", lookbackBars = 2000) {
  const params = new URLSearchParams({ symbol, timeframe, lookbackBars: String(lookbackBars) });
  const res = await fetch(`${API_BASE}/api/regime/build?${params}`, { method: "POST" });
  return getJson(res);
}

// --- Confluence ---

export async function getConfluenceCurrent(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/confluence/current?${params}`);
  return getJson(res) as Promise<import("./types").ConfluenceSnapshotDto>;
}

export async function getConfluenceHistory(symbol = "BTCUSDT", limit = 50) {
  const params = new URLSearchParams({ symbol, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/confluence/history?${params}`);
  return getJson(res) as Promise<import("./types").ConfluenceSnapshotDto[]>;
}

export async function calculateConfluence(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/confluence/calculate?${params}`, { method: "POST" });
  return getJson(res) as Promise<import("./types").ConfluenceSnapshotDto>;
}

// --- Volume Profile ---
export async function getVolumeProfile(symbol = "BTCUSDT", timeframe = "1h", lookbackBars = 200) {
  const params = new URLSearchParams({ symbol, timeframe, lookbackBars: String(lookbackBars) });
  const res = await fetch(`${API_BASE}/api/volume-profile/current?${params}`);
  return getJson(res) as Promise<import("./types").VolumeProfileDto>;
}

// --- Smart Money Concepts ---
export async function getSmartMoneyStructures(symbol = "BTCUSDT", timeframe = "1h", lookbackBars = 200) {
  const params = new URLSearchParams({ symbol, timeframe, lookbackBars: String(lookbackBars) });
  const res = await fetch(`${API_BASE}/api/smart-money/structures?${params}`);
  return getJson(res) as Promise<import("./types").SmartMoneyStructureDto[]>;
}

export async function getSentimentCurrent(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/sentiment/current?${params}`);
  return getJson(res) as Promise<import("./types").SentimentSnapshotDto>;
}

export async function getSentimentHistory(symbol = "BTCUSDT", limit = 50) {
  const params = new URLSearchParams({ symbol, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/sentiment/history?${params}`);
  return getJson(res) as Promise<import("./types").SentimentSnapshotDto[]>;
}

export async function getEnsemblePredict(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/ensemble/predict?${params}`);
  return getJson(res) as Promise<import("./types").EnsemblePredictionDto>;
}

export async function getEnsembleHistory(symbol = "BTCUSDT", timeframe = "1h", limit = 50) {
  const params = new URLSearchParams({ symbol, timeframe, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/ensemble/history?${params}`);
  return getJson(res) as Promise<import("./types").EnsemblePredictionDto[]>;
}

export async function evaluateEnsemblePredictions(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/ensemble/evaluate?${params}`, { method: "POST" });
  return getJson(res) as Promise<import("./types").PredictionEvaluationSummaryDto>;
}

export async function getEnsembleEvaluations(symbol = "BTCUSDT") {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/ensemble/evaluations?${params}`);
  return getJson(res) as Promise<import("./types").PredictionEvaluationSummaryDto>;
}

export async function runBatchReplay(sampleCount = 2000, minConfidence = 0.60, symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ sampleCount: String(sampleCount), minConfidence: String(minConfidence), symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/ensemble/batch-replay?${params}`, { method: "POST" });
  return getJson(res) as Promise<import("./types").BatchReplayResultDto>;
}

export async function runEnsembleBacktest(payload: import("./types").EnsembleBacktestRunRequest = {}) {
  const res = await fetch(`${API_BASE}/api/ensemble-backtest/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return getJson(res) as Promise<import("./types").BacktestRunSummary & { trades: import("./types").BacktestTradeItem[]; equityCurve: import("./types").EquityCurvePoint[] }>;
}

export async function optimizeEnsembleWeights(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/ensemble-backtest/optimize?${params}`, { method: "POST" });
  return getJson(res) as Promise<import("./types").WeightOptimizationResultDto>;
}

export async function evaluateEnsemblePaperTrade(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/paper-trades/evaluate-ensemble?${params}`, { method: "POST" });
  return getJson(res);
}

// --- AI Chat / Explainer API ---
export async function queryAiChat(payload: { symbol?: string; timeframe?: string; prompt?: string }) {
  const res = await fetch(`${API_BASE}/api/ai-chat/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return getJson(res) as Promise<import("./types").AiChatResponseDto>;
}

export async function streamAiChat({
  symbol = "BTCUSDT",
  timeframe = "1h",
  prompt = "",
  signal,
  onToken,
  onComplete,
  onError,
}: {
  symbol?: string;
  timeframe?: string;
  prompt?: string;
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onComplete: (evidenceTags?: string[]) => void;
  onError?: (err: Error) => void;
}) {
  try {
    const res = await fetch(`${API_BASE}/api/ai-chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, timeframe, prompt }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    if (!res.body) {
      throw new Error("ReadableStream not supported by browser/backend");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        if (signal?.aborted) {
          reader.cancel().catch(() => {});
          break;
        }

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.substring(5).trim();
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.token) {
                onToken(data.token);
              }
              if (data.done) {
                const tags = data.evidence_tags || data.evidenceTags;
                onComplete(tags);
                return;
              }
            } catch {
              // Raw text fallback if not JSON
              onToken(jsonStr);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onComplete();
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      // Graceful stream abort
      return;
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    if (onError) onError(errorObj);
    else throw errorObj;
  }
}

// --- Liquidation Snapshot APIs ---
export async function getLiquidationSnapshot(symbol = "BTCUSDT", timeframe = "1h"): Promise<import("./types").LiquidationSnapshotDto> {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/liquidation/latest?${params}`);
  const data = await getJson(res);
  if (data && typeof data.heatmapJson === "string") {
    try {
      data.heatmapBins = JSON.parse(data.heatmapJson);
    } catch {
      data.heatmapBins = [];
    }
  }
  return data;
}

export async function getLiquidationHistory(symbol = "BTCUSDT", timeframe = "1h", limit = 20): Promise<import("./types").LiquidationSnapshotDto[]> {
  const params = new URLSearchParams({ symbol, timeframe, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/liquidation/history?${params}`);
  return getJson(res);
}

// --- Sentiment APIs ---
export async function getCurrentSentiment(symbol = "BTCUSDT"): Promise<import("./types").SentimentSnapshotDto> {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/sentiment/current?${params}`);
  return getJson(res);
}

export async function refreshSentiment(symbol = "BTCUSDT"): Promise<import("./types").SentimentSnapshotDto> {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/sentiment/refresh?${params}`, { method: "POST" });
  return getJson(res);
}

// --- Live Execution & Testnet APIs ---

export async function getExecutionAccount(): Promise<import("./types").BinanceAccountBalanceResult> {
  const res = await fetch(`${API_BASE}/api/execution/account`);
  return getJson(res);
}

export async function placeMarketOrder(payload: {
  symbol: string;
  side: "BUY" | "SELL" | "LONG" | "SHORT";
  quantity: number;
}): Promise<import("./types").BinanceOrderResult> {
  const res = await fetch(`${API_BASE}/api/execution/market-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return getJson(res);
}

export async function placeStopLossOrder(payload: {
  symbol: string;
  side: "BUY" | "SELL" | "LONG" | "SHORT";
  quantity: number;
  stopPrice: number;
}): Promise<import("./types").BinanceOrderResult> {
  const res = await fetch(`${API_BASE}/api/execution/stop-loss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return getJson(res);
}

export async function placeTakeProfitOrder(payload: {
  symbol: string;
  side: "BUY" | "SELL" | "LONG" | "SHORT";
  quantity: number;
  stopPrice: number;
}): Promise<import("./types").BinanceOrderResult> {
  const res = await fetch(`${API_BASE}/api/execution/take-profit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return getJson(res);
}

export async function cancelAllExecutionOrders(symbol = "BTCUSDT"): Promise<import("./types").BinanceOrderResult> {
  const res = await fetch(`${API_BASE}/api/execution/orders/${encodeURIComponent(symbol)}`, {
    method: "DELETE",
  });
  return getJson(res);
}

export async function getExecutionStreamStatus(): Promise<import("./types").StreamStatusDto> {
  const res = await fetch(`${API_BASE}/api/execution/stream-status`);
  return getJson(res);
}

export async function reconnectExecutionStream(): Promise<{ message: string; status: import("./types").StreamStatusDto }> {
  const res = await fetch(`${API_BASE}/api/execution/stream/reconnect`, {
    method: "POST",
  });
  return getJson(res);
}

export async function getExecutionBalanceSnapshots(asset = "USDT", limit = 100): Promise<import("./types").WalletBalanceSnapshotDto[]> {
  const params = new URLSearchParams({ asset, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/execution/balance-snapshots?${params}`);
  return getJson(res);
}

// --- Data Audit, Backfill & Indexing APIs ---

export async function getDataAudit(symbol = "BTCUSDT"): Promise<import("./types").DataAuditResponse> {
  const params = new URLSearchParams({ symbol });
  const res = await fetch(`${API_BASE}/api/market/data-audit?${params}`);
  return getJson(res);
}

export async function backfillKlines(options: {
  symbol?: string;
  timeframe?: string;
  startDateUtc?: string;
  endDateUtc?: string;
  requestsPerMinuteLimit?: number;
  wait?: boolean;
  fillGaps?: boolean;
} = {}): Promise<import("./types").BackfillStartInfo> {
  const params = new URLSearchParams();
  if (options.symbol) params.set("symbol", options.symbol);
  if (options.timeframe) params.set("timeframe", options.timeframe);
  if (options.startDateUtc) params.set("startDateUtc", options.startDateUtc);
  if (options.endDateUtc) params.set("endDateUtc", options.endDateUtc);
  if (options.requestsPerMinuteLimit) params.set("requestsPerMinuteLimit", String(options.requestsPerMinuteLimit));
  if (options.wait !== undefined) params.set("wait", String(options.wait));
  if (options.fillGaps !== undefined) params.set("fillGaps", String(options.fillGaps));

  const res = await fetch(`${API_BASE}/api/market/klines/backfill?${params}`, {
    method: "POST",
  });
  return getJson(res);
}

export async function getPatternIndexStatus(options: {
  symbol?: string;
  timeframe?: string;
  featureType?: string;
  windowSize?: number;
} = {}): Promise<import("./types").PatternIndexStatusDto> {
  const { symbol = "BTCUSDT", timeframe = "15m", featureType = "all", windowSize = 10 } = options;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    featureType,
    windowSize: String(windowSize),
  });
  const res = await fetch(`${API_BASE}/api/market/pattern-index/status?${params}`);
  return getJson(res);
}

export async function rebuildPatternIndex(options: {
  symbol?: string;
  timeframe?: string;
  featureType?: string;
  lookbackBars?: number;
  windowSize?: number;
} = {}) {
  const { symbol = "BTCUSDT", timeframe = "15m", featureType = "all", lookbackBars = 5000, windowSize = 10 } = options;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    featureType,
    lookbackBars: String(lookbackBars),
    windowSize: String(windowSize),
  });
  const res = await fetch(`${API_BASE}/api/market/pattern-index/rebuild?${params}`, { method: "POST" });
  return getJson(res);
}

export async function warmupPatternIndex(options: {
  symbol?: string;
  timeframe?: string;
  lookbackBars?: number;
  windowSize?: number;
} = {}) {
  const { symbol = "BTCUSDT", timeframe = "15m", lookbackBars = 5000, windowSize } = options;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    lookbackBars: String(lookbackBars),
  });
  if (windowSize != null) params.set("windowSize", String(windowSize));
  const res = await fetch(`${API_BASE}/api/market/pattern-index/warmup?${params}`, { method: "POST" });
  return getJson(res);
}

export async function getWindowDataset(options: {
  symbol?: string;
  timeframe?: string;
  windowSize?: number;
  horizon?: string;
  label?: number;
  page?: number;
  take?: number;
} = {}) {
  const { symbol = "BTCUSDT", timeframe = "1h", windowSize = 10, horizon = "1d", label, page = 1, take = 100 } = options;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    windowSize: String(windowSize),
    horizon,
    page: String(page),
    take: String(take),
  });
  if (label != null) params.set("label", String(label));
  const res = await fetch(`${API_BASE}/api/market/window-dataset?${params}`);
  return getJson(res);
}

export async function buildWindowDataset(options: {
  symbol?: string;
  timeframe?: string;
  windowSize?: number;
  horizon?: string;
} = {}) {
  const { symbol = "BTCUSDT", timeframe = "1h", windowSize = 10, horizon = "1d" } = options;
  const params = new URLSearchParams({
    symbol,
    timeframe,
    windowSize: String(windowSize),
    horizon,
  });
  const res = await fetch(`${API_BASE}/api/market/window-dataset/build?${params}`, { method: "POST" });
  return getJson(res);
}

export async function buildMlDataset(symbol = "BTCUSDT", timeframe = "1h") {
  const params = new URLSearchParams({ symbol, timeframe });
  const res = await fetch(`${API_BASE}/api/market/ml-dataset/build?${params}`, { method: "POST" });
  return getJson(res);
}

export async function indexTechnicalIndicators(symbol = "BTCUSDT", timeframe?: string) {
  const params = new URLSearchParams({ symbol });
  if (timeframe) params.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/indexer/technical-indicators?${params}`, { method: "POST" });
  return getJson(res);
}

export async function rebuildMlDatasetFromIndexer(symbol = "BTCUSDT", timeframe?: string) {
  const params = new URLSearchParams({ symbol });
  if (timeframe) params.set("timeframe", timeframe);
  const res = await fetch(`${API_BASE}/api/indexer/ml-dataset?${params}`, { method: "POST" });
  return getJson(res);
}

export async function indexVolumeStats(symbol = "BTCUSDT", timeframe = "1h", lookbackBars = 2000) {
  const params = new URLSearchParams({ symbol, timeframe, lookbackBars: String(lookbackBars) });
  const res = await fetch(`${API_BASE}/api/discovery/index-volume?${params}`, { method: "POST" });
  return getJson(res);
}

export async function getVolumeStats(symbol = "BTCUSDT", timeframe = "1h", take = 100): Promise<{ symbol: string; timeframe: string; count: number; items: import("./types").CandleVolumeStatItem[] }> {
  const params = new URLSearchParams({ symbol, timeframe, take: String(take) });
  const res = await fetch(`${API_BASE}/api/discovery/volume-stats?${params}`);
  return getJson(res);
}

export async function buildTransitionMatrix() {
  const res = await fetch(`${API_BASE}/api/transitions/build`, { method: "POST" });
  return getJson(res);
}

export async function getRagNewsContext(query: string, topK = 8): Promise<{ query: string; topK: number; news_context: string }> {
  const params = new URLSearchParams({ query, topK: String(topK) });
  const res = await fetch(`${API_BASE}/api/rag/news-context?${params}`);
  return getJson(res);
}

export async function getTechSummary(symbol = "BTCUSDT", interval = "1h", limit = 48): Promise<{ interval: string; limit: number; tech_context: string }> {
  const params = new URLSearchParams({ symbol, interval, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/market/btc/tech-summary?${params}`);
  return getJson(res);
}
