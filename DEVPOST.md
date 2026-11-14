## Inspiration
Ontario already prices household electricity by the clock, so the cheapest way to cut a bill is also one of the simplest ways to ease the grid: run the big loads later. In practice almost nobody remembers when on-peak is. The periods flip between winter and summer, holidays change the rules, and the Ultra-Low Overnight plan has a 37.7 cent on-peak hour that can wipe out its 3.7 cent overnight bargain. I wanted one screen that answers "what period is it right now in Toronto" and "what do I gain by moving this chore", using only the published prices.

## The problem and who it is for
The users are Ontario households on Time-of-Use or Ultra-Low Overnight prices, renters and owners alike, who have a dryer, dishwasher, electric water heater or an EV charger they could run at a different time. The problem is not a lack of willingness. It is that the schedule is hard to keep in your head and the payoff of one change is invisible.

## What it does
TOU Saver shows a live badge for the current price period in Toronto time, a 24 hour strip of today's periods, and the published period wording for the season. Pick an appliance, adjust its power and run time to match the label, set how often you run it, and choose the period you use now and the one you could move to. The page shows the cost before and after per week, the saving per week, month and year, and the number of kWh a year that habit takes out of the on-peak window. It also lists the OEB holiday pricing days and says clearly when a year's holiday list is not in the data yet.

Two examples at the prices set for November 1, 2026: a 5,000 W dryer run for an hour three times a week, moved from on-peak to off-peak on Time-of-Use, saves about $76 a year and moves 780 kWh a year out of on-peak. A Level 2 EV charge of 14.4 kWh three times a week, moved from on-peak to ultra-low on ULO, saves about $764 a year and moves 2,246 kWh out of on-peak.

## Expected environmental benefit
On-peak hours are when Ontario uses the most power. The IESO, which runs the grid, says flexible generators such as natural gas plants are called on to meet peak demand, and Save on Energy describes gas plants as the single biggest source of air emissions on the Ontario grid. Every kWh moved to off-peak or overnight lowers that peak. TOU Saver turns that into a number a household can act on, kWh moved out of on-peak each year, rather than a vague tip. I do not convert it into tonnes of carbon, because the hour by hour emissions of the grid vary and I did not want to publish a figure I could not source.

## How I built it
Plain HTML, CSS and JavaScript with no build step, hosted on GitHub Pages. All prices, periods and holidays live in one JSON file copied from the Ontario Energy Board rates page and holiday schedule, with the source links shown on the page. Appliance wattages come from the Utilities Kingston appliance usage chart, which credits Toronto Hydro, and the EV default is 240 V at 30 A. The period and savings logic sits in one small module used by both the page and the tests. Node tests check every TOU and ULO boundary in winter and summer, weekends, a holiday that moved to a Monday, the Toronto clock across time zones, and the savings math. GitHub Actions runs the tests on every push.

## Tools used
HTML, CSS, JavaScript, Node.js for tests, GitHub Pages and GitHub Actions. Data: Ontario Energy Board, IESO, Save on Energy and Utilities Kingston public pages.

## Challenges I ran into
Getting the clock right. The page has to read the time in Toronto no matter where the visitor is, and the winter and summer windows swap mid-peak and on-peak. Holidays were the other trap: Boxing Day 2026 falls on a Saturday, so the holiday price moves to Monday December 28, and the 2027 list is not published yet, so the page now says so instead of quietly treating January 1, 2027 as a weekday. I also replaced fixed kWh guesses with a power and run time you can edit, because dryers and chargers vary a lot.

## Accomplishments that I'm proud of
Every price and window on the page matches the OEB page as checked on November 14, 2026, and the tests fail if any of them drift. The saving and the kWh moved out of on-peak update as you type. The page works on a phone and with the keyboard, and gives screen readers a text version of the hour strip.

## What I learned
The biggest lever is not a new device. It is timing a load you already run. ULO makes that lever much stronger at night and much more painful between 4 and 9 p.m. on weekdays, which surprised me when I ran the numbers.

## Limitations
The saving covers the electricity price line only. Delivery, regulatory charges and HST are not included, and some utilities bill differently. Appliance power is a starting value from a published chart, not a meter reading. A load that runs across two periods is priced at the period you choose. Holidays are only marked for years the OEB has posted.

## What's next
A weekly plan you can print, reminders, a side by side month on TOU and ULO for your own loads, and the 2027 holiday list as soon as the OEB posts it.

## Note on timing
TOU Saver was built during Green Shift Hacks, between November 5 and November 14, 2026. No earlier project was reused.
