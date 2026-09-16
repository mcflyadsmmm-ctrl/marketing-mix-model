---
name: mcfly-site
description: >-
  Build or change mcflyads.com money-spine pages. Read Living Board first.
  v15: sales-first home — nav CTA Install. Mcfly Analytics. Custom 301 home.
---

# McFly site craft

Read [`docs/LIVING_BOARD.md`](../../../docs/LIVING_BOARD.md) first. Then this skill. Chat is disposable.

## One sentence

Sell **Mcfly Analytics** — deeper Shopify numbers Analytics does not show. Spend optional. 7-day trial then $39/store/mo. Custom is 301 home.

## Architecture

| Layer | Path | Rule |
| --- | --- | --- |
| Craft system | `site/assets/mcfly/` | **Only** CSS/JS Tier A may load |
| Legacy collage | `site/assets/site.css` | Trust/calculator pages — **never** add Tier A styles there |
| SAMPLE gate | `scripts/site-sample-lock.sh` | Must pass before deploy |
| Law | `docs/MASTER_DIRECTIVE.md` | One brand · Custom 301 |

**Spine:** `/` → Install (App Store) · `/demo` still on nav  
**Nav:** Demo · Pricing · About · Install  
**Public mark:** Mcfly Analytics · **Firm (footer):** Mcfly Ads · **No Ads↔Analytics toggle**

## One brand (v12)

- `<title>` / `og:title` / `twitter:title` end **`| Mcfly Analytics`**
- `og:site_name` = Mcfly Analytics
- Canonical + OG URLs = `https://mcflyads.com/...` (never fly.dev)
- One favicon set: original ribbon M (`/favicon.png` + ico/32/192 + apple-touch)
- `theme-color` = `#f2f5f8`
- Chrome wordmark: Mcfly **Analytics** + original `mcfly-m.png`
- Craft: paper/sky, light first — no cinematic dark hero

## Continual improvement without amnesia

1. **One version = one job.**
2. **Patch vs rebuild.** Typos = patch. IA/voice = version + board job.
3. **Before ship:** phone (390) + desktop. Spine: Analytics mark · Install CTA · Harbor SAMPLE · no Custom packages on home.
4. **After ship:** bump `mcfly-version`, Pages id, journal.
5. **Refuse:** selling Custom on home/nav · inventing a fake App Store handle · stacking into `site.css` · Grok fleets · new SEO landers.

## SAMPLE lock (app home)

Harbor Home Co: spend **$23,414** · sales **$82,068** · **3.51×** · BE **2.50×**. Not a live client.  
Do not put Northline **$98,500** / **4.19×** on `/`. No `$84,200`.

## Mobile

Phone chrome = brand + hamburger. Desktop nav `display:none` below 860px.  
Home: kicker · H1 · lede · ≤2 CTAs. Do not billboard-duplicate the logo.

## Deploy

```bash
bash scripts/site-sample-lock.sh
# copy site/ (+ functions/) to a NON-git temp dir, then:
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
# never --branch for production
```

Listing is **live**. Primary CTA is **Install** → https://apps.shopify.com/mcfly-analytics-public. Nav Demo stays `/demo`. That listing URL is allowed because the App Store listing is fully visible — do not invent a different handle.
