// Baseline capture for the redesign inventory — PROD, real data, read-only.
// Usage: node baseline_shots.mjs            -> all screens, desktop+mobile
//        node baseline_shots.mjs market    -> single screen
//        node baseline_shots.mjs --mobile  -> mobile only
import { chromium } from "@playwright/test";
import fs from "node:fs";

const PROD = "https://btc-fe.vercel.app";
const OUT = ".baseline-shots";
const ARG = process.argv.find((a) => !a.startsWith("--") && a.endsWith(".mjs") === false && a !== process.argv[1]);
const TARGET = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : null;
const MOBILE_ONLY = process.argv.includes("--mobile");
const DESKTOP_ONLY = process.argv.includes("--desktop");

const TABS = {
  market: ["Thị trường", null],
  news: ["Tin tức & AI", "Tin tức"],
  ai: ["Tin tức & AI", "AI"],
  research: ["Nghiên cứu", "Nghiên cứu"],
  archetype: ["Nghiên cứu", "Mẫu nến"],
  rules: ["Nghiên cứu", "Rules nến"],
  backtest: ["Nghiên cứu", "Backtest"],
  predict: ["Mô phỏng", "Dự đoán"],
  paper: ["Mô phỏng", "Paper"],
  binanceHistory: ["Mô phỏng", "Nhật ký Paper BTC"],
  settings: ["Hệ thống", null],
};

const ORDER = ["market", "news", "ai", "research", "archetype", "rules", "backtest", "predict", "paper", "binanceHistory", "settings"];

async function openTab(page, key) {
  const [groupLabel, tabLabel] = TABS[key];
  const navGroups = page.getByTestId("nav-groups");
  const groupButton = navGroups.getByRole("button", { name: groupLabel, exact: true });
  if (tabLabel === null) {
    await groupButton.click();
    return;
  }
  if ((await groupButton.getAttribute("aria-expanded")) !== "true") await groupButton.click();
  await page.getByTestId("nav-sub-row").getByRole("button", { name: tabLabel, exact: true }).click();
}

async function captureViewport(browser, mobile, keys, notes) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 },
    locale: "vi-VN",
  });
  const page = await ctx.newPage();
  const netLog = [];
  page.on("response", (res) => {
    try {
      const u = new URL(res.url());
      if (u.pathname.startsWith("/api/") && res.status() >= 400) {
        netLog.push({ url: u.pathname + u.search, status: res.status() });
      }
    } catch {}
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") notes.consoleErrors.push({ viewport: mobile ? "m" : "d", msg: msg.text().slice(0, 200) });
  });
  await page.goto(PROD, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const suffix = mobile ? "-m" : "";
  for (const key of keys) {
    try {
      await openTab(page, key);
      await page.waitForTimeout(mobile ? 3500 : 4500);
      // Hide chat launcher so it doesn't cover content
      await page.getByLabel("Trợ lý AI Chat").evaluate((el) => { el.style.display = "none"; }).catch(() => {});
      await page.screenshot({ path: `${OUT}/${key}${suffix}.png` });
      notes.screens.push({ key, viewport: mobile ? "m" : "d", apiErrors: [...netLog] });
      netLog.length = 0;
    } catch (e) {
      notes.screens.push({ key, viewport: mobile ? "m" : "d", error: String(e).slice(0, 300) });
    }
  }
  // Shared overlays — desktop only, on market screen
  if (!mobile) {
    try {
      await openTab(page, "market");
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: "Thông báo", exact: true }).click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${OUT}/overlay-alerts.png` });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Đóng", exact: false }).first().click().catch(() => {});
      await page.waitForTimeout(500);
      const chatBtn = page.getByLabel("Trợ lý AI Chat");
      await chatBtn.evaluate((el) => { el.style.display = ""; }).catch(() => {});
      await chatBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/overlay-aichat.png` });
    } catch (e) {
      notes.screens.push({ key: "overlays", viewport: "d", error: String(e).slice(0, 300) });
    }
  }
  await ctx.close();
}

fs.mkdirSync(OUT, { recursive: true });
const keys = TARGET ? [TARGET] : ORDER;
const notes = { capturedAt: new Date().toISOString(), prod: PROD, screens: [], consoleErrors: [] };
const browser = await chromium.launch();
try {
  if (!MOBILE_ONLY) await captureViewport(browser, false, keys, notes);
  if (!DESKTOP_ONLY) await captureViewport(browser, true, keys, notes);
  fs.writeFileSync(`${OUT}/notes.json`, JSON.stringify(notes, null, 2));
  console.log("DONE", keys.join(","));
  console.log(JSON.stringify(notes.screens.map((s) => ({ k: s.key, v: s.viewport, err: s.error ? 1 : 0, api: (s.apiErrors || []).length }))));
} finally { await browser.close(); }
