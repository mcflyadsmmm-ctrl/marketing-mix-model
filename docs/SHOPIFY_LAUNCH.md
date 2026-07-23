# Shopify Partner → design partners → App Store approval

**Audience:** Marty (human). Agents prepare code; only you can log into Partner / submit review.  
**Product:** Mcfly Analytics — free design-partner launch first; ~$79 later via Shopify Billing.  
**Live marketing:** https://mcflyads.com  

---

## Two finish lines (don’t confuse them)

| Finish line | Meaning | When |
| --- | --- | --- |
| **A. Design-partner ready** | Install on 1–5 real/dev stores via Partner (custom/unlisted) | **Do this first** — before paid ads |
| **B. App Store approved** | Public listing merchants find in Shopify Admin | After A works + compliance checklist |

You cannot “get approved” without a working hosted app + Partner app record. Marketing can send people to the **site** now; installable app requires steps below.

---

## Part 1 — What is already done in this repo

- Embedded Shopify app (dashboard, spend, settings, allocation)
- GDPR compliance webhook routes (`customers/data_request`, `customers/redact`, `shop/redact`)
- Uninstall deletes sessions + shop data
- No shop-domain install form (App Store 2.3.1)
- No silent mock sales in production loaders
- Privacy / support / terms on mcflyads.com
- Prisma migration for Shop / Settings / SpendEntry
- `shopify.app.toml` ready for link (URLs default to `app.mcflyads.com`)

**Still on you:** Partner login, hosting URL that works, first install, then App Store listing assets + submit.

---

## Part 2 — Design-partner ready (walkthrough)

### Step 1. Shopify Partner account

1. Go to [partners.shopify.com](https://partners.shopify.com) and sign in (or create Partner account).
2. Create a **development store** if you don’t have one (Partners → Stores → Add store → Development).
3. Optional but useful: a second store for a design partner later.

### Step 2. Create the app in Partner Dashboard

1. Partners → **Apps** → **Create app** → Create app manually (or “Create with Shopify CLI” — either works).
2. Name: **Mcfly Analytics**.
3. Note you will get an **API key** (client ID) and **API secret**.

### Step 3. Link this repo (CLI on your machine)

On your laptop (with Node 20+ and this repo):

```bash
cd app
npm install -g @shopify/cli@latest
shopify auth login
shopify app config link
```

Pick the Partner app you just created. This writes `client_id` into `shopify.app.toml` and pulls env values.

```bash
shopify app env show
# or copy into app/.env:
# SHOPIFY_API_KEY=...
# SHOPIFY_API_SECRET=...
# SCOPES=read_orders,read_customers
# SHOPIFY_APP_URL=https://....   # tunnel or production host
# DATABASE_URL=file:./dev.sqlite   # local only
```

Validate:

```bash
shopify app config validate --json
```

### Step 4. Run locally against a dev store (first install)

```bash
cd app
npm install
npx prisma migrate deploy
shopify app dev
```

CLI opens a tunnel and offers **Install** on your development store.  
In Admin you should see: MER Dashboard, Spend, Settings, Allocation.

**Smoke test**

1. Settings → set margin %  
2. Spend → add Meta/Google amounts for MTD  
3. Dashboard → MER = sales ÷ spend  
4. Allocation card shows a recommendation  

### Step 5. Host for partners (not just CLI tunnel)

Partners need a stable HTTPS URL (not only your laptop tunnel).

Pick one:

| Option | Notes |
| --- | --- |
| **Fly.io / Railway / Render** | Deploy `app/` with Postgres `DATABASE_URL` |
| **Cloudflare** | Possible later; start simple with Fly/Railway |

Minimum env on host:

```text
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=read_orders,read_customers
SHOPIFY_APP_URL=https://app.mcflyads.com   # or your host URL
DATABASE_URL=postgresql://...              # production
```

DNS: point `app.mcflyads.com` → your host (CNAME).  
Then:

```bash
cd app
shopify app deploy
```

This pushes TOML (scopes, webhooks, URLs) to Shopify.

In Partner Dashboard → App setup, confirm:

- App URL = your host  
- Allowed redirection URLs match TOML  
- Compliance webhooks registered  

### Step 6. Partner Dashboard URLs (App Store + trust)

Set these in Partner Dashboard → App → Distribution / Store listing / App setup as available:

| Field | Value |
| --- | --- |
| Privacy policy | https://mcflyads.com/privacy.html |
| Support / contact | https://mcflyads.com/support.html |
| Website | https://mcflyads.com |

### Step 7. Invite design partners (still free)

**Do not** submit to App Store yet unless you want public discovery.

Use **custom distribution** / install link / “Test on development store”:

1. Partner Dashboard → your app → Distribution  
2. Choose custom / unlisted install for specific shops **or** install on their development store collaborator access  
3. Email them: free launch, feedback expected, pricing later  

Keep the waitlist on mcflyads.com as the front door until installs are smooth.

---

## Part 3 — App Store approval (public listing)

Do this only after Part 2 works on a real store for a week.

### Step 8. Pre-submit compliance checklist

Confirm in code + dashboard:

- [x] Compliance webhooks implemented (in repo)  
- [ ] Webhooks showing as healthy after `shopify app deploy`  
- [ ] Privacy policy URL set  
- [ ] Support URL set  
- [ ] App installs **only** from Shopify Admin / App Store (no “enter your myshopify domain” on marketing CTAs)  
- [ ] Free plan or Shopify Billing if charging (never charge off-platform for a listed app)  
- [ ] Screenshots (desktop embedded UI) — 3–6  
- [ ] Demo / test store credentials for reviewers in submission notes  
- [ ] App name, subtitle, category, description match **cash MER** (not MMM consulting)  
- [ ] Postgres in production (not SQLite)  
- [ ] No fabricated sales numbers  

Official refs:

- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)  
- [Submit for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)  
- [About billing](https://shopify.dev/docs/apps/launch/billing)  

### Step 9. Listing copy (suggested)

- **Name:** Mcfly Analytics  
- **Tagline:** Cash MER for Shopify — spend vs sales, not attribution theater  
- **Category:** Reporting / Analytics (or Marketing — pick closest)  
- **Description:** Explain MER formula, break-even, manual spend, free launch / paid later via Shopify Billing  
- **What it doesn’t do:** pixels, MTA, path credit  

### Step 10. Submit

1. Partner Dashboard → Distribution → **Shopify App Store**  
2. Complete listing, pricing (Free for launch special), protected customer data questions (orders = sales totals — answer honestly)  
- We request `read_orders` to sum sales for MER — not to build a customer CRM.  
3. Submit for review  
4. Respond to reviewer comments within a few days  

Typical review: Shopify checks install, webhooks, privacy links, billing rules, that the app does what the listing says.

---

## Part 4 — What to market when

| You finished… | You can market… |
| --- | --- |
| Site only | Waitlist, demos, education |
| Part 2 (hosted + install) | “Install free on your store” to design partners |
| Part 3 (App Store live) | Broad Shopify merchant acquisition |

---

## Part 5 — Common rejection reasons (avoid)

1. Asking merchants to type `.myshopify.com` to install  
2. Missing GDPR compliance webhooks  
3. Broken privacy/support URLs  
4. Charging outside Shopify Billing while listed  
5. App doesn’t match listing (e.g. promising live Meta sync before it ships)  
6. Using mock/fake metrics during review  

---

## Part 6 — Your next 60 minutes (concrete)

1. [ ] partners.shopify.com → create app + development store  
2. [ ] `cd app && shopify auth login && shopify app config link`  
3. [ ] `shopify app dev` → install → enter spend → see MER  
4. [ ] Pick host (Fly/Railway) → Postgres → deploy → `shopify app deploy`  
5. [ ] DNS `app.mcflyads.com` → host  
6. [ ] Invite one design partner  
7. [ ] Only then: App Store listing + submit  

When Step 3 works, tell the agent — we can help with deploy config, Billing API for ~$79, and listing screenshots from the real UI.
