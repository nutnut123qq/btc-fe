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
  if (status === "operational") return "bg-slate-800/40 text-slate-300";
  if (status === "degraded") return "bg-amber-950/40 text-amber-300";
  return "bg-rose-950/40 text-rose-300";
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
    <section className="overflow-hidden rounded border border-slate-800 bg-slate-900 text-xs">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 pl-3 pr-1 py-1">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-200">
          <FlaskConical className="h-3.5 w-3.5 text-slate-500" /> Bản đồ năng lực kỹ thuật BTC
        </h3>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex min-h-9 items-center gap-1.5 px-2 text-[11px] text-slate-500 transition-colors hover:text-slate-200 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </header>
      <div className="border-b border-slate-800 bg-slate-950/40 px-3 py-2">
        <p className="text-[11px] text-slate-500">
          Registry tĩnh về mức triển khai, không phải runtime health. Mức triển khai và bằng chứng là hai khái niệm độc lập.
        </p>
      </div>

      {error && <p className="border-b border-slate-800 bg-rose-950/20 px-3 py-2 text-rose-300">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-px border-b border-slate-800 bg-slate-800 sm:grid-cols-4">
            <div className="bg-slate-900 px-3 py-2.5"><b className="font-mono text-sm text-slate-100">{data.items.length}</b><div className="text-[11px] text-slate-500">module đã đăng ký</div></div>
            <div className="bg-slate-900 px-3 py-2.5"><b className="font-mono text-sm text-slate-100">{counts.operational}</b><div className="text-[11px] text-slate-500">đã triển khai</div></div>
            <div className="bg-slate-900 px-3 py-2.5"><b className="font-mono text-sm text-slate-100">{counts.validated}</b><div className="text-[11px] text-slate-500">validated theo mục đích ghi rõ</div></div>
            <div className="bg-slate-900 px-3 py-2.5"><b className="font-mono text-sm text-teal-300">{counts.forwardObserved}</b><div className="text-[11px] text-slate-500">forward-observed</div></div>
          </div>
          <div className="divide-y divide-slate-800">
            {categories.map(([category, items]) => (
              <div key={category} className="px-3 py-3">
                <h4 className="mb-2 font-mono text-[11px] font-semibold tracking-wide text-slate-500">{category}</h4>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <details key={item.id} className="rounded border border-slate-800 bg-slate-950/40 px-2.5 py-2">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 py-1">
                        <span className="min-w-40 flex-1 font-semibold text-slate-200">{item.name}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${operationalClass(item.operationalStatus)}`}>
                          {OPERATIONAL_LABELS[item.operationalStatus]}
                        </span>
                        <CapabilityStateBadge state={item.evidenceStage} />
                        <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-500">
                          mục tiêu: {EVIDENCE_TARGET_LABELS[item.evidenceTarget]}
                        </span>
                      </summary>
                      <div className="mt-1.5 grid gap-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400 sm:grid-cols-2">
                        <p><span className="text-slate-500">Mục đích:</span> {item.intendedUse}</p>
                        <p><span className="text-slate-500">Giới hạn:</span> {item.limitation}</p>
                        <p className="font-mono text-slate-500">{item.endpoint}</p>
                        <p className="font-mono text-slate-500">{item.id} · {item.version}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="border-t border-slate-800 px-3 py-2 font-mono text-[11px] text-slate-500">
            Contract {data.contractVersion} · cập nhật {new Date(data.generatedAtUtc).toLocaleString("vi-VN")}
          </p>
        </>
      )}
    </section>
  );
}
