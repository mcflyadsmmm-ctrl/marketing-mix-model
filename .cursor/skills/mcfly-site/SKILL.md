---
name: mcfly-site
description: >-
  Build or change mcflyads.com Tier A money-spine pages. Read Living Board first.
  Use for home, /lab, /custom-analytics, packages, about, chrome, SAMPLE lock, Pages deploy.
  Prevents collage patches and context-window amnesia.
---

# McFly site craft

Read [`docs/LIVING_BOARD.md`](../../../docs/LIVING_BOARD.md) first. Then this skill. Chat is disposable.

## One sentence

**Advanced data science, displayed simply** — sell Custom they keep; Mcfly Analytics is the Shopify path in.

## Architecture (do not freestyle)

| Layer | Path | Rule |
| --- | --- | --- |
| Craft system | `site/assets/mcfly/` | **Only** CSS/JS Tier A may load |
| Legacy collage | `site/assets/site.css` | Tier C/B only — **never** add Tier A styles there |
| SAMPLE gate | `scripts/site-sample-lock.sh` | Must pass before deploy |
| Law | `docs/MASTER_DIRECTIVE.md` | Packages, demo bar, refuse list |

**Spine:** `/` → `/lab` (Recon · Exec · Portal) → `/custom-analytics#inquire`  
**Nav ≤5:** Lab · Custom · App · About · Inquire  
**Firm mark:** Mcfly Ads · **App SKU:** Mcfly Analytics · **No Ads↔Analytics toggle**

## Craft bar (quality)

Aim: **terafab.ai restraint** — cinematic space, one idea per viewport, short CTAs — applied to McFly’s money spine (not a chip-factory clone).

- Imagery + type do the work; no Domo collage
- Phone: brand + hamburger only
- Home: kicker · H1 · lede · ≤2 CTAs
- Lab: session · sticky rail · tiles

## Continual improvement without amnesia

1. **One version = one job.** Example: “v11 lab mobile density only.” Not home+lab+about+brand.
2. **Patch vs rebuild.** Typos/bugs = patch. Composition/IA/voice = version + explicit job on the board.
3. **Before ship:** hard-refresh phone (390) + desktop. Spine probe &lt;90s. SAMPLE lock.
4. **After ship:** bump `mcfly-version`, Pages id + git sha on Living Board, journal line.
5. **Refuse:** new SEO landers · Grok fleets · parallel `dist/` · editing `app/**`/Fly · stacking rules into `site.css` for Tier A · “coherence” micro-ships that restack slogans.

## SAMPLE lock (never invent)

Northline: invoice **$98,500** · cash **4.19×** · variance **−$1,450** · seat **2 of 4**.  
App SAMPLE = Harbor (not Northline). No `$84,200`. No 500-seat theater.

## Mobile craft (learned the hard way)

- Phone chrome = brand + hamburger only. Desktop nav **must** `display:none` below 860px.
- Home first paint: eyebrow · H1 · lede · ≤2 CTAs · proof doors. Brand is in the header — do not billboard-duplicate the logo.
- Lab first paint: session (who + seat) · sticky rail chips · tiles. No 7 metadata rows.
- Every string: `overflow-wrap: anywhere`. No clipped Inquire / cut-off monospace.

## Deploy

```bash
bash scripts/site-sample-lock.sh
# copy site/ (+ functions/) to a NON-git temp dir, then:
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
# never --branch for production
```

## When editing

1. Change files under `site/assets/mcfly/` + Tier A HTML only for craft.
2. Keep package names: Close Memo · Pipeline Desk · Hired System.
3. Probe live after claim. Board wins over chat.
