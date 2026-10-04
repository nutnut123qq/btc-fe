"use client";

import {
  formatFutureHorizon,
  parseDiscoveryDescription,
  type DiscoveredRuleLike,
} from "@/lib/formatRuleDiscovery";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";
import { ruleEvidenceView } from "@/lib/evidencePresentation";
import type { SequenceRule } from "@/lib/types";

type RuleDiscoverySummaryProps = {
  rule: DiscoveredRuleLike;
  className?: string;
};

export function RuleDiscoverySummary({ rule, className = "" }: RuleDiscoverySummaryProps) {
  const parsed = parseDiscoveryDescription(rule.description);
  const futureBars = parsed.futureBars ?? 3;
  const evidence = ruleEvidenceView(rule as SequenceRule);
  const samples = rule.oosSampleCount != null ? String(rule.oosSampleCount) : "—";
  const horizon = formatFutureHorizon(rule.timeframe ?? DEFAULT_TIMEFRAME, futureBars);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="space-y-1">
        <p className={`text-xs font-medium ${evidence.hasOos ? "text-teal-300/90" : "text-amber-300/90"}`}>
          {evidence.hasOos ? "Selection lịch sử + held-out evaluation" : "Mô tả lịch sử · thiếu held-out evidence"}
        </p>
        <p className="text-xs leading-relaxed text-slate-400">
          Khi setup <span className="font-medium text-slate-200">{rule.name}</span> khớp trên một
          nến, hệ thống đã thống kê giá BTC{" "}
          <span className="text-slate-300">{horizon}</span> trong quá khứ.
        </p>
      </div>

      <p className="text-xs text-slate-400">
        Cửa sổ đo lường: <span className="font-mono tabular-nums text-slate-300">{futureBars}</span> nến
        tiếp theo · dead-zone <span className="font-mono tabular-nums text-slate-300">{rule.labelDeadZonePct?.toFixed(2) ?? "chưa khai báo"}%</span> ·
        cost <span className="font-mono tabular-nums text-slate-300">{rule.roundTripCostBps?.toFixed(0) ?? "chưa khai báo"} bps</span>
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-slate-400">
        <span>OOS win <span className="text-slate-200">{evidence.oosWinRate}</span></span>
        <span>CI95 <span className="text-slate-200">{evidence.ci95}</span></span>
        <span>baseline <span className="text-slate-200">{evidence.baselineWinRate}</span></span>
        <span>lift <span className="text-slate-200">{evidence.lift}</span></span>
        <span>net avg <span className="text-slate-200">{evidence.netAverage}</span></span>
        <span>OOS n=<span className="text-slate-200">{samples}</span></span>
      </div>
    </div>
  );
}
