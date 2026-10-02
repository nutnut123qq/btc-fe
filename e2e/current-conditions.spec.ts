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

function conditionsPanel(page: Page) {
  return page.locator('section[aria-labelledby="current-conditions-title"]');
}

async function waitForConditionsResponse(page: Page, timeframe: string) {
  return page
    .waitForResponse(
      (response) =>
        new RegExp(`/api/research/current-conditions\\?.*timeframe=${timeframe}`).test(response.url()) && response.status() === 200,
      { timeout: 90_000 },
    )
    .catch(() => null);
}

test.describe("current conditions panel (live stack)", () => {
  test.skip(!productionUrl, "Set PLAYWRIGHT_BASE_URL to run production checks.");
  test.setTimeout(150_000);

  test("renders meta rows, module groups and honest evidence cells from real API", async ({ page }) => {
    const errors = await collectErrors(page);
    const pending = waitForConditionsResponse(page, "4h");
    await openEvidenceCenter(page);

    const panel = conditionsPanel(page);
    await expect(panel).toBeVisible();
    const response = await pending;
    test.skip(!response, "current-conditions endpoint chưa deploy trên stack này.");
    const payload = await response!.json();
    expect(payload.timeframe).toBe("4h");
    expect(payload.asOfMs).toBeGreaterThan(0);

    // Two separate labeled meta values — never merged into one timestamp.
    await expect(panel.getByText("Nến phân tích (asOf)")).toBeVisible();
    await expect(panel.getByText("Nghiên cứu cắt tại")).toBeVisible();

    if (payload.evidence?.available === true) {
      await expect(panel.getByText(/cách \d+.*nến|trùng mốc nến phân tích/).first()).toBeVisible();
    } else {
      await expect(panel.getByText(/Bằng chứng không khả dụng/)).toBeVisible();
    }

    for (const warning of (payload.warnings ?? []) as string[]) {
      await expect(panel.getByText(warning)).toBeVisible();
    }
    for (const item of (payload.unavailableModules ?? []) as Array<{ module: string }>) {
      await expect(panel.getByText(item.module, { exact: false }).first()).toBeVisible();
    }
    for (const conflict of (payload.conflicts ?? []) as Array<{ horizon: number; metric: string; bullish: string[]; bearish: string[] }>) {
      const conflictsBox = panel.getByTestId("conditions-conflicts");
      await expect(conflictsBox.getByText(/không có winner/)).toBeVisible();
      await expect(conflictsBox.getByText(`h${conflict.horizon} · ${conflict.metric}`)).toBeVisible();
      for (const id of [...conflict.bullish, ...conflict.bearish]) {
        await expect(conflictsBox.getByText(id, { exact: false }).first()).toBeVisible();
      }
    }

    const conditions = (payload.conditions ?? []) as Array<{ module: string; eventType: string; kind: string; evidence: Record<string, Record<string, { tested: boolean; reason?: string }>> | null }>;
    if (conditions.length === 0) {
      await expect(panel.getByText(/Không có điều kiện nào thỏa trên nến đóng gần nhất/)).toBeVisible();
    } else {
      for (const moduleName of new Set(conditions.map((item) => item.module))) {
        await expect(panel.getByText(moduleName, { exact: false }).first()).toBeVisible();
      }
      for (const condition of conditions) {
        await expect(panel.getByText(condition.eventType, { exact: false }).first()).toBeVisible();
      }
      if (conditions.some((item) => item.kind === "triggeredOnBar")) {
        await expect(panel.getByText("mới trên nến đóng gần nhất").first()).toBeVisible();
      }
      const untested = conditions
        .flatMap((item) => Object.values(item.evidence ?? {}).flatMap((horizon) => Object.values(horizon)))
        .find((cell) => cell && cell.tested === false && cell.reason);
      if (untested?.reason) await expect(panel.getByText(new RegExp(untested.reason.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).first()).toBeVisible();
    }

    // Descriptive-only copy: the panel must never show trading/probability verbs.
    await expect(panel.getByText(/\bBUY\b|\bSELL\b/)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("timeframe selector re-requests the matching timeframe", async ({ page }) => {
    const errors = await collectErrors(page);
    const first = waitForConditionsResponse(page, "4h");
    await openEvidenceCenter(page);
    const panel = conditionsPanel(page);
    await expect(panel).toBeVisible();
    if (!(await first)) test.skip(true, "current-conditions endpoint chưa deploy trên stack này.");

    const next = waitForConditionsResponse(page, "1h");
    await panel.getByLabel("Timeframe điều kiện hiện tại").selectOption("1h");
    const response = await next;
    expect(response, "selector phải gọi lại endpoint với timeframe=1h").toBeTruthy();
    const payload = await response!.json();
    expect(payload.timeframe).toBe("1h");
    await expect(panel.getByText("BTCUSDT · 1h · thời điểm nến thị trường được phân tích")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("API failure surfaces an alert with retry instead of a crash", async ({ page }) => {
    const errors = await collectErrors(page);
    await page.route("**/api/research/current-conditions**", (route) =>
      route.fulfill({ status: 502, contentType: "application/json", body: "{\"Code\":\"CONDITIONS_SOURCE_UNAVAILABLE\",\"Retryable\":true}" }),
    );
    await openEvidenceCenter(page);
    const panel = conditionsPanel(page);
    const alertBox = panel.getByRole("alert");
    await expect(async () => {
      await expect(alertBox).toBeVisible();
      await expect(alertBox).toContainText(/Điều kiện hiện tại chưa sẵn sàng/);
      await expect(panel.getByRole("button", { name: "Thử lại" })).toBeVisible();
    }).toPass({ timeout: 60_000 });
    // The rest of the screen must stay functional despite the panel error.
    expect(errors).toEqual([]);
  });
});
