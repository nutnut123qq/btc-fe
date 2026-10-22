import { expect, test, type Page, type Route } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";
import { openMainTab } from "./nav";

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

const DAY_MS = 86_400_000;
const BASE_OPEN = 1_760_544_000_000; // 2025-10-15T00:00:00Z

function candle(index: number, close: number) {
  const openTimeMs = BASE_OPEN + index * DAY_MS;
  return {
    openTimeMs,
    timeIso: new Date(openTimeMs).toISOString(),
    open: close - 200,
    high: close + 300,
    low: close - 400,
    close,
    volume: 1_200_000 + index * 10_000,
    closeTimeMs: openTimeMs + DAY_MS - 1,
    quoteVolume: null,
    tradeCount: null,
    takerBuyVolume: null,
    takerBuyQuoteVolume: null,
  };
}

const CANDLES_1D = Array.from({ length: 30 }, (_, i) => candle(i, 23_800 + i * 40));
const CANDLES_1H = Array.from({ length: 30 }, (_, i) => ({
  ...candle(i, 23_900 + i * 10),
  closeTimeMs: BASE_OPEN + i * DAY_MS + 3_599_999,
}));

const CONDITIONS = (timeframe: string) => ({
  timeframe,
  asOfMs: BASE_OPEN + 29 * DAY_MS,
  latestClosedBar: null,
  analysisWindow: null,
  contract: { definitionsSha256: "0".repeat(64) },
  conditions: [
    {
      module: "technicalIndicators",
      eventType: "RSI_NEUTRAL",
      kind: "state",
      direction: "neutral",
      eventId: null,
      formedTimeMs: BASE_OPEN + 29 * DAY_MS,
      availableTimeMs: BASE_OPEN + 29 * DAY_MS,
      context: { trend: "sideways", volatility: "low" },
      details: { rsi: 48.2 },
      evidence: null,
    },
  ],
  evidence: {
    available: false,
    reason: "no-verified-evidence-bundle",
    runId: null,
    manifestSha256: null,
    specSha256: null,
    cutoffMs: null,
    evidenceAgeBars: null,
  },
  conflicts: [],
  warnings: [],
  unavailableModules: [],
  generatedAtMs: BASE_OPEN + 29 * DAY_MS + 1_000,
});

const DECISION = {
  symbol: "MBB",
  action: "hold",
  reasons: ["Xu hướng 1d trung lập", "RSI trong vùng neutral"],
  triggers: [
    {
      name: "stop-loss -8%",
      timeframe: "1d",
      condition: "close1d < giá vốn × 0.92",
      direction: "close-below",
      priceLevelVnd: 22_540,
      withinPriceBand: true,
      nonFillRisk: null,
    },
  ],
  invalidation: "Nến 1d đóng trên SMA50 đảo chiều xu hướng.",
  position: {
    totalShares: 200,
    settledShares: 200,
    pendingShares: 0,
    sellableSharesNow: 200,
    avgCostPerShareVnd: 24_500,
    lastPriceVnd: 23_800,
    unrealizedPnlVnd: -140_000,
    unrealizedPnlPct: -2.857,
    netProceedsIfSellableNowVnd: 4_750_440,
  },
  buyMore: null,
  market: {
    trend: "sideways",
    rsiZone: "neutral",
    rsi14: 48.2,
    atr14: 510,
    sma50: 24_100,
    ema50: 24_000,
    lastDailyCloseVnd: 23_800,
    previousDailyCloseVnd: 24_000,
    latestHourlyCloseVnd: 23_800,
    ceilingPriceVnd: 25_480,
    floorPriceVnd: 22_120,
  },
  evidenceStatus: "rules-only",
  priceBasis: "adjusted",
  dataFreshness: [
    { timeframe: "1h", latestOpenTimeMs: BASE_OPEN + 28 * DAY_MS, latestExpectedFinalizedOpenMs: BASE_OPEN + 28 * DAY_MS, isStale: false },
    { timeframe: "1d", latestOpenTimeMs: BASE_OPEN + 29 * DAY_MS, latestExpectedFinalizedOpenMs: BASE_OPEN + 29 * DAY_MS, isStale: false },
  ],
  generatedAtUtc: "2026-10-16T03:00:00Z",
};

const POSITION = {
  symbol: "MBB",
  totalShares: 200,
  settledShares: 200,
  pendingShares: 0,
  avgCostPerShareVnd: 24_500,
  availableCashVnd: 5_000_000,
  updatedAtUtc: "2026-10-16T03:00:00Z",
  lots: [
    {
      id: 1,
      quantity: 200,
      costPerShareVnd: 24_500,
      acquireDate: "2026-10-10",
      settleDate: "2026-10-14",
      settled: true,
      source: "manual",
    },
  ],
};

const COVERAGE = {
  symbol: "MBB",
  provider: "VCI",
  crossCheckProvider: "KBS",
  priceBasis: "adjusted",
  venue: "HOSE",
  sourceTimezone: "Asia/Ho_Chi_Minh",
  generatedAtUtc: "2026-10-16T03:00:00Z",
  timeframes: [
    {
      timeframe: "1d",
      totalBars: 3_732,
      firstOpenUtc: "2011-11-01T00:00:00Z",
      lastOpenUtc: "2026-10-15T00:00:00Z",
      expectedBars: 3_826,
      missingBars: 94,
      coveragePct: 97.5,
      gapRangeCount: 3,
      topGaps: [],
      unexpectedSessionBars: 1,
      unexpectedSessionOpenTimeMs: [],
      invalidOhlcvRows: 0,
      latestExpectedFinalizedOpenUtc: "2026-10-15T00:00:00Z",
      latestBarAgeSeconds: 3_600,
      isStale: false,
    },
    {
      timeframe: "1h",
      totalBars: 3_521,
      firstOpenUtc: "2023-09-11T00:00:00Z",
      lastOpenUtc: "2026-10-15T00:00:00Z",
      expectedBars: 3_800,
      missingBars: 279,
      coveragePct: 90.8,
      gapRangeCount: 5,
      topGaps: [],
      unexpectedSessionBars: 0,
      unexpectedSessionOpenTimeMs: [],
      invalidOhlcvRows: 0,
      latestExpectedFinalizedOpenUtc: "2026-10-15T00:00:00Z",
      latestBarAgeSeconds: 3_600,
      isStale: false,
    },
  ],
  limitations: ["Không có nến 4h native; chỉ 1h/1d."],
};

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

// Every /api request the page fires is recorded — the MBB lane must never touch
// crypto endpoints, and nothing outside this allowlist may leave the browser.
const ALLOWED_SHELL_PATHS = new Set([
  "/api/meta",
  "/api/ai-chat/capabilities",
  "/api/alerts/unread-count",
  "/api/instruments",
]);

type Mocks = { conditionsStatus?: number };

async function mockBackend(page: Page, requests: string[], mocks: Mocks = {}): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  await page.route("**/api/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (route.request().method() === "GET" || route.request().method() === "PUT") {
      requests.push(`${route.request().method()} ${path}${url.search}`);
    }
    if (path === "/api/meta") return route.fulfill(json(META));
    // BTC-lane fallbacks so the nav test can land on "/" cleanly.
    if (["/api/market/tickers", "/api/market/klines", "/api/market/trades"].includes(path)) {
      return route.fulfill(json([]));
    }
    if (path === "/api/market/depth") {
      return route.fulfill(json({ symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] }));
    }
    if (path === "/api/sentiment/current") {
      return route.fulfill(json({ aggregatedSentiment: 0, sentimentLabel: "NEUTRAL", createdAtUtc: new Date().toISOString() }));
    }
    if (path === "/api/ai-chat/capabilities") {
      return route.fulfill(json({
        mlInference: false, llmExplanation: false, provider: "none",
        reason: "E2E degraded mode", fallbackExplanation: true,
      }));
    }
    if (path === "/api/alerts/unread-count") return route.fulfill(json({ unreadCount: 0 }));
    if (path === "/api/mbb/candles") {
      const tf = url.searchParams.get("timeframe");
      return route.fulfill(json(tf === "1h" ? CANDLES_1H : CANDLES_1D));
    }
    if (path === "/api/mbb/conditions") {
      if (mocks.conditionsStatus && mocks.conditionsStatus !== 200) {
        return route.fulfill(json({
          code: "CONDITIONS_SOURCE_UNAVAILABLE",
          message: "The AI current-conditions service is unavailable.",
          retryable: true,
          requestId: "e2e",
        }, mocks.conditionsStatus));
      }
      const tf = url.searchParams.get("timeframe") ?? "1d";
      return route.fulfill(json(CONDITIONS(tf)));
    }
    // Personal-data reads are AdminGuard'd like the write — the mock mirrors
    // the real contract so the page can only reach them through the session key.
    if (path === "/api/mbb/decision" || path === "/api/mbb/position" || path === "/api/mbb/observations") {
      if (route.request().headers()["x-admin-key"] !== "e2e-admin") {
        return route.fulfill(json({
          code: "UNAUTHORIZED", message: "Missing or invalid admin key.", retryable: false, requestId: "e2e",
        }, 401));
      }
      if (path === "/api/mbb/decision") return route.fulfill(json(DECISION));
      if (path === "/api/mbb/observations") return route.fulfill(json([]));
    }
    if (path === "/api/mbb/data-quality") return route.fulfill(json(COVERAGE));
    // EQX new-only surfaces (base-rates/context) — this suite models a backend
    // without them; the shared equity screen must degrade to "unavailable".
    if (path.startsWith("/api/equities/MBB/")) {
      return route.fulfill({ status: 404, contentType: "text/plain", body: "Not Found" });
    }
    if (path === "/api/mbb/position") {
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON() as { lots: unknown[]; availableCashVnd: number };
        return route.fulfill(json({
          ...POSITION,
          availableCashVnd: body.availableCashVnd,
          totalShares: (body.lots as Array<{ quantity: number }>).reduce((sum, lot) => sum + lot.quantity, 0),
        }));
      }
      return route.fulfill(json(POSITION));
    }
    return route.fulfill(json(null));
  });
  return errors;
}

test.describe("/mbb lane", () => {
  test("renders MBB surface: chart, only 1h/1d, decision card, no crypto endpoints", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await page.addInitScript(() => window.sessionStorage.setItem("btc.adminKey", "e2e-admin"));

    await page.goto("/mbb");

    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Đồ thị nến MBB" })).toBeVisible();
    // Chart mounted (lightweight-charts injects a canvas).
    await expect(
      page.locator('section[aria-labelledby="mbb-chart-title"] canvas').first(),
    ).toBeAttached({ timeout: 15_000 });

    // Timeframe switch exposes exactly the MBB contract: 1h and 1d, never 4h.
    const tfGroup = page.getByRole("group", { name: "Khung thời gian MBB" });
    await expect(tfGroup.getByRole("button")).toHaveCount(2);
    await expect(tfGroup.getByRole("button", { name: "1h" })).toBeVisible();
    await expect(tfGroup.getByRole("button", { name: "1d" })).toBeVisible();
    await expect(tfGroup.getByRole("button", { name: "4h" })).toHaveCount(0);

    // Decision card: action semantics + honest evidence status.
    const decision = page.getByTestId("mbb-decision");
    await expect(decision.getByText("Giữ", { exact: true })).toBeVisible();
    await expect(decision.getByText(/rules-only · chưa validated/)).toBeVisible();
    await expect(decision.getByText(/ngoài band|trong band ±7%/)).toBeVisible();

    // Position + data-quality sections render from their own endpoints.
    await expect(page.getByTestId("mbb-position-form")).toBeVisible();
    await expect(page.getByText("Chất lượng dữ liệu")).toBeVisible();
    await expect(page.getByText("Không có nến 4h native; chỉ 1h/1d.")).toBeVisible();

    // Only MBB lane endpoints + shell meta requests may fire on this page.
    const apiPaths = requests.map((r) => r.split(" ")[1].split("?")[0]);
    expect(apiPaths).toContain("/api/mbb/candles");
    expect(apiPaths).toContain("/api/mbb/decision");
    expect(apiPaths).toContain("/api/mbb/position");
    expect(apiPaths).toContain("/api/mbb/data-quality");
    for (const path of apiPaths) {
      const allowed = ALLOWED_SHELL_PATHS.has(path) || path.startsWith("/api/mbb/") || path.startsWith("/api/equities/MBB/");
      expect(allowed, `unexpected API request on /mbb: ${path}`).toBe(true);
    }
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("timeframe switch refetches candles+conditions for 1h only", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/mbb");
    await expect(page.getByRole("heading", { name: "Đồ thị nến MBB" })).toBeVisible();

    requests.length = 0;
    const candlesPromise = page.waitForResponse(
      (r) => r.url().includes("/api/mbb/candles?") && r.url().includes("timeframe=1h"),
    );
    const conditionsPromise = page.waitForResponse(
      (r) => r.url().includes("/api/mbb/conditions?") && r.url().includes("timeframe=1h"),
    );
    await page.getByRole("group", { name: "Khung thời gian MBB" }).getByRole("button", { name: "1h" }).click();
    await candlesPromise;
    await conditionsPromise;
    expect(requests.some((r) => r.includes("timeframe=4h"))).toBe(false);
    expect(requests.filter((r) => r.includes("timeframe=1h")).length).toBeGreaterThanOrEqual(2);
  });

  test("position form PUTs full-replacement lots through admin session", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.addInitScript(() => window.sessionStorage.setItem("btc.adminKey", "e2e-admin"));
    await page.goto("/mbb");
    await expect(page.getByTestId("mbb-position-form")).toBeVisible();

    // Prefilled from GET position; adjust quantity then save.
    const qty = page.getByLabel("Số lượng (cp)").first();
    await expect(qty).toHaveValue("200");
    await qty.fill("300");
    await page.getByLabel("Tiền mặt khả dụng (₫)").fill("4000000");

    const putRequest = page.waitForRequest(
      (r) => r.method() === "PUT" && r.url().includes("/api/mbb/position"),
    );
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    const request = await putRequest;
    const body = request.postDataJSON() as { lots: Array<{ quantity: number; costPerShareVnd: number; acquireDate: string }>; availableCashVnd: number };
    expect(body.lots[0].quantity).toBe(300);
    expect(body.lots[0].costPerShareVnd).toBe(24500);
    expect(body.availableCashVnd).toBe(4000000);
    await expect(page.getByText(/Đã lưu vị thế/)).toBeVisible();
  });

  test("position + decision stay locked without an admin session key", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    // No btc.adminKey — the page must not even fire the guarded reads.
    await page.goto("/mbb");

    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    await expect(page.getByTestId("mbb-decision-locked")).toBeVisible();
    await expect(page.getByTestId("mbb-position-locked")).toBeVisible();
    // Public lanes still render.
    await expect(page.getByText("Chất lượng dữ liệu")).toBeVisible();
    // Give a wrongly fired request time to be recorded before asserting its absence.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_000);

    const apiPaths = requests.map((r) => r.split(" ")[1].split("?")[0]);
    expect(apiPaths).toContain("/api/mbb/candles");
    expect(apiPaths).not.toContain("/api/mbb/decision");
    expect(apiPaths).not.toContain("/api/mbb/position");
    expect(apiPaths).not.toContain("/api/mbb/observations");
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("conditions 502 renders an honest unavailable state, not fabricated data", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests, { conditionsStatus: 502 });
    await page.addInitScript(() => window.sessionStorage.setItem("btc.adminKey", "e2e-admin"));
    await page.goto("/mbb");
    await expect(page.getByRole("heading", { name: "Đồ thị nến MBB" })).toBeVisible();
    await expect(page.getByText(/Điều kiện hiện tại chưa khả dụng/)).toBeVisible({ timeout: 30_000 });
    // Chart + decision still render from their own endpoints.
    await expect(page.getByTestId("mbb-decision").getByText("Giữ", { exact: true })).toBeVisible();
  });

  test("BTC↔MBB nav switch keeps lanes separate", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/mbb");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();

    // Chip in the market-group sub-row routes back to the BTC surface.
    await page.getByTestId("nav-sub-row").getByRole("button", { name: "BTC/USDT", exact: true }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("complementary", { name: /Dữ liệu thị trường realtime/ })).toBeVisible({ timeout: 30_000 });

    // And back via the same nav group.
    await openMainTab(page, "MBB");
    await page.waitForURL("**/mbb");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
  });
});
