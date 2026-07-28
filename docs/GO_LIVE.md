# GO LIVE — Mcfly Analytics on free/cheap host

**Goal:** public HTTPS app installable on a Shopify store (not just `shopify app dev`).  
**Code is ready.** You (or Claude Desktop on your Mac) run the commands below.

**Do not** set App URL to `https://example.com` or `https://mcflyads.com`.

---

## Prerequisites (must be done first)

- [ ] Repo at `~/marketing-mix-model`, branch `cursor/mcfly-master-plan-eb36`
- [ ] `npx shopify auth login` succeeded
- [ ] `npx shopify app config link` → `app/shopify.app.toml` has non-empty `client_id`
- [ ] Local preview worked once (`shopify app dev` + install) — strongly recommended

If `client_id` is still empty, stop and link first. You cannot go live without it.

---

## Path: Neon (free Postgres) + Fly.io (app)

### 1. Create Neon database (~2 min)

1. https://neon.tech → sign up / log in  
2. **New project** → name `mcfly`  
3. Copy the connection string (`postgresql://...`) → this is `DATABASE_URL`  
4. Keep SSL params Neon gives you (usually `?sslmode=require`)

### 2. Install Fly CLI + log in (~3 min)

```bash
# macOS
brew install flyctl
# or: curl -L https://fly.io/install.sh | sh

fly auth login
```

### 3. Launch app from repo root (~5 min)

```bash
cd ~/marketing-mix-model
git pull origin cursor/mcfly-master-plan-eb36

# First time only — uses fly.toml in repo
fly launch --config fly.toml --no-deploy --copy-config --name mcfly-analytics
```

If the name `mcfly-analytics` is taken, pick `mcfly-analytics-<yoursuffix>` and note the URL:  
`https://THAT-NAME.fly.dev`

### 4. Set secrets (from Partner / `shopify app env show`)

```bash
cd ~/marketing-mix-model/app
npx shopify app env show
```

Then from **repo root**:

```bash
fly secrets set \
  SHOPIFY_API_KEY="YOUR_API_KEY" \
  SHOPIFY_API_SECRET="YOUR_API_SECRET" \
  SCOPES="read_orders,read_customers" \
  DATABASE_URL="YOUR_NEON_POSTGRES_URL" \
  SHOPIFY_APP_URL="https://mcfly-analytics.fly.dev" \
  NODE_ENV="production"
```

Replace `mcfly-analytics.fly.dev` with your real Fly hostname (no trailing slash).

### 5. Deploy

```bash
cd ~/marketing-mix-model
fly deploy --config fly.toml
```

### 6. Health check

```bash
curl https://mcfly-analytics.fly.dev/health
```

Expect: `{"ok":true,...}`

If not OK: `fly logs` and fix env / migrate errors.

### 7. Point Shopify at the live URL

```bash
cd ~/marketing-mix-model/app
# Update shopify.app.toml application_url + redirect_urls to your Fly URL if needed
npx shopify app deploy
```

Or in **Dev Dashboard → Mcfly Analytics → Versions**:

| Field | Value |
| --- | --- |
| App URL | `https://YOUR-APP.fly.dev` |
| embedded | `true` |
| Use legacy install flow | `false` |
| Redirect URLs | `https://YOUR-APP.fly.dev/auth/callback` (+ shopify/api variants if listed) |
| Privacy | `https://mcflyads.com/privacy.html` |
| Support | `https://mcflyads.com/support.html` |

**Never** leave App URL as `example.com` or the marketing site.

### 8. Install on a store

- Dev Dashboard → **Install app** / get install link for your development store  
- Or open: `https://YOUR-STORE.myshopify.com/admin/oauth/install?client_id=YOUR_CLIENT_ID`  
- Approve `read_orders` + minimal `read_customers` (opaque id + `numberOfOrders` only — see listing PCD)  
- Open **Mcfly Analytics** → Settings (margin) → Spend → Dashboard

### 9. Optional: branded subdomain

In Cloudflare DNS for `mcflyads.com`:

```text
CNAME  app  →  mcfly-analytics.fly.dev
```

Then:

```bash
fly certs add app.mcflyads.com
fly secrets set SHOPIFY_APP_URL="https://app.mcflyads.com"
```

Update `shopify.app.toml` + `npx shopify app deploy` again.

---

## Alternate: Railway (simpler UI, usually not free long-term)

1. https://railway.app → New Project → Deploy from GitHub (`marketing-mix-model`)  
2. Root Dockerfile: `app/Dockerfile` (repo has `railway.toml`)  
3. Add Postgres plugin **or** paste Neon `DATABASE_URL`  
4. Set the same env vars as Fly  
5. `SHOPIFY_APP_URL=https://YOUR-APP.up.railway.app`  
6. Deploy → `/health` → `shopify app deploy`

---

## Live checklist

- [ ] `/health` returns ok on public HTTPS  
- [ ] Partner App URL = that HTTPS origin (not example.com / mcflyads.com)  
- [ ] Install on development store works without `shopify app dev` running  
- [ ] Spend entry updates MER  
- [ ] Uninstall / reinstall still works  

Then reply in Cursor: **`live works`**.

---

## If stuck

| Symptom | Fix |
| --- | --- |
| Empty `client_id` | `shopify app config link` locally first |
| OAuth redirect error | `SHOPIFY_APP_URL` must match App URL exactly |
| Prisma / migrate fail on boot | Check Neon URL + SSL; `fly logs` |
| App URL still example.com | Fix Version in Dev Dashboard or `shopify app deploy` |
| Cold start / blank embed | Fly: keep `min_machines_running = 1` (already in `fly.toml`) |

Local preview only: [SHIP_NOW.md](./SHIP_NOW.md)  
Overnight / Sheets after live: [OVERNIGHT_ORCHESTRATOR.md](./OVERNIGHT_ORCHESTRATOR.md)
