import { expect, test, type Page, type Route } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";

// Regression for live-audit-20261024 F02–F08. Controlled fixtures only (the production
// backend is never broken on purpose): each test decides per path whether the backend
// is pending, failing (503), successfully empty, or successfully populated.

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};
const CAPS_OFF = { mlInference: false, llmExplanation: false, provider: "none", reason: "LLM disabled", fallbackExplanation: true };

type Handler = (route: Route, path: string) => Promise<boolean> | boolean;

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
const down = (route: Route) => route.fulfill({ status: 503, contentType: "text/plain", body: "upstream unavailable" });

async function mockBackend(page: Page, handler: Handler): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (await handler(route, path)) return;
    if (path === "/api/meta") return json(route, META);
    if (path === "/api/ai-chat/capabilities") return json(route, CAPS_OFF);
    if (path === "/api/alerts/unread-count") return json(route, { unreadCount: 0 });
    if (["/api/market/tickers", "/api/market/trades"].includes(path)) return json(route, []);
    if (path === "/api/market/depth") return json(route, { symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] });
    // Anything not modelled by the test is an outage, never an implicit empty success.
    return down(route);
  });
  return errors;
}

test("API outage then recovery: banner + capability state re-verify without reloading", async ({ page }) => {
  let healthy = false;
  await mockBackend(page, (route, path) => {
    if (!healthy && (path === "/api/meta" || path === "/api/ai-chat/capabilities")) {
      void down(route);
      return true;
    }
    return false;
  });
  await page.goto("/tin-tuc");
  const banner = page.getByTestId("connection-banner");
  await expect(banner).toHaveAttribute("data-contract-state", "unavailable");
  await expect(banner).toContainText("Không kiểm tra được API contract");
  // Failed capability check is "unverified", never "LLM OFF".
  await expect(page.getByTestId("llm-state")).toHaveAttribute("data-llm-state", "unverified");
  await expect(page.getByText(/LLM OFF/)).toHaveCount(0);
  await expect(page.getByText(/định lượng vẫn hoạt động/)).toHaveCount(0);

  healthy = true;
  await banner.getByRole("button", { name: "Thử kết nối lại" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page.getByTestId("llm-state")).toHaveAttribute("data-llm-state", "off");
  await expect(page.getByTestId("llm-state")).toHaveText("LLM OFF · tắt theo cấu hình");
  // The floating chat is not offered while the LLM layer is off.
  await expect(page.getByRole("button", { name: "Trợ lý AI Chat" })).toHaveCount(0);
});

test("AI screen under outage says unverified, not 'models work normally'", async ({ page }) => {
  await mockBackend(page, (route, path) => {
    if (path === "/api/ai-chat/capabilities") { void down(route); return true; }
    return false;
  });
  await page.goto("/ai");
  await expect(page.locator("main").getByText(/Chưa xác minh được trạng thái LLM/)).toBeVisible();
  await expect(page.locator("main").getByText(/vẫn hoạt động bình thường/)).toHaveCount(0);
  await expect(page.locator("main").getByRole("button", { name: "Chưa xác minh được LLM" })).toBeDisabled();
});

test("Quan sát forward: pending → 5xx shows dashes/error; success-empty shows real zeros", async ({ page }) => {
  let mode: "pending" | "down" | "empty" = "pending";
  const held: Route[] = [];
  await mockBackend(page, (route, path) => {
    if (path !== "/api/paper-trades/observations") return false;
    if (mode === "pending") held.push(route);
    else if (mode === "down") void down(route);
    else void json(route, { symbol: "BTCUSDT", available: true, reason: null, items: [] });
    return true;
  });
  await page.goto("/paper");
  const main = page.locator("main");
  await expect(main.getByRole("heading", { name: "Quan sát forward BTC" })).toBeVisible();
  // Pending: explicit loading, counters unknown.
  await expect(main.getByText("Đang tải", { exact: false }).first()).toBeVisible();
  await expect(main.getByText(/^Quan sát:$/).locator("xpath=following-sibling::span[1]")).toHaveText("—");

  mode = "down";
  for (const route of held.splice(0)) await down(route);
  await expect(main.getByRole("alert").filter({ hasText: /Không tải được/ }).first()).toBeVisible();
  await expect(main.getByText(/^Quan sát:$/).locator("xpath=following-sibling::span[1]")).toHaveText("—");
  await expect(main.getByText(/Chưa có registry/)).toHaveCount(0);
  await expect(main.getByText(/Chưa có quyết định forward nào/)).toHaveCount(0);

  mode = "empty";
  await main.getByRole("button", { name: /Làm mới dữ liệu/ }).click();
  await expect(main.getByText(/Chưa có quyết định forward nào được ghi/)).toBeVisible();
  await expect(main.getByText(/^Quan sát:$/).locator("xpath=following-sibling::span[1]")).toHaveText("0");
});

test("Dự đoán: failed evaluation/history never renders 0% or 'no Valid predictions'", async ({ page }) => {
  await mockBackend(page, () => false);
  await page.goto("/du-doan");
  const main = page.locator("main");
  await expect(main.getByText(/Không tải được prediction evaluation/)).toBeVisible();
  await expect(main.getByText(/Không tải được lịch sử dự đoán/)).toBeVisible();
  await expect(main.getByText(/Không tải được danh sách model/)).toBeVisible();
  await expect(main.getByText("0%", { exact: true })).toHaveCount(0);
  await expect(main.getByText(/Không có dự đoán Valid/)).toHaveCount(0);
  await expect(main.getByText(/Chưa có model tương thích/)).toHaveCount(0);
  await expect(main.getByRole("button", { name: "Dự đoán", exact: true })).toBeDisabled();
});

test("Mô phỏng lịch sử: partial success, and a failed refresh keeps the success time", async ({ page }) => {
  let tradesUp = true;
  await mockBackend(page, (route, path) => {
    if (path === "/api/paper-trades") {
      if (tradesUp) void json(route, { totalCount: 0, page: 1, pageSize: 10, totalPages: 0, items: [] });
      else void down(route);
      return true;
    }
    return false; // portfolio-summary falls through to 503 → partial success
  });
  await page.goto("/nhat-ky");
  const main = page.locator("main");
  await expect(main.getByText(/Không tìm thấy lệnh nào phù hợp/)).toBeVisible();
  await expect(main.getByText(/\(0 lệnh\)/)).toBeVisible();
  await expect(main.getByText(/Không tải được tổng quan danh mục mô phỏng/)).toBeVisible();
  const stamp = main.getByText(/^Cập nhật \d/);
  await expect(stamp).toBeVisible();
  const firstStamp = await stamp.textContent();

  tradesUp = false;
  await page.waitForTimeout(1_100); // make a moved timestamp observable
  await main.getByRole("button", { name: /Làm mới/ }).first().click();
  await expect(main.getByText(/lần làm mới.*lỗi/).first()).toBeVisible();
  await expect(stamp).toHaveText(firstStamp ?? "");
});

test("Mô phỏng lịch sử: no success yet → no 'Cập nhật' time and no 0 count", async ({ page }) => {
  await mockBackend(page, () => false);
  await page.goto("/nhat-ky");
  const main = page.locator("main");
  await expect(main.getByText(/Không tải được danh sách giao dịch mô phỏng/).first()).toBeVisible();
  await expect(main.getByText(/^Cập nhật \d/)).toHaveCount(0);
  await expect(main.getByText(/\(— lệnh\)/)).toBeVisible();
  await expect(main.getByText(/Không tìm thấy lệnh nào/)).toHaveCount(0);
});

test("Backtest / Rules / Telegram: failure is not reported as empty or 'not configured'", async ({ page }) => {
  await mockBackend(page, () => false);
  await page.goto("/backtest");
  await expect(page.locator("main").getByText(/Không tải được danh sách backtest/)).toBeVisible();
  await expect(page.locator("main").getByText(/Không có backtest Valid/)).toHaveCount(0);

  await page.goto("/rules-nen");
  await expect(page.locator("main").getByText(/Không tải được danh mục rules/)).toBeVisible();
  await expect(page.locator("main").getByText(/Chưa có rule tự động nào/)).toHaveCount(0);

  await page.goto("/canh-bao");
  await expect(page.locator("[data-telegram-status]")).toHaveAttribute("data-telegram-status", "unverified");
  await expect(page.locator("main").getByText("chưa cấu hình", { exact: true })).toHaveCount(0);
  await expect(page.locator("main").getByText(/Không tải được cấu hình cảnh báo/)).toBeVisible();
  // The form never presents defaults as the stored configuration.
  await expect(page.locator("#price-above")).toHaveCount(0);
});

test("Ensemble backtest form and Lab controls have accessible names", async ({ page }) => {
  await mockBackend(page, () => false);
  await page.goto("/backtest");
  await page.getByRole("tab", { name: "Ensemble (Experimental)" }).click();
  for (const name of ["Timeframe", "Min Conf", "Fee Bps", "Capital"]) {
    await expect(page.getByLabel(name, { exact: true })).toBeVisible();
  }
  await page.getByLabel("Min Conf", { exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Fee Bps", { exact: true })).toBeFocused();

  await page.goto("/canh-bao");
  const lab = page.getByTestId("settings-lab");
  await expect(lab).not.toHaveAttribute("open", "");
  await expect(page.getByLabel("Mã dữ liệu cần kiểm tra")).toHaveCount(0); // not mounted while closed
  await lab.locator("summary").click();
  await expect(page.getByLabel("Mã dữ liệu cần kiểm tra")).toBeVisible();
  await expect(page.getByLabel("Khung thời gian cần kiểm tra")).toBeVisible();
  await expect(page.getByLabel("Từ khóa kiểm thử tìm kiếm tin tức (RAG)")).toBeVisible();
});

test("mobile 390px: exactly one market-trades tape, no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBackend(page, () => false);
  await page.goto("/");
  await expect(page.getByText("Lịch sử khớp lệnh (Market Trades)")).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

const SHELL_ROUTES = ["/", "/co-phieu?symbol=BID", "/mbb", "/tin-tuc", "/ai", "/nghien-cuu", "/mau-nen", "/rules-nen", "/backtest", "/du-doan", "/paper", "/nhat-ky", "/canh-bao"];

for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 720 }]) {
  test(`${viewport.name}: every route under outage has no horizontal overflow and no unnamed form control`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await mockBackend(page, () => false);
    for (const route of SHELL_ROUTES) {
      await page.goto(route);
      await expect(page.getByRole("heading", { name: "Bitcoin AI Analyst" })).toBeVisible();
      await page.waitForTimeout(400);
      const report = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        unnamed: [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("main input:not([type=hidden]), main select, main textarea")]
          .filter((el) => el.offsetParent !== null && !(el.labels && el.labels.length) && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
          .map((el) => el.outerHTML.slice(0, 80)),
      }));
      expect(report.overflow, `${route} overflow`).toBeLessThanOrEqual(0);
      expect(report.unnamed, `${route} unnamed controls`).toEqual([]);
    }
  });
}

test("desktop 1440px: one tape with the realtime aside closed and opened", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBackend(page, () => false);
  await page.goto("/");
  await expect(page.getByText("Lịch sử khớp lệnh (Market Trades)")).toHaveCount(1);
  await page.getByRole("button", { name: "Mở panel dữ liệu realtime" }).click();
  await expect(page.getByText("Lịch sử khớp lệnh (Market Trades)")).toHaveCount(1);
});

test("ticker REST outage backs off instead of polling every 4s", async ({ page }) => {
  let tickerCalls = 0;
  await mockBackend(page, (route, path) => {
    if (path === "/api/market/tickers") { tickerCalls += 1; void down(route); return true; }
    return false;
  });
  await page.goto("/");
  await page.waitForTimeout(13_000);
  // Fixed 4s polling would give ≥4 calls in 13s; backoff gives 1 + (8s) = 2.
  expect(tickerCalls).toBeLessThanOrEqual(2);
});
