# Cold-path smoke — App Store Ads simulation

**Purpose:** Pretend a paid click just landed on the listing and installed. The first 10 minutes must not look like “ads lost money.”

**Store:** `devmcflyads` — https://admin.shopify.com/store/devmcflyads  
**Listing:** https://apps.shopify.com/mcfly-analytics-public  
**Fly:** https://mcfly-analytics.fly.dev/health  

**This is not ads.** Do not buy traffic from this script.

Reuse Path A in [`../REVIEWER_TEST_SCRIPT.md`](../REVIEWER_TEST_SCRIPT.md), then add the P0 assertions below.

---

## What curl can prove (agent / Mac)

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://apps.shopify.com/mcfly-analytics-public
curl -sS https://mcfly-analytics.fly.dev/health
```

Expect listing **200**, health `{"ok":true,...}`. Curl cannot see Admin Overview, SAMPLE, or CashVerdict.

---

## Human / Admin (Marty, or a Mac session already logged into Admin)

Clock starts after install (or app open). SAMPLE **off**.

### Setup

1. Settings → contribution margin (e.g. 35%) → Save.
2. Spend → download template → import Meta + Google CSV for a recent period (one day is enough). Confirm spend > 0.
3. Overview → period **Month to date**.

### P0 assertions (FAIL the smoke)

| Check | Fail if |
| --- | --- |
| Sales vs Admin orders | Spend > 0 and Overview shows **Sales $0 / 0 orders / 0.00× / Below break-even** while Admin → Orders has orders in MTD |
| Honesty | Facts still loading / backfilling is OK. Fake money judgment is not. |
| Hand math | Trusted Total ROAS is **sales ÷ spend** within ~5% |
| Review ask | Banner appears while SAMPLE on, facts incomplete, mer = 0, or scoreboard empty |
| Clock | No trusted Total ROAS (or honest loading copy) within **10 minutes** after margin + CSV |
| SAMPLE | SAMPLE stamp missing while practice numbers are on screen |

### PASS

- MTD shows real sales from Admin-visible orders **or** honest incomplete / “not a trusted multiple” / sales still loading.
- Never **0.00× + Below break-even** on a desk with spend and existing orders.
- Review ask stays off until trusted Total ROAS (finite mer > 0, SAMPLE off, facts not incomplete).

If Fly is still on a build **without** [#41](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/41), treat live Overview as **old product**. Unit tests on `cursor/sales-grant-zero-roas-9bdc` are the proof until Marty deploys.

---

## After grant (`read_all_orders`)

1. Confirm Admin: Settings → Apps → Mcfly Analytics → View orders / All orders approved.
2. Open Overview MTD again. Allow longer than ~732ms (sync MTD fill).
3. Same P0 table. LTV may still say backfilling — that must not leak “Below break-even” onto Overview.

---

## Record

**Blank until Marty fills.** Do not invent a PASS. Curl listing/health is not a smoke PASS.

| Field | Value (Marty) |
| --- | --- |
| **Result** | _PASS / FAIL — blank_ |
| **Date** | _YYYY-MM-DD — blank_ |
| **Fly version / image** | _blank — e.g. `fly status` / image digest after P0 deploy_ |
| **SAMPLE off?** | _blank_ |
| **MTD sales** | _blank_ |
| **MTD orders** | _blank_ |
| **Spend** | _blank_ |
| **Total ROAS** | _blank_ |
| **Verdict headline** | _blank_ |
| **SCOPES note** | _blank — e.g. `read_all_orders` granted? Admin All orders approved?_ |
| **BILLING_TEST note** | _blank — billing test / trial path exercised? leave n/a if not run_ |
| **Notes** | _blank_ |

Do not invent Partner listing views. Installs are the public metric.
