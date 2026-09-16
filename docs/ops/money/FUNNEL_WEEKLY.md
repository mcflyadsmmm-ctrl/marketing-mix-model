# Funnel weekly — Mcfly Analytics (Partner numbers)

**Lane:** Ops. Empty table until Marty pastes. **Do not invent visits, installs, trials, paid, or reviews.**

**Listing:** https://apps.shopify.com/mcfly-analytics-public  
**App (human):** https://dev.shopify.com/dashboard/227535001/apps/403721814017  
**Price:** 7-day trial, then $39/store/month (public listing HTML 2026-09-15).

Ads inherit this sheet. **No App Store ads until one organic week of Partner visits / installs / trials is pasted below.** That filled week is gate 3 for [`APP_STORE_ADS.md`](./APP_STORE_ADS.md).

Public listing reviews as of 2026-09-15 stranger smoke: **0**. Not a Partner Insights number — do not put it in the table as if it were visits.

---

## Where to read numbers (human, Partner / Dev Dashboard)

Shopify moves labels. Use the **Public** app `403721814017`, not Custom `400772497409`.

| Column | Where Marty reads it |
| --- | --- |
| **Listing visits** | Dev Dashboard → Mcfly Analytics Public → **Insights** / **Analytics** / App Store listing performance (**listing views**). Not mcflyads.com traffic. |
| **Installs** | Same Insights panel **installs**, or app **Activity** install events. |
| **Visit → install %** | `installs ÷ listing visits` for that week. Leave blank if visits are 0. |
| **Trial starts** | Shopify App Pricing / billing reports for this app (trial started). Not in curl. |
| **Shops that added spend** | **Not in Partner.** Count from the desk / Fly (shop typed or CSV’d spend > 0). Leave blank until Marty has a count. |
| **Paid** | Billing: shops that converted after trial (or paid without inventing). |
| **Uninstalls** | Insights / Activity **uninstalls** for the week. |

Paste integers. If a report is missing, write `n/a` — do not guess. **Do not fill zeros as if they were measured.**

---

## Diagnosis (after real numbers exist)

| Pattern | Likely | Not |
| --- | --- | --- |
| **Visits + 0 installs** | Listing bug (copy, shots, pricing confusion, trust URLs) | “Need ads” |
| **Installs + 0 spend** | Onboarding bug (SAMPLE stuck on, trial iframe, spend empty state, shop never types a day) | Listing ASO |
| Visits, installs, spend, then 0 paid at day 8 | Billing / Partner plan / uninstall-before-charge — check Pricing + Admin trial path | New features |

---

## Floor chatter (not a promise)

Public 2026 App Store chatter: **0-review** apps often land about **1–2% visit → install**. That is a **floor people mention**, not a Mcfly forecast and not a target to invent toward. Do not write a % into the table until Partner visits and installs are real.

---

## Weekly table

Week of = Monday of that week, America/Denver, except the launch row kept as **2026-09-08** (first public week after 7 Sep launch). **Rows left blank for Marty.** He has not pasted numbers.

| Week of | Listing visits | Installs | Visit→install % | Trial starts | Shops that added spend | Paid | Uninstalls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-09-08 |  |  |  |  |  |  |  | First public week after 7 Sep launch. **Paste Partner numbers. Ops left this row empty.** |
| 2026-09-15 |  |  |  |  |  |  |  | Second public week. **Paste Partner numbers. Ops left this row empty.** |

No prior weeks: listing was not a live fully-visible App Store URL to measure before 7 Sep 2026. Do not backfill zeros as if they were measured.

---

## Ops will not

- Fill this table from curl
- Set an ads budget
- Treat mcflyads.com sessions as listing visits
