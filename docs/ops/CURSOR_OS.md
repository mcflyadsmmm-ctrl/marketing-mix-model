# Cursor OS — McFlyAds (post–Grok autopsy)

**Effective:** 2026-08-28 · **Always read with** [`../LIVING_BOARD.md`](../LIVING_BOARD.md) first.

**Prime objective:** Make money selling **custom data science they keep**. Shopify app ($39) is a wedge until listed.

## Authority

| Role | May | Must not |
| --- | --- | --- |
| **Conductor** (one Cursor chat) | `site/**`, PRs, lock scripts, Pages when granted, money drafts | Grok fleets; `app/**`; Wrangler `--branch` |
| **Founder** | Merge, send mail, Partner, MX, secrets | Babysit every 5 min if Conductor healthy |
| **Grok** | Optional research / paste packs only | Own site; deploy; money voice |

## Accounts

- Cloudflare Pages / Wrangler: `martysmithson04@gmail.com` · project `mcflyads` · **Direct Upload**
- GitHub: `mcflyadsmmm-ctrl/marketing-mix-model`
- Gmail / Calendar: `mcflyadsmmm@gmail.com`

## Ship

Production Direct Upload. **Deploy from a temp copy of `site/` (no `.git`)** — Wrangler inside a feature branch checkout auto-names Preview and Access-gates it.

```bash
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
```

Never `--branch` for production. Hostile 90s on `/lab` before claim. Never redirect `/lab` away. Update `LIVING_BOARD.md` after every live ship.

## Money

Cap **3** emails/day. Open on their public fact. Close on system they keep. No TW 1-star stalking. Comments help-first, no URL unless asked.

## Autopsy

[`GROK_BOT_AUTOPSY_20260828.md`](./GROK_BOT_AUTOPSY_20260828.md)
