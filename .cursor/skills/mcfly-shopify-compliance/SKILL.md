---
name: mcfly-shopify-compliance
description: >-
  Shopify App Store compliance + PCD scope religion for Mcfly Analytics.
  Use when editing scopes, privacy, listing, PCD answers, webhooks, or App Store submit docs.
---

# Mcfly Shopify compliance

## Scopes (current Truth MVP)

Allowed in `shopify.app.toml` / Fly `SCOPES`:

- `read_orders` — Shopify sales totals for cash MER
- `read_customers` — **minimal only**: opaque customer `id` + `numberOfOrders` to classify new vs returning. No name, email, address, phone, or CRM.

Do **not** ban `read_customers` for first listing if new/returning KPIs ship. PCD questionnaire must disclose both scopes (answers in `docs/APP_STORE_LISTING.md` §PCD).

Refuse: `read_all_orders` unless explicitly decided later; customer PII fields in GraphQL; public “type your .myshopify.com” install on mcflyads.com.

## App URL

Hosted Fly URL only (`https://mcfly-analytics.fly.dev`). Never App URL = marketing site.

## Pricing honesty

Listing **Free** until Shopify Billing ships. Site must not claim forever-free or contradict Free listing.

## Webhooks

Compliance + uninstall: bad HMAC → **401**.

## Before claiming submit-ready

```bash
bash scripts/mcfly-compliance-spotcheck.sh
bash scripts/agent-ship-gate.sh
```

Human gates remain: Distribution, PCD submit, install smoke, screenshots, Partner Submit.
