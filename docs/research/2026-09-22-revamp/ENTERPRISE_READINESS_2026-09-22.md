# Enterprise readiness — deep look (2026-09-22 night)

**Definition (locked):** A multi-million-dollar Shopify store is “enterprise-ready” for Mcfly when the morning number is true at their order volume, the trial promise matches billing, and the site, listing, and desk sell one product. Flat **$39**. Total ROAS = sales ÷ entered spend. Empty spend = **—**. No pixels, MTA, SSO, or GMV pricing.

**Verdict:** **Not ready to unpark Live onto a busy paying store.** Craft + host truth advanced tonight; money-path and merchant-trust gates still fail.

**Probe stamp:** Site **v45** · Fly **451** · SHA tip `8711c5a` / craft `a7a513b` · SAMPLE_ONLY **true** · reviews **0** · ads **NO** · FUNNEL blank · `fly.dev/` → 301 mcflyads.com · scopes `read_orders,read_customers,read_all_orders` (no `read_reports`).

## Scorecard (0–10)

| Gate | Score | Evidence |
| --- | ---: | --- |
| Religion / number honesty | 9 | From orders · — not 0× · pending “not $0” · Snowdevil $68,457 lock |
| Trial ↔ billing (90 / 24) | 8 | Site + billing-flag copy match; Partner plan still Marty confirm |
| Volume / backfill honesty | 7 | Days-on-file + resume copy in Overview; real high-volume proof blocked by SAMPLE_ONLY |
| Admin craft (Overview→Customers) | 7 | Craft v46–v48 live; Spend craft in flight; Polaris `s-*` blocked until polaris.js |
| Site ↔ desk one sell | 8 | v45 hero + SAMPLE desk CTA; fly marketing 301 |
| Listing converts | 3 | Paste pack ready; live listing still spend-led historically; reviews **0** |
| Support reply path | 2 | MX = Namecheap email-forward; `support@` Cloudflare path still open |
| Live / unpark | 1 | `MCFLY_SAMPLE_ONLY=true` |
| PCD L2 / Analytics clocks | 2 | Correctly refused until Marty; clocks stay From orders |
| Ads / scale GTM | 0 | FUNNEL week empty · reviews 0 · ads lock |
| **Weighted readiness** | **~48%** | Enough to keep shipping craft; not enough to charge a busy Live shop |

## What closed since ENTERPRISE_PLAN (earlier today)

- Fly root no longer serves marketing homepage (301 → mcflyads.com).
- Site stamped **v45** with 90/24 honesty and Snowdevil lock.
- Overview / Orders / Customers first folds densified (hero → compare → chart; depth folded).
- Local skill `.cursor/skills/mcfly-app-craft/SKILL.md` from Polaris MCP (no random skill downloads).
- Living Board / cash-machine restamped after publishes.

## What still uninstalls a busy store

1. **Wrong or blank morning total while history crawls** — mitigated in copy, unproven Live under SAMPLE_ONLY.
2. **Listing vs product mismatch** — paste not Saved; spend-led public card history.
3. **No human reply** — MX still registrar forward, not a real support mailbox.
4. **0 reviews** — trust tax on App Store card.
5. **Unpark too early** — Live parked on purpose until Marty.

## Refuse (still)

Attribution · ad OAuth · SSO · GMV pricing · inventing reviews/installs · App Store Ads before FUNNEL week · silent `read_reports` · claiming Shopify Total Sales parity pre-L2.

## Highest-EV sequence (not another 40 Desk PRs)

1. **Marty:** Partner Save [`docs/ops/LISTING_LIVE_PASTE.md`](../ops/LISTING_LIVE_PASTE.md) · confirm one $39 plan / no Free.
2. **Marty:** `support@` MX → real inbox.
3. **Conductor:** Finish Spend craft Ship S · Opus · Fly.
4. **Marty:** Founder review outreach (5 stores) · paste one FUNNEL week.
5. **Marty:** Unpark decision only after SAMPLE + listing + support path feel true.
6. **Later:** PCD L2 → `read_reports` → Analytics-matched clocks.

## Stale noise

Open PRs #199–#203 (old site lanes) are not tip-of-ship. Do not merge without a fresh probe against v45.

Canvas: `enterprise-readiness.canvas.tsx` (workspace canvases).
