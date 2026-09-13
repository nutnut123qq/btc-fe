"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Database, RefreshCw } from "lucide-react";
import { getArchetypeOccurrences } from "@/lib/api";
import {
  getDominantOutcomeLabel,
  getOutcomeLabelText,
  isWinningOccurrence,
} from "@/lib/archetypeEvidence";
import type { ArchetypeDto, ArchetypeOccurrenceDto } from "@/lib/types";
import { ArchetypeGlyph } from "./ArchetypeGlyph";

const PAGE_SIZE = 8;

interface ArchetypeEvidencePanelProps {
  archetype: ArchetypeDto;
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

function EvidenceCard({
  occurrence,
  index,
  dominantLabel,
  windowSize,
}: {
  occurrence: ArchetypeOccurrenceDto;
  index: number;
  dominantLabel: -1 | 0 | 1 | null;
  windowSize: number;
}) {
  const won = occurrence.outcomeAvailable
    ? isWinningOccurrence(occurrence.label, dominantLabel)
    : null;
  const bars = occurrence.ohlc ?? [];
  const complete = occurrence.ohlcComplete === true && bars.length === windowSize;
  const outcomeText = occurrence.outcomeAvailable ? getOutcomeLabelText(occurrence.label) : "CHƯA CÓ";
  const outcomeColor = !occurrence.outcomeAvailable
    ? "text-gray-400"
    : occurrence.label === 1
      ? "text-emerald-400"
      : occurrence.label === -1
        ? "text-rose-400"
        : "text-amber-400";

  return (
    <article className="rounded-lg border border-gray-800 bg-gray-900 p-2.5" data-testid="archetype-evidence-card">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-gray-300">Mẫu #{index}</div>
          <time className="text-[10px] text-gray-500" dateTime={new Date(occurrence.windowEndMs).toISOString()}>
            {formatTime(occurrence.windowEndMs)}
          </time>
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
            won === true
              ? "bg-emerald-500/15 text-emerald-400"
              : won === false
                ? "bg-rose-500/15 text-rose-400"
                : "bg-gray-700 text-gray-300"
          }`}
        >
          {won === true ? "THẮNG" : won === false ? "THUA" : "CHƯA XẾP"}
        </span>
      </div>

      <div className="h-20 rounded bg-gray-950 p-1.5">
        {bars.length > 0 ? (
          <ArchetypeGlyph bars={bars} />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-rose-300">Thiếu OHLC</div>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
        <span className="text-gray-500">Thực tế</span>
        <span className={`text-right font-bold ${outcomeColor}`}>{outcomeText}</span>
        <span className="text-gray-500">Lợi nhuận</span>
        <span className={`text-right font-semibold ${(occurrence.targetReturn ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {!occurrence.outcomeAvailable || occurrence.targetReturn == null ? "—" : `${occurrence.targetReturn.toFixed(2)}%`}
        </span>
        <span className="text-gray-500">Khoảng cách</span>
        <span className="text-right text-gray-300">{occurrence.distanceToCentroid.toFixed(3)}</span>
      </div>

      {!complete && (
        <div className="mt-2 rounded bg-rose-500/10 px-2 py-1 text-[9px] text-rose-300">
          OHLC không đủ: {bars.length}/{windowSize} nến — không che giấu dữ liệu thiếu
        </div>
      )}
    </article>
  );
}

export function ArchetypeEvidencePanel({ archetype }: ArchetypeEvidencePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    items: ArchetypeOccurrenceDto[];
    total: number;
    error: string | null;
  }>({ key: "", items: [], total: 0, error: null });
  const horizon = archetype.bestOutcome?.horizon ?? "4h";
  const dominantLabel = useMemo(
    () => getDominantOutcomeLabel(archetype.bestOutcome),
    [archetype.bestOutcome],
  );

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let current = true;
    const requestKey = `${archetype.id}:${horizon}:${page}:${retryKey}`;

    getArchetypeOccurrences(archetype.id, { horizon, page, pageSize: PAGE_SIZE })
      .then((response) => {
        if (!current) return;
        setResult({ key: requestKey, items: response.items, total: response.total, error: null });
      })
      .catch((cause) => {
        if (!current) return;
        console.error(cause);
        setResult({ key: requestKey, items: [], total: 0, error: "Không tải được các mẫu nến gốc." });
      });

    return () => {
      current = false;
    };
  }, [archetype.id, horizon, page, retryKey, visible]);

  const requestKey = `${archetype.id}:${horizon}:${page}:${retryKey}`;
  const loading = !visible || result.key !== requestKey;
  const items = result.key === requestKey ? result.items : [];
  const total = result.key === requestKey ? result.total : 0;
  const error = result.key === requestKey ? result.error : null;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastIndex = Math.min(page * PAGE_SIZE, total);
  const dominantText = dominantLabel == null ? "CHƯA CÓ" : getOutcomeLabelText(dominantLabel);

  return (
    <section ref={rootRef} className="lg:col-span-2 rounded-xl border border-gray-800 bg-gray-950 p-4" aria-label={`Mẫu gốc của ${archetype.archetypeCode}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-gray-800 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-200">
            <Database className="h-4 w-4 text-teal-400" />
            Các mẫu nến gốc tạo thành {archetype.archetypeCode}
          </h3>
          <p className="mt-1 text-[11px] text-gray-500">
            Horizon {horizon} · hướng chủ đạo <span className="font-bold text-teal-300">{dominantText}</span> · THẮNG khi hướng thực tế trùng hướng chủ đạo.
          </p>
        </div>
        {total > 0 && (
          <div className="text-right text-[11px] text-gray-400">
            <div>{firstIndex}–{lastIndex} / {total} mẫu</div>
            <div className="text-gray-600">Nguồn OHLC: Klines</div>
          </div>
        )}
      </div>

      {!visible || loading ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin text-teal-500" /> Đang tải bằng chứng gốc…
        </div>
      ) : error ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-rose-300">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="rounded border border-rose-400/30 px-3 py-1.5 text-xs">
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
          Không có mẫu gốc tại horizon {horizon}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((occurrence, itemIndex) => (
              <EvidenceCard
                key={`${occurrence.windowStartMs}-${horizon}`}
                occurrence={occurrence}
                index={(page - 1) * PAGE_SIZE + itemIndex + 1}
                dominantLabel={dominantLabel}
                windowSize={archetype.windowSize}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-3 flex items-center justify-center gap-3 border-t border-gray-800 pt-3" aria-label="Phân trang mẫu nến gốc">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page === 1 || loading}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-300 hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-400">Trang {page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page === totalPages || loading}
                className="rounded-lg border border-gray-700 p-1.5 text-gray-300 hover:border-teal-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
