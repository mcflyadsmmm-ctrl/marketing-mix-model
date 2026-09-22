# ADD briefs — promo quality + spend paste (2026-09-22)

Research only. No app code in this change. Next cooks after the shipped Customers work: cohort 30/90/365, returning-dollar mix, days-to-second, product→LTV, whale/RFM, refund-honest net, and the written-out predictive estimate.

**Locks for both cooks:** Shopify-only flat **$39**. Painted IA is Overview → Orders → Customers → Spend → Goals. Growth and LTV are Customers chips (`mcfly-growth`, `mcfly-ltv`), not pills. Total ROAS = Shopify sales ÷ **entered** spend. Empty spend is **—**, never 0× and never $0 CPA. No Meta path credit, no COGS P&L, no GMV or order-volume pricing, no off-Shopify revenue, no pixels, no ad OAuth.

Merchant chrome stays in shop-owner English. Leave “cohort”, “ARPU”, “till”, “aMER”, and “p25–p75” out of the cards.

---

## Ranked PASS board

Shipped work stays. These rows are the next adds, scored against the same locks.

| Rank | Add | Verdict | Why |
| ---: | --- | --- | --- |
| 1 | Promo / discount → LTV **quality** on Customers → LTV | **PASS — cook now** | `#98` already says promo-first vs full-price, and names a code only when the order carries one. Live `OrderFact` stores `discountAmount` and does not store a code (`discountCode` is forced null in `loadLtvDepth`). The open question is whether a **deeper first-order discount** starts a weaker 30/90/365 path. Shopify’s discount report stops at orders and total sales. |
| 2 | Optional Spend **paste** densify → cash Total ROAS / CPA / payback | **PASS — cook second** | Paste already parses on `/app/spend/import`. The empty Spend first fold is Add a day. The preview is days, labels, and a total. It does not show the cash trio, and a blank paste must keep Total ROAS, Cash CPA, and payback at **—**. |
| — | Store discount **titles** via `discountApplications` | **HOLD** | Names on live would need a new stored field. Quality bands work from discount $ already on the row. Do not block rank 1 on a query or schema change. |
| — | Country or tag → LTV | **HOLD** | Not on `OrderFact`. Lifetimely sells it inside the same CAC report. A later cook only if the field is already approved and non-PII. |
| — | Web / POS / Shop → LTV | **HOLD** | `sourceName` is on the order. Orders already shows source mix. It is not the promo-quality or paste gap. |
| — | COGS or contribution on a promo row | **REFUSE** | P&L. |
| — | Pixel, Meta/Google OAuth, channel ROAS from a column header | **REFUSE** | Path credit. A pasted “Meta” column is a label on a dollar. |
| — | Sixth analysis tab, GMV pricing, Amazon, Klaviyo, Recharge | **REFUSE** | Niche lock. |

---

## Brief 1 — Promo / discount → LTV quality

### Ship language

On **Customers → LTV**, densify the existing Promo → LTV board so a merchant can see whether a **deeper first-order discount** starts a higher or lower path than full price. Bands are Light, Typical, and Deep, from discount dollars already stored on the first order. Each sealed band shows first 30 days, first 90 days, and the first year, plus the share who came back, and lift versus full-price first. The same written-out 90-day line stays: average first order + average extra orders × average later order, next to what those starters actually spent. A named code, when the order already has one, keeps its card and may show the median depth of that code. Live shops with discount dollars and no codes still get the bands. Live shops with no discount field keep the current empty card.

### Tab / chip

- Tab: **Customers** (`/app/customers`).
- Chip: **LTV** (`?panel=ltv`, anchor `mcfly-ltv`).
- Place the bands **inside** `LtvPromoBoard`, which already mounts after `LtvProductBoard` and before spend-build curves in `CustomersLtvDepth`.
- Do not add a chip, a pill, or a route.

### What to add

1. **Depth of the first order only.** For a buyer whose first-order discount $ is known and whose pre-refund total (`grossAmount` / `totalPriceSet`) is known and finite:

   `share = discount $ ÷ (pre-refund total + discount $)` when the denominator is > 0.

   - Full price first: discount $ is **0** (already a row).
   - **Light:** share > 0 and < 15%.
   - **Typical:** share ≥ 15% and < 30%.
   - **Deep:** share ≥ 30% (including a first order fully covered by the discount).

   Write those three cuts on the card. Do not use terciles. Do not read a code name as a percent (`WELCOME10` is not 10%).

2. **Same seals as Promo → LTV.** A band shows a window only when at least **8** buyers who started in that band have lived 30, then 90, then 365 days (`PROMO_MIN_BUYERS`). Fewer than 8, or not yet lived: that window is **—**. Come-back is the share of those sealed starters with a second order inside the window.

3. **One morning line on the existing promo read**, not a second hero. When at least one depth band has a sealed 90-day (else 30-day) value, add a line: which depth is worth the most, the dollar amount, lift versus full-price first, and came-back. Full price remains the baseline row.

4. **Named-code cards that already exist.** When at least 8 starters on that code have a known share, show the median share as “about N% off the first order.” When they do not, omit the percent.

5. **Later orders at full price.** On a sealed 90-day band, show the share of orders **after** the first whose discount $ is 0, and only among later orders that have a known discount field. Label it “later orders at full price.”

6. **SAMPLE.** Snowdevil already stamps `WELCOME10`, `POWDER15`, and `BUNDLE` plus full-price first orders. The dense canvas should show at least two depth bands with a sealed window when the book supports it, without inventing a fourth code.

### Preserve

- Five tabs. Customers chips stay Returning, LTV, Growth, Depth.
- Flagship 30/90/365 triangle, written predictive estimate, refund-honest cohort net, product→LTV, whale/RFM, days-to-second, returning-dollar mix.
- Existing promo rows: real code, else “Promo first” vs “Full price first.” Codes are never invented from a dollar amount.
- Empty kinds already on the board: syncing, discounts, thin, young. Floor copy stays on the card.
- Orders tab discount peeks (discounted-order share, typical dollars off, discount depth on the weekly ledger). Those are ticket facts, not this LTV path.
- Goals LTV target and year returning-$ target.
- No spend, CPA, or ROAS on this board.

### Honesty rules

- Dollars are **net** (`amount` / current total). “After refunds” appears only when every order in that starter window has a known gross, using the same rule as cohort windows (`gross` null means not on file). A missing gross is not “$0 refunds.”
- A buyer with discount $ > 0 and **no** pre-refund total does not enter Light / Typical / Deep. They stay on the existing promo-vs-full-price row. The depth line says the percent waits until the pre-refund total is on file.
- A buyer with a null discount field is unknown, not full price.
- Lift is versus **full-price first** in the same window. It stays **—** until both sides have sealed. It is not versus the shop blend and not versus CAC.
- The 90-day formula is an average of people who already lived 90 days. Copy stays “not a promise.”
- Year is **—** when those starters have not lived a year (`historyLimited` or too few mature buyers). Never a fake $0 year.
- Guests stay out, same as the rest of LTV depth.
- Do not add `discountApplications`, a code column, a new Shopify scope, COGS, margin, or pixels in this cook.

### Done-when for Reviewer

Score Accuracy, Quality, Organization, Ease, Stickiness, Empty-state. PASS requires all six.

- **Accuracy.** Light / Typical / Deep use the cuts above on first-order discount $ ÷ (pre-refund total + discount $). A code name does not set the percent. Windows match product/promo seals (8 buyers who lived the window). Net dollars. Refund line only when gross is complete. Year withheld when the starters have not lived it.
- **Quality.** One depth line plus up to three band cards and the full-price baseline, on the existing promo board. A reviewer can answer “did the deeper first discount start a weaker path?” without opening another report.
- **Organization.** Still Customers → LTV, after Product → LTV, before spend-build curves. Orders discount peeks unchanged. No new tab or chip.
- **Ease.** Pills, phone, and chart hover still work. Each card is a name, one dollar amount, a window, and came-back.
- **Stickiness.** Depth that cannot seal is an ActionCard-shaped empty (verb + floor), same family as discounts / thin / young.
- **Empty-state.** A live shop with no discount field still shows the discounts empty, not a blank chart and not $0. A shop with discount $ and no pre-refund total does not invent Light/Typical/Deep. SAMPLE Snowdevil shows sealed depth where the book has it.

### Competitor weakness

Shopify’s Sales by discount codes report groups **orders and total sales** by discount name. It does not follow those buyers for 30, 90, or 365 days, and combinable discounts can list the same order on more than one row. Source: [Shopify Help — Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) (fetched 2026-09-22).

Lifetimely does sell this job, and bundles it with the rest of the profit OS. The promotions block is “CAC & LTV of customers that use different discount codes,” next to an AI predictive model and Profit Agent. The drivers report’s historical LTV is “average total sales per customer over the past 24 months **(including taxes)**, with discount codes and refunds already deducted,” ranked by lift versus the shop average, with a minimum-customer cutoff they do not put on the card as a floor the merchant can see. Paid plans that include attribution, CAC, and payback run **$49 to $999** by monthly order volume (pricing file updated 2026-09-21). Sources: [Lifetimely LTV](https://useamp.com/products/analytics/lifetime-value/), [LTV Drivers](https://help.useamp.com/article/699-ltv-drivers-walkthrough), [pricing.md](https://useamp.com/pricing.md).

Mcfly’s version is the depth question on the Customers LTV chip, from Shopify order totals already stored, at flat $39, with the formula and the floor on the card, and with no CAC column.

---

## Brief 2 — Optional Spend paste densify

### Ship language

On **Spend → Total ROAS**, put an optional paste box in the empty first fold, next to Add a day. Pasting daily spend (or uploading the same CSV on the existing import page) writes nothing until the rows are real spend. Before save, the preview shows how many days, which **labels**, the total dollars, and three cash cells for **those pasted days**: Total ROAS, Cash CPA, and payback versus first 90. After a successful save, the same page’s hero is Sales | Spend | Total ROAS with the equation, and the CPA chip can show Cash CPA and payback. When the merchant pastes nothing, or the paste has no positive daily amounts, those three stay **—**.

### Tab / chip

- Tab: **Spend** (`/app/spend`).
- Chip: **Total ROAS** (`mcfly-roas`) for the paste and the hero pair.
- **CPA** (`mcfly-cpa`) for Cash CPA and payback after spend is on file. Do not add a chip.
- File upload, template download, and “Add one bill” stay on `/app/spend/import`. The empty first fold links there. It does not become a second Spend page.

### What to add

1. **Paste in reach of the empty first fold** (`emptyLiveSpend`), beside Add a day. Reuse `parseSpendCsv` / the import preview. Do not fork a second parser.

2. **Preview before write**, labeled **these pasted days** (not “this month”):
   - Days with a positive amount, channel labels, total dollars.
   - **Total ROAS** = Shopify sales on the **intersection** of pasted days and days that already have a sales fact, divided by the pasted spend on **that same intersection**.
   - **Cash CPA** = that same intersection’s spend ÷ identified Shopify buyers with an order on those days.
   - **Payback** = the existing cash-payback figure (spend ÷ new buyers, against first-90 order-history value) when that math already returns a number. Otherwise **—**.

3. **After save,** the certified hero remains the period pair already on the page (Sales | Spend | Total ROAS, equation visible). The success line may name CPA and payback only when those values are non-null. The CPA lane opens because spend is on file, which it already does.

4. **SAMPLE** stays a read-only ledger. The paste box is a Live door. Snowdevil spend already on the SAMPLE canvas keeps painting the trio.

### Preserve

- Five tabs. Spend chips stay Total ROAS, Explorer, Mix, CPA, Add spend.
- Overview has **no** spend and **no** Total ROAS.
- Add a day, daily amount until I change it, bill spread, confirm-replace, CSV size caps, currency, and channel entitlements.
- Blank amount cells and **0** amounts are skipped and write nothing (`parseLongSpendCsv`). A **deleted** day stays $0. Those are different.
- Empty spend hero: sales may show, spend **—**, Total ROAS **—**, never 0×.
- Cash CPA / Cash CAC **—** until spend and identified buyers exist. Payback **—** until cash CAC and a sealed first-90 exist. Never $0 CPA.
- Mix may show **spend share** by the label the merchant used. It does not become a channel ROAS. Allocation already refuses spend-share as channel Total ROAS.
- Sales-window warning when pasted days start before the sales floor.
- “This file is ad spend only — sales stay in Shopify.”
- Customers LTV, including payback’s first-90 **order-history** value, is unchanged by this cook except that payback becomes visible once spend exists.

### Honesty rules

- A column header (`Meta`, `Google`, or a custom name) is a **label on the dollar the merchant entered**. It is not evidence that those ads caused the sales. Do not add a Meta ROAS, a platform CPA, or a path-credit column.
- Total ROAS uses Shopify sales as the numerator and entered spend as the denominator. One portfolio number.
- If **any** pasted day inside the sales window has no sales fact, the preview Total ROAS is **—**, with a count of days that do have sales. Do not divide a partial sales sum by the full paste (that inflates ROAS) and do not drop the quiet days from the spend side while keeping them in the sentence.
- Days before the sales floor do not get a made-up sales number. Show the existing warning. They do not enter the intersection.
- Pending sales: the trio stays **—**, not $0.
- Zero buyers: Cash CPA and payback stay **—**.
- First 90 not sealed, or history still filling: payback stays **—**, and the note says the first-90 value is not on file yet.
- A blank box, a header with no amount rows, or only zeros/blank amounts: **write nothing**. The hero stays empty-honest.
- Paste does not change order net, refunds, or LTV.

### Done-when for Reviewer

- **Accuracy.** Preview intersection matches the rule above. Hero after save matches Shopify sales ÷ entered spend for the period the hero already uses. Cash CPA is spend ÷ Shopify buyers. Payback uses the existing first-90 order-history value. A Meta column does not create a Meta ROAS.
- **Quality.** With no spend, the first fold still shows sales, a dash, and a way to add a day **or** paste. After one honest paste, Total ROAS, Cash CPA, and payback are either real numbers with the formula or a dash with the reason. The page feels like the cash desk, not an uploader.
- **Organization.** Spend → Total ROAS. Import route still owns the file drop. No new tab or chip. Overview still has zero ROAS.
- **Ease.** One paste box, one preview, one save. Add a day still works for a single bill.
- **Stickiness.** The empty finding stays on the first fold until spend is saved. A failed parse writes nothing and names the first error.
- **Empty-state.** No paste, blank paste, and all-zero paste leave Total ROAS, Cash CPA, and payback as **—**. A deleted day can still be $0. Those two states are visibly different.

### Competitor weakness

Triple Whale’s own docs say Summary and Pixel **will not always match**: the Summary store tiles are shop-level orders, and the Pixel page is ad-attributed (`pixel_joined_tvf`). They tell merchants both views are “correct” because they answer different questions. Source: [Why Are My Orders and Revenue on the Summary Page Different From the Pixel Page?](https://triplewhale.readme.io/docs/why-are-my-orders-and-revenue-on-the-summary-page-different-from-the-pixel-page) (fetched 2026-09-22).

Northbeam says it and Shopify “will rarely match exactly, and that’s expected,” tells merchants to compare an **Orders export** rather than Shopify reports, and states that its **default revenue does not deduct refunds** while Shopify Total Sales does. Source: [Why Doesn't Northbeam Match My Shopify Reporting?](https://docs.northbeam.io/docs/why-doesnt-northbeam-match-my-shopify-reporting) (fetched 2026-09-22).

Lifetimely’s paid ladder sells “Attribution — ad spend, ROAS, and CPC across channels in one place” on the same **$49–$999** order-volume plans as CAC and payback. Source: [pricing.md](https://useamp.com/pricing.md) (updated 2026-09-21).

Mcfly’s paste is optional. The number is Shopify sales ÷ the dollars the merchant typed. No pixel is required for the trio to be honest, and with no paste the trio stays a dash.
