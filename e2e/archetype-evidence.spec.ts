import { expect, test } from "@playwright/test";

const outcome = {
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

function bars(seed: number) {
  return Array.from({ length: 15 }, (_, index) => {
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

test("gallery shows one archetype beside eight auditable source windows with pagination", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/meta") {
      await route.fulfill({ json: {
        appVersion: "test",
        apiContractVersion: "2026-09-archetype-evidence",
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
          bestOutcome: outcome,
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
        horizon: "4h",
        page: currentPage,
        pageSize,
        total: 128,
        items: Array.from({ length: pageSize }, (_, offset) => {
          const index = start + offset;
          return {
            windowStartMs: 1_700_000_000_000 - index * 86_400_000,
            windowEndMs: 1_700_201_600_000 - index * 86_400_000,
            distanceToCentroid: 0.05 + index / 10_000,
            label: index % 2 === 0 ? 1 : -1,
            targetReturn: index % 2 === 0 ? 0.9 : -0.7,
            outcomeAvailable: true,
            ohlc: bars(index),
            ohlcComplete: true,
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
  await expect(evidence.getByTestId("archetype-evidence-card")).toHaveCount(8);
  await expect(evidence.getByText("THẮNG", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("THUA", { exact: true }).first()).toBeVisible();
  await expect(evidence.getByText("1–8 / 128 mẫu", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.getByText("Trang 2 / 16")).toBeVisible();
  await expect(page.getByText("Mẫu #9")).toBeVisible();
  await expect(evidence.getByTestId("archetype-evidence-card")).toHaveCount(8);
});
