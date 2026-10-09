import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync(new URL("../src/components/ArchetypeScreen.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/mau-nen/page.tsx", import.meta.url), "utf8");

test("arc deep-link resolves ?arc=<id> by fetching detail + occurrences directly", () => {
  assert.match(screen, /useSearchParams/);
  assert.match(screen, /searchParams\.get\("arc"\)/);
  assert.match(screen, /searchParams\.get\("from"\)/);
  // Archetype ids need no catalog resolution — the detail endpoints are
  // authoritative (same contract as BacktestScreen ?run=).
  assert.match(screen, /getArchetypeDetail\(id\)/);
  assert.match(screen, /getArchetypeOccurrences\(id, \{ pageSize: 20 \}\)/);
  // A deep-linked archetype forces the gallery tab — the surface that owns
  // the detail modal.
  assert.match(screen, /setActiveSubTab\("gallery"\);\s*\n\s*if \(detailFetchedRef\.current !== id\) void loadDetail\(id\)/);
});

test("from deep-link resolves ?from=<id> into the transitions source selection", () => {
  assert.match(screen, /getTransitionsFrom\(id, 10\)/);
  assert.match(screen, /setActiveSubTab\("transitions"\);\s*\n\s*if \(transFetchedRef\.current !== id\) void loadTransitionsForArc\(id\)/);
});

test("params sync both ways: push on selection, replace when clearing, drop non-canonical ids", () => {
  assert.match(screen, /params\.set\("arc", String\(next\.arc\)\)/);
  assert.match(screen, /params\.delete\("arc"\)/);
  assert.match(screen, /params\.set\("from", String\(next\.from\)\)/);
  assert.match(screen, /params\.delete\("from"\)/);
  assert.match(screen, /router\.push\(url, \{ scroll: false \}\)/);
  assert.match(screen, /router\.replace\(url, \{ scroll: false \}\)/);
  // Non-integer/zero/negative/non-canonical ids are dropped, not faked.
  assert.match(screen, /!Number\.isInteger\(id\) \|\| id <= 0 \|\| String\(id\) !== arcParam/);
  assert.match(screen, /!Number\.isInteger\(id\) \|\| id <= 0 \|\| String\(id\) !== fromParam/);
});

test("arc and from are mutually exclusive — the detail modal wins a hand-crafted both-present URL", () => {
  assert.match(
    screen,
    /if \(arcParam != null && fromParam != null\) \{[\s\S]*?updateArchetypeParams\("replace", \{ from: null \}\)/,
  );
  // Click handlers always clear the other param when setting theirs.
  assert.match(screen, /updateArchetypeParams\("push", \{ arc: id, from: null \}\)/);
  assert.match(screen, /updateArchetypeParams\("push", \{ arc: null, from: id \}\)/);
});

test("clicking the entity already named by the URL retries the fetch directly", () => {
  // An unchanged param cannot re-fire the effect — without this a failed
  // detail fetch would be un-retryable (LINK-1 regression lesson).
  assert.match(screen, /if \(arcParam === String\(id\)\) void loadDetail\(id\)/);
  assert.match(screen, /if \(fromParam === String\(id\)\) void loadTransitionsForArc\(id\)/);
  assert.match(screen, /onSelectArchetype=\{handleSelectArchetype\}/);
  assert.match(screen, /onSelectArc=\{handleSelectFromArc\}/);
});

test("a failed entity fetch clears the stale selection", () => {
  // URL names this archetype — keeping a predecessor's detail/transitions
  // next to the error would misattribute it (LINK-1 F3).
  assert.match(screen, /detailFetchedRef\.current = null;\s*\n\s*setDetail\(null\);\s*\n\s*setOccurrences\(\[\]\)/);
  assert.match(screen, /transFetchedRef\.current = null;\s*\n\s*setSelectedArcForTrans\(null\);\s*\n\s*setArcTransitions\(\[\]\)/);
});

test("a missing entity param clears both selections and invalidates in-flight fetches", () => {
  assert.match(screen, /detailRequestRef\.current \+= 1;\s*\n\s*transRequestRef\.current \+= 1;/);
  assert.match(screen, /setDetail\(\(prev\) => \(prev == null \? prev : null\)\)/);
  assert.match(screen, /setSelectedArcForTrans\(\(prev\) => \(prev == null \? prev : null\)\)/);
});

test("matrix reload no longer clears the transitions selection — the URL owns it", () => {
  // A stale reset inside loadMatrix would race the ?from= deep-link fetch that
  // resolves after the matrix response and wipe the freshly loaded selection.
  const loadMatrix = screen.match(/const loadMatrix = useCallback\(async \(\) => \{[\s\S]*?\}, \[selectedSymbol, transTf, transWs\]\);/);
  assert.ok(loadMatrix, "loadMatrix useCallback not found");
  assert.doesNotMatch(loadMatrix[0], /setSelectedArcForTrans|setArcTransitions/);
});

test("stale-request guards protect both entity fetches and the loading flag is always released", () => {
  assert.match(screen, /if \(requestId !== detailRequestRef\.current\) return;/);
  assert.match(screen, /if \(requestId !== transRequestRef\.current\) return;/);
  // finally releases the flag unconditionally — guarding it would strand the
  // spinner when a request is invalidated by a param clear.
  assert.doesNotMatch(screen, /requestId === transRequestRef\.current\) setArcTransLoading\(false\)/);
});

test("switching sub-tabs drops the params owned by other surfaces", () => {
  assert.match(screen, /tab\.key !== "gallery" && arcParam != null/);
  assert.match(screen, /tab\.key !== "transitions" && fromParam != null/);
});

test("the retry button retries the entity fetch for the active deep-link", () => {
  assert.match(screen, /Number\.isInteger\(arcId\) && arcId > 0 && String\(arcId\) === arcParam\) void loadDetail\(arcId\)/);
  assert.match(screen, /Number\.isInteger\(fromId\) && fromId > 0 && String\(fromId\) === fromParam\) void loadTransitionsForArc\(fromId\)/);
});

test("closing the modal clears ?arc instead of setting state directly", () => {
  // The effect owns setDetail(null); the close button only drops the param.
  const modalBlock = screen.match(/<ArchetypeDetailModal[\s\S]*?\/>/);
  assert.ok(modalBlock, "ArchetypeDetailModal block not found");
  assert.match(modalBlock[0], /updateArchetypeParams\("replace", \{ arc: null \}\)/);
  assert.doesNotMatch(modalBlock[0], /setDetail\(null\)/);
});

test("page wraps the screen in Suspense as required for useSearchParams prerendering", () => {
  assert.match(page, /<Suspense/);
  assert.match(page, /<ArchetypeScreen \/>/);
});
