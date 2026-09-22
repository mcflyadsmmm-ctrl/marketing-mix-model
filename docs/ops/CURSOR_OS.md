# Cursor OS — McFlyAds (post–Grok autopsy)

**Effective:** 2026-08-28 · **Mac-shell deploy lock 2026-09-16** · Always read [`../LIVING_BOARD.md`](../LIVING_BOARD.md) first · split [`GROKBOT_MAC_SPLIT.md`](./GROKBOT_MAC_SPLIT.md).

**Prime objective:** Make money selling **Mcfly Analytics** (Shopify app · 7-day then $39). Custom Data Solutions is parked (301 home).

## Authority

| Role | May | Must not |
| --- | --- | --- |
| **Conductor** (one Cursor chat on this Mac) | Spawn ≤4 Task lanes, merge, canvas, lock scripts, **Mac** `flyctl` / `gh` / Pages-from-temp **after** workers (unless Marty said hold) | Org-chart fleets; Wrangler `--branch`; fifth overlapping product lane; invent deploys |
| **Task lanes** | Site / Listing / Desk / Ops only — exclusive files in [`CONDUCTOR_LANES.md`](./CONDUCTOR_LANES.md) | `fly deploy`; Partner Submit; inventing reviews |
| **Founder** | Partner Save/Submit, Admin eyes, MX, ads budget, smoke Result | Babysit every CLI if Mac Shell is connected and hold is clear |
| **Grok Bot** | Orchestrate PRs; **drive this Mac’s** `gh` / `flyctl` / wrangler when connected | Own Partner/Admin iframe; put Fly secrets in a Grok-only cloud shell; org-chart fleets |

## Accounts

- Cloudflare Pages / Wrangler: `martysmithson04@gmail.com` · project `mcflyads` · **Direct Upload**. Cloud Agent env has `CLOUDFLARE_API_TOKEN` (Pages Edit) + `CLOUDFLARE_ACCOUNT_ID`. Proved 2026-09-22: `wrangler whoami`, `pages project list`, Pages project PATCH. MCP bindings/docs/observability ready. Cloudflare-builds MCP is Workers CI OAuth — not required for Pages Direct Upload.
- GitHub: `mcflyadsmmm-ctrl/marketing-mix-model`
- Gmail / Calendar: `mcflyadsmmm@gmail.com`

## Ship

Production Direct Upload. **Deploy from a temp copy of `site/` (no `.git`)** — Wrangler inside a feature branch checkout auto-names Preview and Access-gates it.

```bash
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
```

Never `--branch` for production. Probe `/` + `/demo` + `/pricing` before claim. Custom/`lab` 301 home (v12). Update `LIVING_BOARD.md` after every live ship.

## Money

Cap **3** emails/day. Open on their public fact. Close on system they keep. No TW 1-star stalking. Comments help-first, no URL unless asked.

## Autopsy vs Mac Shell

[`GROK_BOT_AUTOPSY_20260828.md`](./GROK_BOT_AUTOPSY_20260828.md) = no fake company / no invented live.  
[`GROKBOT_MAC_SPLIT.md`](./GROKBOT_MAC_SPLIT.md) = Grok Bot **may** deploy from `Martys-MacBook-Pro.local`; Marty stays Admin / Partner gate.
