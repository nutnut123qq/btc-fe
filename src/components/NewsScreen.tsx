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
  if (s.includes("coindesk")) return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
  if (s.includes("cointelegraph")) return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
  if (s.includes("decrypt")) return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  if (s.includes("theblock") || s.includes("the block")) return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
  if (s.includes("bitcoinmagazine") || s.includes("bitcoin magazine")) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
  return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
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
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Newspaper className="text-teal-400" />
          Tin tức
        </h2>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {sources.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <button
            onClick={() => setSelectedSource(null)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSource === null 
                ? "bg-teal-600 text-white" 
                : "bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800"
            }`}
          >
            Tất cả
          </button>
          {sources.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSource(s)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSource === s 
                  ? "bg-teal-600 text-white" 
                  : "bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <RefreshCw className="animate-spin w-6 h-6 mr-2" /> Đang tải tin…
        </div>
      )}
      
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900 text-rose-200 text-sm text-center">
          {error}
          <div className="mt-3">
            <button onClick={() => void load()} className="px-3 py-1.5 rounded bg-rose-900/50 hover:bg-rose-900 text-sm transition-colors">
              Thử lại
            </button>
          </div>
        </div>
      )}

      {!loading && !error && newestPublishedAt && isDataStale(newestPublishedAt, 6 * 60 * 60_000) && (
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-3 text-sm text-amber-300">
          Nguồn tin đã ngừng cập nhật ({formatDataAge(newestPublishedAt)}). Không dùng danh sách này như tin tức hiện tại.
        </div>
      )}
      
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-900/40 rounded-xl border border-gray-800 border-dashed">
          <Newspaper className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">
            Chưa có bài viết nào.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Vui lòng kiểm tra RSS worker và PostgreSQL.
          </p>
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
              className="block rounded-xl border border-gray-800/60 bg-gray-900/40 hover:border-teal-500/30 hover:bg-gray-900/80 transition-all duration-200 p-4 group"
            >
              <div className="flex justify-between items-start mb-2 gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${getSourceColorClass(n.source)}`}>
                  {n.source}
                </span>
                <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0 group-hover:text-gray-400 transition-colors">
                  {getRelativeTime(n.publishedAt)}
                </span>
              </div>
              
              <h3 className="text-[15px] font-semibold text-gray-100 group-hover:text-teal-400 transition-colors leading-snug">
                {n.title}
              </h3>
              
              {summary && (
                <p className="text-[13px] text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">
                  {summary}
                </p>
              )}
            </a>
          );
        })}
      </div>
      
      {!loading && filteredItems.length > 0 && selectedSource !== null && filteredItems.length < items.filter(i => i.source === selectedSource).length && (
        <p className="text-center text-xs text-gray-500 pt-2">
          Hiển thị {filteredItems.length} bài mới nhất từ {selectedSource}.
        </p>
      )}
    </div>
  );
}
