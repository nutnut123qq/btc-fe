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
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";
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
      className="rounded-xl border border-gray-800 bg-gray-950 p-3"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-black text-gray-200">#{item.rank} · Analog lịch sử</div>
          <time className="text-[10px] text-gray-500" dateTime={new Date(item.endTimeMs).toISOString()}>
            Kết thúc {formatTime(item.endTimeMs)}
          </time>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-1 text-[9px] font-bold text-indigo-300">
          NGHIÊN CỨU
        </span>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2 text-[10px]">
        <div>
          <div className="text-gray-500">Giống hình nến</div>
          <div className="font-bold text-teal-300">{formatSimilarity(item.shapeSimilarity)}</div>
        </div>
        <div>
          <div className="text-gray-500">Giống bối cảnh</div>
          <div className="font-bold text-sky-300">{formatSimilarity(item.contextSimilarity)}</div>
          <div className="text-[9px] text-gray-600">{item.contextComparableFeatureCount} đặc trưng so sánh được</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-[9px] text-gray-500">{windowSize} nến nguồn độc lập</div>
          <div className="h-24 rounded bg-gray-900 p-1.5">
            {item.ohlc.length > 0 ? (
              <ArchetypeGlyph bars={item.ohlc} />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-rose-300">Thiếu OHLC nguồn</div>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 text-[9px] text-gray-500">6 nến sau (chỉ để kiểm chứng)</div>
          <div className="h-24 rounded bg-gray-900 p-1.5">
            {item.futureOhlc.length > 0 ? (
              <ArchetypeGlyph bars={item.futureOhlc} />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-rose-300">Thiếu nến sau</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-1 border-t border-gray-800 pt-2 text-[10px]">
        {item.outcomes.map((outcome) => (
          <div key={outcome.barsAhead} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-1">
            <span className="text-gray-500">Sau {outcome.barsAhead} nến</span>
            <span className={`font-bold ${getDirectionTone(outcome.direction)}`}>
              {getAnalogDirectionLabel(outcome.direction)} {formatSignedPercent(outcome.returnPct)}
            </span>
            <span className="text-gray-500">ngưỡng ±{outcome.thresholdPct.toFixed(2)}%</span>
          </div>
        ))}
      </div>

      {(item.ohlc.length !== windowSize || item.futureOhlc.length !== 6) && (
        <div className="mt-2 rounded bg-rose-500/10 px-2 py-1 text-[9px] text-rose-300">
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
  const [roundTripCostPct, setRoundTripCostPct] = useState(0.15);
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

  const resetPage = (change: () => void) => {
    change();
    setPage(1);
  };

  return (
    <section
      role="region"
      aria-label="Historical Analog Explorer"
      className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-4"
    >
      <header className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-base font-black text-gray-100">
              <Search className="h-5 w-5 text-teal-400" /> Historical Analog
            </h2>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-300">
              EXPERIMENTAL · CHƯA QUA OOS GATE
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-gray-400">
            Lấy cửa sổ nến hiện tại làm truy vấn, tìm các đoạn lịch sử giống nhất rồi loại mẫu chồng lấn.
            Kết quả là bằng chứng nghiên cứu, không phải khuyến nghị hay tín hiệu giao dịch.
          </p>
          <p className="mt-1 text-[11px] font-semibold text-sky-300">
            Xếp hạng chỉ theo hình dạng; bối cảnh chỉ để đối chiếu, không tham gia xếp hạng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRetryKey((value) => value + 1)}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-teal-500/40 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/10 disabled:opacity-50 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới truy vấn
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-800 bg-gray-950 p-3 sm:grid-cols-3 xl:grid-cols-5">
        <label className="text-[11px] text-gray-400">
          Timeframe
          <select
            aria-label="Timeframe analog"
            value={timeframe}
            onChange={(event) => resetPage(() => setTimeframe(event.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {timeframeOptions.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-gray-400">
          Số nến truy vấn
          <select
            aria-label="Số nến truy vấn analog"
            value={windowSize}
            onChange={(event) => resetPage(() => setWindowSize(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {windowSizes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-gray-400">
          Số analog (20–50)
          <select
            aria-label="Số analog lịch sử"
            value={neighborCount}
            onChange={(event) => resetPage(() => setNeighborCount(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {[20, 30, 50].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-gray-400">
          Chi phí khứ hồi
          <select
            aria-label="Chi phí khứ hồi"
            value={roundTripCostPct}
            onChange={(event) => resetPage(() => setRoundTripCostPct(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {[0.1, 0.15, 0.2].map((value) => <option key={value} value={value}>{value.toFixed(2)}%</option>)}
          </select>
        </label>
        <label className="col-span-2 text-[11px] text-gray-400 sm:col-span-1">
          Bộ lọc nhiễu ATR
          <select
            aria-label="Bộ lọc nhiễu ATR"
            value={atrMultiplier}
            onChange={(event) => resetPage(() => setAtrMultiplier(Number(event.target.value)))}
            className="mt-1 w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-100"
          >
            {[0.15, 0.25, 0.4].map((value) => <option key={value} value={value}>{value.toFixed(2)} × ATR</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-gray-400">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin text-teal-400" /> Đang tìm analog độc lập…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-sm text-rose-200">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs font-bold hover:bg-rose-500/10">
            Thử lại Historical Analog
          </button>
        </div>
      ) : data?.query ? (
        <>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-200">Cửa sổ truy vấn thật · {symbol} {timeframe}</h3>
                  <p className="text-[10px] text-gray-500">{formatTime(data.query.startTimeMs)} → {formatTime(data.query.endTimeMs)}</p>
                </div>
                <span className="text-[10px] text-gray-500">{data.query.context.availableFeatureCount} đặc trưng bối cảnh có sẵn</span>
              </div>
              <div className="h-40 rounded-lg bg-gray-900 p-2" data-testid="analog-query-window">
                <ArchetypeGlyph bars={data.query.ohlc} />
              </div>
            </div>

            <aside className="space-y-3 rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-2 text-[11px] text-amber-200">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{data.validation.reason}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="rounded-lg bg-gray-900 p-2"><div className="text-lg font-black text-gray-200">{data.rawCandidateCount}</div><div className="text-gray-500">Ứng viên thô</div></div>
                <div className="rounded-lg bg-gray-900 p-2"><div className="text-lg font-black text-sky-300">{data.independentCandidateCount}</div><div className="text-gray-500">Sau loại chồng lấn</div></div>
                <div className="rounded-lg bg-gray-900 p-2"><div className="text-lg font-black text-teal-300">{data.effectiveSampleCount}</div><div className="text-gray-500">Mẫu hiệu lực</div></div>
              </div>
              <p className="text-[10px] leading-4 text-gray-500">
                Vùng loại trừ: {data.exclusionBars} nến. TRUNG TÍNH khi |return| không vượt ngưỡng lớn hơn giữa chi phí {data.roundTripCostPct.toFixed(2)}% và {data.atrMultiplier.toFixed(2)} × ATR. Chưa gán nhãn hiệu quả giao dịch khi chưa qua kiểm định ngoài mẫu.
              </p>
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="analog-summary">
            {data.summaries.map((summary) => (
              <div key={summary.barsAhead} className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-300">Sau {summary.barsAhead} nến</span>
                  <span className={`text-xs font-black ${getDirectionTone(summary.dominantDirection)}`}>{getAnalogDirectionLabel(summary.dominantDirection)}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]">
                  <span className="rounded bg-emerald-500/10 px-1 py-1 text-emerald-300">Tăng {(summary.upRate * 100).toFixed(1)}%</span>
                  <span className="rounded bg-amber-500/10 px-1 py-1 text-amber-300">Trung tính {(summary.neutralRate * 100).toFixed(1)}%</span>
                  <span className="rounded bg-rose-500/10 px-1 py-1 text-rose-300">Giảm {(summary.downRate * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-2 text-[10px] text-gray-500">N={summary.totalSamples} · TB {formatSignedPercent(summary.avgReturnPct)} · Trung vị {formatSignedPercent(summary.medianReturnPct)}</div>
              </div>
            ))}
          </div>

          {data.items.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-sm text-gray-500">
              Không tìm thấy analog lịch sử độc lập cho cấu hình này.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.items.map((item) => <AnalogCard key={item.windowId} item={item} windowSize={data.windowSize} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Analog pagination" className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-800 pt-4">
              <button
                type="button"
                aria-label="Trang trước"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400">{firstIndex}–{lastIndex} / {data.total} · Trang {page}/{totalPages}</span>
              <button
                type="button"
                aria-label="Trang sau"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page === totalPages || loading}
                className="rounded-lg border border-gray-700 p-2 text-gray-300 hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}

          <footer className="flex items-start gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/5 p-3 text-[11px] leading-5 text-indigo-200">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Close-to-close = (giá đóng sau N nến / giá đóng cuối cửa sổ − 1) × 100%. Shape similarity và context similarity là hai phép đo riêng; cả hai không phải xác suất dự báo.</span>
          </footer>
        </>
      ) : data ? (
        <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 text-center">
          <ShieldAlert className="h-6 w-6 text-amber-300" />
          <div className="text-sm font-bold text-amber-200">Chưa thể tạo cửa sổ Historical Analog</div>
          <p className="max-w-xl text-xs leading-5 text-gray-400">{data.validation.reason}</p>
        </div>
      ) : null}
    </section>
  );
}
