# QUEUE — Services Factory

**Pod:** Services · **Paths:** `site/custom-analytics*` · **Branch:** `fleet/services/<id>-*`  
**Merge:** [`MERGE_PROTOCOL.md`](./MERGE_PROTOCOL.md)

| id | wave | status | tag | revenue_hypothesis | paths | model |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | 1 | done | money-path | Clear inquire→SOW close; optional Stripe deposit/setup after scope | `site/custom-analytics.html` · `site/assets/money-links.js` | grok + critic |
| S-002 | 1 | ready | money-path | Productized $1.5–4K desk-setup SKU page converts mid-ticket | `site/` setup SKU page (new, Services-owned) | grok |
| S-003 | 1 | ready | craft | Delivery kit templates cut Custom fulfillment hours → more closes | `docs/` delivery kit (Services) | composer/grok |

**P0 now:** S-002 (desk-setup SKU page). S-001 scaffold shipped; live Stripe = **HUMAN H8**.

## S-001 notes (2026-07-31) — critic constraints applied

**Primary money path (Custom):** inquire → SOW  
- Hero/primary CTA stays **Request a proposal** → engagement form (`data-waitlist`)  
- Waitlist INTERIM_INBOX mailto + copy fallback in `app.js` unchanged (do not replace with Buy/Stripe)

**Secondary only:** `data-mcfly-pay="custom-deposit"` / `desk-setup`  
- Ghost buttons below form + waitlist-confirm  
- Empty `MCFLY_MONEY` URLs → honest “Email for … link” mailto (same inbox as INTERIM_INBOX)  
- Never present as storefront checkout before founder pastes real Stripe Payment Links

**Stable Education API:** `data-mcfly-pay="course"` → `gumroadCourse`

**HUMAN H8:** Founder pastes into `site/assets/money-links.js`:
- `stripeCustomDeposit` — Custom DS deposit / retainer (after SOW)
- `stripeDeskSetup` — desk-setup SKU ($1.5–4K)
- (Education) `gumroadCourse` — MDS Made Easy $79 when ready

Refuse: hourly bait, pixels/MTA, replacing inquire with checkout.

**Religion:** fixed-fee Custom DS only. Not homepage consulting expansion beyond existing Custom page.
