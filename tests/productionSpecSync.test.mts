import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// PRODSPEC-1 — pitfall #35 guard. The three live-stack specs env-skip locally
// (PLAYWRIGHT_BASE_URL unset), so their UI-copy assertions drift silently when
// screens get rewritten: post-REDESIGN headings broke 6 expectations in
// production.spec.ts, copy pass 03e2580 broke 1 in research-evidence.spec.ts,
// and the GlossaryTerm rewrite broke 2 in current-conditions.spec.ts — none of
// it visible to `npm test`. Each row below pins one marker an env-skip spec
// waits on to the component source that must still contain it. A copy change
// now fails here immediately instead of surfacing as a false-red prod check.

const spec = (name: string) => readFileSync(new URL(`../e2e/${name}`, import.meta.url), "utf8");
const component = (name: string) =>
  readFileSync(new URL(`../src/components/${name}`, import.meta.url), "utf8");

const productionSpec = spec("production.spec.ts");
const researchSpec = spec("research-evidence.spec.ts");
const conditionsSpec = spec("current-conditions.spec.ts");

// specNeedle = raw bytes the spec file must contain (regex source kept as
// written, backslashes included); componentNeedle = regex the component source
// must match. Keeping the spec side pinned too means deleting or renaming the
// assertion in the spec also fails this test.
const pins: Array<{
  specSource: string;
  specNeedle: string;
  componentPath: string;
  componentNeedle: RegExp;
}> = [
  // production.spec.ts — per-screen landmarks waited on via openTab(...)
  {
    specSource: productionSpec,
    specNeedle: "Historical Analog",
    componentPath: "archetypes/HistoricalAnalogView.tsx",
    componentNeedle: /Historical Analog Explorer/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Thư viện (audit)",
    componentPath: "ArchetypeScreen.tsx",
    componentNeedle: /"Thư viện \(audit\)"/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Không tìm thấy mẫu nến",
    componentPath: "archetypes/ArchetypeGalleryView.tsx",
    componentNeedle: /Không tìm thấy mẫu nến/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Mẫu gốc của ",
    componentPath: "archetypes/ArchetypeEvidencePanel.tsx",
    componentNeedle: /aria-label=\{`Mẫu gốc của /,
  },
  {
    specSource: productionSpec,
    specNeedle: "Nguồn: giá đóng cửa",
    componentPath: "archetypes/ArchetypeEvidencePanel.tsx",
    componentNeedle: /Nguồn: giá đóng cửa/,
  },
  {
    specSource: productionSpec,
    specNeedle: "LangGraph nhiều tác tử",
    componentPath: "AiAnalysisScreen.tsx",
    componentNeedle: /LangGraph nhiều tác tử phân tích BTC/,
  },
  {
    specSource: productionSpec,
    specNeedle: '"Phân tích BTC"',
    componentPath: "AiAnalysisScreen.tsx",
    componentNeedle: /"Phân tích BTC"/,
  },
  {
    specSource: productionSpec,
    specNeedle: "LLM OFF — phân tích đa tác tử chưa khả dụng",
    componentPath: "AiAnalysisScreen.tsx",
    componentNeedle: /LLM OFF — phân tích đa tác tử chưa khả dụng/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Chạy Discovery",
    componentPath: "DiscoveryScreen.tsx",
    componentNeedle: /"Chạy Discovery"/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Dự đoán ML 3 nhãn",
    componentPath: "PredictionScreen.tsx",
    componentNeedle: /Dự đoán ML 3 nhãn \(giảm\/đi ngang\/tăng\)/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Chưa có model tương thích đã qua",
    componentPath: "PredictionScreen.tsx",
    componentNeedle: /Chưa có model tương thích đã qua/,
  },
  {
    specSource: productionSpec,
    specNeedle: '"Paper BTC"',
    componentPath: "PaperTradeScreen.tsx",
    componentNeedle: />Paper BTC<\//,
  },
  {
    specSource: productionSpec,
    specNeedle: "Danh sách giao dịch mô phỏng",
    componentPath: "BinanceTradeHistoryScreen.tsx",
    componentNeedle: /Danh sách giao dịch mô phỏng/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Kết quả backtest chiến lược",
    componentPath: "BacktestScreen.tsx",
    componentNeedle: /Kết quả backtest chiến lược trên/,
  },
  {
    specSource: productionSpec,
    specNeedle: "Ngưỡng giá BTC",
    componentPath: "AlertSettingsScreen.tsx",
    componentNeedle: /Ngưỡng giá BTC/,
  },

  // research-evidence.spec.ts — dossier labels (env-skip: live stack only)
  {
    specSource: researchSpec,
    specNeedle: "Nghiên cứu có thể kiểm chứng",
    componentPath: "ResearchEvidenceScreen.tsx",
    componentNeedle: /Nghiên cứu có thể kiểm chứng/,
  },
  {
    specSource: researchSpec,
    specNeedle: "Danh sách artifact",
    componentPath: "ResearchEvidenceScreen.tsx",
    componentNeedle: /aria-label="Danh sách artifact"/,
  },
  {
    specSource: researchSpec,
    specNeedle: "Evidence API chưa sẵn sàng",
    componentPath: "ResearchEvidenceScreen.tsx",
    componentNeedle: /Evidence API chưa sẵn sàng/,
  },
  {
    specSource: researchSpec,
    specNeedle: "hash đã xác minh",
    componentPath: "ResearchEvidenceScreen.tsx",
    componentNeedle: /hash đã xác minh/,
  },
  {
    specSource: researchSpec,
    specNeedle: "p thô \\/ q đã hiệu chỉnh",
    componentPath: "StatisticalEvidencePanel.tsx",
    componentNeedle: /p thô \/ q đã hiệu chỉnh/,
  },
  {
    specSource: researchSpec,
    specNeedle: "Sensitivity audit · per-variant",
    componentPath: "StatisticalEvidencePanel.tsx",
    componentNeedle: /Sensitivity audit · per-variant/,
  },
  {
    specSource: researchSpec,
    specNeedle: "Loại để lấy tập không chồng lấn",
    componentPath: "StatisticalEvidencePanel.tsx",
    componentNeedle: /Loại để lấy tập không chồng lấn/,
  },

  // current-conditions.spec.ts — panel meta labels + selectors
  {
    specSource: conditionsSpec,
    specNeedle: "Nến được phân tích (asOf)",
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /Nến được phân tích \(asOf\)/,
  },
  {
    specSource: conditionsSpec,
    specNeedle: "Bằng chứng cắt tại",
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /Bằng chứng cắt tại/,
  },
  {
    specSource: conditionsSpec,
    specNeedle: "current-conditions-title",
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /current-conditions-title/,
  },
  {
    specSource: conditionsSpec,
    specNeedle: "Timeframe điều kiện hiện tại",
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /aria-label="Timeframe điều kiện hiện tại"/,
  },
  {
    specSource: conditionsSpec,
    specNeedle: "Điều kiện hiện tại chưa sẵn sàng",
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /Điều kiện hiện tại chưa sẵn sàng/,
  },
  {
    specSource: conditionsSpec,
    specNeedle: "Đang tải catalog…",
    componentPath: "ResearchEvidenceScreen.tsx",
    componentNeedle: /Đang tải catalog…/,
  },
  {
    // Conflict refs render through moduleRefLabel() — the raw evidence id
    // lives in the title attribute, which is what the spec asserts on.
    specSource: conditionsSpec,
    specNeedle: '[title="${id}"]',
    componentPath: "CurrentConditionsPanel.tsx",
    componentNeedle: /title=\{ref\}[^>]*>\{moduleRefLabel\(ref\)\}/,
  },
];

test("openMainTab resolves the nav container that is visible per viewport", () => {
  // Post-REDESIGN there are two containers: desktop `nav-groups`
  // (`hidden lg:flex`) and the mobile bottom bar `nav-groups-mobile`
  // (`lg:hidden`). A helper that only queries the desktop testid can never
  // click on a mobile viewport — the research-evidence mobile spec hung on
  // exactly this for 60s before PRODSPEC-1.
  const nav = readFileSync(new URL("../e2e/nav.ts", import.meta.url), "utf8");
  const shell = component("AppShell.tsx");
  assert.match(nav, /getByTestId\("nav-groups-mobile"\)/);
  assert.match(shell, /data-testid="nav-groups"\s+className="hidden lg:flex/);
  assert.match(shell, /data-testid="nav-groups-mobile"[\s\S]{0,80}lg:hidden/);
});

test("env-skip prod spec markers stay in sync with component copy", () => {
  const failures: string[] = [];
  for (const pin of pins) {
    if (!pin.specSource.includes(pin.specNeedle)) {
      failures.push(`spec no longer waits on "${pin.specNeedle}" — update or drop this pin`);
    }
    const source = component(pin.componentPath);
    if (!pin.componentNeedle.test(source)) {
      failures.push(`${pin.componentPath} no longer renders marker "${pin.specNeedle}" — update the env-skip spec`);
    }
  }
  assert.deepEqual(failures, []);
});
