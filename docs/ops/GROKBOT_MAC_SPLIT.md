# Grok Bot ↔ Mac Cursor split (2026-09-16)

**Founder lock.** Outranks the 2026-08-28 “Grok can never deploy” reading.

Autopsy [`GROK_BOT_AUTOPSY_20260828.md`](./GROK_BOT_AUTOPSY_20260828.md) still means: **no Grok org-chart fleets, no invented deploys, no Partner/Admin eyes as the bot.** It does **not** mean Grok cannot ask **this Mac** to run `flyctl` / `gh` / `wrangler` when the machine is connected.

Proved today: Fly **v323→v328** (and later **329**) via `Martys-MacBook-Pro.local` `flyctl` + wrangler + `gh`. Cloud-only Grok shells still have **no** Fly secrets. Mac Shell does.

---

## Ownership (authoritative)

| Role | Owns | Must not |
| --- | --- | --- |
| **Grok Bot** | Orchestrate cloud PRs on `mcflyadsmmm-ctrl/marketing-mix-model` · `cursor/spend-trust-recurring` · `gh` merge/push as `mcflyadsmmm-ctrl` **on this Mac** · `fly deploy --app mcfly-analytics` from repo root **on this Mac** after merge (unless Marty said **hold**) · Pages from a **temp `site/` with no `.git`**: `npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true` · durable product truth / wave queue | Invent smoke, reviews, or deploys that did not happen · commit `suite/` or `.env.local` · click Partner · be the Admin iframe · org-chart fleets · `wrangler --branch` · Fly from `main` / PR #19 / `cursor/clean-revamp-v8` · put Fly secrets in a Grok-**only** cloud shell |
| **Marty** | Partner Save / Submit · Admin visual QA (hard-refresh **devmcflyads**, Sample on/off, phone “downloadable?”) · ads on · honest smoke Result · any secret not already on this Mac’s flyctl/gh/wrangler | Babysit every CLI if the Mac is connected and the hold is clear |
| **Mac Cursor** (pairing) | Live Admin iframe craft with Marty watching · adopt open cloud PRs (do not double-build Overview / mobile if Grok already merged) · local debug | Overwrite `cursor/spend-trust-recurring` tip with `main` / PR #19 · re-litigate Aug 28 as “Fly is impossible for Grok” · Partner Submit as the agent |

**Store slug:** `devmcflyads` (Admin `/store/devmcflyads`). “demcflyads” is a typo.

**Listing paste:** parked until Marty says **final approval — once**. Cursor / Grok never Submit.

---

## Standing deploy order

After a P0 PR **merges to `cursor/spend-trust-recurring`**, Grok Bot / Mac Cursor runs **Fly** from this Mac (`fly deploy --app mcfly-analytics`). Pages only if `site/` changed, from a **non-git temp** copy.

**Hold (2026-09-16 founder):** Sample-only freeze until Marty agrees the desk looks and calculates right. **Do not Fly** the uncommitted denser-desk tree until that unpark. Live order seed stays off. Snowdevil SAMPLE is next, not Harbor spend as the example.

---

## Mac prerequisites (re-verified 2026-09-22 ~18:52 MT)

| Check | Status |
| --- | --- |
| Machine | `Martys-MacBook-Pro.local` connected |
| Repo | `~/Documents/MCFLY ANALYTICS APP/marketing-mix-model` on `cursor/spend-trust-recurring` (**default ship tree**) |
| Worktree trap | `mcfly-analytics/` is secondary (`cursor/ads-readiness-mac`); do not Fly or Desk-ship from a detached/stale tip |
| `gh` | `mcflyadsmmm-ctrl` · scopes `repo` + `workflow` |
| `flyctl` | `~/.fly/bin/flyctl` · `mcflyadsmmm@gmail.com` · app `mcfly-analytics` deployed · `/health` db up |
| Wrangler | `~/.npm-global/bin/wrangler` · OAuth `martysmithson04@gmail.com` · Pages `mcflyads` → mcflyads.com |
| Shopify CLI | `~/.npm-global/bin/shopify` · install to user prefix only (system `/usr/local` EACCES caused agent hangs) |
| MCP ready | Shopify Dev · Cloudflare bindings · Gmail · Granola (authed 2026-09-22) · browser |
| MCP skip | Vercel / X / Canva / Subtext / GitLab / 1Password — not required for Mcfly ship |
| `suite/` | never commit (`.env.local`) |

**Agent rule:** If `wrangler` / `shopify` “not found”, prepend `export PATH="$HOME/.npm-global/bin:$PATH"` — do not start a connect-debug loop.

---

## Hard vetoes (unchanged)

- Ads **OFF** until smoke PASS + 3 honest reviews + FUNNEL week + P0 on Fly.
- Reviews **= 0**. Never invent.
- Never Fly-deploy `main` / PR #19 / `cursor/clean-revamp-v8`.
- Never Partner Submit as the agent.
- Never claim Admin smoke without Marty.

## One line for Marty

Grok Bot may deploy from this Mac; you remain the Admin / Partner gate.
