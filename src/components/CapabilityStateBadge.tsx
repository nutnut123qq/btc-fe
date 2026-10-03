import { CAPABILITY_LABELS } from "@/lib/researchUi";
import type { CapabilityState } from "@/lib/types";

const TONES: Record<CapabilityState, string> = {
  descriptive: "bg-slate-500/10 text-slate-300",
  experimental: "bg-amber-400/10 text-amber-300",
  validated: "bg-emerald-400/10 text-emerald-300",
  "forward-observed": "bg-teal-400/10 text-teal-300",
  retired: "bg-slate-500/10 text-slate-400",
};

export function CapabilityStateBadge({ state }: { state: CapabilityState }) {
  return (
    <span
      data-testid="capability-state"
      className={`rounded-full px-2 py-1 text-xs font-black uppercase ${TONES[state]}`}
      title="Mức trưởng thành của bằng chứng; không phải trạng thái hợp lệ của bản ghi"
    >
      {CAPABILITY_LABELS[state]}
    </span>
  );
}
