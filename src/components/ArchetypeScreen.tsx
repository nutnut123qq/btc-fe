"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getArchetypes,
  getArchetypeDetail,
  getArchetypeOccurrences,
  matchMultiWindow,
  getArchetypeRankings,
  getTransitionMatrix,
  getTransitionsFrom,
  predictNextArchetype,
  predictSequence,
} from "@/lib/api";
import type {
  ArchetypeDto,
  ArchetypeDetailDto,
  ArchetypeMatchDto,
  ArchetypeRankingDto,
  ArchetypeOccurrenceDto,
  TransitionMatrixDto,
  ArchetypeTransitionDto,
  TransitionPredictionDto,
  SequencePredictionDto,
} from "@/lib/types";
import { ArchetypeGalleryView } from "./archetypes/ArchetypeGalleryView";
import { ArchetypeMatchView } from "./archetypes/ArchetypeMatchView";
import { ArchetypeTransitionsView } from "./archetypes/ArchetypeTransitionsView";
import { ArchetypeRankingsView } from "./archetypes/ArchetypeRankingsView";
import { ArchetypePredictContainer } from "./archetypes/ArchetypePredictContainer";
import { ArchetypeDetailModal } from "./archetypes/ArchetypeDetailModal";
import { ErrorBoundary } from "./ErrorBoundary";

const SYMBOL_OPTIONS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const TIMEFRAME_OPTIONS = ["15m", "30m", "1h", "4h", "1d"];
const WINDOW_SIZES = [10, 15, 20, 25];

export function ArchetypeScreen() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [activeSubTab, setActiveSubTab] = useState<
    "gallery" | "match" | "rankings" | "transitions" | "predict"
  >("gallery");

  // Gallery State
  const [galleryTf, setGalleryTf] = useState("1h");
  const [galleryWs, setGalleryWs] = useState(15);
  const [gallerySort, setGallerySort] = useState("winRate");
  const [archetypes, setArchetypes] = useState<ArchetypeDto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // Match State
  const [matchTf, setMatchTf] = useState("1h");
  const [matchData, setMatchData] = useState<ArchetypeMatchDto[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  // Rankings State
  const [rankingsTf, setRankingsTf] = useState("1h");
  const [rankingsWs, setRankingsWs] = useState(15);
  const [rankingsHorizon, setRankingsHorizon] = useState("4h");
  const rankingsSort = "winRate";
  const [rankings, setRankings] = useState<ArchetypeRankingDto[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Detail Modal State
  const [detail, setDetail] = useState<ArchetypeDetailDto | null>(null);
  const [occurrences, setOccurrences] = useState<ArchetypeOccurrenceDto[]>([]);

  // Transitions State
  const [transTf, setTransTf] = useState("1h");
  const [transWs, setTransWs] = useState(15);
  const [matrix, setMatrix] = useState<TransitionMatrixDto | null>(null);
  const [transLoading, setTransLoading] = useState(false);
  const [selectedArcForTrans, setSelectedArcForTrans] = useState<number | null>(null);
  const [arcTransitions, setArcTransitions] = useState<ArchetypeTransitionDto[]>([]);
  const [arcTransLoading, setArcTransLoading] = useState(false);

  // Predict State
  const [predictTf, setPredictTf] = useState("1h");
  const [predictWs, setPredictWs] = useState(15);
  const [predictLoading, setPredictLoading] = useState(false);
  const [nextPred, setNextPred] = useState<TransitionPredictionDto | null>(null);
  const [seqPred, setSeqPred] = useState<SequencePredictionDto | null>(null);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    try {
      const res = await getArchetypes({
        symbol: selectedSymbol,
        timeframe: galleryTf,
        windowSize: galleryWs,
        sortBy: gallerySort,
        pageSize: 50,
      });
      setArchetypes(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setGalleryLoading(false);
    }
  }, [selectedSymbol, galleryTf, galleryWs, gallerySort]);

  const loadMatch = useCallback(async () => {
    setMatchLoading(true);
    try {
      const res = await matchMultiWindow(selectedSymbol, matchTf);
      setMatchData(res.matches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMatchLoading(false);
    }
  }, [selectedSymbol, matchTf]);

  const loadRankings = useCallback(async () => {
    setRankingsLoading(true);
    try {
      const res = await getArchetypeRankings({
        symbol: selectedSymbol,
        timeframe: rankingsTf,
        windowSize: rankingsWs,
        horizon: rankingsHorizon,
        sortBy: rankingsSort,
      });
      setRankings(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRankingsLoading(false);
    }
  }, [selectedSymbol, rankingsTf, rankingsWs, rankingsHorizon, rankingsSort]);

  const loadDetail = async (id: number) => {
    try {
      const [resDetail, resOcc] = await Promise.all([
        getArchetypeDetail(id),
        getArchetypeOccurrences(id, { horizon: "4h", pageSize: 20 }),
      ]);
      setDetail(resDetail);
      setOccurrences(resOcc.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMatrix = useCallback(async () => {
    setTransLoading(true);
    try {
      const res = await getTransitionMatrix({ symbol: selectedSymbol, timeframe: transTf, windowSize: transWs });
      setMatrix(res);
      setSelectedArcForTrans(null);
      setArcTransitions([]);
    } catch (e) {
      console.error(e);
    } finally {
      setTransLoading(false);
    }
  }, [selectedSymbol, transTf, transWs]);

  const loadTransitionsForArc = async (id: number) => {
    setSelectedArcForTrans(id);
    setArcTransLoading(true);
    try {
      const res = await getTransitionsFrom(id, 10);
      setArcTransitions(res.transitions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setArcTransLoading(false);
    }
  };

  const loadPredictions = useCallback(async () => {
    setPredictLoading(true);
    try {
      const [nextRes, seqRes] = await Promise.all([
        predictNextArchetype({ symbol: selectedSymbol, timeframe: predictTf, windowSize: predictWs }),
        predictSequence({ symbol: selectedSymbol, timeframe: predictTf, windowSize: predictWs }),
      ]);
      setNextPred(nextRes);
      setSeqPred(seqRes);
    } catch (e) {
      console.error(e);
    } finally {
      setPredictLoading(false);
    }
  }, [selectedSymbol, predictTf, predictWs]);

  useEffect(() => {
    if (activeSubTab === "gallery") void loadGallery();
  }, [activeSubTab, loadGallery]);

  useEffect(() => {
    if (activeSubTab === "match") void loadMatch();
  }, [activeSubTab, loadMatch]);

  useEffect(() => {
    if (activeSubTab === "rankings") void loadRankings();
  }, [activeSubTab, loadRankings]);

  useEffect(() => {
    if (activeSubTab === "transitions") void loadMatrix();
  }, [activeSubTab, loadMatrix]);

  useEffect(() => {
    if (activeSubTab === "predict") void loadPredictions();
  }, [activeSubTab, loadPredictions]);

  return (
    <div className="space-y-4">
      {/* Symbol & Sub-tab bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <span className="text-xs font-semibold text-gray-400 px-2">Cặp coin:</span>
          {SYMBOL_OPTIONS.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedSymbol === sym
                  ? "bg-teal-500 text-gray-950 shadow"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {sym.replace("USDT", "/USDT")}
            </button>
          ))}
        </div>

        <div className="flex space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800 flex-1 sm:flex-initial">
          {[
            { key: "gallery", label: "Thư viện" },
            { key: "match", label: "Match Hiện tại" },
            { key: "rankings", label: "Bảng xếp hạng" },
            { key: "transitions", label: "Chuyển đổi" },
            { key: "predict", label: "Dự báo" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as typeof activeSubTab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeSubTab === tab.key
                  ? "bg-gray-800 text-teal-400 font-bold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
            onSelectArchetype={loadDetail}
          />
        )}

        {activeSubTab === "match" && (
          <ArchetypeMatchView
            timeframe={matchTf}
            timeframeOptions={TIMEFRAME_OPTIONS}
            matchData={matchData}
            loading={matchLoading}
            onTimeframeChange={setMatchTf}
            onMatch={loadMatch}
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
            onSelectArc={loadTransitionsForArc}
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
          setDetail(null);
        }}
      />
    </div>
  );
}
