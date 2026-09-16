# PASTE THIS into a new Cursor Agent chat

**Workspace:** `/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model`  
**Branch:** current `cursor/spend-trust-recurring` (never `cursor/clean-revamp-v8`)  
**You are:** one cook. Mcfly Analytics Conductor. You build a **useful, dense Shopify app**. You do not run a four-agent omit fleet. You do not write more niche research.

Marty already did the research. The failure was execution: too many cooks, too many “forbidden craft” rules, a pamphlet desk nobody would download. Your job is to **save the idea** by executing **one plan**.

---

## 0. Read only these (in order)

1. `docs/LIVING_BOARD.md`
2. `docs/plans/2026-09-10-save-the-desk.md` ← **SoT. Outranks punch lists and “no tile zoo.”**
3. `docs/ops/research/2026-09-10-independent-insights.md` ← absorb thesis only; do not add rows
4. This prompt

If an older file (world-class-punch, favorite-analytics-conductor, “omit sparse,” “explorer closed”) contradicts the save plan, **the save plan wins**. Founder’s latest message still outranks everything.

## 1. Job (one sentence)

Make Overview a **scoreboard a brand would screenshot**: Shopify Total Sales, Total ROAS beside it **when they entered spend**, KPI cards, chart visible — then Orders / Buyers / Timing as readable cards, Marketing as type-a-day then mix. Works at $0 spend without looking broken. $39 after 7-day.

## 2. Hard locks (only these)

- Total ROAS = Shopify Total Sales ÷ **entered** spend. Never paint `0.00×` for empty spend.
- No pixels, MTA, true ROAS, Meta/Google OAuth, in-app AI, `read_all_orders` as the product.
- Scopes: `read_orders` + opaque `read_customers`. No email/name/address/SKU in GraphQL.
- Listing: `https://apps.shopify.com/mcfly-analytics-public`. Cursor does not Submit. Do not invent reviews or install counts.
- App URL stays `https://mcfly-analytics.fly.dev`.

## 3. Craft unlock (must)

- KPI **cards** are the product. Accordion-only FAQs are the bug.
- Chart **open** on Overview (sales line at $0 spend; spend series when spend exists).
- Steal visual density from live `https://mcflyads.com/demo` (pair KPIs, card row, coverage). Do **not** bring back Mix / Close / Monday as primary nav.
- SAMPLE on must look rich. Live thin shops may omit a card when n is too small — never fake 0.0%.

## 4. How to work

- One chat. Execute Task 1 → 5 in `docs/plans/2026-09-10-save-the-desk.md`.
- Do **not** spawn Site + Listing + Desk + Ops in parallel for this. If you use Task, **one** helper, exclusive files, no Fly.
- Do **not** commit unless Marty asked. You **do** `bash scripts/agent-ship-gate.sh` then `fly deploy -a mcfly-analytics --yes` after Task 1–3 (desk). Stamp Living Board.
- After each slice: what a merchant **sees** now that they couldn’t.

## 5. Stop and ask Marty only for

Partner Submit · listing screenshot upload · ads budget · MX · unparking Sample \| Live · widening scopes.

## 6. Start now

Task 1 in this session. Do not reply with a plan-only essay. Report Fly version, files, and “would I download this?”
