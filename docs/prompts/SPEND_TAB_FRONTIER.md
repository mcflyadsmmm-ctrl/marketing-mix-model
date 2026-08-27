# Frontier brief — Mcfly Spend tab (upload by platform, by day)

Paste this entire file into a frontier model (Claude Opus / GPT-5 / Gemini) as the **system + task**. Do not summarize it first. The model must read the live code, not invent a new product.

**Repo:** `mcflyadsmmm-ctrl/marketing-mix-model`  
**Primary surface:** `app/app/routes/app.spend.tsx` (`/app/spend`)  
**Product:** Mcfly Analytics — Shopify Admin spend desk  
**Hero:** See ad spend next to sales, day by day.

---

## 0. How good this has to be

This tab is the product. If spend does not go in, Overview is a blank ratio and the merchant churns. Treat it like Stripe Checkout, Linear issue create, or Superhuman compose: **one obvious next action, zero ambiguous dates, zero “which dropdown do I use?”**

A confused merchant is not a copy problem. It is a **control-model** problem: too many date systems, doors in the wrong order, labels that do not match what gets saved.

**Bar:** a tired media buyer, on a phone-sized Admin iframe, can put yesterday’s Meta spend and a $400 billboard on the desk in **under 30 seconds, first click saves, names survive**. Then they can paste a Meta Ads Manager CSV without reading a tutorial.

If you would not ship this as the only screen in a $39/mo app, it is not done.

---

## 1. Job to be done (merchant words)

> “I know what I spent. Shopify already knows what I sold. I need those two numbers on the same days.”

Mental model that must be true after one save:

- Spend lives **by calendar day, in the shop timezone**.
- Each day × channel is one cell. Empty cell = **$0**, never “missing so we skip it.”
- A monthly retainer is **the same dollars, spread evenly across the days in that month** — not a spike on invoice day.
- Billboard / radio / “the agency” is a **named channel**, not dumped into unlabeled Other.
- We never ask them to OAuth Meta or Google. CSV or typing is the product, not a fallback.

---

## 2. Product locks (do not reopen)

- Desk views: **Sample data | Live data** only. Never Practice / Free / Pro as a view.
- One plan: 7-day trial then $39/store/mo. **No feature gate** on channels, LTV, or Goals.
- No pixels, MTA, path credit, “true ROAS,” Triple Whale clones.
- No Meta/Google Ads OAuth. Optional merchant-paid pipes (e.g. SyncWith) may produce a CSV they upload here.
- History: **Jan 1 of (year − 5) through today**. Date slicers change the *view*, not the stored window.
- Plan picker, if shown, opens in the **top** Admin window (`_top`). Never iframe Admin.
- Confirm line must echo the **name they typed** (Billboard stays Billboard).
- Every submit control is a **native `<button>` or `<a>`** with `.mcfly-spend-submit` (`min-height: 2.75rem`). Never `<s-button>` as the save host — 2026-08-26 Admin smoke: web component host was 0×0, first click missed.

---

## 3. Current code (read these first)

| File | Why |
| --- | --- |
| `app/app/routes/app.spend.tsx` | The whole tab (~2.2k lines). Three doors, type-it form, CSV, coverage, explorer. |
| `app/app/lib/spend-doors.ts` | Door copy + hrefs. **Order here ≠ DOM order.** |
| `app/app/lib/spend-period-allocate.ts` | Lump → daily rows. **Week = 7 days from the chosen date, not a calendar week.** |
| `app/app/lib/spend-template-range.ts` | Template `from`/`to`/`span=30d\|90d\|ytd\|12m`. Closed days through **yesterday**. |
| `app/app/lib/spend-csv.ts` | Long / wide / Ads Manager parse. Same day+channel **replaces**. |
| `app/app/lib/spend-channel-label.ts` | Named extras vs Other. |
| `app/app/lib/spend-confirm-copy.ts` | “Meta $400 for 2026-08-25.” |
| `app/app/lib/spend-day-entry.ts` | One-day vs period lump. |
| `app/app/lib/spend-custom-channel.ts` | Typed extras + presets (Billboards, etc.). |
| `app/app/lib/spend-export-guides.ts` | Platform catalog + featured: Meta, Google, TikTok, Microsoft, Amazon, Email. |
| `app/app/components/PeriodControl.tsx` | Explorer slicer: **MTD / Last month / QTD / YTD / Last 12 months** — a *third* date language. |
| `app/app/components/SpendExplorer.tsx` | Day/Week/Month/Quarter chart on this tab. |
| `app/app/lib/easy-add-spend-tab.test.ts` | Locks door order, native submits, first-session copy. |
| `app/app/styles/mcfly-desk.css` | `.mcfly-spend-*` layout. |

Also read tests next to those libs. Do not “simplify” by deleting parse coverage.

---

## 4. Why people get confused today (fix these, don’t add a fourth door)

### 4.1 Three date languages on one page

1. **Type-it:** Day / Week / Month / Quarter / Half-year / Year. Week ≠ calendar week. Month uses a month picker; day/week uses a date picker. Defaults: period **day**, date **yesterday**, channel **Meta**.
2. **Template:** `span` 30d / 90d / YTD / 12m **or** `from`/`to`. Primary “Download this template” **does not pass a span** — only the missing-days link uses coverage `from`/`to` (90-day strip).
3. **Explorer:** MTD / LM / QTD / YTD / Last 12 months, plus its own Day/Week/Month/Quarter grain.

A merchant cannot tell whether “Week” means last 7 days, this calendar week, or the explorer grain. **Unify the vocabulary.** One glossary, reused everywhere.

### 4.2 Doors numbered in a different order than they appear

`SPEND_DOORS` = 1 Type it, 2 CSV, 3 Pick channels.  
DOM (and `easy-add-spend-tab.test.ts`) = Pick channels → Type it → CSV.

First session: they read “start here” on Type it, then land on a wall of checkboxes. **Pick one order. Make nav, DOM, tests, and hints identical.**

Recommended default (optimize, then prove with a 5-person think-aloud — do not ship two orders):

- **Empty desk:** Type it first (yesterday’s invoice). Channel checkboxes are a *preference for templates*, not a gate to typing.
- **Returning desk with Ads Manager files:** CSV first.
- Progressive disclosure: show one primary door; the other two as secondary, not three equal panels.

### 4.3 Channel pickers twice

Platform checkboxes (localStorage) plus Type-it `<select>` plus “Something else…” plus preset chips plus “type another.” Same Billboard in two places. **One channel model.** Type-it should reuse the channels they already checked, with “another…” always one field away.

### 4.4 The save button speaks daily rate, not the action

Primary CTA: `That’s $X per day.` That is a preview, not a verb. People hesitate. Preview belongs **above** the button. Button: **Save $400 on Billboard for Aug 26** (or “Save $2,400 across July (31 days)”).

### 4.5 Helper paragraph is a manifesto

The `mcfly-spend-helper` block explains OAuth failure modes, SyncWith, unattributed spend, and the Meta+billboard homework in one wall. **One sentence on the page.** Move religion to a “Why we don’t connect ads accounts” disclosure.

### 4.6 Template date range is invisible

Engine supports 30d/90d/YTD/12m/`from`/`to`. The proud download ignores it. Merchants download a short blank, think history is 14 days, and never backfill.

### 4.7 Week semantics are a trap

`periodWindow("week")` = chosen date + 6 days. Label it **“7 days starting this date”** or change it to **shop-locale calendar week** and update tests. Silent 7-day windows will be reported as bugs forever.

---

## 5. Target information architecture

One column, one question at a time. Shopify Admin iframe (~660–900px). Polar-ish, not a marketing landing.

```
[ Sample data | Live data ]     (existing desk chrome — do not invent modes)

Spend
  One line: Shopify sales are already here. Add what you spent.

  ┌─ Add spend ─────────────────────────────────────────┐
  │  Channel     [ Meta Ads ▼ ]  [ Billboard ] [ + ]    │
  │  Amount      [ 400         ]  USD (shop)            │
  │  When        ( Day | 7 days | Month | Custom )      │
  │              date/month/range control for that When │
  │  Preview     Billboard $400 for 2026-08-26          │
  │              → $400.00 that day                     │
  │              [ Save Billboard $400 for Aug 26 ]     │
  └─────────────────────────────────────────────────────┘

  ┌─ Or paste a file ───────────────────────────────────┐
  │  Drop Ads Manager CSV or paste Day, Amount spent    │
  │  We detect platform; ask only if ambiguous          │
  └─────────────────────────────────────────────────────┘

  ┌─ Fill many days ────────────────────────────────────┐
  │  Channels: chips they already use                   │
  │  Dates:  Last 30 | 90 | YTD | 12 months | Custom    │
  │  [ Download blank CSV ]   same range as preview     │
  └─────────────────────────────────────────────────────┘

  Coverage: 61 / 90 days have spend · empty = $0
  Explorer: same When-language as Add spend (no third dialect)
```

Do not ship a separate “calculators” block on this tab unless it is behind a clearly named disclosure. First-session cognitive budget is for **getting dollars in**.

---

## 6. Date and selector spec (this is the actual work)

### 6.1 One When model

Canonical `When`:

| Id | Merchant label | Window | Control |
| --- | --- | --- | --- |
| `day` | One day | That local calendar day | `<input type="date">`, default **yesterday**, max today, min history floor |
| `days7` | 7 days | Inclusive 7 local days **starting** the chosen date (keep current math) **or** ending on chosen date — **pick one, label it in the control** | date + live “Aug 20–Aug 26” |
| `month` | Calendar month | 1st–last of that month | `<input type="month">` |
| `quarter` | Calendar quarter | Q containing the month | month picker + “Q3 2026 · Jul 1–Sep 30” |
| `half` | Half year | H1 Jan–Jun / H2 Jul–Dec | month picker + range text |
| `year` | Calendar year | Jan 1–Dec 31 | year or month picker + range text |
| `custom` | Custom range | Inclusive `from`→`to` | two dates, `to` ≥ `from`, clamped to floor…today |

**Forbidden:** unlabeled “Week.” **Forbidden:** a second set of chips that mean something else (MTD vs Month).

Explorer `PeriodControl` must **map onto this model** (MTD = current calendar month through today; Last month = previous calendar month; etc.) or be replaced by the same When chips. Do not leave MTD/QTD as a secret dialect.

Template spans map:

- Last 30 / 90 = closed days through **yesterday** (already in `spend-template-range.ts`)
- YTD / 12 months = same
- Custom = `from`/`to`

**Today vs yesterday:** typing **today** is allowed (in-progress day). Blank templates stay **through yesterday** unless the merchant explicitly includes today. Show that rule once, next to the template dates: “Blanks are complete days (through yesterday).”

### 6.2 Preview is mandatory before save

Always show, in shop timezone, before the button enables:

1. Channel **display name** (Billboard, not other)
2. Total amount
3. Inclusive start → end
4. Day count
5. Per-day amount (cents remainder on last day — already implemented)
6. What happens to existing cells: **same day + channel replaces**

Button disabled until amount > 0 and window valid. Native submit, min 44×44 CSS px.

### 6.3 Dropdowns / selects

- **Channel:** grouped list — Paid platforms, Email/SMS, Affiliate, Named extras, “Something else.” Typeahead if the list stays long. Disabled options are a smell; entitlements currently allow all channels — don’t show locked rows.
- **When:** segmented control, not a 6-item `<select>` if you can use 4 visible segments + “More.”
- **Date:** native `date`/`month` (mobile + Admin). Do not invent a custom calendar unless native min/max/floor cannot be met.
- **CSV force-channel:** only when parse is single-column / ambiguous. Don’t show it by default.

Every `<select>` needs a visible label, not placeholder-as-label. Options use merchant words (“Meta Ads”) not slugs (`meta`).

### 6.4 Keyboard and first click

- Tab order: Channel → Amount → When → Date → Save.
- Enter in amount or date submits if preview is valid.
- First click on Save **must** submit (regression: `easy-add-spend-tab.test.ts` native control + hit box).
- Do not wrap Save in Shopify `s-button` / App Bridge components.

---

## 7. CSV door (second path, same quality)

Accept, without a tutorial:

- Long: `date,channel,amount`
- Wide: `Date,Meta Ads,Google Ads,…`
- Meta/Google/TikTok Ads Manager: `Day` + `Amount spent` (and currency variants you already parse)

On drop/paste:

1. Parse immediately (existing `parseSpendCsv`).
2. Show **N days, channels named, $ total, date range**, plus first error group (`groupCsvErrors`).
3. If one-platform file, optional “This is Meta” confirm — don’t make them pick if the filename/headers already say Meta.
4. Same-day replace: explicit confirm only when overwriting **non-zero** cells.

Copy: “Export daily spend from Ads Manager. We need Day and Amount spent. Campaign columns are ignored.”

Do not resurrect nested `<details>` around CSV.

---

## 8. Template door (history, not a gate)

- Channel chips = the same set as Type-it.
- Date chips = Last 30 / 90 / YTD / 12 months / Custom, **wired into the download URL** (`span` or `from`/`to`).
- Preview table: Date + those columns, 2 example rows.
- CTA: **Download Meta + Billboard, last 90 days**. Disabled until ≥1 channel.
- Missing-day download uses the **same** range as the chips, not a silent 90-day coverage strip.

---

## 9. After save (trust)

- Banner: `spendConfirmLine` with **typed name**.
- Coverage strip: filled vs empty; empty = $0.
- Recent rows: channel name, amount, range, not engine slugs.
- Explorer updates to the window they just saved (already partly true when history was empty).

---

## 10. Visual / craft bar

- Polar-density, not dashboard soup. One primary button per door.
- Coverage and explorer **below** entry, never competing for the first screen.
- No marketing-site chrome. No “Pro,” “Practice,” “connect ads.”
- Named extras keep color/identity in the mix (Overview already does this — don’t regress).
- Admin iframe: no horizontal scroll on the type-it grid; stack fields before overlapping.

Study (then do **not** clone pixels): how Linear new-issue, Stripe invoice line items, and Notion date properties make **one date mean one thing**. This tab should feel that obvious.

---

## 11. Implementation rules

- Imports at top of file. Exhaustive `switch` with `never` on `When` / period unions.
- Keep `planLumpSpread` / CSV parsers / template range math unless you replace them with tested equivalents.
- Update `easy-add-spend-tab.test.ts`, `spend-doors.ts`, `spend-period-allocate` tests, `spend-confirm-copy`, channel-label tests together so they cannot drift.
- Do not feature-gate channels. Do not add OAuth. Do not add a fourth desk mode.
- Native submits only.
- After UI changes, verify in a browser (or Playwright against the spend form): type Billboard $400 one day → first click saves → confirm line says Billboard.

---

## 12. Process for you (the model)

1. Read the files in §3. Quote the current door order, When controls, and template href in your plan.
2. Propose **one** When glossary and **one** door order. Call out every test you will change.
3. Implement Type-it + When unification first (highest friction). Then template URL chips. Then CSV copy/confirm. Then explorer labels.
4. Do not rewrite Overview, billing, or listing copy in the same PR.
5. Ship tests that fail if: doors reorder vs nav, Save is `<s-button>`, Billboard becomes Other, week window is unlabeled, template download omits the selected span.

---

## 13. Definition of done

- [ ] One date language on Spend (type-it, template, explorer).
- [ ] Door order matches the numbered list.
- [ ] Save button states the action + name + dates; preview shows $/day separately.
- [ ] Billboard typed once, saved as Billboard everywhere.
- [ ] Template download range is chosen in the UI and present in the URL.
- [ ] CSV paste/drop still parses Ads Manager + long + wide.
- [ ] Empty days remain $0. History floor unchanged.
- [ ] Native save hit target. No new Free/Pro/Practice strings.
- [ ] A new user can add yesterday Meta + a named billboard without reading the helper paragraph.

If anything in §13 is ambiguous, **change the UI**, not the merchant.
