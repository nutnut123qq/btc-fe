# Bitcoin AI Analyst Frontend

Next.js 16 frontend for the local research stack. Browser requests always use same-origin `/api` and `/hubs`; the Next server proxies them to the backend.

## Local production-like run

```powershell
npm ci
$env:BACKEND_INTERNAL_URL = "http://127.0.0.1:5197"
npm run build
npm run start
```

Local builds intentionally do not create standalone output, so `next start` remains supported.

## Standalone/Docker build

Set `NEXT_STANDALONE=1` only for a standalone build. The Dockerfile does this and supplies its internal backend destination through `BACKEND_INTERNAL_URL`; this value is server-only and is never bundled as a browser API base URL.

## Verification

```powershell
npm run contract:check
npm test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
npm audit --audit-level=high
```

`npm run test:e2e` runs Chromium against `next start` with deterministic mocked/degraded backend responses and fails on uncaught page errors or browser console errors.
