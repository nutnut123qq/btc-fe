"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Database, RefreshCw } from "lucide-react";
import { getHealthFreshness, getHealthLive, getHealthReady, getHealthWorkers } from "@/lib/api";
import type { FreshnessHealthDto, LiveHealthDto, ReadyHealthDto, WorkersHealthDto } from "@/lib/types";

function ageLabel(seconds: number | null): string {
  if (seconds == null) return "chưa có dữ liệu";
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} phút`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} giờ`;
  return `${(seconds / 86400).toFixed(1)} ngày`;
}

function statusClass(status: string): string {
  return status === "healthy" || status === "ready" || status === "fresh"
    ? "text-emerald-300 bg-emerald-950/50 border-emerald-800"
    : status === "degraded" || status === "stale"
      ? "text-amber-300 bg-amber-950/50 border-amber-800"
      : "text-rose-300 bg-rose-950/50 border-rose-800";
}

export function SystemStatusPanel() {
  const [live, setLive] = useState<LiveHealthDto | null>(null);
  const [ready, setReady] = useState<ReadyHealthDto | null>(null);
  const [freshness, setFreshness] = useState<FreshnessHealthDto | null>(null);
  const [workers, setWorkers] = useState<WorkersHealthDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    const signal = AbortSignal.timeout(5_000);
    const results = await Promise.allSettled([
      getHealthLive(signal),
      getHealthReady(signal),
      getHealthFreshness("BTCUSDT", signal),
      getHealthWorkers(signal),
    ]);
    const [liveResult, readyResult, freshnessResult, workersResult] = results;
    setLive(liveResult.status === "fulfilled" ? liveResult.value : null);
    setReady(readyResult.status === "fulfilled" ? readyResult.value : null);
    setFreshness(freshnessResult.status === "fulfilled" ? freshnessResult.value : null);
    setWorkers(workersResult.status === "fulfilled" ? workersResult.value : null);
    setHasError(results.some((result) => result.status === "rejected"));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4 text-xs">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-100">
            <Activity className="h-4 w-4 text-teal-400" /> Trạng thái hệ thống
          </h3>
          <p className="mt-1 text-[11px] text-gray-500">Health nhẹ; không chạy Data Audit khi mở Settings.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>

      {loading && !live && !ready && !freshness && !workers ? (
        <div className="grid grid-cols-2 gap-2" role="status" aria-label="Đang tải trạng thái hệ thống">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-gray-800/70" />)}
        </div>
      ) : (
        <>
          {hasError && (
            <p className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-2 text-amber-300">
              Một số health endpoint không phản hồi hoặc sai contract; phần tương ứng được đánh dấu không khả dụng.
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className={`rounded-lg border p-3 ${live ? statusClass(live.status) : statusClass("missing")}`}>
              <div className="font-semibold">Process liveness</div>
              <div className="mt-1 font-mono">{live?.status ?? "unavailable"}</div>
            </div>
            <div className={`rounded-lg border p-3 ${ready ? statusClass(ready.status) : statusClass("missing")}`}>
              <div className="flex items-center gap-1 font-semibold"><Database className="h-3.5 w-3.5" /> Database readiness</div>
              <div className="mt-1 font-mono">
                {ready ? `${ready.status} · ${ready.responseTimeMs.toFixed(0)} ms` : "unavailable"}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1.5 font-semibold text-gray-300">Freshness BTCUSDT</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {freshness && freshness.klines.length > 0 ? freshness.klines.map((item) => (
                <div key={item.timeframe} className={`rounded border px-2 py-1.5 ${statusClass(item.status)}`}>
                  <span className="font-semibold">{item.timeframe}</span>
                  <span className="ml-1">{item.status}</span>
                  <div className="mt-0.5 text-[10px] opacity-80">Nến cuối: {ageLabel(item.ageSeconds)} trước</div>
                </div>
              )) : <span className="text-gray-500">Không có dữ liệu freshness.</span>}
            </div>
          </div>

          <div>
            <div className="mb-1.5 font-semibold text-gray-300">Worker heartbeat</div>
            <div className="space-y-1.5">
              {workers && workers.workers.length > 0 ? workers.workers.map((worker) => (
                <div key={worker.name} className={`flex items-start justify-between gap-3 rounded border px-2 py-1.5 ${statusClass(worker.status)}`}>
                  <div className="font-semibold">{worker.name}</div>
                  <div className="shrink-0 text-right font-mono">
                    <div>{worker.status}</div>
                    <div className="text-[10px] opacity-80">{ageLabel(worker.ageSeconds)}</div>
                  </div>
                </div>
              )) : <span className="text-gray-500">Không có worker heartbeat.</span>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
