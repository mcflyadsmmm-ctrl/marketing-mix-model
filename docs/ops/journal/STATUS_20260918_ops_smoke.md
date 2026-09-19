# STATUS 2026-09-18 — Ops smoke (readiness, no product edits)

**Lane:** Ops  
**When:** 2026-09-18 · America/Denver (curl wall ~2026-09-19T01:08Z)  
**Root:** `marketing-mix-model/`  
**Did not:** edit `site/**` or `app/**`, `fly deploy`, wrangler, git commit, buy ads, invent funnel/reviews

---

## Smoke table

| URL | HTTP | Result | Notes |
| --- | --- | --- | --- |
| https://mcflyads.com/ | 200 | **PASS** | `<meta name="mcfly-version" content="v19" />` |
| https://mcflyads.com/demo | 200 | **PASS** | `mcfly-version` **v19** |
| https://mcflyads.com/pricing | 200 | **PASS** | `mcfly-version` **v19** |
| https://mcfly-analytics.fly.dev/health | 200 | **PASS** | `{"ok":true,"service":"mcfly-analytics","db":"up"}` — no app version field in body; Living Board claims Fly **331** @ `6c8a86b` (Ops did not deploy) |
| https://apps.shopify.com/mcfly-analytics-public | 200 | **PASS** | Fetched HTML (~171 KB). Not blocked. Title **Mcfly Analytics**. Star meta **0.0/5**. Visible **(0 Reviews)** / **No reviews yet**. Free trial + **$39** present in page. |

**Overall probes:** **PASS** (5/5).

---

## Ads lock (still **NO**)

Four gates from `AGENTS.md` / `docs/ops/money/APP_STORE_ADS.md` — **do not buy ads** until all green:

| # | Gate | Status 2026-09-18 |
| --- | --- | --- |
| 1 | Smoke / Admin PASS (SAMPLE + live spend day) | Ops curl smoke **PASS**. Founder Admin: SAMPLE greeting **PASS** 2026-09-15; **live spend day** + **trial CTA** still skipped → gate stays **AMBER** |
| 2 | ≥3 honest App Store reviews | **RED** — listing HTML still **0** reviews |
| 3 | One organic week pasted in `FUNNEL_WEEKLY.md` | **RED** — Partner rows still blank |
| 4 | P0 desk on Fly | **GREEN** (live `/health` 200; board Fly **331**) — Ops did not deploy |

**Start campaigns?** **NO.**

---

## Marty-only leftovers (not Ops)

- Partner **Save** of listing paste (`LISTING_LIVE_PASTE.md`) — Cursor does not Submit
- Partner **`read_reports`** (+ L2 PCD) before live ShopifyQL fill
- Namecheap **MX** → Cloudflare for `support@` — still open (`SUPPORT_MX.md`)
- **Fly deploy go** — board: deploy held until Marty go + suite green (last deploy interrupted); workers do not deploy

---

## Files this run

- Created: `docs/ops/journal/STATUS_20260918_ops_smoke.md` (this file)
- Refreshed: `docs/ops/money/FUNNEL_WEEKLY.md` (template blanks; no invented numbers)
- Updated gates: `docs/ops/money/APP_STORE_ADS.md`
- Status only: `docs/ops/SUPPORT_MX.md`
