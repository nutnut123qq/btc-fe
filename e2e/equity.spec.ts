import { expect, test } from "@playwright/test";
import { openMainTab } from "./nav";
import { ALLOWED_SHELL_PATHS, apiPaths, expectNoCryptoRequests, mockBackend, screenshot, symbolGroup, withAdmin } from "./equityMocks";

// EQX-C1 — /co-phieu equity screen (MBB + BID) against the shared mocked backend.

test.describe("/co-phieu equity screen", () => {
  test("BID happy path: 1d only, BID endpoints, base-rates abstained, context sections, no crypto", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");

    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    await expect(symbolGroup(page).getByRole("button", { name: "BID" })).toHaveAttribute("aria-pressed", "true");
    const tfGroup = page.getByRole("group", { name: "Khung thời gian BID" });
    await expect(tfGroup.getByRole("button")).toHaveCount(1);
    await expect(tfGroup.getByRole("button", { name: "1d" })).toBeVisible();
    await expect(page.locator('section[aria-labelledby="bid-chart-title"] canvas').first()).toBeAttached({ timeout: 15_000 });

    const decisionCard = page.getByTestId("bid-decision");
    await expect(decisionCard.getByText("Chờ", { exact: true })).toBeVisible();
    await expect(decisionCard.getByText("Lý do riêng của BID")).toBeVisible();
    await expect(page.getByTestId("bid-position-summary").getByText("100 cp").first()).toBeVisible();

    const baseRates = page.getByTestId("bid-base-rates");
    await expect(baseRates.getByText("abstained", { exact: true }).first()).toBeVisible();
    await expect(baseRates.getByText("stale", { exact: true })).toBeVisible();
    await expect(baseRates.getByText(/chưa kiểm định \/ unvalidated/)).toBeVisible();
    await expect(baseRates.getByTestId("base-rates-decision-use")).toHaveCount(0);
    await expect(baseRates.getByText("n hiệu dụng (không chồng lấn)")).toBeVisible();

    const ctx = page.getByTestId("bid-context");
    await expect(ctx.getByTestId("bid-context-corporate-actions")).toHaveAttribute("data-status", "unavailable");
    await expect(ctx.getByText("Nguồn sự kiện quyền VCI chưa khả dụng")).toBeVisible();
    await expect(ctx.getByTestId("bid-context-events")).toHaveAttribute("data-status", "empty");
    await expect(ctx.getByText(/Không đủ phiên chung với CTG/)).toBeVisible();
    await expect(ctx.getByText(/no point-in-time source verified/)).toBeVisible();

    await expect(page.getByTestId("bid-observations").getByText("rules-only-BID")).toBeVisible();
    await expect(page.getByTestId("bid-quality").getByText("Giới hạn dữ liệu BID")).toBeVisible();

    const paths = apiPaths(requests);
    for (const surface of ["candles", "conditions", "observations", "data-quality", "decision", "position", "base-rates", "context"]) {
      expect(paths, `BID ${surface} via /api/equities`).toContain(`/api/equities/BID/${surface}`);
    }
    expect(paths.some((p) => p.startsWith("/api/mbb/")), "BID must not hit the MBB alias").toBe(false);
    expect(requests.some((r) => r.includes("timeframe=1h")), "BID never requests 1h").toBe(false);
    expectNoCryptoRequests(requests);
    await screenshot(page, "c1-bid.png");
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test("MBB on /co-phieu keeps /api/mbb for legacy surfaces and /api/equities/MBB for new ones", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await withAdmin(page);
    await page.goto("/co-phieu");

    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    const tfGroup = page.getByRole("group", { name: "Khung thời gian MBB" });
    await expect(tfGroup.getByRole("button")).toHaveCount(2);
    await expect(page.getByTestId("mbb-base-rates").getByText(/chưa kiểm định \/ unvalidated/)).toBeVisible();
    await expect(page.getByTestId("mbb-context").getByText(/Bối cảnh MBB: NIM/)).toBeVisible();

    const paths = apiPaths(requests);
    for (const surface of ["candles", "conditions", "observations", "data-quality", "decision", "position"]) {
      expect(paths).toContain(`/api/mbb/${surface}`);
    }
    expect(paths).toContain("/api/equities/MBB/base-rates");
    expect(paths).toContain("/api/equities/MBB/context");
    expect(paths.some((p) => p.startsWith("/api/equities/BID/"))).toBe(false);
    expectNoCryptoRequests(requests);
    await screenshot(page, "c1-mbb.png");

    // 1h on MBB refetches the timeframe-scoped panels only for MBB.
    requests.length = 0;
    const obs1h = page.waitForResponse((r) => r.url().includes("/api/mbb/observations?") && r.url().includes("timeframe=1h"));
    await tfGroup.getByRole("button", { name: "1h" }).click();
    await obs1h;
    await expect(page.getByRole("heading", { name: "Nhật ký quan sát MBB (1h)" })).toBeVisible();
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test("switching MBB→BID never renders the slower MBB responses", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests, { delayBySymbol: { MBB: 2_000 } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    // MBB is still loading (delayed) — switch before any MBB response lands.
    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    await page.waitForURL((url) => url.pathname === "/co-phieu" && url.searchParams.get("symbol") === "BID");
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    await expect(page.getByTestId("bid-decision").getByText("Lý do riêng của BID")).toBeVisible();

    // Let every delayed MBB response arrive, then assert nothing MBB rendered.
    await page.waitForTimeout(2_600);
    await expect(page.getByTestId("equity-screen")).toHaveAttribute("data-symbol", "BID");
    await expect(page.getByText("Lý do riêng của MBB")).toHaveCount(0);
    await expect(page.getByText("Giới hạn dữ liệu MBB")).toHaveCount(0);
    await expect(page.getByText("rules-only-MBB")).toHaveCount(0);
    await expect(page.getByText(/Bối cảnh MBB/)).toHaveCount(0);
    await expect(page.getByTestId("bid-position-summary").getByText("100 cp").first()).toBeVisible();
    await expect(page.getByLabel("Số lượng (cp)").first()).toHaveValue("100");
    expect(errors).toEqual([]);
  });

  test("switching BID→MBB with BID delayed renders only MBB", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests, { delayBySymbol: { BID: 2_000 } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    await symbolGroup(page).getByRole("button", { name: "MBB" }).click();
    await page.waitForURL((url) => url.searchParams.get("symbol") === "MBB");
    await expect(page.getByTestId("mbb-decision").getByText("Lý do riêng của MBB")).toBeVisible();
    await page.waitForTimeout(2_600);
    await expect(page.getByText("Lý do riêng của BID")).toHaveCount(0);
    await expect(page.getByText("Giới hạn dữ liệu BID")).toHaveCount(0);
    await expect(page.getByLabel("Số lượng (cp)").first()).toHaveValue("200");
  });

  test("permission: locked per symbol without key, unlock loads only that symbol's position", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-decision-locked")).toBeVisible();
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    // Give a wrongly fired request time to be recorded before asserting its absence.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1_000);
    expect(apiPaths(requests)).not.toContain("/api/equities/BID/decision");
    expect(apiPaths(requests)).not.toContain("/api/equities/BID/position");
    // Observations are AdminGuard'd too: locked, and no request fired without a key.
    await expect(page.getByTestId("bid-observations-locked")).toBeVisible();
    expect(apiPaths(requests)).not.toContain("/api/equities/BID/observations");
    await screenshot(page, "c1-bid-locked.png");

    // Wrong key → server 401 → back to the locked state with an honest note.
    await page.locator("#admin-session-key").fill("wrong-key");
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await expect(page.getByText(/bị server từ chối \(HTTP 401\)/)).toBeVisible();
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    expect(await page.evaluate(() => window.sessionStorage.getItem("btc.adminKey"))).toBeNull();

    await page.locator("#admin-session-key").fill("e2e-admin");
    await page.getByRole("button", { name: "Mở khóa" }).click();
    await expect(page.getByTestId("bid-position-summary").getByText("100 cp").first()).toBeVisible();
    await expect(page.getByTestId("bid-decision").getByText("Lý do riêng của BID")).toBeVisible();
    await expect(page.getByTestId("bid-observations").getByText("rules-only-BID")).toBeVisible();

    // Same session key on MBB loads MBB's own holdings, never BID's lot.
    await symbolGroup(page).getByRole("button", { name: "MBB" }).click();
    await expect(page.getByTestId("mbb-position-summary").getByText("200 cp").first()).toBeVisible();
    await expect(page.getByLabel("Số lượng (cp)")).toHaveCount(1);
    await expect(page.getByLabel("Số lượng (cp)").first()).toHaveValue("200");
    expect(errors).toEqual([]);
  });

  test("older backend: base-rates/context 404 render unavailable, other panels unaffected", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests, { newSurfaces404: { MBB: true } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");
    await expect(page.getByTestId("mbb-base-rates-unavailable")).toBeVisible();
    await expect(page.getByTestId("mbb-base-rates-unavailable")).toContainText("HTTP 404");
    await expect(page.getByTestId("mbb-context-unavailable")).toBeVisible();
    await expect(page.getByTestId("mbb-decision").getByText("Lý do riêng của MBB")).toBeVisible();
    await expect(page.getByTestId("mbb-quality").getByText("Giới hạn dữ liệu MBB")).toBeVisible();
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test("locking while a position save is in flight never re-renders personal data", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests, { positionPutDelayMs: 1_500 });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-position-summary").getByText("100 cp").first()).toBeVisible();
    await page.locator("#bid-lot-qty-0").fill("300");
    const put = page.waitForResponse((r) => r.request().method() === "PUT" && r.url().includes("/api/equities/BID/position"));
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    await page.getByRole("button", { name: "Khóa lại" }).click();
    await put;
    await page.waitForTimeout(500);
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    await expect(page.getByTestId("bid-position-summary")).toHaveCount(0);
    await expect(page.locator("#bid-lot-qty-0")).toHaveCount(0);
    await expect(page.locator("#bid-cash")).toHaveCount(0);
    await expect(page.getByText(/Đã lưu vị thế/)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("conditions 429 shows an honest rate-limit state; incomparable cost basis withholds P&L", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests, { conditions429: { BID: true }, costBasisIncomparable: { BID: true } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-conditions").getByText(/giới hạn tần suất \(HTTP 429\), thử lại sau/)).toBeVisible({ timeout: 30_000 });
    const decisionCard = page.getByTestId("bid-decision");
    await expect(decisionCard.getByTestId("bid-cost-basis-note")).toContainText("chưa quy đổi theo sự kiện quyền");
    await expect(decisionCard.getByText("không tính — giá vốn chưa quy đổi")).toBeVisible();
    await expect(decisionCard.getByText(/-100\.000 ₫/)).toHaveCount(0);
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test("unknown / unsupported symbols show an honest error and fetch nothing symbol-scoped", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/co-phieu?symbol=XYZ");
    await expect(page.getByTestId("equity-symbol-error")).toContainText('Mã "XYZ" không có trong danh mục');
    await page.goto("/co-phieu?symbol=VNINDEX");
    await expect(page.getByTestId("equity-symbol-error")).toContainText("VNINDEX là chỉ số");
    await page.goto("/co-phieu?symbol=BTCUSDT");
    await expect(page.getByTestId("equity-symbol-error")).toContainText("lane crypto");
    await page.waitForTimeout(300);
    const paths = apiPaths(requests);
    expect(paths.filter((p) => !ALLOWED_SHELL_PATHS.has(p))).toEqual([]);
    expectNoCryptoRequests(requests);

    // Recovery is URL-driven: picking a symbol navigates.
    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
  });

  test("legacy /mbb renders the MBB screen; selecting BID moves to /co-phieu?symbol=BID; nav entry works", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/mbb");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    await expect.poll(() => apiPaths(requests)).toContain("/api/mbb/candles");

    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    await page.waitForURL((url) => url.pathname === "/co-phieu" && url.searchParams.get("symbol") === "BID");
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();

    await openMainTab(page, "MBB");
    await page.waitForURL("**/mbb");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
    await openMainTab(page, "Cổ phiếu");
    await page.waitForURL((url) => url.pathname === "/co-phieu");
    await expect(page.getByRole("heading", { name: "MBB — MB Bank" })).toBeVisible();
  });
});
