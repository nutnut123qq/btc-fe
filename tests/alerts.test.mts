import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const apiSource = readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8");
const typesSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const drawerSource = readFileSync(new URL("../src/components/AlertsDrawer.tsx", import.meta.url), "utf8");

test("getAlerts sends the skip cursor and degrades honestly when total is absent", () => {
  assert.match(apiSource, /getAlerts\(userId: string, take = 30, includeArchived = false, skip = 0\)/);
  assert.match(apiSource, /skip: String\(skip\)/);
  // Older backends lack `total` — degrade to null (no-pagination UI) instead of
  // failing the whole list during a deploy-skew window; still fails closed when
  // the field exists but is not a finite number.
  assert.match(apiSource, /record\.total === undefined \? null : record\.total/);
  assert.match(apiSource, /alerts\.total must be a finite number when present/);
  assert.match(apiSource, /\{ \.\.\.record, total,/);
});

test("AlertListResponse exposes the filtered total for pagination", () => {
  assert.match(typesSource, /AlertListResponse = \{[\s\S]*?total: number \| null;[\s\S]*?items: AlertItem\[\]/);
});

test("alerts drawer appends further pages instead of refetching one page", () => {
  assert.match(drawerSource, /alerts\.length < total/);
  assert.match(drawerSource, /Xem thêm/);
  assert.match(drawerSource, /loadingMore/);
  assert.match(drawerSource, /getAlerts\(ALERT_USER_ID, 30, includeArchived, alertsRef\.current\.length\)/);
  assert.match(drawerSource, /setAlerts\(\(prev\) =>[\s\S]*?\[\.\.\.prev, \.\.\.data\.items\.filter/);
});

test("archived toggle resets the list before refetching from page 1", () => {
  assert.match(drawerSource, /Hiện cả đã lưu trữ/);
  assert.match(drawerSource, /setIncludeArchived/);
  assert.match(drawerSource, /handleToggleArchived[\s\S]*?setAlerts\(\[\]\)/);
  // Effect refetches when open toggles or includeArchived changes (via fetchAlerts identity).
  assert.match(drawerSource, /\[open, fetchAlerts\]/);
  assert.match(drawerSource, /useCallback[\s\S]*?\[includeArchived\]/);
});

test("in-flight responses cannot overwrite a newer filter or load-more", () => {
  // Request-id guard: a response applies only while it is the latest call —
  // prevents a stale-filter fetch or an older load-more from clobbering the list.
  assert.match(drawerSource, /reqRef = useRef\(0\)/);
  assert.match(drawerSource, /reqId !== reqRef\.current\) return/);
  assert.match(drawerSource, /handleToggleArchived[\s\S]*?reqRef\.current \+= 1/);
});

test("pagination UI hides instead of fabricating when backend lacks total", () => {
  assert.match(drawerSource, /total != null && alerts\.length < total/);
  assert.match(drawerSource, /total != null && total > 0/);
});
