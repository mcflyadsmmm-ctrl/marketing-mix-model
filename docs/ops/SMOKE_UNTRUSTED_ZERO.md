# Smoke — untrusted $0 sales trust gates (human, ~6 min)

**Goal:** Prove Overview and Allocation refuse to hero a fake `0.00×` /
"below break-even" while the Shopify sales numerator is still filling.
**Host:** https://mcfly-analytics.fly.dev (open from Admin, not the bare Fly URL)
**Store:** devmcflyads — **Demo → sample desk OFF** before judging any number.

Run this after a deploy, before asking anyone to review the desk. No deploy step
here; this is read-only clicking.

## Setup

1. Settings — profit margin saved, so break-even exists.
2. Spend — at least a few days of real daily spend in the selected period.
3. Pick **MTD** first; repeat the untrusted case on **QTD** for the
   period-uncovered variant.

## A. Untrusted $0 sales with live spend

Reproduce by opening a period whose `SalesDayFact` rows have not landed (fresh
install, or right after a scopes grant while the worker is stopped).

- [ ] **Overview** — the gauge is replaced by a warning banner reading
      *"Not 0.00 — sales for this period are still loading"*. No `0.00×` anywhere
      in the hero.
- [ ] **Overview** — the verdict card headline is
      *"Sales facts still loading — not a trusted multiple"*, tone blocked.
- [ ] **Overview tiles** — Total ROAS `—`, Sales `—`, Spend shows the **real**
      dollar amount, Break-even shows the set multiple. Sales must never read
      `$0.00`.
- [ ] **Allocation** — a warning section (`aria-label="Sales facts still
      loading"`) explains the lock and offers *Refresh Spend Allocation* /
      *Open MTD*.
- [ ] **Allocation** — **no** "Advice · hold / reduce / step-test" section and
      **no** "% Allocation" section. Nothing suggests a portfolio cut.
- [ ] Neither page prints "below break-even" or a `-50%` cut chip.

## B. Empty spend

Clear spend for the period (or pick a period with none).

- [ ] **Overview** — verdict headline is *"Total ROAS needs spend next to
      sales"*; no `0.00×`, no break-even call.
- [ ] **Allocation** — spend-trust lock or the add-spend empty state, not advice.

## C. Loading

- [ ] Switch periods with the period control. The "Refreshing…" state shows and
      the previous period's numbers stay on screen — no flash of `$0` / `0.00×`.

## D. Do not over-gate (regression guards)

These must still work, or the gate is too wide:

- [ ] **Confirmed quiet period** — a period with real spend, genuinely zero
      orders, and a live Admin probe that saw orders outside the range still
      shows a numeric `0.00×` and its honest below-break-even verdict.
- [ ] **Real below break-even** — sales present and under break-even still
      renders *"No — below break-even (x.xx× vs y.yy×)"* plus the cut advice.
- [ ] **SAMPLE desk ON** — Harbor practice numbers still paint fully, stamped
      SAMPLE, on both Overview and Allocation.

## If a check fails

Grab the period preset, the shop domain, and whether spend coverage was
complete. The gate inputs are `salesUntrustedZero`, `factsIncomplete`
(`salesFactsIncompleteForDesk`), and `metrics.totalSpend`; Allocation combines
them in `salesUntrustedForAdvice`.
