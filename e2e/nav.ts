import { expect, type Page } from "@playwright/test";

// Bottom nav now renders 5 groups; multi-child groups open a chip sub-row.
// Map each tab label to its top-level group label (null = single-child group).
const GROUP_LABEL_BY_TAB: Readonly<Record<string, string | null>> = {
  "Thị trường": null,
  "Tin tức": "Tin tức & AI",
  "AI": "Tin tức & AI",
  "Nghiên cứu": "Nghiên cứu",
  "Mẫu nến": "Nghiên cứu",
  "Rules nến": "Nghiên cứu",
  "Backtest": "Nghiên cứu",
  "Dự đoán": "Mô phỏng",
  "Paper": "Mô phỏng",
  "Nhật ký Paper BTC": "Mô phỏng",
  "Cảnh báo": "Hệ thống",
};

/**
 * Navigate to a bottom-nav tab by its (unchanged) label. For tabs inside a
 * multi-child group, opens the group sub-row first, then clicks the chip.
 */
export async function openMainTab(page: Page, tabLabel: string): Promise<void> {
  if (!(tabLabel in GROUP_LABEL_BY_TAB)) {
    throw new Error(`openMainTab: unknown tab label "${tabLabel}"`);
  }
  const groupLabel = GROUP_LABEL_BY_TAB[tabLabel];
  const navGroups = page.getByTestId("nav-groups");
  if (groupLabel === null) {
    await navGroups.getByRole("button", { name: tabLabel, exact: true }).click();
    return;
  }
  const groupButton = navGroups.getByRole("button", { name: groupLabel, exact: true });
  if ((await groupButton.getAttribute("aria-expanded")) !== "true") {
    await groupButton.click();
  }
  // Single-child groups ("Hệ thống") navigate on click and never render a sub-row.
  // aria-expanded reflects "group contains the active tab" — it only flips
  // after the router commits, so a single sample raced the transition and
  // silently returned early, leaving the test on the group's first child.
  // Wait for the attribute instead (bounded); timeout means single-child.
  try {
    await expect(groupButton).toHaveAttribute("aria-expanded", "true", { timeout: 5_000 });
  } catch {
    return;
  }
  await page
    .getByTestId("nav-sub-row")
    .getByRole("button", { name: tabLabel, exact: true })
    .click();
}
