# App Store Ads — go live checklist

**Status: NOT SAFE.** Do not turn on App Store Ads at $20/day until every gate below is green.

**Not safe to turn on App Store Ads at $20/day until smoke PASS + 3 reviews + organic week row + P0 on Fly.**

Listing: https://apps.shopify.com/mcfly-analytics-public  
Product PR: https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/41  
Dev store: https://admin.shopify.com/store/devmcflyads

---

## Gates (all required)

| # | Gate | Who | Green when |
| --- | --- | --- | --- |
| 1 | P0 merged | Marty / Conductor | [#41](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/41) merged into `redesign/enterprise-desk` |
| 2 | Fly deploy | Marty / orchestrator | Production build includes #41. **Not** `cursor/clean-revamp-v8`. |
| 3 | Cold smoke PASS | Marty on `devmcflyads` | [`SMOKE_APP_STORE_ADS.md`](./SMOKE_APP_STORE_ADS.md) — trusted Total ROAS in <10 min, SAMPLE off, no fake 0.00 + Below break-even |
| 4 | ≥3 honest reviews | Marty (orchestrator may add soft in-app ask after trusted Total ROAS only) | Live listing shows 3+ reviews. **Never incentivize.** |
| 5 | Organic week pasted | Marty | One completed week in [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md) — visits / installs / trials. Do not invent. |

If any row is red, ads stay off. Same-day uninstall is the enemy. Ads amplify the first 10 minutes.

---

## Ramp (only after all gates green)

| Day | Cap | Rule |
| --- | --- | --- |
| 1–3 | **$20/day** | Search ads only. Land on the listing URL. Watch installs and same-day uninstalls daily. |
| 4+ | **$40/day** | Only if days 1–3 same-day uninstall **≤40%** and at least one install occurred. |

Do not jump to $40 on day 1. Do not run Meta/Google first.

---

## Kill switch (pause the same day)

Pause App Store Ads if **any**:

- Same-day uninstall **>40% for 3 consecutive days**
- A keyword has **clicks and zero installs** after a meaningful sample (kill that keyword)
- Overview heros **0.00× + Below break-even** with spend on the desk and Admin orders in the period (P0 regression — fix before more spend)
- Listing is unpublished or 4.3.3 / trademark blocked

How to pause: Partner Dashboard → App Store ads → pause campaign. Cursor does not click this.

---

## Residual risks (honest)

- **CSV homework** — merchants who never add spend never see Total ROAS. Ads cannot fix that; Spend ritual must stay one path.
- **Fly worker ticks** — `scopes_update` only enqueues. Page-open sync-fill + bounded MTD probe must save the first session. Worker-up is still good for the 4-year tail.
- **Poisoned $0 `SalesDayFact` rows** — exist on shops that backfilled under `test:false`. #41 overwrites on grant / page-open. Until Fly has #41, live desks can still lie.
- **Review seeding is human** — no discounts, no “please leave 5 stars.”
- **0-review listing conversion** — ads inherit the listing. Fix hero 4.42x / CUSTOM DATA SCIENCE in Partner if still live.
- **Same-day uninstall already high** (founder snapshot ~11/12). Ads will scale that unless smoke is green.

---

## Founder leftover after ads are actually on

1. Paste Partner numbers into FUNNEL_WEEKLY every Monday (America/Denver).
2. Kill zero-install keywords weekly.
3. Do not raise cap above $40 until a week of $40 has stable uninstall.
