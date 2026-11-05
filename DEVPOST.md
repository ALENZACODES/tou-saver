# Devpost copy · TOU Saver · Green Shift Hacks

## Tagline
See Ontario’s TOU windows and shift laundry or charging off peak.

## Inspiration
My power bill already prices electricity by the clock. The hard part is remembering when on-peak is, especially when winter and summer windows swap. I wanted a one-screen tool that uses the official Ontario Energy Board prices, shows “right now” in Toronto time, and turns a chore into a dollar and cents saving so people actually move the load.

## What it does
TOU Saver loads published TOU and Ultra-Low Overnight prices, highlights the current period, draws a 24-hour timeline for today, lists 2026 OEB holidays, and estimates weekly and monthly savings when you shift an appliance from one period to another. It stays on commodity ¢/kWh only and says so, so nobody confuses it with a full bill.

## How we built it
Static HTML, CSS and JavaScript. Rates and holidays live in `data/rates.json` copied from the OEB rates page and holiday schedule. Period logic follows the published winter and summer windows. Small Node tests lock the prices and the clock rules. Visual style uses Penn Blue and Penn Red on white.

## Challenges we ran into
Keeping summer and winter windows straight without inventing a number. Making the saving feel real while refusing to guess delivery charges. Building something a judge can open on a phone without an account.

## Accomplishments that we're proud of
A working calculator on real public data. Clear “right now” feedback. Tests that fail if the holiday list or prices drift. Accessible controls with a skip link and live regions.

## What we learned
Demand shifting is an environmental action people can take today without new hardware. Publishing the source URL next to the number matters more than a fancy chart.

## What's next
Add a printable weekly plan, optional reminders, and a side-by-side TOU vs ULO month sketch using the same published prices. Pull holidays for 2027 when OEB posts them.

## Built with
HTML, CSS, JavaScript, Ontario Energy Board open consumer rate pages

## Try it
Local: `python3 -m http.server 8080` in the repo root, then open the site.
