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

// Groups whose only child is navigated to directly by the group-button click —
// no sub-row ever renders, so the aria-expanded wait below would always burn
// its full 5s timeout before returning.
const SINGLE_CHILD_GROUPS: ReadonlySet<string> = new Set(["Hệ thống"]);

/**
 * Navigate to a bottom-nav tab by its (unchanged) label. For tabs inside a
 * multi-child group, opens the group sub-row first, then clicks the chip.
 */
export async function openMainTab(page: Page, tabLabel: string): Promise<void> {
  if (!(tabLabel in GROUP_LABEL_BY_TAB)) {
    throw new Error(`openMainTab: unknown tab label "${tabLabel}"`);
  }
  const groupLabel = GROUP_LABEL_BY_TAB[tabLabel];
  // Two nav containers exist (post-REDESIGN): desktop `nav-groups` is
  // `hidden lg:flex`, mobile bottom bar `nav-groups-mobile` is `lg:hidden` —
  // exactly one is visible per viewport. Resolve by visibility or mobile
  // tests hang on a click target that can never appear.
  const desktopNav = page.getByTestId("nav-groups");
  const navGroups = (await desktopNav.isVisible())
    ? desktopNav
    : page.getByTestId("nav-groups-mobile");
  if (groupLabel === null) {
    await navGroups.getByRole("button", { name: tabLabel, exact: true }).click();
    return;
  }
  const groupButton = navGroups.getByRole("button", { name: groupLabel, exact: true });
  if ((await groupButton.getAttribute("aria-expanded")) !== "true") {
    await groupButton.click();
  }
  // Single-child groups (SINGLE_CHILD_GROUPS) navigate on the click itself and
  // never render a sub-row — return instead of burning the wait below.
  if (SINGLE_CHILD_GROUPS.has(groupLabel)) return;
  // Multi-child groups: aria-expanded reflects "group contains the active tab" —
  // it only flips after the router commits, so a single sample raced the
  // transition and silently returned early, leaving the test on the group's
  // first child. Wait for the attribute instead (bounded); a timeout means the
  // click did not expand/navigate — bail rather than click a missing chip.
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
