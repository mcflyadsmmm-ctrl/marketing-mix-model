# Transparency + ease fleet — Implementation Plan

> **For agentic workers:** REQUIRED: execute **sequentially on this branch**. Do **not** spawn parallel agents that share one worktree (they overwrite each other). Product SoT: [`STRATEGY.md`](../../../STRATEGY.md). Shopify: `.cursor/skills/mcfly-shopify-compliance/SKILL.md`.

**Goal:** Make Mcfly the Admin desk where the number is an **invoice next to Shopify**, with the formula, limits, and price rules visible — so merchants fleeing modeled ROAS, GMV taxes, and spreadsheet drift can trust it in under 10 minutes.

**Architecture:** Client-safe copy + equation helpers (`number-honesty.ts`, `implied-spend-ceiling.ts`) feed one Overview formula panel, Spend invoice language, Settings/Pro billing honesty, LTV/Goals captions. No pixels, MTA, COGS, or Level 2 PII.

**Tech Stack:** React Router 7 embedded Admin app, Vitest, Shopify App Pricing — one plan, $39/store/mo after a 7-day trial, Fly `mcfly-analytics`.

## Global Constraints

- App URL stays `https://mcfly-analytics.fly.dev`.
- Listing paste (short/long/features/captions) must **not** include `$` / `$39` / `Free.` as a sentence.
- Upgrade must leave the embed (`_top`). Never load `admin.shopify.com` in the iframe (2.1.1).
- No pixels, MTA, “true ROAS,” anti-pixel sermons, or TrueProfit/Triple Whale name-calling in merchant chrome.
- PCD Level 1 only. LTV stays opaque id + orders.
- Free = all `SPEND_CHANNELS` + typed extras. Pro = LTV + full Goals only.
- Standing Fly grant: after `SKIP_HEALTH=1 bash scripts/agent-ship-gate.sh` PASS, `fly deploy -a mcfly-analytics --yes`.
- Imports at top of files. Exhaustive `switch` on unions uses `never`.

## Research this fleet implements (steal these jobs only)

| Merchant frustration | We ship | We do **not** ship |
| --- | --- | --- |
| Modeled channel ROAS ≠ Shopify books | Visible equation: Shopify Total Sales ÷ spend you added | Pixel / MTA / “true ROAS” |
| OOH, retainers, creator cash missing from ad APIs | Invoice-language Add spend + Agency retainer preset | Required Meta OAuth |
| GMV ladders, order overage, 12-month locks | In-app: $39 flat, not % of sales, not per-order | Changing Partner price |
| Cancel/billing fog | Uninstall/switch-to-Free stops **next** cycle; current cycle may charge | Pretending Shopify will refund mid-cycle |
| Sheet / CSV as the only path | Empty states + Overview CTAs deep-link `#mcfly-spend-add` | Removing CSV |
| LTV/Goals look like magic | Cohort ≠ Cash CAC; ceiling = sales ÷ target | Predictive / channel LTV, COGS P&L |

## Files

| File | Responsibility |
| --- | --- |
| `app/app/lib/number-honesty.ts` | Copy SoT + `formatTotalRoasEquation` + spend-add href |
| `app/app/lib/number-honesty.test.ts` | Copy contracts (no true ROAS, no anti-pixel lead, equation) |
| `app/app/components/NumberHonestyPanel.tsx` | Overview formula board (listing shot 2) |
| `app/app/lib/implied-spend-ceiling.ts` | Ceiling captions (period sales vs sales goal) |
| `app/app/lib/entitlements.ts` | `BILLING_HONESTY` |
| `app/app/lib/billing-flag.server.ts` | Settings detail mentions flat fee + cancel |
| `app/app/components/ProUpsellBlock.tsx` | Flat-fee + cancel in details |
| `app/app/routes/app._index.tsx` | Panel, empty copy, `#mcfly-spend-add` |
| `app/app/routes/app.spend.tsx` | Invoice copy |
| `app/app/lib/spend-custom-channel.ts` | Agency retainer preset |
| `app/app/lib/contrib-ltv.ts` | LTV not predictive / not by ad |
| `app/app/routes/app.goals.tsx` | Period ceiling caption |
| `app/app/routes/app.settings.tsx` | Billing honesty paragraph |
| `app/app/styles/mcfly-desk.css` | Formula panel |
| `docs/APP_STORE_LISTING.md` | What the number is not (no `$`) |
| `STRATEGY.md` | Transparency track |

## Fleet rule (do not ignore)

Parent implements **one task at a time** on `cursor/transparency-ease-2ae5`. Parallel Task subagents on the same worktree **delete each other’s files**.

---

### Task 1: Number honesty SoT

**Files:**
- Create: `app/app/lib/number-honesty.ts`
- Create: `app/app/lib/number-honesty.test.ts`
- Create: `app/app/components/NumberHonestyPanel.tsx`

- [ ] **Step 1:** Add failing tests for equation + copy bans (`true ROAS`, leading `pixel`, competitor names).
- [ ] **Step 2:** Implement `NUMBER_HONESTY`, `SPEND_ADD_HREF`, `formatTotalRoasEquation`.
- [ ] **Step 3:** Implement `NumberHonestyPanel` (equation + is/is-not; empty spend line if spend ≤ 0).
- [ ] **Step 4:** `cd app && npx vitest run app/lib/number-honesty.test.ts`

### Task 2: Overview + Spend ease

**Files:**
- Modify: `app/app/routes/app._index.tsx`
- Modify: `app/app/routes/app.spend.tsx`
- Modify: `app/app/lib/product-labels.ts` (`spendJob`)
- Modify: `app/app/lib/spend-custom-channel.ts` (Agency retainer)
- Modify: `app/app/styles/mcfly-desk.css`
- Modify: tests that assert Overview/Spend copy

- [ ] Hero “Logged via CSV” → spend you added.
- [ ] Primary spend links → `/app/spend#mcfly-spend-add` (keep CSV hash for coverage-hole banners).
- [ ] Empty: add one day (invoice amount), CSV secondary; margin optional.
- [ ] Add spend muted line: invoice / billboard / retainer.
- [ ] Preset: Agency retainer.

### Task 3: Billing + LTV + Goals captions

**Files:**
- Modify: `app/app/lib/entitlements.ts`
- Modify: `app/app/lib/billing-flag.server.ts`
- Modify: `app/app/components/ProUpsellBlock.tsx`
- Modify: `app/app/routes/app.settings.tsx`
- Modify: `app/app/lib/contrib-ltv.ts` + `ltv-sales-spine.test.ts`
- Modify: `app/app/lib/implied-spend-ceiling.ts` + `sales-goals.test.ts`
- Modify: `app/app/routes/app.goals.tsx`

- [ ] In-app: $39 flat, not % of sales, not per-order.
- [ ] Cancel: Shopify bills; Free/uninstall stops **next** cycle.
- [ ] LTV caption: not predictive, not by ad, not email CRM.
- [ ] Period spend ceiling caption uses period **sales** ÷ target (honest vs month **goal** ÷ target).

### Task 4: Listing + STRATEGY (no `$` in paste)

**Files:**
- Modify: `docs/APP_STORE_LISTING.md` long + features
- Modify: `STRATEGY.md`
- Modify: `app/app/lib/app-store-listing-compliance.test.ts` if new phrases need locks

- [ ] Long: what Total ROAS is not (platform ROAS, net profit, which ad).
- [ ] Features: “spend you added — not platform ROAS”.
- [ ] STRATEGY: transparency track.

### Task 5: Ship

```bash
SKIP_HEALTH=1 bash scripts/agent-ship-gate.sh
fly deploy -a mcfly-analytics --yes
```

Commit, push, PR against `cursor/enhance-desk-fleet-2ae5`.
