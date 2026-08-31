# Phase 3 system status and data audit evidence — 2026-08-31

## Scope

- Pre-Phase-3 frontend HEAD: `2567331ec5207fa74a06743acfc507b67fb1f456`.
- Settings loads only process liveness, database readiness, data freshness, and worker heartbeats automatically.
- The heavier Data Audit request is explicit: it starts only after the user selects **Làm mới báo cáo audit**, has a skeleton, and has a 10-second client timeout. The default request pins `includeInventory=false`.
- The API contract pin is `2026-08-phase3`. Read-only diagnostics remain usable while contract checking fails closed for every mutation.

## Browser smoke against the migrated database

- Backend ran in maintenance mode with background workers disabled; the AI service and all LLM providers were unavailable.
- The application remained usable and displayed `LLM OFF · định lượng vẫn hoạt động`.
- Settings reported process liveness, database readiness, truthful stale/fresh status for all seven BTC timeframes, and `never` for workers with no recorded heartbeat.
- Data Audit was absent on initial Settings load, showed a loading skeleton after the explicit click, and then rendered all seven timeframes in about one second on the first HTTP call.
- The audit distinguishes expected bars, missing bars, gap ranges, `Pending`, `Unavailable`, ledger reconciliation, data coverage, and latest-candle age. Untracked gaps are not falsely presented as filled.
- All seven BTC rows displayed `Đã đối soát`. A `LiveFallback` response is instead labeled `Tính trực tiếp · suy giảm`.
- Nullable derived inventories display `Chưa tải (fast audit)` rather than a false zero. Exact inventory scans require an explicit slow-path request.
- Manual retry and all other data mutations were disabled without both a compatible contract and an active AdminGuard session.
- Browser console: 0 warnings and 0 errors attributable to the application.

## Contract failure behavior

- Compatible contract: mutations are available only after normal authorization checks.
- Contract mismatch or unavailable metadata: alert save, Telegram test, gap retry, backfill, reindex, dataset rebuild, and pattern warmup are disabled.
- The API client independently fails closed if a disabled mutation is invoked programmatically.
- Internal sentinel `API_CONTRACT_UNVERIFIED` is never rendered; users receive a stable Vietnamese explanation while read-only health and audit stay available.

## Verification

- Frontend tests: 22 passed, 0 failed.
- ESLint: passed.
- TypeScript `tsc --noEmit`: passed.
- Production build: passed.
- `npm audit`: 0 vulnerabilities.
- `git diff --check`: no whitespace errors.
- Final browser smoke against the migrated fast-audit contract: all seven timeframes rendered, mutations remained disabled without AdminGuard, and browser console warnings/errors were 0.
- Independent review found one P2 raw-sentinel leak; the fix was re-reviewed and received **FINAL PASS**.

## Known limitation

- Primary navigation remains the existing tab layout. The final five Core screens plus separate Lab navigation are deliberately deferred to Phase 8.

## Gate result

The Phase 3 frontend gate is green. Diagnostics are lightweight by default, the expensive audit is explicit and resilient, mutation contract checks fail closed without blocking read-only use, and degraded AI/LLM state does not break quantitative screens.
