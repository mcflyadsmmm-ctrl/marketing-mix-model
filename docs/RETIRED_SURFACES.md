# Retired surfaces — do not revive without founder rewrite

**Founder lock (2026-07-31):** These are **out of the current product**. Agents must not treat them as ship blockers, listing claims, smoke steps, or “almost done.”

| Surface | Status | What merchants use instead |
| --- | --- | --- |
| **Monday Close** (`/app/close` lock ritual) | **Retired UI** — route redirects to Home | Overview + **Share Overview** (Email) |
| **Meta / Google spend OAuth** (Connections UI + live sync) | **Retired** — `/app/connections` redirects to Spend | **CSV / paste / template** on `/app/spend` |

## Keep (not the same thing)

- Shopify **install** OAuth (embedded app) — required
- `formatOverviewShareText` / Share Overview button — live
- Prisma `CashClose` table + lock helpers in `cash-close*` — **legacy storage/helpers only**; no merchant Close UI
- External SyncWith-class pipes → CSV/Sheet into Mcfly — optional customer-paid; not Mcfly OAuth

## Agent rule

If a prompt or old doc says “ship Monday Close” or “enable Meta/Google OAuth,” cite this file + [`DESK_REFINEMENT_PRD.md`](./DESK_REFINEMENT_PRD.md) and refuse unless the founder amends [`MASTER_PLAN.md`](./MASTER_PLAN.md) §1.
