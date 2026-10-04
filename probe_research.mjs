import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on("pageerror", e => errs.push(e.message));
await p.goto("http://127.0.0.1:3212/", { waitUntil: "domcontentloaded" });
// navigate to research tab
await p.getByTestId("nav-groups").getByRole("button", { name: "Nghiên cứu", exact: true }).click();
await p.waitForTimeout(2000);
const snap = async (label) => {
  const txt = await p.locator("main").innerText();
  console.log(label, "| audit-unavailable-badge:", txt.includes("audit unavailable"),
    "| artifact-0:", /0\s*artifact đã kiểm kê/.test(txt),
    "| tf-unavailable:", (txt.match(/unavailable/g)||[]).length,
    "| workers-missing:", txt.includes("Worker health chưa công bố"));
};
await snap("t+2s");
await p.waitForTimeout(20000);
await snap("t+22s");
await p.waitForTimeout(15000);
await snap("t+37s");
await p.screenshot({ path: ".impl-shots/sup-research-settled.png" });
console.log("errs:", errs.slice(0,5));
await b.close();
