"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { getHistoricalAnalogs } from "@/lib/api";
import {
  formatSignedPercent,
  formatSimilarity,
  getAnalogDirectionLabel,
  getDirectionTone,
} from "@/lib/historicalAnalog";
import type {
  HistoricalAnalogItemDto,
  HistoricalAnalogResponse,
} from "@/lib/types";
import {
  formatCoverage,
  formatLift,
  normalizeCapabilityState,
  resolveEvidenceFreshness,
} from "@/lib/researchUi";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";
import { CapabilityStateBadge } from "@/components/CapabilityStateBadge";
import { GlossaryTerm } from "@/components/GlossaryTerm";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

const PAGE_SIZE = 8;
const DEFAULT_LOOKBACK_BARS = 20_000;

interface HistoricalAnalogViewProps {
  symbol: string;
  timeframeOptions: string[];
  windowSizes: number[];
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnalogCard({ item, windowSize }: { item: HistoricalAnalogItemDto; windowSize: number }) {
  return (
    <article
      data-testid="analog-card"
      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-black text-slate-200">#{item.rank} · Analog lịch sử</div>
          <time className="text-xs text-slate-400" dateTime={new Date(item.endTimeMs).toISOString()}>
            Kết thúc {formatTime(item.endTimeMs)}
          </time>
        </div>
        <span className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300">
          NGHIÊN CỨU
        </span>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-900 p-2 text-xs">
        <div>
          <div className="text-slate-400"><GlossaryTerm term="shape-similarity">Giống hình nến</GlossaryTerm></div>
          <div className="font-bold text-teal-300">{formatSimilarity(item.shapeSimilarity)}</div>
        </div>
        <div>
          <div className="text-slate-400"><GlossaryTerm term="context-similarity">Giống bối cảnh</GlossaryTerm></div>
          <div className="font-bold text-slate-200">{formatSimilarity(item.contextSimilarity)}</div>
          <div className="text-xs text-slate-400">{item.contextComparableFeatureCount} đặc trưng so sánh được</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-xs text-slate-400">{windowSize} nến nguồn độc lập</div>
          <div className="h-24 rounded bg-slate-900 p-1.5">
            {item.ohlc.length > 0 ? (
              <ArchetypeGlyph bars={item.ohlc} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-rose-300">Thiếu <GlossaryTerm term="ohlc">OHLC</GlossaryTerm> nguồn</div>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-slate-400">6 nến sau (chỉ để kiểm chứng)</div>
          <div className="h-24 rounded bg-slate-900 p-1.5">
            {item.futureOhlc.length > 0 ? (
              <ArchetypeGlyph bars={item.futureOhlc} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-rose-300">Thiếu nến sau</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1 pt-2 text-xs">
        {item.outcomes.map((outcome) => (
          <div key={outcome.barsAhead} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-1">
            <span className="text-slate-400">Sau {outcome.barsAhead} nến</span>
            <span className={`font-bold ${getDirectionTone(outcome.direction)}`}>
              {getAnalogDirectionLabel(outcome.direction)} {formatSignedPercent(outcome.returnPct)}
            </span>
            <span className="text-slate-400">ngưỡng ±{outcome.thresholdPct.toFixed(2)}%</span>
          </div>
        ))}
      </div>

      {(item.ohlc.length !== windowSize || item.futureOhlc.length !== 6) && (
        <div className="mt-2 rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-300">
          Dữ liệu chưa đủ: {item.ohlc.length}/{windowSize} nến nguồn, {item.futureOhlc.length}/6 nến sau.
        </div>
      )}
    </article>
  );
}

export function HistoricalAnalogView({ symbol, timeframeOptions, windowSizes }: HistoricalAnalogViewProps) {
  const [timeframe, setTimeframe] = useState<string>(DEFAULT_TIMEFRAME);
  const [windowSize, setWindowSize] = useState(15);
  const [neighborCount, setNeighborCount] = useState(30);
  const [roundTripCostPct, setRoundTripCostPct] = useState(0.30);
  const [atrMultiplier, setAtrMultiplier] = useState(0.25);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: HistoricalAnalogResponse | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  useEffect(() => {
    let current = true;
    const requestKey = [
      symbol,
      timeframe,
      windowSize,
      neighborCount,
      roundTripCostPct,
      atrMultiplier,
      page,
      retryKey,
    ].join(":");

    getHistoricalAnalogs({
      symbol,
      timeframe,
      windowSize,
      neighborCount,
      page,
      pageSize: PAGE_SIZE,
      lookbackBars: DEFAULT_LOOKBACK_BARS,
      roundTripCostPct,
      atrMultiplier,
    })
      .then((data) => {
        if (current) setResult({ key: requestKey, data, error: null });
      })
      .catch((cause) => {
        if (!current) return;
        console.error(cause);
        setResult({
          key: requestKey,
          data: null,
          error: "Không thể tải Historical Analog. Dữ liệu cũ không được dùng thay thế.",
        });
      });

    return () => {
      current = false;
    };
  }, [atrMultiplier, neighborCount, page, retryKey, roundTripCostPct, symbol, timeframe, windowSize]);

  const requestKey = [
    symbol,
    timeframe,
    windowSize,
    neighborCount,
    roundTripCostPct,
    atrMultiplier,
    page,
    retryKey,
  ].join(":");
  const loading = result.key !== requestKey;
  const data = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : null;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const firstIndex = !data || data.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIndex = Math.min(page * PAGE_SIZE, data?.total ?? 0);
  const capabilityState = normalizeCapabilityState(data?.capabilityState, "experimental");
  const freshness = data
    ? resolveEvidenceFreshness(data.freshness, data.query?.endTimeMs, data.timeframe)
    : null;
  const coverage = formatCoverage(data?.coverage);
  const abstentionRate = formatCoverage(data?.abstentionRate);
  const lift = formatLift(data?.lift, data?.liftUnit);
  const canShowNeighborEvidence = data?.abstained !== true;

  const resetPage = (change: () => void) => {
    change();
    setPage(1);
  };

  return (
    <section
      role="region"
      aria-label="Historical Analog Explorer"
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
    >
      <header className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-100">
              <Search className="h-5 w-5 text-teal-400" /> <GlossaryTerm term="analog">Historical Analog</GlossaryTerm>
            </h2>
            <CapabilityStateBadge state={capabilityState} />
            <span className="text-xs font-bold text-slate-400"><GlossaryTerm term="oos-gate">Chưa qua OOS gate</GlossaryTerm></span>
            {freshness?.status === "stale" && (
              <span className="rounded-full bg-rose-400/10 px-2 py-1 text-xs font-black text-rose-300">
                <GlossaryTerm term="stale">STALE</GlossaryTerm>
              </span>
            )}
            {data?.validation.status === "unavailable" && (
              <span className="rounded-full bg-slate-500/10 px-2 py-1 text-xs font-black text-slate-400">
                <GlossaryTerm term="unavailable">UNAVAILABLE</GlossaryTerm>
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Lấy cửa sổ nến hiện tại làm truy vấn, tìm các đoạn lịch sử giống nhất rồi loại mẫu chồng lấn.
            Kết quả là bằng chứng nghiên cứu, không phải khuyến nghị hay tín hiệu giao dịch.
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-300">
            Xếp hạng chỉ theo hình dạng; bối cảnh chỉ để đối chiếu, không tham gia xếp hạng.
          </p>
          {data && (
            <p className="mt-1 text-xs text-slate-400">
              <GlossaryTerm term="method-version">Method</GlossaryTerm>: {data.methodVersion || data.method} · <GlossaryTerm term="freshness">freshness</GlossaryTerm> {freshness?.status ?? "unknown"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/10 disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới truy vấn
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950 p-5 sm:grid-cols-3 xl:grid-cols-5">
        <label className="text-xs text-slate-400">
          Timeframe
          <select
            aria-label="Timeframe analog"
            value={timeframe}
            onChange={(event) => resetPage(() => setTimeframe(event.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {timeframeOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Số nến truy vấn
          <select
            aria-label="Số nến truy vấn analog"
            value={windowSize}
            onChange={(event) => resetPage(() => setWindowSize(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {windowSizes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Số analog (20–50)
          <select
            aria-label="Số analog lịch sử"
            value={neighborCount}
            onChange={(event) => resetPage(() => setNeighborCount(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {[20, 30, 50].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Ngưỡng chi phí tham chiếu
          <select
            aria-label="Chi phí khứ hồi"
            value={roundTripCostPct}
            onChange={(event) => resetPage(() => setRoundTripCostPct(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {[0.15, 0.30, 0.45].map((value) => <option key={value} value={value}>{value.toFixed(2)}%</option>)}
          </select>
        </label>
        <label className="col-span-2 text-xs text-slate-400 sm:col-span-1">
          Bộ lọc nhiễu ATR
          <select
            aria-label="Bộ lọc nhiễu ATR"
            value={atrMultiplier}
            onChange={(event) => resetPage(() => setAtrMultiplier(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {[0.15, 0.25, 0.4].map((value) => <option key={value} value={value}>{value.toFixed(2)} × ATR</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin text-teal-400" /> Đang tìm analog độc lập…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-rose-500/10">
            Thử lại Historical Analog
          </button>
        </div>
      ) : data?.query ? (
        <>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Cửa sổ truy vấn thật · {symbol} {timeframe}</h3>
                  <p className="text-xs text-slate-400">{formatTime(data.query.startTimeMs)} → {formatTime(data.query.endTimeMs)}</p>
                </div>
                <span className="text-xs text-slate-400">{data.query.context.availableFeatureCount} đặc trưng bối cảnh có sẵn</span>
              </div>
              <div className="h-40 rounded-lg bg-slate-900 p-2" data-testid="analog-query-window">
                <ArchetypeGlyph bars={data.query.ohlc} />
              </div>
            </div>

            <aside className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-start gap-2 rounded-lg bg-slate-400/5 p-2 text-xs text-slate-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{data.validation.reason}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-900 p-2"><div className="text-lg font-black text-slate-200">{data.rawCandidateCount}</div><div className="text-slate-400">Ứng viên thô</div></div>
                <div className="rounded-lg bg-slate-900 p-2"><div className="text-lg font-black text-slate-200">{data.independentCandidateCount}</div><div className="text-slate-400"><GlossaryTerm term="non-overlapping">Sau loại chồng lấn</GlossaryTerm></div></div>
                <div className="rounded-lg bg-slate-900 p-2"><div className="text-lg font-black text-teal-300">{data.effectiveSampleCount}</div><div className="text-slate-400"><GlossaryTerm term="effective-sample">Mẫu hiệu lực</GlossaryTerm></div></div>
              </div>
              <p className="text-xs leading-4 text-slate-400">
                <GlossaryTerm term="exclusion-zone">Vùng loại trừ</GlossaryTerm>: {data.exclusionBars} nến. TRUNG TÍNH khi |return| không vượt ngưỡng lớn hơn giữa <GlossaryTerm term="round-trip-cost">tham chiếu chi phí</GlossaryTerm> {data.roundTripCostPct.toFixed(2)}% và {data.atrMultiplier.toFixed(2)} × <GlossaryTerm term="atr">ATR</GlossaryTerm>. Đây là ngưỡng phân loại, không phải chi phí đã trừ khỏi <GlossaryTerm term="pnl">PnL</GlossaryTerm>.
              </p>
              <div className="rounded-lg bg-slate-900 p-2 text-xs">
                <div className="mb-2 font-semibold text-slate-400">Bằng chứng <GlossaryTerm term="evaluator">evaluator</GlossaryTerm></div>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <div><GlossaryTerm term="baseline">Baseline</GlossaryTerm><strong className="block text-slate-200">{data.baselineName || "Chưa cung cấp"}</strong></div>
                  <div><GlossaryTerm term="lift">Lift</GlossaryTerm> so <GlossaryTerm term="baseline">baseline</GlossaryTerm><strong className="block text-slate-200">{lift ?? "Chưa cung cấp"}</strong></div>
                  <div><GlossaryTerm term="coverage">Coverage</GlossaryTerm><strong className="block text-slate-200">{coverage ?? "Chưa cung cấp"}</strong></div>
                  <div><GlossaryTerm term="abstention">Abstention</GlossaryTerm><strong className="block text-slate-200">{abstentionRate ?? "Chưa cung cấp"}</strong></div>
                </div>
                {data.liftConfidenceInterval && (
                  <div className="mt-2 text-slate-400">
                    <GlossaryTerm term="ci">CI</GlossaryTerm>{data.liftConfidenceInterval.level ? ` ${(data.liftConfidenceInterval.level * 100).toFixed(0)}%` : ""}: {formatLift(data.liftConfidenceInterval.lower, data.liftUnit)} → {formatLift(data.liftConfidenceInterval.upper, data.liftUnit)}
                  </div>
                )}
              </div>
            </aside>
          </div>

          {data.abstained && (
            <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-2.5 text-xs text-amber-200">
              Hệ thống đã <GlossaryTerm term="abstain">abstain</GlossaryTerm>: {data.abstentionReason || "chất lượng analog không đạt ngưỡng đã khai báo"}. Không diễn giải các tần suất bên dưới như bằng chứng dự báo.
            </div>
          )}

          {canShowNeighborEvidence && <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="analog-summary">
            {data.summaries.map((summary) => (
              <div key={summary.barsAhead} className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300">Sau {summary.barsAhead} nến</span>
                  <span className={`text-xs font-black ${getDirectionTone(summary.dominantDirection)}`}>{getAnalogDirectionLabel(summary.dominantDirection)}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
                  <span className="rounded bg-emerald-500/10 px-1 py-1 text-emerald-300">Tần suất tăng {(summary.upRate * 100).toFixed(1)}%</span>
                  <span className="rounded bg-slate-500/10 px-1 py-1 text-slate-300">Tần suất trung tính {(summary.neutralRate * 100).toFixed(1)}%</span>
                  <span className="rounded bg-rose-500/10 px-1 py-1 text-rose-300">Tần suất giảm {(summary.downRate * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-2 text-xs text-slate-400"><GlossaryTerm term="n">N</GlossaryTerm>={summary.totalSamples} · TB {formatSignedPercent(summary.avgReturnPct)} · Trung vị {formatSignedPercent(summary.medianReturnPct)}</div>
                {(summary.baselineName || summary.lift != null) && (
                  <div className="mt-1 text-xs text-slate-400"><GlossaryTerm term="baseline">Baseline</GlossaryTerm> {summary.baselineName || "đã khai báo"} · <GlossaryTerm term="lift">lift</GlossaryTerm> {formatLift(summary.lift, summary.liftUnit) || "chưa đủ mẫu"}</div>
                )}
              </div>
            ))}
          </div>}

          {!canShowNeighborEvidence ? null : data.items.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-400">
              Không tìm thấy analog lịch sử độc lập cho cấu hình này.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.items.map((item) => <AnalogCard key={item.windowId} item={item} windowSize={data.windowSize} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Analog pagination" className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                aria-label="Trang trước"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-400">{firstIndex}–{lastIndex} / {data.total} · Trang {page}/{totalPages}</span>
              <button
                type="button"
                aria-label="Trang sau"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page === totalPages || loading}
                className="rounded-lg bg-slate-800/60 p-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}

          <footer className="flex items-start gap-2 rounded-lg bg-slate-800/30 p-3 text-xs leading-5 text-slate-300">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
            <span><GlossaryTerm term="close-to-close">Close-to-close</GlossaryTerm> = (giá đóng sau N nến / giá đóng cuối cửa sổ − 1) × 100%. <GlossaryTerm term="shape-similarity">Shape similarity</GlossaryTerm> và <GlossaryTerm term="context-similarity">context similarity</GlossaryTerm> là hai phép đo riêng; cả hai không phải xác suất dự báo.</span>
          </footer>
        </>
      ) : data ? (
        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-slate-400/20 bg-slate-400/5 px-4 text-center">
          <ShieldAlert className="h-6 w-6 text-slate-300" />
          <div className="text-sm font-bold text-slate-300">Chưa thể tạo cửa sổ Historical Analog</div>
          <p className="max-w-xl text-xs leading-5 text-slate-400">{data.validation.reason}</p>
        </div>
      ) : null}
    </section>
  );
}
