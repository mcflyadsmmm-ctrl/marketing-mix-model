# Your next steps — baby checklist (human only)

**Status update (Jul 22):** Claude Desktop already linked `client_id`, Docker/Prisma, Fly app + Postgres + secrets. Branch includes Docker/Prisma build fixes + [APP_STORE_LISTING.md](./APP_STORE_LISTING.md).

**Remaining on Mac:**
1. Confirm `curl https://mcfly-analytics.fly.dev/health` → ok  
2. `cd app && npx shopify app deploy --force`  
3. Install on dev store → margin → spend → MER  

Then use listing draft when ready to submit publicly.

---

Code, site, deploy configs, overnight worker, and docs are ready in the repo.  
**Only you** (or Claude Desktop on your Mac) can finish Partner install clicks.

Work top to bottom. Don’t skip. Don’t buy ads yet.

---

## Step 0 — Open the right places

| Link | Why |
| --- | --- |
| https://mcflyads.com | Marketing site (already live) |
| https://partners.shopify.com | Partner Dashboard |
| https://github.com/martysmithson04-alt/marketing-mix-model | Code |
| https://github.com/martysmithson04-alt/marketing-mix-model/pull/1 | PR with everything |
| https://neon.tech | Free Postgres |
| https://fly.io | App host |
| https://www.docker.com/products/docker-desktop/ | Local DB for preview |

On your Mac:

```bash
cd ~/marketing-mix-model
git checkout cursor/mcfly-master-plan-eb36
git pull
```

---

## Step 1 — Docker (local preview)

1. Install Docker Desktop from the link above (Apple Silicon vs Intel).
2. Open it → wait until it says **Docker Desktop is running**.
3. In Terminal:

```bash
cd ~/marketing-mix-model
docker compose up -d db
docker compose ps
```

**✅ Pass:** `db` is healthy on port `5432`.

---

## Step 2 — App env + database

```bash
cd ~/marketing-mix-model
cp app/.env.example app/.env
cd app
npx prisma migrate deploy
npx prisma generate
```

**✅ Pass:** migrations succeed with no error.

---

## Step 3 — Partner app (browser)

1. Open https://partners.shopify.com → log in as `mcflyadsmmm@gmail.com`
2. **Apps** → confirm **Mcfly Analytics** exists (create manually if missing)
3. **Stores** → create a **Development store** if you don’t have one
4. Leave App URL alone for now (CLI tunnel will set it for preview)

**✅ Pass:** You see Mcfly Analytics in Apps + a `*.myshopify.com` store.

Dev Dashboard note: **Do not** set App URL to `https://example.com` or `https://mcflyads.com`.

---

## Step 4 — Link CLI to Partner app

```bash
cd ~/marketing-mix-model/app
npx shopify auth login
```

- Browser opens → approve CLI access

```bash
npx shopify app config link
```

- Pick **Mcfly Analytics**

```bash
npx shopify app env show
```

Paste key/secret into `app/.env` if needed:

```text
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SCOPES=read_orders
SHOPIFY_APP_URL=
DATABASE_URL=postgresql://mcfly:mcfly@localhost:5432/mcfly
```

```bash
npx shopify app config validate --json
```

**✅ Pass:** `app/shopify.app.toml` has a non-empty `client_id` (not `""`).

---

## Step 5 — See the app (preview)

```bash
cd ~/marketing-mix-model/app
npx shopify app dev
```

1. Open the preview / Install link
2. Install on your **development store**
3. Approve `read_orders`
4. Admin → **Mcfly Analytics**
5. **Settings** → margin 35% → save  
6. **Spend** → add Meta $500 → save  
7. **Dashboard** → MER updates  

**✅ Pass:** You can screenshot the dashboard with a MER number.  
Reply in Cursor: **`preview works`**

---

## Step 6 — Go live (cheap host) — only after Step 5

### 6a. Neon

1. https://neon.tech → sign up  
2. New project `mcfly`  
3. Copy `DATABASE_URL` (keep SSL params)

### 6b. Fly

```bash
brew install flyctl   # if needed
fly auth login
cd ~/marketing-mix-model
fly launch --config fly.toml --no-deploy --copy-config --name mcfly-analytics
```

```bash
fly secrets set \
  SHOPIFY_API_KEY="from-step-4" \
  SHOPIFY_API_SECRET="from-step-4" \
  SCOPES="read_orders" \
  DATABASE_URL="neon-url" \
  SHOPIFY_APP_URL="https://mcfly-analytics.fly.dev"

fly deploy --config fly.toml
curl https://mcfly-analytics.fly.dev/health
```

**✅ Pass:** `{"ok":true}`

### 6c. Point Shopify at Fly

```bash
cd ~/marketing-mix-model/app
npx shopify app deploy
```

Or Dev Dashboard → Version → **App URL** = `https://YOUR-APP.fly.dev` (not mcflyads.com).

Install again on the store **with `shopify app dev` stopped**.

**✅ Pass:** App works hosted. Reply: **`live works`**

Full detail: [GO_LIVE.md](./GO_LIVE.md)

---

## Step 7 — App Store (later)

1. Partner → App Store registration (~$19): https://partners.shopify.com  
2. Listing copy, screenshots, privacy/support URLs:  
   - https://mcflyads.com/privacy.html  
   - https://mcflyads.com/support.html  
3. Shopify Billing when leaving free launch (~$79)  
4. Submit for review  

Guide: [SHOPIFY_LAUNCH.md](./SHOPIFY_LAUNCH.md)

---

## Step 8 — Built for Shopify (much later)

Needs **~50 paid-plan installs + 5 reviews** + quality bars.  
Not a buyable badge. Don’t chase until partners use the app weekly.  
https://shopify.dev/docs/apps/launch/built-for-shopify/requirements

---

## What agents already finished (you don’t redo)

- Site on mcflyads.com  
- Shopify app code (MER, spend, allocation, GDPR)  
- `/v1` API, overnight worker, Sheets orchestrator  
- Docker / Fly / Railway configs  
- Docs: SHIP_NOW, GO_LIVE, ENTERPRISE_READY  

---

## Stuck? Paste one of these

| Message | Meaning |
| --- | --- |
| `docker ready` | Continue from Step 2 |
| `linked` | `client_id` filled |
| `preview works` | Ready for Step 6 |
| `live works` | Ready for partners / listing |
| Error text from terminal | We’ll debug the exact line |
