"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, AlertTriangle } from "lucide-react";
import { streamAiChat } from "@/lib/api";
import type { AiCapabilitiesDto, AiChatMessage } from "@/lib/types";
import { canUseAiExplanation, getLlmUiState } from "@/lib/researchUi";
import { DEFAULT_TIMEFRAME } from "@/lib/timeframe";

const QUICK_CHIPS = [
  { id: "forecast", label: "🔍 Giải thích dự báo hiện tại", prompt: "Giải thích dự báo định lượng hiện tại và nêu rõ dữ liệu nào đang có." },
  { id: "smc", label: "📈 Phân tích FVG & VPVR POC", prompt: "Vùng hỗ trợ/kháng cự FVG và Point of Control (POC) hiện tại ở đâu?" },
  { id: "archetype", label: "🔄 Tỷ lệ thắng Archetype", prompt: "Cửa sổ nến hiện tại khớp với mẫu nến archetype nào và xác suất chuyển đổi tiếp theo?" },
  { id: "confluence", label: "⚡ Đánh giá Confluence 3 khung", prompt: "Hội tụ các khung 1h, 4h và 1d đạt bao nhiêu điểm? Có xung đột xu hướng không?" },
];

const currentTimestampMs = () => Date.now();

export function AiChatWidget({ capabilities, dismissedByModal = false }: { capabilities: AiCapabilitiesDto | null; dismissedByModal?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "ai",
      text: "Tôi giải thích dữ liệu nghiên cứu định lượng hiện có. Nội dung này không thay đổi tín hiệu hoặc quyết định của mô hình.",
      evidenceTags: [],
      timestampMs: currentTimestampMs(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const llmState = getLlmUiState(capabilities);
  const canExplain = canUseAiExplanation(capabilities);

  // Non-modal surface: while a modal (alerts drawer) is open the chat is not
  // rendered at all — its wrapper is also inert. It resumes when the modal
  // closes; messages and open state are preserved.
  const open = isOpen && !dismissedByModal;

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    return () => {
      // Cleanup in-flight stream on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // No focus trap, but return focus to the launcher on close — unless the
  // launcher itself is inside an inert subtree (modal owns focus then).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    const launcher = launcherRef.current;
    if (wasOpenRef.current && !isOpen && launcher && !launcher.closest("[inert]")) {
      launcher.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || loading || !canExplain) return;

    // Abort previous in-flight stream if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timestampMs = currentTimestampMs();

    const userMsg: AiChatMessage = {
      id: `user-${timestampMs}`,
      sender: "user",
      text: textToSend,
      timestampMs,
    };

    const aiMsgId = `ai-${timestampMs}`;
    const initialAiMsg: AiChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      evidenceTags: ["Đang trích xuất dữ liệu..."],
      timestampMs,
    };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);
    if (!customPrompt) setInputPrompt("");
    setLoading(true);

    try {
      await streamAiChat({
        symbol: "BTCUSDT",
        timeframe: DEFAULT_TIMEFRAME,
        prompt: textToSend,
        signal: abortController.signal,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + token } : m))
          );
        },
        onComplete: (evidenceTags) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    evidenceTags: evidenceTags && evidenceTags.length > 0
                      ? evidenceTags
                      : [],
                  }
                : m
            )
          );
          setLoading(false);
        },
        onError: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    text: "Giải thích tạm thời không khả dụng. Dữ liệu định lượng không bị ảnh hưởng.",
                    evidenceTags: [],
                  }
                : m
            )
          );
          setLoading(false);
        },
      });
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: "Giải thích tạm thời không khả dụng. Dữ liệu định lượng không bị ảnh hưởng.",
                evidenceTags: [],
              }
            : m
        )
      );
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button — kept clear of the mobile bottom nav
          (nav is sticky bottom-0 below lg, so the launcher sits at bottom-20). */}
      {!open && (
        <button
          ref={launcherRef}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex h-10 items-center gap-2 rounded-full border border-teal-500/60 bg-slate-900 px-3.5 text-teal-300 shadow-lg shadow-black/60 transition-colors hover:bg-slate-850 active:scale-95 lg:bottom-6 lg:right-6"
          aria-label="Trợ lý AI Chat"
        >
          <Bot className="h-4 w-4" />
          <span className="text-xs font-medium">Trợ lý AI</span>
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${
              llmState === "on"
                ? "bg-teal-400"
                : llmState === "off"
                  ? "bg-amber-400"
                  : "bg-slate-500"
            }`}
          />
        </button>
      )}

      {/* Chat panel: full-height sheet below lg, floating bottom-right
          panel ~380×520 on lg+. Elevation lives on the panel surface only. */}
      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý AI"
          className="fixed inset-0 z-50 flex flex-col overflow-hidden border-slate-800 bg-slate-900 shadow-2xl shadow-black/70 lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[520px] lg:max-h-[calc(100vh-3rem)] lg:w-[380px] lg:rounded-xl lg:border"
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-850 px-3.5 lg:h-11">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-teal-500/30 bg-teal-500/10 text-teal-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100">Trợ lý AI</h3>
                <p
                  className={`text-[11px] leading-tight ${
                    llmState === "off" ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  {llmState === "unknown"
                    ? "Đang kiểm tra khả năng giải thích"
                    : llmState === "off"
                      ? "LLM OFF · dùng giải thích định lượng dự phòng"
                      : "Giải thích từ dữ liệu nghiên cứu"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Đóng trợ lý AI"
              className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages — flat rows, user right teal-tint / assistant left slate */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs text-slate-200">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`px-3 py-2.5 ${
                    m.sender === "user"
                      ? "max-w-[85%] rounded-lg border border-teal-500/30 bg-teal-500/15 text-slate-100"
                      : "max-w-[92%] rounded-lg border border-slate-800 bg-slate-850 text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-xs leading-relaxed">
                    {m.text}
                  </div>

                  {/* Evidence/citation tags — mono footnote lines */}
                  {m.evidenceTags && m.evidenceTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-2.5 gap-y-0.5 border-t border-slate-800/60 pt-1.5">
                      {m.evidenceTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] text-teal-300/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="mt-1 px-1 font-mono text-[10px] tabular-nums text-slate-500">
                  {new Date(m.timestampMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex max-w-[70%] items-center gap-2 rounded-lg border border-slate-800 bg-slate-850/60 p-2.5 text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                <span className="text-[11px]">Đang tổng hợp dữ liệu nghiên cứu...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Capability-unavailable amber state (honest, mirrors header subtitle) */}
          {llmState === "off" && (
            <div className="mx-3 mb-2 flex shrink-0 items-start gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] leading-snug text-amber-200/90">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                Giải thích LLM tạm không khả dụng. Dữ liệu định lượng không bị ảnh hưởng.
              </span>
            </div>
          )}

          {/* Quick Chips Bar — the 4 real QUICK_CHIPS, unchanged */}
          <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-t border-slate-800/60 bg-slate-950/60 px-3 py-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => void handleSend(chip.prompt)}
                disabled={loading || !canExplain}
                className="shrink-0 whitespace-nowrap rounded border border-slate-800 bg-slate-850 px-2.5 py-1 text-[11px] text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Form — dark flat bar, send ≥40px */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex shrink-0 items-center gap-2 border-t border-slate-800 bg-slate-950 p-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={llmState === "unknown" ? "Đang kiểm tra dịch vụ giải thích..." : "Hỏi về nến, FVG, POC, dự báo..."}
              disabled={loading || !canExplain}
              className="h-10 flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-100 placeholder-slate-500 transition-colors focus:border-teal-500 focus:outline-none lg:h-9"
            />
            <button
              type="submit"
              aria-label="Gửi câu hỏi"
              disabled={loading || !canExplain || !inputPrompt.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500 text-slate-950 transition-colors hover:bg-teal-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-teal-500"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
