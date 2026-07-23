# How world-class Shopify designers use Cursor to ship

Playbook for Mcfly: listing-grade screenshots + Submit-ready craft.
Pair with [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) and [`SUBMIT_TOMORROW.md`](./SUBMIT_TOMORROW.md).

---

## What the best teams optimize for

1. **Outcome first** — hero screenshot shows cash MER (big number), not Settings  
2. **Polaris-native** — feels like Admin, not a custom SaaS skin  
3. **Realistic data** — empty dashboards kill conversion (Shopify 4.4.4)  
4. **Unique shots** — 3–6 different states (4.4.5)  
5. **Tight loop** — see → point → change → reload → capture  

They do **not** reinvent Triple Whale in week one.

---

## Cursor stack (full utilization)

| Move | How | Why |
| --- | --- | --- |
| **Design Mode** | Cursor browser → `Cmd+Shift+D` → click/draw/voice | Spatial edits beat “find the CSS” prompts ([Design Mode](https://cursor.com/docs/agent/design-mode)) |
| **Multi-select** | Select MER + sales row together | “Make hierarchy match Apps Script clarity” |
| **Fast UI model** | Composer 2.5 for micro-edits | Point → patch → hot reload |
| **Taste model** | Fable / Opus Task for desk/listing craft | Hierarchy, anti-slop, religion |
| **Critic** | Grok in parallel | “Would Shopify reject this screenshot?” |
| **Orchestrator** | Auto parent | Ship-gate, deploy, human-gate list |
| **Rules** | `.cursor/rules` + AGENTS.md | Tokens, refuse pixels/MTA, Free listing |
| **Git as undo** | Branch per craft pass | Design Mode Apply isn’t a reliable undo |

### Designer session recipe (45–90 min)

1. **Seed data** — Demo tab → Load 3-year sample → Turn ON  
2. **Open embedded app** in Cursor browser (or Admin) at Cash MER `?period=y3&shot=1`  
3. **Design Mode** — click hero MER; “bigger, quieter, definition line under title like Apps Script”  
4. **Multi-select** sales ÷ spend rows — “tabular nums, one equation, no card soup”  
5. **Spawn Fable** once for a full-page taste scorecard (not 10 tiny agents)  
6. **Capture** 1600×900 crops (no browser chrome) per shot list below  
7. **Ship-gate** before claiming done  

### Parallel agents (don’t collide)

```text
Agent A (Fable): Cash MER hierarchy + listing shot readiness
Agent B (Sonnet): Spend CSV template UX only
Agent C (Grok): Reject-risk audit vs SUBMIT_TOMORROW
Parent: integrate + ship-gate + report human gates only
```

One file owner per agent. No three agents rewriting `app._index.tsx`.

---

## Listing screenshot SOP (demo data)

### Prep
1. Install Mcfly on `devmcflyads`  
2. **Demo** → Load 3-year sample desk → Turn sample ON  
3. Use **shot mode** (hides sample banner): `/app?period=y3&shot=1`  
4. Desktop width that yields ~1600×900 of the **app iframe** (crop chrome)

### Shot order (conversion)

| # | URL | Caption |
| --- | --- | --- |
| 1 | `/app?period=y3&shot=1` | See cash MER vs break-even |
| 2 | `/app?period=ytd&shot=1` | Sales ÷ spend, clearly defined |
| 3 | `/app/spend` | Upload daily spend in one CSV |
| 4 | `/app/allocation?period=y3` | One clear allocation call |
| 5 | `/app/settings` | Lock break-even from margin |

Icon: `docs/listing-assets/mcfly-app-icon-1200.png`

### After capture
- Turn sample desk **OFF** before reviewer smoke if you want live till only  
- Keep sample available for future marketing shots  

---

## Religion (don’t “design away”)

- Cash MER = **sales ÷ spend**  
- No pixels / MTA / path credit in product or listing claims  
- Listing stays **Free** until Billing ships  
- Sample desk is labeled SAMPLE in-product; shot mode only for captures  

---

## Success bar

World-class ready when:

1. Five unique Polaris screenshots with rich numbers  
2. Definition + sales÷spend readable in hero shot at thumbnail size  
3. Ship-gate + compliance green  
4. Human: PCD + Distribution + install smoke done  
