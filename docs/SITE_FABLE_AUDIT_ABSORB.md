# Fable site audit absorb (2026-07-28)

**Source:** Fable 5 full audit of mcflyads.com.  
**Verdict:** Highly useful for SEO/conversion. Confirmed live: `.html` → clean 308 but canonicals/sitemap still `.html`; legacy MMM URL 404s.

## Take / refuse

| Finding | Decision |
| --- | --- |
| P0 Canonical conflict | **AGENT_FIX now** |
| P0 Legacy 301 map | **AGENT_FIX now** + HUMAN Search Console |
| P0 CTA bait (install → not listed) | **AGENT_FIX** — Partner invite primary until `APP_STORE_LIVE`; honesty > App Store theater |
| P1 H1 / MER synonym / JSON-LD / static demo numbers | **AGENT_FIX** next wave |
| P1 Alternative SEO pages | **AGENT_FIX** (religion-safe: cash desk vs suite, no fake pricing) |
| P2 AI crawler allow | **HUMAN_GATE** (Cloudflare) |
| P2 Social proof / beta quotes | **HUMAN_GATE** |
| Tracking pixels | **WONTFIX_RELIGION** |

## Canonical form (locked)

Extensionless only: `/product`, `/demo`, `/faq`. Never `.html` in href, canonical, og:url, sitemap.
