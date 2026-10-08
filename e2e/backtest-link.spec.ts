import { expect, test, type Page } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

const RUN = (id: number) => ({
  id,
  symbol: "BTCUSDT",
  timeframe: "4h",
  windowSize: 5,
  horizon: "4h",
  modelName: "XGB_calibrated",
  startTimeMs: 1750000000000,
  endTimeMs: 1760000000000,
  totalTrades: 42,
  winRate: 0.55,
  totalReturnPct: 12.34,
  buyHoldReturnPct: 5.5,
  maxDrawdownPct: -8.2,
  sharpeRatio: 1.9,
  profitFactor: 1.6,
  finalEquity: 11234,
  createdAtUtc: "2026-09-15T00:00:00Z",
  pipelineVersion: "e2e-pipe",
  evaluationVersion: "e2e-eval",
  validityStatus: "Valid",
  invalidReason: null,
  archivedAtUtc: null,
});

const DETAIL = (id: number) => ({
  ...RUN(id),
  trades: [
    { id: 1, entryTimeMs: 1750000000000, exitTimeMs: 1750100000000, side: "long", entryPrice: 100, exitPrice: 102, pnlPct: 2, confidence: 0.7, trueLabel: 1 },
  ],
  metricsJson: "{\"feeBps\":10}",
  equityCurveJson: "[{\"timeMs\":1750000000000,\"cumulativeReturnPct\":0},{\"timeMs\":1760000000000,\"cumulativeReturnPct\":12.34}]",
});

async function mockBackend(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/meta") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(META) });
      return;
    }
    if (path === "/api/ai-chat/capabilities") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        mlInference: false, llmExplanation: false, provider: "none", reason: "E2E degraded mode", fallbackExplanation: true,
      }) });
      return;
    }
    if (["/api/market/tickers", "/api/market/klines", "/api/market/trades"].includes(path)) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    if (path === "/api/market/depth") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] }) });
      return;
    }
    if (path === "/api/sentiment/current") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ aggregatedSentiment: 0, sentimentLabel: "NEUTRAL", createdAtUtc: new Date().toISOString() }) });
      return;
    }
    if (path === "/api/alerts/unread-count") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{\"unreadCount\":0}" });
      return;
    }
    if (path === "/api/backtest/runs") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ symbol: "BTCUSDT", count: 2, items: [RUN(7), RUN(8)] }) });
      return;
    }
    const detailMatch = /^\/api\/backtest\/runs\/(\d+)$/.exec(path);
    if (detailMatch) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETAIL(Number(detailMatch[1]))) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  return errors;
}

test("cold deep-link ?run=<id> opens the run detail directly", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/backtest?run=7");
  await expect(page.getByText("Chi tiết run #7")).toBeVisible();
  await expect(page).toHaveURL(/\/backtest\?run=7/);
});

test("clicking a run pushes ?run=<id> and shows its detail", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/backtest");
  await page.getByRole("row", { name: /#7/ }).click();
  await expect(page).toHaveURL(/\/backtest\?run=7/);
  await expect(page.getByText("Chi tiết run #7")).toBeVisible();
});

test("browser Back after selecting a run clears the param and the detail", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/backtest");
  await page.getByRole("row", { name: /#7/ }).click();
  await expect(page.getByText("Chi tiết run #7")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/backtest$/);
  await expect(page.getByText("Chi tiết run #7")).toHaveCount(0);
});

test("non-canonical ?run value is dropped from the URL instead of faking a selection", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/backtest?run=abc");
  await expect(page).toHaveURL(/\/backtest$/);
  await expect(page.getByText(/Chi tiết run #/)).toHaveCount(0);
});

test("switching to the Ensemble tab clears the run param", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/backtest?run=7");
  await expect(page.getByText("Chi tiết run #7")).toBeVisible();
  await page.getByRole("tab", { name: /Ensemble/ }).click();
  await expect(page).toHaveURL(/\/backtest$/);
  await expect(page.getByText("Chi tiết run #7")).toHaveCount(0);
});

test("a failed detail fetch shows the error and clicking the same run retries it", async ({ page }) => {
  await mockBackend(page);
  // Registered after mockBackend so it takes precedence (routes match LIFO).
  let failed = false;
  await page.route("**/api/backtest/runs/7*", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 500, contentType: "application/json", body: "{\"message\":\"boom\"}" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(DETAIL(7)) });
  });
  await page.goto("/backtest?run=7");
  await expect(page.getByText("Chi tiết run #7")).toHaveCount(0);
  await expect(page.locator('[class*="bg-rose-950"]').first()).toBeVisible();
  // URL keeps ?run=7 (the target is honest — the fetch failed, not the link).
  await expect(page).toHaveURL(/\/backtest\?run=7/);
  // Clicking the same run retries the fetch directly — the unchanged param
  // cannot re-fire the effect, so this is the only retry path.
  await page.getByRole("row", { name: /#7/ }).click();
  await expect(page.getByText("Chi tiết run #7")).toBeVisible();
});
