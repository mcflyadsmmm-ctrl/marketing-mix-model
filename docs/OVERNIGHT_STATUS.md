# Overnight / ship status — Mcfly Analytics

**Live site:** https://mcflyads.com  
**Ship playbook:** [SHIP_NOW.md](./SHIP_NOW.md)

## Cooking status

| Layer | Status |
| --- | --- |
| Marketing site | Live — free launch waitlist |
| App code | Truth MVP + GDPR + health + Postgres migrations |
| Deploy configs | `Dockerfile`, `railway.toml`, `fly.toml`, `docker-compose.yml` |
| Partner link / host / first install | **HUMAN — do SHIP_NOW.md** |

## Your next 3 commands (after Partner login)

```bash
docker compose up -d db
cd app && npx shopify app config link && npx shopify app dev
```

Then host on Railway and `npx shopify app deploy`.

## Religion

Cash MER. Free launch → ~$79 later. No pixels/MTA.
