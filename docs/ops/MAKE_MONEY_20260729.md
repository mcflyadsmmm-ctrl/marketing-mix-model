# Make money — ruthless split (2026-07-29/30)

**Goal:** Public App Store Free installs → Monday Close habit → Pro $39 (after announce) + Custom fixed-fee desks.  
**Not claimed:** App Store approved · Billing charges live · revenue in bank.

Religion: Free listing first · Pro $39 later via Billing announce · not forever-free bait · no pixels/MTA · App URL = Fly.

---

## LIVE / AGENT DONE

| Item | Evidence |
| --- | --- |
| Fly app + worker | **v88** · `https://mcfly-analytics.fly.dev/health` → `ok` / `db:up` |
| App URL | Fly only — not mcflyads.com |
| Bare `/` | App Store (Free) · never type `.myshopify.com` |
| Trust site | Pages live · Free install voice · no `invite-only` on `/support` |
| Compliance | `bash scripts/mcfly-compliance-spotcheck.sh` **PASSED** |
| SAMPLE strip | Loud SAMPLE ON chrome on desk tabs when enabled |
| Listing pack on disk | Icon 1200×1200 M-only · shots **1–5** (`05-spend-csv.png` = **mock**, 1600×900) · never upload HOLD |
| Freemium matrix | Free = Meta+Google · Pro teaser in-app · **no Billing charges** until `MCFLY_BILLING=1` + announce |
| Reject-phrase hygiene | No positive invite-only / forever-free bait / true ROAS product / Works with Meta / GMV tax / shop-domain harvest in app+site |
| Submit docs | [`SUBMIT_NOW.md`](../SUBMIT_NOW.md) · [`SUBMIT_HANDOFF.md`](./SUBMIT_HANDOFF.md) · [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md) · [`REJECT_RISK_AUDIT.md`](../REJECT_RISK_AUDIT.md) |
| Webhook/queue code | Orders ACK + job tick gated · worker process up — **Partner registration still human** |

**Needs deploy (parent):** Connections SAMPLE strip + pricing title → Mcfly Analytics (this tick). Standing grant OK: [`STANDING_DEPLOY_GRANT.md`](./STANDING_DEPLOY_GRANT.md).

---

## HUMAN MUST DO TO MAKE MONEY (order)

No shortcuts. Agent cannot click Partner MFA or invent installs.

### Path to first dollar of *habit* (Free App Store)

1. **`distribution done`** — Partner → Distribution → **Shopify App Store**
2. **`pcd done`** — Protected Customer Data **Level 1 only** ([`PCD_AND_LTV.md`](../PCD_AND_LTV.md); paste [`APP_STORE_LISTING.md`](../APP_STORE_LISTING.md) §PCD — leave name/email/phone/address unchecked)
3. **`emergency contact done`** — monitored email + phone in Partner Settings
4. **`pages live`** — spot-check `/support` `/privacy` `/pricing` `/terms` still Free + PCD (already green; re-curl before Submit)
5. **`install works`** — on `devmcflyads`: SAMPLE **OFF** → margin → Meta/Google spend CSV → Total ROAS → Allocation ([`INSTALL_SMOKE.md`](../INSTALL_SMOKE.md))
6. **`assets uploaded`** — icon + shots 1–5 (prefer Admin re-capture for #5) · **not** HOLD · screencast · Pricing **Free** · Works with **blank** · listing paste · automated checks
7. **`shopify app deploy`** — register `orders/create|updated|cancelled` topics from `shopify.app.toml` (Partner auth) — see [`JOB_QUEUE.md`](./JOB_QUEUE.md) §7
8. **`submitted`** — App URL = `https://mcfly-analytics.fly.dev` · SAMPLE OFF · testing instructions = full [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md)

Then wait Shopify review (days–weeks). **Approval ≠ agent claim.**

### Path to *paid* money (after Free habit)

9. **Announce Billing** — founder says when Pro $39 goes live (do **not** invent charges)
10. Agent wires Shopify Billing behind `MCFLY_BILLING=1` per [`BILLING_TIERS.md`](../BILLING_TIERS.md)
11. **Custom Data Solutions** — sell fixed-fee desks via site inquire (parallel, not App Store blocker)

```text
YOU: Distribution → PCD → emergency → smoke (SAMPLE OFF) → assets → shopify app deploy → Submit
Shopify: review
LIVE: Free installs → Monday Close habit
YOU: announce Billing → agent enables $39 Pro
YOU: Custom desks (fixed fee)
```

---

## Agent will NOT do

Partner MFA · Distribution click · PCD submit · screencast recording · `submitted` click · Meta/Google App Review · turning on Billing without announce · pixels / MTA / “true ROAS” / Works-with-Meta logos · App URL = mcflyads.com · forever-free bait · claiming approved

---

## Optional same week (not on critical money path)

- GSC + citation Allows — [`FOUNDER_WAVE2_CHECKLIST.md`](./FOUNDER_WAVE2_CHECKLIST.md)
- Cursor hourly Automation — [`APP_HOURLY_AUTOMATION.md`](./APP_HOURLY_AUTOMATION.md)
- Commit/push dirty Wave 1 tree so deploys match local
