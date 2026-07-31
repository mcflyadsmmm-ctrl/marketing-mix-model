# Website readiness — mcflyads.com

**Status:** Launch-ready for **marketing + free-launch waitlist** (July 21, 2026).  
**Not the same as:** Shopify app installable (see [SHOPIFY_LAUNCH.md](./SHOPIFY_LAUNCH.md)).

## Green

| Area | Status |
| --- | --- |
| Homepage thesis + live demos | Cash MER desk, claims vs cash, break-even, allocation |
| Free launch CTAs | Partner invite → `POST /api/waitlist` (Pages Function + KV; FormSubmit/Resend best-effort) |
| Product / pricing / app / download | Consistent chrome, fonts, positioning |
| Privacy / terms / support | App Store URL–ready; Utah governing law; GDPR language |
| SEO basics | Canonicals (clean URLs), sitemap, robots Allow, OG + Twitter on key pages |
| Mobile | Hero not forced full-viewport on small screens; compare table scrolls |
| 404 | Branded |
| PWA | SW registers only on `/download`; calculator works |
| Hosting | Cloudflare Pages (static) — handles traffic |

## Partner Dashboard URLs (use these)

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcflyads.com/privacy.html |
| Support | https://mcflyads.com/support.html |
| Terms | https://mcflyads.com/terms.html |

## Still optional / later

- Domain email DNS for `invites@mcflyads.com` / `hello@` (H5) — UI already targets invites@; interim inbox `mcflyadsmmm@gmail.com`  
- Search Console verification + request indexing  
- PNG PWA icons (192/512) — SVG works; PNG helps install prompts  
- Optional: set Pages secret `RESEND_API_KEY` (+ `RESEND_FROM`) for first-party email; until then FormSubmit → interim Gmail (activate once via FormSubmit confirmation email)  
- Disable Cloudflare “managed robots” AI Disallows in dashboard if you want AI crawlers (origin robots is search-open)

### Waitlist POST (live)

- **Endpoint:** `POST https://mcflyads.com/api/waitlist` (also `GET` for health/docs JSON)
- **Function:** `functions/api/waitlist.js` (sibling of `site/` for `wrangler pages deploy site`)
- **Client:** `site/assets/app.js` — shows plain-text payload + honest delivery (`emailed` / `stored` / failed). Mailto is fallback only.
- **Durable:** Cloudflare KV binding `WAITLIST` (`wrangler.toml`)
- **Email:** Resend if secret present; else FormSubmit.co ajax to interim inbox (no Mcfly secret required)

## Do not market yet

“Install the Shopify app from the site” until Partner link + hosted app exist.
