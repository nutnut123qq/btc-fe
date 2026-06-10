"use client";

import { FlaskConical, Clock, Target, Percent, Hash, Scale } from "lucide-react";
import {
  formatFutureHorizon,
  parseDiscoveryDescription,
  type DiscoveredRuleLike,
} from "@/lib/formatRuleDiscovery";

type RuleDiscoverySummaryProps = {
  rule: DiscoveredRuleLike;
  className?: string;
};

function StatCell({
  label,
  value,
  sub,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "emerald" | "amber" | "gray" | "sky";
  Icon: typeof Percent;
}) {
  const tones = {
    emerald: "border-emerald-900/40 bg-emerald-950/25 text-emerald-400",
    amber: "border-amber-900/40 bg-amber-950/25 text-amber-400",
    gray: "border-gray-800 bg-gray-950/60 text-gray-300",
    sky: "border-sky-900/40 bg-sky-950/25 text-sky-400",
  };
  return (
    <div className={`rounded-lg border px-2.5 py-2 min-w-[4.5rem] ${tones[tone]}`}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">
        <Icon className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-100 tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function RuleDiscoverySummary({ rule, className = "" }: RuleDiscoverySummaryProps) {
  const parsed = parseDiscoveryDescription(rule.description);
  const futureBars = parsed.futureBars ?? 3;
  const winPct =
    rule.winRate != null && !Number.isNaN(rule.winRate)
      ? (rule.winRate * 100).toFixed(1)
      : "—";
  const avgPct =
    rule.avgReturn != null && !Number.isNaN(rule.avgReturn)
      ? rule.avgReturn.toFixed(2)
      : "—";
  const samples = rule.sampleCount != null ? String(rule.sampleCount) : "—";
  const pf =
    parsed.profitFactor != null && !Number.isNaN(parsed.profitFactor)
      ? parsed.profitFactor.toFixed(2)
      : "—";
  const horizon = formatFutureHorizon(rule.timeframe ?? "1h", futureBars);

  return (
    <div
      className={`rounded-lg border border-gray-800/80 bg-gray-950/50 p-3 space-y-2.5 ${className}`}
    >
      <div className="flex items-start gap-2">
        <FlaskConical className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium text-teal-400/90">Tự động phát hiện từ lịch sử</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Khi setup <span className="text-gray-200 font-medium">{rule.name}</span> khớp trên một
            nến, hệ thống đã thống kê giá BTC{" "}
            <span className="text-gray-300">{horizon}</span> trong quá khứ.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pl-6">
        <Clock className="w-3 h-3 shrink-0" aria-hidden />
        <span>
          Cửa sổ đo lường: <strong className="text-gray-400 font-normal">{futureBars} nến</strong>{" "}
          tiếp theo · Thắng nếu giá tăng &gt; 0,3%
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pl-6">
        <StatCell label="Win rate" value={`${winPct}%`} sub="lần tăng rõ" tone="emerald" Icon={Target} />
        <StatCell label="Avg" value={`${avgPct}%`} sub="mỗi lần khớp" tone="amber" Icon={Percent} />
        <StatCell label="Mẫu" value={samples} sub="lần trong quá khứ" tone="gray" Icon={Hash} />
        <StatCell label="PF" value={pf} sub="lãi / lỗ" tone="sky" Icon={Scale} />
      </div>
    </div>
  );
}
