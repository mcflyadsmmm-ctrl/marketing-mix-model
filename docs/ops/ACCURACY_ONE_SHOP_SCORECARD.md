# One-shop accuracy scorecard

**When:** before any real-data demo claim. This is LIVE_UNPARK_CHECKLIST **step 1 / §4**.  
**Shop:** **one** real Admin shop. SAMPLE-on is fine for the *path*. Live dollars need Live mode.  
**Tip:** `cursor/spend-trust-recurring` · `MCFLY_SAMPLE_ONLY=true` · do **not** flip.  
**Helpers:** `app/app/lib/accuracy-one-shop.ts` (empty vs zero · SAMPLE guards · Admin compare).  
**Not a Live pass:** SAMPLE audits [v336](./ACCURACY_AUDIT_DENSE_v336.md) / [v339](./ACCURACY_DELTA_v339_sample72_customers73.md) / [sample-math](./research/2026-09-16-sample-math-audit.md).

**Do not** unpark Live, change billing, or touch pills / charts / sync from this sheet.

---

## Fill

| Shop | TZ (IANA) | Paid $39? | Stage | Mode | Date |
| --- | --- | :---: | --- | --- | --- |
| ____________ | ____________ | ☐ yes ☐ no | parked / overview_orders / customers / ltv | SAMPLE / Live | ____-__-__ |

**PASS** = every **run** row for this stage is PASS (1–7 + 10; 8–9 only if that stage is unlocked).  
**Do not say “real-data demo”** until 1–7 PASS on **Live**. HOLD is not FAIL.

---

## Glance

| # | Check | Admin | Mcfly | Tip now | Human | Admin $ | Desk | ☐ |
| ---: | --- | --- | --- | :---: | :---: | --- | --- | --- |
| 1 | **SAMPLE contamination** | — | SAMPLE watermark · Spend ledger source | **RUN** | Confirm no mix | | | ☐ |
| 2 | **Kill switch** | — | Settings “Live is parked”; Switch no-ops | **RUN** | Eyes on Settings | | | ☐ |
| 3 | **Shop TZ** | Admin Analytics day | Overview period days | HOLD | Same IANA yesterday | | | ☐ |
| 4 | **Refunds** | Order → refund / cancel | Orders net sales | HOLD | Drop matches Admin | | | ☐ |
| 5 | **Overview sales** | Analytics Overview Total sales (same period) | Overview Total Sales | HOLD | ≈ (tol $1 / 0.5%) · missing LY = **—** not $0 | | | ☐ |
| 6 | **Orders typical** | 10-order median spot-check | Orders typical (median) · average labeled separately | HOLD | ≈ (tol $5 / 10%) · thin = **—** | | | ☐ |
| 7 | **Sync / pending** | — | Pending copy while backfill | HOLD | Not a fake complete year · stable after seal | | | ☐ |
| 8 | **Customers** *(stage ≥ customers)* | Analytics returning-customer **rate** is the contrast | Returning **$** · guests out | HOLD | Dollars, not headcount | | | ☐ |
| 9 | **LTV** *(stage = ltv)* | — | Unpaid: first-90 on file; year **—**. Paid $39: full book | HOLD | Year never $0 on a 90-day book | | | ☐ |
| 10 | **Empty vs zero** | Spend empty / thin shop | Total ROAS **—** · no SAMPLE-as-Live | **RUN** | Never `0.00×` for empty spend | | | ☐ |

On **today’s tip** (freeze on, SAMPLE): fill **1 · 2 · 10**. Rows **3–9** stay HOLD until a human unparks (`MCFLY_SAMPLE_ONLY=false` + stage) — not this PR.

---

## How to run (one shop, ~10 min)

1. Open Mcfly on the shop. Confirm SAMPLE watermark **on** while freeze is on (rows 1, 2).
2. Spend Upload with **no** live spend: Total ROAS is **—**, not `0.00×` (row 10). Thin / missing last year is **—**, not `$0`.
3. Settings: copy still says Live is parked; Switch to Live does nothing.
4. **Stop.** Do not flip Fly flags. Do not compare Snowdevil dollars to Admin (that is a designed miss).
5. After a **human** unpark + Live mode: same period on Admin Analytics vs Mcfly Overview / Orders. Write both dollars. Judge with `compareAdminMoney` / `compareTypicalTicket` (or the tols in the table). Refund: one refunded order, net drop matches Admin.
6. Customers / LTV only after those stages unlock. Returning is **$**, not the Analytics headcount rate. Unpaid LTV year stays **—**.

---

## Tip locks (already PASS in code — not Admin)

| Lock | Proof |
| --- | --- |
| Empty spend → **—** Total ROAS, never `0.00×` | `computeMer` null on spend ≤ 0 · `paintTotalRoas` · `formatMer(null) = "—"` |
| Missing / pending ≠ $0 | `paintHonesty` · YoY missing-prior copy · salesPending holds the ratio |
| SAMPLE ↔ Live sources | `source=sample` vs `shopify_order_v1` / live spend; `judgeSampleContamination` |
| Kill switch | `MCFLY_SAMPLE_ONLY=true` forces stage `parked`; ingest skipped |
| Typical = median; average labeled | Orders hero + Overview peek |
| Returning **$** not headcount | Customers hero / Overview peek |
| Overview paints **zero** spend / ROAS | Overview refuse-list tests |
| SAMPLE MTD MER 3.1–4.0 | Snowdevil math smoke (SAMPLE book only) |

Prior packs: v336 **23/23** · v339 **18/18** · sample-math **7/7**. Those are SAMPLE-desk locks.

---

## Still human Admin eyes

| Must see in Admin | Why code cannot PASS it |
| --- | --- |
| Shop IANA yesterday matches Overview | Needs this shop’s TZ + live orders |
| Refund / cancel net = Admin | Needs a real refunded order |
| Overview Total Sales ≈ Analytics | Needs Live mode on this shop |
| Typical ticket vs 10 real orders | Needs this shop’s book |
| Pending copy during a real backfill | Sync clamp PR not on tip; needs a crawl |
| Live mode: watermark **off**, no `sample:` ledger | Freeze still on — must not flip here |
| Customers returning $ / LTV year — | Needs `MCFLY_LIVE_STAGE` + paid/unpaid truth |

---

## Never

- Flip `MCFLY_SAMPLE_ONLY` from this scorecard.
- Call Snowdevil dollars a Live pass.
- Paint missing last year or empty spend as `$0` / `0.00×`.
- Jump to `ltv` to impress a demo.
- Claim a real-data demo while 3–7 are HOLD.
