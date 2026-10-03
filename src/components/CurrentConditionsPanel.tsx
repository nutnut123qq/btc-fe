"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { getCurrentConditions } from "@/lib/api";
import {
  CONDITION_HORIZON_KEYS,
  CONDITION_METRICS,
  type ConditionEvidenceCell,
  type ConditionEvidenceMetric,
  type ConditionHorizonKey,
  type CurrentCondition,
  type CurrentConditionDirection,
  type CurrentConditionKind,
  type CurrentConditionsResponse,
} from "@/lib/currentConditions";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, intervalToMs, type ActiveTimeframe } from "@/lib/timeframe";
import { LatestRequestGate } from "@/lib/technicalReplay";
import { GlossaryTerm } from "./GlossaryTerm";

// Matches the screen's evidence read budget: the first call after a backend
// restart waits on cold catalog hash-verification plus AI window compute.
const READ_TIMEOUT_MS = 60_000;

const KIND_LABEL: Record<CurrentConditionKind, string> = {
  triggeredOnBar: "mới trên nến đóng gần nhất",
  state: "trạng thái hiện hữu",
  activeZone: "vùng đang hiệu lực",
  operativeLeg: "nhịp Fibonacci đang operative",
};

const KIND_CLASS: Record<CurrentConditionKind, string> = {
  triggeredOnBar: "bg-emerald-950/40 text-emerald-300",
  state: "bg-slate-800/40 text-slate-300",
  activeZone: "bg-slate-800/40 text-slate-300",
  operativeLeg: "bg-slate-800/40 text-slate-300",
};

const DIRECTION_LABEL: Record<CurrentConditionDirection, string> = {
  bullish: "Tăng",
  bearish: "Giảm",
  neutral: "Trung lập",
};

const DIRECTION_CLASS: Record<CurrentConditionDirection, string> = {
  bullish: "bg-emerald-950/40 text-emerald-300",
  bearish: "bg-rose-950/40 text-rose-300",
  neutral: "bg-slate-800/60 text-slate-400",
};

const GATE_LABEL: Record<string, string> = { true: "Có", false: "Không" };

function gateText(value: boolean | null): string {
  return value == null ? "Chưa đánh giá" : GATE_LABEL[String(value)];
}

function percent(value: number | null, digits = 3): string {
  return value == null ? "—" : `${(value * 100).toLocaleString("vi-VN", { maximumFractionDigits: digits })}%`;
}

function decimal(value: number | null, digits = 4): string {
  return value == null ? "—" : value.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

function formatTimeMs(value: number | null): string {
  return value == null ? "—" : new Date(value).toLocaleString("vi-VN");
}

function shortHash(value: string | null): string {
  if (!value) return "—";
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value;
}

/** Honest age text: bar distance from evidence cutoff to the analyzed bar, plus the approximate wall-clock span. */
function evidenceAgeText(bars: number, timeframe: ActiveTimeframe): string {
  if (bars === 0) return "trùng mốc nến phân tích (0 nến)";
  const ms = bars * intervalToMs(timeframe);
  const minutes = ms / 60_000;
  const approx = minutes < 90
    ? `${Math.round(minutes)} phút`
    : minutes < 2_880
      ? `${(ms / 3_600_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giờ`
      : `${(ms / 86_400_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ngày`;
  return `cách ${bars.toLocaleString("vi-VN")} nến (≈${approx})`;
}

function EvidenceCell({ cell, horizon, metric }: { cell: ConditionEvidenceCell | undefined; horizon: ConditionHorizonKey; metric: ConditionEvidenceMetric }) {
  const label = `h${horizon} · ${metric}`;
  if (cell === undefined) {
    return <div className="min-w-0 rounded bg-slate-950/40 p-2 text-xs">
      <div className="font-mono text-slate-400"><GlossaryTerm term={metric}>{label}</GlossaryTerm></div>
      <div className="mt-1 text-slate-400">Chưa báo cáo cho ô này.</div>
    </div>;
  }
  if (!cell.tested) {
    return <div className="min-w-0 rounded bg-slate-950/40 p-2 text-xs">
      <div className="font-mono text-slate-400"><GlossaryTerm term={metric}>{label}</GlossaryTerm></div>
      <div className="mt-1 break-words text-amber-300/90">Chưa kiểm chứng — {cell.reason}</div>
    </div>;
  }
  return <div className="min-w-0 rounded bg-slate-950/40 p-2 text-xs">
    <div className="font-mono text-slate-400"><GlossaryTerm term={metric}>{label}</GlossaryTerm></div>
    <dl className="mt-1 grid min-w-0 grid-cols-[auto,minmax(0,1fr)] gap-x-2 gap-y-0.5 [&>dd]:min-w-0 [&>dd]:break-words [&>dd]:text-right">
      <dt className="text-slate-400"><GlossaryTerm term="effect">Effect</GlossaryTerm></dt><dd className="text-slate-300">{percent(cell.effect)}</dd>
      <dt className="text-slate-400"><GlossaryTerm term="ci">CI</GlossaryTerm></dt><dd className="font-mono text-slate-300">[{percent(cell.ciLower)}, {percent(cell.ciUpper)}]</dd>
      <dt className="text-slate-400"><GlossaryTerm term="q-p">q / p</GlossaryTerm></dt><dd className="font-mono text-slate-300">{decimal(cell.adjustedQValue)} / {decimal(cell.rawP)}</dd>
      <dt className="text-slate-400"><GlossaryTerm term="nonOverlappingPairs">n không chồng lấn</GlossaryTerm></dt><dd className="text-slate-300">{cell.nonOverlappingPairs.toLocaleString("vi-VN")}</dd>
      <dt className="text-slate-400">Đạt <GlossaryTerm term="fdr">FDR</GlossaryTerm> khai báo</dt><dd className={cell.passesDeclaredFdr === true ? "text-emerald-300" : "text-slate-300"}>{gateText(cell.passesDeclaredFdr)}</dd>
      <dt className="text-slate-400"><GlossaryTerm term="sufficient-sample">Đủ mẫu</GlossaryTerm></dt><dd className="text-slate-300">{gateText(cell.sufficientSample)}</dd>
      <dt className="text-slate-400"><GlossaryTerm term="mean-paired-delta">Mean paired Δ</GlossaryTerm></dt><dd className="font-mono text-slate-400">{percent(cell.meanPairedDifference)}</dd>
    </dl>
  </div>;
}

function ConditionCard({ condition, manifestSha256, onOpenDossier }: {
  condition: CurrentCondition;
  manifestSha256: string | null;
  onOpenDossier?: (manifestSha256: string) => void;
}) {
  return <article className="min-w-0 max-w-full overflow-hidden rounded-lg bg-slate-950/50 p-3">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h4 className="break-all font-mono text-xs font-semibold text-slate-200">{condition.eventType}</h4>
        <p className="mt-1 text-xs text-slate-400">trend {condition.context.trend ?? "—"} · volatility {condition.context.volatility ?? "—"} · formed {formatTimeMs(condition.formedTimeMs)} · khả dụng từ {formatTimeMs(condition.availableTimeMs)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${KIND_CLASS[condition.kind]}`}>{KIND_LABEL[condition.kind]}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-bold ${DIRECTION_CLASS[condition.direction]}`}>{DIRECTION_LABEL[condition.direction]}</span>
        {onOpenDossier && manifestSha256 && <button type="button" onClick={() => onOpenDossier(manifestSha256)} title={`Mở hồ sơ evidence của manifest ${manifestSha256}`} className="inline-flex items-center gap-0.5 rounded bg-slate-800/60 px-2 py-1 text-xs text-teal-400 hover:bg-slate-800">Hồ sơ<ChevronRight className="h-3 w-3" /></button>}
      </div>
    </div>
    {condition.evidence == null
      ? <p className="mt-2 rounded bg-slate-950/40 p-2 text-xs text-amber-300/90">Backend chưa gắn bằng chứng cho điều kiện này; UI không suy diễn ô số liệu.</p>
      : <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-3">{CONDITION_HORIZON_KEYS.map((horizon) => {
        const horizonEvidence = condition.evidence?.[horizon];
        return <div key={horizon} className="min-w-0 space-y-1.5"><div className="text-xs font-semibold text-slate-400"><GlossaryTerm term="horizon">Horizon</GlossaryTerm> {horizon} nến</div>{CONDITION_METRICS.map((metric) => <EvidenceCell key={metric} horizon={horizon} metric={metric} cell={horizonEvidence?.[metric]} />)}</div>;
      })}</div>}
    {condition.details && <details className="mt-2 text-[10px] text-slate-400"><summary className="cursor-pointer">Chi tiết detector</summary><pre className="mt-1 max-w-full overflow-x-auto break-all rounded bg-slate-950/60 p-2 font-mono text-slate-400">{JSON.stringify(condition.details, null, 2)}</pre></details>}
  </article>;
}

export function CurrentConditionsPanel({ onOpenDossier }: { onOpenDossier?: (manifestSha256: string) => void }) {
  const [timeframe, setTimeframe] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [data, setData] = useState<CurrentConditionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestGate = useRef(new LatestRequestGate());

  const load = useCallback(async (nextTimeframe: ActiveTimeframe) => {
    const token = requestGate.current.begin();
    setLoading(true);
    setError(null);
    // A response from another timeframe must never render under the new selection.
    setData((previous) => (previous && previous.timeframe === nextTimeframe ? previous : null));
    try {
      const next = await getCurrentConditions(nextTimeframe, AbortSignal.timeout(READ_TIMEOUT_MS));
      if (!requestGate.current.isCurrent(token)) return;
      if (next.timeframe !== nextTimeframe) throw new Error("Phản hồi timeframe không khớp yêu cầu.");
      setData(next);
    } catch (cause) {
      if (requestGate.current.isCurrent(token)) {
        setData(null);
        setError(cause instanceof Error ? cause.message : "Không tải được điều kiện hiện tại.");
      }
    } finally {
      if (requestGate.current.isCurrent(token)) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(timeframe); }, [timeframe, load]);

  const groups = (() => {
    const map = new Map<string, CurrentCondition[]>();
    for (const condition of data?.conditions ?? []) {
      const list = map.get(condition.module) ?? [];
      list.push(condition);
      map.set(condition.module, list);
    }
    return [...map.entries()];
  })();

  const evidence = data?.evidence ?? null;

  return <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="current-conditions-title">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 id="current-conditions-title" className="flex items-center gap-2 text-sm font-semibold text-slate-100">Điều kiện hiện tại & bằng chứng · BTCUSDT</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">Điều kiện kỹ thuật trên nến đóng gần nhất, nối với thống kê mô tả lịch sử theo từng horizon. Đây không phải xác suất, tỷ lệ thắng hay tín hiệu giao dịch.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <select value={timeframe} onChange={(event) => setTimeframe(event.target.value as ActiveTimeframe)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200" aria-label="Timeframe điều kiện hiện tại">
          {ACTIVE_TIMEFRAMES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" onClick={() => void load(timeframe)} disabled={loading} className="rounded bg-slate-950 p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50" aria-label="Làm mới điều kiện hiện tại"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/></button>
      </div>
    </div>

    {loading && !data && <div className="mt-4 space-y-4" aria-label="Đang tải điều kiện hiện tại">
      <div className="h-6 w-2/3 animate-pulse rounded bg-slate-800/70" />
      <div className="grid gap-2 sm:grid-cols-2"><div className="h-14 animate-pulse rounded bg-slate-800/60" /><div className="h-14 animate-pulse rounded bg-slate-800/60" /></div>
      <div className="h-40 animate-pulse rounded-lg bg-slate-800/50" />
    </div>}

    {error && <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-rose-950/30 p-3 text-xs text-rose-300">
      <span className="min-w-0 break-words">Điều kiện hiện tại chưa sẵn sàng: {error}</span>
      <button type="button" onClick={() => void load(timeframe)} className="shrink-0 rounded px-2.5 py-1.5 font-semibold text-rose-200 hover:bg-rose-950/60">Thử lại</button>
    </div>}

    {data && <>
      <dl className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-slate-950/50 p-3">
          <dt className="text-xs font-medium text-slate-400"><GlossaryTerm term="asOf">Nến phân tích (asOf)</GlossaryTerm></dt>
          <dd className="mt-1 break-words text-sm font-semibold text-slate-200">{formatTimeMs(data.asOfMs)}</dd>
          <dd className="mt-0.5 text-xs text-slate-400">BTCUSDT · {data.timeframe} · thời điểm nến thị trường được phân tích</dd>
        </div>
        <div className="min-w-0 rounded-lg bg-slate-950/50 p-3">
          <dt className="text-xs font-medium text-slate-400"><GlossaryTerm term="cutoff">Nghiên cứu cắt tại</GlossaryTerm></dt>
          {evidence?.available
            ? <><dd className="mt-1 break-words text-sm font-semibold text-slate-200">{formatTimeMs(evidence.cutoffMs)}</dd><dd className="mt-0.5 text-xs text-slate-400">{evidenceAgeText(evidence.evidenceAgeBars ?? 0, data.timeframe)} so với nến phân tích · <GlossaryTerm term="run">run</GlossaryTerm> {evidence.runId}</dd></>
            : <dd className="mt-1 break-words text-xs text-slate-300">Bằng chứng không khả dụng{evidence?.reason ? ` — ${evidence.reason}` : ""}; các ô bên dưới không suy diễn số liệu.</dd>}
        </div>
      </dl>

      {data.warnings.length > 0 && <div className="mt-3 rounded-lg bg-amber-950/20 p-3" role="note">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Cảnh báo từ pipeline</h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-4 text-amber-100/80">{data.warnings.map((warning, index) => <li key={index} className="break-words">{warning}</li>)}</ul>
      </div>}

      {data.unavailableModules.length > 0 && <div className="mt-3 rounded-lg bg-rose-950/20 p-3" role="note">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /> <GlossaryTerm term="unavailable-module">Module không khả dụng</GlossaryTerm></h4>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-4 text-rose-100/80">{data.unavailableModules.map((item) => <li key={item.module} className="break-words"><span className="font-mono">{item.module}</span>: {item.reason}</li>)}</ul>
      </div>}

      {data.conflicts.length > 0 && <div data-testid="conditions-conflicts" className="mt-3 rounded-lg bg-slate-800/40 p-3">
        <h4 className="text-xs font-semibold text-slate-300"><GlossaryTerm term="conflict">Xung đột bằng chứng</GlossaryTerm> (render verbatim)</h4>
        <p className="mt-1 text-xs leading-4 text-slate-200/70">Bằng chứng mô tả lịch sử đạt ngưỡng <GlossaryTerm term="fdr">FDR</GlossaryTerm> khai báo ở cả hai chiều trong cùng <GlossaryTerm term="horizon">horizon</GlossaryTerm>/<GlossaryTerm term="metric">metric</GlossaryTerm>. Đây là xung đột thật trong dữ liệu quá khứ — không có winner và UI không tổng hợp thành kết luận.</p>
        <ul className="mt-2 space-y-2">{data.conflicts.map((conflict, index) => <li key={`${conflict.horizon}-${conflict.metric}-${index}`} className="min-w-0 rounded bg-slate-950/50 p-2 text-xs">
          <div className="font-mono text-slate-400"><GlossaryTerm term={conflict.metric}>h{conflict.horizon} · {conflict.metric}</GlossaryTerm></div>
          <div className="mt-1 flex min-w-0 flex-wrap gap-x-4 gap-y-1">
            <span className="min-w-0 break-words text-emerald-300">Tăng: {conflict.bullish.join(", ")}</span>
            <span className="min-w-0 break-words text-rose-300">Giảm: {conflict.bearish.join(", ")}</span>
          </div>
        </li>)}</ul>
      </div>}

      {!loading && data.conditions.length === 0 && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400"><CheckCircle2 className="mb-2 h-5 w-5" />Không có điều kiện nào thỏa trên nến đóng gần nhất.</div>}

      {groups.map(([module, items]) => <div key={module} className="mt-4 min-w-0">
        <h4 className="break-all font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">{module} <span className="normal-case text-slate-400">· {items.length} điều kiện</span></h4>
        <div className="mt-2 space-y-2">{items.map((condition) => <ConditionCard key={`${condition.module}|${condition.eventType}|${condition.kind}|${condition.eventId ?? "state"}`} condition={condition} manifestSha256={evidence?.manifestSha256 ?? null} onOpenDossier={onOpenDossier} />)}</div>
      </div>)}

      <p className="mt-4 break-words text-xs leading-4 text-slate-400"><GlossaryTerm term="generatedAt">generatedAt</GlossaryTerm> {formatTimeMs(data.generatedAtMs)} · <GlossaryTerm term="manifest">manifest</GlossaryTerm> {shortHash(evidence?.manifestSha256 ?? null)} · <GlossaryTerm term="spec">spec</GlossaryTerm> {shortHash(evidence?.specSha256 ?? null)} · các ô “Chưa kiểm chứng/Chưa báo cáo” giữ nguyên lý do từ backend, không hiển thị số.</p>
    </>}
  </section>;
}
