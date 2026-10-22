import { expect, test, type Page } from "@playwright/test";
import { apiPaths, mockBackend, screenshot, symbolGroup, withAdmin } from "./equityMocks";

// EQX-C2 — forecast journal/scoring and the (now read-only) LLM run history on
// /co-phieu against the shared mocked backend. EQX v2 §B: the in-app LLM layer is
// disabled — no control may create a run.

const llmPanel = (page: Page, symbol: "mbb" | "bid") => page.getByTestId(`${symbol}-llm`);
const createButton = (page: Page) => page.getByRole("button", { name: /Tạo phân tích LLM|Đang chạy…/ });
const posts = (requests: string[]) => requests.filter((r) => r.startsWith("POST ") && r.includes("/llm-runs"));

test.describe("/co-phieu journal + LLM", () => {
  test("BID journal: pending/resolved/LLM rows, insufficient sample shows no conclusion; LLM runs render honestly", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");

    const journal = page.getByTestId("bid-journal");
    await expect(journal.getByTestId("journal-row")).toHaveCount(3);
    await expect(journal.getByText("chưa đáo hạn", { exact: true })).toHaveCount(2);
    await expect(journal.getByText(/chạm mục tiêu trước · \+4,72% ròng/)).toBeVisible();
    await expect(journal.getByText("LLM · chưa kiểm định")).toBeVisible();
    await expect(journal.getByText(/\+5%\/−4% · 20p/).first()).toBeVisible();
    const insufficient = journal.getByTestId("journal-scoring-tb-p5-s4-h20");
    await expect(insufficient).toHaveAttribute("data-status", "insufficient-sample");
    await expect(insufficient.getByText(/Chưa đủ mẫu .* chưa kết luận/)).toBeVisible();
    await expect(insufficient.getByText("Brier quant")).toHaveCount(0);
    await expect(journal.getByTestId("journal-scoring-tb-p10-s6-h60").getByText(/Chưa có cặp dự báo/)).toBeVisible();

    const llm = llmPanel(page, "bid");
    await expect(llm.locator('[data-testid="llm-run"][data-status="succeeded"]')).toHaveCount(2);
    await expect(llm.getByTestId("llm-veto").first()).toContainText("chỉ là cảnh báo — không đổi quyết định đề xuất");
    // The veto is advisory only — the decision card keeps its own action and never shows it.
    await expect(page.getByTestId("bid-decision").getByText("Chờ", { exact: true })).toBeVisible();
    await expect(page.getByTestId("bid-decision").getByText(/Veto/)).toHaveCount(0);
    // Same-bar pairing: today's run ↔ current base-rates; the older run ↔ the journal's quant record for its bar.
    const runs = llm.locator('[data-testid="llm-run"][data-status="succeeded"]');
    const adjusted = runs.nth(0).getByTestId("llm-adjusted-forecasts");
    await expect(adjusted.getByText("35,0% / 45,0%")).toBeVisible();
    await expect(adjusted.getByText("41,0% (chưa kiểm định)")).toBeVisible();
    const olderAdjusted = runs.nth(1).getByTestId("llm-adjusted-forecasts");
    await expect(olderAdjusted.getByText("44,0% (chưa kiểm định · nhật ký)")).toBeVisible();
    await expect(olderAdjusted.getByText("41,0% (chưa kiểm định)")).toHaveCount(0);
    const link = llm.getByRole("link", { name: /Nguồn tin BID/ }).first();
    await expect(link).toHaveAttribute("href", "https://example.com/news-1");
    await expect(link).toHaveAttribute("rel", /noopener/);
    await expect(llm.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(llm.getByText(/Run thất bại: judge output failed schema validation/)).toBeVisible();

    // Load/refresh never creates an (expensive) run.
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.waitForTimeout(500);
    expect(posts(requests)).toEqual([]);
    await screenshot(page, "c2-bid-journal-llm.png");
    expect(errors).toEqual([]);
  });

  test("LLM create flow is gone: no button for admin or locked sessions, disabled note shown, nothing ever POSTed", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests);
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=MBB");
    const mbb = llmPanel(page, "mbb");
    await expect(mbb.getByTestId("mbb-llm-empty")).toBeVisible();
    await expect(mbb.getByTestId("mbb-llm-disabled-note"))
      .toHaveText("Lớp LLM trong app đã ngừng — nghiên cứu được thực hiện qua session (skill investment-research).");
    await expect(createButton(page)).toHaveCount(0);

    // Switch symbol and lock: still no way to create a run anywhere on the page.
    await symbolGroup(page).getByRole("button", { name: "BID" }).click();
    await expect(llmPanel(page, "bid").locator('[data-testid="llm-run"]')).toHaveCount(3);
    await expect(llmPanel(page, "bid").getByTestId("bid-llm-disabled-note")).toBeVisible();
    await expect(createButton(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Khóa lại" }).click();
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    await expect(createButton(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    await page.waitForTimeout(500);
    expect(posts(requests)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("older backend: journal/LLM 404 render unavailable; dossier never fetched", async ({ page }) => {
    const requests: string[] = [];
    const errors = await mockBackend(page, requests, { newSurfaces404: { BID: true } });
    await withAdmin(page);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByTestId("bid-journal-unavailable")).toBeVisible();
    await expect(page.getByTestId("bid-llm-unavailable")).toBeVisible();
    await expect(page.getByTestId("bid-decision").getByText("Chờ", { exact: true })).toBeVisible();
    // The page never fetches the dossier (it burns "expensive" quota).
    expect(apiPaths(requests)).not.toContain("/api/equities/BID/dossier");
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });
});
