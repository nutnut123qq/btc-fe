import { expect, test, type Page } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

async function mockBackend(page: Page, metaAvailable: boolean): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/meta") {
      await route.fulfill(metaAvailable
        ? { status: 200, contentType: "application/json", body: JSON.stringify(META) }
        : { status: 200, contentType: "application/json", body: "{}" });
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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [],
      }) });
      return;
    }
    if (path === "/api/sentiment/current") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        aggregatedSentiment: 50, sentimentLabel: "Neutral",
      }) });
      return;
    }
    if (path === "/api/alerts/unread-count") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{\"unreadCount\":0}" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  return errors;
}

test("production build loads the primary screen without console errors", async ({ page }) => {
  const errors = await mockBackend(page, true);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bitcoin AI Analyst" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Sàn Binance Pro/ })).toBeVisible();
  await expect(page.getByText(/API contract không khớp/)).toHaveCount(0);
  await page.waitForTimeout(750);
  expect(errors).toEqual([]);
});

test("backend-unavailable mode remains read-only and console-clean", async ({ page }) => {
  const errors = await mockBackend(page, false);
  await page.goto("/");
  await expect(page.getByText(/Không kiểm tra được API contract; mutation đã bị khóa/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bitcoin AI Analyst" })).toBeVisible();
  await page.waitForTimeout(750);
  expect(errors).toEqual([]);
});
