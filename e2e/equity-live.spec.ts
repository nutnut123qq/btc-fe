import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page, type Response } from "@playwright/test";
import { openMainTab } from "./nav";

// EQX-C3 — live-stack E2E for /co-phieu (BID/MBB) against a real backend + AI.
// Env-skipped: runs only with PLAYWRIGHT_BASE_URL (pitfall #35 — markers pinned in
// tests/productionSpecSync.test.mts). Pitfall #18: every data assertion branches
// on the response the UI itself fired (captured with page.waitForResponse);
// contract shape is asserted in every state. The admin key is a local test value
// read from EQX_ADMIN_KEY at runtime — never hard-coded, logged or written.

const productionUrl = process.env.PLAYWRIGHT_BASE_URL;
const adminKey = process.env.EQX_ADMIN_KEY ?? "";
const EVIDENCE = "../evidence/equity-expansion";
const SHELL_PATHS = new Set(["/api/meta", "/api/ai-chat/capabilities", "/api/alerts/unread-count", "/api/instruments"]);

// Backend "expensive" policy: 10 requests / fixed 1-minute window / client IP,
// shared by conditions, smart-money replay, current-conditions, dossier, LLM POST…
// Keeping ≤ EXPENSIVE_BUDGET calls in ANY rolling 60s span guarantees every fixed
// window stays under the limit (margin left for other local traffic).
const EXPENSIVE_BUDGET = 8;
const EXPENSIVE_WINDOW_MS = 62_000;
const expensiveLog: number[] = [];

function isExpensive(method: string, pathname: string): boolean {
  if (method === "POST") return /\/llm-runs$|\/api\/ai-chat\/(query|stream)$/.test(pathname);
  return /\/api\/(equities\/[A-Z]+|mbb)\/conditions$|\/api\/equities\/[A-Z]+\/dossier$|\/api\/smart-money\/replay$|\/api\/research\/current-conditions$|\/api\/historical-analogs$|\/api\/prediction\/latest$|\/api\/analysis/.test(pathname);
}

/** Wait until `needed` more expensive calls fit in the rolling budget. */
async function budget(page: Page, needed: number): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (expensiveLog.length > 0 && now - expensiveLog[0] > EXPENSIVE_WINDOW_MS) expensiveLog.shift();
    if (expensiveLog.length + needed <= EXPENSIVE_BUDGET) return;
    await page.waitForTimeout(EXPENSIVE_WINDOW_MS - (now - expensiveLog[0]) + 250);
  }
}

type Phase = "equity" | "btc";
type Tracker = { phase: Phase; equityRequests: string[]; equitySockets: string[]; errors: string[] };

function track(page: Page): Tracker {
  const tracker: Tracker = { phase: "equity", equityRequests: [], equitySockets: [], errors: [] };
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (isExpensive(request.method(), url.pathname)) expensiveLog.push(Date.now());
    if (tracker.phase === "equity") tracker.equityRequests.push(`${request.method()} ${url.pathname}${url.search}`);
  });
  page.on("websocket", (ws) => {
    if (tracker.phase === "equity") tracker.equitySockets.push(ws.url());
  });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) tracker.errors.push(message.text());
  });
  page.on("pageerror", (error) => tracker.errors.push(error.message));
  return tracker;
}

const apiPaths = (tracker: Tracker) =>
  tracker.equityRequests.map((r) => r.split(" ")[1]).filter((p) => p.startsWith("/api/")).map((p) => p.split("?")[0]);

function expectNoCryptoOnEquity(tracker: Tracker) {
  expect(tracker.equitySockets, "no websocket (Binance) while on equity pages").toEqual([]);
  for (const path of apiPaths(tracker)) {
    const ok = SHELL_PATHS.has(path) || path.startsWith("/api/mbb/") || path.startsWith("/api/equities/");
    expect(ok, `crypto/unexpected endpoint on an equity page: ${path}`).toBe(true);
  }
  expect(tracker.equityRequests.some((r) => /binance/i.test(r))).toBe(false);
}

/** Wait for the response the UI itself fires (any status — callers branch on it). */
function uiResponse(page: Page, method: string, path: RegExp, timeout = 120_000): Promise<Response> {
  return page.waitForResponse((r) => r.request().method() === method && path.test(new URL(r.url()).pathname + new URL(r.url()).search), { timeout });
}

function trim(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) {
    const head = value.slice(0, 5).map((v) => trim(v, depth + 1));
    return value.length > 5 ? [...head, `… ${value.length - 5} more item(s) trimmed`] : head;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, trim(v, depth + 1)]));
  }
  return value;
}

async function capture(name: string, response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* non-JSON body kept as text */ }
  mkdirSync(`${EVIDENCE}/live-responses`, { recursive: true });
  writeFileSync(
    `${EVIDENCE}/live-responses/${name}.json`,
    `${JSON.stringify({ url: new URL(response.url()).pathname + new URL(response.url()).search, status: response.status(), body: trim(body) }, null, 2)}\n`,
    "utf8",
  );
  return body;
}

const shot = (page: Page, name: string) => page.screenshot({ path: `${EVIDENCE}/${name}`, fullPage: true });

type BaseRates = { contractVersion: string; symbol: string; status: string; reasons: string[]; configs: Array<{ configId: string; abstained: boolean; decisionUse: unknown; research: { label: string } | null; validation: { gatePassed: boolean; gateReasons: string[] } | null }> };
type Section = { status: string; items?: unknown[]; benchmarks?: unknown[] };
type Context = { contractVersion: string; symbol: string; relativeStrength: Section; corporateActions: Section; events: Section; fundamentals: Section };
// buyBudgetVnd/sharedCashVnd: EQX v2 A3 shared cash pool (absent on an older backend).
type Position = { symbol: string; availableCashVnd: number; buyBudgetVnd?: number | null; sharedCashVnd?: number | null; lots: Array<{ quantity: number; costPerShareVnd: number; acquireDate: string }> };
type Candle = { openTimeMs: number; close: number };

async function assertBaseRates(page: Page, symbol: "BID" | "MBB", body: BaseRates) {
  expect(body.contractVersion).toBe("equity-base-rates-v1");
  expect(body.symbol).toBe(symbol);
  expect(["ok", "abstained", "unavailable"]).toContain(body.status);
  const panel = page.getByTestId(`${symbol.toLowerCase()}-base-rates`);
  if (body.status === "unavailable") {
    await expect(panel.getByText(/Không có artifact base-rates hợp lệ|chưa khả dụng/).first()).toBeVisible();
    return;
  }
  await expect(panel.getByText(body.status, { exact: true }).first()).toBeVisible();
  for (const config of body.configs) {
    const card = panel.getByTestId(`base-rates-config-${config.configId}`);
    await expect(card).toBeVisible();
    if (config.research?.label === "unvalidated") await expect(card.getByText(/chưa kiểm định \/ unvalidated/)).toBeVisible();
    if (config.decisionUse == null) await expect(card.getByTestId("base-rates-decision-use")).toHaveCount(0);
    if (config.validation && !config.validation.gatePassed) await expect(card.getByText("chưa qua gate")).toBeVisible();
  }
}

async function assertContext(page: Page, symbol: "BID" | "MBB", body: Context) {
  expect(body.contractVersion).toBe("equity-context-v1");
  expect(body.symbol).toBe(symbol);
  const panel = page.getByTestId(`${symbol.toLowerCase()}-context`);
  const sections: Array<[keyof Context, string, string]> = [
    ["relativeStrength", "rs", "benchmarks"],
    ["corporateActions", "corporate-actions", "items"],
    ["events", "events", "items"],
    ["fundamentals", "fundamentals", "items"],
  ];
  for (const [key, testId, listKey] of sections) {
    const section = body[key] as Section;
    expect(["ok", "empty", "unavailable"]).toContain(section.status);
    const rows = (section as Record<string, unknown>)[listKey] as unknown[] | undefined;
    // UI renders ok-with-0-rows as empty (spec §11); RS keeps "ok" with no benchmarks only if BE sends rows.
    const expected = section.status === "ok" && (!rows || rows.length === 0) ? "empty" : section.status;
    await expect(panel.getByTestId(`${symbol.toLowerCase()}-context-${testId}`)).toHaveAttribute("data-status", expected);
  }
}

test.describe("equity live stack", () => {
  test.skip(!productionUrl, "Set PLAYWRIGHT_BASE_URL to run live-stack checks.");
  test.describe.configure({ mode: "serial" });

  test("without a key: BID 1d-only, honest base-rates/context/journal/LLM, MBB switch, BTC page, no personal reads", async ({ page }) => {
    test.slow();
    test.setTimeout(600_000);
    const tracker = track(page);
    await budget(page, 1);

    const candles = uiResponse(page, "GET", /\/api\/equities\/BID\/candles\?.*timeframe=1d/);
    const baseRates = uiResponse(page, "GET", /\/api\/equities\/BID\/base-rates$/);
    const context = uiResponse(page, "GET", /\/api\/equities\/BID\/context$/);
    const journal = uiResponse(page, "GET", /\/api\/equities\/BID\/forecast-journal/);
    const llmRuns = uiResponse(page, "GET", /\/api\/equities\/BID\/llm-runs/);
    const quality = uiResponse(page, "GET", /\/api\/equities\/BID\/data-quality$/);
    const conditions = uiResponse(page, "GET", /\/api\/equities\/BID\/conditions\?.*timeframe=1d/);
    const catalog = uiResponse(page, "GET", /\/api\/instruments$/);
    await page.goto("/co-phieu?symbol=BID");

    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    const tfGroup = page.getByRole("group", { name: "Khung thời gian BID" });
    await expect(tfGroup.getByRole("button")).toHaveCount(1);
    await expect(tfGroup.getByRole("button", { name: "1d" })).toBeVisible();
    await expect(symbolGroupOf(page).getByRole("button", { name: "BID" })).toHaveAttribute("aria-pressed", "true");

    const catalogBody = await capture("instruments", await catalog) as { contractVersion: string; items: Array<{ symbol: string; activeTimeframes: string[]; capabilities: { decision?: boolean } }> };
    expect(catalogBody.contractVersion).toMatch(/^instrument-catalog-v/);
    // The live stack is the EQX backend: BID must be in the v2 catalog as a decision lane.
    expect(catalogBody.contractVersion).toBe("instrument-catalog-v2");
    const bidItem = catalogBody.items.find((i) => i.symbol === "BID");
    expect(bidItem, "BID missing from /api/instruments").toBeDefined();
    expect(bidItem!.activeTimeframes).toEqual(["1d"]);
    expect(bidItem!.capabilities.decision).toBe(true);

    const candleRes = await candles;
    expect(candleRes.status()).toBe(200);
    const candleBody = await capture("bid-candles-1d", candleRes) as Candle[];
    expect(Array.isArray(candleBody)).toBe(true);
    if (candleBody.length > 0) {
      await expect(page.locator('section[aria-labelledby="bid-chart-title"] canvas').first()).toBeAttached({ timeout: 30_000 });
    } else {
      await expect(page.getByText(/Chưa có nến 1d cho BID/)).toBeVisible();
    }

    const brRes = await baseRates;
    if (brRes.status() === 200) await assertBaseRates(page, "BID", await capture("bid-base-rates", brRes) as BaseRates);
    else await expect(page.getByTestId("bid-base-rates-unavailable")).toBeVisible();

    const ctxRes = await context;
    if (ctxRes.status() === 200) await assertContext(page, "BID", await capture("bid-context", ctxRes) as Context);
    else await expect(page.getByTestId("bid-context-unavailable")).toBeVisible();

    const jRes = await journal;
    const jBody = await capture("bid-forecast-journal", jRes) as { contractVersion: string; items: Array<{ outcome: unknown }>; scoring: Array<{ configId: string; status: string }> };
    if (jRes.status() === 200) {
      expect(jBody.contractVersion).toBe("equity-forecast-journal-v1");
      const panel = page.getByTestId("bid-journal");
      if (jBody.items.length === 0) await expect(panel.getByTestId("bid-journal-empty")).toBeVisible();
      else await expect(panel.getByTestId("journal-row")).toHaveCount(jBody.items.length);
      const pending = jBody.items.filter((i) => i.outcome == null).length;
      await expect(panel.getByText("chưa đáo hạn", { exact: true })).toHaveCount(pending);
      for (const s of jBody.scoring) await expect(panel.getByTestId(`journal-scoring-${s.configId}`)).toHaveAttribute("data-status", s.status);
    } else {
      await expect(page.getByTestId("bid-journal-unavailable")).toBeVisible();
    }

    const runsRes = await llmRuns;
    const runsBody = await capture("bid-llm-runs", runsRes) as { items: Array<{ status: string }> };
    if (runsRes.status() === 200) {
      const panel = page.getByTestId("bid-llm");
      if (runsBody.items.length === 0) await expect(panel.getByTestId("bid-llm-empty")).toBeVisible();
      else await expect(panel.getByTestId("llm-run")).toHaveCount(runsBody.items.length);
      // EQX v2 §B: the in-app LLM layer is disabled — read-only history, no create control.
      await expect(panel.getByTestId("bid-llm-disabled-note")).toContainText("Lớp LLM trong app đã ngừng");
      await expect(panel.getByRole("button", { name: /Tạo phân tích LLM/ })).toHaveCount(0);
    } else if (runsRes.status() === 404 || runsRes.status() === 400) {
      await expect(page.getByTestId("bid-llm-unavailable")).toBeVisible();
    } else {
      // A 5xx must surface as an honest error in the panel — and fails this live check.
      await expect(page.getByTestId("bid-llm").getByText(/Không tải được các run LLM/)).toBeVisible();
      throw new Error(`GET /api/equities/BID/llm-runs returned ${runsRes.status()}`);
    }

    await capture("bid-data-quality", await quality);
    const condRes = await conditions;
    await capture("bid-conditions-1d", condRes);
    if (condRes.status() === 429) await expect(page.getByTestId("bid-conditions").getByText(/giới hạn tần suất/)).toBeVisible();
    else if (condRes.status() !== 200) await expect(page.getByText(/Điều kiện hiện tại chưa khả dụng/)).toBeVisible();
    // Observations reveal holdings-driven decisions — locked without a key, no request.
    await expect(page.getByTestId("bid-observations-locked")).toBeVisible();

    await expect(page.getByTestId("bid-decision-locked")).toBeVisible();
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    await shot(page, "live-bid-overview.png");
    await page.getByTestId("bid-base-rates").locator("..").screenshot({ path: `${EVIDENCE}/live-bid-base-rates-context.png` });

    // --- switch to MBB: 1h + 1d, nothing from BID survives -------------------------
    await budget(page, 1);
    const mbb1d = uiResponse(page, "GET", /\/api\/mbb\/candles\?.*timeframe=1d/);
    const mbbBr = uiResponse(page, "GET", /\/api\/equities\/MBB\/base-rates$/);
    const mbbCtx = uiResponse(page, "GET", /\/api\/equities\/MBB\/context$/);
    await symbolGroupOf(page).getByRole("button", { name: "MBB" }).click();
    await page.waitForURL((url) => url.searchParams.get("symbol") === "MBB");
    expect((await mbb1d).status()).toBe(200);
    const mbbTf = page.getByRole("group", { name: "Khung thời gian MBB" });
    await expect(mbbTf.getByRole("button")).toHaveCount(2);
    const mbbBrRes = await mbbBr;
    if (mbbBrRes.status() === 200) await assertBaseRates(page, "MBB", await capture("mbb-base-rates", mbbBrRes) as BaseRates);
    const mbbCtxRes = await mbbCtx;
    if (mbbCtxRes.status() === 200) await assertContext(page, "MBB", await capture("mbb-context", mbbCtxRes) as Context);

    await budget(page, 1);
    const mbb1h = uiResponse(page, "GET", /\/api\/mbb\/candles\?.*timeframe=1h/);
    const mbbCond1h = uiResponse(page, "GET", /\/api\/mbb\/conditions\?.*timeframe=1h/);
    await mbbTf.getByRole("button", { name: "1h" }).click();
    const mbb1hRes = await mbb1h;
    expect(mbb1hRes.status()).toBe(200);
    await capture("mbb-candles-1h", mbb1hRes);
    await capture("mbb-conditions-1h", await mbbCond1h);
    await expect(page.getByTestId("mbb-observations-locked")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nhật ký quan sát MBB (1h)" })).toBeVisible();
    await expect(page.getByTestId("equity-screen")).toHaveAttribute("data-symbol", "MBB");
    await expect(page.locator('[data-testid^="bid-"]')).toHaveCount(0);
    await page.waitForTimeout(1_000);
    await shot(page, "live-mbb-1h.png");

    // BID never asked for 1h; no personal reads without a key; no crypto on equity pages.
    expect(tracker.equityRequests.some((r) => r.includes("/api/equities/BID/") && r.includes("timeframe=1h"))).toBe(false);
    expect(apiPaths(tracker).filter((p) => /\/(decision|position|observations)$/.test(p))).toEqual([]);
    expectNoCryptoOnEquity(tracker);

    // --- BTC main page (crypto lane, test DB klines slice) ------------------------
    await budget(page, 3);
    tracker.phase = "btc";
    // The BTC screen reads stored klines through the technical replay endpoint.
    const btcReplay = uiResponse(page, "GET", /\/api\/smart-money\/replay\?/, 180_000);
    await page.getByRole("link", { name: "BTC/USDT" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.getByRole("complementary", { name: /Dữ liệu thị trường realtime/ })).toBeVisible({ timeout: 60_000 });
    const btcRes = await btcReplay;
    const btcBody = await capture("btc-smart-money-replay", btcRes) as { candles?: unknown[] };
    if (btcRes.status() === 200 && Array.isArray(btcBody.candles) && btcBody.candles.length > 0) {
      await expect(page.getByText(/Stored finalized Binance Spot klines/)).toBeVisible({ timeout: 30_000 });
    } else {
      test.info().annotations.push({ type: "btc-replay", description: `status ${btcRes.status()} without candles` });
    }
    await page.waitForTimeout(1_500);
    await shot(page, "live-btc.png");

    // --- back to BID through the shell nav ---------------------------------------
    await budget(page, 2);
    tracker.phase = "equity";
    await openMainTab(page, "Cổ phiếu");
    await page.waitForURL((url) => url.pathname === "/co-phieu");
    await symbolGroupOf(page).getByRole("button", { name: "BID" }).click();
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    await expect(page.getByTestId("bid-decision-locked")).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(apiPaths(tracker).filter((p) => /\/(decision|position|observations)$/.test(p))).toEqual([]);
    expectNoCryptoOnEquity(tracker);
    expect(tracker.errors).toEqual([]);
  });

  test("admin: BID decision/position, save + restore without touching MBB, LLM disabled, lock again", async ({ page }) => {
    test.skip(!adminKey, "Set EQX_ADMIN_KEY (local test admin key) to run the admin flow.");
    test.slow();
    test.setTimeout(900_000);
    const tracker = track(page);
    await budget(page, 1);

    const candles = uiResponse(page, "GET", /\/api\/equities\/BID\/candles\?.*timeframe=1d/);
    await page.goto("/co-phieu?symbol=BID");
    await expect(page.getByRole("heading", { name: "BID — BIDV" })).toBeVisible();
    const candleBody = await (await candles).json() as Candle[];
    expect(candleBody.length).toBeGreaterThan(1);

    // Unlock → BID personal reads fire (and only now).
    const decision = uiResponse(page, "GET", /\/api\/equities\/BID\/decision$/);
    const position = uiResponse(page, "GET", /\/api\/equities\/BID\/position$/);
    const observations = uiResponse(page, "GET", /\/api\/equities\/BID\/observations\?.*timeframe=1d/);
    await page.locator("#admin-session-key").fill(adminKey);
    await page.getByRole("button", { name: "Mở khóa" }).click();
    const decisionRes = await decision;
    expect(decisionRes.status()).toBe(200);
    const decisionBody = await capture("bid-decision", decisionRes) as { symbol: string; action: string; priceBasis: string };
    expect(decisionBody.symbol).toBe("BID");
    expect(decisionBody.priceBasis).toBe("adjusted");
    const positionRes = await position;
    expect(positionRes.status()).toBe(200);
    const originalBid = await capture("bid-position-before", positionRes) as Position;
    expect(originalBid.symbol).toBe("BID");
    await expect(page.getByTestId("bid-decision").getByText(/· chưa validated/)).toBeVisible();
    const obsRes = await observations;
    expect(obsRes.status()).toBe(200);
    const obsBody = await capture("bid-observations-1d", obsRes) as Array<{ symbol?: string }>;
    if (obsBody.length === 0) await expect(page.getByTestId("bid-observations-empty")).toBeVisible();
    else expect(obsBody.every((o) => o.symbol == null || o.symbol === "BID")).toBe(true);
    const decisionPosition = (decisionBody as { position?: { costBasisComparable?: boolean } }).position;
    if (decisionPosition?.costBasisComparable === false) await expect(page.getByTestId("bid-cost-basis-note")).toBeVisible();

    // MBB baseline (the UI's own read).
    await budget(page, 1);
    const mbbPos = uiResponse(page, "GET", /\/api\/mbb\/position$/);
    await symbolGroupOf(page).getByRole("button", { name: "MBB" }).click();
    const mbbBefore = await (await mbbPos).json() as Position;
    expect(mbbBefore.symbol).toBe("MBB");

    // Save a small BID position: 100 shares at the latest close, bought on the previous session.
    await budget(page, 1);
    const bidPos = uiResponse(page, "GET", /\/api\/equities\/BID\/position$/);
    await symbolGroupOf(page).getByRole("button", { name: "BID" }).click();
    const bidLoaded = await (await bidPos).json() as Position;
    const last = candleBody[candleBody.length - 1];
    const prev = candleBody[candleBody.length - 2];
    const acquireDate = new Date(prev.openTimeMs + 7 * 3_600_000).toISOString().slice(0, 10); // VN session date
    await replaceLots(page, bidLoaded, [{ quantity: 100, costPerShareVnd: last.close, acquireDate }], originalBid);
    const put = uiResponse(page, "PUT", /\/api\/equities\/BID\/position$/);
    const decisionAfter = uiResponse(page, "GET", /\/api\/equities\/BID\/decision$/);
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    const putRes = await put;
    expect(putRes.status()).toBe(200);
    const saved = await capture("bid-position-saved", putRes) as Position;
    expect(saved.symbol).toBe("BID");
    expect(saved.lots.map((l) => [l.quantity, l.costPerShareVnd, l.acquireDate])).toEqual([[100, last.close, acquireDate]]);
    await expect(page.getByText(/Đã lưu vị thế/)).toBeVisible();
    await capture("bid-decision-after-save", await decisionAfter);
    await expect(page.getByTestId("bid-position-summary").getByText("100 cp").first()).toBeVisible();
    await shot(page, "live-bid-admin.png");

    // MBB untouched.
    await budget(page, 1);
    const mbbPosAfter = uiResponse(page, "GET", /\/api\/mbb\/position$/);
    await symbolGroupOf(page).getByRole("button", { name: "MBB" }).click();
    const mbbAfter = await (await mbbPosAfter).json() as Position;
    expect(mbbAfter.lots).toEqual(mbbBefore.lots);
    expect(mbbAfter.availableCashVnd).toBe(mbbBefore.availableCashVnd);

    // Restore BID exactly as it was.
    await budget(page, 1);
    const bidPos2 = uiResponse(page, "GET", /\/api\/equities\/BID\/position$/);
    await symbolGroupOf(page).getByRole("button", { name: "BID" }).click();
    const bidLoaded2 = await (await bidPos2).json() as Position;
    expect(bidLoaded2.lots).toHaveLength(1);
    await replaceLots(page, bidLoaded2, originalBid.lots, originalBid);
    const restorePut = uiResponse(page, "PUT", /\/api\/equities\/BID\/position$/);
    await page.getByRole("button", { name: "Lưu vị thế" }).click();
    const restoreRes = await restorePut;
    expect(restoreRes.status()).toBe(200);
    const restored = await capture("bid-position-restored", restoreRes) as Position;
    expect(restored.lots.map((l) => [l.quantity, l.costPerShareVnd, l.acquireDate]))
      .toEqual(originalBid.lots.map((l) => [l.quantity, l.costPerShareVnd, l.acquireDate]));
    expect(restored.availableCashVnd).toBe(originalBid.availableCashVnd);
    if (originalBid.buyBudgetVnd !== undefined) expect(restored.buyBudgetVnd ?? null).toBe(originalBid.buyBudgetVnd ?? null);

    // EQX v2 §B: the in-app LLM layer is disabled — the UI offers no way to create a run.
    const llm = page.getByTestId("bid-llm");
    await expect(llm.getByTestId("bid-llm-disabled-note")).toContainText("Lớp LLM trong app đã ngừng");
    await expect(llm.getByRole("button", { name: /Tạo phân tích LLM/ })).toHaveCount(0);
    expect(tracker.equityRequests.filter((r) => r.startsWith("POST ") && r.includes("/llm-runs"))).toEqual([]);
    await llm.screenshot({ path: `${EVIDENCE}/live-llm-disabled.png` });

    // Lock again → personal panels locked, nothing personal left on screen.
    await page.getByRole("button", { name: "Khóa lại" }).click();
    await expect(page.getByTestId("bid-decision-locked")).toBeVisible();
    await expect(page.getByTestId("bid-position-locked")).toBeVisible();
    await expect(page.getByTestId("bid-position-summary")).toHaveCount(0);
    await expect(page.getByTestId("bid-observations-locked")).toBeVisible();
    await expect(llm.getByRole("button", { name: /Tạo phân tích LLM/ })).toHaveCount(0);
    expectNoCryptoOnEquity(tracker);
    expect(tracker.errors).toEqual([]);
  });
});

function symbolGroupOf(page: Page) {
  return page.getByRole("group", { name: "Chọn mã cổ phiếu" });
}

/**
 * Replace the form's lots. `current` is the position the UI just loaded — wait
 * until the form reflects it (the view remounts on symbol switch and applies the
 * GET asynchronously) before editing, or the edit races the prefill.
 */
async function replaceLots(page: Page, current: Position, lots: Position["lots"], money: Position) {
  const form = page.getByTestId("bid-position-form");
  const remove = form.getByRole("button", { name: /^Xoá lô \d+$/ });
  await expect(remove).toHaveCount(current.lots.length);
  // Shared cash pool backend: the form carries the per-symbol buy budget, never cash.
  const sharedPool = current.buyBudgetVnd !== undefined || current.sharedCashVnd !== undefined;
  const moneyInput = page.locator(sharedPool ? "#bid-buy-budget" : "#bid-cash");
  const draft = (p: Position) => (sharedPool ? (p.buyBudgetVnd == null ? "" : String(p.buyBudgetVnd)) : String(p.availableCashVnd));
  await expect(moneyInput).toHaveValue(draft(current));
  while (await remove.count() > 0) await remove.first().click();
  await expect(remove).toHaveCount(0);
  for (let i = 0; i < lots.length; i++) {
    await form.getByRole("button", { name: "+ Thêm lô" }).click();
    await page.locator(`#bid-lot-qty-${i}`).fill(String(lots[i].quantity));
    await page.locator(`#bid-lot-cost-${i}`).fill(String(lots[i].costPerShareVnd));
    await page.locator(`#bid-lot-date-${i}`).fill(lots[i].acquireDate);
  }
  await moneyInput.fill(draft(money));
}
