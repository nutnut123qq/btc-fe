import { expect, test } from "@playwright/test";
import { LAST_OPEN, DAY_MS, apiPaths, mockBackend, symbolGroup, withAdmin, type Mocks } from "./equityMocks";

// EQX v2 on /co-phieu (mocked backend): shared cash pool + per-symbol buy budget (§A3),
// stale relative-strength benchmarks (§A4), read-only session research notes (§B).

const buyMore = { maxBuyableShares: 400, maxBuyableLots: 4, estimatedCostVnd: 9_600_000 };

test.describe("/co-phieu EQX v2", () => {
  test("shared cash pool: one pool for MBB and BID, PUT /api/equities/cash; position PUT sends buy budget, never cash", async ({ page }) => {
    const requests: string[] = [];
    const mocks: Mocks = { sharedPool: { sharedCashVnd: null, buyBudgetVnd: {} } };
    const errors = await mockBackend(page, requests, mocks);
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");

    const mbbPool = page.getByTestId("mbb-shared-cash");
    await expect(mbbPool).toHaveAttribute("data-cash", "unknown");
    await expect(mbbPool).toContainText("Quỹ tiền mặt chung (MBB + BID)");
    await expect(mbbPool).toContainText("chưa nhập (cash-unknown)");
    await expect(mbbPool).toContainText("chưa khai báo (buy-budget-undeclared)");
    // Legacy per-symbol cash input is gone once the backend reports the shared pool.
    await expect(page.locator("#mbb-cash")).toHaveCount(0);

    await page.locator("#mbb-shared-cash-input").fill("50000000");
    const cashPut = page.waitForRequest((r) => r.method() === "PUT" && new URL(r.url()).pathname === "/api/equities/cash");
    await page.getByRole("button", { name: "Lưu quỹ chung" }).click();
    expect((await cashPut).postDataJSON()).toEqual({ availableCashVnd: 50_000_000 });
    await expect(page.getByText(/Đã lưu quỹ tiền mặt chung \(áp dụng cho cả MBB và BID\)/)).toBeVisible();
    await expect(mbbPool).toHaveAttribute("data-cash", "known");

    // The same pool shows on BID — it is not per-symbol money.
    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    const bidPool = page.getByTestId("bid-shared-cash");
    await expect(bidPool).toHaveAttribute("data-cash", "known");
    await expect(bidPool).toContainText("50.000.000");

    await page.locator("#bid-buy-budget").fill("15000000");
    const positionPut = page.waitForRequest((r) => r.method() === "PUT" && new URL(r.url()).pathname === "/api/equities/BID/position");
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    const body = (await positionPut).postDataJSON() as Record<string, unknown>;
    expect(body.buyBudgetVnd).toBe(15_000_000);
    expect(body).not.toHaveProperty("availableCashVnd");
    await expect(page.getByText(/Đã lưu vị thế/)).toBeVisible();
    await expect(bidPool).toContainText("15.000.000");

    // Clearing the budget means "undeclared" (null), not zero.
    await page.locator("#bid-buy-budget").fill("");
    const clearPut = page.waitForRequest((r) => r.method() === "PUT" && new URL(r.url()).pathname === "/api/equities/BID/position");
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    expect(((await clearPut).postDataJSON() as Record<string, unknown>).buyBudgetVnd).toBeNull();
    expect(apiPaths(requests).filter((p) => p === "/api/equities/MBB/position")).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("buy quantity only with a declared budget; A3 reason codes rendered honestly", async ({ page }) => {
    const mocks: Mocks = {
      sharedPool: { sharedCashVnd: 50_000_000, buyBudgetVnd: { MBB: null } },
      decisionOverride: { MBB: { action: "buy-more", reasons: ["trend-constructive", "buy-budget-undeclared"], buyMore } },
    };
    await mockBackend(page, [], mocks);
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");
    const card = page.getByTestId("mbb-decision");
    await expect(card.getByTestId("mbb-buy-quantity-withheld")).toHaveAttribute("data-reason", "buy-budget-undeclared");
    await expect(card.getByTestId("mbb-buy-quantity")).toHaveCount(0);
    await expect(card.getByText(/tối đa .* lô 100/)).toHaveCount(0);
    await expect(card.getByTestId("mbb-decision-reasons")).toContainText("buy-budget-undeclared — Chưa khai báo ngân sách mua thêm");

    // Declared budget, no blocking reason → the quantity appears, labelled by its budget.
    mocks.sharedPool!.buyBudgetVnd.MBB = 20_000_000;
    mocks.decisionOverride!.MBB = { action: "buy-more", reasons: ["trend-constructive"], buyMore };
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(card.getByTestId("mbb-buy-quantity")).toContainText("trong ngân sách 20.000.000");
    await expect(card.getByTestId("mbb-buy-quantity")).toContainText("tối đa 400 cp (4 lô 100)");

    // Budgets above the shared pool: the reason wins over any capacity the payload carries.
    mocks.decisionOverride!.MBB = { action: "wait", reasons: ["budget-exceeds-cash"], buyMore };
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(card.getByTestId("mbb-buy-quantity-withheld")).toHaveAttribute("data-reason", "budget-exceeds-cash");
    await expect(card.getByTestId("mbb-buy-quantity")).toHaveCount(0);
    await expect(card.getByTestId("mbb-decision-reasons")).toContainText("vượt quỹ tiền mặt chung");

    mocks.decisionOverride!.MBB = { action: "wait", reasons: ["cash-unknown"], buyMore: null };
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await expect(card.getByTestId("mbb-buy-quantity-withheld")).toHaveAttribute("data-reason", "cash-unknown");
  });

  test("older backend (no shared pool): legacy cash input, quantity withheld; unconverted corporate action withholds PnL/proceeds", async ({ page }) => {
    await mockBackend(page, [], {
      decisionOverride: {
        MBB: { action: "buy-more", reasons: ["trend-constructive"], buyMore },
        BID: {
          reasons: ["corporate-action-unconverted:rights-issue"],
          position: {
            totalShares: 100, settledShares: 100, pendingShares: 0, sellableSharesNow: 100, avgCostPerShareVnd: 41_700,
            lastPriceVnd: 41_200, unrealizedPnlVnd: null, unrealizedPnlPct: null, netProceedsIfSellableNowVnd: null,
          },
        },
      },
    });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");
    await expect(page.getByTestId("mbb-shared-cash-unsupported")).toBeVisible();
    await expect(page.locator("#mbb-cash")).toHaveValue("5000000");
    await expect(page.getByTestId("mbb-decision").getByTestId("mbb-buy-quantity-withheld"))
      .toHaveAttribute("data-reason", "budget-not-supported-by-backend");
    await expect(page.getByTestId("mbb-decision").getByTestId("mbb-buy-quantity")).toHaveCount(0);

    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    const bid = page.getByTestId("bid-decision");
    await expect(bid.getByTestId("bid-pnl-unconverted")).toHaveText("không tính — corporate-action-unconverted:rights-issue");
    await expect(bid.getByText(/Tiền về nếu bán hết phần bán được/)).toBeVisible();
    await expect(bid.getByTestId("bid-decision-reasons")).toContainText('sự kiện quyền "rights-issue" chưa quy đổi được');
  });

  test("relative strength: a stale benchmark renders stale with its reason, never returns", async ({ page }) => {
    await mockBackend(page, [], { staleBenchmark: true });
    await page.goto("/co-phieu?symbol=BID");
    const row = page.getByTestId("bid-context-rs-VNINDEX");
    await expect(row).toHaveAttribute("data-status", "stale");
    await expect(row).toContainText("benchmark cũ (stale)");
    await expect(row).toContainText("(benchmark-stale)");
    await expect(row.getByText(/%/)).toHaveCount(0);
    await expect(page.getByTestId("bid-context-rs-CTG")).toHaveAttribute("data-status", "unavailable");
  });

  test("research notes: locked without a key (no request); admin list shows mode/as-of/horizon/views, probability only with a method", async ({ page }) => {
    const requests: string[] = [];
    const note = (over: Record<string, unknown>) => ({
      noteId: `session/BID/${LAST_OPEN}/n1`, symbol: "BID", mode: "forward", requestedAsOfUtc: "2026-10-16T09:00:00Z",
      signalBarOpenTimeMs: LAST_OPEN, signalBarCloseTimeMs: LAST_OPEN + DAY_MS - 1, horizonSessions: 20,
      snapshotId: `snap/BID/${LAST_OPEN}/0123456789ab`, snapshotSha256: "a".repeat(64), snapshotVerified: true,
      skillVersion: "investment-research-v1", methodVersion: "equity-research-snapshot-method-v1",
      direction: "sideways", actionView: "wait", actionBasis: "market-only",
      body: { schemaVersion: "equity-research-note-v1", thesis: "BID đi ngang chờ KQKD Q3" },
      availableTimeMs: LAST_OPEN + DAY_MS, createdAtUtc: "2026-10-16T10:00:00Z", forecastIds: [], ...over,
    });
    const mocks: Mocks = {
      researchNotes: {
        BID: [
          note({ body: { thesis: "Có xác suất", probability: { configId: "tb-p5-s4-h20", probTargetFirst: 0.4, probStopFirst: 0.35, method: "beta-binomial", methodRef: "scripts/rate.py" } } }),
          note({ noteId: "session/BID/1/n2", mode: "retrospective", direction: "up", actionView: "hold", actionBasis: "position-aware",
            body: { thesis: "Không khai báo phương pháp", probability: { probTargetFirst: 0.9 } } }),
        ],
      },
    };
    await mockBackend(page, requests, mocks);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-research-notes-locked")).toBeVisible();
    await page.waitForTimeout(300);
    expect(apiPaths(requests)).not.toContain("/api/equities/BID/research-notes");

    await page.locator("#admin-session-key").fill("e2e-admin");
    await page.getByRole("button", { name: "Mở khóa" }).click();
    const panel = page.getByTestId("bid-research-notes");
    const rows = panel.getByTestId("research-note");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toHaveAttribute("data-mode", "forward");
    await expect(rows.nth(0)).toContainText("20 phiên");
    await expect(rows.nth(0)).toContainText("Hướng giá: đi ngang");
    await expect(rows.nth(0)).toContainText("chờ (chỉ theo thị trường)");
    await expect(rows.nth(0)).toContainText("investment-research-v1 · equity-research-snapshot-method-v1");
    await expect(rows.nth(0)).toContainText(`snap/BID/${LAST_OPEN}/0123456789ab`);
    await expect(rows.nth(0).getByTestId("research-note-probability")).toContainText("phương pháp beta-binomial (scripts/rate.py)");
    await expect(rows.nth(1)).toContainText("retrospective · không chấm như dự báo");
    await expect(rows.nth(1).getByTestId("research-note-probability")).toHaveCount(0);
    await expect(rows.nth(1).getByTestId("research-note-no-probability")).toBeVisible();
    await expect(panel.getByText("chưa kiểm định", { exact: true })).toHaveCount(2);
  });

  test("issuer source documents: provenance + extracted/missing metrics", async ({ page }) => {
    await mockBackend(page, []);
    await page.goto("/co-phieu?symbol=BID");
    const panel = page.getByTestId("bid-source-documents");
    const doc = panel.getByTestId("source-document");
    await expect(doc).toHaveCount(1);
    await expect(doc).toContainText("2026Q2");
    await expect(doc).toContainText("hợp nhất");
    await expect(doc).toContainText("kiểm toán: không nêu");
    await expect(doc).toContainText("issuer:BIDV · sha256 dddddddddddd");
    await expect(doc).toContainText("37 trang, 0 có lớp chữ");
    await expect(doc).toContainText("Trích được: không có");
    await expect(doc).toContainText("thiếu: TOTAL_ASSETS, NET_PROFIT");
    await expect(doc.getByRole("link")).toHaveAttribute("href", "https://bidv.com.vn/wps/wcm/connect/q2.pdf");

  });

  test("issuer source documents: older backend 404 renders unavailable", async ({ page }) => {
    await mockBackend(page, [], { newSurfaces404: { MBB: true } });
    await page.goto("/co-phieu?symbol=MBB");
    await expect(page.getByTestId("mbb-source-documents-unavailable")).toBeVisible();
  });

  test("research notes: older backend 404 renders unavailable", async ({ page }) => {
    await mockBackend(page, [], { newSurfaces404: { BID: true } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-research-notes-unavailable")).toBeVisible();
    await symbolGroup(page).getByRole("button", { name: "MBB" }).click();
    await expect(page.getByTestId("mbb-research-notes-empty")).toBeVisible();
  });
});
