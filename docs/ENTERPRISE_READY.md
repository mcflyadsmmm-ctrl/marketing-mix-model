# Enterprise-ready — before you spend real money

**Principle:** Prove quality on free paths. Spend only when a gate is blocked by money, not by unfinished work.

---

## What “enterprise quality” means for Mcfly

Not Triple Whale feature parity. Not App Store ads. It means:

| Bar | Passes when |
| --- | --- |
| **Religion** | Site + app say only cash MER — no pixels/MTA |
| **Trust** | Privacy / terms / support / GDPR webhooks exist |
| **Proof** | You (or a partner) see spend → MER → allocation on a real store |
| **Ops** | `/health`, Postgres, uninstall cleanup, overnight report path |
| **Marketing** | First viewport is brand-first, one thesis, one CTA, product visual |
| **Price honesty** | Free launch → ~$79 later; no GMV tax cosplay |

---

## Spend map (do not buy until checked)

| Spend | When to buy | Skip until |
| --- | --- | --- |
| **Ads (Meta/Google)** | After 3+ design partners use weekly | App install works + site conversion clear |
| **Shopify Partner fees / App Store** | After design-partner loop | First install works |
| **Fly / Railway paid** | When free Neon+Fly quota is insufficient | Local `shopify app dev` preview works |
| **Domain email** | Nice-to-have | After first partner asks |
| **Sentry / paid monitoring** | After production traffic | Overnight + logs catch first bugs |

**Stay free as long as possible:** Cloudflare Pages (site), GitHub Actions (overnight CI), Neon free Postgres, Fly free allowance, `shopify app dev` tunnel.

---

## Gate A — Marketing site (no spend)

- [x] Live on https://mcflyads.com  
- [ ] Homepage feels enterprise (brand-first hero, crisp thesis, live demos) — see [YOUR_NEXT_STEPS.md](./YOUR_NEXT_STEPS.md)  
- [ ] Product / pricing / privacy / support consistent  
- [ ] Waitlist / free-launch CTA works  
- [ ] Mobile: readable, no broken contrast  

**Done when:** you’d be proud to send the URL to a Shopify operator.

## Gate B — App preview (no paid host)

- [ ] `shopify app config link` → `client_id` set  
- [ ] Docker/Neon DB + migrations  
- [ ] `shopify app dev` → install on **development store**  
- [ ] Settings → Spend → Dashboard MER updates  
- [ ] Allocation card shows when spend > 0  

**Done when:** you screenshot the embedded app and believe it.

## Gate C — Production install (cheap host only)

- [ ] Neon + Fly (or Railway) with `/health` ok  
- [ ] App URL ≠ `example.com` / ≠ marketing homepage  
- [ ] Install works **without** `shopify app dev`  
- [ ] One design partner invited (custom link)  

**Done when:** partner can open Mcfly in Admin on their store.

## Gate D — Enterprise ops (still low $)

- [ ] Overnight worker or GitHub Action report  
- [ ] API token + Sheets optional for power users  
- [ ] Recon / kill criteria understood  
- [ ] Support email answered within 24h  

**Done when:** you can sleep without babysitting the tunnel.

## Gate E — Only then spend marketing money

- [ ] 3 partners opened the app in the last 14 days  
- [ ] MER ritual feedback written down  
- [ ] Pricing page matches what you’ll charge  
- [ ] App Store listing draft ready (if public)  

**Then** consider ads / BFS chase — not before.

---

## Explicit “not ready” traps

| Trap | Why it burns money |
| --- | --- |
| Ads before install works | Pays for curiosity, not product |
| App URL = mcflyads.com | Breaks OAuth; looks broken |
| Cloning TW features | Burns runway on theater |
| Forever-free with no partner feedback | No signal, no paid path |

---

## Your next free moves (in order)

1. Finish **Gate A** site polish (this PR)  
2. Finish **Gate B** on your Mac (`shopify app dev`) — $0  
3. Only if B passes → **Gate C** Neon+Fly ([GO_LIVE.md](./GO_LIVE.md))  
4. Reply **`preview works`** then **`live works`**  

Docs: [SHIP_NOW.md](./SHIP_NOW.md) · [GO_LIVE.md](./GO_LIVE.md) · [MASTER_PLAN.md](./MASTER_PLAN.md)
