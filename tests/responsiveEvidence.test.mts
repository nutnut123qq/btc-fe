import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const administrationSource = readFileSync(new URL("../src/components/TechnicalEvidenceAdministration.tsx", import.meta.url), "utf8");
const causalAdministrationSource = readFileSync(new URL("../src/components/CausalSmartMoneyAdministration.tsx", import.meta.url), "utf8");
const profilesSource = readFileSync(new URL("../src/components/EvidenceProfilesPanel.tsx", import.meta.url), "utf8");
const evidenceSource = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");

test("evidence administration constrains grid cards and unbroken lineage values on mobile", () => {
  assert.match(administrationSource, /<section className="min-w-0 max-w-full overflow-hidden/);
  assert.match(administrationSource, /<article key=\{timeframe\} className="min-w-0 max-w-full overflow-hidden/);
  assert.match(administrationSource, /break-all text-right/);
  assert.match(administrationSource, /max-w-full truncate font-mono/);
});

test("causal SMC administration and evidence profiles contain mobile min-content widths", () => {
  assert.match(causalAdministrationSource, /<section className="min-w-0 max-w-full overflow-hidden/);
  assert.match(causalAdministrationSource, /<article key=\{timeframe\} className="min-w-0 max-w-full overflow-hidden/);
  assert.match(causalAdministrationSource, /\[overflow-wrap:anywhere\]/);
  assert.match(profilesSource, /<section className="min-w-0 max-w-full overflow-hidden/);
  assert.match(profilesSource, /max-w-\[16rem\]/);
  assert.match(profilesSource, /min-w-0 max-w-full overflow-hidden/);
});

test("pipeline coverage cards cannot impose their min-content width on the document", () => {
  assert.match(evidenceSource, /<section className="min-w-0 max-w-full overflow-hidden[^\n]+aria-label="Trạng thái pipeline evidence kỹ thuật"/);
  assert.match(evidenceSource, /<article key=\{row\.timeframe\} className="min-w-0 max-w-full overflow-hidden/);
  assert.match(evidenceSource, /\[overflow-wrap:anywhere\]/);
  assert.match(evidenceSource, /max-w-full truncate font-mono/);
});
