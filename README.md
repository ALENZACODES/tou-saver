# TOU Saver

Shift flexible household electricity use off Ontario’s on-peak window.

TOU Saver is a small static web app. It shows the current Time-of-Use or Ultra-Low Overnight period in America/Toronto time, draws today’s price timeline, and estimates weekly and monthly savings when you move laundry, dishes, or an EV charge to a cheaper period.

Built for Green Shift Hacks (solo entry by John Khan).

## Why it exists

Ontario households pay different commodity prices by time of day. Moving a dryer or charger off the on-peak window lowers the bill and eases demand when the grid is busiest. The environmental win is less strain at peak, using prices people already see on their bill.

## Features

- Live “right now” badge for TOU or ULO
- 24-hour colour timeline for today
- Winter and summer window copy from the Ontario Energy Board
- Appliance shift calculator with week and month estimates
- 2026 OEB holiday list (off-peak all day on TOU)
- Mobile-friendly layout, keyboard focus styles, skip link, ARIA live regions
- No accounts, no tracking, no invented rates

## Run locally

Any static server works. From this folder:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

Or open `index.html` directly in a modern browser (fetch of `data/rates.json` needs a local server in some browsers).

## Tests

```bash
node tests/test_periods.mjs
```

Checks published prices, holiday list presence, winter/summer/holiday period logic, and that shifting off peak reduces cost.

## Data sources

- [Ontario Energy Board electricity rates](https://www.oeb.ca/consumer-information-and-protection/electricity-rates) (TOU, ULO, Tiered ¢/kWh and season windows)
- [OEB holiday schedule for TOU and ULO](https://www.oeb.ca/consumer-information-and-protection/electricity-rates/holiday-schedule-time-use-and-ultra-low) (2026 dates embedded in `data/rates.json`)

Rates were retrieved 2026-11-05 America/Toronto. Appliance kWh values are labelled planning estimates, not meter readings. Delivery, regulatory charges and HST are not included.

## Stack

HTML, CSS and vanilla JavaScript. No build step. Penn Blue `#011F5B` and Penn Red `#990000` on white.

## License

MIT. See `LICENSE`.
