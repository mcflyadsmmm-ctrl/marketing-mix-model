# Submit now — baby-proof human checklist

**One-pager at the keyboard:** [`docs/ops/SUBMIT_HANDOFF.md`](./ops/SUBMIT_HANDOFF.md)

Do these steps **in order**. After each step, reply in Cursor with the bold phrase so the agent can verify.

**App:** Mcfly Analytics · **Pricing must be Free** · cash MER = sales ÷ spend  
**Host:** https://mcfly-analytics.fly.dev (must show healthy)  
**Icon file:** `docs/listing-assets/mcfly-app-icon-1200.png` (M-only, 1200×1200)  
**Paste copy from:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Shot list:** [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)

Agent craft is done. **Do not ask for new product features before Submit.**  
Refuse: pixels / MTA / “true ROAS” / Triple Whale clones.

---

### 0. Open Partner app (once)

1. Go to: https://dev.shopify.com/dashboard/227535001/apps/403721814017  
   (**Mcfly Analytics Public** — not the Custom app `400772497409`)  
2. Sign in as the Partner owner if asked  

---

### 1. Flip Distribution

1. In Partner → **Mcfly Analytics** → **Distribution**  
2. Choose **Shopify App Store** (not Custom / unlisted)  
3. Save / confirm  

Reply: **`distribution done`**

---

### 2. Protected Customer Data (PCD) — **before** Submit

**Read first:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) — Level 1 vs 2 in plain English.

Shopify: you **cannot** apply for PCD while the app is already under review. Do this now.

1. Open **API access** → **Protected customer data access**  
2. Request **Level 1 only**: check **Protected customer data**  
3. Leave **name / address / email / phone unchecked** (Level 2 — slower review; **not** needed for cash MER or till LTV)  
4. Paste answers from `APP_STORE_LISTING.md` → section **Protected Customer Data (PCD)**  
5. Confirm: opaque `id` + `numberOfOrders` only — **no** CRM  

**LTV later:** till LTV (opaque cohorts) stays on Level 1. You can request Level 2 **after launch** if you ever need email/name CRM — optional, not required for the LTV feature you want.

Reply: **`pcd done`**

---

### 2b. Emergency developer contact (Partner Settings)

Shopify requires an emergency email + phone for critical app issues ([submit guide](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review)).

1. Partner / Dev Dashboard → account or app **Settings** → emergency developer contact  
2. Add a monitored **email** (no “Shopify” in the address) + **phone**  
3. Allowlist `noreply@shopify.com` so review mail isn’t junked  

Reply: **`emergency contact done`**

---

### 3. Spot-check trust pages (before reviewers click them)

Reviewers open Website / Privacy / Support / Terms from the listing. **Use the Fly URLs** until mcflyads.com Pages is republished (live Support still says “when Billing”).

1. https://mcfly-analytics.fly.dev/support — Install free / email a human. No shop-domain form.
2. https://mcfly-analytics.fly.dev/pricing — one plan, $39/store/mo after a 7-day trial, via Shopify App Pricing
3. https://mcfly-analytics.fly.dev/privacy — order totals + opaque id / `numberOfOrders`
4. https://mcfly-analytics.fly.dev/terms — App Store one plan
5. https://mcfly-analytics.fly.dev — Website / landing (same host as App URL)

Reply: **`pages live`**

---

### 4. Install smoke on `devmcflyads`

Full baby steps: [`INSTALL_SMOKE.md`](./INSTALL_SMOKE.md).

**Critical:** Demo → **Turn sample desk OFF** before judging live numbers.

1. Open Mcfly Analytics inside Admin on `devmcflyads`  
2. **Demo** → sample desk **OFF** (Settings footer link if Demo not in nav)  
3. **Settings** → set contribution margin (e.g. 35%) → contextual save bar → see break-even update  
4. **Spend** → download CSV template → fill a few days (include **Other**) → Import  
5. **Cash MER** → confirm MER ≈ Shopify sales ÷ spend; orders / new / returning show  
6. **Allocation** → confirm a recommendation when spend > 0  

Reply: **`install works`**

---

### 5. Listing copy + shots + icon

#### 5a. Paste listing text
Open App Store listing fields. Paste from `APP_STORE_LISTING.md`:

- App name / tagline / short description / long description  
- Feature bullets (all 5, in order)  
- Reviewer notes (full block)  

#### 5b. Pricing
Set pricing to **Free**.  
Do **not** enable paid plans or Shopify Billing charges yet.

#### 5b-HUMAN. Works with
**Leave Works with blank.** Mcfly has no Checkout UI extension — do not select Checkout. Never add Meta / Google / SyncWith. (Checkout only later if a real Checkout surface ships.)

#### 5c. Screenshots (founder pack — almost ready)
**4 of 5** letterboxed PNGs are in `docs/listing-assets/shots/` — captions in [`CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

| # | Upload file | Caption |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | Total ROAS vs break-even — one glance |
| 2 | `02-explorer-sales-div-spend.png` | Channel mix vs Total ROAS — sales ÷ spend |
| 3 | `03-margin-breakeven.png` | Lock break-even from your margin % |
| 4 | `04-free-pro-pricing.png` | Free Meta + Google · Pro unlocks channels + LTV |
| 5 | **Still capture** `/app/spend?shot=1` (or Allocation) | Select platforms → export daily → combine |

**Do not upload** `05-HOLD-marketing-site-do-not-upload.png` (marketing site ≠ App Store app UI).

1. Upload **icon** + screenshots **1–4**, then shot **5** when captured  
2. **Demo** → Turn sample desk **OFF** again  

#### 5d. Demo screencast (required listing package)
Short Loom/screen recording showing: install → margin → CSV spend upload → Cash MER. Upload on the App Store review / listing form where “demo video / screencast” is requested.

#### 5e. Partner automated checks
On the App Store review page, run Shopify’s **automated checks** and fix any failures before Submit.

Reply: **`assets uploaded`**

---

### 6. Submit

1. Re-check: Pricing = **Free**, App URL = `https://mcfly-analytics.fly.dev` (not mcflyads.com)  
2. Re-check: sample desk **OFF** on the test store (never leave SAMPLE + `?shot=1` as the reviewer path — **1.1.4**)  
3. Re-check: testing instructions + store credentials filled for reviewers  
4. Click **Submit** for review  

Reply: **`submitted`**

---

## If something breaks

| Symptom | What to do |
| --- | --- |
| Health not ok | Tell the agent: “health down” — do not Submit |
| CSV won’t import | Retry template; include Day + at least one channel column |
| MER looks fake | Sample desk is probably still ON — turn **OFF** |
| Live support says invite-only | You skipped step 3 — publish Pages first |
| Partner asks for paid plan | Stay **Free** until Billing ships |

Approval can take **days–weeks**. Do not expand scope while waiting.
