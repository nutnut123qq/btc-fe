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

function statusTextClass(status: string): string {
  return status === "degraded" || status === "stale"
    ? "text-amber-300"
    : status === "down" || status === "unavailable" || status === "missing" || status === "error" || status === "failed"
      ? "text-rose-300"
      : "text-slate-400";
}

function statusDotClass(status: string): string {
  return status === "degraded" || status === "stale"
    ? "bg-amber-400"
    : status === "down" || status === "unavailable" || status === "missing" || status === "error" || status === "failed"
      ? "bg-rose-400"
      : "bg-slate-500";
}

function freshnessStatusLabel(status: FreshnessHealthDto["klines"][number]["status"]): string {
  return status === "inactive" ? "không theo dõi" : status;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", { hour12: false });
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
    <section className="overflow-hidden rounded border border-slate-800 bg-slate-900 text-xs">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 pl-3 pr-1 py-1">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-200">
          <Activity className="h-3.5 w-3.5 text-slate-500" /> Trạng thái hệ thống
        </h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-9 items-center gap-1.5 px-2 text-[11px] text-slate-500 transition-colors hover:text-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </header>
      <div className="border-b border-slate-800 bg-slate-950/40 px-3 py-2">
        <p className="text-[11px] text-slate-500">Các tác vụ nền và health nhẹ; không chạy Data Audit khi mở màn này.</p>
      </div>

      {loading && !live && !ready && !freshness && !workers ? (
        <div className="grid grid-cols-2 gap-2 p-3" role="status" aria-label="Đang tải trạng thái hệ thống">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded bg-slate-800/50" />)}
        </div>
      ) : (
        <div className="space-y-4 p-3">
          {hasError && (
            <p className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-200">
              Một số health endpoint không phản hồi hoặc sai contract; phần tương ứng được đánh dấu không khả dụng.
            </p>
          )}

          <div className="divide-y divide-slate-800 rounded border border-slate-800">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-slate-400">Process liveness</span>
              <span className={`flex items-center gap-1.5 font-mono ${statusTextClass(live?.status ?? "missing")}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(live?.status ?? "missing")}`} aria-hidden="true" />
                {live?.status ?? "unavailable"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="h-3.5 w-3.5" /> Database readiness
              </span>
              <span className={`flex items-center gap-1.5 font-mono ${statusTextClass(ready?.status ?? "missing")}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(ready?.status ?? "missing")}`} aria-hidden="true" />
                {ready ? `${ready.status} · ${ready.responseTimeMs.toFixed(0)} ms` : "unavailable"}
              </span>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-slate-400">Freshness BTCUSDT</div>
            {freshness && freshness.klines.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {freshness.klines.map((item) => (
                  <div key={item.timeframe} className="rounded border border-slate-800 bg-slate-950/50 px-2 py-1.5">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-mono font-semibold text-slate-200">{item.timeframe}</span>
                      <span className={statusTextClass(item.status)}>{freshnessStatusLabel(item.status)}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">nến cuối {ageLabel(item.ageSeconds)} trước</div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-slate-500">Không có dữ liệu freshness.</span>
            )}
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-slate-400">Worker heartbeat</div>
            {workers && workers.workers.length > 0 ? (
              <div className="divide-y divide-slate-800 rounded border border-slate-800">
                {workers.workers.map((worker) => {
                  const delayed = worker.status === "stale";
                  const statusLabel =
                    worker.status === "healthy"
                      ? "đang chạy"
                      : delayed
                        ? `trễ ${ageLabel(worker.ageSeconds)}`
                        : worker.status === "never"
                          ? "chưa chạy"
                          : worker.status;
                  return (
                    <div
                      key={worker.name}
                      className={`px-3 py-2.5 transition-colors hover:bg-slate-850/40 ${delayed ? "bg-amber-950/10" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-xs font-medium text-slate-100">{worker.name}</span>
                        <span className={`flex items-center gap-1.5 text-[11px] ${statusTextClass(worker.status)}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(worker.status)}`} aria-hidden="true" />
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 font-mono text-[11px] text-slate-500">
                        <span className="min-w-0 truncate">{formatTimestamp(worker.lastSucceededAtUtc ?? worker.lastStartedAtUtc)}</span>
                        <span className="shrink-0">{ageLabel(worker.ageSeconds)} trước</span>
                      </div>
                      {worker.message && (
                        <div className="mt-1 break-words text-[11px] text-slate-500">{worker.message}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-slate-500">Không có worker heartbeat.</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
