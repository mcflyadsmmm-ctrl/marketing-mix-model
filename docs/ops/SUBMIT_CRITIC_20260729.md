# Submit critic scorecard — 2026-07-29 (evening)

**Auditor:** Grok critic (read-only) · lane Ship-gate / App Store odds  
**SoT:** [`SUBMIT_NOW.md`](../SUBMIT_NOW.md) · [`REJECT_RISK_AUDIT.md`](../REJECT_RISK_AUDIT.md) · [`MAJOR_IMPROVEMENT_PLAN.md`](../MAJOR_IMPROVEMENT_PLAN.md) Wave 1 · [`W1_WEBHOOKS_20260729.md`](./W1_WEBHOOKS_20260729.md) · [`W1_UX_CSB_20260729.md`](./W1_UX_CSB_20260729.md)  
**Religion:** Cash MER desk · refuse pixels / MTA · no product code edits this pass  
**Artifact only:** this file

---

## Verdict

| Slice | Result |
| --- | --- |
| **Agent-side (Submit hygiene)** | **PASS** |
| **Overall submit-ready (Partner path)** | **FAIL** — human A–E still open |
| **App Store approved** | **0% — not claimed** |

**Honest split:** Agent craft / live host / trust URLs ≈ **90–93%**. Human Partner path ≈ **30–35%**. Do not conflate.

---

## Live evidence (2026-07-30 ~03:27–03:30 UTC)

| Check | Result |
| --- | --- |
| `GET https://mcfly-analytics.fly.dev/health` | **200** `ok` + `db:up` |
| Fly machines | `app` + `worker` **started** (image v85, last updated ~2026-07-29 04:47 UTC) |
| `POST /api/jobs/tick` no/bad Bearer | **401** `unauthorized` — route **live**, secret set (GET always 404 by design) |
| `POST /webhooks/compliance` empty / fake HMAC | **400** / **401** ✅ |
| `POST /webhooks/orders` fake HMAC | **401** ✅ |
| Fly bare `/` | App Bridge CDN · Free install copy · **no** shop-domain form · “never ask you to type your .myshopify.com” |
| `/auth/login` | **302 → mcflyads.com** (no domain harvest) |
| `https://mcflyads.com/support` | **200** · **OK: Free listing voice** · no `invite-only` · App Store Free primary · ~$79 announced later |
| `/privacy` | **200** · Level 1 PCD: opaque id + `numberOfOrders` / `read_customers` · no name/email/phone/address CRM |
| `/terms` `/pricing` | **200** · App Store Free when listed · not forever-free |
| `bash scripts/mcfly-compliance-spotcheck.sh` (local) | **PASSED** |

---

## Wave 1 agent rows vs evidence

| ID | Claim | Critic |
| --- | --- | --- |
| W1-1 Compliance | spotcheck PASS | **PASS** — local + live compliance HMAC / scopes / App URL |
| W1-2 CSB | Settings + Goals `data-save-bar` | **PASS local** ([`W1_UX_CSB_20260729.md`](./W1_UX_CSB_20260729.md)) · **Fly lag risk** — last image ~23h before this critic; CSB edits still dirty in working tree |
| W1-3 UX reject | no red primary / no upgrade modals | **PASS local** (same audit) · same Fly lag caveat |
| W1-4 GraphQL cost | `shopify-graphql-cost.server.ts` | **PASS local** (untracked) · **confirm on Fly after next deploy** |
| W1-5 Webhooks | orders ACK + job queue | **PASS live baseline** — orders HMAC + `/api/jobs/tick` auth gate + worker process up · toml topics still need Partner `shopify app deploy` for registration (**HUMAN**) |
| W1-6 Reviewer script | [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md) | **PASS** agent draft · **HUMAN** paste into Partner testing instructions |
| W1-7 Listing + Submit | Partner | **HUMAN_GATE** open |

---

## Local Wave 1 ahead of Fly? **YES — deploy needed**

**Callout:** Working tree still has substantial **uncommitted / untracked** Wave 1 app work (CSB settings, Close route polish, GraphQL cost helper, webhook-delivery / job-runner libs, migrations, etc.). Fly **does** already run `worker` + gated `POST /api/jobs/tick` (v85), so queue skeleton is not purely local — but **latest desk/CSB/compliance polish is ahead of the last Fly image**.

| Action | Owner |
| --- | --- |
| `fly deploy -a mcfly-analytics` after founder grant | **HUMAN_GATE** (phrase required) · then re-curl health + tick 401 |
| `shopify app deploy` for orders webhook topic registration | **HUMAN_GATE** (Partner auth) — see [`JOB_QUEUE.md`](./JOB_QUEUE.md) §7 |

Do **not** treat “worker up” as proof that uncommitted CSB/Close craft is what reviewers will see.

---

## Top 5 reject risks (ranked)

| # | Risk | Severity | Class | Why |
| --- | --- | --- | --- | --- |
| 1 | Partner **Distribution** ≠ Shopify App Store | **Critical** | **HUMAN_GATE** | No public listing path |
| 2 | **PCD Level 1** questionnaire not submitted (before review) | **Critical** | **HUMAN_GATE** | Scope / under-disclose reject; paste listing §PCD; leave name/email/phone/address unchecked |
| 3 | **Install smoke** on `devmcflyads` not closed (`install works`) | **Critical** | **HUMAN_GATE** | Broken margin → CSV → MER = instant reject |
| 4 | **SAMPLE desk ON** (or shot/SAMPLE path) as reviewer truth | **Critical** | **HUMAN_GATE** process | Shopify **1.1.4** factual-info reject |
| 5 | Listing package incomplete: **shot #5 fidelity** + **screencast** + Free paste + emergency contact + automated checks | **High** | **HUMAN_GATE** | `05-spend-csv.png` exists (1600×900) but is a **Polaris-style mock** until Admin re-capture ([`SHOT5_20260729.md`](./SHOT5_20260729.md)); demo video + emergency contact still open |

**Not in top 5 (green / closed for agent):** invite-only trust lag · shop-domain harvest · App URL = mcflyads.com · compliance HMAC · billing charges live (flagged off until `MCFLY_BILLING=1`) · icon 1200×1200 M-only present on disk.

---

## HUMAN_GATE list (SUBMIT_NOW order)

1. **`distribution done`** — Partner → Distribution → Shopify App Store  
2. **`pcd done`** — Level 1 only ([`PCD_AND_LTV.md`](../PCD_AND_LTV.md))  
3. **`emergency contact done`** — monitored email + phone  
4. **`pages live`** — spot-check (already green this tick; re-check before Submit)  
5. **`install works`** — `devmcflyads` smoke · SAMPLE **OFF**  
6. **`assets uploaded`** — icon + shots 1–5 (prefer Admin re-capture for #5) + screencast + Pricing **Free** + listing paste + automated checks · Works with **blank**  
7. **`submitted`** — App URL = Fly · SAMPLE OFF · testing instructions from [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md)  

**Also (ops, not App Store form fields):**

- Founder **`fly deploy` allowed** this turn — ship local Wave 1 CSB/Close/GraphQL polish before reviewer install  
- Partner **`shopify app deploy`** — register orders webhook topics declared in `shopify.app.toml`

---

## Scorecard

| Lane | Score | Notes |
| --- | ---: | --- |
| Agent hygiene / compliance | **~92** | Spotcheck PASS · live HMAC · Free trust · no domain form |
| Wave 1 agent rows (local) | **~90** | W1-1…6 evidenced in ops docs; W1-7 human |
| Wave 1 on Fly (reviewer-visible) | **~80** | Queue tick live; CSB/latest desk **may lag** until redeploy |
| Listing package | **~82** | 5 PNGs + icon on disk; shot 5 mock caveat; screencast missing |
| Human Partner path | **~32** | No `distribution` / `pcd` / `install` / `assets` / `submitted` replies |
| **Overall submit-ready** | **~55%** | Agent PASS · human FAIL |

---

## Critic instruction to parent

- **Do not** ask for new product features before Submit.  
- **Do not** claim approval-ready.  
- Agent-side: **PASS** — founder can walk [`SUBMIT_NOW.md`](../SUBMIT_NOW.md).  
- Before Submit click: grant **fly deploy** so reviewer sees current CSB/desk; close human A–E; SAMPLE **OFF**.
