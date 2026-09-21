import assert from "node:assert/strict";
import test from "node:test";
import { alertEvidenceView, formatWilson95, ruleEvidenceView } from "../src/lib/evidencePresentation.ts";
import type { AlertItem, SequenceRule } from "../src/lib/types.ts";
import { parseDiscoveryDescription } from "../src/lib/formatRuleDiscovery.ts";

const baseRule: SequenceRule = {
  id: 1, name: "rule", description: "", symbol: "BTCUSDT", timeframe: "4h",
  requiredBars: 10, isEnabled: false, cooldownMinutes: 60, conditionsJson: "[]",
  action: "ALERT", priority: 0, createdAtUtc: "2026-09-21T00:00:00Z",
};

test("rule evidence fails closed when OOS fields are absent", () => {
  const view = ruleEvidenceView(baseRule);
  assert.equal(view.hasOos, false);
  assert.equal(view.oosWinRate, "Chưa có bằng chứng");
  assert.equal(formatWilson95(baseRule), "Chưa có CI");
});

test("rule evidence formats OOS baseline lift and Wilson interval without promotion", () => {
  const view = ruleEvidenceView({
    ...baseRule, capabilityState: "experimental", oosSampleCount: 80,
    oosWinRate: .56, baselineWinRate: .52, oosLift: .04,
    oosWinRateCi95Low: .45, oosWinRateCi95High: .66, oosNetAvgReturnPct: .12,
  });
  assert.equal(view.hasOos, true);
  assert.equal(view.capability, "experimental");
  assert.equal(view.lift, "+4.0 điểm %");
  assert.equal(view.ci95, "45.0–66.0%");
});

test("alerts default to unknown evidence and expose at-most-once failures", () => {
  const base: AlertItem = {
    id: "a", userId: "default", type: "sequence_rule", title: "x", message: "x",
    priceSnapshot: null, createdAt: "2026-09-21T00:00:00Z", isRead: false,
    sourceKey: null, archivedAtUtc: null,
  };
  assert.equal(alertEvidenceView(base).kindLabel, "Chưa có phân loại evidence");
  assert.equal(alertEvidenceView({ ...base, evidenceKind: "observed-event", deliveryStatus: "failed-at-most-once" }).deliveryLabel,
    "Gửi ngoài thất bại · không tự retry");
});

test("rule description parser accepts the versioned v2 horizon", () => {
  assert.equal(parseDiscoveryDescription("rule-discovery-oos-v2: setup; future=1 bars; non-overlapping outcomes").futureBars, 1);
});
