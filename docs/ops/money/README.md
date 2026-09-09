# Money / ads execution (this worktree)

Product execution for **Mcfly Analytics** lives in this git worktree:

`/Users/martysmithson/Documents/MCFLY ANALYTICS APP/mcfly-analytics`

Branch: `cursor/ads-readiness-mac` on `origin/redesign/enterprise-desk` (P0 [#41](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/41) + [#42](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/42) merged). Fly **v191** deployed Wave 2; P0 gate stays RED until Admin smoke Record PASS (not curl). See [`WAVE1_OPS_GATE_CARD.md`](./WAVE1_OPS_GATE_CARD.md).

Do **not** execute Desk or Fly deploy from `marketing-mix-model/` on `cursor/clean-revamp-v8` (dirty tree, may lack `read_all_orders`).

| Doc | Job |
| --- | --- |
| [APP_STORE_ADS.md](./APP_STORE_ADS.md) | Doctrine — do not buy |
| [APP_STORE_ADS_GO_LIVE.md](./APP_STORE_ADS_GO_LIVE.md) | Gates + ramp + kill |
| [APP_STORE_ADS_KEYWORDS.md](./APP_STORE_ADS_KEYWORDS.md) | Bid / negatives |
| [SMOKE_APP_STORE_ADS.md](./SMOKE_APP_STORE_ADS.md) | Cold smoke |
| [FUNNEL_WEEKLY.md](./FUNNEL_WEEKLY.md) | Partner numbers (empty until Marty) |

**Ads status:** Not safe to turn on App Store Ads at $20/day until smoke PASS + 3 reviews + FUNNEL_WEEKLY organic week + P0 on Fly.
