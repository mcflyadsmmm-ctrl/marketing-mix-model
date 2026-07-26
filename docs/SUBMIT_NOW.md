# Submit now — baby-proof human checklist

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

1. Go to: https://dev.shopify.com/dashboard/227535001/apps/400772497409  
2. Sign in as the Partner owner if asked  

---

### 1. Flip Distribution

1. In Partner → **Mcfly Analytics** → **Distribution**  
2. Choose **Shopify App Store** (not Custom / unlisted)  
3. Save / confirm  

Reply: **`distribution done`**

---

### 2. Protected Customer Data (PCD)

1. Open the **Protected customer data** / data access request for this app  
2. Request access for **orders** + minimal **customers**  
3. Paste answers from `APP_STORE_LISTING.md` → section **Protected Customer Data (PCD)**  
4. Confirm you said: opaque `id` + `numberOfOrders` only — **no** name / email / phone / address / CRM  

Reply: **`pcd done`**

---

### 3. Publish trust pages (before reviewers click them)

Reviewers open Website / Privacy / Support / Terms from the listing. Live pages must match Free + PCD.

1. Publish Cloudflare Pages from local `site/**` (or your usual Pages deploy)  
2. Spot-check live:  
   - https://mcflyads.com/support — says App Store **Free** (not invite-only)  
   - https://mcflyads.com/pricing — Free now / paid later via Billing  
   - https://mcflyads.com/privacy — mentions order totals + opaque id / `numberOfOrders`  

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

#### 5c. Capture 5 screenshots
1. **Demo** → Load 3-year sample → Turn sample desk **ON** → use **Prepare listing shots** if shown  
2. Capture each URL (crop Admin iframe ~1600×900, **no** browser chrome):  

| # | Path | Caption |
| --- | --- | --- |
| 1 | `/app?period=y3&shot=1` | Cash MER vs break-even — one glance |
| 2 | `/app?period=ytd&shot=1` | Sales ÷ spend — the only formula we use |
| 3 | `/app/spend?shot=1` | Upload daily spend — all channels + Other |
| 4 | `/app/allocation?period=y3&shot=1` | One clear cut / shift / hold call |
| 5 | `/app/settings?shot=1` | Lock break-even from your margin % |

3. Upload **icon** + **5 screenshots** in that order  
4. **Demo** → Turn sample desk **OFF** again  

Reply: **`assets uploaded`**

---

### 6. Submit

1. Re-check: Pricing = **Free**, App URL = `https://mcfly-analytics.fly.dev` (not mcflyads.com)  
2. Re-check: sample desk **OFF** on the test store  
3. Click **Submit** for review  

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
