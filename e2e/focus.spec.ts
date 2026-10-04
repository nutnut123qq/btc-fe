import { expect, test } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

async function routeAppApis(page: import("@playwright/test").Page) {
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
    if (url.pathname === "/api/alerts/unread-count") {
      await route.fulfill({ json: { unreadCount: 1 } });
      return;
    }
    if (url.pathname === "/api/alerts") {
      await route.fulfill({ json: {
        userId: "default",
        unreadCount: 1,
        items: [{
          id: "alert-1",
          userId: "default",
          type: "price-threshold",
          title: "BTC vượt ngưỡng",
          message: "Giá BTCUSDT chạm ngưỡng đã đặt.",
          priceSnapshot: null,
          createdAt: new Date().toISOString(),
          isRead: false,
          sourceKey: null,
          availableTimeMs: Date.now(),
          provenance: "alert-worker",
          deliveryStatus: "delivered",
          archivedAtUtc: null,
        }],
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
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

test("mobile Escape from sub-nav returns focus to the visible group button", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await routeAppApis(page);
  await page.goto("/");

  const mobileNav = page.getByTestId("nav-groups-mobile");
  const groupButton = mobileNav.getByRole("button", { name: "Nghiên cứu", exact: true });
  await groupButton.click();

  const chip = page
    .getByTestId("nav-sub-row")
    .getByRole("button", { name: "Backtest", exact: true });
  await expect(chip).toBeVisible();
  await chip.focus();
  await page.keyboard.press("Escape");

  // Focus must land on the visible mobile group button — the hidden desktop
  // counterpart is display:none and cannot receive focus.
  await expect(groupButton).toBeFocused();
});

test("alerts drawer traps focus, makes the background inert, and returns focus", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await routeAppApis(page);
  await page.goto("/");

  const launcher = page.getByRole("button", { name: "Thông báo", exact: true });
  await launcher.click();

  const dialog = page.getByRole("dialog", { name: "Thông báo" });
  await expect(dialog).toBeVisible();
  // Initial focus goes into the modal panel.
  await expect(dialog).toBeFocused();
  // Background is inert while the modal is open.
  await expect(page.locator("main")).toHaveAttribute("inert", "");

  // Tab moves to the first control; Shift+Tab wraps to the last; Tab wraps
  // back to the first — focus cannot leave the drawer.
  const first = dialog.getByRole("button").first();
  const last = dialog.getByRole("button").last();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(first).toBeFocused();

  // Escape closes the modal and returns focus to the launcher.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  expect(browserErrors).toEqual([]);
});

test("ai chat stays non-modal: Escape closes and focus returns to the launcher", async ({ page }) => {
  await routeAppApis(page);
  await page.goto("/");

  const launcher = page.getByRole("button", { name: "Trợ lý AI Chat", exact: true });
  await launcher.click();
  const chat = page.getByRole("dialog", { name: "Trợ lý AI" });
  await expect(chat).toBeVisible();
  // Non-modal panel must not claim modal semantics.
  await expect(chat).not.toHaveAttribute("aria-modal", "true");

  await page.keyboard.press("Escape");
  await expect(chat).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

for (const viewport of [
  { name: "desktop", size: { width: 1280, height: 800 } },
  { name: "mobile", size: { width: 390, height: 844 } },
]) {
  test(`alerts modal disables the whole AI chat surface (${viewport.name})`, async ({ page }) => {
    await page.setViewportSize(viewport.size);
    await routeAppApis(page);
    await page.goto("/");

    const bell = page.getByRole("button", { name: "Thông báo", exact: true });
    const chatLauncher = page.getByRole("button", { name: "Trợ lý AI Chat", exact: true });
    const chat = page.getByRole("dialog", { name: "Trợ lý AI" });
    const alerts = page.getByRole("dialog", { name: "Thông báo" });
    const inertChat = () =>
      chatLauncher.evaluate((el) => el.closest("[inert]") !== null);

    // Order 1 — alerts first: the chat launcher is inside an inert subtree
    // and cannot open a second dialog on top of the modal.
    await bell.click();
    await expect(alerts).toBeVisible();
    await expect.poll(inertChat).toBe(true);
    await chatLauncher.click({ force: true });
    await expect(chat).toHaveCount(0);
    await expect(alerts).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(alerts).toHaveCount(0);
    await expect(bell).toBeFocused();
    await expect.poll(inertChat).toBe(false);

    // Order 2 — chat first: opening the modal hides the non-modal chat
    // surface and focus lands inside the drawer, not on a hidden/inert element.
    // Keyboard activation: on mobile the chat sheet covers the bell visually,
    // but the non-modal chat keeps background controls keyboard-reachable.
    await chatLauncher.click();
    await expect(chat).toBeVisible();
    await bell.focus();
    await page.keyboard.press("Enter");
    await expect(alerts).toBeVisible();
    await expect(chat).toHaveCount(0);
    await expect(alerts).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(alerts).toHaveCount(0);
    await expect(bell).toBeFocused();
    // The non-modal chat resumes with its open state preserved.
    await expect(chat).toBeVisible();
  });
}
