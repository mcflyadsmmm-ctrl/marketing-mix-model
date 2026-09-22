# Site v37 shipped on Pages and Fly — 2026-09-22

**Did:** Direct Upload production Pages `92614e40`. Fly wrap **v440** `deployment-01M35K60ZE719MBWCCZT7GA4FA` so fly.dev `/` matches. Probed both origins. Not a notes PR.

**Did not:** Change `fly.toml` Live flags or scopes. Partner listing Save. Invent Polar $1,020. Change `LIVE_UNPAID_INGEST_DAYS`. Git still has `MCFLY_SAMPLE_ONLY=true` and `MCFLY_LIVE_STAGE=parked`. Did not execute ShopifyQL-wait. Did not start phone six-figure wrap. Did not destyle `/support` off `site.css`.

## Live proof (curl, 2026-09-22T22:19Z)

| URL | Result |
| --- | --- |
| https://mcflyads.com/ | HTTP 200 · `mcfly-version` **v37** · locked H1 · paste is this month vs last year + typical order + returning dollars · Not a Slack bot · Basic Shopify has no staff seat · Polar $750 · we do not invent Polar $1,020 |
| /faq /product /pricing /support | **v37** · wholesale median honesty · Faire not split · CFO price card · `no Sample|Live toggle` kept |
| /privacy /cookies /dpa /terms | local fonts · no Google Fonts CDN · no waitlist/FormSubmit processors · no downloadable calculator · no ad-account OAuth |
| https://mcfly-analytics.fly.dev/ | **v37** · paste ok |
| Fly `/health` | 200 · db up |

Wrangler: Production `https://92614e40.mcflyads.pages.dev`. Canonical is mcflyads.com.

Harvested: [Adversarial live site audit](bc-297b4625-c723-50fa-8a3a-6f0735c868bc), [Merchant niche and share jobs](bc-1136b3f6-2c69-5737-9edb-153e26e89a6c). Their branches stay unmerged.

Commits: `786f336` HTML · this stamp on `cursor/site-world-class-5bc6` · PR #191.
