# Site share jobs — 2026-09-22

**Role:** Scout. Public operator words (Shopify Community, Reddit) + native Shopify Help + competitor **marketing sites** + Mcfly **public site** copy. Order-history desk only.  
**Tip this note is about:** Parent **92a278b** / Fly **v433** / Live **PARKED**. Site in this tree is **v30** (`site/index.html` `mcfly-version`). No Pages, no Fly, no unpark.  
**Painted IA:** Overview · Orders · Customers · Spend · Goals. No sixth tab. Growth / LTV live on Customers.  
**Price:** $39 / 7-day. Trial **90** days of orders; paid **24** months.  
**Religion:** Shopify Total Sales. Empty spend is **—**, not 0×. Total ROAS = sales ÷ entered spend. SAMPLE on `/demo`. No pixels / MTA / true ROAS / COGS hero / sessions promise.

Quotes below were copied from the page fetched on **2026-09-22**, except Reddit self-texts taken from the public search index after `reddit.com` timed out (bot wall) — same method as `docs/ops/research/2026-09-22-THIRD_OPERATOR.md`. Triple Whale’s **homepage** (`https://www.triplewhale.com/`) returned Cloudflare “Sorry, you have been blocked”; marketing copy below is from pages that did return (`/moby-agents`, `/case-studies/porter-media`) plus the public search index, and is labeled. Nothing in quotation marks was written for this file.

This note scores the **website**, not the Admin desk. The app already paints share cards, Slack copy, mailto Overview, and PNG. The site does not sell or demonstrate that job at enterprise grade. Founder bar: the site must reach the same improvement level as the app. Do not cook `app/**`.

## Floor — reciting these as the whole note is FAIL

Desk operator pains already scored in `docs/ops/research/2026-09-22-THIRD_OPERATOR.md` (CharlesUK sample typical, TSAvi split checkout, Nik_Hawks POS `$` pair, LisaNM POS codes, YC3 returns-as-edits, dunk `numberOfOrders`, etc.). This note does not recook them as Fly tabs.

This note’s grain is different: **what a $5M operator wants to paste** (Slack standup, Monday board, investor PDF, buyer-ops huddle) and **whether mcflyads.com shows a shareable artifact**.

## Stored Mcfly facts (so PASS / HOLD / REFUSE is not a wish)

| On the book | Not on the book |
| --- | --- |
| `OrderFact`: `amount`, `grossAmount`, `unitCount`, `sourceName`, first `discountCode`, `discountAmount`, `lifetimeOrders` (snapshotted from current `customer.numberOfOrders` at crawl), opaque `customerKey`, `orderedAt`, `shopLocalDate` | Refund **processing** date · country · product title / SKU · order tags · gift-card flag · subscription-checkout bit · per-location timezone · staff member · presentment as a second sum |
| `SalesDayFact`: Shopify Total Sales, net, gross, order count, new / returning `$` | Sessions, conversion, checkout funnel |
| Spend paste | Ad-account OAuth, pixels, “true ROAS”, COGS as a hero |
| App share already painted: `ShareableInsightCards` (returning · typicalOrder · daysToSecond · ltvPeek) with **Copy for Slack** + **Save PNG**; `SlackInsightCard`; `ShareOverviewButton` (`mailto:` body, Mcfly never sends mail); `CopyMorningSentence` / `CopyYtdSales` / `CopySpendPair`; `firstTimeSlackInsight` | Slack as a product, Flow, scheduled email, password-protected dashboard links, pixel snapshots |

Day totals go back five years. Order rows do not (trial 90 / paid 24). SAMPLE must not invent a catalog Live cannot store. Site cooks reuse **Snowdevil SAMPLE numbers already on `/`**: spend **$19,023** · sales **$68,457** · **3.60×** · BE **2.50×** @ 40% · typical **$631** · returning **$45,409** · weekend mix **23%** · days to second **21** · 90-day LTV **$890**. Do not put Harbor **$23,414** / **3.51×** or Northline **$98,500** / **4.19×** on home. Do not invent a sixth figure.

## Fetch log — 2026-09-22

**Shopify Community (direct fetch):**  
[Give back the old analytics page](https://community.shopify.com/t/give-back-the-old-analytics-page-please/387565) · [Finance Summary no longer a report](https://community.shopify.com/t/shopify-has-changed-their-finance-summary-report-no-longer-a-report/414614) · [BRING BACK FINANCIAL SUMMARY PRINTABLE REPORT](https://community.shopify.com/t/bring-back-financial-summary-printable-report/414875) · [Bring back Compare-to figures](https://community.shopify.com/t/request-bring-back-compare-to-figures-and-dates-in-analytics/377695) · [New analytics issues with comparisons](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984) · [Automating Shopify Reports](https://community.shopify.com/t/automating-shopify-reports/349629) · [Median order value](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046) · [POS sales by day](https://community.shopify.com/t/pos-sales-by-day/327343) · [Reports compare annually](https://community.shopify.com/t/reports-compare-annually/321472) · [How to create and save a custom report](https://community.shopify.com/t/how-to-create-a-custom-report-and-then-save-it/320890) · [New VS Returning customer](https://community.shopify.com/t/new-vs-returning-customer/408807) · [Native calculated metrics / CSV](https://community.shopify.com/t/feature-request-native-calculated-metrics-in-shopifyql-analytics-retail-fundamentals-missing/639503).

**Reddit:** `reddit.com` fetch **timed out**. Self-texts from the **public search index** (same method as `THIRD_OPERATOR.md`):  
[Analytics Report Apps?](https://www.reddit.com/r/shopify/comments/1kscdqy/analytics_report_apps/) · [Emailing standard reports](https://www.reddit.com/r/shopify/comments/1ju2pwa/emailing_standard_reports/) · [Weekly KPI emails via Flow](https://www.reddit.com/r/shopify/comments/1mohgn3/creating_workflows_to_send_weekly_kpi_emails/) · [New vs. Returning Customers](https://www.reddit.com/r/shopify/comments/1inkto2/new_vs_returning_customers/).

**Shopify Help (direct fetch):** [Exporting reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports) · [Customizing and managing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports).

**Competitor marketing sites (not an in-app tour):** Lifetimely `https://www.lifetimely.io/` · TrueProfit `https://trueprofit.io/` + `/solutions/mcp` + `/solutions/pnl-profit-and-loss` · Polar `https://www.polaranalytics.com/` + `/integration-draft/slack` · Triple Whale homepage **blocked**; `/moby-agents` and `/case-studies/porter-media` returned.

## 1. What operators actually ask to share

Four jobs. Their words. 2024–2026 unless noted.

### Slack standup — a sentence, not a screenshot of Analytics

**Kayleigh**, 18 Jan 2025: “The new shopify analytics when comparing gives the full day which is useless, so for example it’s currently 2:55pm in the UK and I want to compare sales today up to 3pm on the same Saturday last year to see if we are on track but its only showing compared to full day amounts so now I need to download a spreadsheet and per hour and work it out myself.” [New analytics issues with comparisons](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984)

**Ben31**, 29 Nov 2024: “It’s incredibly frustrating to only see a percentage difference in Analytics, with no actual data/figures/amounts for the ‘Compare to’ date range. … Basic info like this isn’t percentages OR data - we absolutely need percentages AND data. But worse, if we drill into the ‘Sales over time’ report YOU CAN’T COMPARE TO THE PREVIOUS YEAR??!!” [Bring back Compare-to figures](https://community.shopify.com/t/request-bring-back-compare-to-figures-and-dates-in-analytics/377695)

**Southpaw1**, 2 Jan 2025, same thread: “I’ve been sitting here for nearly an hour trying to return the settings to the views and analytics I’ve had previously … I was reliant on this feature for instant insights into my retail business.”

**shockseals**, 25 Oct 2023, still bumping 2 Sep 2024: “I too would like to know the median order value as a front page metric similar to average order value. I searched and searched as this is a pretty basic metric and I could not find it.” **LeonaMM**, 23 Jan 2025: “How would we go about calculating the MOV if this feature isn’t to be released soon?” [Median order value](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046)

**MightyMelee (Phil)**, 30 May 2024: “Hi - need a report to show which days of the week are busy/least busy. There must be one but I can’t find it! Not bothered about times of the day, just need to know which days are doing what over certain time periods.” [POS sales by day](https://community.shopify.com/t/pos-sales-by-day/327343)

Job: paste **named dollars** (this window vs last year, typical as the middle order, weekend mix) into Slack before standup. A screenshot of a hover, or a percent with no compare-to `$`, is the current workaround.

### Monday board — a printable page finance can reopen

**LeslieMathews**, 19 May 2025: “The Finance Summary that just got eliminated saved me so much time from the previous option - exporting to a CVS and manipulating it to fit a page for printing and then handwriting the sales channel (location) on it. I am a one person department for two locations and every day had 3 of those to get through and on Monday mornings I had 12 reports to generate. … NOW … I will be printing off 9 reports everyday and 27 on Monday mornings.” [Finance Summary no longer a report](https://community.shopify.com/t/shopify-has-changed-their-finance-summary-report-no-longer-a-report/414614)

**petgrocer**, 18 May 2025: “You have removed the ability for us to print the one and only financial report that we need to export daily, in order to enter our sales data in Quickbooks. … I called in and was told I can see that report on a screen, but I can’t print it anymore. If I want to print it I can pay for another app!” [BRING BACK FINANCIAL SUMMARY PRINTABLE REPORT](https://community.shopify.com/t/bring-back-financial-summary-printable-report/414875)

**jedi3**, 22 May 2025, same thread: “This is the report that I process my daily cash deposits from and then sent to my bookkeeper to enter to Quickbooks. … Now it is taking me 20 minutes to copy and paste the information that she needs.”

**carriec228**, 16 Jan 2025: “We utilize this page on the admin everyday … And we can’t even just print the report we have to export and then print.” **Ashley_Van_Ette**, 24 Jan 2025: “won’t print an entire report (either cut off on the side or only one page, cutting off the rest of the report. Exporting doesn’t include summaries.” [Give back the old analytics page](https://community.shopify.com/t/give-back-the-old-analytics-page-please/387565)

**knittingman81**, 9 May 2024: “Every time I pull a report to see how we’re doing, I have to go through pages of clicks to get it to compare to last year instead of yesterday, last week, or last month.” **DBnSF**, 12 Feb 2025: “Who has shifting trends by month? It should always be YoY as default.” [Reports compare annually](https://community.shopify.com/t/reports-compare-annually/321472)

Job: one **named-dollar** board (this month / this year vs last year) a bookkeeper can print or paste on Monday. Not five browser prints. Not a percent chip.

### Investor PDF — a file, not a CSV dump

**u/aisolotrader**, 21 May 2025 (Reddit search index; direct fetch timed out): “Are there other shopify apps that can help me create better reports on analytics like products sold, total sales etc etc etc since i see that the reports tab on shopify, it's good but kinda clunky and doesn't let me export via pdf but all in csv files etc?” [Analytics Report Apps?](https://www.reddit.com/r/shopify/comments/1kscdqy/analytics_report_apps/)

**u/simesy**, 8 Apr 2025 (index): “There are a couple of apps which email reporting, but most of the sales schtick is about their fancy reporting. I'm really just looking for a way to email the standard reports in Shopify.” [Emailing standard reports](https://www.reddit.com/r/shopify/comments/1ju2pwa/emailing_standard_reports/)

**AutomateMe**, 17 Aug 2024: “My organization is constantly downloading Shopify reports on a monthly basis … I’m shocked Shopify doesn’t offer any native automation of reports. … my main want is to have transactions, orders, and payout Shopify reports emailed to me on a monthly basis.” [Automating Shopify Reports](https://community.shopify.com/t/automating-shopify-reports/349629)

**Acorp**, 4 Aug 2026, same thread (native Flow update): “Flow gives you the numbers, not a formatted CSV/PDF export, so if you specifically need file attachments of transaction-level data you’re still better served by an export app.”

**Ohlala-equestrian**, 24 Jun 2026: “ShopifyQL doesn’t support custom calculated columns, forcing merchants to export CSVs for basic math.” (Staff reply: calculated metrics **can** export as CSV.) [Native calculated metrics](https://community.shopify.com/t/feature-request-native-calculated-metrics-in-shopifyql-analytics-retail-fundamentals-missing/639503)

Job: a **forwardable artifact** (PNG / print-to-PDF / mailto body) with formula + trust line. Native export is a spreadsheet. Native PDF is **print the report**.

### Buyer-ops huddle — returning dollars and LTV, not a headcount rate

**OMAFood / Léa**, 15 Apr 2025: “How does Shopify calculate the new VS returning customer? I don’t understand the numbers, as it’s not matching our sales. For example, in March, we had 225 customers : 191 new customers and 45 returning customers. For of all, total of 191 + 45 = 236 and not 225.” [New VS Returning customer](https://community.shopify.com/t/new-vs-returning-customer/408807)

**u/whyanalyze**, 12 Feb 2025 (index): “Has anyone successfully exported their full order data over the span of 2+ years and analyzed to get their own accurate count of new customers vs. returning customers? … Did this customer actually find us and order from us for the first time online last year? … OR did this customer order from us for the first time online after purchasing something in-person through POS a few years ago?” [New vs. Returning Customers](https://www.reddit.com/r/shopify/comments/1inkto2/new_vs_returning_customers/)

**floriangoerig**, 26 Jan 2025: “I want to calculate 12-months-sales-amount and 12-month-order-count and write it to the corresponding customer metafields.” [How to calculate customers last 12 Month sales amount](https://community.shopify.com/t/how-to-calculate-customers-last-12-month-sales-amount/389950)

**u/guyfoxco**, 12 Aug 2025 (index): “I'm trying to create a workflow (using Shopify's Flow app) that will send me and the team a weekly email including a couple important metrics (# of sales for a particular SKU, site visitors, etc.).” [Weekly KPI emails](https://www.reddit.com/r/shopify/comments/1mohgn3/creating_workflows_to_send_weekly_kpi_emails/)

Job: huddle paste of **returning `$` (dollars, not the Overview rate)** and **what a new buyer is worth in the first 90 days** from orders. SKU and sessions on that last post are HOLD / REFUSE below.

## 2. Native Shopify share / export (Help, fetched)

[Exporting reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports) (fetched 2026-09-22):

> “You can export your reports to a different file format from your Shopify admin. Exported reports are saved in the default downloads folder on your device. After the download is complete, you can open the report using a spreadsheet program, such as Excel or Numbers, or a text editor.”

Formats named: CSV, XML, JSONL, Apache Parquet.

> “If you want a PDF file of a report, then you can print the report instead of exporting.”

> “To export a report to a PDF file, you can print the report instead of exporting it.”

[Customizing and managing reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports): “You can export your reports for analysis in spreadsheet programs.” Custom reports: Advanced / Plus (CloudlabSam on petgrocer’s thread, 7 May 2024).

There is **no** native “share this Analytics card to Slack.” There is **no** native scheduled PDF. Flow (May 2026) can email **ShopifyQL numbers**, “not a formatted CSV/PDF export” (Acorp). That is the gap the market sells.

## 3. What competitor MARKETING SITES say you can share

Not an in-app tour. What the public page promises.

| Firm | Page fetched | What the marketing site says you can share |
| --- | --- | --- |
| **Lifetimely** | `https://www.lifetimely.io/` | FAQ: “Can teams ask Lifetimely questions in Slack? **Yes.** Teams can ask store-specific questions in Slack and receive answers based on their approved Lifetimely data. **Scheduled reports can also be delivered to Slack or email.**” Search index of the same homepage also surfaces “Keep your finger on the pulse with a **daily P&L report, in your inbox**” and custom dashboards you “**schedule it to hit your inbox**.” Also: CAC, LTV, first- and last-touch, COGS — refuse as Mcfly heroes. |
| **Triple Whale** | Homepage Cloudflare-blocked. Marketing: [`/moby-agents`](https://www.triplewhale.com/moby-agents) | “Get actionable summaries and recommendations delivered **directly to Slack, email, or mobile**.” FAQ: “whether that's **email, Slack**, or to a dashboard directly in Triple Whale.” “they deliver insights to wherever you prefer — your **email, Slack / Microsoft Teams, data warehouse**, or any other system via webhook.” Case study [`/case-studies/porter-media`](https://www.triplewhale.com/case-studies/porter-media): “all before the team's **Monday morning meetings**.” Help-center share-link / password is **not** the marketing site; listed only so we do not pretend we fetched a homepage tour. Pixel / MTA / MMM stay refuse. |
| **TrueProfit** | `https://trueprofit.io/` · [`/solutions/pnl-profit-and-loss`](https://trueprofit.io/solutions/pnl-profit-and-loss) · [`/solutions/mcp`](https://trueprofit.io/solutions/mcp) | Homepage: P&L, product profits, **Multi-Touch Attribution**, “Ask AI anything … **No dashboards. No report pulling.**” P&L page FAQ: “**Can I export my P&L report? Yes** … **Excel or CSV**.” MCP page: “**Export as PDF, Excel, CSV, or a plain-text summary ready to drop into Slack.**” Also: “Every Monday at 9am, pull last week's profit data … post a week-over-week summary **directly to Slack**” (product-update cousin). COGS / net profit / MTA are not Mcfly’s artifact. |
| **Polar** | `https://www.polaranalytics.com/` · [`/integration-draft/slack`](https://www.polaranalytics.com/integration-draft/slack) | Homepage tile: “**Executive summary to Slack** — Identify trends and action items to kick off your week.” Slack lander: “The answer in the channel, **not a screenshot of a dashboard**.” “**Every Monday at 7am**, Hermes posts last week's numbers.” “A morning read on revenue, spend and blended CAC, **posted before standup**.” “Tell it to post the **Monday brief** every week.” Polar’s mock `#growth` table uses Polar’s own demo dollars — **not** Mcfly SAMPLE; do not copy those figures onto mcflyads.com. First-party pixel / Klaviyo audiences stay refuse. |

Market pattern: the **site** shows the artifact (Slack paste, Monday brief, inbox P&L, PDF/CSV). Mcfly’s app paints a quieter version of that artifact. Mcfly’s **site** does not.

## 4. Mcfly public site — quoted

Spine: `/` · `/demo` · `/product`. Nav: Demo · Pricing · About · Install. `/monday-close` **301 /** (`site/_redirects`). `/faq` is live but **not** on chrome nav.

### First fold — `site/index.html`

Kicker: “Mcfly Analytics · Spend next to sales”  
H1: “Deeper Shopify numbers Analytics does not show.”  
Lede: “Typical order, returning dollars, weekends, LTV — then Total ROAS when you add spend. No ad-network login.”  
CTAs: Install · Try the demo. Price: “$39/store/mo after 7-day trial”

Hero widget (SAMPLE Snowdevil): Typical order **$631** · Returning dollars **$45,409** (“66% of sales this window”) · YoY this month **$68,457** / last year **$69,891** / **-$1,434 · -2%**. Caption:

> “SAMPLE · not a live client · click a card · Total ROAS lives on Spend · empty = —”

No “Copy for Slack.” No mailto body. No PNG poster. No “paste this Monday.” The numbers exist; the **artifact** does not.

Below the fold: “Upload spend → see Total ROAS → hit Goals.” Compact cells: Weekend mix **23%** · Days to second **21** · 90-day LTV **$890**. Still tiles, not a paste.

### `/demo` — `site/demo.html`

H1: “Full Snowdevil SAMPLE demo.”  
Body: “Same desk as the Shopify app — five analysis tabs plus Settings (Overview · Orders · Customers · Spend · Goals). No install. SAMPLE spend **$19,023** · sales **$68,457** · **3.60×** · BE **2.50×** @ 40% · not a live client. Install opens this shop’s Live book only. no Sample|Live toggle.”

Iframe: `https://mcfly-analytics.fly.dev/demo?hosted=1`. The **page copy** never names share, Slack, PNG, mailto, or PDF. A visitor who already knows to open Customers → Depth inside the iframe may see app posters. The **site** does not sell that.

### `/product` — `site/product.html`

H1: “Deeper than Shopify Analytics Overview.”  
Pitch box (“Pitch this in 30 seconds”): “Install inside Admin. Read this month vs last year on Overview — no Meta or Google login. Typical order is on Orders; returning dollars and LTV are on Customers. Add spend later on Spend for Total ROAS. Five analysis tabs plus Settings after a 7-day trial at $39/store/mo. Empty spend is — , never 0×.”

Float desk: spend **$19,023** · sales **$68,457** · 3.60×. Signal / Evidence / Next is a Total ROAS note, not a shareable card. Refuse list names pixels / MTA / true ROAS — correct — and never mentions share. No Slack line. No PNG. No mailto specimen.

### Share / mailto leftovers (not the spine)

`site/faq.html` “What’s in the Shopify desk?”: “Total ROAS · break-even · Spend CSV · Spend Allocation … · LTV / Acquisition · **Email Overview (mailto with period cards).**” Eleven-tab era. Not on nav. Not a specimen of the mailto body.

`site/monday-close.html` still says “Forward this to finance — or print to PDF” and “Export — CSV / PDF for the binder / Slack.” **Live URL 301s home.** The one page that sold a shareable memo is parked. Pricing honesty on that file is also stale (“Flat Free → $39”).

`site/assets/mcfly/chrome.js` footer: Demo · Pricing · About · Privacy · Support · Terms. No share. Mailto on `/support` `/privacy` `/terms` is **inbox contact**, not Overview share.

## 5. Score — site vs the four jobs

| Job | Native Shopify | Market site | Mcfly **app** | Mcfly **site** |
| --- | --- | --- | --- | --- |
| Slack standup | Screenshot / hover / percent | Polar “not a screenshot”; TW Slack; Lifetimely Slack Q&A | Copy for Slack + posters | KPI tiles. Caption is SAMPLE trust, not a paste. |
| Monday board | Print report / CSV; Finance Summary print fought for in 2025 | Polar Monday 7am brief; TW “before Monday morning meetings” | Copy YTD, morning sentence, Goals stack (copy still thin on Goals) | YoY cards on `/`. Not framed as a Monday board. `/monday-close` 301. |
| Investor PDF | Print → PDF; export CSV/XML/JSONL/Parquet | TrueProfit “PDF, Excel, CSV, or a plain-text summary ready to drop into Slack” | Save PNG on share cards | No PNG, no print specimen, no PDF module. |
| Buyer-ops huddle | First-time vs returning **report** (plan-gated) + CSV; Overview **rate** | Lifetimely LTV inbox; Polar new vs repeat in the Slack mock | Returning `$` poster + LTV peek Slack | Returning `$45,409` and LTV `$890` as compact cells. No huddle paste, no “dollars not headcount” line. |

**Verdict:** the site **shows numbers** and **iframes the desk**. It does not **show a shareable artifact**. Competitors’ homepages sell the paste. Mcfly’s app already has the paste. The public site is a version behind the app.

## 6. Twelve SITE cooks

Each cook is how the **website** should SHOW an artifact a $5M operator would paste: static proof, `/demo` caption, or `/product` module. Reuse Snowdevil SAMPLE already on `/`. Do not invent metrics. Do not cook `app/**`.

### 1. YoY Slack standup poster — this month `$` and last year `$`, not a percent — PASS

**Their words:** Ben31 — “we absolutely need percentages AND data”; “only see a percentage difference … no actual data/figures/amounts for the ‘Compare to’ date range.”  
**Job:** Slack standup.  
**Site file:** `site/index.html` first-fold YoY cards already paint `$68,457` / `$69,891` / `-$1,434 · -2%`. Caption does not say paste.  
**What to show:** a static SAMPLE poster (same craft as `mcfly-share-card__poster`) with the line the app already knows how to copy: this month Shopify Total Sales **and** last year `$`. Percent is the sub, not the hero.  
**PASS.** Empty last year stays not on file, never `$0`.  
**REFUSE:** sessions compare. **HOLD:** fiscal-year preset (not stored).

### 2. Monday board module — three named year cards as one paste — PASS

**Their words:** knittingman81 — “pages of clicks to get it to compare to last year”; LeslieMathews — “on Monday mornings I had 12 reports to generate.”  
**Job:** Monday board.  
**Site file:** `site/index.html` YoY grid + `site/demo.html` (no Monday caption) + `site/product.html` pitch (names “this month vs last year” in prose, no board). `/monday-close` 301.  
**What to show:** one `/product` module: This month / This quarter / This year with **both** dollars, SAMPLE badge, “paste to the Monday board.” `/demo` caption: the iframe’s Overview year board is the artifact, not a gallery.  
**PASS.** Do not revive `/monday-close` as a Custom lander. Do not sell gift-card liabilities (mscmith11) — **HOLD** (not on the book). Do not print location (LeslieMathews handwriting) — **HOLD** (no location id).

### 3. Investor print specimen — Save PNG / print-to-PDF of the year board — PASS

**Their words:** u/aisolotrader — “doesn't let me export via pdf but all in csv files”; Shopify Help — “If you want a PDF file of a report, then you can print the report instead of exporting.” petgrocer — “I can see that report on a screen, but I can’t print it anymore.”  
**Job:** Investor PDF.  
**Site file:** none on the spine. App: `downloadShareableInsightPng` + “Save PNG”.  
**What to show:** a static SAMPLE PNG of the YoY year board (or the returning / typical posters) on `/product`, captioned “Save PNG in the app — screenshot-ready, same formula.” Optional: `window.print()` on that module only, SAMPLE watermark.  
**PASS** as demonstrating the app PNG the operator already gets.  
**REFUSE:** a scheduled PDF email product (AutomateMe / Flow). **HOLD:** product-sold tables in that PDF (aisolotrader “products sold”; no product title on the book).

### 4. Buyer-ops huddle — returning `$`, not Shopify’s rate — PASS

**Their words:** OMAFood — “191 + 45 = 236 and not 225”; whyanalyze — exported 2+ years to check new vs returning. App line already: “Returning buyers carry {pct}% of sales ({money}) — dollars, not headcount.”  
**Job:** Buyer-ops huddle.  
**Site file:** `site/index.html` returning tile `$45,409` / “66% of sales this window” — no “dollars, not headcount,” no copy.  
**What to show:** SAMPLE poster using the numbers already on home: Returning `$45,409` · 66% of sales · formula returning $ ÷ (new $ + returning $) · trust “Dollars, not Shopify’s returning-customer rate. Guests stay out.”  
**PASS.**  
**HOLD:** POS-guest stitch (whyanalyze / Downbadge69 — “they will often not be associated with any customer record”). **REFUSE:** email CRM to resolve them.

### 5. Typical-order Slack card — middle order, not average — PASS

**Their words:** jsp_ecommerce — “occasional large orders can significantly impact the AOV, the median order value would offer a more balanced … insight”; shockseals — “median order value as a front page metric similar to average order value.” App line: “Typical order is `$X` — the middle order, not Shopify’s average.”  
**Job:** Slack standup.  
**Site file:** `site/index.html` typical `$631` · “Median ticket · Orders” · no Slack formula.  
**What to show:** SAMPLE poster `$631` + that line + “Typical order = median of paid orders in this window.”  
**PASS.** Floor 8 paid orders; never `$0`.  
**HOLD:** dropping £0 sample checkouts from the denominator (CharlesUK — order tags not stored; desk already owns that grain). Do not invent a Sample tag on the site.

### 6. Weekend-mix paste — which days, as a sentence — PASS (share). HOLD (Saturday `$` if not already named)

**Their words:** MightyMelee — “which days of the week are busy/least busy … just need to know which days are doing what over certain time periods.”  
**Job:** Slack standup / labor board.  
**Site file:** `site/index.html` compact “Weekend mix” **23%**. No Mon…Sun `$`. No copy.  
**What to show:** a copyable SAMPLE line using the 23% already on home: “Weekend mix is 23% of this window (SAMPLE).”  
**PASS** for the share sentence the compact cell already implies.  
**HOLD** a named “Saturday did `$`” on the **site** until SAMPLE copy already names Saturday dollars (Orders weekday `$` is a desk cook, not a fake home number). **REFUSE:** sessions-over-time as the staffing clock.

### 7. LTV huddle paste — first 90 from orders — PASS

**Their words:** floriangoerig — “12-months-sales-amount”; buyer-ops want worth in a window. App line: “A new buyer is worth `$X` in the first 90 days — observed order history.” Home compact already paints 90-day LTV **$890**.  
**Job:** Buyer-ops huddle.  
**Site file:** `site/index.html` `$890` cell; `site/product.html` says “LTV 30/90/365” in prose, no paste.  
**What to show:** SAMPLE poster `$890` · first 90 days · “Observed order history — not an estimate.” Caption: trial is 90 days of orders; first year on a trial shop stays **not on file**, never `$0`.  
**PASS.**  
**HOLD:** a six-figure first-year on SAMPLE if history is limited (do not fake 365). **REFUSE:** predictive LTV / RFM as a site hero (Lifetimely “predictive LTV modelling”).

### 8. Email Overview specimen — visible mailto body, Mcfly never sends — PASS

**Their words:** AutomateMe — “reports emailed to me on a monthly basis”; u/simesy — “email the standard reports”; u/guyfoxco — weekly KPI email. App: `ShareOverviewButton` → `mailto:` with `formatOverviewShareText` (sales, typical, returning share, weekend share; Total ROAS only when spend exists; pending sales “still loading (not $0)”).  
**Job:** Monday board / investor forward.  
**Site file:** `site/faq.html` names “Email Overview (mailto with period cards)” once. Spine never shows the body.  
**What to show:** on `/product` (or a caption under `/demo`), a static SAMPLE of that **plain-text body** using `$68,457` / `$19,023` / 3.60× / typical `$631` / returning 66% / weekend 23%, plus “Mcfly never sends mail — your mail app does.”  
**PASS** as demonstrating the existing mailto.  
**REFUSE:** Shopify Flow, Zapier, scheduled send, WhatsApp reports (Acorp’s WhatsReport pitch). **REFUSE:** putting site visitors / SKU counts in that specimen (guyfoxco).

### 9. Same-clock Saturday line on `/demo` caption — PASS

**Their words:** Kayleigh — “compare sales today up to 3pm on the same Saturday last year … download a spreadsheet and per hour.”  
**Job:** Slack standup.  
**Site file:** `site/demo.html` does not mention through-this-hour vs last year. App already paints same-clock.  
**What to show:** demo caption: Overview same-clock is **this hour vs last year `$`**, not a full-day compare. No new SAMPLE number — point at the desk already in the iframe.  
**PASS.**  
**REFUSE:** sessions. **HOLD:** per-location hour.

### 10. Days-to-second huddle chip — PASS

**Their words:** buyer-ops cousin of LTV (app already copies “Typical wait to a second order is {n} days”). Home compact already paints **21**.  
**Job:** Buyer-ops huddle.  
**Site file:** `site/index.html` “Days to second” **21** — no paste, no “among buyers who came back.”  
**What to show:** SAMPLE line next to the 21: “Typical wait to a second order is 21 days — median first→second gap. Guests stay out.”  
**PASS.**  
**HOLD:** email subscribe counts.

### 11. Product / SKU / country investor pack — HOLD

**Their words:** u/aisolotrader “products sold”; u/guyfoxco “# of sales for a particular SKU”; LeslieMathews location on the printout; Polar mock “by region.”  
**Job:** Investor PDF / Monday board.  
**Site file:** would have to invent a catalog.  
**HOLD.** Product title, SKU, country, location are **not on the book**. Do not paint a fake SKU board on `/`.

### 12. Pixel dashboard / true ROAS Slack bot / email CRM — REFUSE

**Their words:** market homepages (TrueProfit MTA, Lifetimely first- and last-touch, Polar first-party pixel + Klaviyo audiences, Triple Whale Attribution table). u/guyfoxco “site visitors.”  
**Job:** they want a pixel screenshot in Slack.  
**Site file:** `site/product.html` already refuses “Path attribution / MTA / view-through ‘true ROAS’” and “Tracking pixels as a Mcfly product.”  
**REFUSE.** Do not add a Compass / Moby / path-credit share module. Do not promise sessions. Do not sell Klaviyo lists. Slack as a **product** (OAuth bot, scheduled channel post) is refuse; **copy the line** is cooks 1–10.

## 7. Top eight site share cooks (merchant sentences)

| # | Merchant sentence | Artifact the site should show | File | Verdict |
| ---: | --- | --- | --- | --- |
| 1 | Ben31: “we absolutely need percentages AND data” for Compare-to | SAMPLE YoY poster: this month `$68,457` and last year `$69,891` | `site/index.html` | **PASS** |
| 2 | knittingman81 / LeslieMathews: Monday morning reports vs last year | `/product` Monday board of three named year cards; `/demo` caption | `site/product.html` · `site/demo.html` | **PASS** |
| 3 | u/aisolotrader: “doesn't let me export via pdf but all in csv”; petgrocer: “I can’t print it anymore” | Static SAMPLE PNG / print specimen of the year board | `site/product.html` | **PASS** (PNG). **HOLD** SKU. **REFUSE** scheduled PDF |
| 4 | OMAFood: “191 + 45 = 236 and not 225”; whyanalyze exported 2+ years | Returning `$45,409` poster — dollars, not headcount | `site/index.html` | **PASS**. **HOLD** POS guests |
| 5 | shockseals: median “as a front page metric similar to average order value” | Typical `$631` poster — middle order, not Shopify’s average | `site/index.html` | **PASS** |
| 6 | MightyMelee: “which days of the week are busy/least busy” | Copyable “Weekend mix is 23% of this window (SAMPLE)” | `site/index.html` | **PASS** share. **HOLD** Saturday `$` |
| 7 | floriangoerig: 12-month amount; huddle wants worth | LTV `$890` first-90 poster; year omitted if not on file | `site/index.html` · `site/product.html` | **PASS**. **HOLD** fake 365 |
| 8 | AutomateMe / u/simesy: email the numbers | Visible SAMPLE `mailto:` body; Mcfly never sends | `site/product.html` (faq leftover is not enough) | **PASS** mailto specimen. **REFUSE** Flow / Slack bot |

## 8. Do not

- Invent metrics or SAMPLE dollars not already on `/`.
- Unpark Live. Fly deploy. Pages. `gh pr create`.
- Cook `app/**` in this branch.
- Revive `/monday-close` as a Custom lander (301 is law). If share returns, it returns on `/` `/demo` `/product`.
- Quote Polar’s `$482,100` / Triple Whale pixel ROAS as Mcfly proof.
- Promise pixels, MTA, true ROAS, COGS hero, sessions, email CRM.
- Claim the `/demo` iframe “already sells share” because the Fly desk is inside it. The **site copy** does not.

**Already true, not a site cook:** five tabs; Growth/LTV on Customers; `$39` / 7-day; trial 90 / paid 24; Total ROAS = sales ÷ entered spend or —; SAMPLE on `/demo`.
