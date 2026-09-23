# Ship + charge gaps — 2026-09-17 (Denver)

**Superseded posture (2026-09-23 America/Denver):** production Fly secrets are `MCFLY_SAMPLE_ONLY=false` and `MCFLY_LIVE_STAGE=overview_orders` (recent release **~v460**; health **200** at 22:22Z). `read_reports` is shipped. Customers / LTV stay locked. The “leave freeze on / expect parked” lines below are the 2026-09-17 packet, not current runtime. Keep the ladder. Do not re-park from this file. Git `[env]` stays the safe default; secrets override; Marty re-asserts after deploy.

**Audience:** Marty tap list before Live unpark / charge claims.  
**Branch tip read:** `cursor/spend-trust-recurring` @ `93c3aa4`  
**Fly app:** `mcfly-analytics` · **Store:** `devmcflyads` (not `demcflyads`)  
**Agent constraints this run:** did **not** flip Live unpark env · did **not** Partner Submit · did **not** run `shopify app dev` · Mac `flyctl`/`gh` not reachable from cloud box → secrets list = Marty confirm.

| Section | Verdict |
| --- | :---: |
| 1 Live ready-to-tap packet | **PASS** (hold flip) |
| 2 Accuracy one-glance (10 min) | **PASS** (checklist ready; Live Admin = human) |
| 3 Billing verify | **PASS** tip code · **GAP** Partner Pricing + Mac secrets list |
| 4 Listing shots | **PASS** (checklist; SAMPLE after re-smoke) |

**Overall:** packet ready. **Do not claim Live / charge** until Marty tap list below is green.

---

## Marty tap list (copy this)

1. **Hold:** leave `MCFLY_SAMPLE_ONLY=true` + `MCFLY_LIVE_STAGE=parked` until §2 accuracy on a real shop path is ready.
2. Confirm health: `curl -sS https://mcfly-analytics.fly.dev/health` → `{"ok":true,...}` (probed **200** this run @ ~18:38 MDT).
3. On Mac: `~/.fly/bin/flyctl secrets list -a mcfly-analytics` → name `MCFLY_BILLING` present (do not print values).
4. Partner Dashboard → Pricing: **one** plan **Mcfly Analytics** · **$39 USD / 30 days** · **7-day trial** · **delete Free** if still there.
5. After SAMPLE re-smoke: screenshots Overview → Customers → LTV (SAMPLE watermark visible) per §4; paste from Galaxy / `docs/ops/LISTING_LIVE_PASTE.md` when you approve — **you** Submit, never the agent.
6. When you decide to unpark: follow §1 progressive `fly secrets set` only (never edit `fly.toml` in git for the flip).

---

## 1) Live ready-to-tap packet — **PASS** (hold flip)

### Tip confirmation

[`docs/ops/LIVE_UNPARK_CHECKLIST.md`](./LIVE_UNPARK_CHECKLIST.md) on tip has:

- Progressive stages: `parked` → `overview_orders` → `customers` → `ltv`
- Kill switches: `MCFLY_SAMPLE_ONLY=true|1` parks Live; revert any time
- Code SoT: `app/app/lib/live-unpark.ts` (+ tests)
- `fly.toml` still ships `[env] MCFLY_SAMPLE_ONLY = "true"` and `MCFLY_LIVE_STAGE = "parked"` — **do not flip in git**

### Health + Admin path

| What | Exact |
| --- | --- |
| Health URL | `https://mcfly-analytics.fly.dev/health` |
| Expect | HTTP **200** · JSON includes `ok:true`, `service:"mcfly-analytics"`, `db:"up"` |
| Probed this run | **200** @ 2026-09-17 ~18:38 MDT |
| Admin (accuracy) | `https://admin.shopify.com/store/devmcflyads/apps` → open **Mcfly Analytics** (embedded iframe) |
| Compare against | Shopify Admin **Analytics / Overview** (and Orders) for the **same shop TZ + period** |

### (a) Confirm still parked — run on Marty’s Mac

```bash
# From anywhere with flyctl logged in (Mac: mcflyadsmmm@gmail.com per GROKBOT_MAC_SPLIT)
~/.fly/bin/flyctl status -a mcfly-analytics

# Env on the running app (names only for secrets; printenv for stage/freeze)
~/.fly/bin/flyctl ssh console -a mcfly-analytics -C 'printenv MCFLY_SAMPLE_ONLY MCFLY_LIVE_STAGE'

# Expect:
#   MCFLY_SAMPLE_ONLY=true   (or 1)
#   MCFLY_LIVE_STAGE=parked
```

Optional cross-check release env (includes `fly.toml` `[env]`):

```bash
~/.fly/bin/flyctl config show -a mcfly-analytics | rg 'SAMPLE_ONLY|LIVE_STAGE'
```

### (b) Progressive go-flip — **Marty only** (hold until §2 ready)

Use **secrets** so you do not need a git change. Secrets override `[env]`. App: `mcfly-analytics`.

**Stage 1 — Overview + Orders only**

```bash
~/.fly/bin/flyctl secrets set \
  MCFLY_SAMPLE_ONLY=false \
  MCFLY_LIVE_STAGE=overview_orders \
  -a mcfly-analytics
```

Wait for machines to restart → Admin hard-refresh → prove sales / typical ticket / refunds / shop TZ vs Admin.

**Stage 2 — + Customers / Growth**

```bash
~/.fly/bin/flyctl secrets set \
  MCFLY_LIVE_STAGE=customers \
  -a mcfly-analytics
```

Prove returning **$**, guests out of returning, no SAMPLE mix.

**Stage 3 — + LTV**

```bash
~/.fly/bin/flyctl secrets set \
  MCFLY_LIVE_STAGE=ltv \
  -a mcfly-analytics
```

Unpaid/trial: first-**90** closed days on file; year/365 = **—** not $0. Paid $39: full book.

### Revert / kill switch (any time)

```bash
~/.fly/bin/flyctl secrets set \
  MCFLY_SAMPLE_ONLY=true \
  MCFLY_LIVE_STAGE=parked \
  -a mcfly-analytics
```

SAMPLE book stays. Live switch no-ops. Ingest does not re-arm while freeze is on.

**Never:** flip `MCFLY_SAMPLE_ONLY` in a PR `fly.toml` · jump straight to `ltv` · Partner Submit as agent · `shopify app dev` that rewrites app URL.

### Section 1 gaps

| Item | Status |
| --- | --- |
| Checklist + stages + kill switches on tip | **PASS** |
| Exact flyctl confirm / flip / revert | **PASS** (commands above) |
| Health URL live | **PASS** (200) |
| This agent flipped Live | **N/A — held** |

---

## 2) Accuracy one-glance — **PASS** (10 min Admin checklist)

**Sources:** [`LIVE_UNPARK_CHECKLIST.md`](./LIVE_UNPARK_CHECKLIST.md) §4 · [`ACCURACY_AUDIT_DENSE_v336.md`](./ACCURACY_AUDIT_DENSE_v336.md) · [`ACCURACY_DELTA_v339_sample72_customers73.md`](./ACCURACY_DELTA_v339_sample72_customers73.md).  
Prior SAMPLE audits (**v336 / v339**) are **not** a Live pass.

**Shop:** ____________ · **TZ:** ____________ · **Paid $39?** ☐ · **Stage:** ____________ · **Date:** ____________

| # | Check | How (≤60s each) | Auto vs eyes | ☐ |
| ---: | --- | --- | --- | --- |
| 1 | **Sales** | Overview this-month Total Sales ≈ Admin Analytics same period / basis | **Eyes** (Admin pair) | ☐ |
| 2 | **Typical ticket** | Median (Typical) vs 10-order spot-check; Average labeled separately | **Eyes** | ☐ |
| 3 | **Returning $** | Customers: returning **dollars** (not headcount rate); guests not in returning | **Eyes** (stage ≥ customers) | ☐ |
| 4 | **Refunds** | Refunded/cancelled order drops net the same way Admin does | **Eyes** | ☐ |
| 5 | **TZ** | Period days match shop IANA zone — no UTC-shifted “wrong yesterday” | **Eyes** | ☐ |
| 6 | **SAMPLE contamination** | Live: no Snowdevil watermark, no SAMPLE spend on Total ROAS, no `sample:` ledger notes. Sample mode: watermark on. Never mixed. | **Eyes** + Settings kill-switch copy | ☐ |
| 7 | **LTV paid vs 90d unpaid** | Unpaid/trial Live: first-90 on file; year/365 **—** not $0. Paid $39: full history; year only when matured. “Unlock full history” CTA when locked. | **Eyes** (stage = ltv) | ☐ |
| 8 | **Empty vs zero** | No spend → **—** Total ROAS never `0.00×`. Thin shop → honest empty | **Eyes** | ☐ |
| 9 | **Sync / pending** | Backfill: pending copy, not fake complete year. After seal: stable on refresh | **Eyes** | ☐ |
| 10 | **Kill switch (still parked)** | Settings: “Live is parked”; Switch to Live no-ops while freeze on | **Eyes** (pre-unpark) | ☐ |

**Automated today (CI / tip tests — not a substitute for Admin eyes):**

- Formula / honesty suites: Overview sales chart, Orders intelligence, Customers $, LTV cohorts, empty-vs-zero, SAMPLE freeze (`live-unpark.test.ts`, accuracy locks in v336/v339).
- Desk-claims / billing copy guards (`desk-claims-guard.test.ts`).

**PASS bar:** rows that apply to current stage all ☐. Do **not** claim real-data demo until 1–2, 4–6, 8–10 PASS (add 3 + 7 when those stages unlock).

### Section 2 gaps

| Item | Status |
| --- | --- |
| One-page Admin checklist distilled | **PASS** |
| Live Admin smoke this run | **GAP** — needs Marty / pairer on `devmcflyads` |
| SAMPLE-only prior audits | **PASS** historically; **not** Live |

---

## 3) Billing verify — **PASS** tip · **GAP** Partner + secrets list

### Tip implements 7-day trial → $39 flat

| Source | Evidence |
| --- | --- |
| `PRO_PLAN` | `app/app/lib/billing-flag.server.ts` — name `Mcfly Analytics`, **amount 39**, USD, `EVERY_30_DAYS`, **trialDays 7** |
| Docs | [`docs/BILLING_TIERS.md`](../BILLING_TIERS.md) — one plan, Managed Pricing, no feature matrix |
| Galaxy / company | `/workspace/galaxy-money/mcfly-company/COMMERCIAL_SETUP.md` + `PRICING_TRIAL_LAW.md` — same offer |
| Scorecard | [`docs/ops/COMMERCIAL_SETUP_SCORECARD.md`](./COMMERCIAL_SETUP_SCORECARD.md) — flat $39; Unlock full history CTA; unpaid ≤90d policy in sync lane |
| Ingest depth | `live-unpark.ts` — unpaid → 90 closed days; paid → `paid_full` (tab gate ≠ billing) |

**Not a feature gate:** trial and paid both see the whole desk. Difference is **Live ingest depth** + Unlock CTA.

### Fly secret `MCFLY_BILLING`

| Check | Result |
| --- | --- |
| Tip expects | `MCFLY_BILLING=1` enables Start 7-day trial → plan picker |
| Docs claim | `APP_STORE_LISTING.md` / `billing-flag.server.ts` comment: production has billing on |
| **This agent** `fly secrets list` | **GAP** — Mac machine `ad72fe25-…` not attached to this cloud Shell; no Fly token on box |

**Marty confirm (names only):**

```bash
~/.fly/bin/flyctl secrets list -a mcfly-analytics | awk '{print $1}'
# Expect a row named: MCFLY_BILLING
# Do not paste values into chat / git.
```

### Partner Pricing — Marty must confirm (agent cannot click)

Listing → **Pricing** → Shopify App Pricing for app **Mcfly Analytics Public** (`403721814017`):

1. **One** plan only, named **Mcfly Analytics** (rename leftover **Pro**).
2. **$39 USD** every **30 days**.
3. **7-day free trial**.
4. **Remove Free plan** if still present (open item as of 2026-08-26 Admin smoke in `BILLING_TIERS.md`).
5. Picker pattern: `https://admin.shopify.com/store/{store}/charges/mcfly-analytics-public/pricing_plans` — must open **top-frame**, never iframe.

### Known tip vs sync GAP (not Partner)

- `liveIngestPolicy()` stub is on tip; **billing hard-stop clamp** that actually cuts crawl to 90 vs full is tracked on sibling `cursor/sync-law-oneshot-webhook-6eb3` (scorecard claims PASS there; do not treat unpaid Live as a free multi-year book until that clamp is live on Fly).

### Section 3 verdict

| Bucket | Verdict |
| --- | :---: |
| Tip code = 7d → $39 flat | **PASS** |
| Docs / Galaxy commercial lock | **PASS** |
| `MCFLY_BILLING` secret listed on Fly | **GAP** (Marty `secrets list`) |
| Partner one-plan / no Free | **GAP** (Marty Partner eyes) |

---

## 4) Listing shots checklist — **PASS**

**After SAMPLE re-smoke** (Live still parked). Capture **inside Admin iframe** on `devmcflyads` — no browser chrome, ~1600×900 app body. **SAMPLE watermark / Sample data label must be visible** so the listing is honest about demo density until Live shots replace them.

| Order | Admin tab / path | Why |
| ---: | --- | --- |
| 1 | **Overview** — `/app?period=mtd` (shot mode `&shot=1` if enabled) | Sales-first YoY + typical ticket — listing hero |
| 2 | **LTV** — `/app/ltv?period=mtd` | Cohorts / 30·90·365 — depth Shopify Analytics skips |
| 3 | **Customers** — `/app/customers?period=mtd` | Returning **$** at $0 spend |
| Optional | Orders · Growth · Spend→Total ROAS | Per Galaxy order if Partner wants 5–6 shots |

**Paste packs (human Submit only):**

| Pack | Path |
| --- | --- |
| Ops live paste | [`docs/ops/LISTING_LIVE_PASTE.md`](./LISTING_LIVE_PASTE.md) |
| Visual capture script | [`docs/LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md) |
| Galaxy ship paste | `galaxy-money/mcfly-company/LISTING_PASTE_READY.md` Galaxy companion (screenshot order Overview→Orders→Customers→Growth→LTV) |

**Refuse:** Meta ROAS hero · pixels · invent reviews · Partner Submit by agent · marketing-site captures as App Store shots.

### Section 4 gaps

| Item | Status |
| --- | --- |
| Tab order + SAMPLE label guidance | **PASS** |
| Shots actually captured this run | **GAP** — Marty after SAMPLE re-smoke |
| Partner Submit | **HOLD** — founder only |

---

## Evidence index

| Artifact | Role |
| --- | --- |
| `docs/ops/LIVE_UNPARK_CHECKLIST.md` | Progressive unpark + §4 scorecard |
| `app/app/lib/live-unpark.ts` | Stages + ingest policy stub |
| `fly.toml` | Parked defaults (git must stay parked) |
| `docs/BILLING_TIERS.md` + `billing-flag.server.ts` | $39 / 7-day SoT |
| `docs/ops/COMMERCIAL_SETUP_SCORECARD.md` | Sync/commercial test PASS_BAR |
| `docs/ops/ACCURACY_*` | SAMPLE formula PASS (not Live) |
| Health probe | `https://mcfly-analytics.fly.dev/health` → 200 |

---

## Agent delivery note

- Report written on tip of `cursor/spend-trust-recurring` (@ `93c3aa4`).
- Prefer PR: branch `cursor/ship-charge-gaps-20260917` → into `cursor/spend-trust-recurring`.
- If `gh`/`flyctl` only on Mac: commit there from  
  `/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model`  
  or cherry-pick this file. Cloud box had **no** `gh` auth / Mac Shell attach this run.

### Mac apply if cloud push failed

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
git fetch origin cursor/spend-trust-recurring
# if agent left a bundle on the shared box, copy SHIP_CHARGE_GAPS_20260917.bundle then:
# git fetch SHIP_CHARGE_GAPS_20260917.bundle cursor/ship-charge-gaps-20260917:cursor/ship-charge-gaps-20260917
git checkout cursor/spend-trust-recurring && git pull
git checkout -B cursor/ship-charge-gaps-20260917
# Or copy file into docs/ops/ and commit:
# cp …/SHIP_CHARGE_GAPS_20260917.md docs/ops/ && git add docs/ops/SHIP_CHARGE_GAPS_20260917.md && git commit && git push -u origin HEAD
gh pr create --base cursor/spend-trust-recurring --title "docs(ops): ship-charge gaps 2026-09-17" --body "Ready-to-tap Live packet (hold flip), accuracy 10-min checklist, billing verify + Partner gaps, SAMPLE listing shots."
```
