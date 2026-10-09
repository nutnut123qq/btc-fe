import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel = readFileSync(new URL("../src/components/CurrentConditionsPanel.tsx", import.meta.url), "utf8");
const screen = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../e2e/nav.ts", import.meta.url), "utf8");

// SWEEP-1 S1 — review-LOW: a causalSmc activeZone whose decision candle predates
// the analysis window carries details.decisionPredatesWindow === true (emitted
// by ai/current_technical_conditions.py). Before this fix the caveat only lived
// inside the collapsed "Chi tiết detector" JSON and the warnings strip.
test("pre-window zones render an inline badge next to kind/direction badges", () => {
  // Defensive read on the free-form details record — the strict parser keeps
  // details verbatim, so only an explicit true flags the badge.
  assert.match(panel, /condition\.details\?\.decisionPredatesWindow === true/);
  assert.match(panel, /quyết định trước cửa sổ/);
  // Amber = caveat, consistent with the "Chưa kiểm chứng" family — a pre-window
  // zone's mitigation before firstOpenTimeMs is unobservable.
  assert.match(panel, /decisionPredatesWindow === true && <span title="[^"]*firstOpenTimeMs[^"]*" className="[^"]*bg-amber-950\/40[^"]*text-amber-300/);
});

// SWEEP-1 S2 — documented nit: the Dossier list header rendered
// {visibleItems.length} which is 0 while the catalog is still loading — a false
// claim. Pending now shows "—" like the overview strip counters (M2 pattern).
test("dossier counter shows an em-dash while the catalog is pending", () => {
  assert.match(screen, /\{catalog == null \? "—" : visibleItems\.length\}/);
  assert.doesNotMatch(screen, /\{visibleItems\.length\}<\/span>/);
});

// SWEEP-1 S3 — ARC-1 cold-check m1: single-child nav groups navigate on the
// group-button click and never render a sub-row, so the bounded aria-expanded
// wait always timed out and cost the suite a flat 5s per call.
test("openMainTab returns early for single-child groups instead of waiting", () => {
  assert.match(nav, /const SINGLE_CHILD_GROUPS: ReadonlySet<string> = new Set\(\["Hệ thống"\]\)/);
  assert.match(nav, /if \(SINGLE_CHILD_GROUPS\.has\(groupLabel\)\) return;/);
  // The early return sits between the group click and the bounded wait.
  assert.match(
    nav,
    /await groupButton\.click\(\);\s*\}[\s\S]*?SINGLE_CHILD_GROUPS\.has\(groupLabel\)\) return;[\s\S]*?toHaveAttribute\("aria-expanded", "true", \{ timeout: 5_000 \}\)/,
  );
});
