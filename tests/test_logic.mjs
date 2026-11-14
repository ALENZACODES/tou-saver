import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const L = require("../logic.js");
const R = JSON.parse(readFileSync(new URL("../data/rates.json", import.meta.url), "utf8"));

// Prices set by the OEB for November 1, 2026 (checked on oeb.ca Nov 14, 2026).
assert.deepEqual(R.tou.prices, { offPeak: 9.1, midPeak: 14.6, onPeak: 18.9 });
assert.deepEqual(R.ulo.prices, { ultraLow: 3.7, weekendOffPeak: 9.1, midPeak: 14.6, onPeak: 37.7 });
assert.equal(R.holidays["2026"].length, 10);
assert.ok(R.holidays["2026"].some((h) => h.date === "2026-12-28"));

const at = (iso) => L.torontoParts(new Date(iso));
// Toronto clock from UTC instants (EST is UTC minus 5 in November).
const p = at("2026-11-18T13:30:00Z");
assert.equal(p.hour, 8); assert.equal(p.weekday, "Wed"); assert.equal(p.dateStr, "2026-11-18");
assert.equal(at("2026-11-18T05:00:00Z").hour, 0, "midnight reads as hour 0");

// TOU winter weekday.
assert.equal(L.touPeriod(R, at("2026-11-18T12:00:00Z")), "onPeak");   // 7:00
assert.equal(L.touPeriod(R, at("2026-11-18T11:59:00Z")), "offPeak");  // 6:59
assert.equal(L.touPeriod(R, at("2026-11-18T16:00:00Z")), "midPeak");  // 11:00
assert.equal(L.touPeriod(R, at("2026-11-18T22:00:00Z")), "onPeak");   // 17:00
assert.equal(L.touPeriod(R, at("2026-11-19T00:00:00Z")), "offPeak");  // 19:00
// TOU summer weekday (EDT is UTC minus 4).
assert.equal(L.touPeriod(R, at("2026-07-09T17:00:00Z")), "onPeak");   // 13:00
assert.equal(L.touPeriod(R, at("2026-07-09T12:00:00Z")), "midPeak");  // 8:00
// Weekend and holiday.
assert.equal(L.touPeriod(R, at("2026-11-21T16:00:00Z")), "offPeak");  // Saturday
assert.equal(L.touPeriod(R, at("2026-12-28T14:00:00Z")), "offPeak");  // Boxing Day pricing Monday
assert.equal(L.touPeriod(R, at("2026-12-29T14:00:00Z")), "onPeak");   // next day 9:00
// ULO.
assert.equal(L.uloPeriod(R, at("2026-11-19T04:30:00Z")), "ultraLow"); // 23:30
assert.equal(L.uloPeriod(R, at("2026-11-18T21:00:00Z")), "onPeak");   // 16:00
assert.equal(L.uloPeriod(R, at("2026-11-19T02:00:00Z")), "midPeak");  // 21:00
assert.equal(L.uloPeriod(R, at("2026-11-21T16:00:00Z")), "weekendOffPeak");
assert.equal(L.uloPeriod(R, at("2026-12-25T16:00:00Z")), "weekendOffPeak");

// Hour strip for a winter weekday on TOU: 7 off, 4 on, 6 mid, 2 on, 5 off.
const slots = L.hourSlots(R, "tou", at("2026-11-18T17:00:00Z")).map((s) => s.key);
assert.equal(slots.filter((k) => k === "onPeak").length, 6);
assert.equal(slots.filter((k) => k === "midPeak").length, 6);
assert.equal(slots.filter((k) => k === "offPeak").length, 12);

// Holidays beyond the published list are flagged as unknown.
assert.equal(L.holidayListKnown(R, 2026), true);
assert.equal(L.holidayListKnown(R, 2027), false);

// Savings math. Dryer 5,000 W for 1 hour = 5 kWh.
assert.equal(L.kwhPerRun(5000, 1), 5);
assert.equal(L.kwhPerRun(0, 1), 0);
const s = L.shift(R, "tou", 5, 3, "onPeak", "offPeak");
assert.equal(s.weekKwh, 15);
assert.ok(Math.abs(s.savedWeek - 15 * (18.9 - 9.1)) < 1e-9);      // 147 cents
assert.ok(Math.abs(s.savedYear - 147 * 52) < 1e-6);                // $76.44
assert.equal(s.onPeakKwhMovedYear, 780);
const ev = L.shift(R, "ulo", L.kwhPerRun(7200, 2), 3, "onPeak", "ultraLow");
assert.ok(Math.abs(ev.savedWeek - 43.2 * 34) < 1e-6);              // 1,468.8 cents
assert.equal(L.shift(R, "tou", 5, 3, "offPeak", "onPeak").onPeakKwhMovedYear, 0);
assert.ok(L.shift(R, "tou", 5, 3, "offPeak", "onPeak").savedWeek < 0);
assert.throws(() => L.price(R, "tou", "ultraLow"));
assert.equal(L.dollars(147), "$1.47");
console.log("All TOU Saver logic tests passed.");
