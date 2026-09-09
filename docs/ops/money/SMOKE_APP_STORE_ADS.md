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

Fly **v191** is live (Wave 2). Still treat Admin smoke as unproven until Marty stamps Record **PASS** — curl/version alone is not a smoke PASS.

---

## After grant (`read_all_orders`)

1. Confirm Admin: Settings → Apps → Mcfly Analytics → View orders / All orders approved.
2. Open Overview MTD again. Allow longer than ~732ms (sync MTD fill).
3. Same P0 table. LTV may still say backfilling — that must not leak “Below break-even” onto Overview.

---

## Record

**Blank until Marty fills Result.** Curl listing/health is not a smoke PASS.

Pre-filled from Conductor Wave 2 (2026-09-08) — do not treat as Admin PASS:

| Field | Value |
| --- | --- |
| **Fly version / image** | **v212** · `deployment-01M22EVA9PPB9NPZCMGM2PAPKM` (Love-V2 `83cfc37`) — Admin Result still blank |
| **Curl listing** | 200 |
| **Curl health** | `{"ok":true,"db":"up"}` (re-check before smoke) |

| Field | Value (Marty) |
| --- | --- |
| **Result** | _PASS / FAIL — blank_ |
| **Date** | _YYYY-MM-DD — blank_ |
| **SAMPLE off?** | _blank_ |
| **MTD sales** | _blank_ |
| **MTD orders** | _blank_ |
| **Spend** | _blank_ |
| **Total ROAS** | _blank_ |
| **Verdict headline** | _blank_ |
| **SCOPES note** | _blank — e.g. Admin All orders approved?_ |
| **BILLING_TEST note** | _blank — billing test / trial path exercised? leave n/a if not run_ |
| **Notes** | _blank_ |

Do not invent Partner listing views. Installs are the public metric.
