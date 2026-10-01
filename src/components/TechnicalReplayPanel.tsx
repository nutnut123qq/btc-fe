"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Clock3, RotateCcw, X } from "lucide-react";
import type { ActiveTimeframe } from "@/lib/timeframe";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  type TechnicalReplayEnvelope,
  type TechnicalReplayEvent,
  type TechnicalLayerEnvelope,
} from "@/lib/technicalReplay";

type Props = {
  symbol: string;
  timeframe: ActiveTimeframe;
  asOfTimeMs: number | null;
  replay: TechnicalReplayEnvelope | null;
  loading: boolean;
  error: string | null;
  selectedEvent: TechnicalReplayEvent | null;
  unavailableOverlays: string[];
  onSetAsOf: (timeMs: number) => void;
  onStep: (direction: -1 | 1) => void;
  onReturnLive: () => void;
  onSelectEvent: (event: TechnicalReplayEvent | null) => void;
};

function formatTime(timeMs: number | null): string {
  return timeMs == null ? "—" : new Date(timeMs).toLocaleString("vi-VN");
}

function stateStyle(state: TechnicalReplayEvent["stateAtAsOf"]): string {
  if (state === "active" || state === "confirmed") return "border-teal-700/60 bg-teal-950/30 text-teal-300";
  if (state === "mitigated") return "border-amber-700/60 bg-amber-950/30 text-amber-300";
  return "border-rose-700/60 bg-rose-950/30 text-rose-300";
}

function availabilityStyle(value: TechnicalLayerEnvelope<unknown>["availability"]): string {
  if (value === "available") return "border-emerald-800 bg-emerald-950/30 text-emerald-300";
  if (value === "partial") return "border-amber-800 bg-amber-950/30 text-amber-300";
  return "border-rose-900 bg-rose-950/30 text-rose-300";
}

function LayerCard({ label, layer, summary, nonProbability = false }: {
  label: string;
  layer: TechnicalLayerEnvelope<unknown>;
  summary: ReactNode;
  nonProbability?: boolean;
}) {
  return <article className="min-w-0 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
    <div className="flex items-start justify-between gap-2"><div><h3 className="text-xs font-bold text-slate-200">{label}</h3><p className="mt-1 font-mono text-[9px] text-slate-600">{layer.layerKey}</p></div><span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${availabilityStyle(layer.availability)}`}>{layer.availability}</span></div>
    <div className="mt-2 text-[11px] leading-5 text-slate-300">{layer.payload ? summary : <span className="text-rose-300">{layer.unavailableReason ?? "Không có payload point-in-time."}</span>}</div>
    {nonProbability && <p className="mt-2 rounded border border-amber-800/70 bg-amber-950/20 px-2 py-1 text-[10px] text-amber-200">Chỉ số mô tả đồng thuận, không phải xác suất hay tín hiệu giao dịch.</p>}
    <details className="mt-2 text-[10px] text-slate-500">
      <summary className="cursor-pointer text-slate-400">Nguồn, phiên bản & giới hạn</summary>
      <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
        <dt>Nguồn</dt><dd className="break-all text-right text-slate-300">{layer.lineage.source}</dd>
        <dt>Producer</dt><dd className="break-all text-right text-slate-300">{layer.lineage.producer}</dd>
        <dt>Version</dt><dd className="break-all text-right text-slate-300">{layer.lineage.calculationVersion}</dd>
        <dt>Available</dt><dd className="text-right text-slate-300">{formatTime(layer.lineage.availableTimeMs)}</dd>
        <dt>Source window</dt><dd className="text-right text-slate-300">{formatTime(layer.lineage.sourceStartTimeMs)} → {formatTime(layer.lineage.sourceEndTimeMs)}</dd>
        <dt>Bars / warmup</dt><dd className="text-right text-slate-300">{layer.lineage.sourceCandleCount} / {layer.lineage.requiredWarmupBars}</dd>
        <dt>Causal / persisted</dt><dd className="text-right text-slate-300">{layer.lineage.isCausal ? "có" : "không"} / {layer.lineage.isPersisted ? "có" : "không"}</dd>
      </dl>
      {layer.limitations.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-200/80">{layer.limitations.map((item) => <li key={item}>{item}</li>)}</ul>}
    </details>
  </article>;
}

function ReplayDateInput({ initialTimeMs, onCommit }: { initialTimeMs: number | null; onCommit: (timeMs: number) => void }) {
  const [draft, setDraft] = useState(initialTimeMs == null ? "" : toDateTimeLocalValue(initialTimeMs));
  const commit = () => {
    const parsed = fromDateTimeLocalValue(draft);
    if (parsed != null) onCommit(parsed);
  };
  return (
    <input
      type="datetime-local"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === "Enter") commit(); }}
      className="mt-1 block min-w-0 max-w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-slate-200 outline-none focus:border-cyan-500"
      aria-label="Thời điểm xem lại phân tích kỹ thuật"
    />
  );
}

export function TechnicalReplayPanel({
  symbol,
  timeframe,
  asOfTimeMs,
  replay,
  loading,
  error,
  selectedEvent,
  unavailableOverlays,
  onSetAsOf,
  onStep,
  onReturnLive,
  onSelectEvent,
}: Props) {
  return (
    <section className="min-w-0 space-y-3 border-b border-gray-800 bg-slate-950/80 p-3" aria-label="Xem lại phân tích kỹ thuật">
      <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Clock3 className="h-4 w-4 text-cyan-400" aria-hidden="true" />
            Technical replay · {symbol} · {timeframe}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            Chart và toàn bộ layer kỹ thuật chỉ dùng nến đã đóng tại mốc đang xem. Marker nằm ở thời điểm sự kiện bắt đầu có thể biết.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <label className="min-w-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Thời điểm xem
            <ReplayDateInput key={asOfTimeMs ?? "live"} initialTimeMs={asOfTimeMs} onCommit={onSetAsOf} />
          </label>
          <div className="flex items-center gap-1" role="group" aria-label="Điều khiển từng nến">
            <button type="button" onClick={() => onStep(-1)} className="rounded border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-cyan-700 hover:text-cyan-300" title="Lùi một nến" aria-label="Lùi một nến">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onStep(1)} className="rounded border border-slate-700 bg-slate-900 p-2 text-slate-300 hover:border-cyan-700 hover:text-cyan-300" title="Tiến một nến" aria-label="Tiến một nến">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onReturnLive} disabled={asOfTimeMs == null} className="flex items-center gap-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300 hover:border-teal-700 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Nến chốt mới nhất
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className={`rounded border px-2 py-1 ${asOfTimeMs == null ? "border-emerald-800 bg-emerald-950/30 text-emerald-300" : "border-cyan-800 bg-cyan-950/30 text-cyan-300"}`}>
          {asOfTimeMs == null ? `Latest finalized: ${formatTime(replay?.effectiveAsOfTimeMs ?? null)}` : `Replay: ${formatTime(replay?.effectiveAsOfTimeMs ?? asOfTimeMs)}`}
        </span>
        {replay && <span className="rounded border border-slate-700 px-2 py-1 text-slate-400">Phiên bản: {replay.calculationVersion}</span>}
        {unavailableOverlays.map((item) => (
          <span key={item} className="rounded border border-amber-800/70 bg-amber-950/20 px-2 py-1 text-amber-300">{item}: không có snapshot tại as-of</span>
        ))}
      </div>

      {loading && !replay && <div role="status" className="rounded border border-cyan-900/70 bg-cyan-950/20 p-3 text-xs text-cyan-200">Đang tải snapshot {symbol} {timeframe} tại cutoff đã chọn…</div>}
      {error && <div role="alert" className="break-words rounded border border-rose-900/70 bg-rose-950/30 p-3 text-xs text-rose-200">Technical Replay không khả dụng: {error}</div>}
      {!loading && !error && !replay && <div className="rounded border border-amber-900/70 bg-amber-950/20 p-3 text-xs text-amber-200">Chưa có snapshot point-in-time cho {symbol} {timeframe}; UI không thay bằng widget legacy hoặc dữ liệu realtime.</div>}
      {replay && replay.candles.length === 0 && <div className="rounded border border-amber-900/70 bg-amber-950/20 p-3 text-xs text-amber-200">Snapshot hợp lệ nhưng không có nến đã đóng tại cutoff này. Các layer vẫn giữ trạng thái unavailable theo contract.</div>}

      {replay && (
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-400">
              {replay.events.length} sự kiện · {replay.sourceCandleCount} nến hiển thị · {replay.analysisCandleCount} nến ngữ cảnh liền mạch · cửa sổ từ {formatTime(replay.replayWindowStartTimeMs)} · nến cuối đóng {formatTime(replay.lastFinalizedCandleCloseTimeMs)}
            </p>
            <p className="truncate text-[10px] text-slate-500" title={replay.provenance.availabilityRule}>{replay.provenance.evaluationMode}</p>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Bảy lớp phân tích kỹ thuật point-in-time">
            <LayerCard label="Technical indicators" layer={replay.layers.indicators} summary={<>
              RSI14 <b>{replay.layers.indicators.payload?.rsi14?.toFixed(2) ?? "—"}</b> · EMA12/26 <b>{replay.layers.indicators.payload?.ema12?.toFixed(2) ?? "—"} / {replay.layers.indicators.payload?.ema26?.toFixed(2) ?? "—"}</b> · SMA50 <b>{replay.layers.indicators.payload?.sma50?.toFixed(2) ?? "—"}</b><br/>{replay.layers.indicators.payload?.events.length ?? 0} event tại nến quyết định.
            </>}/>
            <LayerCard label="Candle patterns" layer={replay.layers.candlePatterns} summary={<>
              <b>{replay.layers.candlePatterns.payload?.events.length ?? 0}</b> shape event trong cửa sổ replay. Marker dùng thời điểm pattern bắt đầu có thể biết.
            </>}/>
            <LayerCard label="Volume anomaly" layer={replay.layers.volumeAnomaly} summary={<>
              Ratio / SMA20 <b>{replay.layers.volumeAnomaly.payload?.volumeAnomalyRatio.toFixed(2) ?? "—"}×</b> · xu hướng <b>{replay.layers.volumeAnomaly.payload?.volumeTrend ?? "—"}</b><br/>{replay.layers.volumeAnomaly.payload?.triggeredEvents.join(", ") || "Không có threshold event."}
            </>}/>
            <LayerCard label="Market regime" layer={replay.layers.marketRegime} summary={<>
              <b>{replay.layers.marketRegime.payload?.regimeType ?? "—"}</b> · trend {replay.layers.marketRegime.payload?.trend ?? "—"} · volatility {replay.layers.marketRegime.payload?.volatility ?? "—"}<br/>Range ratio {replay.layers.marketRegime.payload?.rangeRatio.toFixed(3) ?? "—"}.
            </>}/>
            <LayerCard label="Fibonacci leg" layer={replay.layers.fibonacci} summary={<>
              Leg <b>{replay.layers.fibonacci.payload?.direction ?? "—"}</b> · {replay.layers.fibonacci.payload?.levels.length ?? 0} mức · anchor {formatTime(replay.layers.fibonacci.payload?.anchorStartTimeMs ?? null)} → {formatTime(replay.layers.fibonacci.payload?.anchorEndTimeMs ?? null)}.
            </>}/>
            <LayerCard label="Volume profile estimate" layer={replay.layers.volumeProfile} summary={<>
              POC <b>{replay.layers.volumeProfile.payload?.pocPrice.toFixed(2) ?? "—"}</b> · VAH/VAL {replay.layers.volumeProfile.payload?.vahPrice.toFixed(2) ?? "—"} / {replay.layers.volumeProfile.payload?.valPrice.toFixed(2) ?? "—"}<br/><span className="text-amber-200/80">OHLCV estimate, không phải phân bổ volume theo giá quan sát trực tiếp.</span>
            </>}/>
            <LayerCard label="Confluence" layer={replay.layers.confluence} nonProbability summary={<>
              Hướng <b>{replay.layers.confluence.payload?.overallDirection ?? "—"}</b> · score <b>{replay.layers.confluence.payload?.score.toFixed(3) ?? "—"}</b> · aligned modules {replay.layers.confluence.payload?.alignedDirectionalModules ?? 0}{replay.layers.confluence.payload?.hasConflict ? " · conflict" : ""}.<br/>{replay.layers.confluence.payload?.triggeredEvents.join(" → ") || "Không có confluence event."}
            </>}/>
          </div>
          <details className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-[10px] text-slate-400">
            <summary className="cursor-pointer font-semibold text-slate-300">Coverage & Data Administration</summary>
            <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead className="text-slate-500"><tr><th className="p-1">Layer</th><th className="p-1">Availability</th><th className="p-1 text-right">Source / warmup</th><th className="p-1">Latest</th><th className="p-1">Gap</th><th className="p-1">Checkpoint</th><th className="p-1">Storage</th></tr></thead><tbody>{replay.coverage.map((item) => <tr key={item.layerKey} className="border-t border-slate-800"><td className="p-1 font-mono text-slate-300">{item.layerKey}</td><td className="p-1">{item.availability}</td><td className="p-1 text-right">{item.sourceBars} / {item.requiredWarmupBars}</td><td className="p-1">{formatTime(item.latestAvailableTimeMs)}</td><td className="p-1">{item.hasGapBoundary ? "boundary" : "none"}</td><td className="p-1">{item.checkpointStatus}</td><td className="p-1">{item.isEventEnvelopeMaterializedAtAsOf ? "event envelope materialized" : item.storageStatus.replaceAll("_", " ")}</td></tr>)}</tbody></table></div>
            <div className="mt-2 rounded border border-slate-800 bg-slate-950/60 p-2">Context limit {replay.administration.contextLimitBars.toLocaleString("vi-VN")} bars · legacy SMC {replay.administration.legacySmartMoneyStatus} · gap boundary {replay.administration.hasGapBoundary ? "có" : "không"} · rebuild {replay.administration.rebuildRequired ? replay.administration.rebuildReason ?? "required" : "không yêu cầu"}</div>
            <div className="mt-2 break-all font-mono text-[9px] text-slate-600">Module contract {replay.moduleContractVersion} · sha256 {replay.moduleContractSha256}</div>
          </details>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Danh sách sự kiện SMC tại thời điểm xem">
            {replay.events.slice(-20).reverse().map((event) => (
              <button
                type="button"
                key={event.eventId}
                onClick={() => onSelectEvent(event)}
                className={`shrink-0 rounded border px-2 py-1.5 text-left text-[11px] ${selectedEvent?.eventId === event.eventId ? "border-cyan-500 bg-cyan-950/40 text-cyan-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"}`}
                aria-pressed={selectedEvent?.eventId === event.eventId}
              >
                <span className="block font-bold">{event.eventType.replace("_", " ")}</span>
                <span className="text-[10px] text-slate-500">{formatTime(event.availableTimeMs)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <article className="min-w-0 rounded-lg border border-cyan-900/70 bg-slate-900/90 p-3" aria-label={`Hồ sơ ${selectedEvent.eventType}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-cyan-200">{selectedEvent.eventType.replace("_", " ")}</h3>
                <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${stateStyle(selectedEvent.stateAtAsOf)}`}>{selectedEvent.stateAtAsOf}</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{selectedEvent.description}</p>
              <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{selectedEvent.eventId}</p>
            </div>
            <button type="button" onClick={() => onSelectEvent(null)} className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200" aria-label="Đóng hồ sơ sự kiện"><X className="h-4 w-4" /></button>
          </div>

          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-slate-500">Origin</dt><dd className="text-slate-200">{formatTime(selectedEvent.originTimeMs)}</dd></div>
            <div><dt className="text-slate-500">Available</dt><dd className="text-slate-200">{formatTime(selectedEvent.availableTimeMs)}</dd></div>
            <div><dt className="text-slate-500">Reference</dt><dd className="text-slate-200">{formatTime(selectedEvent.referenceTimeMs)}</dd></div>
            <div><dt className="text-slate-500">Giá / vùng</dt><dd className="text-slate-200">{selectedEvent.lowPrice != null && selectedEvent.highPrice != null ? `${selectedEvent.lowPrice.toFixed(2)} – ${selectedEvent.highPrice.toFixed(2)}` : selectedEvent.price.toFixed(2)}</dd></div>
            <div><dt className="text-slate-500">Mitigated at</dt><dd className="text-slate-200">{formatTime(selectedEvent.mitigatedAtMs)}</dd></div>
            <div><dt className="text-slate-500">Invalidated at</dt><dd className="text-slate-200">{formatTime(selectedEvent.invalidatedAtMs)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-500">Calculation version</dt><dd className="break-all text-slate-200">{selectedEvent.calculationVersion}</dd></div>
          </dl>

          <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Điều kiện phát hiện</h4>
              <ul className="mt-1 space-y-1 text-[11px] text-slate-300">{selectedEvent.detectionConditions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Giới hạn</h4>
              <ul className="mt-1 space-y-1 text-[11px] text-amber-200/90">{selectedEvent.limitations.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          </div>

          <div className="mt-3 min-w-0 overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-[10px]">
              <caption className="pb-1 text-left font-bold uppercase tracking-wide text-slate-400">Nến nguồn</caption>
              <thead className="text-slate-500"><tr><th className="pr-3">Vai trò</th><th className="pr-3">Open time</th><th className="pr-3">O</th><th className="pr-3">H</th><th className="pr-3">L</th><th>C</th></tr></thead>
              <tbody className="text-slate-300">{selectedEvent.sourceCandles.map((candle) => <tr key={`${candle.role}-${candle.openTimeMs}`} className="border-t border-slate-800"><td className="py-1 pr-3">{candle.role}</td><td className="pr-3">{formatTime(candle.openTimeMs)}</td><td className="pr-3">{candle.open.toFixed(2)}</td><td className="pr-3">{candle.high.toFixed(2)}</td><td className="pr-3">{candle.low.toFixed(2)}</td><td>{candle.close.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
        </article>
      )}
    </section>
  );
}
