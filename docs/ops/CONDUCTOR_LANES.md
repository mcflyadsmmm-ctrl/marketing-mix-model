# Conductor lanes — Cursor fleet (not Grok)

**Why this exists:** 2026-08-28 Grok “org chart” shipped past a live site that was still wrong. This is the opposite: **one Conductor chat**, **max four Cursor Task lanes**, exclusive files, live probes beat PRs.

Read [`../LIVING_BOARD.md`](../LIVING_BOARD.md) first. Law: [`../MASTER_DIRECTIVE.md`](../MASTER_DIRECTIVE.md). Autopsy: [`GROK_BOT_AUTOPSY_20260828.md`](./GROK_BOT_AUTOPSY_20260828.md).

## Model

| Role | Who | May | Must not |
| --- | --- | --- | --- |
| **Conductor** | One Cursor chat (this workspace) | Spawn ≤4 lanes, merge, update the cash-machine canvas, Pages/Fly **after** workers land, weekly numbers | Grok fleets, job search, trading, Custom as home sell |
| **Site** | Task agent | `site/**`, sample lock, board/skill/MASTER/journal v14, **Pages from temp dir** | `app/**` TSX, `wrangler --branch`, Partner Submit |
| **Listing** | Task agent | Listing paste pack + `APP_STORE_LISTING.md` + compliance skill | Site HTML, Fly secrets, inventing reviews |
| **Desk** | Task agent | `app/app/**` honesty, empty state, ReviewAsk, tests | `site/**`, Pages, ads |
| **Ops** | Task agent | Smoke curls + SUPPORT_MX / FUNNEL_WEEKLY / APP_STORE_ADS docs | Product code, deploy, buying ads |
| **Founder** | Marty | Partner save/Submit, MX DNS, ads budget, screenshot upload, merchant email | Babysit every 5 min if Conductor is healthy |

**Banned:** a fifth concurrent product lane, parallel `dist/`, inventing App Store URLs/reviews/install counts, Meta/Google OAuth, Built for Shopify apply before paid stores.

## Spawn contract (Conductor)

1. One job per lane. Definition of done is in the prompt (live curl, test file, or paste pack).
2. Exclusive file list in the prompt. If two lanes need the same file, Conductor owns it.
3. **Workers do not `fly deploy`.** Site may Pages-deploy. Conductor deploys Fly after Site + Desk.
4. Workers do not commit unless the founder asked in that lane’s prompt.
5. Workers do not edit `~/.cursor/plans/*.plan.md`.
6. When a lane returns: update the cash-machine canvas beside this chat, then either merge or spawn a fix-only follow-up — never a new overlapping lane.

## Money sequence (do not skip)

Listing → install on Fly → type/CSV spend → day-7 $39 → compliant review.  
**Ads inherit the listing.** No App Store ads until one organic week of Partner visits/installs/trials exists in `docs/ops/money/FUNNEL_WEEKLY.md`.

## Human leftover (never a Task agent)

- Partner Pricing: one plan $39 + 7-day trial, **no Free plan**, rename **Pro** → **Mcfly Analytics**
- Hero still: replace CUSTOM DATA SCIENCE / 4.42x in Partner
- Namecheap MX → Cloudflare for `support@`
- Handle request (`mcfly-analytics` / `mcfly` / `mcfly-spend`)
