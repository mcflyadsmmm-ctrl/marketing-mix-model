# Overnight status — Mcfly Analytics

**Last updated:** automated overnight run  
**Live:** https://mcflyads.com (Cloudflare Pages, free tier)

## You can sleep

This agent continues without prompting. When you return, read this file + PR.

## Done tonight (so far)

- Cloudflare cleaned: only `mcflyads` Pages + zone; Workers/KV deleted
- Product marketing site live on apex (anti-attribution SaaS, not consulting)
- Warehouse sample data (demo-dtc + demo-agency) feeding interactive demos
- Shopify app Truth MVP routes: dashboard, allocation, spend, settings, connections
- Shared packages: mer-core, mer-engine, connectors, api-contract

## Still running / next loops

1. Redeploy site with brand/period toggles + allocation rec card
2. Commit + push + PR update
3. App seed path + tests green
4. Enterprise audit pass (a11y, perf, copy consistency)
5. Polish until time budget ends

## Human gates (need you awake)

| Gate | Why |
| --- | --- |
| Shopify Partner `client_id` + install | Can’t finish App Store / live store without login |
| Meta / Google OAuth apps | Optional if Script/export spend path is enough for v1 |
| Revoke leaked API tokens | Tokens were pasted in chat — rotate in CF dashboard |
| DNS if apex ever sticks on old cache | Usually self-heals; purge in CF if needed |

## Religion (locked)

Cash MER only. No pixels/MTA. Site → Shopify → Sheets. Plan beats prompt.
