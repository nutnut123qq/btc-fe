// Probe which /api/* requests hang on archetype/rules tabs against prod.
import { chromium } from "playwright";
const BASE = process.env.LIVE_BASE || "http://127.0.0.1:3212";
const target = process.argv[2] || "archetype"; // archetype | rules
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const pending = new Map();
page.on("request", (r) => {
  if (r.url().includes("/api/")) pending.set(r.url(), Date.now());
});
page.on("response", (r) => {
  if (r.url().includes("/api/")) {
    const t = pending.get(r.url());
    pending.delete(r.url());
    console.log(`${r.status()} ${((Date.now() - t) / 1000).toFixed(1)}s ${r.url().replace(BASE, "")}`);
  }
});
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
const nav = page.getByTestId("nav-groups");
await nav.getByRole("button", { name: "Nghiên cứu", exact: true }).click();
await page.waitForTimeout(400);
const sub = target === "archetype" ? "Mẫu nến" : "Rules nến";
console.log(`--- opening ${sub} ---`);
await page.getByTestId("nav-sub-row").getByRole("button", { name: sub, exact: true }).click();
await page.waitForTimeout(45000);
console.log("--- still pending after 45s ---");
for (const u of pending.keys()) console.log("  PENDING", u.replace(BASE, ""));
const body = await page.locator("main").innerText();
console.log("--- main text (first 500) ---\n", body.slice(0, 500));
await browser.close();
