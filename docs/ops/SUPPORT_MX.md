# Support inbound — MX gate (status 2026-09-18)

**Lane:** Ops. Measure and write. **Do not change DNS.** Namecheap / Cloudflare MX is **HUMAN** leftover. **MX is not done.**

**Ops 2026-09-18:** Status-only refresh after smoke. No DNS, no wrangler, no Pages. Mail path unchanged.

---

## Where mail lands today

| Address | Role | Status |
| --- | --- | --- |
| **mcflyadsmmm@gmail.com** | **Primary inbound today** | Listing developer/support email, Fly `/support`, `/app` host page. Monitor this inbox. |
| invites@mcflyads.com | Secondary on `/support` | Also listed on Fly support HTML. Do not assume MX for `@mcflyads.com` works until the human gate is done. |
| **support@mcflyads.com** | Desired brand inbox | **Not live** until Namecheap MX → Cloudflare. Ops did not touch DNS. |

Gmail MCP was **not used** this run. Ops did not read the mailbox. Founder watches Gmail.

---

## Leftover (not MX-complete)

Until MX cutover:

1. **Monitor `mcflyadsmmm@gmail.com`** (and 1-star App Store reviews — a 1-star is inbound too).
2. Reply from the address merchants already see. Do not advertise `support@` as working.
3. Include store domain + spend / Total ROAS / billing in replies; no public shop-domain form.

**Ops must not:** edit Namecheap, Cloudflare DNS, or MX records. No `wrangler`, no Pages.

---

## After MX (founder, later)

When Marty has moved MX to Cloudflare and `support@mcflyads.com` receives a test message:

- Site/Listing lanes update support URLs/copy (not this lane).
- Keep Gmail as fallback until a full week of `support@` delivery is proven.

---

## 1-star / listing watch

Listing is live with **0 reviews** as of the 2026-09-18 Ops curl (**0.0/5**, **(0 Reviews)**, **No reviews yet**). Until MX exists, the early-warning loop is:

- Gmail (`mcflyadsmmm@gmail.com`)
- Public listing reviews on https://apps.shopify.com/mcfly-analytics-public

Do not invent review counts. A first 1-star is a support ticket — answer the merchant, do not buy ads to drown it.
