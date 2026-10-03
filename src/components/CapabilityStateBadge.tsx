import { CAPABILITY_LABELS } from "@/lib/researchUi";
import type { CapabilityState } from "@/lib/types";

const TONES: Record<CapabilityState, string> = {
  descriptive: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  experimental: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  validated: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "forward-observed": "border-teal-400/30 bg-teal-400/10 text-teal-300",
  retired: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

export function CapabilityStateBadge({ state }: { state: CapabilityState }) {
  return (
    <span
      data-testid="capability-state"
      className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${TONES[state]}`}
      title="Mức trưởng thành của bằng chứng; không phải trạng thái hợp lệ của bản ghi"
    >
      {CAPABILITY_LABELS[state]}
    </span>
  );
}
