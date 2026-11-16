# TOU Saver

Shift flexible household electricity use out of Ontario's on-peak hours, and see what it saves.

Live: https://alenzacodes.github.io/tou-saver/

TOU Saver is a small static web app built by John Khan in Toronto, Ontario for Green Shift Hacks. It shows the current Time-of-Use (TOU) or Ultra-Low Overnight (ULO) price period in Toronto time, draws today's hour by hour price strip, and works out the weekly, monthly and yearly saving when you move a dryer, dishwasher, washer, water heater or EV charge to a cheaper period. It also shows how many kWh a year that habit takes out of the on-peak window.

## Why it exists

Ontario households already pay different prices by time of day, but the periods change between winter and summer, and ULO adds a very cheap overnight window and a very expensive late afternoon one. On-peak hours are when the grid is busiest, and Ontario's grid operator (IESO) says natural gas plants are among the flexible generators called on to meet peak demand. Moving a load is free, needs no new hardware, and the price signal tells you when.

## Features

- Right now badge for TOU or ULO in Toronto time, refreshed every minute
- 24 hour price strip for today, with a text version for screen readers
- Winter and summer period wording from the Ontario Energy Board
- Shift calculator: appliance, power in watts, hours a run, runs a week, from and to period
- Weekly, monthly and yearly saving, plus kWh moved out of on-peak a year
- OEB holiday list; the app says so when a year's holiday list is not in the data yet
- Keyboard friendly, skip link, live regions, no accounts, no tracking

## Data and checks

| Figure | Value | Source |
|---|---|---|
| TOU prices, November 1, 2026 | 9.1, 14.6, 18.9 ¢/kWh | [OEB electricity rates](https://www.oeb.ca/consumer-information-and-protection/electricity-rates) |
| ULO prices, November 1, 2026 | 3.7, 9.1, 14.6, 37.7 ¢/kWh | same page |
| Tiered prices | 11.2 and 13.2 ¢/kWh | same page |
| 2026 holidays | 10 pricing days, Boxing Day on Monday Dec 28 | [OEB holiday schedule](https://www.oeb.ca/consumer-information-and-protection/electricity-rates/holiday-schedule-time-use-and-ultra-low) |
| Appliance power | dryer 5,000 W, washer 500 W, dishwasher 1,300 W, water heater 3,500 W | [Utilities Kingston appliance chart](https://utilitieskingston.com/web/html/Appliances) (credits Toronto Hydro) |
| EV Level 2 | 7.2 kW (240 V at 30 A) | worked out from volts times amps |
| Peak generation | gas plants among flexible peak generators | [IESO supply mix](https://www.ieso.ca/Learn/Ontario-Electricity-Grid/Supply-Mix-and-Generation) |

All values were checked against those pages on November 14, 2026. Run times are user inputs, not measurements. Delivery, regulatory charges and HST are not included.

## Run locally

```
python3 -m http.server 8080
```

Then open http://localhost:8080/.

## Tests

```
for t in tests/*.mjs; do node "$t"; done
```

`tests/test_logic.mjs` loads the real `logic.js` and checks the Toronto clock, every TOU and ULO boundary in winter and summer, weekends, holidays, and the savings math. `tests/test_periods.mjs` checks the data file against the OEB wording. GitHub Actions runs both on every push.

## Project structure

```text
tou-saver/
├── .github/
│   └── workflows/        # CI workflows (1 file)
├── data/                 # Prices, periods, holidays and appliance defaults with sources
│   └── rates.json
├── tests/                # Automated tests
│   ├── test_logic.mjs
│   └── test_periods.mjs
├── app.js                # Page wiring
├── DEMO-SCRIPT.md        # Demo video script
├── DEVPOST.md            # Submission write-up
├── index.html            # Page markup
├── LICENSE               # Licence
├── logic.js              # Period and savings logic, shared by the page and the tests
├── README.md             # This file
└── styles.css            # Styles
```

## License

MIT. See `LICENSE`.
