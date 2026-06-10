"use client";

import { useEffect, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { NewsItem } from "@/lib/types";
import { getNews } from "@/lib/api";

function stripHtml(raw: string): string {
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NewsScreen() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNews({ page: 1, pageSize: 12 });
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
          className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <RefreshCw className="animate-spin w-6 h-6 mr-2" /> Đang tải tin…
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900 text-rose-200 text-sm text-center">
          {error}
          <div className="mt-3">
            <button onClick={() => void load()} className="px-3 py-1.5 rounded bg-rose-900/50 hover:bg-rose-900 text-sm">
              Thử lại
            </button>
          </div>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-12">
          Chưa có bài. Khởi động PostgreSQL và RSS worker.
        </p>
      )}

      <div className="space-y-3">
        {items.map((n) => {
          const summary = n.summary ? stripHtml(n.summary) : null;
          return (
            <a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-900 transition-colors p-4"
            >
              <h3 className="text-sm font-semibold text-gray-100">{n.title}</h3>
              <p className="text-[11px] text-gray-500 mt-1">
                {n.source}
                {n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleString()}` : ""}
              </p>
              {summary && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">{summary}</p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
