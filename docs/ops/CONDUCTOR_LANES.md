# Conductor lanes — Cursor fleet (not Grok)

**Why this exists:** 2026-08-28 Grok “org chart” shipped past a live site that was still wrong. This is the opposite: **one Conductor chat**, **max four Cursor Task lanes**, exclusive files, live probes beat PRs.

Execute tree: this worktree (`mcfly-analytics/`). Money docs: [`money/README.md`](./money/README.md). Law / board when present: `docs/LIVING_BOARD.md`, `docs/MASTER_DIRECTIVE.md`.

## Model

| Role | Who | May | Must not |
| --- | --- | --- | --- |
| **Conductor** | One Cursor chat (this workspace) | Spawn ≤4 lanes, merge, update the cash-machine canvas, Pages/Fly **after** workers land, weekly numbers | Grok fleets, job search, trading, Custom as home sell |
| **Site** | Task agent | `site/**`, sample lock, board/skill/MASTER/journal, **Pages from temp dir** | `app/**` TSX, `wrangler --branch`, Partner Submit |
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
**Ads inherit the listing.** **Not safe** to turn on App Store Ads at $20/day until **all four** gates are green: smoke PASS + ≥3 honest reviews + one organic week pasted in [`money/FUNNEL_WEEKLY.md`](./money/FUNNEL_WEEKLY.md) + P0 image on Fly. See [`money/APP_STORE_ADS_GO_LIVE.md`](./money/APP_STORE_ADS_GO_LIVE.md). Organic week alone is not enough.

## Human leftover (never a Task agent)

- Partner Pricing: one plan $39 + 7-day trial, **no Free plan**, rename **Pro** → **Mcfly Analytics**
- Hero still: replace CUSTOM DATA SCIENCE / 4.42x in Partner
- Namecheap MX → Cloudflare for `support@` (see [`SUPPORT_MX.md`](./SUPPORT_MX.md))
- Handle request (`mcfly-analytics` / `mcfly` / `mcfly-spend`)
