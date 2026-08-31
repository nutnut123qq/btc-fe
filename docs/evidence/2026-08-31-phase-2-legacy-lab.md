# Phase 2 legacy isolation and Lab evidence — 2026-08-31

## Baseline and scope

- Pre-commit frontend HEAD: `94d0069b9f5da54891b46274edf9ba2f23fc037c`.
- Core requests default to `includeLegacy=false` and only accept unarchived records with `validityStatus: Valid`.
- Backtest and prediction research views expose an explicit Lab filter for `Legacy` and `Invalid` records, including pipeline version, evaluation version and concrete invalid reason.
- Contract guards fail closed when version, validity, archival or promotion metadata is absent, blank or malformed.
- Alert loading defaults to `includeArchived=false` and defensively excludes archived items.

## Ensemble evidence isolation

- The ensemble widget is read-only: opening it only reads history and evaluation endpoints; it does not create predictions, run replay or mutate evaluation state.
- Historical evidence is presented in three separate, non-interchangeable panels:
  - raw legacy evaluation;
  - canonical deduplicated audit;
  - versioned `evaluation-v2` re-evaluation.
- Re-evaluated records retain immutable lineage from `sourcePredictionId` to the child record and its evaluation version.
- Every ensemble view is labeled `Experimental` and non-promotable; no historical result is presented as a production signal.
- Paper Journal no longer exposes the legacy ensemble signal-generation mutation.

## Verification

- Frontend tests: 16 passed, 0 failed.
- ESLint: passed with no warning or error.
- TypeScript `tsc --noEmit`: passed.
- Production build: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `git diff --check`: no whitespace errors.
- Independent Phase 2 review: PASS.

## Browser smoke on the migrated database

The production-like local stack was exercised against the real database after the Phase 2 migration, with the AI provider configured as `none`:

- Core correctly showed no `Valid` research records rather than promoting legacy evidence.
- Prediction Lab showed the duplicate prediction as `Invalid` and retained the remaining `Legacy` records with their reasons.
- Backtest Lab showed five `Invalid` runs and one `Legacy` run with explicit reasons.
- Ensemble evidence remained visible without being promoted:
  - raw legacy directional accuracy: `35.54%`;
  - canonical audit directional accuracy: `34.23%`;
  - versioned `evaluation-v2` directional accuracy: `34.22%`.
- All three ensemble panels were visibly `Experimental` and non-promotable, with re-evaluation lineage available.
- Browser console contained no warning or error.

## Known limitation deferred to Phase 8

- Primary navigation has not yet been restructured into the final five Core screens plus separate Lab navigation.

## Gate result

The frontend portion of Phase 2 is green. Legacy and invalid evidence remains inspectable in Lab, while Core fails closed and reports no validated signal when no `Valid` record exists.
