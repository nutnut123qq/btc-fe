# Redesign Reference Package — btc-fe (pending user approval)

Reference-led redesign of the whole app. Source of truth = Stitch project +
local rendered screenshots. No application code changed in this phase.

## Stitch

- Project: `btc-fe-redesign` — `projects/12766395758591874275`
- Stitch `get_screen_image`/`get_screen_code` are broken (server-side
  `get_screen` invalid-argument). Workflow used: `generate_and_fetch_code`
  → save HTML → render locally → screenshot.
- Rendered HTML: `frontend/.stitch-ref/*.html` and `.stitch-ref/html/*-mobile.html`
- Screenshots (viewed, all 30): `frontend/.stitch-ref/*.png`

## Winner — News direction A (compact editorial rows)

| Variant | Verdict |
|---|---|
| A — editorial rows | **WINNER** — best scanability, flat rows port to evidence/trade tables |
| B — horizontal cards | rejected — card chrome per item, card-in-card risk |
| C — time-grouped feed | rejected — date headers cost vertical space, buckets only fit News |

Fix at implementation: drop invented chrome (`ĐỒNG BỘ` chip, `NODE_…`,
`LATENCY`, `CẬP NHẬT RSS REALTIME`, footer TLS text, per-article category tags,
per-article sentiment scores). Source = neutral text, not colored chips.
No uppercase Vietnamese.

## Design contract (applies to all screens)

- Dark workstation: bg `#0b1326`; surfaces `#131b2e`/`#171f33`; hairline
  `#1c263e`; low radius; no gradients/glow/hero.
- Semantic palette (unchanged): teal `#14b8a6` active/interaction only;
  emerald/rose up·down+error; amber warning/stale/quarantine/experimental;
  healthy = quiet slate.
- Type: Be Vietnam Pro UI; JetBrains Mono for numbers/timestamps/hashes only;
  tabular numbers; title ~20px, section 13–15px, body 13px, meta ~11–12px.
- Desktop: compact top bar + 5 labelled nav groups + secondary strip.
- Mobile: compact top bar + bottom nav with 5 labelled items (≥44px targets);
  wide tables become stacked flat rows — never page-level overflow.
- Real nav groups/children (AppShell): Thị trường[market] · Tin tức & AI
  [news, ai] · Nghiên cứu[research, archetype, rules, backtest] · Mô phỏng
  [predict, paper, binanceHistory] · Hệ thống[settings].
- Overlays: alerts = right drawer desktop / bottom sheet mobile; AI chat =
  bottom-right panel desktop / full-height sheet mobile.

## Reference ↔ screen map

| Screen | Ref PNG (desktop/mobile) | Composition in ref |
|---|---|---|
| market | market-*.png | price strip + tf/replay toolbar → dominant chart w/ as-of marker + dimmed future zone → accordion summaries (indicators/patterns/volume/regime) |
| news | news-A-rows.png / news-mobile.png | source filter chips → flat editorial rows (thumb 112×72 / 80×56, monogram fallback, source+time meta, 2-line title, open-original affordance) + amber stale strip |
| ai | ai-*.png | `Phân tích BTC` action → verdict block (SIDEWAYS+confidence+time) → prose sections → collapsed agent rows → amber "LLM ≠ validated evidence" |
| research | research-*.png | coverage rows 1h/4h/1d (+15m buffer, amber gap) → quality ledger (n, cutoff, FDR, exclusions, hash) → dossier list |
| archetype | archetype-*.png | filter strip → query chart → analog list (rank+sparkline+similarity+freq+outcome, expandable) → distribution panel; amber experimental caveat |
| rules | rules-*.png | Discovery + Đánh giá actions → flat rule rows (sequence text, khung, n/rate/p-value, trigger, status) → collapsed evaluate section |
| backtest | backtest-*.png | Single/Ensemble tabs → run rows (id, model, window, PnL/win/trades, status incl. legacy/invalid/experimental) → selected run: equity + metrics + trades |
| predict | predict-*.png | controls strip → **quarantine first-class** (amber MODEL_ARTIFACT_INCOMPATIBLE + disabled retry) → history rows w/ P↓P→P↑ mono + abstain row → historical eval strip |
| paper | paper-*.png | metric strip (observed/abstain/fill/open) → observation rows (signal time, decision, quote, fill/—, outcome, reason `model_unavailable`) → forward≠replay note → collapsed replay section |
| binanceHistory | binanceHistory-*.png | amber "MÔ PHỎNG — không tiền thật" strip → metric strip (capital/PnL/win/trades) → filters → trade rows (time, side, in→out, PnL, reason, model+provenance) |
| settings | settings-*.png | form sections (thresholds w/ amber validation, channel toggles, frequency) + Lưu → worker status list → telegram panel |
| alerts overlay | overlay-alerts-*.png | drawer/sheet: unread dot, type label, message, mono time, mark-all-read, worker-warning row, close ≥44px |
| ai chat overlay | overlay-aichat-*.png | panel/sheet: header + context tag + messages w/ citation line + amber capability-unavailable state + quick chips + input |

## Divergences to enforce at implementation (Stitch invented — do NOT port)

- Sub-tab labels must be the real ones:
  - Archetype: `Analog lịch sử · Thư viện (audit) · Bảng xếp hạng · Chuyển đổi · Dự báo`
  - Research: `Tổng quan · Mô hình · Feature · Sự kiện · Kinh tế · Forward`
  - Backtest: `Single Model Backtests · Ensemble (Experimental)`
  - Mô phỏng children labels: `Dự đoán · Paper · Nhật ký Paper BTC`
- Settings: drop invented sub-tabs (`API & Khóa`, `Cấu hình mô hình`,
  `Nhật ký hệ thống`). Keep real mounted sections: admin SessionAccessPanel,
  contract-incompatible warning, SystemStatusPanel, TelegramSettingsPanel.
- Drop invented controls: `Xuất CSV` (no export exists), `Đặt lại`,
  `Chạy backtest mới` prominence, quick chips must be the 4 real QUICK_CHIPS.
- Drop invented telemetry/decor: `v2.4`, `12ms`, `NODE_*`, uptime %, `ISO-8000`,
  `BAYESIAN-v4.2` model banner, sentiment scores, `K-NN DTW` badge (keep only
  if product shows it), checkpoint numbers.
- News thumbnails: contract gap — see decision D1.
- Keep real features Stitch omitted: contract-incompatible mutation lock,
  admin unlock gate, error envelopes, keyboard/focus states.

## Data constraints

- Prediction may be quarantined (`MODEL_ARTIFACT_INCOMPATIBLE`) — first-class
  amber state, never beautified into success.
- Paper observations abstain-heavy; `model_unavailable` reason honest.
- No fabricating fills/outcomes/similarity; abstain ≠ loss.
- Production desktop Paper currently 500s on
  `api/market/data-audit?includeInventory=true` — record as known constraint,
  not silently fixed.
- News thumbnails: `NewsItem` = id/source/title/link/publishedAt/summary —
  no imageUrl. Stale feed and missing timestamps must stay honest.

## Decisions awaiting user

- **D1 — News thumbnail gap.** Contract has no image field.
  - A: FE-only — neutral monogram fallback tile for every article
    (no fake images; reference look preserved minus real photos).
  - B: end-to-end thumbnail support (BE ingest + DTO + FE) — separate scope.
  Recommendation: A for this pass; B as follow-up if desired.
  **DECIDED (user): A — FE-only monogram fallback.**
- **D2 — approve the reference set** (this file + `.stitch-ref/` PNGs) as the
  implementation target for `/ui-benchmark`.
  **DECIDED (user): approved — proceed to implementation via /ui-benchmark.**
