import { expect, test } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

const intervalMs = 4 * 60 * 60 * 1_000;
const queryStartMs = 2_000_000_000_000;
const exclusionBars = 21;

function makeBars(startTimeMs: number, length: number, seed: number) {
  return Array.from({ length }, (_, index) => {
    const open = 100 + seed / 10 + index / 10;
    const close = open + (index % 2 === 0 ? 0.2 : -0.1);
    return {
      openTimeMs: startTimeMs + index * intervalMs,
      open,
      high: Math.max(open, close) + 0.3,
      low: Math.min(open, close) - 0.3,
      close,
      volume: 1_000 + index,
    };
  });
}

function analogResponse(page: number) {
  const items = Array.from({ length: 8 }, (_, offset) => {
    const rank = (page - 1) * 8 + offset + 1;
    const endTimeMs = queryStartMs - (rank + 2) * exclusionBars * intervalMs;
    const startTimeMs = endTimeMs - 14 * intervalMs;
    const ohlc = makeBars(startTimeMs, 15, rank);
    const baseClose = ohlc.at(-1)!.close;
    const returns = [0.8, -0.6, 0.1];
    return {
      rank,
      windowId: rank,
      startTimeMs,
      endTimeMs,
      futureEndTimeMs: endTimeMs + 6 * intervalMs,
      shapeSimilarity: 0.98 - rank / 1_000,
      contextSimilarity: rank % 2 === 0 ? null : 0.83,
      contextComparableFeatureCount: rank % 2 === 0 ? 0 : 6,
      atr14Pct: 0.2,
      thresholdPct: 0.2,
      ohlc,
      futureOhlc: makeBars(endTimeMs + intervalMs, 6, rank + 100),
      outcomes: [1, 3, 6].map((barsAhead, index) => ({
        barsAhead,
        targetOpenTimeMs: endTimeMs + barsAhead * intervalMs,
        targetClose: baseClose * (1 + returns[index] / 100),
        returnPct: returns[index],
        thresholdPct: 0.2,
        direction: returns[index] > 0.2 ? 1 : returns[index] < -0.2 ? -1 : 0,
      })),
    };
  });

  return {
    requestId: "analog-e2e",
    contractVersion: "2026-09-historical-analogs",
    method: "historical-analog-returns-shape-v1",
    rankingMethod: "shape-similarity-desc-context-audit-only",
    evaluationMethod: "fixed-horizon-close-to-close-economic-threshold",
    symbol: "BTCUSDT",
    timeframe: "4h",
    intervalMs,
    windowSize: 15,
    lookbackBars: 20_000,
    neighborCount: 30,
    page,
    pageSize: 8,
    total: 16,
    exclusionBars,
    roundTripCostPct: 0.15,
    atrMultiplier: 0.25,
    rawCandidateCount: 1_200,
    independentCandidateCount: 120,
    effectiveSampleCount: 16,
    validation: {
      status: "exploratory",
      isOutOfSampleValidated: false,
      reason: "Chỉ dùng để nghiên cứu; chưa qua kiểm định walk-forward ngoài mẫu.",
    },
    query: {
      startTimeMs: queryStartMs,
      endTimeMs: queryStartMs + 14 * intervalMs,
      ohlc: makeBars(queryStartMs, 15, 999),
      context: { values: { atr14Pct: 0.2 }, availableFeatureCount: 1 },
    },
    summaries: [1, 3, 6].map((barsAhead, index) => ({
      barsAhead,
      totalSamples: 16,
      upCount: index === 0 ? 10 : 4,
      downCount: index === 1 ? 10 : 4,
      neutralCount: index === 2 ? 8 : 2,
      upRate: index === 0 ? 0.625 : 0.25,
      downRate: index === 1 ? 0.625 : 0.25,
      neutralRate: index === 2 ? 0.5 : 0.125,
      avgReturnPct: returnsForSummary(index),
      medianReturnPct: returnsForSummary(index),
      dominantDirection: index === 0 ? 1 : index === 1 ? -1 : 0,
    })),
    items,
  };
}

function returnsForSummary(index: number) {
  return [0.8, -0.6, 0.1][index];
}

async function routeAppApis(page: import("@playwright/test").Page, analogHandler: (route: import("@playwright/test").Route) => Promise<void>) {
  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/meta") {
      await route.fulfill({ json: {
        appVersion: "test",
        apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
        dataPipelineVersion: "quant-pipeline-v3",
        evaluationVersion: "evaluation-v2",
        environment: "Research",
      } });
      return;
    }
    if (url.pathname === "/api/historical-analogs") {
      await analogHandler(route);
      return;
    }
    if (url.pathname === "/api/ai-chat/capabilities") {
      await route.fulfill({ json: {
        mlInference: false,
        llmExplanation: false,
        provider: "none",
        reason: "E2E degraded mode",
        fallbackExplanation: true,
      } });
      return;
    }
    if (["/api/market/tickers", "/api/market/klines", "/api/market/trades"].includes(url.pathname)) {
      await route.fulfill({ json: [] });
      return;
    }
    if (url.pathname === "/api/market/depth") {
      await route.fulfill({ json: { symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] } });
      return;
    }
    if (url.pathname === "/api/sentiment/current") {
      await route.fulfill({ json: { aggregatedSentiment: 0, sentimentLabel: "NEUTRAL", createdAtUtc: new Date().toISOString() } });
      return;
    }
    if (url.pathname === "/api/alerts/unread-count") {
      await route.fulfill({ json: { unreadCount: 0 } });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

test("historical analog renders auditable evidence and paginates eight at a time", async ({ page }) => {
  const requestedPages: number[] = [];
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await routeAppApis(page, async (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("pageSize")).toBe("8");
    const requestedPage = Number(url.searchParams.get("page"));
    requestedPages.push(requestedPage);
    await route.fulfill({ json: analogResponse(requestedPage) });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Mẫu nến", exact: true }).click();

  const explorer = page.getByRole("region", { name: "Historical Analog Explorer" });
  await expect(explorer).toBeVisible();
  await expect(explorer.getByText("EXPERIMENTAL · CHƯA QUA OOS GATE")).toBeVisible();
  await expect(explorer.getByTestId("analog-query-window")).toBeVisible();
  await expect(explorer.getByText("Ứng viên thô")).toBeVisible();
  await expect(explorer.getByText("Sau loại chồng lấn")).toBeVisible();
  await expect(explorer.getByText("Mẫu hiệu lực")).toBeVisible();
  await expect(explorer.getByText(/Close-to-close =/)).toBeVisible();
  await expect(explorer.getByText(/Xếp hạng chỉ theo hình dạng; bối cảnh chỉ để đối chiếu/)).toBeVisible();
  await expect(explorer.getByText(/không phải xác suất dự báo/i)).toBeVisible();
  await expect(explorer.getByTestId("analog-summary")).toContainText("Sau 1 nến");
  await expect(explorer.getByTestId("analog-summary")).toContainText("Sau 3 nến");
  await expect(explorer.getByTestId("analog-summary")).toContainText("Sau 6 nến");
  await expect(explorer.getByTestId("analog-card")).toHaveCount(8);
  await expect(explorer.getByText("TRUNG TÍNH +0.10%", { exact: true }).first()).toBeVisible();
  await expect(explorer.getByText("1–8 / 16 · Trang 1/2", { exact: true })).toBeVisible();

  await explorer.getByRole("button", { name: "Trang sau" }).click();
  await expect(explorer.getByText("#9 · Analog lịch sử", { exact: true })).toBeVisible();
  await expect(explorer.getByTestId("analog-card")).toHaveCount(8);
  await expect(explorer.getByText("9–16 / 16 · Trang 2/2", { exact: true })).toBeVisible();
  expect(requestedPages).toEqual([1, 2]);
  expect(browserErrors).toEqual([]);
});

test("historical analog surfaces an API failure and retries without stale evidence", async ({ page }) => {
  let attempts = 0;
  await routeAppApis(page, async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, json: { message: "upstream unavailable" } });
      return;
    }
    await route.fulfill({ json: analogResponse(1) });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Mẫu nến", exact: true }).click();
  const explorer = page.getByRole("region", { name: "Historical Analog Explorer" });
  await expect(explorer.getByRole("alert")).toContainText("Không thể tải Historical Analog");
  await expect(explorer.getByTestId("analog-card")).toHaveCount(0);

  await explorer.getByRole("button", { name: "Thử lại Historical Analog" }).click();
  await expect(explorer.getByTestId("analog-card")).toHaveCount(8);
  expect(attempts).toBe(2);
});
