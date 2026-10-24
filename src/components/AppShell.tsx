"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
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
  Landmark,
} from "lucide-react";
import { AlertsDrawer } from "./AlertsDrawer";
import { AiChatWidget } from "./AiChatWidget";
import { getAiCapabilities, getAppMeta, getUnreadCount, setApiContractCompatibility } from "@/lib/api";
import type { AiCapabilitiesDto } from "@/lib/types";
import { FORWARD_JOURNAL_LABEL, getLlmUiState, LLM_STATE_LABEL, PAPER_JOURNAL_LABEL } from "@/lib/researchUi";
import { backoffDelayMs, isRestorableHref } from "@/lib/reconnect";
import { EXPECTED_API_CONTRACT_VERSION, isApiContractCompatible } from "@/lib/apiContract";
import type { ApiContractState } from "@/lib/apiContract";

const TABS = [
  { key: "market", label: "BTC/USDT", icon: LineChart },
  { key: "equity", label: "Cổ phiếu", icon: Landmark },
  { key: "archetype", label: "Mẫu nến", icon: Shapes },
  { key: "news", label: "Tin tức", icon: Newspaper },
  { key: "ai", label: "AI", icon: Bot },
  { key: "rules", label: "Rules nến", icon: Layers },
  { key: "predict", label: "Dự đoán", icon: TrendingUp },
  { key: "research", label: "Nghiên cứu", icon: FileCheck2 },
  { key: "paper", label: FORWARD_JOURNAL_LABEL, icon: LineChart },
  { key: "binanceHistory", label: PAPER_JOURNAL_LABEL, icon: ListOrdered },
  { key: "backtest", label: "Backtest", icon: BarChart3 },
  { key: "settings", label: "Cảnh báo", icon: Settings },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

const TAB_BY_KEY: ReadonlyMap<TabKey, (typeof TABS)[number]> = new Map(
  TABS.map((t) => [t.key, t] as const),
);

// Real per-screen routes — the URL is the source of truth for activeTab.
export const TAB_PATH: Record<TabKey, string> = {
  market: "/",
  equity: "/co-phieu",
  archetype: "/mau-nen",
  news: "/tin-tuc",
  ai: "/ai",
  rules: "/rules-nen",
  predict: "/du-doan",
  research: "/nghien-cuu",
  paper: "/paper",
  binanceHistory: "/nhat-ky",
  backtest: "/backtest",
  settings: "/canh-bao",
};

// /mbb is a compatibility alias of the equity screen (no separate nav entry).
const PATH_TAB: ReadonlyMap<string, TabKey> = new Map([
  ...(Object.entries(TAB_PATH) as [TabKey, string][]).map(([key, path]) => [path, key] as const),
  ["/mbb", "equity"] as const,
]);
const RESTORABLE_PATHS: ReadonlySet<string> = new Set(PATH_TAB.keys());
const NAV_MEMORY_KEY = "btc.nav.lastHrefByTab.v1";
const META_TIMEOUT_MS = 10_000;
const VERIFY_RETRY_BASE_MS = 5_000;
const VERIFY_RETRY_MAX_MS = 60_000;

// 5 top-level nav groups. The child strip of the group containing the active
// tab is always visible directly below the header (desktop inline nav +
// mobile bottom bar share the same derived strip).
const NAV_GROUPS = [
  { key: "market", label: "Thị trường", children: ["market", "equity"] },
  { key: "newsAi", label: "Tin tức", children: ["news", "ai"] },
  { key: "research", label: "Nghiên cứu", children: ["research", "archetype", "rules", "backtest"] },
  { key: "simulation", label: "Mô phỏng", children: ["predict", "paper", "binanceHistory"] },
  { key: "system", label: "Hệ thống", children: ["settings"] },
] as const;

type NavGroup = (typeof NAV_GROUPS)[number];
type NavGroupKey = NavGroup["key"];

const ALERT_USER_ID = "default";

type ShellSignals = {
  aiCapabilities: AiCapabilitiesDto | null;
  /** True when the last capability check failed: capabilities are unverified, not "off". */
  capabilityCheckFailed: boolean;
  contractState: ApiContractState;
};

const ShellSignalsContext = createContext<ShellSignals>({
  aiCapabilities: null,
  capabilityCheckFailed: false,
  contractState: "checking",
});

function groupOf(tab: TabKey): NavGroup | undefined {
  return NAV_GROUPS.find((g) => (g.children as readonly TabKey[]).includes(tab));
}

export function useShellSignals(): ShellSignals {
  return useContext(ShellSignalsContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab: TabKey = PATH_TAB.get(pathname) ?? "market";
  const lastChildByGroup = useRef<Partial<Record<NavGroupKey, TabKey>>>({});
  const lastHrefByTab = useRef<Partial<Record<TabKey, string>>>({});
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [aiCapabilities, setAiCapabilities] = useState<AiCapabilitiesDto | null>(null);
  const [capabilityCheckFailed, setCapabilityCheckFailed] = useState(false);
  const [contractState, setContractState] = useState<ApiContractState>("checking");
  const [verifying, setVerifying] = useState(false);
  const llmState = getLlmUiState(aiCapabilities, capabilityCheckFailed);
  const groupButtonRefs = useRef<Partial<Record<NavGroupKey, HTMLButtonElement | null>>>({});
  const groupButtonRefsMobile = useRef<Partial<Record<NavGroupKey, HTMLButtonElement | null>>>({});
  const chipButtonRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const focusChipAfterOpen = useRef(false);
  const pendingChipFocus = useRef<TabKey | null>(null);

  // Remembers the full href (path + query, e.g. ?symbol=BID) of the screen being left,
  // so returning through the nav restores the same symbol/filter instead of a default.
  const rememberCurrentLocation = () => {
    const { pathname: path, search } = window.location;
    const tab = PATH_TAB.get(path);
    if (!tab) return;
    lastHrefByTab.current[tab] = path + search;
    const group = groupOf(tab);
    if (group) lastChildByGroup.current[group.key] = tab;
    try {
      sessionStorage.setItem(NAV_MEMORY_KEY, JSON.stringify(lastHrefByTab.current));
    } catch {}
  };

  const hrefForTab = (key: TabKey): string => {
    const href = lastHrefByTab.current[key];
    return isRestorableHref(href, RESTORABLE_PATHS) && PATH_TAB.get(href.split(/[?#]/, 1)[0]) === key
      ? href
      : TAB_PATH[key];
  };

  const handleTabChange = (key: TabKey) => {
    rememberCurrentLocation();
    router.push(hrefForTab(key));
  };

  const activateGroup = (group: NavGroup) => {
    const children = group.children as readonly TabKey[];
    const target = (children.includes(activeTab) ? activeTab : lastChildByGroup.current[group.key]) ?? children[0];
    lastChildByGroup.current[group.key] = target;
    handleTabChange(target);
    if (focusChipAfterOpen.current) {
      focusChipAfterOpen.current = false;
      pendingChipFocus.current = target;
    }
  };

  const selectChild = (groupKey: NavGroupKey, childKey: TabKey) => {
    lastChildByGroup.current[groupKey] = childKey;
    handleTabChange(childKey);
  };

  // Restore nav memory for this browser tab (survives reload). Holds only in-app paths
  // with their public query string, validated before use — never secrets.
  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(sessionStorage.getItem(NAV_MEMORY_KEY) ?? "{}");
      if (!raw || typeof raw !== "object") return;
      for (const [tab, href] of Object.entries(raw as Record<string, unknown>)) {
        if (!TAB_BY_KEY.has(tab as TabKey) || !isRestorableHref(href, RESTORABLE_PATHS)) continue;
        lastHrefByTab.current[tab as TabKey] = href;
        const group = groupOf(tab as TabKey);
        if (group && !lastChildByGroup.current[group.key]) lastChildByGroup.current[group.key] = tab as TabKey;
      }
    } catch {}
  }, []);

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLButtonElement>, group: NavGroup) => {
    if (event.key === "Enter" && group.children.length > 1) {
      // Enter also dispatches click, which performs the actual activation.
      focusChipAfterOpen.current = true;
    }
  };

  const handleChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, group: NavGroup, index: number) => {
    const children = group.children as readonly TabKey[];
    if (event.key === "Escape") {
      event.preventDefault();
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const target = isDesktop
        ? groupButtonRefs.current[group.key]
        : groupButtonRefsMobile.current[group.key];
      target?.focus();
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

  const activeGroupDef = NAV_GROUPS.find((g) =>
    (g.children as readonly TabKey[]).includes(activeTab),
  );
  const subRowGroup = activeGroupDef && activeGroupDef.children.length > 1 ? activeGroupDef : null;

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

  // Contract + capability verification. Re-runs with backoff while the API is unreachable
  // or mismatched, on reconnect/visibility, and on demand; never overlaps itself.
  // Mutations stay locked (fail-closed) until a compatible contract is confirmed.
  const mountedRef = useRef(true);
  const verifyInFlight = useRef(false);
  const verifyFailures = useRef(0);
  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyHealthy = useRef(false);
  // Timer callbacks re-enter through a ref (a callback cannot reference itself).
  const verifyRef = useRef<() => Promise<void>>(async () => {});

  const verify = useCallback(async () => {
    if (verifyInFlight.current) return;
    verifyInFlight.current = true;
    if (verifyTimer.current) clearTimeout(verifyTimer.current);
    verifyTimer.current = null;
    const [metaResult, capabilityResult] = await Promise.allSettled([
      getAppMeta(AbortSignal.timeout(META_TIMEOUT_MS)),
      getAiCapabilities(AbortSignal.timeout(META_TIMEOUT_MS)),
    ]);
    verifyInFlight.current = false;
    if (!mountedRef.current) return;

    const compatible = metaResult.status === "fulfilled" && isApiContractCompatible(metaResult.value);
    setApiContractCompatibility(compatible);
    setContractState(metaResult.status === "rejected" ? "unavailable" : compatible ? "compatible" : "mismatch");
    if (capabilityResult.status === "fulfilled") {
      setAiCapabilities(capabilityResult.value);
      setCapabilityCheckFailed(false);
    } else {
      setAiCapabilities(null);
      setCapabilityCheckFailed(true);
    }

    verifyHealthy.current = compatible && capabilityResult.status === "fulfilled";
    verifyFailures.current = verifyHealthy.current ? 0 : verifyFailures.current + 1;
    if (!verifyHealthy.current) {
      const delay = backoffDelayMs(verifyFailures.current - 1, VERIFY_RETRY_BASE_MS, VERIFY_RETRY_MAX_MS);
      verifyTimer.current = setTimeout(() => {
        verifyTimer.current = null;
        // A hidden tab waits for visibilitychange instead of polling in the background.
        if (document.visibilityState === "visible") void verifyRef.current();
      }, delay);
    }
  }, []);

  useEffect(() => {
    verifyRef.current = verify;
  }, [verify]);

  // State updates in verify() happen only after its awaited requests; calling through
  // the ref keeps the effect free of synchronous setState.
  useEffect(() => {
    mountedRef.current = true;
    void verifyRef.current();
    const recheckIfUnhealthy = () => {
      if (!verifyHealthy.current && document.visibilityState === "visible" && !verifyTimer.current) void verifyRef.current();
    };
    const onOnline = () => {
      if (!verifyHealthy.current) void verifyRef.current();
    };
    document.addEventListener("visibilitychange", recheckIfUnhealthy);
    window.addEventListener("online", onOnline);
    return () => {
      mountedRef.current = false;
      if (verifyTimer.current) clearTimeout(verifyTimer.current);
      document.removeEventListener("visibilitychange", recheckIfUnhealthy);
      window.removeEventListener("online", onOnline);
    };
  }, [verify]);

  return (
    <ShellSignalsContext.Provider value={{ aiCapabilities, capabilityCheckFailed, contractState }}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header inert={alertsOpen} className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
          <div className="max-w-[1600px] mx-auto px-4 h-11 flex items-center gap-4">
            <h1 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-100 shrink-0">
              <span className="w-2 h-2 rounded-full bg-teal-500" aria-hidden="true" />
              Bitcoin AI Analyst
            </h1>

            <nav
              aria-label="Điều hướng chính"
              data-testid="nav-groups"
              className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0"
            >
              {NAV_GROUPS.map((group) => {
                const multi = group.children.length > 1;
                const containsActive = (group.children as readonly TabKey[]).includes(activeTab);
                return (
                  <button
                    type="button"
                    key={group.key}
                    ref={(el) => {
                      groupButtonRefs.current[group.key] = el;
                    }}
                    onClick={() => activateGroup(group)}
                    onKeyDown={(event) => handleGroupKeyDown(event, group)}
                    aria-expanded={multi ? containsActive : undefined}
                    aria-controls={multi ? "nav-sub-row" : undefined}
                    aria-current={containsActive ? (multi ? "true" : "page") : undefined}
                    className={`h-11 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      containsActive
                        ? "text-teal-300 border-teal-400"
                        : "text-slate-400 hover:text-slate-200 border-transparent"
                    }`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex-1 lg:hidden" />

            <div className="flex items-center gap-1 shrink-0">
              {llmState !== "on" && (
                <span
                  data-testid="llm-state"
                  data-llm-state={llmState}
                  className={`hidden sm:inline-flex rounded px-2 py-1 text-xs ${
                    llmState === "off" ? "bg-amber-500/10 text-amber-300" : "bg-slate-900 text-slate-400"
                  }`}
                >
                  {LLM_STATE_LABEL[llmState]}
                </span>
              )}
              <button
                onClick={() => setAlertsOpen(true)}
                className="relative w-10 h-10 rounded flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                aria-label="Thông báo"
              >
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-xs font-bold bg-rose-600 text-white rounded-full">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            </div>
          </div>

          {subRowGroup && (
            <div
              id="nav-sub-row"
              data-testid="nav-sub-row"
              role="group"
              aria-label={`${subRowGroup.label} — mục con`}
              className="border-t border-slate-800 bg-slate-900/60"
            >
              <div className="max-w-[1600px] mx-auto flex gap-1 overflow-x-auto px-4">
                {subRowGroup.children.map((childKey, index) => {
                  const child = TAB_BY_KEY.get(childKey)!;
                  const childActive = activeTab === childKey;
                  return (
                    <button
                      type="button"
                      key={childKey}
                      ref={(el) => {
                        chipButtonRefs.current[childKey] = el;
                      }}
                      onClick={() => selectChild(subRowGroup.key, childKey)}
                      onKeyDown={(event) => handleChipKeyDown(event, subRowGroup, index)}
                      aria-current={childActive ? "page" : undefined}
                      className={`h-10 shrink-0 px-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                        childActive
                          ? "text-teal-300 border-teal-400"
                          : "text-slate-400 hover:text-slate-200 border-transparent"
                      }`}
                    >
                      {child.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {contractState !== "compatible" && (
            <div
              data-testid="connection-banner"
              data-contract-state={contractState}
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-amber-900/60 bg-amber-950/40 px-4 py-1.5 text-center text-xs text-amber-200"
              role="alert"
            >
              <span>
                {contractState === "checking"
                  ? "Đang kiểm tra API contract và kết nối máy chủ; các thao tác ghi tạm khóa."
                  : contractState === "mismatch"
                    ? `API contract không khớp (frontend cần ${EXPECTED_API_CONTRACT_VERSION}); các thao tác ghi đã bị khóa.`
                    : "Không kiểm tra được API contract (mất kết nối máy chủ); dữ liệu và trạng thái hệ thống chưa xác minh, các thao tác ghi đã bị khóa."}
              </span>
              {contractState !== "checking" && (
                <button
                  type="button"
                  onClick={() => {
                    setVerifying(true);
                    void verify().finally(() => setVerifying(false));
                  }}
                  disabled={verifying}
                  className="rounded border border-amber-700/60 px-2 py-0.5 text-amber-100 hover:bg-amber-900/40 disabled:opacity-60"
                >
                  {verifying ? "Đang thử kết nối lại…" : "Thử kết nối lại"}
                </button>
              )}
            </div>
          )}
        </header>

        <main inert={alertsOpen} className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
          {children}
        </main>

        <nav
          inert={alertsOpen}
          aria-label="Điều hướng chính"
          data-testid="nav-groups-mobile"
          className="sticky bottom-0 z-40 lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur"
        >
          <div className="flex">
            {NAV_GROUPS.map((group) => {
              const multi = group.children.length > 1;
              const containsActive = (group.children as readonly TabKey[]).includes(activeTab);
              const GroupIcon = TAB_BY_KEY.get((group.children as readonly TabKey[])[0])!.icon;
              return (
                <button
                  type="button"
                  key={group.key}
                  ref={(el) => {
                    groupButtonRefsMobile.current[group.key] = el;
                  }}
                  onClick={() => activateGroup(group)}
                  onKeyDown={(event) => handleGroupKeyDown(event, group)}
                  aria-expanded={multi ? containsActive : undefined}
                  aria-controls={multi ? "nav-sub-row" : undefined}
                  aria-current={containsActive ? (multi ? "true" : "page") : undefined}
                  className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 py-2 border-t-2 transition-colors ${
                    containsActive ? "text-teal-300 border-teal-400" : "text-slate-500 hover:text-slate-300 border-transparent"
                  }`}
                >
                  <GroupIcon className="w-5 h-5" />
                  <span className="text-[11px] font-medium leading-tight truncate max-w-full px-1">{group.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
        {/* Whole chat surface (launcher + panel) is inert while the alerts
            modal is open; an already-open chat is dismissed by the modal. */}
        {/* The floating chat is offered only while the LLM layer is verified on;
            otherwise it would advertise a feature that cannot be used. */}
        {llmState === "on" && (
          <div inert={alertsOpen}>
            <AiChatWidget capabilities={aiCapabilities} dismissedByModal={alertsOpen} />
          </div>
        )}
      </div>
    </ShellSignalsContext.Provider>
  );
}
