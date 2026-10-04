const BASE = "https://api.btcanalyst.dpdns.org";
const mod = await import("./src/lib/apiContract.ts");
const { requireVersionedResearchItems, requireDataAudit, requireWorkersHealth } = mod;

async function probe(path, fn, label) {
  try {
    const res = await fetch(BASE + path);
    const data = await res.json();
    try {
      const out = fn(data);
      console.log(label, "PARSE-OK", JSON.stringify(out).slice(0, 120));
    } catch (e) {
      console.log(label, "PARSE-FAIL:", e.message.slice(0, 300));
    }
  } catch (e) {
    console.log(label, "FETCH-FAIL:", e.message.slice(0, 150));
  }
}
await probe("/api/research/evidence", d => requireVersionedResearchItems(d, "items", "evidence"), "catalog");
await probe("/api/market/data-audit?symbol=BTCUSDT", d => requireDataAudit(d), "audit");
await probe("/api/health/workers", d => requireWorkersHealth(d), "workers");
