import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseCurrentConditionsResponse,
  type CurrentConditionsResponse,
} from "../src/lib/currentConditions.ts";

const AS_OF_MS = 1_800_000_000_000;

function testedCell(overrides: Record<string, unknown> = {}) {
  return {
    tested: true,
    rawP: 0.01,
    adjustedQValue: 0.04,
    passesDeclaredFdr: true,
    sufficientSample: true,
    nonOverlappingPairs: 12,
    effect: 0.0042,
    ciLower: 0.001,
    ciUpper: 0.008,
    meanPairedDifference: 0.0042,
    ...overrides,
  };
}

function untestedCell(reason = "untested") {
  return { tested: false, reason };
}

function horizonEvidence(overrides: Record<string, unknown> = {}) {
  return { forwardReturn: testedCell(), mfe: testedCell(), mae: untestedCell("insufficient-sample"), ...overrides };
}

function conditionEvidence(overrides: Record<string, unknown> = {}) {
  return { "1": horizonEvidence(), "3": horizonEvidence(), "6": horizonEvidence(), ...overrides };
}

function triggeredCondition(overrides: Record<string, unknown> = {}) {
  return {
    module: "technicalIndicators",
    eventType: "RSI_ENTER_OVERSOLD",
    kind: "triggeredOnBar",
    direction: "bullish",
    eventId: "evt-1",
    formedTimeMs: AS_OF_MS - 3_600_000,
    availableTimeMs: AS_OF_MS,
    context: { trend: "down", volatility: "normal" },
    details: { rsi: 28.4 },
    evidence: conditionEvidence(),
    ...overrides,
  };
}

function stateCondition(overrides: Record<string, unknown> = {}) {
  return {
    module: "technicalIndicators",
    eventType: "RSI_ZONE_OVERSOLD",
    kind: "state",
    direction: "bullish",
    eventId: null,
    formedTimeMs: AS_OF_MS,
    availableTimeMs: AS_OF_MS,
    context: { trend: "down", volatility: "normal" },
    evidence: conditionEvidence(),
    ...overrides,
  };
}

function legCondition(overrides: Record<string, unknown> = {}) {
  return {
    module: "causalSmc",
    eventType: "FIBONACCI_LEG_UP",
    kind: "operativeLeg",
    direction: "neutral",
    eventId: "evt-leg-9",
    formedTimeMs: AS_OF_MS - 20 * 3_600_000,
    availableTimeMs: AS_OF_MS - 20 * 3_600_000,
    context: { trend: "down", volatility: "high" },
    evidence: conditionEvidence(),
    ...overrides,
  };
}

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    timeframe: "4h",
    asOfMs: AS_OF_MS,
    conditions: [triggeredCondition(), stateCondition(), legCondition()],
    evidence: {
      available: true,
      reason: null,
      runId: "run-2026-01-01",
      manifestSha256: "a".repeat(64),
      specSha256: "b".repeat(64),
      cutoffMs: AS_OF_MS - 4 * 14_400_000,
      evidenceAgeBars: 4,
    },
    conflicts: [
      { horizon: 1, metric: "forwardReturn", bullish: ["technicalIndicators:RSI_ENTER_OVERSOLD"], bearish: ["candlePatterns:EVENING_STAR"] },
    ],
    warnings: ["fibonacci anchor predates the analysis window"],
    unavailableModules: [{ module: "causalSmc", reason: "DecisionEvidenceSha256 mismatch" }],
    generatedAtMs: AS_OF_MS + 5_000,
    ...overrides,
  };
}

test("parses a well-formed §3 envelope end to end", () => {
  const parsed: CurrentConditionsResponse = parseCurrentConditionsResponse(envelope());
  assert.equal(parsed.timeframe, "4h");
  assert.equal(parsed.asOfMs, AS_OF_MS);
  assert.equal(parsed.generatedAtMs, AS_OF_MS + 5_000);
  assert.equal(parsed.conditions.length, 3);
  assert.equal(parsed.conditions[0].kind, "triggeredOnBar");
  assert.equal(parsed.conditions[0].evidence?.["1"]?.forwardReturn.tested, true);
  assert.equal(parsed.conditions[1].eventId, null);
  assert.equal(parsed.conditions[1].details, null);
  assert.equal(parsed.evidence.available, true);
  assert.equal(parsed.evidence.evidenceAgeBars, 4);
  assert.equal(parsed.conflicts[0].bullish[0], "technicalIndicators:RSI_ENTER_OVERSOLD");
  assert.equal(parsed.warnings[0], "fibonacci anchor predates the analysis window");
  assert.equal(parsed.unavailableModules[0].module, "causalSmc");
});

test("untested cells parse and keep their reason verbatim", () => {
  const parsed = parseCurrentConditionsResponse(envelope());
  const cell = parsed.conditions[0].evidence?.["1"]?.mae;
  assert.equal(cell?.tested, false);
  assert.equal(cell?.tested === false ? cell.reason : null, "insufficient-sample");

  const noEvidence = envelope({ conditions: [triggeredCondition({ evidence: null })] });
  assert.equal(parseCurrentConditionsResponse(noEvidence).conditions[0].evidence, null);
  const missingEvidence = envelope({ conditions: [triggeredCondition()] });
  delete (missingEvidence.conditions[0] as Record<string, unknown>).evidence;
  assert.equal(parseCurrentConditionsResponse(missingEvidence).conditions[0].evidence, null);
});

test("empty context object parses to null fields (pre-window events)", () => {
  const payload = envelope({ conditions: [legCondition({ context: {} })] });
  const parsed = parseCurrentConditionsResponse(payload);
  assert.equal(parsed.conditions[0].context.trend, null);
  assert.equal(parsed.conditions[0].context.volatility, null);
  // Non-string context members still fail closed.
  const bad = envelope({ conditions: [legCondition({ context: { trend: 7 } })] });
  assert.throws(() => parseCurrentConditionsResponse(bad), /context\.trend/);
});

test("empty conditions array is a valid payload (empty state, not an error)", () => {
  const parsed = parseCurrentConditionsResponse(envelope({ conditions: [] }));
  assert.deepEqual(parsed.conditions, []);
});

test("evidence.available=false with reason parses; metadata may be null", () => {
  const parsed = parseCurrentConditionsResponse(envelope({
    evidence: {
      available: false,
      reason: "no verified bundle for timeframe",
      runId: null,
      manifestSha256: null,
      specSha256: null,
      cutoffMs: null,
      evidenceAgeBars: null,
    },
    conflicts: [],
  }));
  assert.equal(parsed.evidence.available, false);
  assert.equal(parsed.evidence.reason, "no verified bundle for timeframe");
  assert.equal(parsed.evidence.manifestSha256, null);
});

test("unavailableModules may be absent (defaults to empty list)", () => {
  const payload = envelope();
  delete (payload as Record<string, unknown>).unavailableModules;
  assert.deepEqual(parseCurrentConditionsResponse(payload).unavailableModules, []);
});

test("missing required fields throw with field names", () => {
  const noEventType = envelope();
  delete (noEventType.conditions[0] as Record<string, unknown>).eventType;
  assert.throws(() => parseCurrentConditionsResponse(noEventType), /eventType/);

  const noQ = envelope();
  (noQ.conditions[0] as { evidence: Record<string, { forwardReturn: Record<string, unknown> }> }).evidence["1"].forwardReturn = { ...testedCell() };
  delete (noQ.conditions[0] as { evidence: Record<string, { forwardReturn: Record<string, unknown> }> }).evidence["1"].forwardReturn.adjustedQValue;
  assert.throws(() => parseCurrentConditionsResponse(noQ), /adjustedQValue/);

  const noEvidenceBlock = envelope();
  delete (noEvidenceBlock as Record<string, unknown>).evidence;
  assert.throws(() => parseCurrentConditionsResponse(noEvidenceBlock), /evidence/);

  const noCutoff = envelope();
  delete (noCutoff.evidence as Record<string, unknown>).cutoffMs;
  assert.throws(() => parseCurrentConditionsResponse(noCutoff), /cutoffMs/);
});

test("contract invariants fail closed", () => {
  assert.throws(() => parseCurrentConditionsResponse(envelope({ timeframe: "15m" })), /timeframe/);
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [triggeredCondition({ availableTimeMs: AS_OF_MS - 1 })] })),
    /availableTimeMs must equal asOfMs/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [stateCondition({ eventId: "evt-x" })] })),
    /eventId must be null for state/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [legCondition({ eventId: null })] })),
    /eventId must be a non-empty string/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [legCondition({ availableTimeMs: AS_OF_MS + 1 })] })),
    /must not be after asOfMs/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [triggeredCondition({ formedTimeMs: AS_OF_MS + 1 })] })),
    /formedTimeMs/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conditions: [triggeredCondition(), triggeredCondition()] })),
    /duplicate condition identity/,
  );
});

test("malformed evidence cells and summary fail closed", () => {
  const badHorizon = envelope({ conditions: [triggeredCondition({ evidence: { "2": horizonEvidence() } })] });
  assert.throws(() => parseCurrentConditionsResponse(badHorizon), /unsupported horizon key "2"/);

  const missingMetric = envelope({ conditions: [triggeredCondition({ evidence: { "1": { forwardReturn: testedCell(), mfe: testedCell() } } })] });
  assert.throws(() => parseCurrentConditionsResponse(missingMetric), /missing required field\(s\): mae/);

  const reversedCi = envelope({ conditions: [triggeredCondition({ evidence: { "1": horizonEvidence({ forwardReturn: testedCell({ ciLower: 0.02, ciUpper: 0.01 }) }) } })] });
  assert.throws(() => parseCurrentConditionsResponse(reversedCi), /CI bounds are reversed/);

  const reasonMissing = envelope();
  (reasonMissing.conditions[0] as { evidence: Record<string, { mae: Record<string, unknown> }> }).evidence["1"].mae = { tested: false };
  assert.throws(() => parseCurrentConditionsResponse(reasonMissing), /reason/);

  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ evidence: { ...envelope().evidence as object, available: false } })),
    /unavailable evidence must declare a reason/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ evidence: { available: true, reason: "stale", runId: "r", manifestSha256: "a".repeat(64), specSha256: "b".repeat(64), cutoffMs: 1, evidenceAgeBars: 0 } })),
    /available evidence cannot carry a reason/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ evidence: { available: true, reason: null, runId: "r", manifestSha256: "not-a-hash", specSha256: "b".repeat(64), cutoffMs: 1, evidenceAgeBars: 0 } })),
    /SHA-256/,
  );
});

test("conflicts fail closed on bad shape", () => {
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conflicts: [{ horizon: 2, metric: "forwardReturn", bullish: ["a:b"], bearish: ["c:d"] }] })),
    /horizon is unsupported/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conflicts: [{ horizon: 1, metric: "sharpRatio", bullish: ["a:b"], bearish: ["c:d"] }] })),
    /metric is unsupported/,
  );
  assert.throws(
    () => parseCurrentConditionsResponse(envelope({ conflicts: [{ horizon: 1, metric: "forwardReturn", bullish: [], bearish: ["c:d"] }] })),
    /at least 1 entry/,
  );
});

test("current conditions panel keeps required honest copy and contract UX", () => {
  const source = readFileSync(new URL("../src/components/CurrentConditionsPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /Không có điều kiện nào thỏa trên nến đóng gần nhất/);
  assert.match(source, /mới trên nến đóng gần nhất/);
  assert.match(source, /Nghiên cứu cắt tại/);
  assert.match(source, /Nến phân tích \(asOf\)/);
  assert.match(source, /thời điểm nến thị trường được phân tích/);
  assert.match(source, /không phải xác suất/);
  assert.match(source, /không có winner/);
  assert.match(source, /Thử lại/);
  assert.match(source, /aria-labelledby="current-conditions-title"/);
  // Descriptive-only: no trading verbs in the UI copy (negated disclaimers reuse
  // the same wording as the rest of the Evidence Center).
  assert.doesNotMatch(source, /\bBUY\b|\bSELL\b/i);
});
