import { expect, test, type Page } from "@playwright/test";

const productionUrl = process.env.PLAYWRIGHT_BASE_URL;

async function collectErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function openEvidenceCenter(page: Page) {
  await page.goto("/");
  const nav = page.getByRole("button", { name: "Nghiên cứu", exact: true });
  const heading = page.getByRole("heading", { name: "Nghiên cứu có thể kiểm chứng" });
  await expect(async () => {
    if (!(await heading.isVisible())) await nav.click();
    await expect(heading).toBeVisible();
  }).toPass({ timeout: 60_000 });
  await expect(page.getByText("Đang tải catalog…")).toHaveCount(0, { timeout: 90_000 });
}

function descriptiveCards(page: Page) {
  return page
    .locator('section[aria-label="Danh sách artifact"]')
    .getByRole("button", { name: /Technical-event descriptive history/ });
}

test.describe("research evidence center (live stack)", () => {
  test.skip(!productionUrl, "Set PLAYWRIGHT_BASE_URL to run production checks.");
  test.setTimeout(150_000);

  test("desktop: catalog, descriptive detail and statistical dossier render from real API", async ({ page }) => {
    const errors = await collectErrors(page);
    await openEvidenceCenter(page);

    const cards = descriptiveCards(page);
    await expect(cards).toHaveCount(3);
    await expect(cards.filter({ hasText: "BTCUSDT · 1h" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "BTCUSDT · 4h" })).toHaveCount(1);
    await expect(cards.filter({ hasText: "BTCUSDT · 1d" })).toHaveCount(1);
    await expect(cards.first()).toContainText("hash đã xác minh");

    const detailRequest = page.waitForResponse((response) =>
      /\/api\/research\/evidence\/[a-f0-9]{64}/.test(response.url()) && response.status() === 200,
    );
    await cards.filter({ hasText: "BTCUSDT · 4h" }).click();
    const detailResponse = await detailRequest;
    const detail = await detailResponse.json();
    expect(detail.statisticalEvidence).toBeTruthy();
    expect(detail.statisticalEvidence.multipleTesting.familySizeAllRetained).toBe(378);
    expect(detail.statisticalEvidence.multipleTesting.testableFamilySize).toBe(333);
    expect(detail.statisticalEvidence.claimType).toBe("descriptive_only");

    await expect(page.locator('article[aria-label^="Hồ sơ bằng chứng"]')).toBeVisible({ timeout: 60_000 });
    const panel = page.locator('section[aria-labelledby="statistical-evidence-title"]');
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/descriptive only/)).toBeVisible();
    await expect(panel.getByText("Benjamini-Yekutieli")).toBeVisible();
    await expect(panel.getByText("5%", { exact: true }).first()).toBeVisible();
    await expect(panel.getByText("378", { exact: true }).first()).toBeVisible();
    await expect(panel.getByText("333", { exact: true }).first()).toBeVisible();

    const hypothesis = panel.locator("article").filter({ has: page.locator("h4") }).first();
    await expect(hypothesis.locator("h4")).toHaveText(/^[A-Za-z0-9-]+:[A-Za-z_]+:[136]:(forwardReturn|mfe|mae)$/);
    await expect(hypothesis.getByText(/Raw p \/ adjusted q/)).toBeVisible();
    await expect(hypothesis.getByText(/Loại để lấy tập không chồng lấn/)).toBeVisible();

    const hashDd = page.locator('dd[title]').filter({ hasText: "…" }).first();
    await expect(hashDd).toBeVisible();
    expect(await hashDd.getAttribute("title")).toMatch(/^[a-f0-9]{64}$/);

    await expect(page.getByText(/không phải dự báo/).first()).toBeVisible();
    await expect(page.getByText(/không phải tỷ lệ thắng/).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("mobile 375px: evidence center fits viewport without horizontal overflow", async ({ page }) => {
    const errors = await collectErrors(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await openEvidenceCenter(page);

    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);

    await descriptiveCards(page).filter({ hasText: "BTCUSDT · 1d" }).click();
    await expect(page.locator('article[aria-label^="Hồ sơ bằng chứng"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('section[aria-labelledby="statistical-evidence-title"]')).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);

    const leakingHash = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad: string[] = [];
      document.querySelectorAll("dd[title]").forEach((el) => {
        if (el.getBoundingClientRect().right > vw + 2) bad.push((el as HTMLElement).innerText.slice(0, 40));
      });
      return bad;
    });
    expect(leakingHash).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("catalog API failure surfaces an alert instead of a crash", async ({ page }) => {
    const errors = await collectErrors(page);
    await page.route("**/api/research/evidence", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: "{\"message\":\"down\"}" }),
    );
    await page.goto("/");
    const nav = page.getByRole("button", { name: "Nghiên cứu", exact: true });
    const alertText = page.getByRole("alert").getByText(/Evidence API chưa sẵn sàng/);
    await expect(async () => {
      if (!(await alertText.isVisible())) await nav.click();
      await expect(alertText).toBeVisible();
    }).toPass({ timeout: 90_000 });
    expect(errors).toEqual([]);
  });
});
