import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Data file checks: windows match the OEB wording, no invented fields, every appliance has a basis.
const R = JSON.parse(readFileSync(new URL("../data/rates.json", import.meta.url), "utf8"));
assert.ok(R.source.ratesUrl.startsWith("https://www.oeb.ca/"));
assert.match(R.source.rateYear, /November 1, 2026/);
assert.equal(R.tou.winter.midPeak, "Weekdays 11 a.m. to 5 p.m.");
assert.equal(R.tou.summer.onPeak, "Weekdays 11 a.m. to 5 p.m.");
assert.equal(R.ulo.windows.onPeak, "Weekdays 4 p.m. to 9 p.m.");
assert.deepEqual([R.tiered.tier1, R.tiered.tier2], [11.2, 13.2]);
for (const a of R.appliances) {
  assert.ok(a.watts > 0 && a.hours > 0 && a.basis, a.id);
}
const text = readFileSync(new URL("../data/rates.json", import.meta.url), "utf8")
  + readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(!/[\u2013\u2014]/.test(text), "no en or em dashes in public text");
console.log("All TOU Saver data tests passed.");
