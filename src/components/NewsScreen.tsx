"use client";

import { useEffect, useState, useMemo } from "react";
import { Newspaper, RefreshCw, Filter } from "lucide-react";
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

function getSourceColorClass(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("coindesk")) return "bg-slate-800 text-slate-300";
  if (s.includes("cointelegraph")) return "bg-slate-800 text-slate-300";
  if (s.includes("decrypt")) return "bg-emerald-500/20 text-emerald-400";
  if (s.includes("theblock") || s.includes("the block")) return "bg-slate-500/20 text-slate-400";
  if (s.includes("bitcoinmagazine") || s.includes("bitcoin magazine")) return "bg-slate-800 text-slate-300";
  return "bg-slate-500/20 text-slate-400";
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="text-teal-400" />
            Tin tức
          </h2>
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
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <button
            onClick={() => setSelectedSource(null)}
            className={`shrink-0 py-1 font-medium transition-colors border-b-2 ${
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
              className={`shrink-0 py-1 font-medium transition-colors border-b-2 ${
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
        <div className="rounded bg-amber-950/20 px-4 py-2.5 text-xs text-amber-300">
          Nguồn tin đã ngừng cập nhật ({formatDataAge(newestPublishedAt)}). Không dùng danh sách này như tin tức hiện tại.
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded bg-slate-800/40 px-4 py-2.5 text-xs text-slate-400">
          Chưa có bài viết nào — RSS ingestion worker hoặc PostgreSQL chưa chạy.
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map((n) => {
          const summary = n.summary ? stripHtml(n.summary) : null;
          return (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-slate-800/60 bg-slate-900/40 hover:border-teal-500/30 hover:bg-slate-900/80 transition-all duration-200 p-5 group"
            >
              <div className="flex justify-between items-start mb-2 gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getSourceColorClass(n.source)}`}>
                  {n.source}
                </span>
                <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 group-hover:text-slate-400 transition-colors">
                  {getRelativeTime(n.publishedAt)}
                </span>
              </div>
              
              <h3 className="text-[15px] font-semibold text-slate-100 group-hover:text-teal-400 transition-colors leading-snug">
                {n.title}
              </h3>
              
              {summary && (
                <p className="text-[13px] text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {summary}
                </p>
              )}
            </a>
          );
        })}
      </div>
      
      {!loading && filteredItems.length > 0 && selectedSource !== null && filteredItems.length < items.filter(i => i.source === selectedSource).length && (
        <p className="text-center text-xs text-slate-400 pt-2">
          Hiển thị {filteredItems.length} bài mới nhất từ {selectedSource}.
        </p>
      )}
    </div>
  );
}
