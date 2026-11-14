(function () {
  "use strict";
  const L = window.TOUSaverLogic;
  let R = null;

  const LABELS = {
    tou: { offPeak: "Off-peak", midPeak: "Mid-peak", onPeak: "On-peak" },
    ulo: { ultraLow: "Ultra-low overnight", weekendOffPeak: "Weekend off-peak", midPeak: "Mid-peak", onPeak: "On-peak" },
  };
  const cls = (k) => (k === "offPeak" || k === "weekendOffPeak" ? "off" : k === "ultraLow" ? "ultra" : k === "midPeak" ? "mid" : "on");
  const $ = (id) => document.getElementById(id);
  const plan = () => document.querySelector('input[name="plan"]:checked').value;

  function renderNow() {
    const parts = L.torontoParts(new Date());
    const p = plan();
    const key = L.period(R, p, parts);
    const badge = $("now-badge");
    badge.className = "badge " + cls(key);
    badge.textContent = `${LABELS[p][key]} · ${L.price(R, p, key).toFixed(1)} ¢/kWh`;

    const timeStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: L.TZ, weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date());
    let meta = `${timeStr}, Toronto time. ${L.isWinter(parts.month) ? "Winter" : "Summer"} schedule.`;
    if (L.isHoliday(R, parts.dateStr)) meta += " Today is an OEB holiday, so the lowest prices apply all day.";
    if (!L.holidayListKnown(R, parts.year)) meta += ` The OEB has not posted its ${parts.year} holiday list in this app yet, so holidays are not marked.`;
    $("now-meta").textContent = meta;

    const tl = $("timeline");
    tl.innerHTML = "";
    tl.setAttribute("aria-label", `Today's ${p.toUpperCase()} price periods by hour`);
    const summary = [];
    L.hourSlots(R, p, parts).forEach((s) => {
      const d = document.createElement("div");
      d.className = `slot ${cls(s.key)}`;
      d.title = `${String(s.hour).padStart(2, "0")}:00 · ${LABELS[p][s.key]}`;
      if (s.hour === parts.hour) d.setAttribute("aria-current", "true");
      tl.appendChild(d);
      const last = summary[summary.length - 1];
      if (last && last.key === s.key) last.end = s.hour + 1; else summary.push({ key: s.key, start: s.hour, end: s.hour + 1 });
    });
    $("timeline-text").textContent = "Today by hour: " + summary.map((x) => `${x.start}:00 to ${x.end}:00 ${LABELS[p][x.key]}`).join("; ") + ".";

    const season = R.tou[L.isWinter(parts.month) ? "winter" : "summer"];
    $("schedule-copy").innerHTML = p === "tou"
      ? `<p><strong>${season.label}</strong></p><ul>
          <li><strong>Off-peak (${R.tou.prices.offPeak} ¢):</strong> ${season.offPeak}</li>
          <li><strong>Mid-peak (${R.tou.prices.midPeak} ¢):</strong> ${season.midPeak}</li>
          <li><strong>On-peak (${R.tou.prices.onPeak} ¢):</strong> ${season.onPeak}</li></ul>`
      : `<p><strong>Ultra-Low Overnight (same all year)</strong></p><ul>
          <li><strong>Ultra-low (${R.ulo.prices.ultraLow} ¢):</strong> ${R.ulo.windows.ultraLow}</li>
          <li><strong>Weekend off-peak (${R.ulo.prices.weekendOffPeak} ¢):</strong> ${R.ulo.windows.weekendOffPeak}</li>
          <li><strong>Mid-peak (${R.ulo.prices.midPeak} ¢):</strong> ${R.ulo.windows.midPeak}</li>
          <li><strong>On-peak (${R.ulo.prices.onPeak} ¢):</strong> ${R.ulo.windows.onPeak}</li></ul>`;
  }

  function current() { return R.appliances.find((a) => a.id === $("appliance").value); }

  function loadAppliance() {
    const a = current();
    $("watts").value = a.watts;
    $("hours").value = a.hours;
    $("basis").textContent = a.basis;
    estimate();
  }

  function estimate() {
    const p = plan();
    const a = current();
    const kwh = L.kwhPerRun($("watts").value, $("hours").value);
    const times = Number($("times").value) || 0;
    const from = $("from-period").value, to = $("to-period").value;
    const r = L.shift(R, p, kwh, times, from, to);
    $("estimate").innerHTML = `
      <p><strong>${a.label}</strong>: ${kwh.toFixed(2)} kWh a run, ${times} run${times === 1 ? "" : "s"} a week, ${r.weekKwh.toFixed(1)} kWh a week.</p>
      <p>During <strong>${LABELS[p][from]}</strong>: <strong>${L.dollars(r.beforeWeek)}</strong> a week.</p>
      <p>Shifted to <strong>${LABELS[p][to]}</strong>: <strong>${L.dollars(r.afterWeek)}</strong> a week.</p>
      <p class="save">${r.savedWeek >= 0 ? "You save" : "This costs more by"} ${L.dollars(Math.abs(r.savedWeek))} a week,
        about ${L.dollars(Math.abs(r.savedMonth))} a month and ${L.dollars(Math.abs(r.savedYear))} a year.</p>
      <p class="meta">Electricity line only, at OEB prices. Delivery, regulatory charges and HST are not included.</p>`;
    $("impact-kwh").textContent = `${Math.round(r.onPeakKwhMovedYear).toLocaleString("en-CA")} kWh`;
    $("impact-text").textContent = r.onPeakKwhMovedYear > 0
      ? `moved out of the on-peak window each year by this one habit.`
      : `moved out of on-peak. Pick On-peak as the starting period to see how much this habit takes off the busiest hours.`;
  }

  function syncPeriods() {
    const p = plan();
    const keys = Object.keys(LABELS[p]);
    ["from-period", "to-period"].forEach((id, i) => {
      const sel = $(id), prev = sel.value;
      sel.innerHTML = keys.map((k) => `<option value="${k}">${LABELS[p][k]} (${L.price(R, p, k).toFixed(1)} ¢)</option>`).join("");
      sel.value = keys.includes(prev) ? prev : i === 0 ? "onPeak" : p === "tou" ? "offPeak" : "ultraLow";
    });
  }

  function renderHolidays() {
    const ul = $("holidays");
    ul.innerHTML = "";
    Object.values(R.holidays).flat().forEach((h) => {
      const li = document.createElement("li");
      li.textContent = `${h.date}: ${h.name}`;
      ul.appendChild(li);
    });
  }

  async function init() {
    const res = await fetch("data/rates.json");
    if (!res.ok) throw new Error("Could not load rates.json");
    R = await res.json();
    $("source-note").textContent = `${R.source.rateYear}. Checked against the OEB page on ${R.source.checked}.`;
    $("appliance").innerHTML = R.appliances.map((a) => `<option value="${a.id}">${a.label}</option>`).join("");
    syncPeriods();
    renderHolidays();
    renderNow();
    loadAppliance();
    document.querySelectorAll('input[name="plan"]').forEach((el) => el.addEventListener("change", () => { syncPeriods(); renderNow(); estimate(); }));
    $("appliance").addEventListener("change", loadAppliance);
    ["times", "watts", "hours", "from-period", "to-period"].forEach((id) => {
      $(id).addEventListener("change", estimate);
      $(id).addEventListener("input", estimate);
    });
    setInterval(renderNow, 60 * 1000);
  }

  function showErr(err) {
    const el = $("estimate");
    if (el) el.innerHTML = `<div class="alert" role="alert">Could not start the app: ${err.message}</div>`;
    console.error(err);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init().catch(showErr));
  else init().catch(showErr);
})();
