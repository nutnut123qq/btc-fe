# Phase 4 evidence — frontend contract and production profile

Date: 2026-08-31

- Browser REST and SignalR calls are same-origin (`/api`, `/hubs`). Server rewrites use `BACKEND_INTERNAL_URL`; the public bundle does not contain `http://backend:5197`.
- `NEXT_STANDALONE=1` is explicit for Docker. Normal local builds remain compatible with `next start`.
- The pinned OpenAPI contract and generated TypeScript declarations are deterministic. Pinned backend SHA-256: `4AB5D7802C2CC96E0EA7689421FCE0001B7182F7212FDB5F591185777C813A1E`.
- CI runs `npm ci`, contract check, unit tests, lint, typecheck, production build, high-severity audit, and Chromium Playwright smoke.

Verification:

- Unit/contract tests: 26/26 passed.
- ESLint and TypeScript: passed.
- Local and standalone production builds: passed.
- Playwright Chromium: 2/2 passed, including contract-unavailable/read-only degradation; uncaught console/page errors fail the run.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- No test server/listener remained after verification.

Generated types are pinned and checked but existing handwritten DTOs are migrated incrementally. The complete Core/Lab E2E matrix belongs to Phase 8.
