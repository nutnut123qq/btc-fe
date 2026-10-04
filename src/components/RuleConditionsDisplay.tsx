"use client";

import { Activity, BarChart3, CandlestickChart, Layers, TrendingUp, Zap } from "lucide-react";
import {
  formatRuleCondition,
  parseRuleConditions,
  type SequenceRuleCondition,
} from "@/lib/formatRuleCondition";

const KIND_ICON: Record<string, typeof Activity> = {
  volume: Activity,
  body: BarChart3,
  range: Layers,
  shadow: CandlestickChart,
  close: TrendingUp,
  sequence: Zap,
  other: Layers,
};

function ConditionRow({ condition, index }: { condition: SequenceRuleCondition; index: number }) {
  const { title, detail, kind } = formatRuleCondition(condition);
  const Icon = KIND_ICON[kind] ?? Layers;

  return (
    <div className="py-2" role="listitem">
      <div className="flex items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[11px] tabular-nums text-slate-400">
          {index + 1}
        </span>
        <Icon className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-slate-300">{title}</div>
          <p className="mt-0.5 text-sm leading-snug text-slate-200">{detail}</p>
        </div>
      </div>
    </div>
  );
}

type RuleConditionsDisplayProps = {
  conditionsJson?: string | null;
  conditions?: SequenceRuleCondition[];
  /** Hiển thị dạng chip gọn (trên card thu gọn) */
  compact?: boolean;
  className?: string;
};

export function RuleConditionsDisplay({
  conditionsJson,
  conditions: conditionsProp,
  compact = false,
  className = "",
}: RuleConditionsDisplayProps) {
  const conditions = conditionsProp ?? parseRuleConditions(conditionsJson);
  if (conditions.length === 0) return null;

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {conditions.map((c, i) => {
          const { detail } = formatRuleCondition(c);
          const short =
            detail.length > 48 ? `${detail.slice(0, 45)}…` : detail;
          return (
            <span
              key={i}
              className="rounded border border-slate-800 px-2 py-0.5 text-xs text-slate-300"
              title={detail}
            >
              {short}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={className} role="list" aria-label="Điều kiện rule">
      <p className="text-xs font-medium text-slate-400">
        Điều kiện (tất cả phải đúng cùng lúc)
      </p>
      <div className="mt-1 divide-y divide-slate-800/60 border-y border-slate-800/60">
        {conditions.map((c, i) => (
          <ConditionRow key={i} condition={c} index={i} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Khi khớp, hệ thống so giá sau các nến tiếp theo (theo mô tả rule) với lịch sử đã quét.
      </p>
    </div>
  );
}
