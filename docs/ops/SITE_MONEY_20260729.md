# Site money scorecard — 2026-07-29

**Goal:** mcflyads.com converts to **App Store Free install** (primary) + **Custom Data Solutions inquire** (secondary).  
**Religion:** cash MER desk; refuse pixels/MTA; dual pillar OK; homepage product-first.  
**Deploy:** parent only (no Pages from this lane).

## Conversion thesis

| Path | Who | CTA | Destination |
| --- | --- | --- | --- |
| **Primary** | Shopify merchants | Install free | `/support` → App Store path |
| **Secondary product** | Same merchants | Try demo / pricing | `/demo`, `/pricing` |
| **Secondary pillar** | Non-Shopify / bespoke | Custom inquire | `/custom-analytics#inquire` |

**Not primary:** invite-only waitlist, Partner-only voice, “request access,” “we’ll email you in.”

## Curl / CTA audit (local after polish)

| Page | Primary CTA | Free Meta+Google | Pro ~$79 when Billing | Custom inquire | Invite/waitlist-primary voice |
| --- | --- | --- | --- | --- | --- |
| `index.html` | Install free → `/support` | Yes (close band) | Yes | Link to `#inquire` | Cleared (`#install`, not `#waitlist`) |
| `pricing.html` | Install free | Plan card + honest-line | Plan card | CTA row + fine print | Cleared |
| `support.html` | App Store install steps | Trust strip | Trust strip | Section + chip | Cleared |
| `product.html` | Install free | Body + close | Close fine | Close CTA | Cleared (“listing isn’t live / email you in”) |
| `download.html` | Install free | Fine line | Fine line | CTA row | Cleared “when listed” |
| `app.html` | Install free | Billing card | Billing card | (via Support/pricing) | Cleared design-partner-only Billing |

## Files touched this tick

- `site/index.html`, `site/pricing.html`, `site/support.html`, `site/product.html`, `site/download.html`, `site/app.html`
- Conversion satellites: `site/vs/profit-trackers.html`, `site/triple-whale-alternative.html`, `site/vs-attribution-suites.html`, `site/monday-close.html`, `site/mer-calculator.html`, `site/break-even-roas-calculator.html`, `site/why-pixels-fail.html`
- `site/assets/app.js` (install/support draft copy; no “early access”)
- `site/assets/waitlist-dock.js` (observe `#install`; still Install free peek)

## Wins (conversion)

1. **Primary everywhere = Install free / App Store path** — not waitlist theater.
2. **Pricing + Support** state Free = Meta + Google, Pro ~$79 when Billing, Custom inquire secondary.
3. **Stale invite voice removed** on product/app/download/index close bands (“listing isn’t live,” “email you in,” “design partners while we learn,” “request access”).
4. **Custom inquire** surfaced on pricing, support, download, product, home close.

## Remaining (human / parent)

| Item | Owner |
| --- | --- |
| Cloudflare Pages deploy of `site/**` | Parent |
| Live App Store listing URL wired when Partner listing is public | Founder / Partner |
| `invites@` DNS vs interim Gmail | Human gate (Support copy already honest) |
| Legal pages still say “waitlist” for form KV retention | Optional later hygiene — not conversion primary |

## Gate

- No `fly deploy` / no Pages from this agent.
- Religion intact: no pixels, MTA, or forever-free bait.
