import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page, type Response } from "@playwright/test";

// EQX v2 live-stack checks on /co-phieu (env-skipped: PLAYWRIGHT_BASE_URL + EQX_ADMIN_KEY).
// Issuer source documents, issuer-report fundamentals provenance, shared cash pool + buy budget
// (set, then restored to the value read before the test), research notes, retired LLM layer.
// Every assertion branches on the response the UI itself fired. The admin key is read from env
// only — never logged or written.

const productionUrl = process.env.PLAYWRIGHT_BASE_URL;
const adminKey = process.env.EQX_ADMIN_KEY ?? "";
const EVIDENCE = "../evidence/equity-expansion";

/** One page load fires ≤ 1 "expensive" call (conditions); keep well under 10/min. */
const PACE_MS = 8_000;
let lastLoad = 0;
async function paced(page: Page): Promise<void> {
  const wait = lastLoad + PACE_MS - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  lastLoad = Date.now();
}

function uiResponse(page: Page, method: string, path: RegExp, timeout = 120_000): Promise<Response> {
  return page.waitForResponse((r) => r.request().method() === method && path.test(new URL(r.url()).pathname), { timeout });
}

async function capture(name: string, response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* keep text */ }
  mkdirSync(`${EVIDENCE}/live-responses`, { recursive: true });
  writeFileSync(`${EVIDENCE}/live-responses/${name}.json`,
    `${JSON.stringify({ url: new URL(response.url()).pathname, status: response.status(), body }, null, 2)}\n`, "utf8");
  return body;
}

type Position = { buyBudgetVnd?: number | null; sharedCashVnd?: number | null; availableCashVnd: number; lots: Array<{ quantity: number; costPerShareVnd: number; acquireDate: string }> };

test.describe("/co-phieu EQX v2 live", () => {
  test.skip(!productionUrl || !adminKey, "Set PLAYWRIGHT_BASE_URL and EQX_ADMIN_KEY to run the EQX v2 live checks.");
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => window.sessionStorage.setItem("btc.adminKey", key), adminKey);
  });

  test("BID: issuer documents, research notes, retired LLM note, shared cash + budget (set and restored)", async ({ page }) => {
    test.setTimeout(300_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await paced(page);
    const docs = uiResponse(page, "GET", /\/api\/equities\/BID\/source-documents$/);
    const notes = uiResponse(page, "GET", /\/api\/equities\/BID\/research-notes$/);
    const position = uiResponse(page, "GET", /\/api\/equities\/BID\/position$/);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();

    // Issuer source documents (public metadata).
    const docsRes = await docs;
    expect(docsRes.status()).toBe(200);
    const docsBody = await capture("v2-bid-source-documents", docsRes) as { contractVersion: string; items: Array<{ reportingPeriod: string | null }> };
    expect(docsBody.contractVersion).toBe("equity-source-documents-v1");
    const docPanel = page.getByTestId("bid-source-documents");
    await expect(docPanel.getByTestId("source-document")).toHaveCount(docsBody.items.length);
    if (docsBody.items.length > 0) await expect(docPanel.getByTestId("source-document").first()).toContainText("sha256");
    await docPanel.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${EVIDENCE}/v2-live-bid-documents.png`, fullPage: true });

    // Research notes (admin, read-only).
    const notesRes = await notes;
    expect(notesRes.status()).toBe(200);
    const notesBody = await capture("v2-bid-research-notes", notesRes) as { contractVersion: string; items: Array<{ body?: { probability?: { method?: string; methodRef?: string } | null } | null }> };
    expect(notesBody.contractVersion).toBe("equity-research-notes-v1");
    const notesPanel = page.getByTestId("bid-research-notes");
    if (notesBody.items.length === 0) await expect(notesPanel.getByTestId("bid-research-notes-empty")).toBeVisible();
    else {
      await expect(notesPanel.getByTestId("research-note")).toHaveCount(notesBody.items.length);
      const withMethod = notesBody.items.filter((n) => n.body?.probability?.method && n.body?.probability?.methodRef).length;
      await expect(notesPanel.getByTestId("research-note-probability")).toHaveCount(withMethod);
    }
    await notesPanel.screenshot({ path: `${EVIDENCE}/v2-live-research-notes.png` });

    // In-app LLM retired: note shown, no create control.
    const llm = page.getByTestId("bid-llm");
    await expect(llm.getByTestId("bid-llm-disabled-note")).toContainText("Lớp LLM trong app đã ngừng");
    await expect(page.getByRole("button", { name: /Tạo phân tích LLM/ })).toHaveCount(0);
    await llm.screenshot({ path: `${EVIDENCE}/v2-live-llm-retired.png` });

    // Shared cash pool + per-symbol budget.
    const posRes = await position;
    expect(posRes.status()).toBe(200);
    const before = await capture("v2-bid-position-before", posRes) as Position;
    expect(before).toHaveProperty("sharedCashVnd");
    const pool = page.getByTestId("bid-shared-cash");
    await expect(pool).toHaveAttribute("data-cash", before.sharedCashVnd == null ? "unknown" : "known");
    await expect(pool).toContainText("Quỹ tiền mặt chung (MBB + BID)");
    const budgetInput = page.locator("#bid-buy-budget");
    await expect(budgetInput).toHaveValue(before.buyBudgetVnd == null ? "" : String(before.buyBudgetVnd));

    const trial = (before.buyBudgetVnd ?? 0) + 1_000_000;
    await budgetInput.fill(String(trial));
    const put = uiResponse(page, "PUT", /\/api\/equities\/BID\/position$/);
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    const putRes = await put;
    const putBody = await capture("v2-bid-position-budget-put", putRes) as Position & { message?: string };
    const accepted = putRes.status() === 200;
    if (accepted) {
      expect(putBody.buyBudgetVnd).toBe(trial);
      await expect(page.getByText(/Đã lưu vị thế/)).toBeVisible();
      await expect(pool).toContainText(new Intl.NumberFormat("vi-VN").format(trial));
    } else {
      // A refusal (e.g. budgets exceeding an unknown/insufficient shared pool) must surface, not vanish.
      expect(putRes.status()).toBeGreaterThanOrEqual(400);
      const refusal = page.getByTestId("bid-position-form").locator("p.text-rose-300");
      await expect(refusal).toBeVisible();
      const code = (putBody as { code?: string }).code;
      if (code === "CASH_UNKNOWN" || code === "BUDGET_EXCEEDS_CASH") await expect(refusal).toContainText("quỹ tiền mặt chung");
    }
    await page.getByTestId("bid-position-form").screenshot({ path: `${EVIDENCE}/v2-live-position-shared-cash.png` });

    // Restore the budget read before the test (null → empty input → undeclared).
    if (accepted) {
      await budgetInput.fill(before.buyBudgetVnd == null ? "" : String(before.buyBudgetVnd));
      const restorePut = uiResponse(page, "PUT", /\/api\/equities\/BID\/position$/);
      await page.getByRole("button", { name: "Lưu vị thế" }).click();
      const restoreRes = await restorePut;
      expect(restoreRes.status()).toBe(200);
      const restored = await capture("v2-bid-position-restored", restoreRes) as Position;
      expect(restored.buyBudgetVnd ?? null).toBe(before.buyBudgetVnd ?? null);
      expect(restored.sharedCashVnd ?? null).toBe(before.sharedCashVnd ?? null);
      expect(restored.lots.map((l) => [l.quantity, l.costPerShareVnd, l.acquireDate]))
        .toEqual(before.lots.map((l) => [l.quantity, l.costPerShareVnd, l.acquireDate]));
    }
    expect(errors).toEqual([]);
  });

  test("MBB: issuer-report fundamentals render with document provenance", async ({ page }) => {
    test.setTimeout(180_000);
    await paced(page);
    const context = uiResponse(page, "GET", /\/api\/equities\/MBB\/context$/);
    await page.goto("/co-phieu?symbol=MBB");
    const ctxRes = await context;
    expect(ctxRes.status()).toBe(200);
    const ctx = await capture("v2-mbb-context", ctxRes) as { fundamentals: { items: Array<{ source: string | null; sourceLocation?: string | null }> } };
    const issuerRows = ctx.fundamentals.items.filter((i) => i.source === "issuer-report" && i.sourceLocation);
    const panel = page.getByTestId("mbb-context");
    await expect(panel.getByTestId("fundamental-source-location")).toHaveCount(issuerRows.length);
    if (issuerRows.length > 0) await expect(panel.getByTestId("fundamental-source-location").first()).toContainText("page 6");
    await panel.screenshot({ path: `${EVIDENCE}/v2-live-mbb-issuer-fundamentals.png` });
  });
});
