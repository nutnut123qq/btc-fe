import { expect, test, type Page } from "@playwright/test";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract";
import {
  HISTORICAL_ANALOG_CONTRACT_VERSION,
  HISTORICAL_ANALOG_RANKING_METHOD,
} from "../src/lib/historicalAnalog";

const META = {
  appVersion: "e2e",
  apiContractVersion: EXPECTED_API_CONTRACT_VERSION,
  dataPipelineVersion: "quant-pipeline-v3",
  evaluationVersion: "evaluation-v2",
  environment: "Research",
};

const ARC = (id: number) => ({
  id,
  archetypeCode: `ARC-${id}`,
  symbol: "BTCUSDT",
  timeframe: "4h",
  windowSize: 15,
  memberCount: 120,
  intraClusterDistance: 0.123,
  representativeOhlc: null,
  bestOutcome: null,
});

const ARC_DETAIL = (id: number) => ({
  ...ARC(id),
  outcomes: [],
});

const OCCURRENCES = (id: number) => ({
  requestId: "e2e",
  archetypeId: id,
  evaluationMethod: "fixed-horizon-close-to-close",
  forwardBars: [1, 3, 6],
  page: 1,
  pageSize: 20,
  total: 1,
  summaries: [],
  items: [
    {
      windowStartMs: 1750000000000,
      windowEndMs: 1750054000000,
      distanceToCentroid: 0.05,
      ohlc: [],
      ohlcComplete: false,
      futureOhlc: [],
      futureOhlcComplete: false,
      fixedHorizonOutcomes: [
        { barsAhead: 1, targetOpenTimeMs: 1750054000000, targetClose: 100, returnPct: 1.5, direction: 1, available: true },
      ],
    },
  ],
});

const MATRIX = {
  symbol: "BTCUSDT",
  timeframe: "4h",
  windowSize: 15,
  archetypeCount: 2,
  totalTransitions: 30,
  cells: [
    { fromId: 7, fromCode: "ARC-7", toId: 8, toCode: "ARC-8", probability: 0.4, count: 12 },
  ],
};

// The transitions-from fixture names a code that appears ONLY in the right
// panel ("Top chuyển đổi tiếp theo") — it never shows in the matrix cells,
// so asserting on ARC-9 is an unambiguous "selection loaded" signal.
const TRANSITIONS_FROM_7 = {
  archetypeId: 7,
  transitions: [
    {
      id: 1,
      fromArchetypeId: 7,
      fromArchetypeCode: "ARC-7",
      toArchetypeId: 9,
      toArchetypeCode: "ARC-9",
      transitionCount: 12,
      transitionProbability: 0.4,
      avgReturnPct: 1.23,
      avgBarsToTransition: 4.5,
      lastSeenMs: 1760000000000,
    },
  ],
};

// The default "analog" tab fetches this on mount — the fixture must satisfy
// HistoricalAnalogView's render path (data.validation.status etc.), not just
// the envelope asserts, or the screen-level ErrorBoundary swallows every tab.
const HISTORICAL_ANALOGS_EMPTY = {
  requestId: "e2e",
  contractVersion: HISTORICAL_ANALOG_CONTRACT_VERSION,
  method: "shape-similarity",
  methodVersion: "e2e",
  rankingMethod: HISTORICAL_ANALOG_RANKING_METHOD,
  evaluationMethod: "fixed-horizon-close-to-close-economic-threshold",
  symbol: "BTCUSDT",
  timeframe: "4h",
  intervalMs: 14400000,
  windowSize: 10,
  lookbackBars: 2000,
  neighborCount: 30,
  page: 1,
  pageSize: 10,
  total: 0,
  exclusionBars: 0,
  roundTripCostPct: 0.15,
  atrMultiplier: 1,
  rawCandidateCount: 0,
  independentCandidateCount: 0,
  effectiveSampleCount: 0,
  validation: { status: "unavailable", isOutOfSampleValidated: false, reason: "e2e empty fixture" },
  query: null,
  summaries: [],
  items: [],
};

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
    if (path === "/api/historical-analogs") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(HISTORICAL_ANALOGS_EMPTY) });
      return;
    }
    if (path === "/api/archetypes") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ symbol: "BTCUSDT", count: 2, items: [ARC(7), ARC(8)] }) });
      return;
    }
    const occurrencesMatch = /^\/api\/archetypes\/(\d+)\/occurrences$/.exec(path);
    if (occurrencesMatch) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OCCURRENCES(Number(occurrencesMatch[1]))) });
      return;
    }
    const detailMatch = /^\/api\/archetypes\/(\d+)$/.exec(path);
    if (detailMatch) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ARC_DETAIL(Number(detailMatch[1]))) });
      return;
    }
    if (path === "/api/transitions/matrix") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MATRIX) });
      return;
    }
    if (path === "/api/transitions/from/7") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TRANSITIONS_FROM_7) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  return errors;
}

const MODAL_OCCURRENCES_HEADING = "Các lần xuất hiện gần đây";

test("cold deep-link ?arc=<id> opens the gallery detail modal directly", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?arc=7");
  await expect(page.getByRole("tab", { name: "Thư viện (audit)" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
  await expect(page.getByRole("button", { name: "Đóng" })).toBeVisible();
  await expect(page).toHaveURL(/\/mau-nen\?arc=7/);
});

test("clicking a gallery card pushes ?arc=<id> and opens its detail modal", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen");
  await page.getByRole("tab", { name: "Thư viện (audit)" }).click();
  await page.getByRole("button", { name: /Mở chi tiết mẫu/ }).filter({ hasText: "ARC-7" }).click();
  await expect(page).toHaveURL(/\/mau-nen\?arc=7/);
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
});

test("browser Back after opening a detail modal clears the param and closes it", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen");
  await page.getByRole("tab", { name: "Thư viện (audit)" }).click();
  await page.getByRole("button", { name: /Mở chi tiết mẫu/ }).filter({ hasText: "ARC-7" }).click();
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/mau-nen$/);
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toHaveCount(0);
});

test("closing the modal clears ?arc from the URL", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?arc=7");
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
  await page.getByRole("button", { name: "Đóng" }).click();
  await expect(page).toHaveURL(/\/mau-nen$/);
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toHaveCount(0);
});

test("non-canonical ?arc value is dropped from the URL instead of opening a modal", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?arc=abc");
  await expect(page).toHaveURL(/\/mau-nen$/);
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toHaveCount(0);
});

test("cold deep-link ?from=<id> selects the transitions source", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?from=7");
  await expect(page.getByRole("tab", { name: "Chuyển đổi" })).toHaveAttribute("aria-selected", "true");
  // ARC-9 only exists in the transitions-from payload — seeing it means the
  // selection resolved and rendered.
  await expect(page.getByText("ARC-9")).toBeVisible();
  await expect(page).toHaveURL(/\/mau-nen\?from=7/);
});

test("clicking a matrix cell pushes ?from=<id>", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen");
  await page.getByRole("tab", { name: "Chuyển đổi" }).click();
  await page.getByRole("button", { name: /ARC-7 → ARC-8/ }).click();
  await expect(page).toHaveURL(/\/mau-nen\?from=7/);
  await expect(page.getByText("ARC-9")).toBeVisible();
});

test("switching to the rankings tab clears the ?from param and its selection", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?from=7");
  await expect(page.getByText("ARC-9")).toBeVisible();
  await page.getByRole("tab", { name: "Bảng xếp hạng" }).click();
  await expect(page).toHaveURL(/\/mau-nen$/);
  await expect(page.getByRole("tab", { name: "Bảng xếp hạng" })).toHaveAttribute("aria-selected", "true");
});

test("leaving the gallery tab drops ?arc when no modal is open", async ({ page }) => {
  await mockBackend(page);
  // Detail fetch fails permanently — the modal never opens, so the tab bar
  // stays reachable while ?arc is still set.
  await page.route("**/api/archetypes/7", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: "{\"message\":\"boom\"}" });
  });
  await page.goto("/mau-nen?arc=7");
  await expect(page.getByText("Không thể tải chi tiết mẫu nến.")).toBeVisible();
  await page.getByRole("tab", { name: "Analog lịch sử" }).click();
  await expect(page).toHaveURL(/\/mau-nen$/);
});

test("a failed detail fetch keeps ?arc and clicking the same card retries it", async ({ page }) => {
  await mockBackend(page);
  // Registered after mockBackend so it takes precedence (routes match LIFO).
  let failed = false;
  await page.route("**/api/archetypes/7", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 500, contentType: "application/json", body: "{\"message\":\"boom\"}" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ARC_DETAIL(7)) });
  });
  await page.goto("/mau-nen?arc=7");
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toHaveCount(0);
  await expect(page.getByText("Không thể tải chi tiết mẫu nến.")).toBeVisible();
  // URL keeps ?arc=7 (the target is honest — the fetch failed, not the link).
  await expect(page).toHaveURL(/\/mau-nen\?arc=7/);
  // Clicking the same card retries the fetch directly — the unchanged param
  // cannot re-fire the effect, so this is the only retry path.
  await page.getByRole("button", { name: /Mở chi tiết mẫu/ }).filter({ hasText: "ARC-7" }).click();
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
});

test("a failed transitions-from fetch keeps ?from and clicking the same cell retries it", async ({ page }) => {
  await mockBackend(page);
  let failed = false;
  await page.route("**/api/transitions/from/7*", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 500, contentType: "application/json", body: "{\"message\":\"boom\"}" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TRANSITIONS_FROM_7) });
  });
  await page.goto("/mau-nen?from=7");
  await expect(page.getByText("Chọn một mẫu ở cột trái để xem chi tiết chuyển đổi")).toBeVisible();
  await expect(page.getByText("ARC-9")).toHaveCount(0);
  await expect(page).toHaveURL(/\/mau-nen\?from=7/);
  await page.getByRole("button", { name: /ARC-7 → ARC-8/ }).click();
  await expect(page.getByText("ARC-9")).toBeVisible();
});

test("a hand-crafted URL carrying both params resolves to the detail modal and drops ?from", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/mau-nen?arc=7&from=8");
  await expect(page).toHaveURL(/\/mau-nen\?arc=7$/);
  await expect(page.getByText(MODAL_OCCURRENCES_HEADING)).toBeVisible();
});
