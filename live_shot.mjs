// Live-verify capture against prod API. Usage:
//   LIVE_BASE=http://127.0.0.1:3212 LIVE_OUT=lv node live_shot.mjs [mobile]
// GET-only interactions: nav, expand, paginate, open drawer. NO POST buttons.
import { chromium } from "playwright";

const BASE = process.env.LIVE_BASE || "http://127.0.0.1:3212";
const OUT = process.env.LIVE_OUT || "lv";
const mobile = process.argv.includes("mobile");
const vp = mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp });
const consoleErrors = {};
let current = "boot";
const errorsFor = (k) => (consoleErrors[k] ??= []);
page.on("console", (m) => {
  if (m.type() === "error") errorsFor(current).push(m.text().slice(0, 300));
});
page.on("pageerror", (e) => errorsFor(current).push("PAGEERROR: " + String(e).slice(0, 300)));

const NAV = mobile ? "nav-groups-mobile" : "nav-groups";

async function shot(name) {
  current = name;
  await page.screenshot({ path: `.impl-shots/${OUT}-${name}${mobile ? "m" : ""}.png` });
  console.log("shot", name);
}

async function go(groupLabel, subLabel, anchor) {
  const nav = page.getByTestId(NAV);
  if (groupLabel) {
    await nav.getByRole("button", { name: groupLabel, exact: true }).click();
    await page.waitForTimeout(300);
  }
  if (subLabel) {
    await page.getByTestId("nav-sub-row").getByRole("button", { name: subLabel, exact: true }).click();
  }
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  if (anchor) {
    await anchor.first().waitFor({ state: "visible", timeout: 12000 }).catch(() => {
      console.log("  [anchor-timeout]");
    });
  }
  await page.waitForTimeout(600);
}

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});

// 1 market (default tab)
await go(null, null, page.locator("main canvas").first());
await shot("market");

// 2 news
await go("Tin tức & AI", "Tin tức", page.locator("main article").first());
await shot("news");

// 3 ai (panel only — do NOT click analyze, it's POST)
await go("Tin tức & AI", "AI", page.getByText(/capabilit|khả dụng|Phân tích/i).first());
await shot("ai");

// 4 research overview
await go("Nghiên cứu", "Nghiên cứu", page.getByText(/Hồ sơ bằng chứng|Độ phủ dữ liệu|Nghiên cứu có thể kiểm chứng/).first());
await shot("research");

// 5 research detail (GET navigation via dossier link)
const dossierLink = page.getByText("Xem hồ sơ").first();
if (await dossierLink.isVisible().catch(() => false)) {
  await dossierLink.click();
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.getByText(/Hồ sơ kết luận|Snapshot|artifact/i).first().waitFor({ state: "visible", timeout: 12000 }).catch(() => console.log("  [anchor-timeout]"));
  await page.waitForTimeout(600);
}
await shot("research-detail");

// 6 archetype
await go("Nghiên cứu", "Mẫu nến", page.getByText(/Analog|Thư viện|Mẫu nến/).first());
await shot("archetype");

// 7 rules
await go("Nghiên cứu", "Rules nến", page.getByText(/Rules|sequence|điều kiện/i).first());
await shot("rules");

// 8 backtest — select first run if any
await go("Nghiên cứu", "Backtest", page.getByText(/Backtest|run|lệnh/i).first());
const runBtn = page.getByTestId("nav-sub-row").locator("..").locator("main button, main [role='button']").first();
const runRow = page.locator("main tr, main article, main button").filter({ hasText: /run|walk|xgboost|ensemble/i }).first();
if (await runRow.isVisible().catch(() => false)) {
  await runRow.click();
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
}
await shot("backtest");

// 9 predict (no predict-button click — POST)
await go("Mô phỏng", "Dự đoán", page.getByText(/Dự đoán|model|quarantine/i).first());
await shot("predict");

// 10 paper
await go("Mô phỏng", "Paper", page.getByText(/forward|Abstain|Paper/i).first());
await shot("paper");

// 11 journal
await go("Mô phỏng", "Nhật ký Paper BTC", page.getByText(/giao dịch|lệnh|Nhật ký/i).first());
await shot("journal");

// 12 settings
await go("Hệ thống", null, page.getByText(/Ngưỡng giá|Cảnh báo|Trạng thái/).first());
await shot("settings");

// 13 alerts drawer (GET-only: open bell)
const bell = page.getByRole("button", { name: /thông báo|alerts|chuông/i }).first()
  .or(page.locator("header button").last());
if (await bell.first().isVisible().catch(() => false)) {
  await bell.first().click();
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
}
await shot("alerts");
await page.keyboard.press("Escape");

console.log("\n=== CONSOLE ERRORS ===");
for (const [k, v] of Object.entries(consoleErrors)) {
  if (v.length) {
    console.log(`[${k}] ${v.length} error(s)`);
    for (const line of v.slice(0, 6)) console.log("   ", line);
  }
}
console.log("done");
await browser.close();
