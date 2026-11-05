(function () {
  "use strict";

  const TZ = "America/Toronto";
  let RATES = null;

  function moneyFromCents(cents) {
    return (cents / 100).toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
    });
  }

  function torontoParts(date = new Date()) {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(
      fmt.formatToParts(date).map((p) => [p.type, p.value])
    );
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: Number(parts.hour),
      minute: Number(parts.minute),
      weekday: parts.weekday, // Mon, Tue, ...
      dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    };
  }

  function isWinter(month) {
    // Winter Nov 1 – Apr 30
    return month >= 11 || month <= 4;
  }

  function isHoliday(dateStr) {
    return (RATES.holidays2026 || []).some((h) => h.date === dateStr);
  }

  function isWeekend(weekday) {
    return weekday === "Sat" || weekday === "Sun";
  }

  function touPeriod(parts) {
    const weekendOrHoliday =
      isWeekend(parts.weekday) || isHoliday(parts.dateStr);
    if (weekendOrHoliday) return "offPeak";
    const mins = parts.hour * 60 + parts.minute;
    const winter = isWinter(parts.month);
    if (winter) {
      // Off: 7pm–7am; Mid: 11am–5pm; On: 7–11am and 5–7pm
      if (mins >= 19 * 60 || mins < 7 * 60) return "offPeak";
      if (mins >= 11 * 60 && mins < 17 * 60) return "midPeak";
      return "onPeak";
    }
    // Summer: Off 7pm–7am; Mid 7–11am and 5–7pm; On 11am–5pm
    if (mins >= 19 * 60 || mins < 7 * 60) return "offPeak";
    if (mins >= 11 * 60 && mins < 17 * 60) return "onPeak";
    return "midPeak";
  }

  function uloPeriod(parts) {
    const mins = parts.hour * 60 + parts.minute;
    if (mins >= 23 * 60 || mins < 7 * 60) return "ultraLow";
    const weekendOrHoliday =
      isWeekend(parts.weekday) || isHoliday(parts.dateStr);
    if (weekendOrHoliday) return "weekendOffPeak";
    if (mins >= 16 * 60 && mins < 21 * 60) return "onPeak";
    return "midPeak";
  }

  function periodLabel(plan, key) {
    if (plan === "tou") {
      return {
        offPeak: "Off-peak",
        midPeak: "Mid-peak",
        onPeak: "On-peak",
      }[key];
    }
    return {
      ultraLow: "Ultra-low overnight",
      weekendOffPeak: "Weekend off-peak",
      midPeak: "Mid-peak",
      onPeak: "On-peak",
    }[key];
  }

  function price(plan, key) {
    return plan === "tou" ? RATES.tou.prices[key] : RATES.ulo.prices[key];
  }

  function costCents(kwh, plan, key) {
    return kwh * price(plan, key);
  }

  function hourSlots(parts, plan) {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      const probe = {
        ...parts,
        hour: h,
        minute: 0,
      };
      const key = plan === "tou" ? touPeriod(probe) : uloPeriod(probe);
      slots.push({ hour: h, key });
    }
    return slots;
  }

  function renderNow() {
    const parts = torontoParts();
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const key = plan === "tou" ? touPeriod(parts) : uloPeriod(parts);
    const badge = document.getElementById("now-badge");
    badge.className = "badge " + (
      key === "offPeak" || key === "weekendOffPeak"
        ? "off"
        : key === "ultraLow"
        ? "ultra"
        : key === "midPeak"
        ? "mid"
        : "on"
    );
    badge.textContent = `${periodLabel(plan, key)} · ${price(plan, key).toFixed(1)} ¢/kWh`;

    const season = isWinter(parts.month) ? "Winter" : "Summer";
    const holiday = isHoliday(parts.dateStr);
    const timeStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());

    document.getElementById("now-meta").textContent =
      `${timeStr} (America/Toronto). ${season} schedule` +
      (holiday ? " · OEB holiday (off-peak all day on TOU)." : ".");

    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";
    timeline.setAttribute(
      "aria-label",
      `Today's ${plan.toUpperCase()} price periods by hour`
    );
    const slots = hourSlots(parts, plan);
    slots.forEach((s) => {
      const div = document.createElement("div");
      const cls =
        s.key === "offPeak" || s.key === "weekendOffPeak"
          ? "off"
          : s.key === "ultraLow"
          ? "ultra"
          : s.key === "midPeak"
          ? "mid"
          : "on";
      div.className = `slot ${cls}`;
      div.title = `${String(s.hour).padStart(2, "0")}:00 · ${periodLabel(plan, s.key)}`;
      if (s.hour === parts.hour) div.setAttribute("aria-current", "true");
      timeline.appendChild(div);
    });

    const seasonKey = isWinter(parts.month) ? "winter" : "summer";
    const seasonInfo = RATES.tou[seasonKey];
    document.getElementById("schedule-copy").innerHTML = plan === "tou"
      ? `<p><strong>${seasonInfo.label}</strong></p>
         <ul>
           <li><strong>Off-peak (${RATES.tou.prices.offPeak} ¢):</strong> ${seasonInfo.offPeak}</li>
           <li><strong>Mid-peak (${RATES.tou.prices.midPeak} ¢):</strong> ${seasonInfo.midPeak}</li>
           <li><strong>On-peak (${RATES.tou.prices.onPeak} ¢):</strong> ${seasonInfo.onPeak}</li>
         </ul>`
      : `<p><strong>Ultra-Low Overnight (same all year)</strong></p>
         <ul>
           <li><strong>Ultra-low (${RATES.ulo.prices.ultraLow} ¢):</strong> ${RATES.ulo.windows.ultraLow}</li>
           <li><strong>Weekend off-peak (${RATES.ulo.prices.weekendOffPeak} ¢):</strong> ${RATES.ulo.windows.weekendOffPeak}</li>
           <li><strong>Mid-peak (${RATES.ulo.prices.midPeak} ¢):</strong> ${RATES.ulo.windows.midPeak}</li>
           <li><strong>On-peak (${RATES.ulo.prices.onPeak} ¢):</strong> ${RATES.ulo.windows.onPeak}</li>
         </ul>`;
  }

  function fillAppliances() {
    const sel = document.getElementById("appliance");
    sel.innerHTML = "";
    RATES.appliances.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = `${a.label} (~${a.kwh} kWh)`;
      sel.appendChild(opt);
    });
  }

  function estimate() {
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const applianceId = document.getElementById("appliance").value;
    const appliance = RATES.appliances.find((a) => a.id === applianceId);
    const times = Number(document.getElementById("times").value) || 0;
    const fromKey = document.getElementById("from-period").value;
    const toKey = document.getElementById("to-period").value;
    const kwh = appliance.kwh * times;

    const before = costCents(kwh, plan, fromKey);
    const after = costCents(kwh, plan, toKey);
    const saved = before - after;

    const el = document.getElementById("estimate");
    const monthlyBefore = before * 4; // rough 4 weeks
    const monthlyAfter = after * 4;
    const monthlySaved = monthlyBefore - monthlyAfter;

    el.innerHTML = `
      <p><strong>${appliance.label}</strong> · ${times} time${times === 1 ? "" : "s"} / week · ${kwh.toFixed(1)} kWh / week</p>
      <p>${appliance.note}</p>
      <p>If you run it during <strong>${periodLabel(plan, fromKey)}</strong>:
         <strong>${moneyFromCents(before)}</strong> / week
         (~${moneyFromCents(monthlyBefore)} / month).</p>
      <p>If you shift it to <strong>${periodLabel(plan, toKey)}</strong>:
         <strong>${moneyFromCents(after)}</strong> / week
         (~${moneyFromCents(monthlyAfter)} / month).</p>
      <p class="save">${saved >= 0 ? "You save" : "This costs more"}
         ${moneyFromCents(Math.abs(saved))} / week
         (~${moneyFromCents(Math.abs(monthlySaved))} / month).</p>
      <p class="meta">Commodity energy only (¢/kWh from OEB). Delivery, regulatory and HST charges on a real bill are not included.</p>
    `;

    // Environmental framing: rough Ontario grid intensity ~30 g CO2e/kWh is low;
    // shifting demand still reduces peaker plant use. We avoid inventing a number.
    document.getElementById("impact").innerHTML = `
      <p>Shifting flexible loads off the on-peak window lowers demand when the grid is busiest.
      That is the environmental win this tool targets: less strain at peak, and less need for
      peaking generation, using only published OEB time-of-use prices so a household can act today.</p>
    `;
  }

  function syncPeriodOptions() {
    const plan = document.querySelector('input[name="plan"]:checked').value;
    const keys =
      plan === "tou"
        ? ["offPeak", "midPeak", "onPeak"]
        : ["ultraLow", "weekendOffPeak", "midPeak", "onPeak"];
    ["from-period", "to-period"].forEach((id, idx) => {
      const sel = document.getElementById(id);
      const prev = sel.value;
      sel.innerHTML = "";
      keys.forEach((k) => {
        const opt = document.createElement("option");
        opt.value = k;
        opt.textContent = `${periodLabel(plan, k)} (${price(plan, k).toFixed(1)} ¢)`;
        sel.appendChild(opt);
      });
      if (keys.includes(prev)) sel.value = prev;
      else sel.value = idx === 0 ? (plan === "tou" ? "onPeak" : "onPeak") : (plan === "tou" ? "offPeak" : "ultraLow");
    });
  }

  function renderHolidays() {
    const ul = document.getElementById("holidays");
    ul.innerHTML = "";
    RATES.holidays2026.forEach((h) => {
      const li = document.createElement("li");
      li.textContent = `${h.date}: ${h.name}`;
      ul.appendChild(li);
    });
  }

  async function init() {
    const res = await fetch("data/rates.json");
    if (!res.ok) throw new Error("Could not load rates.json");
    RATES = await res.json();
    document.getElementById("source-note").textContent =
      `Rates retrieved ${RATES.source.retrievedEt} ET from ${RATES.source.name}.`;
    fillAppliances();
    syncPeriodOptions();
    renderHolidays();
    renderNow();
    estimate();
    document.querySelectorAll('input[name="plan"]').forEach((el) =>
      el.addEventListener("change", () => {
        syncPeriodOptions();
        renderNow();
        estimate();
      })
    );
    ["appliance", "times", "from-period", "to-period"].forEach((id) =>
      document.getElementById(id).addEventListener("change", estimate)
    );
    document.getElementById("times").addEventListener("input", estimate);
    setInterval(renderNow, 60 * 1000);
  }

  // Expose for tests
  window.TOUSaver = {
    torontoParts,
    isWinter,
    isHoliday,
    touPeriod,
    uloPeriod,
    costCents,
    setRates(r) { RATES = r; },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init().catch(showErr));
  } else {
    init().catch(showErr);
  }

  function showErr(err) {
    const el = document.getElementById("estimate");
    if (el) el.innerHTML = `<div class="alert" role="alert">Could not start the app: ${err.message}</div>`;
    console.error(err);
  }
})();
