import { expect, test } from "@playwright/test";

const legacyOutcome = {
  horizon: "4h",
  totalSamples: 128,
  upRate: 0.75,
  downRate: 0.2,
  sidewaysRate: 0.05,
  avgReturnPct: 0.8,
  medianReturnPct: 0.6,
  maxReturnPct: 4.2,
  minReturnPct: -2.1,
  stdDevReturnPct: 1.1,
  recentSamples: 32,
  recentUpRate: 0.72,
  recentDownRate: 0.22,
  recentAvgReturnPct: 0.7,
};

function bars(seed: number, length = 15) {
  return Array.from({ length }, (_, index) => {
    const open = 60_000 + seed * 10 + index * 20;
    const close = open + (index % 3 === 0 ? -15 : 25);
    return {
      openTimeMs: 1_700_000_000_000 + index * 14_400_000,
      open,
      high: Math.max(open, close) + 20,
      low: Math.min(open, close) - 20,
      close,
      volume: 100 + index,
    };
  });
}

test("gallery shows close-to-close evidence, six future candles and pagination", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/meta") {
      await route.fulfill({ json: {
        appVersion: "test",
        apiContractVersion: "2026-09-archetype-fixed-horizon",
        dataPipelineVersion: "quant-pipeline-v3",
        evaluationVersion: "evaluation-v2",
        environment: "Research",
      } });
      return;
    }
    if (url.pathname === "/api/archetypes") {
      await route.fulfill({ json: {
        requestId: "gallery-test",
        symbol: "BTCUSDT",
        timeframe: "4h",
        windowSize: 15,
        page: 1,
        pageSize: 50,
        total: 1,
        items: [{
          id: 1,
          archetypeCode: "BTC-4H-W15-A007",
          symbol: "BTCUSDT",
          timeframe: "4h",
          windowSize: 15,
          memberCount: 128,
          intraClusterDistance: 0.12,
          representativeOhlc: bars(0),
          bestOutcome: legacyOutcome,
        }],
      } });
      return;
    }
    if (url.pathname === "/api/archetypes/1/occurrences") {
      const currentPage = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "8");
      const start = (currentPage - 1) * pageSize;
      await route.fulfill({ json: {
        requestId: "evidence-test",
        archetypeId: 1,
        evaluationMethod: "fixed-horizon-close-to-close",
        forwardBars: [1, 3, 6],
        page: currentPage,
        pageSize,
        total: 128,
        summaries: [
          { barsAhead: 1, totalSamples: 128, upRate: 0.75, downRate: 0.25, sidewaysRate: 0, avgReturnPct: 0.8, dominantDirection: 1 },
          { barsAhead: 3, totalSamples: 128, upRate: 0.4, downRate: 0.6, sidewaysRate: 0, avgReturnPct: -0.2, dominantDirection: -1 },
          { barsAhead: 6, totalSamples: 128, upRate: 0.7, downRate: 0.3, sidewaysRate: 0, avgReturnPct: 1.1, dominantDirection: 1 },
        ],
        items: Array.from({ length: pageSize }, (_, offset) => {
          const index = start + offset;
          const primaryDirection = index % 2 === 0 ? 1 : -1;
          return {
            windowStartMs: 1_700_000_000_000 - index * 86_400_000,
            windowEndMs: 1_700_201_600_000 - index * 86_400_000,
            distanceToCentroid: 0.05 + index / 10_000,
            ohlc: bars(index),
            ohlcComplete: true,
            futureOhlc: bars(index + 100, 6),
            futureOhlcComplete: true,
            fixedHorizonOutcomes: [
              { barsAhead: 1, targetOpenTimeMs: 1, targetClose: 60_100, returnPct: primaryDirection * 0.9, direction: primaryDirection, available: true },
              { barsAhead: 3, targetOpenTimeMs: 3, targetClose: 59_900, returnPct: -0.7, direction: -1, available: true },
              { barsAhead: 6, targetOpenTimeMs: 6, targetClose: 60_500, returnPct: 1.4, direction: 1, available: true },
            ],
          };
        }),
      } });
      return;
    }
    await route.fulfill({ json: {} });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Mẫu nến", exact: true }).click();

  await expect(page.getByText("BTC-4H-W15-A007").first()).toBeVisible();
  const evidence = page.getByRole("region", { name: "Mẫu gốc của BTC-4H-W15-A007" });
  await expect(evidence).toBeVisible();
  await expect(evidence.getByText(/Close-to-close sau 1, 3 và 6 nến/)).toBeVisible();
  await expect(evidence.getByTestId("fixed-horizon-summaries")).toContainText("+1 nến: TĂNG");
  await expect(evidence.getByTestId("archetype-evidence-card")).toHaveCount(8);
  await expect(evidence.getByText("ĐÚNG HƯỚNG", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("SAI HƯỚNG", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("6 nến ngay sau mẫu", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("Sau 1 nến", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("Sau 3 nến", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("Sau 6 nến", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("1–8 / 128 mẫu", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.getByText("Trang 2 / 16")).toBeVisible();
  await expect(page.getByText("Mẫu #9")).toBeVisible();
  await expect(evidence.getByTestId("archetype-evidence-card")).toHaveCount(8);
});
