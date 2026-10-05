import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const screen = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/nghien-cuu/page.tsx", import.meta.url), "utf8");

test("overview counters never assert a numeric zero while catalog or observations are absent", () => {
  // Pending/failed sources render a neutral "—"; a real 0 is only shown once
  // the response exists. `?? 0` fallbacks would fabricate "0 artifact" claims.
  assert.match(screen, /\{catalog == null \? "—" : catalog\.items\.length\}/);
  assert.match(screen, /\{catalog == null \? "—" : catalog\.items\.filter\(\(item\) => item\.integrityVerified\)\.length\}/);
  assert.match(screen, /\{observations == null \? "—" : observations\.items\.length\}/);
  assert.doesNotMatch(screen, /catalog\?\.items\.length \?\? 0/);
  assert.doesNotMatch(screen, /observations\?\.items\.length \?\? 0/);
});

test("dossier deep-link resolves ?dossier=<id> through the catalog selectArtifact pipeline", () => {
  assert.match(screen, /useSearchParams/);
  assert.match(screen, /searchParams\.get\("dossier"\)/);
  // Resolution only happens against the real catalog items — no fake selection.
  assert.match(screen, /catalog\.items\.find\(\(entry\) => entry\.id === dossierParam\)/);
  assert.match(screen, /setSection\(item\.kind\)/);
  assert.match(screen, /void selectArtifact\(item\)/);
});

test("dossier param syncs both ways: push on user selection, replace when clearing, drop unknown ids", () => {
  assert.match(screen, /params\.set\("dossier", id\)/);
  assert.match(screen, /params\.delete\("dossier"\)/);
  assert.match(screen, /router\.push\(url, \{ scroll: false \}\)/);
  assert.match(screen, /router\.replace\(url, \{ scroll: false \}\)/);
  // Unknown artifact id → clear the param instead of pretending a selection.
  assert.match(screen, /if \(!item\) \{\s*\n\s*updateDossierParam\(null, "replace"\)/);
  // URL is the single source of truth: card select only pushes the param, the
  // effect owns selectArtifact — avoids a stale-param render fighting the selection.
  assert.match(screen, /onSelect=\{\(\) => updateDossierParam\(item\.id, "push"\)\}/);
  assert.match(screen, /void selectArtifact\(item\)/);
  // Tab switch clears the param via replace (no extra entry); selection clearing
  // happens in the effect once the param actually resolves.
  assert.match(screen, /setSection\(item\.key\); updateDossierParam\(null, "replace"\); \}\}/);
});

test("page wraps the screen in Suspense as required for useSearchParams prerendering", () => {
  assert.match(page, /<Suspense/);
  assert.match(page, /<ResearchEvidenceScreen \/>/);
});
