# Webhook failure card — Partner 64.3%

**App:** Mcfly Analytics Public · ID `403721814017` · handle `mcfly-analytics-public`  
**Listing:** https://apps.shopify.com/mcfly-analytics-public  
**Dashboard:** https://dev.shopify.com/dashboard/227535001/apps/403721814017  
**Fly:** https://mcfly-analytics.fly.dev  
**Installs (Partner, 2026-09-08):** **1** (founder — do not invent customers)  
**Partner metric:** Webhook failure rate **64.3%** (overview) — treat as **small-N** until delivery detail is pasted.  
**Agent stamp:** 2026-09-09 · no Fly deploy · no commit

Do not invent delivery counts, status codes, or topic breakdowns. Marty must paste Partner delivery rows below.

---

## Ranked root-cause hypotheses (evidence-backed)

| Rank | Cause | Likelihood | Evidence | Code vs ops |
| --- | --- | --- | --- | --- |
| **1** | **Small-N + Shopify retries inflate %** | **High** | 64.3% = **9/14** attempts exactly. With **1** install, a few failed attempts (or one event retried then succeeded) dominate the rate. Partner counts attempts, not unique events. | Ops read |
| **2** | **Fly deploy / health-check windows → 502/503 / timeout** | **High** | Fly log `2026-09-09T04:58:24Z`: health check **failed**; Shopify would see intermittent non-2xx until check passed (`04:58:43Z`). `fly.toml` grace_period **90s** during boot. | Ops |
| **3** | **HMAC secret drift (Partner ≠ Fly `SHOPIFY_API_SECRET`)** | **Med–High** | All routes call `authenticate.webhook` first (`webhooks.*.tsx`). Empty POST → live **400** (HMAC gate works). `docs/ops/FOUNDER_DO_NOW.md` warned secret was pasted in chat and must be **rotated then re-set on Fly**. Wrong secret → **401** on every real delivery → high failure %. Local `.env` API key matches public client `bbaee078…`; **Fly digest cannot be proven equal to Partner without Marty check**. | Ops |
| **4** | **`app/scopes_update` Session P2025 → 5xx** | **Med** | Route used `db.session.update` (`webhooks.app.scopes_update.tsx`). Uninstall race / purged session → Prisma **P2025** → throw after claim → Shopify retry. **Fixed** to `updateMany` via `persistGrantedScopesOnSession` (ACK 200 if row gone). | **Code fixed** |
| **5** | **Wrong callback URI (404)** | **Low–Med** | Toml URIs are slash paths (`/webhooks/app_subscriptions/update`). Live probe of dotted `/webhooks/app_subscriptions.update` → **404**. Only hurts if Partner/manual subscription used the **filename-style** dotted path. Active app version `read-all-orders-2026-9-08` exists (CLI `shopify app versions list`). | Ops verify |
| **6** | **Topics not registered** | **Low (now)** | Older docs (`JOB_QUEUE.md` §7, `FOUNDER_DO_NOW.md`) said orders need `shopify app deploy`. Public app **has** an active released version with toml webhooks (orders + billing + compliance + uninstall + scopes). Unregistered topics produce **no** deliveries (not failures). | Ops confirm list |
| **7** | **Slow ACK / handler 5xx (orders, compliance, billing)** | **Low** | Orders: dirty-day + enqueue only (`webhooks.orders.tsx`, `JOB_QUEUE.md`). Compliance: cohort rebuild **enqueued** (`webhooks.compliance.tsx`). Billing: single Shop update (`billing-webhook.server.ts`). Live empty POSTs ACK path returns in **~3–6ms** (HMAC reject). Remaining 5xx risk = DB blip (claim throws → correct retry). | Code OK; watch logs |
| **8** | **Billing payload / plan-name miss** | **Very low for failure %** | Unknown plan → `touched: false`, still **200**. Does not inflate failure rate. | N/A |

---

## Code change this dig (not deployed)

| File | Change |
| --- | --- |
| `app/app/lib/scopes-update.server.ts` | Added `persistGrantedScopesOnSession` (`updateMany`) |
| `app/app/routes/webhooks.app.scopes_update.tsx` | Use helper; log skip if Session missing |
| `app/app/lib/scopes-update.server.test.ts` | Tests: write scopes; no-op when Session gone |

**Tests run:** `vitest` scopes-update + webhook-delivery + billing-webhook + order-webhook → **44 passed**.

**Not done:** Fly deploy (Conductor only). No commit.

---

## Live route smoke (agent, no HMAC — expect 400 not 404)

```text
POST /webhooks/orders                     → 400
POST /webhooks/compliance                 → 400
POST /webhooks/app/uninstalled            → 400
POST /webhooks/app/scopes_update          → 400
POST /webhooks/app_subscriptions/update   → 400
POST /webhooks/app_subscriptions.update   → 404  (wrong path; must not be registered)
```

---

## Marty steps (Partner + CLI) — do in order

### A. Paste the real failure breakdown (required)

1. Open https://dev.shopify.com/dashboard/227535001/apps/403721814017  
2. Overview → note **Webhook failure rate** and time window.  
3. Open **Webhooks** / delivery log (or Notifications → webhook deliveries).  
4. For each **failed** row, paste into chat or append here:

```text
topic: 
http_status: 
error / timeout?: 
callback_url: 
time (UTC): 
```

Without this paste, ranks 1–3 stay hypotheses.

### B. Confirm HMAC secret match (rank 3)

1. Partner → app `403721814017` → **Settings** / **Client credentials**.  
2. Copy **Client secret** (or rotate if still the one pasted in chat — `FOUNDER_DO_NOW.md`).  
3. Re-set Fly (does **not** require full app deploy of Desk code):

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/mcfly-analytics"
fly secrets set SHOPIFY_API_SECRET="<paste Partner client secret>" -a mcfly-analytics
```

4. Confirm `SHOPIFY_API_KEY` on Fly is `bbaee078a5ab871aea1cc99a9e01cabd` (Public), not Custom `88c56d21…`.  
5. Trigger one test delivery (step D) — expect Fly log `Received … webhook` and **200**, not 401.

### C. Confirm registered callback URLs (ranks 5–6)

1. Partner → same app → **Versions** → active version (expect something like `read-all-orders-2026-9-08`).  
2. Inspect webhook subscriptions. URIs **must** be exactly:

| Topic | URI |
| --- | --- |
| `app/uninstalled` | `https://mcfly-analytics.fly.dev/webhooks/app/uninstalled` |
| `app/scopes_update` | `https://mcfly-analytics.fly.dev/webhooks/app/scopes_update` |
| `orders/create` `orders/updated` `orders/cancelled` | `https://mcfly-analytics.fly.dev/webhooks/orders` |
| `app_subscriptions/update` | `https://mcfly-analytics.fly.dev/webhooks/app_subscriptions/update` |
| compliance: `customers/data_request` `customers/redact` `shop/redact` | `https://mcfly-analytics.fly.dev/webhooks/compliance` |

3. If any URI uses **dots** (`app_subscriptions.update`) or a tunnel/old host → fix via:

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/mcfly-analytics/app"
npx shopify app deploy --allow-updates
```

Reply in Conductor: **`webhooks registered`** + screenshot/list of topics.

### D. Prove one green delivery (after B/C)

```bash
# From app/ with Partner-linked CLI — pick a topic Shopify allows for trigger
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/mcfly-analytics/app"
npx shopify app webhook trigger \
  --topic APP_UNINSTALLED \
  --address https://mcfly-analytics.fly.dev/webhooks/app/uninstalled \
  --api-version 2025-10
```

Then:

```bash
fly logs -a mcfly-analytics
```

Expect a **2xx** for that POST and a `Received … webhook` line. If **401** → secret drift (B). If **404** → wrong URI (C). If **5xx**/timeout during deploy → wait for `/health` green and retry (rank 2).

### E. After Desk scopes fix is on Fly (Conductor deploy later)

Re-check Partner failure rate over a **fresh** window (old retries stay in history). Do not expect 64.3% to vanish until new deliveries replace the small sample.

---

## What agents must not do

- Invent install counts, delivery totals, or topic failure mixes  
- `fly deploy` from this card (Conductor after Site + Desk)  
- Commit unless Marty asks  
- Register webhooks by guessing Partner clicks — use toml + `shopify app deploy`
