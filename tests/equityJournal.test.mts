import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseForecastJournal,
  parseLlmJudgeOutput,
  parseLlmRun,
  parseLlmRuns,
  quantReferenceFor,
  scoringConclusive,
} from "../src/lib/equityJournal.ts";
import { parseEquityBaseRates } from "../src/lib/equity.ts";

const SIGNAL = 1_760_544_000_000;
const DAY = 86_400_000;

const record = (overrides: Record<string, unknown> = {}) => ({
  forecastId: `quant-knn/BID/tb-p5-s4-h20/${SIGNAL}`,
  source: "quant-knn",
  configId: "tb-p5-s4-h20",
  targetPct: 0.05,
  stopPct: 0.04,
  horizonSessions: 20,
  signalBarOpenTimeMs: SIGNAL,
  availableTimeMs: SIGNAL + DAY,
  createdAtUtc: "2026-10-16T09:00:00Z",
  probTargetFirst: 0.41,
  probStopFirst: 0.38,
  abstained: false,
  abstainReason: null,
  validated: false,
  methodVersion: "equity-knn-v1",
  modelId: null,
  promptVersion: null,
  llmRunId: null,
  outcome: null,
  ...overrides,
});

const journal = (items: unknown[], scoring: unknown[] = []) => ({
  contractVersion: "equity-forecast-journal-v1",
  symbol: "BID",
  items,
  scoring,
});

test("journal: pending outcome stays null, resolved outcome parses as fractions", () => {
  const resolved = record({
    forecastId: "quant-knn/BID/tb-p5-s4-h20/old",
    outcome: { entryBarOpenTimeMs: SIGNAL + DAY, entryPrice: 41_000, label: "stop-first", returnNet: -0.0425, resolvedBarOpenTimeMs: SIGNAL + 5 * DAY, resolvedAtUtc: "2026-10-21T08:00:00Z" },
  });
  const parsed = parseForecastJournal(journal([record(), resolved]), "BID");
  assert.equal(parsed.items[0].outcome, null);
  assert.equal(parsed.items[1].outcome?.label, "stop-first");
  assert.equal(parsed.items[1].outcome?.returnNet, -0.0425);
  assert.equal(parsed.items[0].targetPct, 0.05);
});

test("journal: LLM rows can never be validated; abstained rows carry no probabilities; chronology enforced", () => {
  const llm = record({ forecastId: "llm-judge/BID/x", source: "llm-judge", llmRunId: 7, validated: false, modelId: "judge" });
  assert.equal(parseForecastJournal(journal([llm]), "BID").items[0].llmRunId, "7");
  assert.throws(() => parseForecastJournal(journal([{ ...llm, validated: true }]), "BID"), /never validated/);
  assert.throws(() => parseForecastJournal(journal([record({ abstained: true })]), "BID"), /abstained forecasts carry no probabilities/);
  assert.equal(parseForecastJournal(journal([record({ abstained: true, probTargetFirst: null, probStopFirst: null, abstainReason: "gate-failed" })]), "BID").items[0].abstained, true);
  assert.throws(
    () => parseForecastJournal(journal([record({ outcome: { entryBarOpenTimeMs: SIGNAL, entryPrice: 1, label: "timeout", returnNet: 0, resolvedBarOpenTimeMs: SIGNAL, resolvedAtUtc: "x" } })]), "BID"),
    /after the signal bar/,
  );
  assert.throws(() => parseForecastJournal(journal([record({ targetPct: 5 })]), "BID"), /positive fraction/);
  assert.throws(() => parseForecastJournal(journal([record({ source: "gpt" })]), "BID"), /source/);
  assert.throws(() => parseForecastJournal({ ...journal([]), symbol: "MBB" }, "BID"), /must be "BID"/);
});

test("journal scoring: only ok is conclusive; insufficient-sample is not; absent scoring degrades", () => {
  const scoring = [
    { configId: "tb-p5-s4-h20", status: "insufficient-sample", pairedN: 12, nEffective: 3, brierQuant: 0.2, brierLlm: 0.22, brierDiff: 0.02, coverageQuant: 0.9, coverageLlm: 0.5 },
    { configId: "tb-p10-s6-h60", status: "ok", pairedN: 400, nEffective: 34, brierQuant: 0.21, brierLlm: 0.23, brierDiff: 0.02, coverageQuant: 0.95, coverageLlm: 0.6 },
    { configId: "x", status: "no-data", pairedN: 0, nEffective: 0, brierQuant: null, brierLlm: null, brierDiff: null, coverageQuant: null, coverageLlm: null },
  ];
  const parsed = parseForecastJournal(journal([], scoring), "BID");
  assert.equal(scoringConclusive(parsed.scoring[0]), false);
  assert.equal(scoringConclusive(parsed.scoring[1]), true);
  assert.equal(scoringConclusive(parsed.scoring[2]), false);
  const noScoring = journal([]) as Record<string, unknown>;
  delete noScoring.scoring;
  assert.deepEqual(parseForecastJournal(noScoring, "BID").scoring, []);
});

const judge = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: "equity-llm-judge-v1",
  symbol: "BID",
  signalBarOpenTimeMs: SIGNAL,
  evidenceStatus: "sourced",
  scenarios: [{ name: "Hồi phục", direction: "up", description: "NIM cải thiện", sourceIds: ["s1"] }],
  warnings: [{ text: "Rủi ro nợ xấu", sourceIds: ["s2"] }],
  veto: { active: true, reason: "Sắp GDKHQ", sourceIds: ["s1"] },
  sources: [
    { id: "s1", url: "https://example.com/a", title: "Tin A", publishedAt: "2026-10-15" },
    { id: "s2", url: "javascript:alert(1)", title: "Tin B", publishedAt: null },
  ],
  adjustedForecasts: [{ configId: "tb-p5-s4-h20", probTargetFirst: 0.35, probStopFirst: 0.45, rationale: "Thận trọng", sourceIds: ["s1"] }],
  ...overrides,
});

test("LLM judge output: unknown sourceIds rejected, unsafe links dropped, probabilities bounded, veto needs a reason", () => {
  const parsed = parseLlmJudgeOutput(judge(), "BID");
  assert.equal(parsed.sources[0].url, "https://example.com/a");
  assert.equal(parsed.sources[1].url, null);
  assert.equal(parsed.veto.active, true);
  assert.throws(() => parseLlmJudgeOutput(judge({ warnings: [{ text: "x", sourceIds: ["nope"] }] }), "BID"), /unknown source/);
  assert.throws(
    () => parseLlmJudgeOutput(judge({ adjustedForecasts: [{ configId: "c", probTargetFirst: 0.7, probStopFirst: 0.6, rationale: "r" }] }), "BID"),
    /<= 1/,
  );
  assert.throws(() => parseLlmJudgeOutput(judge({ veto: { active: true, reason: null } }), "BID"), /veto\.reason/);
  assert.equal(parseLlmJudgeOutput(judge({ veto: { active: false, reason: null, sourceIds: [] } }), "BID").veto.active, false);
  assert.throws(() => parseLlmJudgeOutput(judge({ schemaVersion: "v2" }), "BID"), /schemaVersion/);
  assert.throws(() => parseLlmJudgeOutput(judge(), "MBB"), /must be "MBB"/);
});

const run = (overrides: Record<string, unknown> = {}) => ({
  runId: "run-1",
  symbol: "BID",
  signalBarOpenTimeMs: SIGNAL,
  createdAtUtc: "2026-10-16T09:00:00Z",
  status: "succeeded",
  reason: null,
  researchModel: "research-model",
  judgeModel: "judge-model",
  promptVersion: "equity-llm-v1",
  schemaVersion: "equity-llm-judge-v1",
  output: judge(),
  durationMs: 42_000,
  ...overrides,
});

test("LLM runs: succeeded parses output; failed/unavailable never render output; symbol/bar mismatch rejected", () => {
  const runs = parseLlmRuns({
    items: [run(), run({ runId: "run-2", status: "unavailable", reason: "LLM_UNAVAILABLE", output: null }), run({ runId: "run-3", status: "failed", reason: "timeout", output: judge() })],
  }, "BID");
  assert.equal(runs[0].output?.adjustedForecasts[0].probTargetFirst, 0.35);
  assert.equal(runs[1].output, null);
  assert.equal(runs[2].output, null);
  assert.throws(() => parseLlmRun(run({ symbol: "MBB" }), "BID"), /must be "BID"/);
  assert.throws(() => parseLlmRun(run({ output: judge({ signalBarOpenTimeMs: SIGNAL - DAY }) }), "BID"), /must match the run/);
  assert.throws(() => parseLlmRun(run({ status: "running" }), "BID"), /status/);
});

test("quant beside an LLM run only for the same signal bar (base-rates, else journal, else none)", () => {
  const baseRates = parseEquityBaseRates({
    contractVersion: "equity-base-rates-v1", symbol: "BID", timeframe: "1d", status: "abstained", reasons: ["gate-not-passed"],
    artifact: { generatedAtUtc: "2026-10-16T09:00:00Z", dataAsOfOpenTimeMs: SIGNAL, priceBasis: "adjusted", methodVersion: "equity-knn-v1", protocolVersion: "p1", datasetSha256: null },
    configs: [{
      configId: "tb-p5-s4-h20", targetPct: 0.05, stopPct: 0.04, horizonSessions: 20, abstained: false, abstainReasons: [], decisionUse: null,
      research: { label: "unvalidated", signalBarOpenTimeMs: SIGNAL, probTargetFirst: 0.37, probStopFirst: 0.53, probTimeout: 0.1 },
      validation: { gatePassed: false },
    }],
  }, "BID");
  const olderBar = SIGNAL - DAY;
  const journalBody = parseForecastJournal(journal([record({ forecastId: "old", signalBarOpenTimeMs: olderBar, availableTimeMs: olderBar + DAY, probTargetFirst: 0.44, probStopFirst: 0.36 })]), "BID");

  assert.deepEqual(quantReferenceFor("tb-p5-s4-h20", SIGNAL, baseRates, journalBody), { probTargetFirst: 0.37, validated: false, source: "base-rates" });
  // An older run never pairs with today's base-rates — it uses the journal record for its own bar.
  assert.deepEqual(quantReferenceFor("tb-p5-s4-h20", olderBar, baseRates, journalBody), { probTargetFirst: 0.44, validated: false, source: "journal" });
  // No same-bar quant forecast at all → null ("—").
  assert.equal(quantReferenceFor("tb-p5-s4-h20", SIGNAL - 5 * DAY, baseRates, journalBody), null);
  assert.equal(quantReferenceFor("tb-p10-s6-h60", SIGNAL, baseRates, journalBody), null);
  assert.equal(quantReferenceFor("tb-p5-s4-h20", SIGNAL, null, null), null);
});

const screen = readFileSync(new URL("../src/components/EquityScreen.tsx", import.meta.url), "utf8");
const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const panels = readFileSync(new URL("../src/components/EquityJournalPanels.tsx", import.meta.url), "utf8");

test("in-app LLM is disabled: no create control, no POST, old runs stay readable; veto never reaches the decision card", () => {
  // EQX v2 §B — nothing in the UI may call POST /llm-runs (backend answers 503 LLM_DISABLED).
  assert.doesNotMatch(screen, /createLlmRun|createEquityLlmRun|onCreate/);
  assert.doesNotMatch(apiSource, /llm-runs"\)\}`, \{ method: "POST"/);
  assert.doesNotMatch(apiSource, /createEquityLlmRun/);
  assert.doesNotMatch(panels, /Tạo phân tích LLM|Sparkles|onCreate/);
  assert.match(panels, /Lớp LLM trong app đã ngừng — nghiên cứu được thực hiện qua session \(skill investment-research\)/);
  // Old runs are still fetched (GET) and rendered read-only.
  assert.match(apiSource, /equityNewPath\(symbol, "llm-runs"\)\}\?\$\{params\}`/);
  assert.match(screen, /<LlmRunsPanel symbol=\{symbol\} state=\{llmRuns\}/);
  assert.doesNotMatch(screen, /veto/);
  // The dossier fetch burned "expensive" quota on every load — removed (EQX-C3).
  assert.doesNotMatch(screen, /dossier/i);
  assert.match(panels, /rel="noopener noreferrer nofollow"/);
  assert.match(panels, /chỉ là cảnh báo/);
});

test("save/lock cannot resurrect personal data; shared cash and research notes are admin-only", () => {
  // Save applies only when current and a key still exists; position UI renders only while unlocked.
  assert.match(screen, /if \(!req\.isCurrent\(\) \|\| !getSessionKey\("admin"\)\) return;\s*applyPosition\(saved\)/);
  assert.match(screen, /!positionLoading && adminUnlocked && position && \(/);
  assert.match(screen, /\{adminUnlocked && \(\s*<>\s*<div className="space-y-2">\s*\{lotDrafts\.map/);
  // Shared pool goes through the mutation-contract gate; research notes never fetched without a key.
  assert.match(apiSource, /adminFetch\(`\$\{API_BASE\}\/api\/equities\/cash`/);
  assert.match(screen, /const loadResearchNotes = useCallback\(async \(\) => \{\s*const req = researchNotesRequest\(\);\s*if \(!getSessionKey\("admin"\)\) \{\s*setResearchNotes\(\{ kind: "locked" \}\);/);
  // With the shared pool, the position body never carries availableCashVnd (it would overwrite the pool).
  assert.match(screen, /mode: "shared-pool"; budget: string/);
  assert.match(screen, /extra = \{ buyBudgetVnd: budget\.value \}/);
});
