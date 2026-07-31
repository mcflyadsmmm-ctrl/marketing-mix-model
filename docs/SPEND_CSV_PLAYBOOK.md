# Spend CSV playbook (site + app)

**Religion:** Cash MER = Shopify sales ÷ ad spend. CSV spend aggregates only — no Meta/Google OAuth required, no connector zoo, no pixels/MTA.

## Message

Merchants export daily spend from whatever they run → upload CSVs → Mcfly combines into one cash desk. Covers channels that never have clean Shopify connectors.

## Platforms (advertise-on → upload)

| Label | Notes |
| --- | --- |
| Meta | Facebook + Instagram Ads Manager |
| Google | Google Ads |
| Microsoft | Bing / Microsoft Advertising |
| TikTok | TikTok Ads |
| Pinterest | Pinterest Ads |
| Snapchat | Snapchat Ads |
| Reddit | Reddit Ads |
| X | X / Twitter Ads (often Other bucket) |
| LinkedIn | Campaign Manager (often Other) |
| Amazon | Amazon Ads (often Other) |
| Apple Search | Apple Search Ads (often Other) |
| Impact / CJ | Affiliate commissions + fees |
| Klaviyo / Mailchimp | Email/SMS cash cost |
| Other | Catch-all |

Canonical app catalog: `app/app/lib/spend-export-guides.ts` (`SPEND_ADVERTISE_PLATFORMS`).

## App path

After install → **Spend** tab → export walkthrough + combine:

- `#mcfly-spend-exports` — per-platform export guides
- `#mcfly-spend-combine` — combine / upload

## Site anchors

- `/product.html#spend-csv` — selling section (export → upload → combine)
- `/faq.html#spend-csv` — how spend gets in + no ad OAuth
- `/cash-mer.html#spend-csv` — glossary term
- Home: post-hero strip → product anchor
- Support install step 03: mentions Spend-tab walkthrough

## Do not claim

- Meta/Google “Works with” logos
- Ad-account OAuth as required for cash MER
- Pixels, MTA, path / “true ROAS,” TW clones
