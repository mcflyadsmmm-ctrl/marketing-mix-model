# Site v34 shipped on Pages — 2026-09-22

**Did:** Direct Upload production Pages `ad054108`. Probed apex, not a notes PR.

**Did not:** Unpark Live. Partner listing Save. Invent Polar $1,020. Change `LIVE_UNPAID_INGEST_DAYS`. Edit `fly.toml` scopes. Fly wrap of marketing (fly.dev `/` still v33 at this stamp).

## Live proof (curl, 2026-09-22T21:26Z)

| URL | Result |
| --- | --- |
| https://mcflyads.com/ | HTTP 200 · `mcfly-version` **v34** · `operator-desk-v34` · `og-analytics.jpg` · no `og-cash-mer.jpg` · `#paste-brief` · `#where-sits` · locked H1 |
| /pricing /faq /support /product /demo | all `v34` · OG analytics |
| /assets/brand/og-analytics.jpg | HTTP 200 · image/jpeg · 1200×630 · 70021 bytes |
| /mds-made-easy/ | 301 → `/` |
| /break-even | 301 → `/pricing` |
| /break-even-roas-calculator | 301 → `/pricing` |
| sitemap.xml | no calculator locs |
| https://mcfly-analytics.fly.dev/ | still **v33** marketing (Fly image v436) |
| Fly `/health` | 200 · db up |

Wrangler: Production `https://ad054108.mcflyads.pages.dev` (14s ago). `*.pages.dev` is Access-gated; canonical is mcflyads.com.

## What v34 is

Honest OG. One Slack paste. Cited Polar/TW/Lifetimely from-prices. Overview YoY honesty. Support three scopes. Parked MDS/calculator hops.

Commit: `b181a13` on `cursor/site-world-class-5bc6` · PR #191.
