"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
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

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function ModuleHeader({
  title,
  meta,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex h-9 items-center justify-between gap-2 border-b border-slate-800 bg-slate-850/60 px-3">
      <span className="truncate text-[13px] font-semibold text-slate-200">{title}</span>
      {meta ? <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">{meta}</span> : null}
    </div>
  );
}

function AnalogRow({
  item,
  windowSize,
  expanded,
  onToggle,
}: {
  item: HistoricalAnalogItemDto;
  windowSize: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detailId = `analog-detail-${item.windowId}`;
  const primaryOutcome = item.outcomes[0] ?? null;
  return (
    <article data-testid="analog-card" className="border-b border-slate-800 last:border-b-0">
      <div className="flex w-full items-center gap-3 px-3 transition-colors hover:bg-slate-800/30">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
        >
          <span
            className={`w-8 shrink-0 font-mono text-[13px] font-bold tabular-nums ${
              item.rank === 1 ? "text-teal-400" : "text-slate-400"
            }`}
          >
            #{item.rank}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-xs font-medium tabular-nums text-slate-100">
              {formatDate(item.startTimeMs)} → {formatDate(item.endTimeMs)}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-slate-400">
              Kết thúc {formatTime(item.endTimeMs)} · {windowSize} nến nguồn
            </span>
            {/* Compact metrics shown only where metric columns are hidden */}
            <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] sm:hidden">
              <span className="text-slate-400">
                Hình: <span className="font-mono font-medium tabular-nums text-teal-300">{formatSimilarity(item.shapeSimilarity)}</span>
              </span>
              <span className="text-slate-400">
                Bối cảnh: <span className="font-mono tabular-nums text-slate-300">{formatSimilarity(item.contextSimilarity)}</span>
              </span>
              {primaryOutcome && (
                <span className="text-slate-400">
                  +{primaryOutcome.barsAhead}n:{" "}
                  <span className={`font-mono font-medium tabular-nums ${getDirectionTone(primaryOutcome.direction)}`}>
                    {formatSignedPercent(primaryOutcome.returnPct)}
                  </span>
                </span>
              )}
            </span>
          </span>
          <span className="hidden w-28 shrink-0 md:block" aria-hidden="true">
            <span className="block h-7">
              {item.ohlc.length > 0 && <ArchetypeGlyph bars={item.ohlc} />}
            </span>
          </span>
        </button>
        <span className="hidden w-24 shrink-0 flex-col py-2.5 text-right sm:flex">
          <span className="text-[10px] text-slate-500"><GlossaryTerm term="shape-similarity">Giống hình</GlossaryTerm></span>
          <span className="font-mono text-xs font-semibold tabular-nums text-teal-300">
            {formatSimilarity(item.shapeSimilarity)}
          </span>
        </span>
        <span className="hidden w-24 shrink-0 flex-col py-2.5 text-right lg:flex">
          <span className="text-[10px] text-slate-500"><GlossaryTerm term="context-similarity">Bối cảnh</GlossaryTerm></span>
          <span className="font-mono text-xs tabular-nums text-slate-300">
            {formatSimilarity(item.contextSimilarity)}
          </span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailId}
          aria-label={expanded ? "Thu gọn chi tiết analog" : "Mở chi tiết analog"}
          className="flex shrink-0 items-center gap-3 py-2.5"
        >
          <span className="hidden shrink-0 flex-wrap justify-end gap-x-3 gap-y-0.5 md:flex md:max-w-56">
            {item.outcomes.map((outcome) => (
              <span key={outcome.barsAhead} className="text-[11px] text-slate-400">
                +{outcome.barsAhead}n{" "}
                <span className={`font-mono font-medium tabular-nums ${getDirectionTone(outcome.direction)}`}>
                  {formatSignedPercent(outcome.returnPct)}
                </span>
              </span>
            ))}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded && (
        <div id={detailId} className="border-t border-slate-800/60 bg-slate-950/60 px-3 py-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[11px] text-slate-400">{windowSize} nến nguồn độc lập</div>
              <div className="h-24 rounded-sm border border-slate-800/60 bg-slate-950 p-1.5">
                {item.ohlc.length > 0 ? (
                  <ArchetypeGlyph bars={item.ohlc} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-rose-300">
                    Thiếu <GlossaryTerm term="ohlc">OHLC</GlossaryTerm> nguồn
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] text-slate-400">6 nến sau (chỉ để kiểm chứng)</div>
              <div className="h-24 rounded-sm border border-slate-800/60 bg-slate-950 p-1.5">
                {item.futureOhlc.length > 0 ? (
                  <ArchetypeGlyph bars={item.futureOhlc} />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-rose-300">Thiếu nến sau</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 border-t border-slate-800/60 pt-2 text-xs">
            {item.outcomes.map((outcome) => (
              <div key={outcome.barsAhead} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
                <span className="text-slate-400">Sau {outcome.barsAhead} nến</span>
                <span className={`font-mono font-semibold tabular-nums ${getDirectionTone(outcome.direction)}`}>
                  {getAnalogDirectionLabel(outcome.direction)} {formatSignedPercent(outcome.returnPct)}
                </span>
                <span className="font-mono tabular-nums text-slate-400">ngưỡng ±{outcome.thresholdPct.toFixed(2)}%</span>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-x-2 pt-1 text-slate-400">
              <span><GlossaryTerm term="context-similarity">Đặc trưng bối cảnh so sánh được</GlossaryTerm></span>
              <span className="text-right font-mono tabular-nums text-slate-300">{item.contextComparableFeatureCount}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 text-slate-400">
              <span><GlossaryTerm term="atr">ATR</GlossaryTerm> 14 (% giá)</span>
              <span className="text-right font-mono tabular-nums text-slate-300">{item.atr14Pct.toFixed(2)}%</span>
            </div>
          </div>

          {(item.ohlc.length !== windowSize || item.futureOhlc.length !== 6) && (
            <div className="mt-2 rounded-sm bg-rose-500/10 px-2 py-1 text-xs text-rose-300">
              Dữ liệu chưa đủ: {item.ohlc.length}/{windowSize} nến nguồn, {item.futureOhlc.length}/6 nến sau.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

const selectClass =
  "mt-1 h-10 w-full rounded-sm border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200 focus:border-teal-500/60 focus:outline-none";
const labelClass = "text-[11px] text-slate-400";

export function HistoricalAnalogView({ symbol, timeframeOptions, windowSizes }: HistoricalAnalogViewProps) {
  const [timeframe, setTimeframe] = useState<string>(DEFAULT_TIMEFRAME);
  const [windowSize, setWindowSize] = useState(15);
  const [neighborCount, setNeighborCount] = useState(30);
  const [roundTripCostPct, setRoundTripCostPct] = useState(0.30);
  const [atrMultiplier, setAtrMultiplier] = useState(0.25);
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    <section role="region" aria-label="Historical Analog Explorer" className="space-y-3">
      {/* Header + compact filter strip */}
      <div className="rounded border border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              <Search className="h-4 w-4 text-teal-400" aria-hidden="true" />
              <GlossaryTerm term="analog">Historical Analog</GlossaryTerm>
            </h2>
            <CapabilityStateBadge state={capabilityState} />
            <span className="text-[11px] font-semibold text-slate-400">
              <GlossaryTerm term="oos-gate">Chưa qua OOS gate</GlossaryTerm>
            </span>
            {freshness?.status === "stale" && (
              <span className="rounded-sm bg-rose-400/10 px-1.5 py-0.5 text-[11px] font-bold text-rose-300">
                <GlossaryTerm term="stale">STALE</GlossaryTerm>
              </span>
            )}
            {data?.validation.status === "unavailable" && (
              <span className="rounded-sm bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-bold text-slate-400">
                <GlossaryTerm term="unavailable">UNAVAILABLE</GlossaryTerm>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            disabled={loading}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-sm border border-slate-800 px-2.5 text-[11px] font-semibold text-teal-300 hover:bg-teal-500/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" /> Làm mới truy vấn
          </button>
        </div>
        <div className="space-y-1 border-b border-slate-800 px-3 py-2 text-xs leading-5 text-slate-400">
          <p>
            Lấy cửa sổ nến hiện tại làm truy vấn, tìm các đoạn lịch sử giống nhất rồi loại mẫu chồng lấn.
            Kết quả là bằng chứng nghiên cứu, không phải khuyến nghị hay tín hiệu giao dịch.
          </p>
          <p className="font-semibold text-slate-300">
            Xếp hạng chỉ theo hình dạng; bối cảnh chỉ để đối chiếu, không tham gia xếp hạng.
          </p>
          {data && (
            <p className="font-mono tabular-nums">
              <GlossaryTerm term="method-version">Method</GlossaryTerm>: {data.methodVersion || data.method} · <GlossaryTerm term="freshness">freshness</GlossaryTerm> {freshness?.status ?? "unknown"}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-3 xl:grid-cols-5">
          <label className={labelClass}>
            Timeframe
            <select
              aria-label="Timeframe analog"
              value={timeframe}
              onChange={(event) => resetPage(() => setTimeframe(event.target.value))}
              className={selectClass}
            >
              {timeframeOptions.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Số nến truy vấn
            <select
              aria-label="Số nến truy vấn analog"
              value={windowSize}
              onChange={(event) => resetPage(() => setWindowSize(Number(event.target.value)))}
              className={selectClass}
            >
              {windowSizes.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Số analog (20–50)
            <select
              aria-label="Số analog lịch sử"
              value={neighborCount}
              onChange={(event) => resetPage(() => setNeighborCount(Number(event.target.value)))}
              className={selectClass}
            >
              {[20, 30, 50].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Ngưỡng chi phí tham chiếu
            <select
              aria-label="Chi phí khứ hồi"
              value={roundTripCostPct}
              onChange={(event) => resetPage(() => setRoundTripCostPct(Number(event.target.value)))}
              className={selectClass}
            >
              {[0.15, 0.30, 0.45].map((value) => <option key={value} value={value}>{value.toFixed(2)}%</option>)}
            </select>
          </label>
          <label className={`col-span-2 sm:col-span-1 ${labelClass}`}>
            Bộ lọc nhiễu ATR
            <select
              aria-label="Bộ lọc nhiễu ATR"
              value={atrMultiplier}
              onChange={(event) => resetPage(() => setAtrMultiplier(Number(event.target.value)))}
              className={selectClass}
            >
              {[0.15, 0.25, 0.4].map((value) => <option key={value} value={value}>{value.toFixed(2)} × ATR</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Amber experimental / OOS caveat strip */}
      {data && data.validation.status !== "validated" && (
        <div role="status" className="flex items-start gap-2 rounded-sm border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs leading-5 text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>
            Kết quả tương tự lịch sử — không phải xác suất dự đoán đã hiệu chỉnh. Tần suất xuất hiện trong quá khứ không đồng nghĩa với xác suất xảy ra trong tương lai. {data.validation.reason}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded border border-slate-800 bg-slate-900 text-sm text-slate-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin text-teal-400" aria-hidden="true" /> Đang tìm analog độc lập…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-80 flex-col items-center justify-center gap-3 rounded border border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="h-10 rounded-sm px-3 text-xs font-bold hover:bg-rose-500/10">
            Thử lại Historical Analog
          </button>
        </div>
      ) : data?.query ? (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            {/* Primary region: query chart + candidate list */}
            <div className="flex flex-col gap-3 lg:col-span-2">
              <div className="overflow-hidden rounded border border-slate-800 bg-slate-900">
                <ModuleHeader
                  title={`Cửa sổ nến truy vấn hiện tại · ${symbol} ${timeframe} · ${data.windowSize} nến`}
                  meta={<>{data.query.context.availableFeatureCount} đặc trưng bối cảnh có sẵn</>}
                />
                <div className="px-3 pt-2 font-mono text-[11px] tabular-nums text-slate-500">
                  {formatTime(data.query.startTimeMs)} → {formatTime(data.query.endTimeMs)}
                </div>
                <div className="p-3">
                  <div
                    className="h-56 rounded-sm border border-slate-800/60 bg-slate-950 p-2"
                    data-testid="analog-query-window"
                  >
                    <ArchetypeGlyph bars={data.query.ohlc} />
                  </div>
                </div>
              </div>

              {canShowNeighborEvidence && (
                <div className="rounded border border-slate-800 bg-slate-900">
                  <ModuleHeader
                    title="Các analog lịch sử độc lập"
                    meta={data.items.length > 0 ? `Hiển thị ${firstIndex}–${lastIndex} / ${data.total}` : `0 / ${data.total}`}
                  />
                  {data.items.length === 0 ? (
                    <div className="flex min-h-40 items-center justify-center text-sm text-slate-400">
                      Không tìm thấy analog lịch sử độc lập cho cấu hình này.
                    </div>
                  ) : (
                    <>
                      {/* Column labels */}
                      <div className="hidden items-center gap-3 border-b border-slate-800 px-3 py-1.5 text-[11px] text-slate-500 sm:flex">
                        <span className="w-8 shrink-0">Hạng</span>
                        <span className="min-w-0 flex-1">Khoảng thời gian lịch sử</span>
                        <span className="hidden w-28 shrink-0 md:block">Dạng nến</span>
                        <span className="w-24 shrink-0 text-right"><GlossaryTerm term="shape-similarity">Giống hình</GlossaryTerm></span>
                        <span className="hidden w-24 shrink-0 text-right lg:block"><GlossaryTerm term="context-similarity">Bối cảnh</GlossaryTerm></span>
                        <span className="hidden shrink-0 text-right md:block">Kết quả sau n nến</span>
                        <span className="w-4 shrink-0" aria-hidden="true" />
                      </div>
                      <div>
                        {data.items.map((item) => (
                          <AnalogRow
                            key={item.windowId}
                            item={item}
                            windowSize={data.windowSize}
                            expanded={expandedId === item.windowId}
                            onToggle={() =>
                              setExpandedId((current) => (current === item.windowId ? null : item.windowId))
                            }
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <nav aria-label="Analog pagination" className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-800 px-3 py-2">
                          <button
                            type="button"
                            aria-label="Trang trước"
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            disabled={page === 1 || loading}
                            className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <span className="font-mono text-[11px] tabular-nums text-slate-400">
                            {firstIndex}–{lastIndex} / {data.total} · Trang {page}/{totalPages}
                          </span>
                          <button
                            type="button"
                            aria-label="Trang sau"
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                            disabled={page === totalPages || loading}
                            className="flex h-10 w-10 items-center justify-center rounded-sm border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Secondary panels */}
            <aside className="flex flex-col gap-3">
              <div className="rounded border border-slate-800 bg-slate-900">
                <ModuleHeader title="Độ đầy đủ mẫu" />
                {data.validation.status === "validated" && (
                  <div className="mx-3 mt-2 flex items-start gap-2 rounded-sm border border-slate-800 bg-slate-950 p-2 text-xs leading-5 text-slate-300">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{data.validation.reason}</span>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-3 gap-px border-y border-slate-800 bg-slate-800/40 text-center">
                  <div className="bg-slate-900 px-2 py-2.5">
                    <div className="font-mono text-lg font-semibold tabular-nums text-slate-200">{data.rawCandidateCount}</div>
                    <div className="text-[11px] text-slate-400">Ứng viên thô</div>
                  </div>
                  <div className="bg-slate-900 px-2 py-2.5">
                    <div className="font-mono text-lg font-semibold tabular-nums text-slate-200">{data.independentCandidateCount}</div>
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="non-overlapping">Sau loại chồng lấn</GlossaryTerm></div>
                  </div>
                  <div className="bg-slate-900 px-2 py-2.5">
                    <div className="font-mono text-lg font-semibold tabular-nums text-teal-300">{data.effectiveSampleCount}</div>
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="effective-sample">Mẫu hiệu lực</GlossaryTerm></div>
                  </div>
                </div>
                <p className="px-3 py-2 text-[11px] leading-4 text-slate-400">
                  <GlossaryTerm term="exclusion-zone">Vùng loại trừ</GlossaryTerm>: <span className="font-mono tabular-nums">{data.exclusionBars}</span> nến. TRUNG TÍNH khi |return| không vượt ngưỡng lớn hơn giữa <GlossaryTerm term="round-trip-cost">tham chiếu chi phí</GlossaryTerm> <span className="font-mono tabular-nums">{data.roundTripCostPct.toFixed(2)}%</span> và <span className="font-mono tabular-nums">{data.atrMultiplier.toFixed(2)}</span> × <GlossaryTerm term="atr">ATR</GlossaryTerm>. Đây là ngưỡng phân loại, không phải chi phí đã trừ khỏi <GlossaryTerm term="pnl">PnL</GlossaryTerm>.
                </p>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900">
                <ModuleHeader title={<>Bằng chứng <GlossaryTerm term="evaluator">evaluator</GlossaryTerm></>} />
                <div className="grid grid-cols-2 gap-px bg-slate-800/40 text-xs">
                  <div className="bg-slate-900 px-3 py-2">
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="baseline">Baseline</GlossaryTerm></div>
                    <div className="mt-0.5 font-medium text-slate-200">{data.baselineName || "Chưa cung cấp"}</div>
                  </div>
                  <div className="bg-slate-900 px-3 py-2">
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="lift">Lift</GlossaryTerm> so <GlossaryTerm term="baseline">baseline</GlossaryTerm></div>
                    <div className="mt-0.5 font-mono font-medium tabular-nums text-slate-200">{lift ?? "Chưa cung cấp"}</div>
                  </div>
                  <div className="bg-slate-900 px-3 py-2">
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="coverage">Coverage</GlossaryTerm></div>
                    <div className="mt-0.5 font-mono font-medium tabular-nums text-slate-200">{coverage ?? "Chưa cung cấp"}</div>
                  </div>
                  <div className="bg-slate-900 px-3 py-2">
                    <div className="text-[11px] text-slate-400"><GlossaryTerm term="abstention">Abstention</GlossaryTerm></div>
                    <div className="mt-0.5 font-mono font-medium tabular-nums text-slate-200">{abstentionRate ?? "Chưa cung cấp"}</div>
                  </div>
                </div>
                {data.liftConfidenceInterval && (
                  <div className="border-t border-slate-800 px-3 py-2 font-mono text-[11px] tabular-nums text-slate-400">
                    <GlossaryTerm term="ci">CI</GlossaryTerm>{data.liftConfidenceInterval.level ? ` ${(data.liftConfidenceInterval.level * 100).toFixed(0)}%` : ""}: {formatLift(data.liftConfidenceInterval.lower, data.liftUnit)} → {formatLift(data.liftConfidenceInterval.upper, data.liftUnit)}
                  </div>
                )}
              </div>

              {canShowNeighborEvidence && data.summaries.length > 0 && (
                <div className="rounded border border-slate-800 bg-slate-900" data-testid="analog-summary">
                  <ModuleHeader title="Tần suất kết quả sau đối soát" meta={`Mẫu hiệu lực: ${data.effectiveSampleCount}`} />
                  <div>
                    {data.summaries.map((summary) => (
                      <div key={summary.barsAhead} className="border-b border-slate-800 px-3 py-2.5 last:border-b-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-300">Sau {summary.barsAhead} nến</span>
                          <span className={`text-xs font-bold ${getDirectionTone(summary.dominantDirection)}`}>
                            {getAnalogDirectionLabel(summary.dominantDirection)}
                          </span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-3 gap-1 text-center text-[11px] font-mono tabular-nums">
                          <span className="text-emerald-400">Tăng {(summary.upRate * 100).toFixed(1)}%</span>
                          <span className="text-slate-300">Trung tính {(summary.neutralRate * 100).toFixed(1)}%</span>
                          <span className="text-rose-400">Giảm {(summary.downRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Tần suất theo hướng · <GlossaryTerm term="n">N</GlossaryTerm>=<span className="font-mono tabular-nums">{summary.totalSamples}</span> · TB <span className="font-mono tabular-nums">{formatSignedPercent(summary.avgReturnPct)}</span> · Trung vị <span className="font-mono tabular-nums">{formatSignedPercent(summary.medianReturnPct)}</span>
                        </div>
                        {(summary.baselineName || summary.lift != null) && (
                          <div className="mt-1 text-[11px] text-slate-400">
                            <GlossaryTerm term="baseline">Baseline</GlossaryTerm> {summary.baselineName || "đã khai báo"} · <GlossaryTerm term="lift">lift</GlossaryTerm> <span className="font-mono tabular-nums">{formatLift(summary.lift, summary.liftUnit) || "chưa đủ mẫu"}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>

          {data.abstained && (
            <div role="status" className="rounded-sm border border-amber-400/30 bg-amber-400/5 px-3 py-2.5 text-xs text-amber-200">
              Hệ thống đã <GlossaryTerm term="abstain">abstain</GlossaryTerm>: {data.abstentionReason || "chất lượng analog không đạt ngưỡng đã khai báo"}. Không diễn giải các tần suất bên dưới như bằng chứng dự báo.
            </div>
          )}

          <footer className="flex items-start gap-2 rounded-sm border border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-300">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span><GlossaryTerm term="close-to-close">Close-to-close</GlossaryTerm> = (giá đóng sau N nến / giá đóng cuối cửa sổ − 1) × 100%. <GlossaryTerm term="shape-similarity">Shape similarity</GlossaryTerm> và <GlossaryTerm term="context-similarity">context similarity</GlossaryTerm> là hai phép đo riêng; cả hai không phải xác suất dự báo.</span>
          </footer>
        </>
      ) : data ? (
        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-2 rounded border border-slate-400/20 bg-slate-400/5 px-4 text-center">
          <ShieldAlert className="h-6 w-6 text-slate-300" aria-hidden="true" />
          <div className="text-sm font-bold text-slate-300">Chưa thể tạo cửa sổ Historical Analog</div>
          <p className="max-w-xl text-xs leading-5 text-slate-400">{data.validation.reason}</p>
        </div>
      ) : null}
    </section>
  );
}
