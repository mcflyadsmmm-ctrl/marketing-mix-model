# SHIP NOW — get Mcfly cooking tonight

**Goal:** first Shopify install showing cash MER.  
**Site is already live:** https://mcflyads.com (waitlist OK).  
**You must do Partner login** — agents cannot.

Time box: ~45–90 minutes if Partner account exists.

---

## 0. Prereqs on your laptop

- Node 20+ / 22+
- Docker Desktop (for local Postgres) **or** a Railway Postgres
- Shopify Partner account: https://partners.shopify.com
- This repo cloned

```bash
git clone https://github.com/martysmithson04-alt/marketing-mix-model.git
cd marketing-mix-model
git checkout cursor/mcfly-master-plan-eb36
npm install
```

---

## 1. Database (2 min)

```bash
docker compose up -d db
cp app/.env.example app/.env
# DATABASE_URL already points at local Postgres
cd app && npx prisma migrate deploy && npx prisma generate && cd ..
```

---

## 2. Create + link Shopify app (10 min)

1. Partners → **Apps** → **Create app** → name **Mcfly Analytics**
2. Create a **Development store** if you don’t have one

```bash
cd app
npx shopify auth login
npx shopify app config link
# pick Mcfly Analytics — writes client_id into shopify.app.toml
npx shopify app env show
# paste API key/secret into app/.env if not auto-filled
```

Fill `app/.env`:

```text
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SCOPES=read_orders
SHOPIFY_APP_URL=   # leave blank for `shopify app dev` tunnel first
DATABASE_URL=postgresql://mcfly:mcfly@localhost:5432/mcfly
```

Validate:

```bash
npx shopify app config validate --json
```

---

## 3. First install — COOK (5 min)

```bash
cd app
npx shopify app dev
```

- Open the preview / Install on your development store  
- Admin → Mcfly Analytics  
- **Settings** → set margin %  
- **Spend** → add Meta/Google dollars for MTD  
- **Dashboard** → see cash MER  

If sales show $0 with an error banner, check `read_orders` was approved on install.

---

## 4. Host for partners (20–40 min) — go live

**Full free/cheap walkthrough:** [GO_LIVE.md](./GO_LIVE.md) (Neon + Fly).

Pick **one**. Do not set App URL to `example.com` or `mcflyads.com`.

### Option A — Neon + Fly (recommended, cheapest)

1. Neon: https://neon.tech → project → copy `DATABASE_URL`  
2. Fly: `brew install flyctl && fly auth login`  
3. From repo root:

```bash
fly launch --config fly.toml --no-deploy --copy-config --name mcfly-analytics
fly secrets set \
  SHOPIFY_API_KEY=... \
  SHOPIFY_API_SECRET=... \
  SCOPES=read_orders \
  DATABASE_URL="neon-url" \
  SHOPIFY_APP_URL="https://mcfly-analytics.fly.dev"
fly deploy
curl https://mcfly-analytics.fly.dev/health
cd app && npx shopify app deploy
```

Keep `min_machines_running = 1` (already in `fly.toml`) so cold starts don’t kill OAuth.

### Option B — Railway

1. https://railway.app → New Project → Deploy from GitHub (this repo)  
2. Add **Postgres** plugin → copy `DATABASE_URL`  
3. Set root/Dockerfile: `app/Dockerfile` (or use `railway.toml` in repo)  
4. Variables:

```text
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=read_orders
SHOPIFY_APP_URL=https://YOUR-APP.up.railway.app
DATABASE_URL=   # from Railway Postgres
NODE_ENV=production
PORT=3000
```

5. Deploy → hit `https://YOUR-APP.up.railway.app/health` → `{"ok":true}`  
6. Optional DNS: `app.mcflyads.com` CNAME → Railway  
7. Update `SHOPIFY_APP_URL` to the final HTTPS URL  

```bash
cd app
npx shopify app deploy
```

---

## 5. Partner Dashboard URLs

| Field | Value |
| --- | --- |
| App URL | your hosted HTTPS origin |
| Privacy | https://mcflyads.com/privacy.html |
| Support | https://mcflyads.com/support.html |
| Website | https://mcflyads.com |

---

## 6. Invite design partners (free launch)

- Custom distribution / install link from Partner Dashboard  
- Or collaborator access to their store  
- Point them at mcflyads.com waitlist if not ready  

**Do not** buy App Store ads until listing is live.  
**Do not** chase Built for Shopify until ~50 installs + 5 reviews.

---

## Done when

- [ ] `/health` returns ok on host  
- [ ] Dev store install works  
- [ ] Spend entry → MER updates  
- [ ] Uninstall cleans data (spot-check)  
- [ ] One design partner invited  

Then reply in Cursor: **“install works”** — next is App Store listing assets + Shopify Billing for ~$79.

---

## If stuck

| Symptom | Fix |
| --- | --- |
| Empty `client_id` | `shopify app config link` again |
| OAuth redirect error | `SHOPIFY_APP_URL` must match host exactly (https, no trailing slash issues) |
| Prisma migrate fail | Confirm Postgres up; `docker compose ps` |
| Mock/$0 sales | Reinstall with `read_orders`; check Admin API errors in logs |
| Monorepo Docker build fail | Build from **repo root** with `-f app/Dockerfile` |

Full detail: [SHOPIFY_LAUNCH.md](./SHOPIFY_LAUNCH.md)
