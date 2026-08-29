---
name: mcfly-site
description: >-
  Build or change mcflyads.com money-spine pages. Read Living Board first.
  v11: site sells the Shopify app. Custom is parked. Use for home, about, chrome,
  SAMPLE lock, Pages deploy. Prevents collage patches and Custom-hero relapse.
---

# McFly site craft

Read [`docs/LIVING_BOARD.md`](../../../docs/LIVING_BOARD.md) first. Then this skill. Chat is disposable.

## One sentence

Sell **Mcfly Analytics** — spend beside Shopify sales. 7-day trial then $39/store/mo. Custom is parked.

## Architecture

| Layer | Path | Rule |
| --- | --- | --- |
| Craft system | `site/assets/mcfly/` | **Only** CSS/JS Tier A may load |
| Legacy collage | `site/assets/site.css` | Fly/Tier C pages — **never** add Tier A styles there |
| SAMPLE gate | `scripts/site-sample-lock.sh` | Must pass before deploy |
| Law | `docs/MASTER_DIRECTIVE.md` | App-first · Custom parked |

**Spine:** `/` → `/demo` → `/pricing`  
**Nav:** Demo · Pricing · About · Try the demo  
**Firm mark:** Mcfly Ads · **SKU:** Mcfly Analytics · **No Ads↔Analytics toggle**

## Continual improvement without amnesia

1. **One version = one job.**
2. **Patch vs rebuild.** Typos = patch. IA/voice = version + board job.
3. **Before ship:** phone (390) + desktop. Spine: app hero · `/demo` CTA · no Custom packages on home.
4. **After ship:** bump `mcfly-version`, Pages id, journal.
5. **Refuse:** selling Custom on home/nav · inventing App Store URLs · editing `app/**` / Fly listing · stacking into `site.css` · Grok fleets · new SEO landers.

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

Listing pending: primary CTA is **Try the demo** `/demo`. Never invent `apps.shopify.com`.
