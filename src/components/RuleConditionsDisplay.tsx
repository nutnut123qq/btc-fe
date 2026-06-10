"use client";

import { Activity, BarChart3, CandlestickChart, Layers, TrendingUp, Zap } from "lucide-react";
import {
  formatRuleCondition,
  parseRuleConditions,
  type SequenceRuleCondition,
} from "@/lib/formatRuleCondition";

const KIND_STYLE: Record<
  string,
  { border: string; bg: string; icon: string; Icon: typeof Activity }
> = {
  volume: {
    border: "border-violet-900/50",
    bg: "bg-violet-950/30",
    icon: "text-violet-400",
    Icon: Activity,
  },
  body: {
    border: "border-amber-900/50",
    bg: "bg-amber-950/30",
    icon: "text-amber-400",
    Icon: BarChart3,
  },
  range: {
    border: "border-cyan-900/50",
    bg: "bg-cyan-950/30",
    icon: "text-cyan-400",
    Icon: Layers,
  },
  shadow: {
    border: "border-rose-900/50",
    bg: "bg-rose-950/30",
    icon: "text-rose-400",
    Icon: CandlestickChart,
  },
  close: {
    border: "border-teal-900/50",
    bg: "bg-teal-950/30",
    icon: "text-teal-400",
    Icon: TrendingUp,
  },
  sequence: {
    border: "border-indigo-900/50",
    bg: "bg-indigo-950/30",
    icon: "text-indigo-400",
    Icon: Zap,
  },
  other: {
    border: "border-gray-800",
    bg: "bg-gray-950",
    icon: "text-gray-400",
    Icon: Layers,
  },
};

function ConditionCard({ condition, index }: { condition: SequenceRuleCondition; index: number }) {
  const { title, detail, kind } = formatRuleCondition(condition);
  const style = KIND_STYLE[kind] ?? KIND_STYLE.other;
  const { Icon } = style;

  return (
    <div
      className={`rounded-lg border p-3 ${style.border} ${style.bg}`}
      role="listitem"
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-950/80 border border-gray-800 text-xs font-semibold text-gray-500`}
        >
          {index + 1}
        </span>
        <div className={`mt-0.5 shrink-0 ${style.icon}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className={`text-xs font-semibold ${style.icon}`}>{title}</div>
          <p className="text-sm text-gray-200 leading-snug">{detail}</p>
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
          const { detail, kind } = formatRuleCondition(c);
          const style = KIND_STYLE[kind] ?? KIND_STYLE.other;
          const short =
            detail.length > 48 ? `${detail.slice(0, 45)}…` : detail;
          return (
            <span
              key={i}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${style.border} ${style.bg} text-gray-300`}
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
    <div className={`space-y-2 ${className}`} role="list" aria-label="Điều kiện rule">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
        Điều kiện (tất cả phải đúng cùng lúc)
      </p>
      {conditions.map((c, i) => (
        <ConditionCard key={i} condition={c} index={i} />
      ))}
      <p className="text-[11px] text-gray-600 pl-1">
        Khi khớp, hệ thống so giá sau các nến tiếp theo (theo mô tả rule) với lịch sử đã quét.
      </p>
    </div>
  );
}
