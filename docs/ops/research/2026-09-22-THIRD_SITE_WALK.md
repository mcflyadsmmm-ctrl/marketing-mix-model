# Third-party site walk — merchant + App Store reviewer

**Scout:** third-desk-truth (site, not desk jobs)  
**Date:** 2026-09-22 · probes 22:13Z–22:37Z UTC  
**Branch:** `cursor/third-desk-truth-5bc6`  
**Role:** Shopify App Store reviewer + skeptical DTC operator. Not a teammate. Stop assuming the app or niche is perfected.  
**Apex only:** https://mcflyads.com (never `*.pages.dev`) · Fly https://mcfly-analytics.fly.dev · listing https://apps.shopify.com/mcfly-analytics-public  

**Version churn while walking (do not pretend this is still v36):**

| When (UTC) | What |
| --- | --- |
| 22:13 | Apex `mcfly-version` **v36** · Direct Upload story `8ddad52e` · Fly `/health` 200 · home stills `$19,023` / `$68,457` / `3.60×` |
| 22:28–22:33 | Screenshots. Chrome.js already commented **v38**. `/demo` iframe is Fly SAMPLE, calendar-live. |
| 22:35 | Apex **v38** |
| 22:37 | Apex **v39** · Fly `/` also v39 · product H1 `Median ticket. Not Shopify AOV.` |

Parent PR **#191** was the v36 harvest. This note is leftover P0s **still live on v39**, ranked for that parent — not a second uniqueness cook.

Evidence PNGs: [`third-site-walk/`](./third-site-walk/).

Walked as a merchant: Home, Demo (iframe + `?tab=orders`), Pricing, Product, FAQ, About, Support. Phone **390** and desktop **1280**. Clicked Install (lands on listing). Opened Slack paste HTML. Opened comparison table HTML. Opened `/demo` iframe and Fly `/demo/spend`. Read listing card and stills. Compared Polar / Lifetimely / Triple Whale / TrueProfit / RCI / Better Reports **listings** (public “from” prices, not quotes).

---

## Verdict in one paragraph

A merchant who starts on **mcflyads.com** sees an honest, slightly awkward paper/sky sales-first page with **Reviews 0** in the fold and a locked H1 that still holds. The moment they click **Install** or **Try the demo**, the story splits into three SAMPLE books and a spend-first App Store card. Polar’s site looks like a company. Lifetimely’s site looks like a product with a named agent and Slack answers. Mcfly looks like a founder iterating HTML every twenty minutes (v36→v39 during this walk) while the listing still sells **Total ROAS 4.45× on $10.6M sales** and the demo banner says **Live is parked until launch**. That is not a niche-owned site. It is a listing/site/desk disagreement with SAMPLE numbers used as if they were one client.

---

## v36 items already cooked — do not re-file

Confirmed still true on apex v39 unless noted:

| Claimed v36 cook | Still live? |
| --- | --- |
| All-or-nothing Admin leftover killed | Gone from home/FAQ |
| ShopifyQL returning sales $ named | Yes — named as native capability, not a Mcfly hole |
| TrueProfit from $35 named | Yes |
| TW Free / $219 / $749 named | Yes |
| COGS FAQ | Yes (`Do I have to enter COGS before I see numbers?`) |
| `og-cash-mer.jpg` 301 → `og-analytics.jpg` | Yes (22:13Z) |
| `/lab` 301 home | Yes. `lab.html` 308 → `/lab` → `/` |
| Locked home H1 intact | **Yes:** `Deeper Shopify numbers Analytics does not show.` |
| SAMPLE Snowdevil `$19,023` / `$68,457` / `3.60×` on `/` | Yes on **home stills only** |
| No Harbor / Northline `$98,500` on `/` | Yes on `/` |

v36 leftovers that **v38/v39 already killed** (were live at 22:13, dead at 22:37 — do not re-file):

- Home table **TrueProfit listing 5.0 (880)** — live TrueProfit is **4.9 (898)**. v39 table now says 4.9 (898).
- Lifetimely named only as **$149 at 3,000 orders** — live listing is **Free / $49 / $149 / $299**. v39 table now names the ladder.

Still dirty **by design** until Marty (not an HTML cook on #191):

- App Store listing spend-first
- Reviews **0.0 (0 Reviews)**
- Live parked (`fly.toml` still `MCFLY_SAMPLE_ONLY=true`, `MCFLY_LIVE_STAGE=parked`)
- Partner Save **#192** not done

---

## What a merchant still would not trust

**The numbers move when you click.** Home fold is frozen Sep 1–16: typical **$631**, returning **$45,409**, weekend **23%**, this month **$68,457**, last year **$69,891**, this year **$918,649**. `/demo` iframe (same shop name, Snowdevil SAMPLE) is calendar MTD: typical **$597**, returning **$63,127**, weekend **25%**, Shopify Total Sales **$103,993**, this year **$1,161,719**. Listing gallery is a third book: **$10,592,770 sales ÷ $2,381,427 spend = 4.45×**. Three SAMPLE truths. One brand name. That is how you get a 1-star “the demo is fake.”

**Install does not open the shop they just watched.** `/demo` and Fly `/demo` paint a yellow bar: `Live is parked until launch`. The primary button on that page is still **Install**. Listing has been live since 7 Sep 2026. “Parked until launch” + a live $39 listing is a reviewer flag and a merchant bait-and-switch.

**The listing is a different product.** Site: Overview → Orders → Customers, spend optional, empty = —. Listing title: `Ad spend next to store sales`. Tagline: `See every ad dollar next to Sales.` Body: cash desk, Allocation, `ad platform overlap`, `Cash Acquisition Costs`, `7/14/28 allocation`, **$39 inside a feature bullet** (4.2.3). Stills are Total ROAS, not the sales-first fold. Site footnote admits this. Clicking Install does not.

**Trial vs the YoY fold.** Chip below the fold: `90 days · Order history on trial`. Cards in the fold show last year filled in. SAMPLE is the paid-shaped book. A trial Live shop does not look like this. The 90-day chip is honest. Putting last-year **$69,891** above it is not.

**Share is a costume.** Polar: “Executive summary to Slack” as a product. Lifetimely: “ask in Slack.” Mcfly: a `<pre>` + Copy, plus desk `Copy for Slack` / `Save PNG` / `Copy YTD`. v39 paste even says `Not a Slack bot`. An agency still does not get a channel. The home paste is the frozen Sep 1–16 briefing, so the thing they copy still does not match the iframe they opened.

**Support looks like a side project.** Lede: `Stuck on spend, Total ROAS, or billing?` Inbox: `mcflyadsmmm@gmail.com` plus `invites@mcflyads.com`. Scope line still teaches `read_all_orders` as “deeper history” while the marketing site sells a 90-day trial book. Polar’s listing is Paris + 117 reviews. This listing is West Jordan, UT **94084** (that ZIP is California) and 0 reviews.

---

## What still looks unfinished vs Polar / Lifetimely / TW marketing sites

| Surface | Polar / Lifetimely / TW | Mcfly v39 apex |
| --- | --- | --- |
| First fold | Polar: named job + social proof (4,000+ brands, 4.9). Lifetimely: Profit Agent + named operators. | Honest HTML desk mock + **Reviews 0**. Better than fake stars. Worse than a company. |
| Demo | Polar: “instant demo, no signup.” | Instant SAMPLE iframe — good. Then **Live parked** + numbers ≠ home stills. |
| Pricing | Lifetimely: screenshotable plan card in the fold, order ladder. | CFO card in the first fold on `/pricing` is the closest thing to their craft. Phone 390 of that card is actually fine. |
| Share | Polar Slack / n8n / Gmail. Lifetimely Slack Q&A. | Copy/PNG. Framed like Polar’s digest. |
| Listing | Same story as the site. | Spend-first card, sales-first site. |
| Support | Domain, team, reviews. | Personal Gmail, dual alias, spend-first lede. |
| Version | Quiet. | v36→v39 in ~25 minutes during a review. Feels unfinished because it is being rewritten under the merchant. |

Phone 390: kicker wraps to `SPEND` then `OPTIONAL` on its own line. Demo pills wrap Settings onto a second row. Comparison table never enters the first 390×1200 viewport — a roundup screenshot of “the Polar table” is a desktop-only job. Headless `#where-sits` / `#paste-slack` also did not scroll those sections into view (hash is not the merchant path; scroll is).

---

## Share job — copy/PNG vs Slack bot

**What exists (honest):**

- Home `#paste-slack`: `Copy` on a frozen Sep 1–16 briefing. v39: `Copy this for Slack, WhatsApp, or email` · `Not a Slack bot` · `Mcfly never posts`.
- Product: `A paste for Slack or WhatsApp. A paste for the books. A PNG for the agency.` Mcfly never sends mail.
- Fly Overview: `Copy YTD`. Share cards: `Copy for Slack` + `Save PNG`.
- Fly Spend: `This demo does not save spend.` (on `/demo/spend`) · `Copy pair`.

**What fails:**

1. Home paste dollars are not the iframe dollars. Copying the “weekly” briefing after opening Demo is how you look like a liar in Slack.
2. Polar’s job is “it arrives in the channel.” Mcfly’s job is “you remember to paste.” Do not ship a Slack bot to fake Polar. Do not keep Polar-cosplay (`Polar would call this a weekly digest and send it`) if the next roundup screenshot is the paste card.
3. `Save PNG` lives on the desk, not on the marketing paste. `/pricing` “In the fee” claims `copy or Save PNG`. True in Admin/demo. False as a marketing-page control.

---

## SAMPLE-as-client risk

Chips are on the fold (`SAMPLE`, `not a live client`). Good. Not enough.

- Shop name **Snowdevil** is styled like a customer workspace, not “example data.”
- Listing stills show **$10.6M** Shopify Total Sales and a 4.45× gauge. SAMPLE banner on the still is readable if you squint. A reviewer skimming the gallery sees a live $10M shop.
- Home this-year **$918,649** vs demo this-year **$1,161,719** vs listing **$10,592,770**. Same wordmark. Three lives.

Do not “fix” by adding a fake testimonial. Do not put Harbor/Northline back.

---

## 0-review handling

Done well, keep:

- Fold chips: `REVIEWS 0` · `LISTING LIVE`
- FAQ: `Why are there 0 reviews?` / `We do not invent a 4.9`
- Pricing card: `0 · listing live · we do not invent a 4.9`
- Footer chrome: `reviews 0 · we do not invent a 4.9`
- Comparison table Mcfly cell: **0** next to Polar 4.9 (117) / TW 4.1 (91) / Lifetimely 4.9 (538) / TrueProfit 4.9 (898) / RCI 5.0 (14)

That table is honest and still a roundup own-goal: the screenshot a blogger crops is Polar’s stars. Do not invent Mcfly stars. Do not drop the 0.

---

## Spend-first listing leftover vs sales-first site (still live)

Listing (WebFetch + screenshot, 22:13–22:32Z):

> See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.

> Mcfly Analytics is the cash desk for that gap. … One flat plan: LTV, Goals, and Allocation sit on the same desk. … Finally you can understand ad platform overlap better.

> Flat $39 with Goals and 7/14/28 allocation — price stays put as you grow  
> Break-even Total ROAS plus Cash Acquisition Costs

Plan picker is named **Mcfly Analytics $39/month** (Pro rename looks done — do not re-file Pro). Empty-spend-as-zero and leftover-cash were **not** in the live listing body this walk (older search snippets had them; live HTML did not). Reviews 0. Stills: Total ROAS 4.45.

Site sits-note (keep):

> The live App Store card still leads with ad spend next to store sales. This site leads with Overview → Orders → Customers.

That sentence is honest. Do not HTML it away. Do not pretend Partner Save happened.

---

## 8–12 leftover P0s for parent on PR #191

HTML cooks only where the merchant path is apex HTML/JS. Listing/Fly-parked called out as **not** this cook.

### P0-1 — Click-through SAMPLE books do not match

- **URL:** https://mcflyads.com/ · https://mcflyads.com/demo · https://mcfly-analytics.fly.dev/demo
- **Quote (home still):** `Typical order $631` · `This month $68,457` · `Last year $69,891` · `Sep 1–16, 2026`
- **Quote (demo iframe):** `Typical order around $597` · `Shopify Total Sales $103,993` · `This year $1,161,719` · caption already: `It will not match the Sep 1–16 stills on Home.`
- **Cook:** Stop treating `Click for detail` / YoY cards as the desk. Either put the live SAMPLE iframe in the fold, or stamp every frozen dollar `frozen still · not the desk`. Do not invent a fourth book. Do not change locked H1.

### P0-2 — Install on a page that says Live is parked

- **URL:** https://mcflyads.com/demo (iframe) · https://mcfly-analytics.fly.dev/demo
- **Quote:** `Live is parked until launch` (amber bar, again in the Overview body)
- **Cook:** `/demo` primary CTA cannot be the same Install as “your shop tonight.” Microcopy: listing live, Admin Live parked, SAMPLE only. Do not unpark. Do not Fly-deploy from this note. Do not Partner Submit.

### P0-3 — “Leftover median” is leftover-cash language on a sales-first site

- **URL:** https://mcflyads.com/ · `/product` · `/faq`
- **Quote:** `Typical order is the leftover median.` · FAQ: `Typical order is the leftover: Shopify AOV is the mean`
- **Cook:** Kill leftover. Say median / middle order. Native AOV is the mean — that part is honest; the word leftover is not.

### P0-4 — First-fold last year vs 90-day trial chip

- **URL:** https://mcflyads.com/ (fold cards vs facts strip)
- **Quote:** `This month $68,457` / `Last year $69,891` sitting above `90 days · Order history on trial`
- **Cook:** Caption the YoY trio: SAMPLE is the paid-shaped book; trial Live last year is —. Do not paint last year as $0. Do not lengthen `LIVE_UNPAID_INGEST_DAYS`.

### P0-5 — Support still greets spend and over-promises `read_all_orders`

- **URL:** https://mcflyads.com/support
- **Quote:** `Stuck on spend, Total ROAS, or billing?` · `Approve read_orders … read_all_orders (deeper history), and minimal read_customers`
- **Cook:** Lede = Overview / typical order / billing. Scope line = what Partner actually grants + 90 vs 24. Do not silently add scopes. Do not sell deeper history as the install.

### P0-6 — Legal OG / terms still sell the cash desk + allocation

- **URL:** https://mcflyads.com/privacy · https://mcflyads.com/terms
- **Quote:** `og:description` privacy: `Total ROAS data diet` · terms: `Terms of use for Mcfly Analytics — Total ROAS desk.` · terms body: `offer rules-based allocation guidance`
- **Cook:** Match home: order desk, spend optional. Kill allocation-as-product in terms unless Spend still ships that panel as a named promise. Do not add pixels/COGS.

### P0-7 — Home paste is a Polar costume on frozen dollars

- **URL:** https://mcflyads.com/#paste-slack · https://mcflyads.com/product
- **Quote:** `Not a Slack bot. Polar would call this a weekly digest and send it.` · paste still `$68,457` / `$631` / `$45,409` Sep 1–16
- **Cook:** Keep never-posts. Drop Polar-would. Point Copy at the same clock as `/demo` or label frozen. Do not build a Slack product.

### P0-8 — Gmail as the support system vs Polar/TW

- **URL:** https://mcflyads.com/support
- **Quote:** `mcflyadsmmm@gmail.com` (primary) · `Also: invites@mcflyads.com`
- **Cook:** MX already points at Namecheap `eforward*.registrar-servers.com` (not Cloudflare — board leftover). If `invites@` forwards, lead with a domain address. Do not invent `support@` on Cloudflare MX that is not done. Do not keep a personal Gmail as the App Store-adjacent inbox if the domain alias works.

### P0-9 — About is the product H1 + staging handle

- **URL:** https://mcflyads.com/about
- **Quote:** H1 `Deeper Shopify numbers Analytics does not show.` · `Shopify App Store — mcfly-analytics-public`
- **Cook:** About H1 = firm/founder (Utah, Marty), not the locked product line. Link text `Install Mcfly Analytics`, not the `-public` slug. **Do not change locked home H1.**

### P0-10 — Listing gallery is a $10M spend-first SAMPLE (Marty stills, site must stop echoing it)

- **URL:** https://apps.shopify.com/mcfly-analytics-public
- **Quote:** still caption math `$10,592,770 sales ÷ $2,381,427 spend = 4.45×` · tagline `See every ad dollar next to Sales`
- **Cook:** Not an HTML invent-the-listing. #192 paste + recapture from Live Admin when Marty unparks. Until then, site should not deep-link Install as if the card matches Overview→Orders→Customers. Optional HTML: a literal screenshot of the live listing card with `this is the card today — spend-first`. Do not HTML-fake Partner Save.

### P0-11 — Phone 390 first fold hides the 90-day chip and the table; kicker wraps

- **URL:** https://mcflyads.com/ at 390
- **Quote (kicker wrap):** `TYPICAL ORDER · RETURNING DOLLARS · SPEND` / next line `OPTIONAL`
- **Cook:** Keep chips. Put `90 days on trial` in the first 390 viewport next to Reviews 0. Don’t squeeze the 4-column Polar+TW / Lifetimely+TP+BR table into the fold on phone — stack. Comparison table HTML is fine as a desktop roundup artifact.

### P0-12 — Product H1 dropped the board; listing bullets still name Allocation / CAC

- **URL:** https://mcflyads.com/product · listing feature bullets
- **Quote (product v39):** `Median ticket. Not Shopify AOV.` (v36 journal said product H1 stays `Median ticket. Returning dollars. One board.`)
- **Quote (listing):** `Goals and 7/14/28 allocation` · `Cash Acquisition Costs`
- **Cook:** Product H1 is not the locked home H1 — parent can restore returning dollars / one board without touching locked home H1. Listing bullets are #192. Site `/product` should not argue only against AOV while the listing argues Total ROAS.

---

## What is actually honest — do not “fix” into a lie

| Keep | Why a merchant (and a reviewer) should see it |
| --- | --- |
| Locked H1 `Deeper Shopify numbers Analytics does not show.` | Locked. Not a uniqueness lie. |
| Reviews **0** everywhere | Live listing is 0.0 (0). Polar 4.9 (117) is theirs. |
| Polar **from $750**, GMV-based. **Do not invent $1,020.** | Live Polar listing: Core from $750. |
| TW **Free / Foundation $219 / Automate $749** | Live TW listing. |
| TrueProfit **from $35** + per-order; **4.9 (898)** on v39 | Live TP listing. Do not restore 5.0 (880). |
| Lifetimely **Free / $49 / $149 / $299** on v39 | Live Lifetimely listing. Do not restore “only $149.” |
| RCI **from $59** (Growth $99, Peak $249), 5.0 (14) | Live RCI listing. Closer LTV/RFM app — keep that humility. |
| Better Reports **from $19.90** | Live BR Basic $19.90. |
| ShopifyQL **can** show returning sales $ · Reports **can** Group by weekday · Overview **can** compare a range to last year | Native is not empty. v39 “three-range YoY is packaging” is the adult sentence. |
| Empty spend is **—**, never 0× | Listing body this walk did **not** say empty=zero. Site religion holds. Do not paint 0×. |
| No pixel, no MTA, no “true ROAS,” no COGS/net-profit hero | Refusals. Do not add a pixel screenshot to look like Polar. |
| Trial **90 days** of orders · paid **up to 24 months** · **$39 stays $39 at $5M** · no Free plan | Do not “fix” trial to 24 months. Do not add a Free plan to match Lifetimely. |
| SAMPLE chips · `not a live client` · `This demo does not save spend.` | Keep. Tighten the three-book problem; don’t delete the chip. |
| Sits-note: listing still spend-first | True until Marty Save. |
| Mcfly never posts to Slack / never sends mail | True. Do not ship a bot to win a craft steal. |
| `/lab` 301, cash OG 301, Harbor/$98,500 off `/` | Stay dead. |
| Nav Install → `https://apps.shopify.com/mcfly-analytics-public` | Listing is live. Do not invent a handle. Do not put a `.myshopify.com` form on the site. |

---

## Listing leftovers for #192 (Marty) — not HTML on #191

1. Tagline + long description spend-first (`See every ad dollar next to Sales` / cash desk / overlap).
2. Feature bullets: `$39` (4.2.3), `7/14/28 allocation`, `Cash Acquisition Costs`.
3. Gallery: Total ROAS $10.6M SAMPLE, not Live Admin sales-first stills.
4. Reviews 0 — do not invent. Recapture stills after unpark.
5. Developer address `West Jordan, UT, 94084` — 94084 is not Utah. Trust/reviewer nit.
6. Handle `mcfly-analytics-public` looks like a staging app next to `polar-analytics`.
7. JSON-LD description still `Put Meta, Google, TikTok, and billboard spend next to Shopify sales.`

Plan name on the live card is **Mcfly Analytics**, not Pro. Empty-spend-as-zero **not** seen on this listing body. Do not re-file those two.

---

## Fly / desk (context, not this HTML cook)

- `/health` 200, `ok`, `mcfly-analytics`, `db up`.
- Public `/demo` = SAMPLE Snowdevil, Settings in the pills, `?tab=orders` **does** remap the iframe (JS on `/demo`). Deep-link works.
- Spend: `This demo does not save spend.` · Total ROAS **3.58×** on **$103,993 ÷ $29,048** (not home 3.60×).
- `Copy YTD` / `Copy pair` exist. Orders tab has 1st/2nd/3rd/4th+ **$** on SAMPLE — that is desk density, not a site HTML leftover.
- `fly.toml` on this git branch still `MCFLY_SAMPLE_ONLY=true`, `MCFLY_LIVE_STAGE=parked`, `SCOPES=read_orders,read_customers,read_all_orders`. Do not change from this note.

---

## Refuse (this walk)

- Inventing Polar **$1,020**
- Pixels / MTA / true ROAS / COGS as hero
- Changing locked home H1
- Executing ShopifyQL-wait
- Fly / Pages deploy
- Partner Submit
- Unparking Live
- Inventing reviews, install counts, or a Slack bot
- Restoring Harbor / Northline **$98,500** on `/`

---

## Rank for the #191 parent (HTML only)

If the parent can take **three** cooks: **P0-1** (stills vs iframe), **P0-3** (leftover median), **P0-5** (support lede + `read_all_orders`).  

If six: add **P0-4** (90-day vs last year), **P0-6** (privacy/terms), **P0-7** (paste clock / Polar-would).  

**P0-2** is copy on `/demo` Install, not an unpark. **P0-10** is Marty. **P0-8** only if `invites@` is proven to receive mail.

Do not report the niche is owned. Polar still looks like the company. Mcfly still looks like the honest $39 desk that has not decided whether it is a sales board or a cash desk on the only page Shopify shows before Install.
