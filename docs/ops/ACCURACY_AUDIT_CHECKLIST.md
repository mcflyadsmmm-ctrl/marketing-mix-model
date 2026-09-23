# Mcfly Live Accuracy Audit Checklist

**Owner:** Mcfly Live Accuracy (independent — never self-approves craft)  
**Audience:** Galaxy Master + product on Live unpark / post-merge / weekly trust sweep  
**Mode:** Production secrets are `overview_orders` (2026-09-23 America/Denver, recent Fly **~v460**). Do not claim Live PASS until a measured Admin compare. Customers / LTV stay locked.  
**Tip smoke SoT (Galaxy 2026-09-21):** Fly **v403** — historical for that lane. Current runtime is Living Board + SCOREBOARD. No craft / no Fly from this lane.  
**Companion sheets:** `LIVE_SYNC_LAW.md` · `SAMPLE_TO_LIVE.md` · `PASS_BAR.md` · `PRICING_TRIAL_LAW.md` · repo `docs/ops/ACCURACY_ONE_SHOP_SCORECARD.md` · `docs/ops/LIVE_UNPARK_CHECKLIST.md`

**Verdict rule:** PASS only with proof (Admin $ + desk $ + formula/screenshot path). Soft status = failure. HOLD ≠ FAIL. SAMPLE desk audits (v336/v339/sample-math) are **not** a Live pass.

---

---

## First Live shop — run order (one page)

**When:** one real shop. Production stage is already `overview_orders` via Fly secrets. PCD L2 is Approved and `read_reports` is **shipped**; F1–F4 stay **HOLD** until a measured compare (the flag flip is not a parity PASS). Customers and LTV are not unlocked.

| Step | Do | Stop / advance |
| ---: | --- | --- |
| 0 | Fill header (shop · IANA TZ · paid $39? · stage · freeze). Hard refresh. | Wrong tip → stop |
| 1 | **A Preflight** — watermark / kill switch / $39 / refuse list | Any A FAIL → Block Live |
| 2 | Confirm freeze is off and stage is `overview_orders` (not `customers` or `ltv`) | Stage jumped or freeze still on → stop |
| 3 | **B Admin totals** — same period: sales · orders · median typical · one refund · empty≠$0 | Any B FAIL → Block Live; revert freeze |
| 4 | Spot **D sync law** — 1× backfill then incremental; unpaid hard-stop; pending≠year | D FAIL → Block “Live done” |
| 5 | Advance `customers` → **C1–C2** (returning $ · Growth chip) | FAIL → hold stage |
| 6 | Advance `ltv` → **C3–C6** (trial~90d year=— · paid full book · heat honesty) | Year as $0 on 90d → FAIL |
| 7 | **E parity** — no SAMPLE mix; kill switch still works | Contamination → revert |
| 8 | Paste **Result block** to Galaxy Master + product. Claim “real-data demo” only if B+D (+C if unlocked) PASS | Soft status = failure |

**Out of this run:** craft/Fly · Partner paste · inventing metrics · treating the ShopifyQL flag as Analytics parity (F1–F4 still HOLD) · Spend gates order-history PASS.

## Fill header (every run)

| Field | Value |
| --- | --- |
| Date/time (MT) | |
| Shop | |
| Shop TZ (IANA) | |
| Paid $39? | ☐ yes ☐ no (trial/unpaid) |
| `MCFLY_SAMPLE_ONLY` | ☐ true (parked) ☐ false |
| `MCFLY_LIVE_STAGE` | parked / overview_orders / customers / ltv |
| Fly tip / ping | v403 (or named tip) |
| Mode under test | SAMPLE path-only / Live |
| Auditor | Mcfly Live Accuracy |
| Reported to | Galaxy Master + product |

**Block Live / “real-data demo”?** ☐ YES ☐ NO  
**Overall:** ☐ PASS ☐ FAIL ☐ HOLD (stage incomplete)

---

## Painted IA (drive SoT — verify PR #123)

**Top tabs:** Overview → Orders → Customers → Spend → Goals (+ Settings)  
**Customers chips (not top-level):** Growth · LTV  
Older “Growth/LTV as top tabs” copy is stale — do not invent those tabs.

| Surface | URL |
| --- | --- |
| Hosted SAMPLE | `https://mcfly-analytics.fly.dev/demo` |
| Live Fly | `https://mcfly-analytics.fly.dev` |

---

## A. Preflight (always RUN)

| # | Check | PASS | FAIL |
| ---: | --- | --- | --- |
| A1 | Hard refresh; tip matches named Fly (v403 smoke SoT unless Galaxy renames) | Correct tip | Stale thin build |
| A2 | SAMPLE watermark **on** while freeze/parked; **off** in Live mode — never mixed | Source clear | SAMPLE dollars labeled Live / no watermark when SAMPLE |
| A3 | Kill switch: Settings “Live is parked”; Switch no-ops while freeze on | Parked honest | Live arms while freeze on |
| A4 | Pricing chrome (if visible): 7-day trial → **$39 flat** | Matches offer | GMV ladder / contradicted $ |
| A5 | Refuse list on sales desk: no pixels / Meta-ROAS / path-credit / COGS hero | Clean | Banned chrome present |

---

## B. Order totals vs Shopify Admin (stage ≥ overview_orders · Live)

Same period · same IANA shop TZ. Tol: **$1 or 0.5%** unless noted.

| # | Check | Admin source | Mcfly | ☐ |
| ---: | --- | --- | --- | --- |
| B1 | Shop TZ day boundary | Admin Analytics day | Overview period days | ☐ |
| B2 | Overview Total Sales (period) | Analytics Overview Total sales | Overview Total Sales | ☐ |
| B3 | YoY / prior missing | — | Missing LY = **—**, never $0 | ☐ |
| B4 | Orders count (period) | Admin Orders / Analytics | Overview / Orders | ☐ |
| B5 | Typical ticket = **median** | 10-order spot-check | Orders typical (median); average labeled separately | ☐ |
| B6 | Refund / cancel honesty | One refunded/cancelled order net | Orders net sales drop matches Admin; desk does not invent refund | ☐ |
| B7 | Empty vs zero | Thin / pending | Pending copy ≠ fake complete year; thin = **—** not $0 | ☐ |

**B PASS** = B1–B7 PASS on Live. HOLD while parked/SAMPLE-path-only.

---

## C. Customers / Growth / LTV honesty (stage-gated)

| # | Stage | Check | PASS | FAIL |
| ---: | --- | --- | --- | --- |
| C1 | ≥ customers | Returning is **$**, not Analytics headcount rate; guests out | Dollars first-class | Headcount-only / guests as returning |
| C2 | ≥ customers | Growth chip (`/customers?panel=growth`): days-to-second / win-back floors honest; thin = empty not $0 | Honest floors | Fake 0s / invented gaps |
| C3 | = ltv · **trial/unpaid** | Live ingest ~**90 closed days**; year/365 **—** (not on file) | Year withheld | Year painted $0 or full-book claim on 90d slice |
| C4 | = ltv · **paid $39** | Full order-history LTV (backfill once); year only when matured | Full book when sealed | Paid treated as 90d-only |
| C5 | = ltv | Cohort / spend-build / retention heat: un-elapsed = **—**, never fake 0%; refunds never invented | Formula-honest | Fake 0% cells / invented refunds |
| C6 | = ltv | Predictive / lift copy shows formula; no silent wrong LTV | Transparent | Pretty-but-wrong |

---

## D. Cheap-ops sync law (HARD — LIVE_SYNC_LAW + PRICING_TRIAL_LAW)

Prove in product/code or live crawl behavior — not vibes.

| # | Law | PASS evidence | FAIL |
| ---: | --- | --- | --- |
| D1 | **1× historical backfill** per shop (queued, rate-limited) | One-shot then seal; no burst on every tab | Nightly/full periodic re-backfill |
| D2 | After seal: **webhooks / incremental deltas only** | Refresh stable; no second full crawl | Re-pull book on Admin load |
| D3 | **Unpaid/expired: hard-stop sync** | Ingest stops; no free multi-year crawl | Trial still full-history backfill |
| D4 | Trial Live = **~90d** slice; paid = full history | Matches C3/C4 | Trial = full book or paid = 90d |
| D5 | LTV from **rollups/cache** — no recompute-all every open | Open fast after seal | Recompute-all on paint |
| D6 | OAuth / first paint **never awaits** crawl | Pending ≠ $0 | Spinner blocks paint until full history |
| D7 | No IANA TZ → **do not invent days** | Resume when TZ exists | UTC-shifted fake yesterday |
| D8 | Metering / spike alerts (after 1–3) | Alerts wired or explicit HOLD with owner | Silent runaway Fly |

**D blocks “Live done”** until product confirms in code (per LIVE_SYNC_LAW).

---

## E. SAMPLE ↔ Live parity (shadow compare)

| # | Check | PASS | FAIL |
| ---: | --- | --- | --- |
| E1 | Same data contract / formulas SAMPLE vs Live | Deltas explained | Unexplained math drift |
| E2 | Sources never mix (`sample` vs `shopify_order_v1`) | Clean split | Contamination |
| E3 | Kill switch back to SAMPLE if Live lies | Revert path works | No kill / SAMPLE deleted |
| E4 | Until Live accuracy PASS: demos + listing PNGs from **SAMPLE** | SAMPLE screenshots | Fake Live demo shots |

---

## F. ShopifyQL / Analytics parity (`read_reports` + PCD L2)

**L2 Approved (2026-09-23)** and `read_reports` is in toml / Fly `SCOPES`. F1–F4 stay **HOLD** until a measured Admin compare. The flag flip is not Analytics parity. “Waiting on reports” is no longer the gate; an unmeasured clock still is not a PASS.

| # | Check | Admin / ShopifyQL | Mcfly | ☐ |
| ---: | --- | --- | --- | --- |
| F0 | L2 / `read_reports` shipped? | Approved + shipped | F1–F4 still HOLD. Stage is `overview_orders`, not customers/ltv. | ☑ |
| F1 | Total sales same period | ShopifyQL / Analytics | Overview | ☐ |
| F2 | Orders / AOV same basis | Analytics | Overview / Orders | ☐ |
| F3 | Returning $ vs any Analytics contrast documented | Note headcount vs $ | Desk stays $ | ☐ |
| F4 | Refund/net basis aligned | Analytics net | Desk net | ☐ |

---

## G. Spend (optional — never gates order-history PASS)

| # | Check | PASS | FAIL / SKIP |
| ---: | --- | --- | --- |
| G1 | Empty spend → Total ROAS **—**, never `0.00×` | Honest empty | 0× on empty |
| G2 | Overview has **zero** spend/ROAS/MER | Clean | Spend on Overview |

---

## Progressive unpark gate (SAMPLE_TO_LIVE)

Do not jump stages to impress a demo.

| Step | Stage | Must PASS before advance |
| ---: | --- | --- |
| 1 | Path while parked | A1–A5 · E2 · G1–G2 (SAMPLE path OK) |
| 2 | Human unpark → `overview_orders` | B1–B7 · D applicable |
| 3 | → `customers` | C1–C2 |
| 4 | → `ltv` | C3–C6 · D3–D4 |
| 5 | “Real-data demo” claim | B + applicable C + D PASS |
| 6 | ShopifyQL claim | F1–F4 measured. L2 + `read_reports` are already shipped; the flag is not a PASS. |

**Revert any time:** `MCFLY_SAMPLE_ONLY=true` and/or `MCFLY_LIVE_STAGE=parked`.

---

## Anti-jobs (this auditor)

- No Partner paste / App Store submit  
- No send without Marty approve  
- No craft / Fly deploys  
- No inventing metrics or Partner install/review counts  
- No COGS / pixels / Meta-ROAS lane  
- No career / off-Shopify  
- Never self-approve craft (Mcfly Reviewer grades craft; this lane grades **trust numbers**)

---

## Result block (paste to Galaxy Master + product)

```text
Result:
Live Accuracy Audit — Mcfly
Date/time (MT):
Shop / TZ:
Paid $39?: yes | no
Stage / freeze:
Fly tip:
A Preflight: PASS | FAIL
B Admin order totals: PASS | FAIL | HOLD
C Customers/Growth/LTV: PASS | FAIL | HOLD
D Sync law: PASS | FAIL | HOLD
E SAMPLE↔Live parity: PASS | FAIL | HOLD
F ShopifyQL/L2: PASS | FAIL | HOLD
G Spend empty honesty: PASS | FAIL | SKIP
Block Live / real-data demo?: YES | NO
Overall: PASS | FAIL | HOLD
Proof (Admin $ · desk $ · screenshot paths · formulas):
Notes (1–5 lines):
```

**If B or D = FAIL → Block Live = YES.** Product fixes → redeploy → re-run. Auditor does not ship the fix.
