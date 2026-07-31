# Pipe automation wedge — Free CSV + customer-paid connectors

**Status:** Locked product pattern (2026-07-28).  
**Ship plan:** [`SHIP_BUILD_PLAN.md`](./SHIP_BUILD_PLAN.md) Phase A.  
**Religion:** Mcfly = cash close / spend affordability. **Not** a SyncWith clone. Pipes are commodity.

---

## Legal / App Store (advertise automation safely)

| Risk | Safe behavior |
| --- | --- |
| Shopify 1.1.14 (no agencies/freelancers marketplace) | Recommend **SaaS pipe tools** (SyncWith, Coupler, Supermetrics, Coefficient) — not agencies |
| Fake “Works with” | Say optional export into **Mcfly template**; no logos in Works-with without a deal |
| Core app must work alone | Free CSV never requires a pipe vendor |
| Affiliate / FTC | Default: **no** affiliate links; if added, disclose next to the CTA |
| Billing | Merchant pays pipe vendor directly; Mcfly Pro only via Shopify Billing later |
| Trademarks | Nominative use in instructions OK |

---

## The offer (one sentence)

**Mcfly is Free to install and Free to run on CSV paste.** Want hands-off Meta / Google / Microsoft / TikTok / email spend? **Pay SyncWith, Coupler, Supermetrics, Coefficient, etc.** — they own OAuth, refreshes, and breakage. Mcfly pulls a simple Sheet (or webhook CSV) into the Total ROAS desk.

---

## Who pays for what

| Layer | Who pays | Who owns pain |
| --- | --- | --- |
| Shopify sales | Included (Shopify OAuth) | Mcfly |
| CSV / paste / Bill→daily spend | Free | Merchant (5–10 min Monday) |
| Multi-platform connector zoo + refresh | **Merchant → SyncWith-class** | Pipe vendor |
| Total ROAS + break-even + Allocation | Mcfly (~$39 flat later) | Mcfly |

We **do not** absorb Microsoft / Klaviyo / TikTok App Review or stale-token support.

---

## Integration model (no BD required)

```text
Merchant installs SyncWith / Coupler / Supermetrics / …
        → schedules ads spend into a Google Sheet
        → Mcfly template columns: date | channel | amount
Merchant downloads CSV (or future Sheet pull) → Spend Import
        → Mcfly upserts SpendEntry
        → recon ±5% + Overview Total ROAS
```

Optional later: Zapier/Make/Coupler **webhook** → Mcfly import URL + shop token.

**Never required:** partnership with SyncWith owners, embedding their UI, or Mcfly billing their connectors.

---

## Product surfaces

| Surface | Copy / behavior |
| --- | --- |
| Spend empty / Automate tab | Free: paste / upload CSV first (replace-on-overlap). Automate: “Use SyncWith → fill template → download CSV → paste.” No live Sheet pull yet. |
| Listing / site | Honest: Free = CSV. Automation = customer-paid pipe tools. No Mcfly ads OAuth ([`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md)). |
| Connections | **Retired** — redirects to Spend. Zoo stays external. |

---

## Refuse

- Building SyncWith-scale connectors inside Mcfly  
- Claiming “Works with Microsoft/Klaviyo” via our OAuth before we actually ship those pipes  
- Making Free path depend on any third-party pipe  
- Pixels / MTA / path credit from any pipe tool  

---

## Build order

| # | Work | Status |
| --- | --- | --- |
| 1 | Docs + Spend Automate UI + listing/support honesty | **Done** (Phase A) |
| 2 | Public pipe CSV templates (`date,channel,amount` + wide) — in-app `?pipe=` + `site/assets/mcfly-pipe-spend-*.csv` | **Done** (CSV download today; Sheet live pull later) |
| 3 | Google Sheets OAuth pull → `SpendEntry` upsert + freshness chip | **DEFER** post-Submit |
| 4 | Webhook import for Zapier/Make (optional) | **DEFER** |
| 5 | BD outreach / affiliate | Optional — not blocking; FTC if commission |

**Merchant path today:** download Mcfly pipe template → SyncWith/Coupler/etc. fills it → download CSV → Spend Paste/Import. Free CSV never requires a pipe vendor.

---

## Related

- [`COMPETITORS.md`](./COMPETITORS.md) — SyncWith = pipes, not product  
- [`VALUE_THESIS.md`](./VALUE_THESIS.md) — Free CSV → Pro $39  
- [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md) — no Monday Close / no Mcfly ads OAuth
- [`MASTER_PLAN.md`](./MASTER_PLAN.md) §1 — refuse connector zoo  
- [`CATEGORY_DOMINATION_MEGAPROMPT.md`](./CATEGORY_DOMINATION_MEGAPROMPT.md)  
