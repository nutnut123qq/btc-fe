import { expect, type Page, type Route } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

// Shared mocked backend for the /co-phieu equity specs (EQX-C1/C2), mirroring
// spec §2/§5/§6/§7/§8/§11. Paths are matched on URL.pathname (pitfall #22).

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

export const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const BASE_OPEN = 1_760_544_000_000; // 2025-10-15T00:00:00Z
export const LAST_OPEN = BASE_OPEN + 29 * DAY_MS;

export type Sym = "MBB" | "BID";
const PRICE: Record<Sym, number> = { MBB: 23_800, BID: 41_200 };

function candles(symbol: Sym, timeframe: string) {
  const step = timeframe === "1h" ? HOUR_MS : DAY_MS;
  return Array.from({ length: 30 }, (_, i) => {
    const openTimeMs = BASE_OPEN + i * step;
    const close = PRICE[symbol] + i * 40;
    return {
      openTimeMs,
      timeIso: new Date(openTimeMs).toISOString(),
      open: close - 200,
      high: close + 300,
      low: close - 400,
      close,
      volume: 1_200_000 + i * 10_000,
      closeTimeMs: openTimeMs + step - 1,
      quoteVolume: null,
      tradeCount: null,
      takerBuyVolume: null,
      takerBuyQuoteVolume: null,
    };
  });
}

const conditions = (timeframe: string) => ({
  timeframe,
  asOfMs: LAST_OPEN,
  latestClosedBar: null,
  analysisWindow: null,
  contract: { definitionsSha256: "0".repeat(64) },
  conditions: [],
  evidence: { available: false, reason: "no-verified-evidence-bundle", runId: null, manifestSha256: null, specSha256: null, cutoffMs: null, evidenceAgeBars: null },
  conflicts: [],
  warnings: [],
  unavailableModules: [],
  generatedAtMs: LAST_OPEN + 1_000,
});

const SHARES: Record<Sym, number> = { MBB: 200, BID: 100 };

const decision = (symbol: Sym) => ({
  symbol,
  action: symbol === "MBB" ? "hold" : "wait",
  reasons: [`Lý do riêng của ${symbol}`],
  triggers: [],
  invalidation: null,
  position: {
    totalShares: SHARES[symbol],
    settledShares: SHARES[symbol],
    pendingShares: 0,
    sellableSharesNow: SHARES[symbol],
    avgCostPerShareVnd: PRICE[symbol] + 500,
    lastPriceVnd: PRICE[symbol],
    unrealizedPnlVnd: -100_000,
    unrealizedPnlPct: -2,
    netProceedsIfSellableNowVnd: null,
  },
  buyMore: null,
  market: {
    trend: "sideways", rsiZone: "neutral", rsi14: 48, atr14: 500, sma50: null, ema50: null,
    lastDailyCloseVnd: PRICE[symbol], previousDailyCloseVnd: null, latestHourlyCloseVnd: null, ceilingPriceVnd: null, floorPriceVnd: null,
  },
  evidenceStatus: "rules-only",
  priceBasis: "adjusted",
  dataFreshness: (symbol === "MBB" ? ["1h", "1d"] : ["1d"]).map((timeframe) => ({
    timeframe, latestOpenTimeMs: LAST_OPEN, latestExpectedFinalizedOpenMs: LAST_OPEN, isStale: false,
  })),
  generatedAtUtc: "2026-10-16T03:00:00Z",
});

const position = (symbol: Sym) => ({
  symbol,
  totalShares: SHARES[symbol],
  settledShares: SHARES[symbol],
  pendingShares: 0,
  avgCostPerShareVnd: PRICE[symbol] + 500,
  availableCashVnd: symbol === "MBB" ? 5_000_000 : 1_000_000,
  updatedAtUtc: "2026-10-16T03:00:00Z",
  lots: [{
    id: 1, quantity: SHARES[symbol], costPerShareVnd: PRICE[symbol] + 500,
    acquireDate: "2026-10-10", settleDate: "2026-10-14", settled: true, source: "manual",
  }],
});

const coverage = (symbol: Sym) => ({
  symbol,
  provider: "VCI",
  crossCheckProvider: "KBS",
  priceBasis: "adjusted",
  venue: "HOSE",
  sourceTimezone: "Asia/Ho_Chi_Minh",
  generatedAtUtc: "2026-10-16T03:00:00Z",
  timeframes: (symbol === "MBB" ? ["1d", "1h"] : ["1d"]).map((timeframe) => ({
    timeframe, totalBars: 3_000, firstOpenUtc: "2012-01-01T00:00:00Z", lastOpenUtc: "2026-10-15T00:00:00Z",
    expectedBars: 3_050, missingBars: 50, coveragePct: 98.4, gapRangeCount: 2, topGaps: [], unexpectedSessionBars: 0,
    unexpectedSessionOpenTimeMs: [], invalidOhlcvRows: 0, latestExpectedFinalizedOpenUtc: "2026-10-15T00:00:00Z",
    latestBarAgeSeconds: 3_600, isStale: false,
  })),
  limitations: [`Giới hạn dữ liệu ${symbol}`],
});

const observations = (symbol: Sym, timeframe: string) => [{
  symbol,
  decisionId: `equity-observe/${symbol}/${timeframe}/${LAST_OPEN}`,
  recorderVersion: "equity-observe-v2",
  timeframe,
  signalBarOpenTimeMs: LAST_OPEN,
  signalBarCloseTimeMs: LAST_OPEN + DAY_MS - 1,
  observedAtUtc: "2026-10-16T08:30:00Z",
  decision: "wait",
  evidenceStatus: `rules-only-${symbol}`,
  priceBasis: "adjusted",
  marketCloseVnd: PRICE[symbol],
  fillPrice: null,
  fillObservedAtUtc: null,
  fillSource: null,
  fillBarOpenTimeMs: null,
  outcomeReturn: null,
  outcomeObservedAtUtc: null,
  outcomeHorizon: null,
}];

const baseRatesAbstained = (symbol: Sym) => ({
  contractVersion: "equity-base-rates-v1",
  symbol,
  timeframe: "1d",
  status: "abstained",
  reasons: ["gate-failed", "artifact-stale-asof"],
  artifact: {
    generatedAtUtc: "2026-10-15T09:00:00Z", dataAsOfOpenTimeMs: LAST_OPEN - DAY_MS, priceBasis: "adjusted",
    methodVersion: "equity-knn-v1", protocolVersion: "equity-base-rates-protocol-v1", datasetSha256: "b".repeat(64),
  },
  configs: [{
    configId: "tb-p5-s4-h20", targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, abstained: true,
    abstainReasons: ["gate-failed"], decisionUse: null,
    research: {
      label: "unvalidated", signalBarOpenTimeMs: LAST_OPEN, probTargetFirst: 0.41, probStopFirst: 0.38, probTimeout: 0.21,
      evNetFraction: -0.002, k: 50, nEligible: 2_400, prior: { probTargetFirst: 0.39, probStopFirst: 0.4, probTimeout: 0.21 },
    },
    validation: {
      gatePassed: false, gateReasons: ["insufficient-sample"], nOos: 812, nEffective: 24, brierKnn: 0.231, brierPrior: 0.229,
      brierDiffCi90: [-0.004, 0.009], ece: 0.071, calibrationBins: [], coverage: 0.93, abstentionRate: 0.07,
      evNetOosMean: -0.0012, evNetOosWhenPositive: 0.0004,
    },
  }],
});

const context = (symbol: Sym) => ({
  contractVersion: "equity-context-v1",
  symbol,
  generatedAtUtc: "2026-10-16T09:00:00Z",
  relativeStrength: {
    status: "ok",
    benchmarks: [
      { symbol: "VNINDEX", kind: "index", status: "ok", alignedSessions: 60, returns: { "20": { instrument: 0.03, benchmark: 0.01, excess: 0.02 }, "60": { instrument: -0.02, benchmark: 0.04, excess: -0.06 } } },
      { symbol: "CTG", kind: "peer", status: "unavailable", reason: "Không đủ phiên chung với CTG", alignedSessions: 12 },
    ],
  },
  corporateActions: { status: "unavailable", reason: "Nguồn sự kiện quyền VCI chưa khả dụng" },
  events: { status: "empty", items: [] },
  fundamentals: {
    status: "ok",
    items: [
      { period: "2026Q2", periodEndDate: "2026-06-30", metric: "ROE", value: 18.2, unit: "percent", publishedDate: "2026-07-30", availableAtUtc: "2026-07-30T17:00:00Z", asOfUtc: "2026-10-16T00:00:00Z", source: "KBS", sourceUrl: "https://example.com/kbs" },
      { period: "2026Q2", metric: "NPL", value: null, unit: "percent", unavailableReason: "no point-in-time source verified", source: null, sourceUrl: null },
    ],
  },
  limitations: [`Bối cảnh ${symbol}: NIM theo quý, không annualize.`],
});

const forecastJournal = (symbol: Sym) => ({
  contractVersion: "equity-forecast-journal-v1",
  symbol,
  items: [
    {
      forecastId: `quant-knn/${symbol}/tb-p5-s4-h20/${LAST_OPEN}`, source: "quant-knn", configId: "tb-p5-s4-h20",
      targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, signalBarOpenTimeMs: LAST_OPEN, availableTimeMs: LAST_OPEN + DAY_MS,
      createdAtUtc: "2026-10-16T09:00:00Z", probTargetFirst: 0.41, probStopFirst: 0.38, abstained: false, abstainReason: null,
      validated: false, methodVersion: "equity-knn-v1", modelId: null, promptVersion: null, llmRunId: null, outcome: null,
    },
    {
      forecastId: `llm-judge/${symbol}/tb-p5-s4-h20/${LAST_OPEN}/run-1`, source: "llm-judge", configId: "tb-p5-s4-h20",
      targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, signalBarOpenTimeMs: LAST_OPEN, availableTimeMs: LAST_OPEN + DAY_MS,
      createdAtUtc: "2026-10-16T09:05:00Z", probTargetFirst: 0.35, probStopFirst: 0.45, abstained: false, abstainReason: null,
      validated: false, methodVersion: "equity-llm-v1", modelId: "judge-model", promptVersion: "equity-llm-v1", llmRunId: "run-1", outcome: null,
    },
    {
      forecastId: `quant-knn/${symbol}/tb-p5-s4-h20/${BASE_OPEN}`, source: "quant-knn", configId: "tb-p5-s4-h20",
      targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, signalBarOpenTimeMs: BASE_OPEN, availableTimeMs: BASE_OPEN + DAY_MS,
      createdAtUtc: "2025-10-15T09:00:00Z", probTargetFirst: 0.44, probStopFirst: 0.36, abstained: false, abstainReason: null,
      validated: false, methodVersion: "equity-knn-v1", modelId: null, promptVersion: null, llmRunId: null,
      outcome: { entryBarOpenTimeMs: BASE_OPEN + DAY_MS, entryPrice: PRICE[symbol], label: "target-first", returnNet: 0.0472, resolvedBarOpenTimeMs: BASE_OPEN + 9 * DAY_MS, resolvedAtUtc: "2025-10-24T08:00:00Z" },
    },
  ],
  scoring: [
    { configId: "tb-p5-s4-h20", status: "insufficient-sample", pairedN: 1, nEffective: 1, brierQuant: 0.31, brierLlm: 0.42, brierDiff: 0.11, coverageQuant: 1, coverageLlm: 0.5 },
    { configId: "tb-p10-s6-h60", status: "no-data", pairedN: 0, nEffective: 0, brierQuant: null, brierLlm: null, brierDiff: null, coverageQuant: null, coverageLlm: null },
  ],
});

export const judgeOutput = (symbol: Sym, signalBarOpenTimeMs = LAST_OPEN) => ({
  schemaVersion: "equity-llm-judge-v1",
  symbol,
  signalBarOpenTimeMs,
  evidenceStatus: "sourced",
  scenarios: [{ name: `Kịch bản ${symbol}`, direction: "sideways", description: "Đi ngang chờ KQKD", sourceIds: ["s1"] }],
  warnings: [{ text: `Cảnh báo ${symbol}: sắp GDKHQ`, sourceIds: ["s1"] }],
  veto: { active: true, reason: `Veto ${symbol}: rủi ro sự kiện quyền`, sourceIds: ["s1"] },
  sources: [
    { id: "s1", url: "https://example.com/news-1", title: `Nguồn tin ${symbol}`, publishedAt: "2026-10-15" },
    { id: "s2", url: "javascript:alert(1)", title: "Nguồn độc hại", publishedAt: null },
  ],
  adjustedForecasts: [{ configId: "tb-p5-s4-h20", probTargetFirst: 0.35, probStopFirst: 0.45, rationale: "Thận trọng trước GDKHQ", sourceIds: ["s1"] }],
});

export const llmRun = (symbol: Sym, runId: string, status: "succeeded" | "failed" | "unavailable", reason: string | null = null, signalBarOpenTimeMs = LAST_OPEN) => ({
  runId, symbol, signalBarOpenTimeMs, createdAtUtc: "2026-10-16T09:05:00Z", status, reason,
  researchModel: status === "unavailable" ? null : "research-model", judgeModel: status === "unavailable" ? null : "judge-model",
  promptVersion: "equity-llm-v1", schemaVersion: "equity-llm-judge-v1",
  output: status === "succeeded" ? judgeOutput(symbol, signalBarOpenTimeMs) : null, durationMs: status === "unavailable" ? null : 42_000,
});

const llmRuns = (symbol: Sym) => ({
  items: symbol === "BID"
    ? [
      llmRun("BID", "run-1", "succeeded"),
      llmRun("BID", "run-0", "failed", "judge output failed schema validation"),
      // Older run on another bar — its quant pair must come from the journal, never today's base-rates.
      llmRun("BID", "run-old", "succeeded", null, BASE_OPEN),
    ]
    : [],
});

// EQX v2 C1 — issuer documents (metadata only); BID scanned (nothing extracted), MBB with one extracted metric.
const sourceDocuments = (symbol: Sym) => ({
  contractVersion: "equity-source-documents-v1",
  symbol,
  items: [{
    documentId: symbol === "BID" ? "b905cf9d-753b-429c-b7d8-0b7b81cb2725" : "95d7f525-f5c8-47ab-878d-a2014c35ed36",
    symbol, entity: `Entity ${symbol}`, docType: "financial-statement",
    title: `Báo cáo tài chính hợp nhất Quý II năm 2026 ${symbol}`,
    sourceUrl: symbol === "BID" ? "https://bidv.com.vn/wps/wcm/connect/q2.pdf" : "https://www.mbbank.com.vn/resources/files/q2.pdf",
    provider: symbol === "BID" ? "issuer:BIDV" : "issuer:MB", contentSha256: "d".repeat(64), storagePath: `${symbol}/${"d".repeat(64)}.pdf`,
    byteSize: 13_468_703, mimeType: "application/pdf", reportingPeriod: "2026Q2", consolidation: "consolidated", auditStatus: "unknown",
    publishedAtUtc: null, firstSeenAtUtc: "2026-10-18T08:26:32Z", fetchedAtUtc: "2026-10-18T08:27:03Z", revision: 1, supersedesDocumentId: null,
    extraction: symbol === "BID"
      ? { pageCount: 37, pagesWithText: 0, found: [], missing: [{ metric: "TOTAL_ASSETS", reason: "no text layer" }, { metric: "NET_PROFIT", reason: "no text layer" }] }
      : { pageCount: 61, pagesWithText: 5, found: [{ metric: "NET_PROFIT", page: 6 }], missing: [{ metric: "TOTAL_ASSETS", reason: "scanned" }] },
    createdAtUtc: "2026-10-18T09:20:26Z",
  }],
});

const capabilities = (extra: Record<string, unknown>) => ({
  technicalAnalysis: true, news: false, sentiment: false, futures: false, liquidation: false, orderBook: false,
  execution: false, paperTrading: false, ...extra,
});

const CATALOG = {
  contractVersion: "instrument-catalog-v2",
  generatedAtUtc: "2026-10-16T03:00:00Z",
  items: [
    { symbol: "MBB", label: "MBB", venue: "HOSE", assetClass: "equity", currency: "VND", timezone: "Asia/Ho_Chi_Minh", dataProvider: "VCI", crossCheckDataProvider: "KBS", priceBasis: "adjusted", aliases: [], activeTimeframes: ["1h", "1d"], defaultTimeframe: "1d", enabled: false, capabilities: capabilities({ ingestion: true, decision: true }) },
    { symbol: "BID", label: "BID", venue: "HOSE", assetClass: "equity", currency: "VND", timezone: "Asia/Ho_Chi_Minh", dataProvider: "VCI", crossCheckDataProvider: "KBS", priceBasis: "adjusted", aliases: [], activeTimeframes: ["1d"], defaultTimeframe: "1d", enabled: false, capabilities: capabilities({ ingestion: true, decision: true }) },
    { symbol: "VNINDEX", label: "VN-Index", venue: "HOSE", assetClass: "index", currency: "index-points", timezone: "Asia/Ho_Chi_Minh", dataProvider: "VCI", crossCheckDataProvider: null, priceBasis: "raw", aliases: [], activeTimeframes: ["1d"], defaultTimeframe: "1d", enabled: false, capabilities: capabilities({ technicalAnalysis: false, ingestion: true, decision: false }) },
  ],
};

const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
const envelope = (code: string, status: number) => json({ code, message: code, retryable: false, requestId: "e2e" }, status);

export const ALLOWED_SHELL_PATHS = new Set(["/api/meta", "/api/ai-chat/capabilities", "/api/alerts/unread-count", "/api/instruments"]);

export type Mocks = {
  /** Delay (ms) per symbol for every symbol-scoped response. */
  delayBySymbol?: Partial<Record<Sym, number>>;
  /** Force new-only surfaces (base-rates/context/journal/llm/research-notes) to 404 for a symbol, like an older backend. */
  newSurfaces404?: Partial<Record<Sym, boolean>>;
  /** /api/meta reports another contract version → mutations stay locked. */
  metaMismatch?: boolean;
  /**
   * EQX v2 A3 backend: position DTO reports the ONE shared cash pool (MBB + BID) and a per-symbol
   * buy budget; PUT /api/equities/cash writes the pool. Mutated in place by the mock's PUT handlers.
   */
  sharedPool?: { sharedCashVnd: number | null; buyBudgetVnd: Partial<Record<Sym, number | null>> };
  /** Decision overrides per symbol (A3 reason codes, buy-more capacity, unconverted corporate action). */
  decisionOverride?: Partial<Record<Sym, Record<string, unknown>>>;
  /** Context: VNINDEX benchmark reported stale (A4). */
  staleBenchmark?: boolean;
  /** GET research-notes items per symbol (admin only; default none). */
  researchNotes?: Partial<Record<Sym, unknown[]>>;
  /** Delay (ms) for PUT position responses (save-then-lock race). */
  positionPutDelayMs?: number;
  /** Answer conditions with 429 (backend "expensive" policy exhausted). */
  conditions429?: Partial<Record<Sym, boolean>>;
  /** Decision position summary reports an incomparable cost basis (corporate action since purchase). */
  costBasisIncomparable?: Partial<Record<Sym, boolean>>;
};

const NEW_SURFACES = new Set(["base-rates", "context", "forecast-journal", "llm-runs", "research-notes", "source-documents"]);

/** Resolve a request path to (symbol, surface) for both /api/mbb/* and /api/equities/{sym}/*. */
function equityRoute(path: string): { symbol: Sym; surface: string } | null {
  const mbb = /^\/api\/mbb\/([a-z-]+)$/.exec(path);
  if (mbb) return { symbol: "MBB", surface: mbb[1] };
  const eq = /^\/api\/equities\/([A-Z]+)\/([a-z-]+)$/.exec(path);
  if (eq && (eq[1] === "MBB" || eq[1] === "BID")) return { symbol: eq[1], surface: eq[2] };
  return null;
}

export async function mockBackend(page: Page, requests: string[], mocks: Mocks = {}): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  // Any Binance websocket attempt is recorded as a request and must stay empty.
  await page.routeWebSocket(/binance/, (ws) => {
    requests.push(`WS ${ws.url()}`);
  });

  await page.route("**/api/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    requests.push(`${request.method()} ${path}${url.search}`);
    const fulfill = async (response: ReturnType<typeof json>, delayMs = 0) => {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      // The page aborts superseded requests; fulfilling those must not fail the test.
      await route.fulfill(response).catch(() => {});
    };

    if (path === "/api/meta") return fulfill(json(mocks.metaMismatch ? { ...META, apiContractVersion: "older-contract" } : META));
    if (path === "/api/ai-chat/capabilities") {
      return fulfill(json({ mlInference: false, llmExplanation: false, provider: "none", reason: "E2E degraded mode", fallbackExplanation: true }));
    }
    if (path === "/api/alerts/unread-count") return fulfill(json({ unreadCount: 0 }));
    if (path === "/api/instruments") return fulfill(json(CATALOG));
    if (path === "/api/equities/cash") {
      if (request.method() !== "PUT") return fulfill(json(null));
      if (request.headers()["x-admin-key"] !== "e2e-admin") return fulfill(envelope("UNAUTHORIZED", 401));
      if (!mocks.sharedPool) return fulfill({ status: 404, contentType: "text/plain", body: "Not Found" });
      const body = request.postDataJSON() as { availableCashVnd: number };
      mocks.sharedPool.sharedCashVnd = body.availableCashVnd;
      return fulfill(json({ accountId: "default", availableCashVnd: body.availableCashVnd, updatedAtUtc: "2026-10-18T03:00:00Z" }));
    }
    // BTC-lane fallbacks so a nav hop to "/" lands cleanly.
    if (["/api/market/tickers", "/api/market/klines", "/api/market/trades"].includes(path)) return fulfill(json([]));

    const target = equityRoute(path);
    if (!target) return fulfill(json(null));
    const { symbol, surface } = target;
    const delay = mocks.delayBySymbol?.[symbol] ?? 0;
    const tf = url.searchParams.get("timeframe") ?? "1d";

    if (NEW_SURFACES.has(surface) && (mocks.newSurfaces404?.[symbol] || path.startsWith("/api/mbb/"))) {
      return fulfill({ status: 404, contentType: "text/plain", body: "Not Found" }, delay);
    }
    if (symbol === "BID" && tf === "1h") return fulfill(envelope("INVALID_TIMEFRAME", 400), delay);
    if (surface === "conditions" && mocks.conditions429?.[symbol]) return fulfill({ status: 429, contentType: "text/plain", body: "" }, delay);
    // Personal surfaces are AdminGuard'd (observations / research notes reveal holdings-driven decisions).
    if (surface === "research-notes") {
      if (request.headers()["x-admin-key"] !== "e2e-admin") return fulfill(envelope("UNAUTHORIZED", 401), delay);
      return fulfill(json({ contractVersion: "equity-research-notes-v1", symbol, items: mocks.researchNotes?.[symbol] ?? [] }), delay);
    }
    if (surface === "decision" || surface === "position" || surface === "observations") {
      if (request.headers()["x-admin-key"] !== "e2e-admin") return fulfill(envelope("UNAUTHORIZED", 401), delay);
      if (surface === "observations") return fulfill(json(observations(symbol, tf)), delay);
      if (surface === "decision") {
        const body: Record<string, unknown> = { ...decision(symbol), ...(mocks.decisionOverride?.[symbol] ?? {}) };
        if (mocks.costBasisIncomparable?.[symbol]) {
          body.position = {
            ...(body.position as Record<string, unknown>),
            unrealizedPnlVnd: null,
            unrealizedPnlPct: null,
            costBasisComparable: false,
            costBasisNote: `Giá vốn thật ${symbol} chưa quy đổi theo sự kiện quyền kể từ ngày mua.`,
          };
        }
        return fulfill(json(body), delay);
      }
      const pool = mocks.sharedPool;
      const pooled = (base: Record<string, unknown>) => (pool
        ? { ...base, sharedCashVnd: pool.sharedCashVnd, buyBudgetVnd: pool.buyBudgetVnd[symbol] ?? null, cashSource: pool.sharedCashVnd == null ? null : "shared-pool" }
        : base);
      if (request.method() === "PUT") {
        const body = request.postDataJSON() as { availableCashVnd?: number; buyBudgetVnd?: number | null };
        if (pool && "buyBudgetVnd" in body) pool.buyBudgetVnd[symbol] = body.buyBudgetVnd ?? null;
        const base = body.availableCashVnd === undefined ? position(symbol) : { ...position(symbol), availableCashVnd: body.availableCashVnd };
        return fulfill(json(pooled(base)), mocks.positionPutDelayMs ?? delay);
      }
      return fulfill(json(pooled(position(symbol))), delay);
    }
    // EQX v2 §B: the backend refuses to create LLM runs; the UI must never ask.
    if (surface === "llm-runs" && request.method() === "POST") return fulfill(envelope("LLM_DISABLED", 503), delay);
    switch (surface) {
      case "candles": return fulfill(json(candles(symbol, tf)), delay);
      case "conditions": return fulfill(json(conditions(tf)), delay);
      case "data-quality": return fulfill(json(coverage(symbol)), delay);
      case "base-rates": return fulfill(json(baseRatesAbstained(symbol)), delay);
      case "context": {
        const body = context(symbol);
        if (mocks.staleBenchmark) {
          body.relativeStrength.benchmarks[0] = { symbol: "VNINDEX", kind: "index", status: "stale", reason: "benchmark-stale", alignedSessions: 60, returns: { "20": null, "60": null } } as never;
        }
        return fulfill(json(body), delay);
      }
      case "forecast-journal": return fulfill(json(forecastJournal(symbol)), delay);
      case "llm-runs": return fulfill(json(llmRuns(symbol)), delay);
      case "source-documents": return fulfill(json(sourceDocuments(symbol)), delay);
      default: return fulfill(json(null), delay);
    }
  });
  return errors;
}

export const apiPaths = (requests: string[]) => requests.filter((r) => !r.startsWith("WS ")).map((r) => r.split(" ")[1].split("?")[0]);

export function expectNoCryptoRequests(requests: string[]) {
  expect(requests.filter((r) => r.startsWith("WS ")), "no Binance websocket on the equity page").toEqual([]);
  for (const path of apiPaths(requests)) {
    const allowed = ALLOWED_SHELL_PATHS.has(path) || path.startsWith("/api/mbb/") || path.startsWith("/api/equities/");
    expect(allowed, `unexpected API request on the equity page: ${path}`).toBe(true);
  }
}

export const symbolGroup = (page: Page) => page.getByRole("group", { name: "Chọn mã cổ phiếu" });
export const withAdmin = (page: Page) => page.addInitScript(() => window.sessionStorage.setItem("btc.adminKey", "e2e-admin"));
export const screenshot = async (page: Page, name: string) => {
  if (!process.env.EQX_SCREENSHOTS) return;
  await page.screenshot({ path: `../evidence/equity-expansion/${name}`, fullPage: true });
};
