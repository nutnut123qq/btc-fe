"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, RefreshCw } from "lucide-react";
import { getTechnicalCapabilities } from "@/lib/api";
import type { EvidenceTarget, OperationalStatus, TechnicalCapabilitiesResponse } from "@/lib/types";
import { countCapabilityStates } from "@/lib/technicalCapabilities";
import { CapabilityStateBadge } from "./CapabilityStateBadge";

const OPERATIONAL_LABELS: Record<OperationalStatus, string> = {
  operational: "đã triển khai",
  degraded: "triển khai hạn chế",
  unavailable: "chưa khả dụng",
};

const EVIDENCE_TARGET_LABELS: Record<EvidenceTarget, string> = {
  "data-integrity": "toàn vẹn dữ liệu",
  "calculation-correctness": "đúng phép tính",
  predictive: "dự báo OOS",
  "economic-simulation": "mô phỏng kinh tế",
  "prospective-observation": "quan sát tiến cứu",
  "operational-delivery": "vận hành/phân phối",
};

function operationalClass(status: OperationalStatus): string {
  if (status === "operational") return "border-emerald-800 bg-emerald-950/40 text-emerald-300";
  if (status === "degraded") return "border-amber-800 bg-amber-950/40 text-amber-300";
  return "border-rose-900 bg-rose-950/40 text-rose-300";
}

export function TechnicalCapabilitiesPanel() {
  const [data, setData] = useState<TechnicalCapabilitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getTechnicalCapabilities(AbortSignal.timeout(5_000)));
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "Không tải được registry kỹ thuật");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const counts = useMemo(() => countCapabilityStates(data?.items ?? []), [data]);
  const categories = useMemo(() => {
    const grouped = new Map<string, NonNullable<typeof data>["items"]>();
    for (const item of data?.items ?? []) {
      const items = grouped.get(item.category) ?? [];
      items.push(item);
      grouped.set(item.category, items);
    }
    return [...grouped.entries()];
  }, [data]);

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-slate-100">
            <FlaskConical className="h-4 w-4 text-slate-400" /> Bản đồ năng lực kỹ thuật BTC
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Đây là registry tĩnh về mức triển khai, không phải runtime health. Mức triển khai và bằng chứng là hai khái niệm độc lập.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      {error && <p className="rounded-lg border border-rose-900 bg-rose-950/30 p-2 text-rose-300">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2"><b>{data.items.length}</b><div className="text-slate-400">module đã đăng ký</div></div>
            <div className="rounded-lg border border-emerald-900 bg-emerald-950/20 p-2 text-emerald-300"><b>{counts.operational}</b><div className="opacity-70">đã triển khai</div></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-slate-300"><b>{counts.validated}</b><div className="opacity-70">validated theo mục đích ghi rõ</div></div>
            <div className="rounded-lg border border-teal-900 bg-teal-950/20 p-2 text-teal-300"><b>{counts.forwardObserved}</b><div className="opacity-70">forward-observed</div></div>
          </div>
          <div className="space-y-3">
            {categories.map(([category, items]) => (
              <div key={category}>
                <h4 className="mb-1.5 font-semibold uppercase tracking-wide text-slate-400">{category}</h4>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <details key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
                        <span className="min-w-40 flex-1 font-semibold text-slate-200">{item.name}</span>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${operationalClass(item.operationalStatus)}`}>
                          {OPERATIONAL_LABELS[item.operationalStatus]}
                        </span>
                        <CapabilityStateBadge state={item.evidenceStage} />
                        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
                          mục tiêu: {EVIDENCE_TARGET_LABELS[item.evidenceTarget]}
                        </span>
                      </summary>
                      <div className="mt-2 grid gap-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400 sm:grid-cols-2">
                        <p><span className="text-slate-400">Mục đích:</span> {item.intendedUse}</p>
                        <p><span className="text-slate-400">Giới hạn:</span> {item.limitation}</p>
                        <p className="font-mono text-slate-400">{item.endpoint}</p>
                        <p className="font-mono text-slate-400">{item.id} · {item.version}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">Contract {data.contractVersion} · cập nhật {new Date(data.generatedAtUtc).toLocaleString("vi-VN")}</p>
        </>
      )}
    </section>
  );
}
