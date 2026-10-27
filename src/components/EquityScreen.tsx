"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { BtcCandlestickChart } from "./BtcCandlestickChart";
import { SessionAccessPanel } from "./SessionAccessPanel";
import { EquityBaseRatesPanel, EquityContextPanel, EquityObservationsPanel, SourceDocumentsPanel, type PanelState } from "./EquityResearchPanels";
import { ForecastJournalPanel, LlmRunsPanel, ResearchNotesPanel, type QuantLookup } from "./EquityJournalPanels";
import {
  getEquityBaseRates,
  getEquityForecastJournal,
  getEquityLlmRuns,
  getEquityCandles,
  getEquityConditions,
  getEquityContext,
  getEquityDataQuality,
  getEquityDecision,
  getEquityObservations,
  getEquityPosition,
  getEquityResearchNotes,
  getEquitySourceDocuments,
  getInstrumentCatalog,
  putEquityCash,
  putEquityPosition,
} from "@/lib/api";
import {
  BUY_GATE_COPY,
  CASH_REASON_COPY,
  buyQuantityGate,
  describeDecisionReason,
  unconvertedCorporateActionReasons,
  type ResearchNote,
  type SourceDocument,
} from "@/lib/equityResearch";
import {
  EQUITY_SYMBOLS,
  normalizeEquityTimeframe,
  resolveEquitySymbol,
  type EquityBaseRates,
  type EquityCatalog,
  type EquityContext,
  type EquityObservation,
  type EquityOptional,
  type EquityProfile,
  type EquitySymbol,
} from "@/lib/equity";
import { quantReferenceFor, type ForecastJournal, type LlmRun } from "@/lib/equityJournal";
import {
  MBB_ACTION_LABELS,
  formatMbbPct,
  formatShares,
  formatVnd,
  formatVnDateTime,
  mbbCandlesToKlines,
  type EquityParseScope,
  type MbbCoverageReport,
  type MbbDecision,
  type MbbPosition,
  type MbbTimeframe,
  type UpdateMbbPositionRequest,
} from "@/lib/mbb";
import { getSessionKey, setSessionKey } from "@/lib/sessionAuth";
import { LatestRequestGate } from "@/lib/technicalReplay";
import type { KlineOHLC } from "@/lib/types";
import type { CurrentConditionsResponse } from "@/lib/currentConditions";
import { moduleLabel } from "@/lib/moduleLabels";

export const EQUITY_PATH = "/co-phieu";

const DIRECTION_LABEL: Record<string, string> = {
  bullish: "Tăng",
  bearish: "Giảm",
  neutral: "Trung lập",
};

const KIND_LABEL: Record<string, string> = {
  triggeredOnBar: "mới trên nến đóng gần nhất",
  state: "trạng thái hiện hữu",
  activeZone: "vùng đang hiệu lực",
  operativeLeg: "nhịp Fibonacci đang có hiệu lực",
};

/** Position-relative action semantics — sell never shorts, buy-more never exceeds cash. */
const ACTION_NOTE: Record<string, string> = {
  hold: "Không hành động — giữ nguyên vị thế hiện tại.",
  wait: "Không hành động — chờ đủ điều kiện hoặc đủ dữ liệu.",
  "buy-more": "Có thể mua thêm trong ngân sách mua đã khai báo cho mã này (không vượt quỹ tiền mặt chung), theo lô 100 cổ phiếu.",
  reduce: "Đề xuất giảm một phần — chỉ bán được số cổ phiếu đã thanh toán (settled).",
  sell: "Đề xuất bán — chỉ bán được số cổ phiếu đã thanh toán (settled), không bán khống.",
  "conditional-sell": "Bán khi điều kiện kích hoạt — kiểm tra band ±7% và rủi ro không khớp bên dưới.",
};

type LotDraft = { quantity: string; costPerShareVnd: string; acquireDate: string };
type EquityScope = EquityParseScope & { symbol: EquitySymbol };

/** "" → null (undeclared); otherwise a VND amount >= 0. */
function parseMoneyDraft(raw: string): { value: number | null } | { error: true } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null };
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? { value: parsed } : { error: true };
}

/**
 * EQX v2 §A3: with the shared cash pool reported, the position body carries lots +
 * buyBudgetVnd and NEVER availableCashVnd (that would overwrite the shared pool); an
 * older backend still takes its per-symbol cash.
 */
function parseLotDrafts(
  lots: LotDraft[],
  money: { mode: "shared-pool"; budget: string } | { mode: "legacy"; cash: string },
): { error: string } | { body: UpdateMbbPositionRequest } {
  let extra: { buyBudgetVnd: number | null } | { availableCashVnd: number };
  if (money.mode === "shared-pool") {
    const budget = parseMoneyDraft(money.budget);
    if ("error" in budget) return { error: "Ngân sách mua thêm phải là số >= 0 (để trống = chưa khai báo)." };
    extra = { buyBudgetVnd: budget.value };
  } else {
    const cash = parseMoneyDraft(money.cash);
    if ("error" in cash || cash.value == null) return { error: "Tiền mặt khả dụng phải là số >= 0." };
    extra = { availableCashVnd: cash.value };
  }
  const parsedLots = [];
  for (let index = 0; index < lots.length; index++) {
    const lot = lots[index];
    const quantity = Number.parseInt(lot.quantity.trim(), 10);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { error: `Lô ${index + 1}: số lượng phải là số nguyên >= 1.` };
    }
    const cost = Number.parseFloat(lot.costPerShareVnd.trim().replace(",", "."));
    if (!Number.isFinite(cost) || cost <= 0) {
      return { error: `Lô ${index + 1}: giá vốn phải là số > 0.` };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lot.acquireDate.trim())) {
      return { error: `Lô ${index + 1}: ngày mua phải theo dạng yyyy-MM-dd.` };
    }
    parsedLots.push({ quantity, costPerShareVnd: cost, acquireDate: lot.acquireDate.trim() });
  }
  return { body: { lots: parsedLots, ...extra } };
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

/**
 * One guard per panel: every load aborts the previous in-flight request and
 * takes a fresh LatestRequestGate token; unmount (symbol switch remounts the
 * view via `key`) aborts and invalidates everything. A response can therefore
 * only land in the panel instance — and symbol — that asked for it.
 */
function usePanelRequest() {
  const gate = useRef(new LatestRequestGate());
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => {
    controller.current?.abort();
    gate.current.begin();
  }, []);
  return useCallback(() => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    const token = gate.current.begin();
    return { signal: next.signal, isCurrent: () => gate.current.isCurrent(token) };
  }, []);
}

// --- outer screen: URL → symbol resolution --------------------------------------------

export function EquityScreen({
  symbolParam,
  legacyMbbRoute = false,
  contractCompatible = false,
}: {
  /** Raw `?symbol=` value; ignored on the legacy /mbb route (always MBB). */
  symbolParam: string | null;
  legacyMbbRoute?: boolean;
  contractCompatible?: boolean;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<EquityCatalog | null>(null);
  const [catalogFallback, setCatalogFallback] = useState(false);
  const [reloadEpoch, setReloadEpoch] = useState(0);

  // Catalog only narrows timeframes / flags non-decision symbols; the static
  // spec §1 profiles drive the first render so nothing waits on it.
  useEffect(() => {
    const controller = new AbortController();
    getInstrumentCatalog(controller.signal)
      .then((value) => setCatalog(value))
      .catch(() => {
        if (!controller.signal.aborted) setCatalogFallback(true);
      });
    return () => controller.abort();
  }, []);

  const resolution = useMemo(
    () => resolveEquitySymbol(legacyMbbRoute ? "MBB" : symbolParam, catalog),
    [legacyMbbRoute, symbolParam, catalog],
  );
  const currentSymbol = resolution.status === "ok" ? resolution.profile.symbol : null;

  // URL is the single source of truth (pitfall #28): the handler only navigates.
  // Re-selecting the current symbol cannot change the URL, so it reloads
  // instead of dying silently (pitfall #21).
  const selectSymbol = (symbol: EquitySymbol) => {
    if (symbol === currentSymbol) {
      setReloadEpoch((n) => n + 1);
      return;
    }
    router.push(`${EQUITY_PATH}?symbol=${symbol}`, { scroll: false });
  };

  const selector = (
    <div role="group" aria-label="Chọn mã cổ phiếu" className="flex overflow-hidden rounded border border-slate-700">
      {EQUITY_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          aria-pressed={currentSymbol === symbol}
          onClick={() => selectSymbol(symbol)}
          className={`min-h-9 px-3 text-xs font-semibold transition-colors ${
            currentSymbol === symbol ? "bg-teal-500/20 text-teal-300" : "bg-slate-950 text-slate-400 hover:text-slate-200"
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );

  if (resolution.status !== "ok") {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">Cổ phiếu</h2>
          {selector}
        </header>
        <div className="rounded border border-amber-900/50 bg-amber-950/20 px-3 py-3 text-sm text-amber-200" role="alert" data-testid="equity-symbol-error">
          {resolution.status === "unknown"
            ? `Mã "${resolution.symbol}" không có trong danh mục cổ phiếu được hỗ trợ (${EQUITY_SYMBOLS.join(", ")}).`
            : `Mã ${resolution.symbol} không hỗ trợ trang này: ${resolution.reason}`}
          <span className="mt-1 block text-xs text-amber-200/70">Không có dữ liệu nào được tải cho mã này. Chọn một mã ở trên.</span>
        </div>
      </div>
    );
  }

  return (
    <EquitySymbolView
      key={resolution.profile.symbol}
      profile={resolution.profile}
      selector={selector}
      catalogFallback={catalogFallback}
      contractCompatible={contractCompatible}
      reloadEpoch={reloadEpoch}
    />
  );
}

// --- per-symbol view (remounted on symbol change) -----------------------------------

function EquitySymbolView({
  profile,
  selector,
  catalogFallback,
  contractCompatible,
  reloadEpoch,
}: {
  profile: EquityProfile;
  selector: ReactNode;
  catalogFallback: boolean;
  contractCompatible: boolean;
  reloadEpoch: number;
}) {
  const symbol = profile.symbol;
  const sym = symbol.toLowerCase();
  const timeframesKey = profile.timeframes.join(",");
  // Primitive deps only: a catalog response that agrees with the static profile
  // must not refire every request.
  const scope = useMemo<EquityScope>(
    () => ({ symbol, timeframes: timeframesKey.split(",") }),
    [symbol, timeframesKey],
  );
  const [timeframeChoice, setTimeframeChoice] = useState<MbbTimeframe>(profile.defaultTimeframe);
  const timeframe = normalizeEquityTimeframe(profile, timeframeChoice);

  const [candles, setCandles] = useState<KlineOHLC[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [candlesError, setCandlesError] = useState<string | null>(null);

  const [conditions, setConditions] = useState<CurrentConditionsResponse | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const [decision, setDecision] = useState<MbbDecision | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const [position, setPosition] = useState<MbbPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [positionError, setPositionError] = useState<string | null>(null);

  const [quality, setQuality] = useState<PanelState<MbbCoverageReport>>({ kind: "loading" });
  const [observations, setObservations] = useState<PanelState<EquityObservation[]> | { kind: "locked" }>({ kind: "loading" });
  const [baseRates, setBaseRates] = useState<PanelState<EquityOptional<EquityBaseRates>>>({ kind: "loading" });
  const [context, setContext] = useState<PanelState<EquityOptional<EquityContext>>>({ kind: "loading" });
  const [journal, setJournal] = useState<PanelState<EquityOptional<ForecastJournal>>>({ kind: "loading" });
  const [llmRuns, setLlmRuns] = useState<PanelState<EquityOptional<LlmRun[]>>>({ kind: "loading" });
  // Legacy LLM history is read-only and collapsed; it is only fetched once opened.
  const [llmOpen, setLlmOpen] = useState(false);
  const [sourceDocuments, setSourceDocuments] = useState<PanelState<EquityOptional<SourceDocument[]>>>({ kind: "loading" });
  const [researchNotes, setResearchNotes] = useState<PanelState<EquityOptional<ResearchNote[]>> | { kind: "locked" }>({ kind: "loading" });

  // sessionStorage is client-only — initialize locked so SSR and the first
  // client render match, then sync the real state after mount.
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [adminRejected, setAdminRejected] = useState(false);
  const [accessPanelEpoch, setAccessPanelEpoch] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only: sync the real unlock state after mount so SSR and the first client render match
    setAdminUnlocked(Boolean(getSessionKey("admin")));
    setSessionChecked(true);
  }, []);
  const [lotDrafts, setLotDrafts] = useState<LotDraft[]>([]);
  const [cashDraft, setCashDraft] = useState("");
  const [budgetDraft, setBudgetDraft] = useState("");
  const [sharedCashDraft, setSharedCashDraft] = useState("");
  const [cashSaving, setCashSaving] = useState(false);
  const [cashSaveError, setCashSaveError] = useState<string | null>(null);
  const [cashSaveOk, setCashSaveOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [decisionEpoch, setDecisionEpoch] = useState(0);

  const candlesRequest = usePanelRequest();
  const conditionsRequest = usePanelRequest();
  const decisionRequest = usePanelRequest();
  const positionRequest = usePanelRequest();
  const qualityRequest = usePanelRequest();
  const observationsRequest = usePanelRequest();
  const baseRatesRequest = usePanelRequest();
  const contextRequest = usePanelRequest();
  const journalRequest = usePanelRequest();
  const llmRunsRequest = usePanelRequest();
  const researchNotesRequest = usePanelRequest();
  const sourceDocumentsRequest = usePanelRequest();
  const saveRequest = usePanelRequest();
  const cashSaveRequest = usePanelRequest();

  const loadCandles = useCallback(async (tf: MbbTimeframe) => {
    const req = candlesRequest();
    setCandlesLoading(true);
    setCandlesError(null);
    try {
      const data = await getEquityCandles(scope, tf, req.signal);
      if (!req.isCurrent()) return;
      setCandles(mbbCandlesToKlines(data));
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      setCandles([]);
      setCandlesError(errorMessage(e, `Không tải được nến ${scope.symbol}`));
    } finally {
      if (req.isCurrent()) setCandlesLoading(false);
    }
  }, [candlesRequest, scope]);

  const loadConditions = useCallback(async (tf: MbbTimeframe) => {
    const req = conditionsRequest();
    setConditionsLoading(true);
    setConditionsError(null);
    try {
      const data = await getEquityConditions(scope, tf, req.signal);
      if (!req.isCurrent()) return;
      if (data.timeframe !== tf) {
        setConditions(null);
        setConditionsError("Phản hồi timeframe không khớp yêu cầu.");
        return;
      }
      setConditions(data);
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      setConditions(null);
      setConditionsError(errorMessage(e, "Điều kiện hiện tại không khả dụng"));
    } finally {
      if (req.isCurrent()) setConditionsLoading(false);
    }
  }, [conditionsRequest, scope]);

  // A server 401 means the stored key is wrong: drop it and remount the access
  // panel so it shows the key input again instead of a stale "unlocked" chip.
  const handleAuthFailure = useCallback((e: unknown): boolean => {
    if (e instanceof Error && e.message === "ADMIN_AUTH_REQUIRED") {
      if (getSessionKey("admin")) {
        setSessionKey("admin", "");
        setAdminRejected(true);
        setAccessPanelEpoch((n) => n + 1);
      }
      setAdminUnlocked(false);
      return true;
    }
    return false;
  }, []);

  const loadDecision = useCallback(async () => {
    const req = decisionRequest();
    // AdminGuard'd endpoint carrying personal data — fail-closed when the
    // session has no admin key instead of firing a doomed 401 request.
    if (!getSessionKey("admin")) {
      setDecision(null);
      setDecisionError(null);
      setDecisionLoading(false);
      return;
    }
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const data = await getEquityDecision(scope, req.signal);
      if (!req.isCurrent()) return;
      setDecision(data);
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      setDecision(null);
      if (!handleAuthFailure(e)) setDecisionError(errorMessage(e, `Không tải được quyết định ${scope.symbol}`));
    } finally {
      if (req.isCurrent()) setDecisionLoading(false);
    }
  }, [decisionRequest, scope, handleAuthFailure]);

  const applyPosition = useCallback((data: MbbPosition) => {
    setPosition(data);
    setLotDrafts(data.lots.map((lot) => ({
      quantity: String(lot.quantity),
      costPerShareVnd: String(lot.costPerShareVnd),
      acquireDate: lot.acquireDate,
    })));
    setCashDraft(String(data.availableCashVnd));
    setBudgetDraft(data.buyBudgetVnd == null ? "" : String(data.buyBudgetVnd));
    setSharedCashDraft(data.sharedCashVnd == null ? "" : String(data.sharedCashVnd));
  }, []);

  const loadPosition = useCallback(async () => {
    const req = positionRequest();
    if (!getSessionKey("admin")) {
      setPosition(null);
      setPositionError(null);
      setPositionLoading(false);
      setLotDrafts([]);
      setCashDraft("");
      setBudgetDraft("");
      setSharedCashDraft("");
      return;
    }
    setPositionLoading(true);
    setPositionError(null);
    try {
      const data = await getEquityPosition(scope, req.signal);
      if (!req.isCurrent()) return;
      applyPosition(data);
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      setPosition(null);
      if (!handleAuthFailure(e)) setPositionError(errorMessage(e, `Không tải được vị thế ${scope.symbol}`));
    } finally {
      if (req.isCurrent()) setPositionLoading(false);
    }
  }, [positionRequest, scope, applyPosition, handleAuthFailure]);

  const loadQuality = useCallback(async () => {
    const req = qualityRequest();
    setQuality({ kind: "loading" });
    try {
      const data = await getEquityDataQuality(scope, req.signal);
      if (req.isCurrent()) setQuality({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setQuality({ kind: "error", message: errorMessage(e, "Không tải được báo cáo chất lượng dữ liệu") });
    }
  }, [qualityRequest, scope]);

  // Observations reveal holdings-driven decisions — AdminGuard'd; no request without a key.
  const loadObservations = useCallback(async (tf: MbbTimeframe) => {
    const req = observationsRequest();
    if (!getSessionKey("admin")) {
      setObservations({ kind: "locked" });
      return;
    }
    setObservations({ kind: "loading" });
    try {
      const data = await getEquityObservations(scope, tf, req.signal);
      if (req.isCurrent()) setObservations({ kind: "ready", value: data });
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      if (handleAuthFailure(e)) setObservations({ kind: "locked" });
      else setObservations({ kind: "error", message: errorMessage(e, "Không tải được nhật ký quan sát") });
    }
  }, [observationsRequest, scope, handleAuthFailure]);

  const loadBaseRates = useCallback(async () => {
    const req = baseRatesRequest();
    setBaseRates({ kind: "loading" });
    try {
      const data = await getEquityBaseRates(scope.symbol, req.signal);
      if (req.isCurrent()) setBaseRates({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setBaseRates({ kind: "error", message: errorMessage(e, "Không tải được base rates") });
    }
  }, [baseRatesRequest, scope]);

  const loadContext = useCallback(async () => {
    const req = contextRequest();
    setContext({ kind: "loading" });
    try {
      const data = await getEquityContext(scope.symbol, req.signal);
      if (req.isCurrent()) setContext({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setContext({ kind: "error", message: errorMessage(e, "Không tải được bối cảnh") });
    }
  }, [contextRequest, scope]);

  const loadJournal = useCallback(async () => {
    const req = journalRequest();
    setJournal({ kind: "loading" });
    try {
      const data = await getEquityForecastJournal(scope.symbol, req.signal);
      if (req.isCurrent()) setJournal({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setJournal({ kind: "error", message: errorMessage(e, "Không tải được nhật ký dự báo") });
    }
  }, [journalRequest, scope]);

  const loadLlmRuns = useCallback(async () => {
    const req = llmRunsRequest();
    setLlmRuns({ kind: "loading" });
    try {
      const data = await getEquityLlmRuns(scope.symbol, req.signal);
      if (req.isCurrent()) setLlmRuns({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setLlmRuns({ kind: "error", message: errorMessage(e, "Không tải được các run LLM") });
    }
  }, [llmRunsRequest, scope]);

  const loadSourceDocuments = useCallback(async () => {
    const req = sourceDocumentsRequest();
    setSourceDocuments({ kind: "loading" });
    try {
      const data = await getEquitySourceDocuments(scope.symbol, req.signal);
      if (req.isCurrent()) setSourceDocuments({ kind: "ready", value: data });
    } catch (e) {
      if (req.isCurrent() && !isAbort(e)) setSourceDocuments({ kind: "error", message: errorMessage(e, "Không tải được tài liệu gốc") });
    }
  }, [sourceDocumentsRequest, scope]);

  // Research notes can reveal holdings through actionView — AdminGuard'd; no request without a key.
  const loadResearchNotes = useCallback(async () => {
    const req = researchNotesRequest();
    if (!getSessionKey("admin")) {
      setResearchNotes({ kind: "locked" });
      return;
    }
    setResearchNotes({ kind: "loading" });
    try {
      const data = await getEquityResearchNotes(scope.symbol, req.signal);
      if (req.isCurrent()) setResearchNotes({ kind: "ready", value: data });
    } catch (e) {
      if (!req.isCurrent() || isAbort(e)) return;
      if (handleAuthFailure(e)) setResearchNotes({ kind: "locked" });
      else setResearchNotes({ kind: "error", message: errorMessage(e, "Không tải được ghi chú nghiên cứu") });
    }
  }, [researchNotesRequest, scope, handleAuthFailure]);

  // Gates drop in-flight responses for the previous timeframe — the UI never
  // renders candles/conditions/observations from a stale selection.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on timeframe/reload: the loaders mark their panels loading before awaiting; request gates drop stale responses
    void loadCandles(timeframe);
    void loadConditions(timeframe);
  }, [timeframe, loadCandles, loadConditions, reloadEpoch]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch on timeframe/unlock/reload: the loader marks the panel loading before awaiting; its request gate drops stale responses
  useEffect(() => { void loadObservations(timeframe); }, [timeframe, loadObservations, adminUnlocked, reloadEpoch]);

  // Unlocking the admin session (re)loads the personal endpoints; locking
  // clears their state through the loaders' fail-closed guard.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reload on unlock/lock/reload: the loader resets to the locked state or marks loading before awaiting; its request gate drops stale responses
  useEffect(() => { void loadDecision(); }, [loadDecision, decisionEpoch, adminUnlocked, reloadEpoch]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reload on unlock/lock/reload: the loader resets to the locked state or marks loading before awaiting; its request gate drops stale responses
  useEffect(() => { void loadPosition(); }, [loadPosition, adminUnlocked, reloadEpoch]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reload on unlock/lock/reload: the loader resets to the locked state or marks loading before awaiting; its request gate drops stale responses
  useEffect(() => { void loadResearchNotes(); }, [loadResearchNotes, adminUnlocked, reloadEpoch]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/reload: the loaders mark their panels loading before awaiting; request gates drop stale responses
    void loadQuality();
    void loadBaseRates();
    void loadContext();
    void loadJournal();
    void loadSourceDocuments();
  }, [loadQuality, loadBaseRates, loadContext, loadJournal, loadSourceDocuments, reloadEpoch]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch LLM history once opened: the loader marks loading before awaiting; its request gate drops stale responses
    if (llmOpen) void loadLlmRuns();
  }, [llmOpen, loadLlmRuns, reloadEpoch]);

  const reloadAll = () => {
    void loadCandles(timeframe);
    void loadConditions(timeframe);
    void loadObservations(timeframe);
    void loadDecision();
    void loadPosition();
    void loadQuality();
    void loadBaseRates();
    void loadContext();
    void loadJournal();
    if (llmOpen) void loadLlmRuns();
    void loadResearchNotes();
    void loadSourceDocuments();
  };

  const sharedPool = position?.cashPoolReported === true;

  const savePosition = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    const parsed = parseLotDrafts(lotDrafts, sharedPool ? { mode: "shared-pool", budget: budgetDraft } : { mode: "legacy", cash: cashDraft });
    if ("error" in parsed) {
      setSaveError(parsed.error);
      setSaving(false);
      return;
    }
    // Token: a lock (or 401) while the PUT is in flight must not refill the
    // personal summary/drafts — apply only if still current and a key still exists.
    const req = saveRequest();
    try {
      const saved = await putEquityPosition(scope, parsed.body);
      if (!req.isCurrent() || !getSessionKey("admin")) return;
      applyPosition(saved);
      setSaveOk("Đã lưu vị thế — quyết định đang được tính lại.");
      setDecisionEpoch((n) => n + 1);
    } catch (e) {
      if (!req.isCurrent()) return;
      if (!handleAuthFailure(e)) setSaveError(errorMessage(e, "Lưu vị thế thất bại"));
    } finally {
      if (req.isCurrent()) setSaving(false);
    }
  };

  // One pool for MBB and BID (spec v2 §A3) — written once here, never per symbol.
  const saveSharedCash = async () => {
    setCashSaveError(null);
    setCashSaveOk(null);
    const parsed = parseMoneyDraft(sharedCashDraft);
    if ("error" in parsed || parsed.value == null) {
      setCashSaveError("Quỹ tiền mặt chung phải là số >= 0.");
      return;
    }
    const req = cashSaveRequest();
    setCashSaving(true);
    try {
      await putEquityCash(parsed.value);
      if (!req.isCurrent() || !getSessionKey("admin")) return;
      setCashSaveOk("Đã lưu quỹ tiền mặt chung (áp dụng cho cả MBB và BID) — quyết định đang được tính lại.");
      void loadPosition();
      setDecisionEpoch((n) => n + 1);
    } catch (e) {
      if (!req.isCurrent()) return;
      if (!handleAuthFailure(e)) setCashSaveError(errorMessage(e, "Lưu quỹ tiền mặt chung thất bại"));
    } finally {
      if (req.isCurrent()) setCashSaving(false);
    }
  };

  const onAdminChange = (unlocked: boolean) => {
    setAdminRejected(false);
    setAdminUnlocked(unlocked);
    if (!unlocked) {
      // Invalidate in-flight saves and drop any personal state immediately.
      saveRequest();
      cashSaveRequest();
      setSaving(false);
      setSaveOk(null);
      setSaveError(null);
      setCashSaving(false);
      setCashSaveOk(null);
      setCashSaveError(null);
    }
  };

  // Quant number beside an LLM forecast — only for the SAME signal bar (base-rates
  // when its bar matches, else the quant journal record for that bar, else "—").
  const quantFor = useCallback<QuantLookup>((configId, signalBarOpenTimeMs) => quantReferenceFor(
    configId,
    signalBarOpenTimeMs,
    baseRates.kind === "ready" && baseRates.value.status === "ok" ? baseRates.value.data : null,
    journal.kind === "ready" && journal.value.status === "ok" ? journal.value.data : null,
  ), [baseRates, journal]);

  const unconverted = decision ? unconvertedCorporateActionReasons(decision) : [];
  // A buy quantity is only shown behind a declared budget (spec v2 §A3).
  const buyGate = decision ? buyQuantityGate(decision, position) : null;
  const qualityReport = quality.kind === "ready" ? quality.value : null;
  const staleTimeframes = (qualityReport?.timeframes ?? []).filter((tf) => tf.isStale);
  const inputClass =
    "h-10 w-full rounded border border-slate-800 bg-slate-950 px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-teal-500 focus:outline-none disabled:opacity-50";

  return (
    <div className="mx-auto max-w-6xl space-y-4" data-testid="equity-screen" data-symbol={symbol}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">{symbol} — {profile.name}</h2>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{profile.venue}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{profile.currency}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
              {profile.dataProvider} · cross-check {profile.crossCheckDataProvider}
            </span>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 font-mono text-[11px] text-teal-300">giá {profile.priceBasis}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Cổ phiếu {profile.venue} theo phiên giờ Việt Nam · khung {profile.timeframes.join("/")} · dữ liệu nguồn {profile.dataProvider}, giá đã điều chỉnh quyền.
          </p>
          {catalogFallback && (
            <p className="mt-0.5 text-[11px] text-slate-500">Catalog /api/instruments không khả dụng — dùng cấu hình mã tĩnh.</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {selector}
          <Link
            href="/"
            className="inline-flex min-h-9 items-center rounded border border-slate-700 px-3 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
          >
            BTC/USDT
          </Link>
          <button
            type="button"
            onClick={reloadAll}
            className="inline-flex min-h-9 items-center gap-1.5 px-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </button>
        </div>
      </header>

      {staleTimeframes.length > 0 && (
        <p className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-xs text-amber-200" role="alert">
          Dữ liệu {symbol} {staleTimeframes.map((tf) => tf.timeframe).join("/")} đang cũ (stale) — nến mới nhất chưa khớp kỳ vọng của lịch phiên; các chỉ số bên dưới có thể lệch thời điểm.
        </p>
      )}

      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby={`${sym}-chart-title`}>
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id={`${sym}-chart-title`} className="text-[13px] font-semibold text-slate-200">Đồ thị nến {symbol}</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">nến cuối có thể đang hình thành theo phiên {profile.venue}</span>
            <div role="group" aria-label={`Khung thời gian ${symbol}`} className="flex overflow-hidden rounded border border-slate-700">
              {profile.timeframes.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  aria-pressed={timeframe === tf}
                  onClick={() => setTimeframeChoice(tf)}
                  className={`min-h-8 px-3 text-xs font-medium transition-colors ${
                    timeframe === tf ? "bg-teal-500/20 text-teal-300" : "bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3">
          {candlesLoading && <p className="text-sm text-slate-500">Đang tải nến {symbol} {timeframe}…</p>}
          {!candlesLoading && candlesError && (
            <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
              <span className="min-w-0 flex-1 break-words">Không tải được nến {symbol}: {candlesError}</span>
              <button type="button" onClick={() => void loadCandles(timeframe)} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
            </div>
          )}
          {!candlesLoading && !candlesError && candles.length === 0 && (
            <p className="text-sm text-slate-500">Chưa có nến {timeframe} cho {symbol} trong kho dữ liệu.</p>
          )}
          {!candlesLoading && candles.length > 0 && (
            <BtcCandlestickChart data={candles} timeframe={timeframe} height={380} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby={`${sym}-conditions-title`} data-testid={`${sym}-conditions`}>
          <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
            <h3 id={`${sym}-conditions-title`} className="text-[13px] font-semibold text-slate-200">Điều kiện hiện tại ({timeframe})</h3>
            <button type="button" onClick={() => void loadConditions(timeframe)} disabled={conditionsLoading} className="inline-flex min-h-9 items-center px-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50" aria-label={`Làm mới điều kiện ${symbol}`}>
              <RefreshCw className={`h-3.5 w-3.5 ${conditionsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="p-3">
            {conditionsLoading && <p className="text-sm text-slate-500">Đang tải điều kiện…</p>}
            {!conditionsLoading && conditionsError && (
              <div className="flex items-center gap-3 rounded border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-200" role="alert">
                <span className="min-w-0 flex-1 break-words">Điều kiện hiện tại chưa khả dụng: {conditionsError}</span>
                <button type="button" onClick={() => void loadConditions(timeframe)} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-amber-950/60">Thử lại</button>
              </div>
            )}
            {!conditionsLoading && !conditionsError && conditions && (
              <div className="space-y-3">
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Nến được phân tích (asOf)</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-slate-200">{formatVnDateTime(conditions.asOfMs)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Evidence</dt>
                    <dd className="mt-0.5 text-slate-200">
                      {conditions.evidence.available
                        ? `Có · cutoff ${formatVnDateTime(conditions.evidence.cutoffMs)}`
                        : `Không — ${conditions.evidence.reason ?? "không rõ lý do"}`}
                    </dd>
                  </div>
                </dl>
                {conditions.warnings.length > 0 && (
                  <ul className="space-y-1">
                    {conditions.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {warning}
                      </li>
                    ))}
                  </ul>
                )}
                {conditions.unavailableModules.length > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Module không khả dụng: {conditions.unavailableModules.map((m) => `${moduleLabel(m.module)} (${m.reason})`).join("; ")}
                  </p>
                )}
                {conditions.conditions.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có điều kiện nào đang thoả trên khung {timeframe}.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {conditions.conditions.map((condition, index) => (
                      <li key={`${condition.module}:${condition.eventId ?? condition.eventType}:${index}`} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-medium text-slate-200">{moduleLabel(condition.module)}</span>
                          <span className="font-mono text-[11px] text-slate-500">{condition.eventType}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] ${condition.direction === "bullish" ? "bg-emerald-950/40 text-emerald-300" : condition.direction === "bearish" ? "bg-rose-950/40 text-rose-300" : "bg-slate-800/60 text-slate-400"}`}>
                            {DIRECTION_LABEL[condition.direction] ?? condition.direction}
                          </span>
                          <span className="text-[11px] text-slate-500">{KIND_LABEL[condition.kind] ?? condition.kind}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          hình thành {formatVnDateTime(condition.formedTimeMs)} · khả dụng {formatVnDateTime(condition.availableTimeMs)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby={`${sym}-decision-title`} data-testid={`${sym}-decision`}>
          <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
            <h3 id={`${sym}-decision-title`} className="text-[13px] font-semibold text-slate-200">Quyết định đề xuất</h3>
            {decision && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-300" title="Quy tắc định lượng chưa qua kiểm chứng walk-forward">
                {decision.evidenceStatus} · chưa validated
              </span>
            )}
          </div>
          <div className="p-3">
            {decisionLoading && <p className="text-sm text-slate-500">Đang tính quyết định…</p>}
            {!decisionLoading && sessionChecked && !adminUnlocked && (
              <p className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-500" data-testid={`${sym}-decision-locked`}>
                Quyết định theo vị thế là dữ liệu cá nhân — mở khóa quyền quản trị ở mục “Vị thế {symbol}” bên dưới để xem.
              </p>
            )}
            {!decisionLoading && decisionError && (
              <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
                <span className="min-w-0 flex-1 break-words">Không tải được quyết định: {decisionError}</span>
                <button type="button" onClick={() => void loadDecision()} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
              </div>
            )}
            {!decisionLoading && !decisionError && decision && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`rounded px-2 py-1 text-sm font-semibold ${
                    decision.action === "sell" || decision.action === "reduce" || decision.action === "conditional-sell"
                      ? "bg-rose-950/50 text-rose-300"
                      : decision.action === "buy-more"
                        ? "bg-emerald-950/50 text-emerald-300"
                        : "bg-slate-800 text-slate-200"
                  }`}>
                    {MBB_ACTION_LABELS[decision.action]}
                  </span>
                  <span className="text-[11px] text-slate-500">tính lúc {formatVnDateTime(Date.parse(decision.generatedAtUtc))} · basis {decision.priceBasis}</span>
                </div>
                <p className="text-xs text-slate-400">{ACTION_NOTE[decision.action]}</p>
                {decision.reasons.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300" data-testid={`${sym}-decision-reasons`}>
                    {decision.reasons.map((reason, index) => <li key={index} data-reason={reason}>{describeDecisionReason(reason)}</li>)}
                  </ul>
                )}
                {decision.triggers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Điều kiện kích hoạt</p>
                    {decision.triggers.map((trigger, index) => (
                      <div key={index} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-slate-200">{trigger.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{trigger.timeframe}</span>
                          {trigger.priceLevelVnd != null && (
                            <span className="font-mono text-[11px] text-slate-300">@ {formatVnd(trigger.priceLevelVnd)}</span>
                          )}
                          {trigger.withinPriceBand === true && <span className="rounded bg-emerald-950/40 px-1 text-[10px] text-emerald-300">trong band ±7%</span>}
                          {trigger.withinPriceBand === false && <span className="rounded bg-rose-950/40 px-1 text-[10px] text-rose-300">ngoài band ±7% — lệnh sẽ bị từ chối</span>}
                          {trigger.withinPriceBand == null && <span className="rounded bg-slate-800 px-1 text-[10px] text-slate-400">chưa kiểm tra band</span>}
                        </div>
                        <p className="mt-0.5 text-slate-400">{trigger.condition}</p>
                        {trigger.nonFillRisk && (
                          <p className="mt-0.5 flex items-start gap-1 text-[11px] text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Rủi ro không khớp: {trigger.nonFillRisk}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {decision.invalidation && (
                  <p className="text-xs text-slate-400"><span className="font-medium text-slate-300">Mất hiệu lực khi:</span> {decision.invalidation}</p>
                )}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                  <div><dt className="text-slate-500">Tổng CP</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.totalShares)}</dd></div>
                  <div><dt className="text-slate-500">Bán được ngay (T+2)</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.sellableSharesNow)}</dd></div>
                  <div><dt className="text-slate-500">Chờ thanh toán</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.pendingShares)}</dd></div>
                  <div><dt className="text-slate-500">Giá vốn TB</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.avgCostPerShareVnd)}</dd></div>
                  <div><dt className="text-slate-500">Giá gần nhất</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.lastPriceVnd)}</dd></div>
                  <div>
                    <dt className="text-slate-500">PnL chưa chốt</dt>
                    <dd className="font-mono tabular-nums text-slate-200">
                      {decision.position.costBasisComparable === false
                        ? <span className="font-sans text-[11px] text-amber-300">không tính — giá vốn chưa quy đổi</span>
                        : decision.position.unrealizedPnlVnd == null && unconverted.length > 0
                          ? <span className="font-sans text-[11px] text-amber-300" data-testid={`${sym}-pnl-unconverted`}>không tính — {unconverted.join(", ")}</span>
                          : <>{formatVnd(decision.position.unrealizedPnlVnd)} ({formatMbbPct(decision.position.unrealizedPnlPct)})</>}
                    </dd>
                  </div>
                  {decision.position.netProceedsIfSellableNowVnd != null && (
                    <div className="col-span-2"><dt className="text-slate-500">Tiền về nếu bán hết phần bán được (sau phí 0.15% + thuế 0.1%)</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.netProceedsIfSellableNowVnd)}</dd></div>
                  )}
                  {decision.position.netProceedsIfSellableNowVnd == null && unconverted.length > 0 && (
                    <div className="col-span-2"><dt className="text-slate-500">Tiền về nếu bán hết phần bán được</dt><dd className="text-[11px] text-amber-300">không tính — {unconverted.join(", ")}</dd></div>
                  )}
                </dl>
                {decision.position.costBasisComparable === false && (
                  <p className="flex items-start gap-1.5 rounded border border-amber-900/50 bg-amber-950/20 px-2.5 py-1.5 text-[11px] text-amber-200" data-testid={`${sym}-cost-basis-note`}>
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {decision.position.costBasisNote ?? "Giá vốn thật chưa quy đổi theo sự kiện quyền kể từ ngày mua — không so sánh được với giá đã điều chỉnh, nên không hiển thị lãi/lỗ."}
                  </p>
                )}
                {decision.buyMore && buyGate?.show && (
                  <p className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300" data-testid={`${sym}-buy-quantity`}>
                    Sức mua thêm trong ngân sách {formatVnd(position?.buyBudgetVnd ?? null)}: tối đa {formatShares(decision.buyMore.maxBuyableShares)} ({decision.buyMore.maxBuyableLots} lô 100) ≈ {formatVnd(decision.buyMore.estimatedCostVnd)}.
                  </p>
                )}
                {buyGate && !buyGate.show && (decision.action === "buy-more" || decision.buyMore != null || buyGate.reason in CASH_REASON_COPY) && (
                  <p className="rounded border border-amber-900/50 bg-amber-950/20 px-2.5 py-1.5 text-xs text-amber-200" data-testid={`${sym}-buy-quantity-withheld`} data-reason={buyGate.reason}>
                    Không đề xuất số lượng mua: {BUY_GATE_COPY[buyGate.reason] ?? buyGate.reason}
                  </p>
                )}
                {decision.dataFreshness.some((f) => f.isStale) && (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    Dữ liệu {decision.dataFreshness.filter((f) => f.isStale).map((f) => f.timeframe).join("/")} cũ — quyết định có thể lệch thời điểm.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby={`${sym}-position-title`} data-testid={`${sym}-position-form`}>
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id={`${sym}-position-title`} className="text-[13px] font-semibold text-slate-200">Vị thế {symbol} (nhập tay)</h3>
          <span className="font-mono text-[11px] text-slate-500">lô 100 · T+2 · phí 0.15% · thuế bán 0.1%</span>
        </div>
        <div className="space-y-3 p-3">
          <SessionAccessPanel key={accessPanelEpoch} kind="admin" label="Quyền quản trị (ghi vị thế)" onChange={onAdminChange} />
          {adminRejected && (
            <p className="text-xs text-rose-300" role="alert">Khoá quản trị bị server từ chối (HTTP 401) — nhập lại khoá đúng.</p>
          )}
          {positionLoading && <p className="text-sm text-slate-500">Đang tải vị thế…</p>}
          {!positionLoading && sessionChecked && !adminUnlocked && (
            <p className="text-xs text-slate-500" data-testid={`${sym}-position-locked`}>
              Vị thế {symbol} đang khoá — nhập khoá quản trị ở trên để tải và chỉnh sửa.
            </p>
          )}

          {!positionLoading && positionError && (
            <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
              <span className="min-w-0 flex-1 break-words">Không tải được vị thế: {positionError}</span>
              <button type="button" onClick={() => void loadPosition()} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
            </div>
          )}
          {!positionLoading && adminUnlocked && position && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4" data-testid={`${sym}-position-summary`}>
              <div><dt className="text-slate-500">Tổng CP</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.totalShares)}</dd></div>
              <div><dt className="text-slate-500">Đã thanh toán</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.settledShares)}</dd></div>
              <div><dt className="text-slate-500">Chờ T+2</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.pendingShares)}</dd></div>
              <div><dt className="text-slate-500">Giá vốn TB</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(position.avgCostPerShareVnd)}</dd></div>
            </dl>
          )}
          {!positionLoading && adminUnlocked && position && (
            sharedPool ? (
              <div className="space-y-2 rounded border border-sky-900/50 bg-sky-950/10 px-3 py-2" data-testid={`${sym}-shared-cash`} data-cash={position.sharedCashVnd == null ? "unknown" : "known"}>
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-sky-300">Quỹ tiền mặt chung (MBB + BID)</span> — một quỹ duy nhất cho mọi mã, không phải tiền riêng của {symbol}:{" "}
                  <span className="font-mono tabular-nums">{position.sharedCashVnd == null ? "chưa nhập (cash-unknown)" : formatVnd(position.sharedCashVnd)}</span>
                  {position.cashSource ? <span className="ml-1 text-[11px] text-slate-500">· nguồn {position.cashSource}</span> : null}
                </p>
                {position.totalDeclaredBudgetsVnd != null && (
                  <p className="text-[11px] text-slate-400">Tổng ngân sách đã khai báo (mọi mã): <span className="font-mono">{formatVnd(position.totalDeclaredBudgetsVnd)}</span></p>
                )}
                {position.cashNotes.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-slate-500" data-testid={`${sym}-cash-notes`}>
                    {position.cashNotes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                )}
                <p className="text-[11px] text-slate-400">
                  Ngân sách mua thêm {symbol}: <span className="font-mono">{position.buyBudgetVnd == null ? "chưa khai báo (buy-budget-undeclared)" : formatVnd(position.buyBudgetVnd)}</span>
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="max-w-xs flex-1">
                    <label htmlFor={`${sym}-shared-cash-input`} className="block text-[11px] text-slate-500">Quỹ tiền mặt chung (₫)</label>
                    <input
                      id={`${sym}-shared-cash-input`}
                      type="text"
                      inputMode="decimal"
                      value={sharedCashDraft}
                      onChange={(e) => setSharedCashDraft(e.target.value)}
                      className={inputClass}
                      placeholder="chưa nhập"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={cashSaving || !contractCompatible}
                    onClick={() => void saveSharedCash()}
                    className="h-10 shrink-0 rounded border border-sky-800 px-4 text-xs font-semibold text-sky-200 transition-colors hover:bg-sky-950/50 disabled:opacity-40"
                  >
                    {cashSaving ? "Đang lưu…" : "Lưu quỹ chung"}
                  </button>
                </div>
                {cashSaveError && <p className="text-xs text-rose-300" role="alert">{cashSaveError}</p>}
                {!cashSaveError && cashSaveOk && <p className="text-xs text-slate-400">{cashSaveOk}</p>}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500" data-testid={`${sym}-shared-cash-unsupported`}>
                Backend hiện tại chưa báo quỹ tiền mặt chung — tiền mặt đang theo từng mã (cũ) và không đề xuất số lượng mua theo ngân sách.
              </p>
            )
          )}
          {!positionLoading && adminUnlocked && position && position.lots.length === 0 && (
            <p className="text-xs text-slate-500">Chưa có lô {symbol} nào — thêm lô bên dưới nếu đang nắm giữ.</p>
          )}

          {adminUnlocked && (
          <>
          <div className="space-y-2">
            {lotDrafts.map((lot, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div>
                  <label htmlFor={`${sym}-lot-qty-${index}`} className="block text-[11px] text-slate-500">Số lượng (cp)</label>
                  <input
                    id={`${sym}-lot-qty-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={lot.quantity}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: e.target.value } : l)))}
                    className={inputClass}
                    placeholder="vd: 200"
                  />
                </div>
                <div>
                  <label htmlFor={`${sym}-lot-cost-${index}`} className="block text-[11px] text-slate-500">Giá vốn/cổ (₫)</label>
                  <input
                    id={`${sym}-lot-cost-${index}`}
                    type="text"
                    inputMode="decimal"
                    value={lot.costPerShareVnd}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, costPerShareVnd: e.target.value } : l)))}
                    className={inputClass}
                    placeholder="vd: 24500"
                  />
                </div>
                <div>
                  <label htmlFor={`${sym}-lot-date-${index}`} className="block text-[11px] text-slate-500">Ngày mua</label>
                  <input
                    id={`${sym}-lot-date-${index}`}
                    type="date"
                    value={lot.acquireDate}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, acquireDate: e.target.value } : l)))}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLotDrafts((prev) => prev.filter((_, i) => i !== index))}
                  className="flex h-10 w-10 items-center justify-center rounded border border-slate-800 text-slate-500 transition-colors hover:border-rose-800 hover:text-rose-300"
                  aria-label={`Xoá lô ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLotDrafts((prev) => [...prev, { quantity: "", costPerShareVnd: "", acquireDate: "" }])}
              className="min-h-9 rounded border border-dashed border-slate-700 px-3 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              + Thêm lô
            </button>
          </div>

          {sharedPool ? (
            <div className="max-w-xs">
              <label htmlFor={`${sym}-buy-budget`} className="block text-[11px] text-slate-500">Ngân sách mua thêm {symbol} (₫) — để trống = chưa khai báo</label>
              <input
                id={`${sym}-buy-budget`}
                type="text"
                inputMode="decimal"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                className={inputClass}
                placeholder="chưa khai báo"
              />
              <p className="mt-1 text-[11px] text-slate-500">Tổng ngân sách của các mã không được vượt quỹ tiền mặt chung; chưa khai báo thì không đề xuất số lượng mua.</p>
            </div>
          ) : (
            <div className="max-w-xs">
              <label htmlFor={`${sym}-cash`} className="block text-[11px] text-slate-500">Tiền mặt khả dụng (₫) · backend cũ: theo mã</label>
              <input
                id={`${sym}-cash`}
                type="text"
                inputMode="decimal"
                value={cashDraft}
                onChange={(e) => setCashDraft(e.target.value)}
                className={inputClass}
                placeholder="vd: 5000000"
              />
            </div>
          )}
          </>
          )}

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-xs">
              {saveError && <p className="whitespace-pre-wrap break-words text-rose-300">{saveError}</p>}
              {!saveError && saveOk && (
                <p className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" /> {saveOk}
                </p>
              )}
              {!saveError && !saveOk && (!adminUnlocked || !contractCompatible) && (
                <p className="text-slate-500">Ghi vị thế đang khóa; cần khóa quản trị và API contract tương thích.</p>
              )}
            </div>
            <button
              type="button"
              disabled={saving || !adminUnlocked || !contractCompatible}
              onClick={() => void savePosition()}
              className="h-10 w-full shrink-0 rounded bg-teal-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
            >
              {saving ? "Đang lưu…" : "Lưu vị thế"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <EquityBaseRatesPanel symbol={symbol} state={baseRates} onReload={() => void loadBaseRates()} />
        <EquityContextPanel symbol={symbol} state={context} onReload={() => void loadContext()} />
      </div>

      <SourceDocumentsPanel symbol={symbol} state={sourceDocuments} onReload={() => void loadSourceDocuments()} />

      <ForecastJournalPanel symbol={symbol} state={journal} onReload={() => void loadJournal()} />

      <ResearchNotesPanel symbol={symbol} state={researchNotes} onReload={() => void loadResearchNotes()} />

      <details
        className="rounded border border-slate-800 bg-slate-900/40"
        open={llmOpen}
        onToggle={(event) => setLlmOpen(event.currentTarget.open)}
        data-testid={`${sym}-llm-history`}
      >
        <summary className="cursor-pointer select-none px-3 py-2.5 text-[13px] font-medium text-slate-300 hover:text-slate-100">
          Lịch sử phân tích LLM cũ ({symbol})
          <span className="ml-2 text-[11px] font-normal text-slate-500">chỉ đọc · lớp LLM trong app đã ngừng · không ảnh hưởng quyết định</span>
        </summary>
        {llmOpen && (
          <div className="border-t border-slate-800 p-2">
            <LlmRunsPanel symbol={symbol} state={llmRuns} onReload={() => void loadLlmRuns()} quantFor={quantFor} />
          </div>
        )}
      </details>

      <EquityObservationsPanel symbol={symbol} timeframe={timeframe} state={observations} onReload={() => void loadObservations(timeframe)} />

      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby={`${sym}-quality-title`} data-testid={`${sym}-quality`}>
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id={`${sym}-quality-title`} className="text-[13px] font-semibold text-slate-200">Chất lượng dữ liệu</h3>
          {qualityReport && (
            <span className="font-mono text-[11px] text-slate-500">
              {qualityReport.provider} + {qualityReport.crossCheckProvider} · {qualityReport.venue} · {qualityReport.priceBasis}
            </span>
          )}
        </div>
        <div className="p-3">
          {quality.kind === "loading" && <p className="text-sm text-slate-500">Đang tải báo cáo…</p>}
          {quality.kind === "error" && (
            <div className="flex items-center gap-3 rounded border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-400" role="alert">
              <span className="min-w-0 flex-1 break-words">Không tải được báo cáo chất lượng dữ liệu: {quality.message}</span>
              <button type="button" onClick={() => void loadQuality()} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-slate-900">Thử lại</button>
            </div>
          )}
          {qualityReport && qualityReport.timeframes.length === 0 && (
            <p className="text-xs text-slate-500">Chưa có nến nào của {symbol} trong kho dữ liệu.</p>
          )}
          {qualityReport && qualityReport.timeframes.length > 0 && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pr-3 font-medium">Khung</th>
                      <th className="py-1.5 pr-3 font-medium">Coverage</th>
                      <th className="py-1.5 pr-3 font-medium">Nến</th>
                      <th className="py-1.5 pr-3 font-medium">Thiếu</th>
                      <th className="py-1.5 pr-3 font-medium">Gap</th>
                      <th className="py-1.5 pr-3 font-medium">Ngoài phiên</th>
                      <th className="py-1.5 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityReport.timeframes.map((tf) => (
                      <tr key={tf.timeframe} className="border-b border-slate-800/60 text-slate-300">
                        <td className="py-1.5 pr-3 font-mono">{tf.timeframe}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{formatMbbPct(tf.coveragePct, 1)}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.totalBars.toLocaleString("vi-VN")}/{tf.expectedBars.toLocaleString("vi-VN")}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.missingBars.toLocaleString("vi-VN")}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.gapRangeCount}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.unexpectedSessionBars}</td>
                        <td className="py-1.5">
                          {tf.isStale
                            ? <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">stale</span>
                            : <span className="rounded bg-emerald-950/40 px-1.5 py-0.5 text-[10px] text-emerald-300">fresh</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {qualityReport.limitations.length > 0 && (
                <ul className="space-y-1">
                  {qualityReport.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" /> {limitation}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
