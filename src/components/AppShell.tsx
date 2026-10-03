"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  Activity,
  Bell,
  Newspaper,
  Settings,
  LineChart,
  Bot,
  Layers,
  TrendingUp,
  BarChart3,
  Shapes,
  ListOrdered,
  FileCheck2,
  ChevronUp,
} from "lucide-react";
import { MarketScreen } from "./MarketScreen";
import { NewsScreen } from "./NewsScreen";
import { AiAnalysisScreen } from "./AiAnalysisScreen";
import { AlertSettingsScreen } from "./AlertSettingsScreen";
import { AlertsDrawer } from "./AlertsDrawer";
import { DiscoveryScreen } from "./DiscoveryScreen";
import { PredictionScreen } from "./PredictionScreen";
import { BacktestScreen } from "./BacktestScreen";
import { PaperTradeScreen } from "./PaperTradeScreen";
import { BinanceTradeHistoryScreen } from "./BinanceTradeHistoryScreen";
import { ArchetypeScreen } from "./ArchetypeScreen";
import { ResearchEvidenceScreen } from "./ResearchEvidenceScreen";
import { AiChatWidget } from "./AiChatWidget";
import { ErrorBoundary } from "./ErrorBoundary";
import { getAiCapabilities, getAppMeta, getUnreadCount, setApiContractCompatibility } from "@/lib/api";
import type { AiCapabilitiesDto } from "@/lib/types";
import { getLlmUiState, PAPER_JOURNAL_LABEL } from "@/lib/researchUi";
import { canUseApiMutations, EXPECTED_API_CONTRACT_VERSION, isApiContractCompatible } from "@/lib/apiContract";
import type { ApiContractState } from "@/lib/apiContract";

const TABS = [
  { key: "market", label: "Thị trường", icon: LineChart },
  { key: "archetype", label: "Mẫu nến", icon: Shapes },
  { key: "news", label: "Tin tức", icon: Newspaper },
  { key: "ai", label: "AI", icon: Bot },
  { key: "rules", label: "Rules nến", icon: Layers },
  { key: "predict", label: "Dự đoán", icon: TrendingUp },
  { key: "research", label: "Nghiên cứu", icon: FileCheck2 },
  { key: "paper", label: "Paper", icon: LineChart },
  { key: "binanceHistory", label: PAPER_JOURNAL_LABEL, icon: ListOrdered },
  { key: "backtest", label: "Backtest", icon: BarChart3 },
  { key: "settings", label: "Cảnh báo", icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TAB_BY_KEY: ReadonlyMap<TabKey, (typeof TABS)[number]> = new Map(
  TABS.map((t) => [t.key, t] as const),
);

// Bottom navigation is grouped into 5 top-level entries; groups with more than
// one child expand into a sub-row of child chips rendered directly above the bar.
const NAV_GROUPS = [
  { key: "market", label: "Thị trường", children: ["market"] },
  { key: "newsAi", label: "Tin tức & AI", children: ["news", "ai"] },
  { key: "research", label: "Nghiên cứu", children: ["research", "archetype", "rules", "backtest"] },
  { key: "simulation", label: "Mô phỏng", children: ["predict", "paper", "binanceHistory"] },
  { key: "system", label: "Hệ thống", children: ["settings"] },
] as const;

type NavGroup = (typeof NAV_GROUPS)[number];
type NavGroupKey = NavGroup["key"];

const ALERT_USER_ID = "default";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("market");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set(["market"]));
  const [openGroup, setOpenGroup] = useState<NavGroupKey | null>(null);
  const [lastChildByGroup, setLastChildByGroup] = useState<Partial<Record<NavGroupKey, TabKey>>>({});
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [aiCapabilities, setAiCapabilities] = useState<AiCapabilitiesDto | null>(null);
  const [contractState, setContractState] = useState<ApiContractState>("checking");
  const llmState = getLlmUiState(aiCapabilities);
  const groupButtonRefs = useRef<Partial<Record<NavGroupKey, HTMLButtonElement | null>>>({});
  const chipButtonRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const focusChipAfterOpen = useRef(false);
  const pendingChipFocus = useRef<TabKey | null>(null);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setVisitedTabs((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const activateGroup = (group: NavGroup) => {
    const children = group.children as readonly TabKey[];
    const target = lastChildByGroup[group.key] ?? children[0];
    setLastChildByGroup((prev) => ({ ...prev, [group.key]: target }));
    setOpenGroup(group.key);
    handleTabChange(target);
    if (focusChipAfterOpen.current) {
      focusChipAfterOpen.current = false;
      pendingChipFocus.current = target;
    }
  };

  const activateSingleChildGroup = (group: NavGroup) => {
    setOpenGroup(null);
    handleTabChange((group.children as readonly TabKey[])[0]);
  };

  const selectChild = (groupKey: NavGroupKey, childKey: TabKey) => {
    setLastChildByGroup((prev) => ({ ...prev, [groupKey]: childKey }));
    handleTabChange(childKey);
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setOpenGroup(null);
    }
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLButtonElement>, group: NavGroup) => {
    if (event.key === "Enter" && group.children.length > 1) {
      // Enter also dispatches click, which performs the actual activation.
      focusChipAfterOpen.current = true;
    } else if (event.key === "Escape") {
      setOpenGroup(null);
    }
  };

  const handleChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, group: NavGroup, index: number) => {
    const children = group.children as readonly TabKey[];
    if (event.key === "Escape") {
      event.preventDefault();
      setOpenGroup(null);
      groupButtonRefs.current[group.key]?.focus();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = children[(index + delta + children.length) % children.length];
      selectChild(group.key, next);
      chipButtonRefs.current[next]?.focus();
    }
  };

  const openGroupDef = NAV_GROUPS.find((g) => g.key === openGroup);

  // Moves focus into the sub-row after a keyboard-driven group activation.
  useEffect(() => {
    const pending = pendingChipFocus.current;
    if (pending === null) return;
    pendingChipFocus.current = null;
    chipButtonRefs.current[pending]?.focus();
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUnread = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const n = await getUnreadCount(ALERT_USER_ID);
        if (isMounted) {
          setUnread(n);
        }
      } catch {}
    };

    void fetchUnread();
    const interval = setInterval(() => void fetchUnread(), 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchUnread();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadMeta = async () => {
      try {
        return await getAppMeta(AbortSignal.timeout(5_000));
      } catch {
        return getAppMeta(AbortSignal.timeout(10_000));
      }
    };
    void loadMeta()
      .then((meta) => {
        const compatible = isApiContractCompatible(meta);
        setApiContractCompatibility(compatible);
        if (mounted) setContractState(compatible ? "compatible" : "mismatch");
      })
      .catch(() => {
        setApiContractCompatibility(false);
        if (mounted) setContractState("unavailable");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void getAiCapabilities()
      .then(setAiCapabilities)
      .catch(() => setAiCapabilities({
        mlInference: false,
        llmExplanation: false,
        provider: "unavailable",
        reason: "Không thể kiểm tra dịch vụ giải thích.",
        fallbackExplanation: false,
      }));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className=" bg-slate-950/80 backdrop-blur sticky top-0 z-40 lg:order-1">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="text-teal-400" />
            Bitcoin AI Analyst
          </h1>
          <div className="flex items-center gap-2">
            {llmState === "unknown" && (
              <span className="hidden sm:inline-flex rounded bg-slate-900 px-2 py-1 text-xs font-bold text-slate-400">
                LLM · đang kiểm tra
              </span>
            )}
            {llmState === "off" && (
              <span className="hidden sm:inline-flex rounded bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-300">
                LLM OFF · định lượng vẫn hoạt động
              </span>
            )}
            <button
              onClick={() => setAlertsOpen(true)}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-xs font-bold bg-rose-600 text-white rounded-full">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {contractState !== "compatible" && (
        <div className="border-b border-amber-900/60 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-200 lg:order-3" role="alert">
          {contractState === "checking"
            ? "Đang kiểm tra API contract; mutation tạm khóa."
            : contractState === "mismatch"
              ? `API contract không khớp (frontend cần ${EXPECTED_API_CONTRACT_VERSION}); mutation đã bị khóa.`
              : "Không kiểm tra được API contract; mutation đã bị khóa, các màn chỉ đọc vẫn có thể hoạt động."}
        </div>
      )}

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4 lg:order-4">
        {visitedTabs.has("market") && (
          <div className={activeTab === "market" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Thị trường">
              <MarketScreen onOpenEvidence={() => handleTabChange("research")} />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("archetype") && (
          <div className={activeTab === "archetype" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Mẫu nến">
              <ArchetypeScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("news") && (
          <div className={activeTab === "news" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Tin tức">
              <NewsScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("ai") && (
          <div className={activeTab === "ai" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab AI">
              <AiAnalysisScreen capabilities={aiCapabilities} />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("rules") && (
          <div className={activeTab === "rules" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Rules nến">
              <DiscoveryScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("predict") && (
          <div className={activeTab === "predict" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Dự đoán">
              <PredictionScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("research") && (
          <div className={activeTab === "research" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Nghiên cứu">
              <ResearchEvidenceScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("paper") && (
          <div className={activeTab === "paper" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Paper Trading">
              <PaperTradeScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("binanceHistory") && (
          <div className={activeTab === "binanceHistory" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Nhật ký Paper BTC">
              <BinanceTradeHistoryScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("backtest") && (
          <div className={activeTab === "backtest" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Backtest">
              <BacktestScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("settings") && (
          <div className={activeTab === "settings" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Cảnh báo">
              <AlertSettingsScreen contractCompatible={canUseApiMutations(contractState)} />
            </ErrorBoundary>
          </div>
        )}
      </main>

      <nav aria-label="Điều hướng chính" className=" bg-slate-950 sticky bottom-0 z-40 lg:order-2 lg:sticky lg:top-[60px] lg:bottom-auto lg:border-b lg:border-slate-800">
        {openGroupDef && openGroupDef.children.length > 1 && (
          <div
            id={`nav-sub-${openGroupDef.key}`}
            data-testid="nav-sub-row"
            role="group"
            aria-label={`${openGroupDef.label} — mục con`}
            className=" bg-slate-900/90 lg:absolute lg:left-0 lg:right-0 lg:top-full lg:border-b lg:border-slate-800 lg:shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex justify-start gap-2 overflow-x-auto px-3 py-2 sm:justify-center lg:justify-center">
              {openGroupDef.children.map((childKey, index) => {
                const child = TAB_BY_KEY.get(childKey)!;
                const ChildIcon = child.icon;
                const childActive = activeTab === childKey;
                return (
                  <button
                    type="button"
                    key={childKey}
                    ref={(el) => {
                      chipButtonRefs.current[childKey] = el;
                    }}
                    onClick={() => selectChild(openGroupDef.key, childKey)}
                    onKeyDown={(event) => handleChipKeyDown(event, openGroupDef, index)}
                    aria-current={childActive ? "page" : undefined}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
 childActive
 ? " bg-teal-500/10 text-teal-300"
 : " bg-slate-900 text-slate-400 hover:text-slate-200"
 }`}
                  >
                    <ChildIcon className="w-3.5 h-3.5" />
                    {child.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div data-testid="nav-groups" className="max-w-7xl mx-auto flex justify-start overflow-x-auto sm:justify-around lg:justify-center lg:gap-1">
          {NAV_GROUPS.map((group) => {
            const multi = group.children.length > 1;
            const expanded = openGroup === group.key;
            const containsActive = (group.children as readonly TabKey[]).includes(activeTab);
            const GroupIcon = TAB_BY_KEY.get((group.children as readonly TabKey[])[0])!.icon;
            return (
              <button
                type="button"
                key={group.key}
                ref={(el) => {
                  groupButtonRefs.current[group.key] = el;
                }}
                onClick={() => (multi ? activateGroup(group) : activateSingleChildGroup(group))}
                onKeyDown={(event) => handleGroupKeyDown(event, group)}
                aria-expanded={multi ? expanded : undefined}
                aria-controls={multi ? `nav-sub-${group.key}` : undefined}
                aria-current={containsActive ? (multi ? "true" : "page") : undefined}
                className={`flex min-w-20 flex-col items-center gap-0.5 py-2 px-3 sm:px-4 sm:flex-1 transition-colors lg:min-w-0 lg:flex-none lg:flex-row lg:gap-1.5 lg:px-4 lg:h-11 lg:border-b-2 ${
                  containsActive ? "text-teal-400 lg:border-teal-400" : "text-slate-500 hover:text-slate-300 lg:border-transparent"
                }`}
              >
                <GroupIcon className="w-5 h-5" />
                <span className="flex items-center gap-1 text-xs font-medium">
                  {group.label}
                  {multi && (
                    <ChevronUp
                      className={`w-3 h-3 transition-transform lg:rotate-180 ${expanded ? "rotate-180 lg:rotate-0" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <AiChatWidget capabilities={aiCapabilities} />
    </div>
  );
}
