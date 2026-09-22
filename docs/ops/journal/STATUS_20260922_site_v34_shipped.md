# Site v34 shipped on Pages and Fly — 2026-09-22

**Did:** Direct Upload production Pages `ad054108`. Fly wrap **v437** `deployment-01M35G97C0JQ13M9JQK7EBRBGE` so fly.dev `/` matches. Probed both origins. Not a notes PR.

**Did not:** Change `fly.toml` Live flags or scopes. Partner listing Save. Invent Polar $1,020. Change `LIVE_UNPAID_INGEST_DAYS`. Git still has `MCFLY_SAMPLE_ONLY=true` and `MCFLY_LIVE_STAGE=parked`.

## Live proof (curl, 2026-09-22T21:29Z)

| URL | Result |
| --- | --- |
| https://mcflyads.com/ | HTTP 200 · `mcfly-version` **v34** · `operator-desk-v34` · `og-analytics.jpg` · no `og-cash-mer.jpg` · `#paste-brief` · `#where-sits` · locked H1 |
| /pricing /faq /support /product /demo | all `v34` · OG analytics |
| /assets/brand/og-analytics.jpg | HTTP 200 · image/jpeg · 1200×630 · 70021 bytes |
| /mds-made-easy/ | 301 → `/` |
| /break-even | 301 → `/pricing` |
| /break-even-roas-calculator | 301 → `/pricing` |
| sitemap.xml | no calculator locs |
| https://mcfly-analytics.fly.dev/ | **v34** · same OG / paste-brief / where-sits |
| Fly `/health` | 200 · db up |
| Fly `/demo` | Full Snowdevil SAMPLE demo · Desk pages tablist |

Wrangler: Production `https://ad054108.mcflyads.pages.dev`. `*.pages.dev` is Access-gated; canonical is mcflyads.com.

## What v34 is

Honest OG. One Slack paste. Cited Polar/TW/Lifetimely from-prices. Overview YoY honesty. Support three scopes. Parked MDS/calculator hops.

Commits: `b181a13` HTML · Pages stamp · this Fly stamp on `cursor/site-world-class-5bc6` · PR #191.
