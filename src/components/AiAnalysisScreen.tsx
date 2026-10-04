"use client";

import { useState } from "react";
import { Bot, RefreshCw, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { AiCapabilitiesDto, AnalysisResult } from "@/lib/types";
import { getBitcoinAnalysis } from "@/lib/api";
import { AI_ANALYSIS_SYMBOL, getLlmUiState } from "@/lib/researchUi";
import { SentimentBadge } from "./SentimentBadge";
import { ErrorBoundary } from "./ErrorBoundary";

function Section({
  title,
  meta,
  children,
  defaultOpen = false,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-slate-800/30"
      >
        <span className="min-w-0 flex items-baseline gap-2">
          <span className="text-sm font-medium text-slate-200">{title}</span>
          {meta && <span className="text-[11px] text-slate-500">{meta}</span>}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>
      {open && <div className="px-1 pb-4">{children}</div>}
    </div>
  );
}

function forecastTone(forecast: string) {
  const f = forecast.toUpperCase();
  if (f.includes("UP")) return "text-teal-300";
  if (f.includes("DOWN")) return "text-rose-300";
  return "text-amber-300";
}

export function AiAnalysisScreen({ capabilities }: { capabilities: AiCapabilitiesDto | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const llmState = getLlmUiState(capabilities);
  const llmUnavailable = llmState !== "on";

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getBitcoinAnalysis(AI_ANALYSIS_SYMBOL);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Phân tích AI chưa thể hoàn tất.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Bot className="h-4 w-4 text-teal-400" />
            Phân tích AI
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            LangGraph nhiều tác tử phân tích BTC; kết quả là giải thích, không phải khuyến nghị giao dịch.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void analyze()}
          disabled={loading || llmUnavailable}
          className="flex w-full items-center justify-center gap-2 border border-teal-500/50 bg-teal-500/10 px-4 py-2.5 text-sm font-medium text-teal-200 transition-colors hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/40 disabled:text-slate-500 lg:w-auto lg:py-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          {loading
            ? "Đang phân tích…"
            : llmState === "unknown"
              ? "Đang kiểm tra LLM"
              : llmUnavailable
                ? "Giải thích LLM chưa khả dụng"
                : "Phân tích BTC"}
        </button>
      </div>

      <div className="mt-3">
        <ErrorBoundary fallbackTitle="Lỗi tải Sentiment">
          <SentimentBadge symbol={AI_ANALYSIS_SYMBOL} />
        </ErrorBoundary>
      </div>

      {llmState === "unknown" && (
        <div className="mt-3 border-b border-slate-800 pb-3 text-xs text-slate-400">
          Đang kiểm tra khả năng giải thích LLM…
        </div>
      )}
      {llmState === "off" && (
        <div className="mt-3 border border-amber-900/60 bg-amber-950/30 px-3 py-2.5 text-xs text-amber-200" role="status">
          LLM OFF — phân tích đa tác tử chưa khả dụng; dữ liệu và mô hình định lượng vẫn hoạt động bình thường.
        </div>
      )}

      {error && (
        <div className="mt-3 border border-rose-900/60 bg-rose-950/30 px-3 py-2.5 text-xs text-rose-200" role="alert">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-3">
          <div
            data-testid="ai-verdict"
            className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border border-slate-800 bg-slate-900/40 px-3 py-2.5"
          >
            <span className={`font-mono text-sm font-semibold ${forecastTone(String(data.forecast))}`}>
              {String(data.forecast).split("_").join(" ")}
            </span>
            <span className="text-xs text-slate-400">
              Độ tin cậy: <span className="font-mono text-slate-200">{data.confidence}%</span>
            </span>
            <span className="ml-auto text-[11px] text-amber-300/90">
              LLM explanation — không phải bằng chứng đã kiểm định
            </span>
          </div>

          <div className="mt-3 border-t border-slate-800">
            <Section title="Lập luận" defaultOpen>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                {data.reasoning?.trim() ? data.reasoning : "—"}
              </p>
            </Section>

            <Section title="Tranh luận tác tử" meta="3 quan điểm">
              <div className="space-y-3">
                <DebateBlock title="Tác tử tin tức" body={data.debate_summary?.news_agent} />
                <DebateBlock title="Tác tử kỹ thuật" body={data.debate_summary?.tech_agent} />
                <DebateBlock title="Quyết định cuối" body={data.debate_summary?.final_decision} />
              </div>
            </Section>

            <Section
              title="Bằng chứng tin tức"
              meta={
                Array.isArray(data.news_evidence) && data.news_evidence.length > 0
                  ? `${data.news_evidence.length} nguồn`
                  : undefined
              }
            >
              {Array.isArray(data.news_evidence) && data.news_evidence.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {data.news_evidence.map((e, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 text-xs font-medium text-slate-200">{e.title ?? "(không tiêu đề)"}</span>
                        {e.sentiment && (
                          <span className="shrink-0 text-[11px] text-slate-500">{e.sentiment}</span>
                        )}
                      </div>
                      {e.snippet && (
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">{e.snippet}</p>
                      )}
                      {e.why_it_matters && (
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                          {e.why_it_matters}
                        </p>
                      )}
                      {e.link && (
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline"
                        >
                          Nguồn <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Không có bằng chứng tin tức.</p>
              )}
            </Section>

            <Section title="Bằng chứng kỹ thuật">
              {data.tech_evidence ? (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-3">
                  <TechStat label="Close đầu kỳ" value={data.tech_evidence.first_close} />
                  <TechStat label="Close cuối kỳ" value={data.tech_evidence.last_close} />
                  <TechStat
                    label="Biến động"
                    value={
                      data.tech_evidence.change_pct == null
                        ? null
                        : `${data.tech_evidence.change_pct}%`
                    }
                  />
                  <TechStat label="Đỉnh kỳ" value={data.tech_evidence.period_high} />
                  <TechStat label="Đáy kỳ" value={data.tech_evidence.period_low} />
                  <TechStat label="RSI" value={data.tech_evidence.rsi} />
                </dl>
              ) : (
                <p className="text-xs text-slate-500">Không có dữ liệu kỹ thuật.</p>
              )}
            </Section>

            <Section
              title="Điều kiện rủi ro"
              meta={
                Array.isArray(data.risk_conditions) && data.risk_conditions.length > 0
                  ? `${data.risk_conditions.length} điều kiện`
                  : undefined
              }
            >
              {Array.isArray(data.risk_conditions) && data.risk_conditions.length > 0 ? (
                <div className="divide-y divide-slate-800/60">
                  {data.risk_conditions.map((r, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-xs font-medium text-slate-200">
                          {r.trigger ?? "(không trigger)"}
                        </span>
                        {r.severity && (
                          <span className="shrink-0 border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                            {r.severity}
                          </span>
                        )}
                      </div>
                      {r.what_to_watch && (
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                          <span className="text-slate-500">Theo dõi: </span>
                          {r.what_to_watch}
                        </p>
                      )}
                      {r.mitigation_hint && (
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
                          <span className="text-slate-500">Giảm thiểu: </span>
                          {r.mitigation_hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Không có điều kiện rủi ro.</p>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}

function TechStat({ label, value }: { label: string; value: number | string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-2 sm:block">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono text-slate-200">{value ?? "n/a"}</dd>
    </div>
  );
}

function DebateBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div className="border-l-2 border-slate-700 pl-3">
      <span className="block text-[11px] font-medium text-slate-400">{title}</span>
      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
        {body?.trim() ? body : "—"}
      </p>
    </div>
  );
}
