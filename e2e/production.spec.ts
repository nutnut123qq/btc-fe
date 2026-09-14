import { expect, test, type Page } from "@playwright/test";

const productionUrl = process.env.PLAYWRIGHT_BASE_URL;
const requireLlm = process.env.PLAYWRIGHT_REQUIRE_LLM !== "0";

type HistoricalAnalogOutcome = {
  barsAhead: number;
  targetClose: number;
  returnPct: number;
  thresholdPct: number;
  direction: -1 | 0 | 1;
};

type HistoricalAnalogItem = {
  endTimeMs: number;
  futureEndTimeMs: number;
  ohlc: Array<{ close: number }>;
  futureOhlc: unknown[];
  outcomes: HistoricalAnalogOutcome[];
};

type HistoricalAnalogResponse = {
  contractVersion: string;
  method: string;
  rankingMethod: string;
  evaluationMethod: string;
  intervalMs: number;
  exclusionBars: number;
  rawCandidateCount: number;
  independentCandidateCount: number;
  effectiveSampleCount: number;
  total: number;
  page: number;
  pageSize: number;
  query: {
    startTimeMs: number;
    ohlc: unknown[];
  };
  validation: {
    status: string;
    isOutOfSampleValidated: boolean;
    reason: string;
  };
  summaries: Array<{
    barsAhead: number;
    totalSamples: number;
    upCount: number;
    downCount: number;
    neutralCount: number;
  }>;
  items: HistoricalAnalogItem[];
};

function expectHistoricalAnalogInvariants(data: HistoricalAnalogResponse) {
  expect(data.contractVersion).toBe("2026-09-historical-analogs");
  expect(data.method).toBe("historical-analog-returns-shape-v1");
  expect(data.rankingMethod).toBe("shape-similarity-desc-context-audit-only");
  expect(data.evaluationMethod).toBe("fixed-horizon-close-to-close-economic-threshold");
  expect(data.intervalMs).toBe(4 * 60 * 60 * 1_000);
  expect(data.exclusionBars).toBe(15 + 6);
  expect(data.page).toBe(1);
  expect(data.pageSize).toBe(50);
  expect(data.items.length).toBeLessThanOrEqual(50);
  expect(data.query.ohlc).toHaveLength(15);
  expect(data.rawCandidateCount).toBeGreaterThanOrEqual(data.independentCandidateCount);
  expect(data.independentCandidateCount).toBeGreaterThanOrEqual(data.effectiveSampleCount);
  expect(data.total).toBe(data.effectiveSampleCount);
  expect(data.validation.status).toBe("exploratory");
  expect(data.validation.isOutOfSampleValidated).toBe(false);
  expect(data.validation.reason.length).toBeGreaterThan(0);
  expect(data.summaries.map((summary) => summary.barsAhead)).toEqual([1, 3, 6]);

  for (const summary of data.summaries) {
    expect(summary.totalSamples).toBe(data.effectiveSampleCount);
    expect(summary.upCount + summary.downCount + summary.neutralCount).toBe(summary.totalSamples);
  }

  const minimumSeparationMs = data.exclusionBars * data.intervalMs;
  for (let left = 0; left < data.items.length; left += 1) {
    const item = data.items[left];
    expect(item.futureEndTimeMs).toBeLessThan(data.query.startTimeMs);
    expect(item.ohlc).toHaveLength(15);
    expect(item.futureOhlc).toHaveLength(6);
    expect(item.outcomes.map((outcome) => outcome.barsAhead)).toEqual([1, 3, 6]);

    const baseClose = item.ohlc.at(-1)?.close;
    expect(baseClose).toBeGreaterThan(0);
    for (const outcome of item.outcomes) {
      const expectedReturnPct = ((outcome.targetClose / baseClose!) - 1) * 100;
      expect(Math.abs(outcome.returnPct - expectedReturnPct)).toBeLessThan(1e-8);
      const expectedDirection = outcome.returnPct > outcome.thresholdPct
        ? 1
        : outcome.returnPct < -outcome.thresholdPct
          ? -1
          : 0;
      expect(outcome.direction).toBe(expectedDirection);
    }

    for (let right = left + 1; right < data.items.length; right += 1) {
      expect(Math.abs(item.endTimeMs - data.items[right].endTimeMs)).toBeGreaterThanOrEqual(minimumSeparationMs);
    }
  }
}

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
    test.setTimeout(150_000);
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

    await openTab(page, "Mẫu nến", "Historical Analog");
    const analogApiResponse = await page.request.get(new URL(
      "/api/historical-analogs?symbol=BTCUSDT&timeframe=4h&windowSize=15&neighborCount=50&page=1&pageSize=50&lookbackBars=20000&roundTripCostPct=0.15&atrMultiplier=0.25",
      productionUrl!,
    ).toString());
    expect(analogApiResponse.status()).toBe(200);
    const analogData = await analogApiResponse.json() as HistoricalAnalogResponse;
    expectHistoricalAnalogInvariants(analogData);
    const analogExplorer = page.getByRole("region", { name: "Historical Analog Explorer" });
    await expect(analogExplorer.getByTestId("analog-query-window")).toBeVisible({ timeout: 60_000 });
    await expect(analogExplorer.getByTestId("analog-summary")).toContainText("Sau 1 nến");
    await expect(analogExplorer.getByTestId("analog-summary")).toContainText("Sau 3 nến");
    await expect(analogExplorer.getByTestId("analog-summary")).toContainText("Sau 6 nến");
    await expect(analogExplorer.getByText(/Xếp hạng chỉ theo hình dạng; bối cảnh chỉ để đối chiếu/)).toBeVisible();
    await expect(analogExplorer.getByTestId("analog-card").first()).toBeVisible();
    await expect(analogExplorer.getByText(/Không thể tải Historical Analog/)).toHaveCount(0);
    await expect(analogExplorer).not.toContainText(/xác suất thắng|tỷ lệ thắng|win rate|tín hiệu mua|tín hiệu bán/i);
    if (analogData.total > 8) {
      await analogExplorer.getByRole("button", { name: "Trang sau" }).click();
      await expect(analogExplorer.getByText(/Trang 2\//)).toBeVisible();
      await expect(analogExplorer.getByTestId("analog-card").first()).toBeVisible();
    }

    await page.getByRole("button", { name: "Thư viện (audit)", exact: true }).click();
    const archetypeEvidence = page.locator("section[aria-label^='Mẫu gốc của ']").first();
    await expect(archetypeEvidence).toBeVisible({ timeout: 30_000 });
    await expect(archetypeEvidence.getByTestId("archetype-evidence-card").first()).toBeVisible({ timeout: 30_000 });
    await expect(archetypeEvidence.getByText(/Close-to-close sau 1, 3 và 6 nến/)).toBeVisible();
    await expect(archetypeEvidence.getByText("Nguồn: giá đóng cửa Klines", { exact: true })).toBeVisible();
    await expect(archetypeEvidence.getByText(/OHLC không đủ|Thiếu OHLC|Nến tương lai chưa đủ/)).toHaveCount(0);
    await expect(archetypeEvidence.getByText(/ĐÚNG HƯỚNG|SAI HƯỚNG/, { exact: true }).first()).toBeVisible();
    await openTab(page, "Tin tức", "Tin tức");
    await openTab(page, "AI", /Phân tích AI Đa Tác Tử/);
    if (requireLlm) {
      await expect(page.locator("main").getByRole("button", { name: "Phân tích bằng AI" })).toBeEnabled({ timeout: 30_000 });
    } else {
      await expect(page.locator("main").getByText(/LLM OFF — phân tích đa tác tử chưa khả dụng/)).toBeVisible();
    }
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
