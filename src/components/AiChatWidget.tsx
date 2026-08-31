"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import { streamAiChat } from "@/lib/api";
import type { AiCapabilitiesDto, AiChatMessage } from "@/lib/types";
import { canUseAiExplanation, getLlmUiState } from "@/lib/researchUi";

const QUICK_CHIPS = [
  { id: "forecast", label: "🔍 Giải thích dự báo hiện tại", prompt: "Giải thích dự báo định lượng hiện tại và nêu rõ dữ liệu nào đang có." },
  { id: "smc", label: "📈 Phân tích FVG & VPVR POC", prompt: "Vùng hỗ trợ/kháng cự FVG và Point of Control (POC) hiện tại ở đâu?" },
  { id: "archetype", label: "🔄 Tỷ lệ thắng Archetype", prompt: "Cửa sổ nến hiện tại khớp với mẫu nến archetype nào và xác suất chuyển đổi tiếp theo?" },
  { id: "confluence", label: "⚡ Đánh giá Confluence 4 khung", prompt: "Hội tụ đa khung thời gian Confluence đạt bao nhiêu điểm? Có xung đột xu hướng không?" },
];

const currentTimestampMs = () => Date.now();

export function AiChatWidget({ capabilities }: { capabilities: AiCapabilitiesDto | null }) {
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const llmState = getLlmUiState(capabilities);
  const canExplain = canUseAiExplanation(capabilities);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      // Cleanup in-flight stream on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
        timeframe: "1h",
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
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-16 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-200"
          aria-label="Trợ lý AI Chat"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-pulse" />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-gray-950 ${llmState === "on" ? "bg-emerald-400" : llmState === "off" ? "bg-amber-400" : "bg-gray-500"}`} />
          </div>
          <span className="text-sm tracking-wide">Trợ lý AI (XAI)</span>
          <Sparkles className="w-4 h-4 text-cyan-200" />
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-16 right-5 z-50 w-[420px] max-w-[calc(100vw-2.5rem)] h-[580px] max-h-[calc(100vh-6rem)] bg-gray-900/95 backdrop-blur-xl border border-gray-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                  Bitcoin AI Strategy Explainer
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                    XAI
                  </span>
                </h3>
                <p className={`text-[11px] ${llmState === "off" ? "text-amber-300" : "text-gray-400"}`}>
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
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-2xl ${
                    m.sender === "user"
                      ? "bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-900/20"
                      : "bg-gray-800/90 border border-gray-700/60 text-gray-100 rounded-bl-none"
                  }`}
                >
                  {/* Evidence Tags Badges for AI replies */}
                  {m.evidenceTags && m.evidenceTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {m.evidenceTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-950/60 text-cyan-300 border border-cyan-500/30 rounded"
                        >
                          🏷️ {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                    {m.text}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-1">
                  {new Date(m.timestampMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-800/50 border border-gray-700/40 text-gray-400 max-w-[70%]">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                <span className="text-xs">Đang tổng hợp dữ liệu nghiên cứu...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips Bar */}
          <div className="px-3 py-2 border-t border-gray-800/60 bg-gray-950/40 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => void handleSend(chip.prompt)}
                disabled={loading || !canExplain}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-teal-300 border border-teal-500/20 hover:border-teal-500/40 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={llmState === "unknown" ? "Đang kiểm tra dịch vụ giải thích..." : "Hỏi về nến, FVG, POC, dự báo..."}
              disabled={loading || !canExplain}
              className="flex-1 bg-gray-900 border border-gray-700/80 rounded-xl px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={loading || !canExplain || !inputPrompt.trim()}
              className="p-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold disabled:opacity-40 disabled:hover:bg-teal-500 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
