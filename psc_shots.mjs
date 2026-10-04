import { chromium } from "@playwright/test";
import fs from "node:fs";

const PROD = "https://btc-fe.vercel.app";
const LOCAL = "http://127.0.0.1:3210";
const OUT = ".psc-shots";
const TARGET = process.argv[2] || "news";
const SKIP_PROD = process.argv.includes("--no-prod");
const fixtures = new Map();

const WANTED = {
  news: ["/api/news"],
  ai: ["/api/analysis/bitcoin", "/api/sentiment/current", "/api/ai-chat/capabilities"],
  research: ["/api/research/evidence", "/api/research/capabilities", "/api/market/data-audit", "/api/health/workers", "/api/backtest/runs", "/api/paper-trades/observations", "/api/market/data-quality/issues"],
  analog: ["/api/historical-analogs"],
  rules: ["/api/discovery/rules", "/api/discovery/volume-stats"],
  backtest: ["/api/backtest/runs"],
  predict: ["/api/prediction/latest", "/api/prediction/history", "/api/ai-chat/capabilities"],
  paper: ["/api/paper-trades", "/api/paper-trades/observations"],
  binanceHistory: ["/api/paper-trades"],
  settings: ["/api/alert-settings", "/api/alerts", "/api/alerts/unread-count", "/api/health/workers"],
};

const TAB = {
  news: ["Tin tức & AI", "Tin tức"],
  ai: ["Tin tức & AI", "AI"],
  research: ["Nghiên cứu", "Nghiên cứu"],
  analog: ["Nghiên cứu", "Mẫu nến"],
  rules: ["Nghiên cứu", "Rules nến"],
  backtest: ["Nghiên cứu", "Backtest"],
  predict: ["Mô phỏng", "Dự đoán"],
  paper: ["Mô phỏng", "Paper"],
  binanceHistory: ["Mô phỏng", "Nhật ký Paper BTC"],
  settings: ["Hệ thống", null],
};

async function openTab(page, key) {
  const [groupLabel, tabLabel] = TAB[key];
  const navGroups = page.getByTestId("nav-groups");
  const groupButton = navGroups.getByRole("button", { name: groupLabel, exact: true });
  if ((await groupButton.getAttribute("aria-expanded")) !== "true") await groupButton.click();
  if (tabLabel && (await groupButton.getAttribute("aria-expanded")) === "true") {
    await page.getByTestId("nav-sub-row").getByRole("button", { name: tabLabel, exact: true }).click();
  }
}

function stubRoutes(page) {
  return page.route("**/api/**", async (route) => {
    const p = new URL(route.request().url()).pathname;
    if (fixtures.has(p)) return route.fulfill({ json: fixtures.get(p) });
    if (p === "/api/meta") return route.fulfill({ json: { appVersion: "local", apiContractVersion: "2026-09-research-evidence-v9", dataPipelineVersion: "local", evaluationVersion: "local", environment: "Local" } });
    if (p === "/api/market/tickers" || p === "/api/market/klines" || p === "/api/market/trades" || p === "/api/news" || p === "/api/alerts") return route.fulfill({ json: [] });
    if (p === "/api/market/depth") return route.fulfill({ json: { symbol: "BTCUSDT", lastUpdateId: 1, bids: [], asks: [] } });
    if (p === "/api/sentiment/current") return route.fulfill({ json: { aggregatedSentiment: 0, sentimentLabel: "NEUTRAL", createdAtUtc: new Date().toISOString() } });
    if (p === "/api/alerts/unread-count") return route.fulfill({ json: { unreadCount: 0 } });
    return route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
}

async function run(browser, base, tag, mobile) {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 }, locale: "vi-VN" });
  const page = await ctx.newPage();
  await page.routeWebSocket(/stream\.binance\.com/, () => {});
  if (tag === "after") await stubRoutes(page);
  else {
    page.on("response", async (res) => {
      try {
        const p = new URL(res.url()).pathname;
        if (!WANTED[TARGET].some((w) => p === w || p.startsWith(w + "/")) || fixtures.has(p)) return;
        const body = await res.json().catch(() => null);
        if (body != null) fixtures.set(p, body);
      } catch { }
    });
  }
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Trợ lý AI Chat").evaluate((el) => { el.style.display = "none"; }).catch(() => {});
  await openTab(page, TARGET);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/${TARGET}-${tag}${mobile ? "-m" : ""}.png` });
  await ctx.close();
}

fs.mkdirSync(OUT, { recursive: true });
const FIXFILE = `${OUT}/fixtures-${TARGET}.json`;
if (SKIP_PROD && fs.existsSync(FIXFILE)) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(FIXFILE, "utf8")))) fixtures.set(k, v);
}
const browser = await chromium.launch();
try {
  if (!SKIP_PROD) await run(browser, PROD, "before", false);
  fs.writeFileSync(FIXFILE, JSON.stringify(Object.fromEntries(fixtures)));
  await run(browser, LOCAL, "after", false);
  await run(browser, LOCAL, "after", true);
  console.log("FIXTURES:", [...fixtures.keys()].join(","));
  console.log("DONE", TARGET);
} finally { await browser.close(); }
