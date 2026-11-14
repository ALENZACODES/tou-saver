// TOU Saver pure logic. Works in the browser (window.TOUSaverLogic) and in Node (module.exports).
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TOUSaverLogic = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TZ = "America/Toronto";
  const WEEKS_PER_MONTH = 52 / 12;

  function torontoParts(date) {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    const p = Object.fromEntries(fmt.formatToParts(date || new Date()).map((x) => [x.type, x.value]));
    return {
      year: Number(p.year), month: Number(p.month), day: Number(p.day),
      hour: Number(p.hour), minute: Number(p.minute), weekday: p.weekday,
      dateStr: `${p.year}-${p.month}-${p.day}`,
    };
  }

  // Winter runs November 1 to April 30, summer May 1 to October 31 (OEB).
  function isWinter(month) { return month >= 11 || month <= 4; }
  function isWeekend(weekday) { return weekday === "Sat" || weekday === "Sun"; }

  function holidayYears(rates) {
    return Object.keys(rates.holidays || {}).map(Number);
  }
  function isHoliday(rates, dateStr) {
    const list = (rates.holidays || {})[dateStr.slice(0, 4)] || [];
    return list.some((h) => h.date === dateStr);
  }
  function holidayListKnown(rates, year) {
    return holidayYears(rates).includes(year);
  }

  function touPeriod(rates, parts) {
    if (isWeekend(parts.weekday) || isHoliday(rates, parts.dateStr)) return "offPeak";
    const m = parts.hour * 60 + parts.minute;
    if (m >= 19 * 60 || m < 7 * 60) return "offPeak";
    const middle = m >= 11 * 60 && m < 17 * 60;
    if (isWinter(parts.month)) return middle ? "midPeak" : "onPeak";
    return middle ? "onPeak" : "midPeak";
  }

  function uloPeriod(rates, parts) {
    const m = parts.hour * 60 + parts.minute;
    if (m >= 23 * 60 || m < 7 * 60) return "ultraLow";
    if (isWeekend(parts.weekday) || isHoliday(rates, parts.dateStr)) return "weekendOffPeak";
    if (m >= 16 * 60 && m < 21 * 60) return "onPeak";
    return "midPeak";
  }

  function period(rates, plan, parts) {
    return plan === "tou" ? touPeriod(rates, parts) : uloPeriod(rates, parts);
  }

  function price(rates, plan, key) {
    const v = (plan === "tou" ? rates.tou.prices : rates.ulo.prices)[key];
    if (typeof v !== "number") throw new Error(`No ${plan} price for ${key}`);
    return v;
  }

  function hourSlots(rates, plan, parts) {
    const out = [];
    for (let h = 0; h < 24; h++) out.push({ hour: h, key: period(rates, plan, { ...parts, hour: h, minute: 0 }) });
    return out;
  }

  // kWh for one run from power (watts) and run time (hours).
  function kwhPerRun(watts, hours) {
    const w = Number(watts), h = Number(hours);
    if (!(w > 0) || !(h > 0)) return 0;
    return (w / 1000) * h;
  }

  // Savings in cents for shifting `kwhRun` per run, `timesPerWeek` runs, from one period to another.
  function shift(rates, plan, kwhRun, timesPerWeek, fromKey, toKey) {
    const times = Math.max(0, Math.floor(Number(timesPerWeek) || 0));
    const weekKwh = kwhRun * times;
    const before = weekKwh * price(rates, plan, fromKey);
    const after = weekKwh * price(rates, plan, toKey);
    const saved = before - after;
    return {
      weekKwh,
      yearKwh: weekKwh * 52,
      beforeWeek: before, afterWeek: after, savedWeek: saved,
      savedMonth: saved * WEEKS_PER_MONTH,
      savedYear: saved * 52,
      onPeakKwhMovedYear: fromKey === "onPeak" && toKey !== "onPeak" ? weekKwh * 52 : 0,
    };
  }

  function dollars(cents) {
    return (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });
  }

  return { TZ, WEEKS_PER_MONTH, torontoParts, isWinter, isWeekend, isHoliday, holidayListKnown,
    touPeriod, uloPeriod, period, price, hourSlots, kwhPerRun, shift, dollars };
});
