# Hosting baseline (Wave 0 evidence)

**Parent:** [`../FLEET_ENTERPRISE.md`](../FLEET_ENTERPRISE.md)  
**Captured:** 2026-07-31 ~22:53 UTC  
**Stage:** D0 Bootstrap

---

## Desk SaaS (compute)

| Check | Result |
| --- | --- |
| Health URL | `https://mcfly-analytics.fly.dev/health` |
| Health body | `{"ok":true,"service":"mcfly-analytics","db":"up","ts":"2026-07-31T22:53:46.958Z"}` |
| Fly app | `mcfly-analytics` |
| Image version | **135** |
| Machines | `app` started (iad) · `worker` started · standby worker stopped |
| Secrets present | `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES` (digests only) |
| SoT host | **Fly.io** (existing) |
| Free-tier reality | Fly has **no permanent free tier** for new orgs (2026). This org is already running — treat bill as **HUMAN inventory** (dashboard). Target: $0 new spend until first Pro/Custom $. |
| Standby $0 compute | **Render Free** web service — smoke/App Store review only (15m sleep, 30–60s cold start). **Never** Pro-announce on cold-start-only. |
| Ban | Cloudflare Workers Free as full Desk rewrite (Wave 0) |

## Database

| Check | Result |
| --- | --- |
| App reports | `db":"up"` via health |
| Provider | Via Fly `DATABASE_URL` secret (do not print URL) |
| Preferred free SoT | **Neon Free** if/when migrating off paid/opaque DB |
| Ban | Render Free Postgres (~30 day expiry) as production SoT |

## Static / marketing

| Check | Result |
| --- | --- |
| `https://mcflyads.com/` | HTTP **200** |
| `https://mcflyads.com/custom-analytics` | HTTP **200** |
| SoT host | **Cloudflare Pages** (current) |
| Backup $0 | GitHub Pages, Render Static |
| Ban | Vercel Hobby if commercial ToS blocks; Desk App URL ≠ marketing domain |

## Money rails ($0 until sale)

| Rail | Status |
| --- | --- |
| Gumroad (MDS Made Easy) | HUMAN — create when Education Wave 1 |
| Stripe Payment Links (Custom) | HUMAN — create when Services Wave 1 |
| Shopify Managed Pricing Pro $39 | Code path exists; announce = HUMAN |

## Scale formula

```text
hosting_monthly <= 0.15 * trailing_30d_revenue
```

Until revenue exists: keep Desk on existing Fly if already paid/pennies; do not add second always-on host.

## Failures watched

B1 (Fly card), B2 (cold start), B3 (DB limits), B5 (DNS thrash), B8 (suspend) — see [`FAILURE_REGISTER.md`](./FAILURE_REGISTER.md).

## Re-verify command

```bash
curl -sS -m 10 https://mcfly-analytics.fly.dev/health
curl -sS -m 10 -o /dev/null -w "%{http_code}\n" https://mcflyads.com/
fly status -a mcfly-analytics
```
