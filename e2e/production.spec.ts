import { expect, test, type Page } from "@playwright/test";

const productionUrl = process.env.PLAYWRIGHT_BASE_URL;

async function openTab(page: Page, tab: string, visibleText: string | RegExp) {
  await page.getByRole("button", { name: tab, exact: true }).click();
  const activeContent = page
    .locator("main")
    .getByText(visibleText)
    .filter({ visible: true })
    .first();
  await expect(activeContent).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("main").getByText(new RegExp(`Lỗi tải tab ${tab}`, "i"))).toHaveCount(0);
}

test.describe("production dashboard", () => {
  test.skip(!productionUrl, "Set PLAYWRIGHT_BASE_URL to run production checks.");

  test("all tabs load without browser or API failures", async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    const failedApis: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.origin === new URL(productionUrl!).origin && url.pathname.startsWith("/api/") && response.status() >= 500) {
        failedApis.push(`${response.status()} ${url.pathname}`);
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Bitcoin AI Analyst" })).toBeVisible();
    await expect(page.getByText(/Đang kiểm tra API contract/)).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(/API contract không khớp|Không kiểm tra được API contract/)).toHaveCount(0);

    await expect(page.getByRole("button", { name: /Sàn Binance Pro/ })).toBeVisible();
    const advancedButton = page.getByRole("button", { name: /Phân tích nâng cao/ });
    const advancedHeading = page.locator("main").getByText(/Deep Analysis & Pattern Index/);
    await expect(async () => {
      await advancedButton.click();
      await expect(advancedHeading).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 15_000 });
    await page.getByRole("button", { name: /Sàn Binance Pro/ }).click();

    await openTab(page, "Mẫu nến", "Thư viện");
    await openTab(page, "Tin tức", "Tin tức");
    await openTab(page, "AI", /Phân tích AI Đa Tác Tử/);
    await expect(page.locator("main").getByRole("button", { name: "Phân tích bằng AI" })).toBeEnabled({ timeout: 30_000 });
    await openTab(page, "Rules nến", /Rule Discovery/);
    await openTab(page, "Dự đoán", "Dự đoán hướng giá ML");
    await expect(page.locator("main").getByRole("button", { name: "Dự đoán", exact: true })).toBeDisabled();
    await expect(page.getByText(/Chưa có model tương thích đã qua promotion gate/)).toBeVisible({ timeout: 30_000 });
    await openTab(page, "Paper", "Paper Trading");
    await openTab(page, "Nhật ký Paper đa tài sản", /Danh sách giao dịch mô phỏng/);
    await openTab(page, "Backtest", "Backtest chiến lược ML");
    await openTab(page, "Cảnh báo", "Cài đặt cảnh báo giá (BTC)");

    await page.getByRole("button", { name: "Thông báo" }).click();
    await expect(page.getByText(/Thông báo/).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(2_000);

    expect(failedApis).toEqual([]);
    expect(errors).toEqual([]);
  });
});
