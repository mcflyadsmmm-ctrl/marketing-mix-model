# Spend ingest ladder — founder lock (2026-09-09)

**Money truth:** Mcfly’s job is the cash desk. Spend can arrive **without any ad-platform API**. That is a feature, not a bug.

**Companions:** [`PIPE_AUTOMATION_WEDGE.md`](../PIPE_AUTOMATION_WEDGE.md) · [`RELIGION_CHALLENGE_SPEND_CONNECTORS.md`](./RELIGION_CHALLENGE_SPEND_CONNECTORS.md) (verdict **DEFER** on Mcfly OAuth) · merchant how-to [`../ops/money/CSV_CRAFT_PACK.md`](../ops/money/CSV_CRAFT_PACK.md)

---

## Ladder (prefer cheaper rungs first)

| Rung | How spend gets in | Who owns OAuth / refresh | Ship now? |
| --- | --- | --- | --- |
| **0 — Manual desk** | Type one day · paste · CSV upload · bill→daily | Nobody | **YES — core product** |
| **1 — Partner pipe** | SyncWith / Coupler / Supermetrics / Coefficient → **Google Sheet** (daily) → export Mcfly pipe CSV → Spend import | Merchant pays pipe vendor | **YES — Love-5 templates + copy** |
| **2 — Sheet pull** | Same Sheet, Mcfly reads it on a schedule | Still merchant’s pipe + Sheet | **DEFER** (post smoke + demand) |
| **3 — Concierge fill** | Marty / Mcfly ops pastes the merchant’s Ads Manager totals into Spend for them (design partners / outbound closes) | Nobody — human | **YES as ops playbook** — not a Partner-listed service marketplace |
| **4 — Mcfly Meta/Google OAuth** | First-party spend pull | Mcfly | **DEFER** until religion evidence gates pass |

Religion never changes on rungs 0–3: **Total ROAS = Shopify sales ÷ spend entered** (typed, CSV, pipe, or concierge). No pixels / platform ROAS.

---

## Why this beats building SyncWith

- SyncWith-class tools already schedule Meta/Google/TikTok into Sheets. Competing there is scope death ([`COMPETITORS.md`](../COMPETITORS.md)).
- A **daily-updating Sheet** is the merchant’s automation layer; Mcfly stays the **decision layer**.
- Manual day import means offline, billboards, agency fees, and “no API” channels still clear the till — suites often fail here.

---

## Partner posture (no BD required)

Recommend SaaS pipe tools by name in Spend / FAQ / listing (nominative use). Do **not** claim “Works with SyncWith” logos without a deal. Do **not** sell freelancers (Shopify 1.1.14). Merchant pays the pipe vendor; Mcfly stays $39 flat.

Optional later BD: SyncWith / Coupler content collab or affiliate — only with FTC disclosure.

---

## Concierge fill (money wedge for first 10 shops)

For outbound / interview design partners who will not CSV:

1. Merchant shares Ads Manager spend totals (screenshot or export) for closed days.
2. Mcfly ops enters `date | channel | amount` via Spend (or v1 spend API if tokened).
3. Merchant opens Overview — trusted Total ROAS on **their** Shopify sales.
4. Log each concierge shop in `docs/ops/money/FUNNEL_WEEKLY.md` notes — do not invent counts.

This proves the product without APIs and feeds review asks honestly.

---

## Conductor next

1. Ship Love-5 pipe discoverability (rung 1).  
2. Keep Love-3 target honesty.  
3. Docs-only: concierge checklist under `docs/ops/money/CONCIERGE_SPEND_FILL.md`.  
4. Do **not** revive Connections OAuth.
