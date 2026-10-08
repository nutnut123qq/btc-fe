import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync(new URL("../src/components/BacktestScreen.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/backtest/page.tsx", import.meta.url), "utf8");

test("run deep-link resolves ?run=<id> by fetching the detail endpoint directly", () => {
  assert.match(screen, /useSearchParams/);
  assert.match(screen, /searchParams\.get\("run"\)/);
  // Run ids need no list/catalog resolution — the detail endpoint is authoritative.
  assert.match(screen, /getBacktestRunDetail\(id, includeLegacy\)/);
  // A deep-linked run forces the ml tab (the only tab with run selection).
  assert.match(screen, /setActiveTab\("ml"\);\s*\n\s*void loadDetail\(id\)/);
});

test("run param syncs both ways: push on selection, replace when clearing, drop non-canonical ids", () => {
  assert.match(screen, /params\.set\("run", String\(id\)\)/);
  assert.match(screen, /params\.delete\("run"\)/);
  assert.match(screen, /router\.push\(url, \{ scroll: false \}\)/);
  assert.match(screen, /router\.replace\(url, \{ scroll: false \}\)/);
  // Non-integer/zero/negative/non-canonical ids → drop the param instead of
  // faking a selection.
  assert.match(screen, /!Number\.isInteger\(id\) \|\| id <= 0 \|\| String\(id\) !== runParam/);
  // URL is the single source of truth: list clicks push the param, the effect
  // owns loadDetail — except clicking the run already named by the URL, which
  // retries loadDetail directly (the param can't re-fire an unchanged effect,
  // so a failed fetch would otherwise be un-retryable).
  assert.match(screen, /onClick=\{\(\) => \(runParam === String\(r\.id\) \? void loadDetail\(r\.id\) : updateRunParam\(r\.id, "push"\)\)\}/);
  assert.doesNotMatch(screen, /onClick=\{\(\) => void loadDetail/);
});

test("a failed detail fetch clears the stale selection and never strands the loading flag", () => {
  // Error path: drop the old detail (URL names a different run — showing its
  // predecessor next to the error would misattribute it).
  assert.match(screen, /setSelected\(null\);\s*\n\s*setError\(e instanceof Error/);
  // setLoading(false) is unconditional in finally: a fetch invalidated by
  // Back/param-clear still releases the flag — guarding it would strand
  // the loading state forever.
  assert.doesNotMatch(screen, /requestId === detailRequestRef\.current\) setLoading\(false\)/);
});

test("missing run param clears selection and invalidates in-flight detail fetches", () => {
  assert.match(screen, /if \(runParam == null\) \{\s*\n\s*fetchedRef\.current = null;\s*\n\s*detailRequestRef\.current \+= 1;\s*\n\s*if \(selected != null\) setSelected\(null\)/);
});

test("switching to the ensemble tab clears the run param (no selection context there)", () => {
  assert.match(screen, /setActiveTab\("ensemble"\); updateRunParam\(null, "replace"\)/);
});

test("list reloads no longer clear the selection — the URL owns selection lifecycle", () => {
  // A stale setSelected(null) inside loadRuns would race a deep-link fetch that
  // resolves after the list response and wipe the freshly loaded detail.
  const loadRuns = screen.match(/const loadRuns = useCallback\(async \(\) => \{[\s\S]*?\}, \[selectedSymbol, includeLegacy\]\);/);
  assert.ok(loadRuns, "loadRuns useCallback not found");
  assert.doesNotMatch(loadRuns[0], /setSelected/);
});

test("page wraps the screen in Suspense as required for useSearchParams prerendering", () => {
  assert.match(page, /<Suspense/);
  assert.match(page, /<BacktestScreen \/>/);
});
