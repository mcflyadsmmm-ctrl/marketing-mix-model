# Niche viability — critical read (2026-09-23)

**Question:** Is order-history analytics + cash Total ROAS a real need, and can Mcfly make money — or are we building a suite too big for the profitable wedge?

**Honest answer:** The **need is real**. The **current product shape is too big** for what is most profitable at $39 with 0 reviews. Viability is not “quit the niche”; it is “sell one morning job that works on day one, then earn Spend.” Fly is **capable** — it is not the bottleneck.

**Sources:** Prior pack `03`/`08`/`09`/`11` · live listing audit · Marty Live Admin screenshots 2026-09-23 · public competitor cards (Lifetimely ~4.9/537 @ $49+ order bands; Polar from $750 GMV; Peel from ~$199–$499; native Analytics free). Mcfly reviews remain **0** — do not invent installs.

---

## 1. Is there a real need?

**Yes — three paid jobs survive contact with evidence:**

| Rank | Job merchants will pay for | Evidence | Free Shopify already? |
| ---: | --- | --- | --- |
| 1 | **Typical (median) ticket + timing** without export | Community median AOV threads; Shopify AOV education admits mean ≠ typical; operators still Sheets it | Mean AOV only; hour/DOW buried |
| 2 | **Returning $ vs new $** (not headcount rate) | Native Overview = rate; returning-$ often plan-gated / export | Partial / buried |
| 3 | **Cash MER / Total ROAS** = Shopify sales ÷ **typed** spend | MER playbooks; entire industry of “Meta ROAS ≠ Shopify” reconciliation sheets | No spend ledger |

**Jobs that look like demand but are traps at $39:** path attribution / “true ROAS”, AI analyst, sessions/conversion hero, full COGS P&L, Amazon/warehouse BI. Those buyers already pay Triple Whale / Polar / Lifetimely Profit — different ASP, different install wall.

**White space (still true):** flat **$39**, Shopify-order-book first, empty spend = **—**, no pixel day-one. Lifetimely starts paid ~$49 with order cliffs; Peel jumps to hundreds; Polar ~$750+. Nobody owns “calm morning order desk that is honest before spend” as a *tiny* product.

---

## 2. Critical challenge — are we building the wrong size?

**Yes. Scope inflation is the profit risk, not the niche.**

What a profitable wedge needs:

```
Day 1 (≤60s): typical order + returning $  [orders only]
Day 7–30:     type spend → Total ROAS      [chapter two]
```

What we actually shipped (cognitive load):

```
5 top pills + panel rails (Returning/LTV/Growth/Depth)
+ MorningHabitStrip pills
+ Goals as peer tab
+ Shareables / RFM / whales / CPA / allocation / dual-close / pacing
+ Triple trust banners + engineer copy on Live empty
+ Dual ingest paths (OrderFact vs SalesDayFact / reports scope story)
```

**Result:** SAMPLE can look dense; Live Admin looks like a broken BI suite. That is an uninstall machine. Research `11` already ranked wants 7–13 as “maybe / trap.” We built toward 7–13 anyway.

**Thesis to kill or park for profitability:**

| Keep (wedge) | Park / delete until wedge pays |
| --- | --- |
| Home: median + returning $ + one chart when data exists | Goals as top tab |
| Spend: enter spend → Total ROAS (— not 0×) | Panel rails, habit pill rows |
| One pending breath | RFM / whales / shareables farm |
| 90d trial / 24mo paid honesty | CPA / allocation / dual-close as first-fold peers |
| Listing = sales-quality desk | Listing = ad spend sermon |

---

## 3. Can this be profitable?

**Path exists if — and only if — the wedge converts.**

Rough economics (illustrative, **not** forecasts; no invented installs):

| Paid stores @ $39 | Gross MRR | Notes |
| ---: | ---: | --- |
| 10 | $390 | Barely proves habit |
| 50 | $1,950 | Founder oxygen if churn low |
| 100 | $3,900 | Real micro-SaaS |
| 250 | $9,750 | Serious if retention holds |

**What must be true:**

1. **Day-1 paint from orders** on Live (not SAMPLE theater) — or nobody stays for Spend.
2. **Listing sells job #1–2**, not spend-first (live card still spend-led per `09`).
3. **Reviews** — 0 reviews at $39 is a trust tax; founders of Lifetimely-class apps win on proof + habit, not feature count.
4. **Support path** — wrong total + silence = churn.
5. **Churn < feature ambition** — every extra tab raises support surface and lowers “I know what this is.”

**What is false comfort:** “Enterprise” five-tab desk, Analytics Total Sales parity pre-L2, competing with Polar/TW on breadth.

**Competitor ASP reality:** Merchants who want P&L/LTV depth already pay Lifetimely $49–$299+. Merchants who want attribution pay $200–$750+. Mcfly’s only profitable lane is **the operator who will not pay that** but will pay $39 to stop exporting for median + returning $ + typed MER.

---

## 4. Is Fly the wrong host?

**No. Fly is fine for this product.**

Probe 2026-09-23: `mcfly-analytics` **deployed**, `/health` `ok` + `db:up`, machines in `iad`, marketing root **301 → mcflyads.com**. Remix+Prisma+Postgres on Fly is a normal Shopify app shape.

What Live screenshots show (“0 of 22 days”, “0 of 731”, “reports scope / sales totals ingest”) is **product/ingest UX and scope strategy**, not “Fly cannot host analytics.” Moving to Vercel/Render/Heroku does not fix triple banners, five pill rows, or empty-book theater.

**Real infra risks (later, not tonight):** worker throughput for busy shops, job queue visibility, cost at scale. None of those explain today’s uninstall face.

---

## 5. Recommendation (profit-first scope)

### Ship the **Minimum Habit App**

1. **Home** — one status if loading; else typical order + returning $ + one sales chart. No panel rails. No Goals tab.
2. **Spend** — typed/CSV spend → Total ROAS. Empty = —.
3. **Customers** — only if it is the returning-$ home; otherwise fold returning $ onto Home and delete the tab until paid retention proves need.
4. **Listing + SAMPLE** sell Home, not ROAS gauges.
5. **Stop** building RFM/Goals/CPA until 10 honest reviews or one organic FUNNEL week with paid conversions.

This aligns with `DESK_REBOOT_PLAN.md` (3 tabs + pending religion) and contradicts “finish the suite.”

### Viability verdict

| Question | Verdict |
| --- | --- |
| Is the niche a need? | **Yes** (median, returning $, typed MER) |
| Is current Mcfly the profitable form? | **No** — too wide |
| Can a thinner Mcfly be profitable? | **Yes, if** day-1 Live works + listing matches + reviews |
| Is Fly the problem? | **No** |
| Should we abandon the niche? | **No** — abandon suite bloat |

---

## 6. Marty decisions (only)

- Accept “Minimum Habit App” scope (park Goals/Depth/RFM/CPA as product) — or reject and keep suite.
- Listing Save to sales-first paste.
- Unpark only after Live Home paints orders without banner farm.

Cursor continues reboot T0→T1 against this wedge unless Marty rejects.

Canvas: `niche-viability.canvas.tsx`.
