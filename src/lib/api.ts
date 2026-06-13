const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5197";

async function getJson(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getBtcKlines({
  interval = "1h",
  limit = 200,
  startTimeMs,
  endTimeMs,
}: {
  interval?: string;
  limit?: number;
  startTimeMs?: number;
  endTimeMs?: number;
}) {
  const params = new URLSearchParams({ interval, limit: String(limit) });
  if (startTimeMs != null) params.set("startTimeMs", String(startTimeMs));
  if (endTimeMs != null) params.set("endTimeMs", String(endTimeMs));
  const res = await fetch(`${API_BASE}/api/market/btc/klines?${params}`);
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

export async function getBitcoinAnalysis() {
  const res = await fetch(`${API_BASE}/api/analysis/bitcoin`);
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
