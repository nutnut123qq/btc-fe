"use client";

import { useState } from "react";
import { Bot, RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from "lucide-react";
import type { AiCapabilitiesDto, AnalysisResult } from "@/lib/types";
import { getBitcoinAnalysis } from "@/lib/api";
import { AI_ANALYSIS_SYMBOL, getLlmUiState } from "@/lib/researchUi";
import { SentimentBadge } from "./SentimentBadge";
import { ErrorBoundary } from "./ErrorBoundary";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
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
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="text-teal-400" />
          Phân tích AI Đa Tác Tử (LangGraph Multi-Agent)
        </h2>

        <span className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-teal-300 sm:self-auto">
          BTC/USDT · tài sản nghiên cứu hiện tại
        </span>
      </div>

      <ErrorBoundary fallbackTitle="Lỗi tải Sentiment">
        <SentimentBadge symbol={AI_ANALYSIS_SYMBOL} />
      </ErrorBoundary>

      <p className="text-sm text-slate-400">
        Phân tích đa góc nhìn cho BTC/USDT trong phạm vi nghiên cứu hiện tại.
      </p>

      {llmState === "unknown" && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-300">
          Đang kiểm tra khả năng giải thích LLM…
        </div>
      )}
      {llmState === "off" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          LLM OFF — phân tích đa tác tử chưa khả dụng; dữ liệu và mô hình định lượng vẫn hoạt động bình thường.
        </div>
      )}

      <button
        onClick={() => void analyze()}
        disabled={loading || llmUnavailable}
        className="w-full py-3 px-4 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      >
        {loading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Đang phân tích…
          </>
        ) : (
          <>
            <Bot className="w-5 h-5" />
            {llmState === "unknown" ? "Đang kiểm tra LLM" : llmUnavailable ? "Giải thích LLM chưa khả dụng" : "Phân tích bằng AI"}
          </>
        )}
      </button>

      {error && (
        <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-200 text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="text-xs font-semibold text-slate-400 mb-2">Dự báo</div>
            <div className="flex items-center gap-3">
              {String(data.forecast).includes("UP") ? (
                <TrendingUp className="text-emerald-400 w-8 h-8" />
              ) : (
                <TrendingDown className="text-rose-400 w-8 h-8" />
              )}
              <div>
                <div className="text-lg font-bold text-white">{String(data.forecast).split("_").join(" ")}</div>
                <div className="text-xs text-teal-400 bg-teal-900/40 inline-flex px-2 py-0.5 rounded">
                  Độ tin cậy: {data.confidence}%
                </div>
              </div>
            </div>
          </div>

          <Accordion title="Lập luận" defaultOpen>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{data.reasoning || "—"}</p>
          </Accordion>

          <Accordion title="Debate">
            <div className="space-y-4 text-sm">
              <DebateBlock title="News Agent" body={data.debate_summary?.news_agent} accent="border-emerald-500" textAccent="text-emerald-400" />
              <DebateBlock title="Tech Agent" body={data.debate_summary?.tech_agent} accent="border-teal-500" textAccent="text-teal-400" />
              <DebateBlock title="Quyết định cuối" body={data.debate_summary?.final_decision} accent="border-slate-500" textAccent="text-slate-400" />
            </div>
          </Accordion>

          <Accordion title="Bằng chứng tin">
            {Array.isArray(data.news_evidence) && data.news_evidence.length > 0 ? (
              <div className="space-y-4">
                {data.news_evidence.slice(0, 5).map((e, idx) => (
                  <div key={idx} className=" pb-3 last:border-0 last:pb-0">
                    <div className="text-xs text-white font-semibold">{e.title ?? "(no title)"}</div>
                    <div className="text-xs text-teal-300">{e.sentiment ?? ""}</div>
                    {e.link && (
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline break-all mt-1 block">
                        {e.link}
                      </a>
                    )}
                    <p className="text-slate-400 text-xs whitespace-pre-wrap mt-1">{e.snippet ?? ""}</p>
                    <p className="text-slate-400 text-xs whitespace-pre-wrap mt-1">{e.why_it_matters ?? ""}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Không có bằng chứng tin.</p>
            )}
          </Accordion>

          <Accordion title="Bằng chứng kỹ thuật">
            {data.tech_evidence ? (
              <div className="text-xs text-slate-300 space-y-1.5">
                <div><span className="text-slate-400">first_close:</span> {data.tech_evidence.first_close ?? "n/a"}</div>
                <div><span className="text-slate-400">last_close:</span> {data.tech_evidence.last_close ?? "n/a"}</div>
                <div><span className="text-slate-400">change_pct:</span> {data.tech_evidence.change_pct ?? "n/a"}</div>
                <div><span className="text-slate-400">period_high:</span> {data.tech_evidence.period_high ?? "n/a"}</div>
                <div><span className="text-slate-400">period_low:</span> {data.tech_evidence.period_low ?? "n/a"}</div>
                <div><span className="text-slate-400">rsi:</span> {data.tech_evidence.rsi ?? "n/a"}</div>
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Không có dữ liệu kỹ thuật.</p>
            )}
          </Accordion>

          <Accordion title="Rủi ro">
            {Array.isArray(data.risk_conditions) && data.risk_conditions.length > 0 ? (
              <div className="space-y-4">
                {data.risk_conditions.slice(0, 5).map((r, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded ">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs text-white font-semibold break-words">{r.trigger ?? "(no trigger)"}</div>
                      <div className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 whitespace-nowrap">
                        {r.severity ?? "N/A"}
                      </div>
                    </div>
                    <div className="text-slate-400 text-xs whitespace-pre-wrap mt-1">
                      <span className="text-slate-400">What to watch:</span> {r.what_to_watch ?? ""}
                    </div>
                    <div className="text-slate-400 text-xs whitespace-pre-wrap mt-1">
                      <span className="text-slate-400">Mitigation hint:</span> {r.mitigation_hint ?? ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Không có điều kiện rủi ro.</p>
            )}
          </Accordion>
        </div>
      )}
    </div>
  );
}

function DebateBlock({ title, body, accent, textAccent }: { title: string; body?: string; accent: string; textAccent: string }) {
  return (
    <div className={`border-l-4 ${accent} bg-slate-950 p-3 rounded`}>
      <span className={`${textAccent} font-semibold text-xs mb-1 block`}>{title}</span>
      <p className="text-slate-400 text-xs whitespace-pre-wrap">{body?.trim() ? body : "—"}</p>
    </div>
  );
}
