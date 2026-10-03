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
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: Activity,
  },
  body: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: BarChart3,
  },
  range: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: Layers,
  },
  shadow: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: CandlestickChart,
  },
  close: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: TrendingUp,
  },
  sequence: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
    Icon: Zap,
  },
  other: {
    border: "border-slate-800",
    bg: "bg-slate-950",
    icon: "text-slate-400",
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
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-400`}
        >
          {index + 1}
        </span>
        <div className={`mt-0.5 shrink-0 ${style.icon}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className={`text-xs font-semibold ${style.icon}`}>{title}</div>
          <p className="text-sm text-slate-200 leading-snug">{detail}</p>
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
              className={`text-[11px] px-2 py-0.5 rounded-full border ${style.border} ${style.bg} text-slate-300`}
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
      <p className="text-xs font-medium text-slate-400">
        Điều kiện (tất cả phải đúng cùng lúc)
      </p>
      {conditions.map((c, i) => (
        <ConditionCard key={i} condition={c} index={i} />
      ))}
      <p className="text-[11px] text-slate-400 pl-1">
        Khi khớp, hệ thống so giá sau các nến tiếp theo (theo mô tả rule) với lịch sử đã quét.
      </p>
    </div>
  );
}
