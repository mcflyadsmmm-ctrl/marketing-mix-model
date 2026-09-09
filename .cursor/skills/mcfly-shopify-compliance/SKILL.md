---
name: mcfly-shopify-compliance
description: >-
  Shopify App Store compliance + PCD scope religion for Mcfly Analytics.
  Use when editing scopes, privacy, listing, PCD answers, webhooks, or App Store submit docs.
---

# Mcfly Shopify compliance

## Hard bans (never)

- **Invent reviews, install counts, or star ratings** — live reviews are **0** until real merchants leave them. Do not invent App Store proof.
- **Free App Store plan / Free+Pro freemium paste** — SoT is **one plan** named **Mcfly Analytics**, **$39**/store/mo · **7-day trial**. Rename Partner plan **Pro** → **Mcfly Analytics**. Delete any Free plan. Trial + paid = full desk (no Pro feature gate).
- **App URL = mcflyads.com** — App URL is **only** `https://mcfly-analytics.fly.dev`. Website / Privacy / Support / FAQ / Terms = `https://mcflyads.com…` ([`docs/ops/PARTNER_LISTING_URLS.md`](../../../docs/ops/PARTNER_LISTING_URLS.md)).
- **Custom Data Solutions on home / listing hero** — Custom is parked (301 home). Public mark = **Mcfly Analytics**. Do not re-upload hero media that says **CUSTOM DATA SCIENCE** / **4.42x** unless recaptured as formula desk ([`docs/ops/LISTING_LIVE_PASTE.md`](../../../docs/ops/LISTING_LIVE_PASTE.md)).
- **Invent App Store URLs** other than `https://apps.shopify.com/mcfly-analytics-public`.
- **Partner Submit from Cursor** — human only.

## Scopes (current Truth MVP)

Allowed in `shopify.app.toml` / Fly `SCOPES`:

- `read_orders` — Shopify sales totals for cash MER
- `read_customers` — **minimal only**: opaque customer `id` + `numberOfOrders` to classify new vs returning. No name, email, address, phone, or CRM.
- `read_all_orders` — Partner-approved when live in scopes; deep till history / till LTV (still Level 1 — no PII fields).

**PCD:** First submit = **Level 1 only** (protected customer data without name/email/phone/address).  
Till LTV later still Level 1. Level 2 (PII fields) is optional post-launch CRM only — see `docs/PCD_AND_LTV.md`.

Do **not** ban `read_customers` for first listing if new/returning KPIs ship. PCD questionnaire must disclose scopes in use (answers in `docs/APP_STORE_LISTING.md` §PCD).

Refuse: customer PII fields in GraphQL; public “type your .myshopify.com” install on mcflyads.com.

## App URL

Hosted Fly URL only (`https://mcfly-analytics.fly.dev`). Never App URL = marketing site.

## Pricing honesty

Listing sells **one** Shopify App Pricing plan: **Mcfly Analytics** · **$39** · **7-day trial**.  
Not a Free listing. Not forever-free. Not Free Meta+Google / Pro unlocks copy.  
Paste pack: `docs/ops/LISTING_LIVE_PASTE.md`. Listing draft: `docs/APP_STORE_LISTING.md`.

## Webhooks

Compliance + uninstall: bad HMAC → **401**.

## Before claiming submit-ready

```bash
bash scripts/mcfly-compliance-spotcheck.sh
bash scripts/agent-ship-gate.sh
```

Human gates remain: Distribution, PCD submit, install smoke, screenshots (no freemium / no CUSTOM DATA SCIENCE 4.42x hero), plan rename, Partner Save/Submit.
