const BASE = "https://api.btcanalyst.dpdns.org";
const mod = await import("./src/lib/apiContract.ts");
const t0 = Date.now();
const res = await fetch(BASE + "/api/market/data-audit?symbol=BTCUSDT&includeInventory=true");
const data = await res.json();
console.log("audit+inventory fetch ms:", Date.now()-t0, "http", res.status);
try { mod.requireDataAudit(data); console.log("audit+inventory PARSE-OK, tfs:", data.timeframes?.map(t=>t.timeframe).join(",")); }
catch(e){ console.log("audit+inventory PARSE-FAIL:", e.message.slice(0,250)); }
const t1 = Date.now();
const res2 = await fetch(BASE + "/api/health/workers");
const d2 = await res2.json();
console.log("workers fetch ms:", Date.now()-t1);
try { const w = mod.requireWorkersHealth(d2); console.log("workers PARSE-OK n=", w.workers?.length); }
catch(e){ console.log("workers PARSE-FAIL:", e.message.slice(0,250)); }
