// Recapture archetype + rules with terminal-state waits (result OR empty OR error).
import { chromium } from "playwright";
const BASE = process.env.LIVE_BASE || "http://127.0.0.1:3212";
const OUT = process.env.LIVE_OUT || "lv";
const mobile = process.argv.includes("mobile");
const vp = mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp });
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
const nav = page.getByTestId(mobile ? "nav-groups-mobile" : "nav-groups");
await nav.getByRole("button", { name: "Nghiên cứu", exact: true }).click();
await page.waitForTimeout(400);
const sub = page.getByTestId("nav-sub-row");

// archetype — wait until loading text gone (results or empty/error shown)
await sub.getByRole("button", { name: "Mẫu nến", exact: true }).click();
await page.locator("main").getByText("Đang tìm analog", { exact: false }).waitFor({ state: "hidden", timeout: 90000 }).catch(() => console.log("  [archetype still loading]"));
await page.waitForTimeout(800);
await page.screenshot({ path: `.impl-shots/${OUT}-archetype${mobile ? "m" : ""}.png` });
console.log("shot archetype");

// rules — wait until loading text gone
await sub.getByRole("button", { name: "Rules nến", exact: true }).click();
await page.locator("main").getByText("Đang tải", { exact: false }).waitFor({ state: "hidden", timeout: 60000 }).catch(() => console.log("  [rules still loading]"));
await page.waitForTimeout(800);
await page.screenshot({ path: `.impl-shots/${OUT}-rules${mobile ? "m" : ""}.png` });
console.log("shot rules");
await browser.close();
console.log("done");
