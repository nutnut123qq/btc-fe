"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getArchetypes,
  getArchetypeDetail,
  getArchetypeOccurrences,
  getArchetypeRankings,
  getTransitionMatrix,
  getTransitionsFrom,
  predictNextArchetype,
  predictSequence,
} from "@/lib/api";
import type {
  ArchetypeDto,
  ArchetypeDetailDto,
  ArchetypeRankingDto,
  ArchetypeOccurrenceDto,
  TransitionMatrixDto,
  ArchetypeTransitionDto,
  TransitionPredictionDto,
  SequencePredictionDto,
} from "@/lib/types";
import { ArchetypeGalleryView } from "./archetypes/ArchetypeGalleryView";
import { HistoricalAnalogView } from "./archetypes/HistoricalAnalogView";
import { ArchetypeTransitionsView } from "./archetypes/ArchetypeTransitionsView";
import { ArchetypeRankingsView } from "./archetypes/ArchetypeRankingsView";
import { ArchetypePredictContainer } from "./archetypes/ArchetypePredictContainer";
import { ArchetypeDetailModal } from "./archetypes/ArchetypeDetailModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME } from "@/lib/timeframe";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";

const TIMEFRAME_OPTIONS = [...ACTIVE_TIMEFRAMES];
const WINDOW_SIZES = [10, 15, 20, 25];
type ArchetypeSubTab = "gallery" | "analog" | "rankings" | "transitions" | "predict";

export function ArchetypeScreen() {
  const [selectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [activeSubTab, setActiveSubTab] = useState<ArchetypeSubTab>("analog");
  const [tabErrors, setTabErrors] = useState<Partial<Record<ArchetypeSubTab, string>>>({});

  // Gallery State
  const [galleryTf, setGalleryTf] = useState<string>(DEFAULT_TIMEFRAME);
  const [galleryWs, setGalleryWs] = useState(15);
  const [gallerySort, setGallerySort] = useState("memberCount");
  const [archetypes, setArchetypes] = useState<ArchetypeDto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Rankings State
  const [rankingsTf, setRankingsTf] = useState<string>(DEFAULT_TIMEFRAME);
  const [rankingsWs, setRankingsWs] = useState(15);
  const [rankingsHorizon, setRankingsHorizon] = useState("4h");
  const rankingsSort = "winRate";
  const [rankings, setRankings] = useState<ArchetypeRankingDto[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Detail Modal State
  const [detail, setDetail] = useState<ArchetypeDetailDto | null>(null);
  const [occurrences, setOccurrences] = useState<ArchetypeOccurrenceDto[]>([]);

  // Transitions State
  const [transTf, setTransTf] = useState<string>(DEFAULT_TIMEFRAME);
  const [transWs, setTransWs] = useState(15);
  const [matrix, setMatrix] = useState<TransitionMatrixDto | null>(null);
  const [transLoading, setTransLoading] = useState(false);
  const [selectedArcForTrans, setSelectedArcForTrans] = useState<number | null>(null);
  const [arcTransitions, setArcTransitions] = useState<ArchetypeTransitionDto[]>([]);
  const [arcTransLoading, setArcTransLoading] = useState(false);

  // Predict State
  const [predictTf, setPredictTf] = useState<string>(DEFAULT_TIMEFRAME);
  const [predictWs, setPredictWs] = useState(15);
  const [predictLoading, setPredictLoading] = useState(false);
  const [nextPred, setNextPred] = useState<TransitionPredictionDto | null>(null);
  const [seqPred, setSeqPred] = useState<SequencePredictionDto | null>(null);

  // Deep-link params: ?arc=<id> = gallery detail modal, ?from=<id> =
  // transitions source archetype. The URL is the single source of truth
  // (mirrors BacktestScreen ?run=).
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const arcParam = searchParams.get("arc");
  const fromParam = searchParams.get("from");
  const detailRequestRef = useRef(0);
  const transRequestRef = useRef(0);
  // Ids of the entity fetches that last completed — lets the param effect skip
  // re-fetching when it re-runs on unrelated URL/state changes.
  const detailFetchedRef = useRef<number | null>(null);
  const transFetchedRef = useRef<number | null>(null);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    setTabErrors((prev) => ({ ...prev, gallery: undefined }));
    try {
      const res = await getArchetypes({
        symbol: selectedSymbol,
        timeframe: galleryTf,
        windowSize: galleryWs,
        sortBy: gallerySort,
        pageSize: 50,
      });
      setArchetypes(res.items);
    } catch (e) {
      console.error(e);
      setTabErrors((prev) => ({ ...prev, gallery: "Không thể tải thư viện mẫu nến." }));
    } finally {
      setGalleryLoading(false);
    }
  }, [gallerySort, galleryTf, galleryWs, selectedSymbol]);

  const loadRankings = useCallback(async () => {
    setRankingsLoading(true);
    setTabErrors((prev) => ({ ...prev, rankings: undefined }));
    try {
      const res = await getArchetypeRankings({
        symbol: selectedSymbol,
        timeframe: rankingsTf,
        windowSize: rankingsWs,
        horizon: rankingsHorizon,
        sortBy: rankingsSort,
      });
      setRankings(res.items);
    } catch (e) {
      console.error(e);
      setTabErrors((prev) => ({ ...prev, rankings: "Không thể tải bảng xếp hạng mẫu nến." }));
    } finally {
      setRankingsLoading(false);
    }
  }, [rankingsHorizon, rankingsSort, rankingsTf, rankingsWs, selectedSymbol]);

  const loadDetail = useCallback(async (id: number) => {
    const requestId = ++detailRequestRef.current;
    try {
      const [resDetail, resOcc] = await Promise.all([
        getArchetypeDetail(id),
        getArchetypeOccurrences(id, { pageSize: 20 }),
      ]);
      if (requestId !== detailRequestRef.current) return;
      detailFetchedRef.current = id;
      setDetail(resDetail);
      setOccurrences(resOcc.items);
    } catch (e) {
      if (requestId !== detailRequestRef.current) return;
      // The URL names this archetype — drop the stale detail so a
      // predecessor's modal is never shown next to the error (LINK-1 F3).
      detailFetchedRef.current = null;
      setDetail(null);
      setOccurrences([]);
      console.error(e);
      setTabErrors((prev) => ({ ...prev, gallery: "Không thể tải chi tiết mẫu nến." }));
    }
  }, []);

  const loadMatrix = useCallback(async () => {
    setTransLoading(true);
    setTabErrors((prev) => ({ ...prev, transitions: undefined }));
    try {
      const res = await getTransitionMatrix({ symbol: selectedSymbol, timeframe: transTf, windowSize: transWs });
      setMatrix(res);
      // The from-archetype selection is owned by the ?from= URL param — a
      // matrix reload must not wipe it (the transitions list is
      // archetype-scoped and stays valid across timeframe/window changes).
    } catch (e) {
      console.error(e);
      setTabErrors((prev) => ({ ...prev, transitions: "Không thể tải ma trận chuyển đổi. Dữ liệu bên dưới là lần tải thành công gần nhất." }));
    } finally {
      setTransLoading(false);
    }
  }, [selectedSymbol, transTf, transWs]);

  const loadTransitionsForArc = useCallback(async (id: number) => {
    const requestId = ++transRequestRef.current;
    setArcTransLoading(true);
    setTabErrors((prev) => ({ ...prev, transitions: undefined }));
    try {
      const res = await getTransitionsFrom(id, 10);
      if (requestId !== transRequestRef.current) return;
      transFetchedRef.current = id;
      setSelectedArcForTrans(id);
      setArcTransitions(res.transitions);
    } catch (e) {
      if (requestId !== transRequestRef.current) return;
      transFetchedRef.current = null;
      setSelectedArcForTrans(null);
      setArcTransitions([]);
      console.error(e);
      setTabErrors((prev) => ({ ...prev, transitions: "Không thể tải chi tiết chuyển đổi. Dữ liệu bên dưới là lần tải thành công gần nhất." }));
    } finally {
      // Unconditional: a request invalidated by a param clear still has to
      // release the loading flag — guarding it would strand the spinner.
      setArcTransLoading(false);
    }
  }, []);

  const loadPredictions = useCallback(async () => {
    setPredictLoading(true);
    setTabErrors((prev) => ({ ...prev, predict: undefined }));
    try {
      const [nextRes, seqRes] = await Promise.all([
        predictNextArchetype({ symbol: selectedSymbol, timeframe: predictTf, windowSize: predictWs }),
        predictSequence({ symbol: selectedSymbol, timeframe: predictTf, windowSize: predictWs }),
      ]);
      setNextPred(nextRes);
      setSeqPred(seqRes);
    } catch (e) {
      console.error(e);
      setTabErrors((prev) => ({ ...prev, predict: "Không thể tải dự báo thử nghiệm. Dữ liệu bên dưới là lần tải thành công gần nhất." }));
    } finally {
      setPredictLoading(false);
    }
  }, [predictTf, predictWs, selectedSymbol]);

  useEffect(() => {
    if (activeSubTab === "gallery") void loadGallery();
  }, [activeSubTab, loadGallery]);

  useEffect(() => {
    if (activeSubTab === "rankings") void loadRankings();
  }, [activeSubTab, loadRankings]);

  useEffect(() => {
    if (activeSubTab === "transitions") void loadMatrix();
  }, [activeSubTab, loadMatrix]);

  useEffect(() => {
    if (activeSubTab === "predict") void loadPredictions();
  }, [activeSubTab, loadPredictions]);

  // Push on user selection so browser Back restores the unselected view;
  // replace when clearing/normalizing so a stale param cannot be resurrected.
  const updateArchetypeParams = useCallback((mode: "push" | "replace", next: { arc?: number | null; from?: number | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.arc === null) params.delete("arc");
    else if (next.arc != null) params.set("arc", String(next.arc));
    if (next.from === null) params.delete("from");
    else if (next.from != null) params.set("from", String(next.from));
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (mode === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }, [router, pathname, searchParams]);

  // ?arc=<id> deep-links the gallery detail modal; ?from=<id> selects the
  // transitions source. Both fetch by id — no catalog resolution needed.
  // A non-canonical id is dropped from the URL instead of faking a selection;
  // a missing param clears selection so Back/Forward is honest.
  useEffect(() => {
    // Mutually exclusive entity links — the detail modal wins when a
    // hand-crafted URL carries both; the stray param is dropped.
    if (arcParam != null && fromParam != null) {
      updateArchetypeParams("replace", { from: null });
      return;
    }
    if (arcParam != null) {
      const id = Number(arcParam);
      if (!Number.isInteger(id) || id <= 0 || String(id) !== arcParam) {
        updateArchetypeParams("replace", { arc: null });
        return;
      }
      setActiveSubTab("gallery");
      if (detailFetchedRef.current !== id) void loadDetail(id);
      return;
    }
    if (fromParam != null) {
      const id = Number(fromParam);
      if (!Number.isInteger(id) || id <= 0 || String(id) !== fromParam) {
        updateArchetypeParams("replace", { from: null });
        return;
      }
      setActiveSubTab("transitions");
      if (transFetchedRef.current !== id) void loadTransitionsForArc(id);
      return;
    }
    // No entity param: reset selection so Back/Forward restores the
    // unselected view, and invalidate in-flight fetches so they cannot write.
    detailRequestRef.current += 1;
    transRequestRef.current += 1;
    detailFetchedRef.current = null;
    transFetchedRef.current = null;
    setDetail((prev) => (prev == null ? prev : null));
    setOccurrences((prev) => (prev.length === 0 ? prev : []));
    setSelectedArcForTrans((prev) => (prev == null ? prev : null));
    setArcTransitions((prev) => (prev.length === 0 ? prev : []));
  }, [arcParam, fromParam, loadDetail, loadTransitionsForArc, updateArchetypeParams]);

  // Clicking the entity already named by the URL retries the fetch directly —
  // an unchanged param cannot re-fire the effect, so a failed fetch would
  // otherwise be un-retryable (LINK-1 regression lesson).
  const handleSelectArchetype = (id: number) => {
    if (arcParam === String(id)) void loadDetail(id);
    else updateArchetypeParams("push", { arc: id, from: null });
  };

  const handleSelectFromArc = (id: number) => {
    if (fromParam === String(id)) void loadTransitionsForArc(id);
    else updateArchetypeParams("push", { arc: null, from: id });
  };

  const retryActiveTab = () => {
    if (activeSubTab === "gallery") {
      void loadGallery();
      if (arcParam != null) {
        const arcId = Number(arcParam);
        if (Number.isInteger(arcId) && arcId > 0 && String(arcId) === arcParam) void loadDetail(arcId);
      }
    } else if (activeSubTab === "rankings") void loadRankings();
    else if (activeSubTab === "transitions") {
      void loadMatrix();
      if (fromParam != null) {
        const fromId = Number(fromParam);
        if (Number.isInteger(fromId) && fromId > 0 && String(fromId) === fromParam) void loadTransitionsForArc(fromId);
      }
    } else void loadPredictions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-100">Mẫu nến</h2>
          <p className="hidden sm:block truncate text-xs text-slate-400">Archetype, analog lịch sử và chuyển đổi trên cửa sổ nến {selectedSymbol.replace("USDT", "/USDT")}.</p>
        </div>
        <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-teal-300">{selectedSymbol.replace("USDT", "/USDT")}</span>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-slate-800 text-xs" role="tablist" aria-label="Chế độ mẫu nến">
        {[
          { key: "analog", label: "Analog lịch sử" },
          { key: "gallery", label: "Thư viện (audit)" },
          { key: "rankings", label: "Bảng xếp hạng" },
          { key: "transitions", label: "Chuyển đổi" },
          { key: "predict", label: "Dự báo" },
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeSubTab === tab.key}
            onClick={() => {
              setActiveSubTab(tab.key as typeof activeSubTab);
              // Each param belongs to its surface: leaving gallery drops
              // ?arc, leaving transitions drops ?from.
              if ((tab.key !== "gallery" && arcParam != null) || (tab.key !== "transitions" && fromParam != null)) {
                updateArchetypeParams("replace", {
                  arc: tab.key === "gallery" ? undefined : null,
                  from: tab.key === "transitions" ? undefined : null,
                });
              }
            }}
            className={`-mb-px shrink-0 border-b-2 px-1 py-2 font-medium transition-colors ${
              activeSubTab === tab.key
                ? "border-teal-400 text-teal-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabErrors[activeSubTab] && (
        <div className="flex items-center justify-between gap-3 rounded-sm border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          <span>{tabErrors[activeSubTab]}</span>
          <button
            type="button"
            onClick={retryActiveTab}
            className="h-10 shrink-0 rounded-sm px-3 text-xs font-bold hover:bg-rose-500/10"
          >
            Thử lại
          </button>
        </div>
      )}

      <ErrorBoundary fallbackTitle="Lỗi tải thành phần Mẫu nến">
        {activeSubTab === "gallery" && (
          <ArchetypeGalleryView
            timeframe={galleryTf}
            windowSize={galleryWs}
            sortBy={gallerySort}
            windowSizes={WINDOW_SIZES}
            archetypes={archetypes}
            loading={galleryLoading}
            onTimeframeChange={setGalleryTf}
            onWindowSizeChange={setGalleryWs}
            onSortByChange={setGallerySort}
            onSelectArchetype={handleSelectArchetype}
          />
        )}

        {activeSubTab === "analog" && (
          <HistoricalAnalogView
            symbol={selectedSymbol}
            timeframeOptions={TIMEFRAME_OPTIONS}
            windowSizes={WINDOW_SIZES}
          />
        )}

        {activeSubTab === "rankings" && (
          <ArchetypeRankingsView
            timeframe={rankingsTf}
            windowSize={rankingsWs}
            horizon={rankingsHorizon}
            timeframeOptions={TIMEFRAME_OPTIONS}
            windowSizes={WINDOW_SIZES}
            rankings={rankings}
            loading={rankingsLoading}
            onTimeframeChange={setRankingsTf}
            onWindowSizeChange={setRankingsWs}
            onHorizonChange={setRankingsHorizon}
          />
        )}

        {activeSubTab === "transitions" && (
          <ArchetypeTransitionsView
            timeframe={transTf}
            windowSize={transWs}
            timeframeOptions={TIMEFRAME_OPTIONS}
            windowSizes={WINDOW_SIZES}
            matrix={matrix}
            loading={transLoading}
            selectedArcForTrans={selectedArcForTrans}
            arcTransitions={arcTransitions}
            arcTransLoading={arcTransLoading}
            onTimeframeChange={setTransTf}
            onWindowSizeChange={setTransWs}
            onSelectArc={handleSelectFromArc}
          />
        )}

        {activeSubTab === "predict" && (
          <ArchetypePredictContainer
            timeframe={predictTf}
            windowSize={predictWs}
            timeframeOptions={TIMEFRAME_OPTIONS}
            windowSizes={WINDOW_SIZES}
            nextPred={nextPred}
            seqPred={seqPred}
            loading={predictLoading}
            onTimeframeChange={setPredictTf}
            onWindowSizeChange={setPredictWs}
            onPredict={loadPredictions}
          />
        )}
      </ErrorBoundary>

      <ArchetypeDetailModal
        detail={detail}
        occurrences={occurrences}
        onClose={() => {
          // The ?arc= param owns the modal — clearing it lets the effect
          // close the modal (and keeps Back able to re-open it).
          updateArchetypeParams("replace", { arc: null });
        }}
      />
    </div>
  );
}
