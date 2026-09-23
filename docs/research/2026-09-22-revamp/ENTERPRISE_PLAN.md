# Enterprise plan — updated after the 2026-09-23 handoff

A multi-million-dollar Shopify store is ready for Mcfly when the morning number is true at their order volume, the trial promise matches billing, and the site, listing, and desk sell one product. Flat **$39**. Total ROAS = sales ÷ entered spend. Empty spend is **—**. No pixels, no MTA, no second enterprise SKU.

**Not this plan:** attribution, ad OAuth, GMV pricing, SSO, or a ShopifyQL-parity claim while PCD Level 2 is pending.

**Trust order:** a live probe on this Mac beats this file, and this file beats the 2026-09-23 handoff email and the Living Board until the board is restamped. The email restates the 8 Sep map. Several of those lines are already closed.

## What the handoff got right

- Listing reviews are **0**. No install count.
- Public card title is already **Mcfly Analytics**, **$39**, 7-day trial. The “rename Pro / delete Free” leftover looks done on the public card.
- The card still leads with ad spend. The site leads with Overview, then Orders, then Customers.
- Snowdevil sample, frozen 1–16 Sep 2026: this month **$68,457** vs last year **$69,891**, typical order **$631**, returning **$45,409**, weekend **23%**, entered spend **$19,023**, Total ROAS **3.60×**. Harbor and Northline stay off the home hero.
- Trial history is **90 days**. Paid history is up to **24 months**.
- Search Console flagged sitemap URLs on mcflyads.com as “Page with redirect” on 16 Sep. Not rechecked in that email.
- `support@` MX was still open on 8 Sep and was not rechecked.
- Drive sharing to mcflyadsmmm@gmail.com did not happen. The agency folder stays on the personal Gmail until Marty shares it. That folder is the old agency, not the app spec.

## What the handoff could not see

| Email said | This Mac shows |
| --- | --- |
| Work in `mcfly-analytics/` on `cursor/ads-readiness-mac`. Do not Fly-deploy `marketing-mix-model`. | Ship tree is `marketing-mix-model/` on `cursor/spend-trust-recurring` at `5b33d67`. Never Fly-deploy `cursor/clean-revamp-v8`. |
| Pull request #43 was open. | **#43 merged 9 Sep 2026.** Ads in that pack stay NO. |
| Could not tell if Fly was redeployed after 8 Sep. | Fly `mcfly-analytics` version **445**, `/health` ok, Live **parked** (`MCFLY_SAMPLE_ONLY=true`). |
| Fly root might be the marketing site. Reconcile. | Confirmed 23 Sep: `https://mcfly-analytics.fly.dev/` returns site **v42** (“Deeper Shopify numbers…”). Marketing belongs on mcflyads.com. |
| Living Board outranks the email. | The board still says site v30 and Fly 396. Probe wins until a publish restamps it. |
| Empty Drive folder “Mcfly Analytics” created 23 Sep. | Empty. The product record is the Mac tree plus the handoff email, not that folder. |

## Mistakes to keep

| Mistake | Rule now |
| --- | --- |
| First spec defended the current face | Hostile read before any publish. `REVAMP_SPEC.md` stays superseded. |
| Four frontier agents at once | One Grok judgment pass. Composer implements. A second model only when two briefs disagree. |
| Visual audit ran twice; curl pass replaced the browser pass | One audit. Do not restart a lane into a thinner method. |
| Site stamped v31 while live was v42; v42 source is not in git | Next site stamp is **v43** or higher. Probe live version before Pages. |
| Desk summary used **$108,666** | That figure is a unit-test sentence. Snowdevil lock stays **$68,457**. |
| Listing paste and Overview coverage say 24 months as if that is the trial | Trial Live ingest is **90 closed days**. Paid order rows go to **24 months**. |
| PCD L2 and “need 3 reviews” froze shipping | L2 blocks only Analytics-matched clocks. Reviews are founder outreach. |
| Living Board / `EXECUTION.md` still say v30 and Fly 396–401 | Probe wins. Restamp only after a real publish. |
| `salesPending` can blank order-book stats; legacy zero `SalesDayFact` rows look certified | Order book paints when `OrderFact` exists. Legacy zero rows are gaps. |
| Site sells median Overview; live listing sells Total ROAS | One job: orders first, spend second. |
| Pages project `marty-smithson` and git `origin-alt` sit next to the ship path | Publish only Pages `mcflyads` from `marketing-mix-model` on `cursor/spend-trust-recurring`. |

## What “enterprise” means here

Order-fact backfill is chunked: up to **7 closed days** and **40 pages** per run, then it resumes. A busy store will not finish 24 months in one request. The desk must show days on file and “still loading — not $0.” Webhooks keep today moving while history catches up. That is the volume bar. A false complete year of zeros is an uninstall.

## Sequence

1. **Listing truth (Marty Save).** Correct `docs/ops/LISTING_LIVE_PASTE.md`: trial 90 days, paid up to 24 months, orders-first tagline, reviews stay 0. The public price name is already Mcfly Analytics. The body is still the spend sermon. Cursor does not Submit.
2. **One first screen, still local.** Overview hero is this period vs last year **from orders**. Spend off that fold. Coverage line states trial vs paid. Sample still is the Snowdevil lock above. Site hero matches that still. Do not Pages-deploy or Fly-deploy until both match.
3. **Volume honesty in the same publish.** Resume copy for a long backfill. `salesPending` does not blank median, returning dollars, or weekend. Legacy zero day-facts are not certified sales. Analytics Total / Net / Gross stay **—** until Level 2.
4. **Publish once, two hosts with two jobs.** Pages project `mcflyads` gets the site (stamp **v43** or higher). Fly from this Mac on `cursor/spend-trust-recurring` gets the app. `fly.dev/` stops serving the marketing homepage. Then restamp Living Board to the versions actually live. Check the Search Console “Page with redirect” URLs in that same site publish.
5. **Human when the number is wrong.** `support@` MX. A large store’s uninstall reason is a wrong total and no reply, not a missing pixel.
6. **Level 2, when Shopify approves.** Only then may a clock say it matches Analytics. Until then the label stays “From orders.”

Live stays parked until Marty unparks. Ads stay off. Founder outreach to the five stores is the review path. Sharing the old agency Drive folder is Marty’s click and is off this sequence.
