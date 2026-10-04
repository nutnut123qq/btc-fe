// Recapture research (pending -> settled) + research-detail (real artifact click).
import { chromium } from "playwright";
const BASE = process.env.LIVE_BASE || "http://127.0.0.1:3212";
const mobile = process.argv.includes("mobile");
const vp = mobile ? { width: 390, height: 844 } : { width: 1600, height: 1000 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: vp });
const suffix = mobile ? "m" : "";
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
const nav = page.getByTestId(mobile ? "nav-groups-mobile" : "nav-groups");
await nav.getByRole("button", { name: "Nghiên cứu", exact: true }).click();
await page.waitForTimeout(400);
await page.getByTestId("nav-sub-row").getByRole("button", { name: "Nghiên cứu", exact: true }).click();

// 1) pending state — audit takes ~17s on prod; shoot while it is still loading
await page.waitForTimeout(1500);
await page.screenshot({ path: `.impl-shots/lv-research-pending${suffix}.png` });
console.log("shot research-pending");

// 2) settled — pending text gone AND coverage values rendered
const pendingText = page.getByText("Đang tải audit", { exact: false });
await pendingText.waitFor({ state: "hidden", timeout: 90000 }).catch(() => console.log("  [pending never cleared]"));
await page.getByText(/artifact đã kiểm kê/).waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: `.impl-shots/lv-research${suffix}.png` });
console.log("shot research (settled)");

// 3) detail — click first real artifact card ("Xem hồ sơ" inside a button)
const card = page.locator("main button", { has: page.getByText("Xem hồ sơ") }).first();
if (await card.isVisible().catch(() => false)) {
  await card.click();
  // wait for detail loading to finish: detail panel shows dossier sections
  await page.getByText("Đang tải hồ sơ", { exact: false }).waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(800);
} else {
  console.log("  [no artifact card visible]");
}
await page.screenshot({ path: `.impl-shots/lv-research-detail${suffix}.png` });
console.log("shot research-detail");
await browser.close();
console.log("done");
