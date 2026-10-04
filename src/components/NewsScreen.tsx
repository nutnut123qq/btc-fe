"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { getNews } from "@/lib/api";
import { formatDataAge, isDataStale } from "@/lib/freshness";

function stripHtml(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "vừa xong";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} tháng trước`;
}

function getMonogram(source: string): string {
  const parts = source
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function NewsScreen() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNews({ page: 1, pageSize: 50 }); // Fetch more for filtering
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "News load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sources = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => {
      if (i.source) s.add(i.source);
    });
    return Array.from(s).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!selectedSource) return items.slice(0, 20); // Limit default view
    return items.filter(i => i.source === selectedSource).slice(0, 20);
  }, [items, selectedSource]);

  const newestPublishedAt = useMemo(() => items
    .map((item) => item.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null, [items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-100">Tin tức</h2>
          <p className="hidden sm:block truncate text-xs text-slate-400">Feed RSS đã ingest; mở bài gốc ở nguồn.</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {sources.length > 0 && (
        <div className="flex items-center gap-5 overflow-x-auto border-b border-slate-800 text-xs">
          <button
            onClick={() => setSelectedSource(null)}
            className={`shrink-0 -mb-px py-2 font-medium transition-colors border-b-2 ${
              selectedSource === null
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Tất cả
          </button>
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSource(s)}
              className={`shrink-0 -mb-px py-2 font-medium transition-colors border-b-2 ${
                selectedSource === s
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <RefreshCw className="animate-spin w-6 h-6 mr-2" /> Đang tải tin…
        </div>
      )}

      {error && (
        <div className="rounded bg-rose-950/30 px-4 py-2.5 text-xs text-rose-200">
          {error}
          <button onClick={() => void load()} className="ml-3 rounded bg-rose-900/50 px-2.5 py-1 hover:bg-rose-900 transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && newestPublishedAt && isDataStale(newestPublishedAt, 6 * 60 * 60_000) && (
        <div className="flex items-center gap-2 rounded bg-amber-950/20 px-4 py-2.5 text-xs text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="min-w-0">Nguồn tin đã ngừng cập nhật ({formatDataAge(newestPublishedAt)}). Không dùng danh sách này như tin tức hiện tại.</span>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded bg-slate-800/40 px-4 py-2.5 text-xs text-slate-400">
          Chưa có bài viết nào — RSS ingestion worker hoặc PostgreSQL chưa chạy.
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className="divide-y divide-slate-800 border-y border-slate-800">
          {filteredItems.map((n) => {
            const summary = n.summary ? stripHtml(n.summary) : null;
            const rel = getRelativeTime(n.publishedAt);
            return (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 py-3.5 sm:gap-4 sm:py-4"
              >
                <div
                  aria-hidden="true"
                  className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md border border-slate-800 bg-slate-900 sm:h-[72px] sm:w-28"
                >
                  <span className="font-mono text-xs font-medium tracking-wide text-slate-500 sm:text-sm">
                    {getMonogram(n.source)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="min-w-0 truncate text-xs font-medium text-slate-400">{n.source}</span>
                    <span className="hidden text-slate-600 sm:inline">·</span>
                    <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-[11px] text-slate-500 tabular-nums sm:ml-0">
                      {rel || "—"}
                    </span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-100 transition-colors group-hover:text-teal-300 sm:text-sm">
                    {n.title}
                  </h3>
                  {summary && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400 sm:text-[13px]">
                      {summary}
                    </p>
                  )}
                </div>
                <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-600 transition-colors group-hover:text-teal-400" />
              </a>
            );
          })}
        </div>
      )}
      
      {!loading && filteredItems.length > 0 && selectedSource !== null && filteredItems.length < items.filter(i => i.source === selectedSource).length && (
        <p className="text-center text-xs text-slate-400 pt-2">
          Hiển thị {filteredItems.length} bài mới nhất từ {selectedSource}.
        </p>
      )}
    </div>
  );
}
