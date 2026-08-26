# App Store requirement matrix — Mcfly Analytics

Source: [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) (as pasted 2026-08-25).  
App: **Mcfly Analytics** · handle `mcfly-analytics-public` · App URL `https://mcfly-analytics.fly.dev` · Fly **v143** (reported live release; repository verification below is source-only).

Legend: **PASS** = evidenced in this repo (live-host evidence is called out separately) · **N/A** = category does not apply · **HUMAN** = Partner Dashboard, Admin session, or MFA still required.

This matrix does **not** claim Shopify will approve the app. App Review can still reject. Live Admin iframe smoke and Partner Submit are HUMAN.

## 1. Policy

| ID | Result | Evidence |
| --- | --- | --- |
| 1.1.1 Session tokens | **PASS** | Embedded app uses `authenticate.admin` + Prisma sessions. No third-party-cookie auth. Spend `localStorage` is UI prefs only (try/catch). |
| 1.1.2 Shopify checkout | **N/A** | No checkout, payments, or order-create path. |
| 1.1.3 Theme Store | **N/A** | No theme download. |
| 1.1.4 Factual information | **PASS (code + paste)** / **HUMAN (Partner fields + live Pages)** | Listing paste blocks no longer include plan prices or “later $39”. Trust copy updated in `site/`. **Pages on mcflyads.com still need a human publish from this branch** (workflow is `main`-only). The in-app CTA starts a 7-day trial then charges $39; Partner Pricing must show that one plan and no Free plan. |
| 1.1.5 Unique apps | **PASS** | Single public app `mcfly-analytics-public`. Custom client archived in `shopify.app.custom.toml`. |
| 1.1.6 Marketplaces | **N/A** | Admin cash desk, not a classifieds marketplace. |
| 1.1.7 Payments API | **N/A** | Not a payment gateway. |
| 1.1.8 Shopify POS only | **N/A** | No third-party POS. |
| 1.1.9 Buyer consent for charges | **N/A** | No cart / checkout charges. |
| 1.1.10 Cheapest shipping default | **N/A** | No shipping reordering. |
| 1.1.11 Browser extensions optional | **N/A** | No browser extension. |
| 1.1.12 Web-based | **PASS** | Embedded Admin web app. No desktop binary. |
| 1.1.13 Duplicate product info | **N/A** | No scrape / import-from-any-store. |
| 1.1.14 Agencies | **N/A** | No freelancer marketplace. |
| 1.1.15 Refunds via original processor | **N/A** | No refund product. |
| 1.1.16 Capital lending | **N/A** | No lending. |
| 1.2.1–1.2.3 Billing | **PASS (repo code)** / **HUMAN (Partner Pricing + live config)** | Shopify Managed Pricing code supports plan changes without reinstall. `app-store-requirement-verify.test.ts` rejects Stripe/PayPal app-subscription indicators. Partner must actually list one plan ($39 / 30 days, 7-day free trial) and confirm live billing configuration. |
| 1.3.1 No review incentives | **PASS** | Automated runtime-source guard rejects review-for-extra-days / discount / unlock incentives. |

## 2. Functionality

| ID | Result | Evidence |
| --- | --- | --- |
| 2.1.1 No critical errors | **PASS (repo code)** / **HUMAN (deployed Admin smoke)** | `billing-exit.server.ts`, `billing-navigate.ts`, and `ProUpgradeButton.tsx` preserve user-gesture `open(_, "_top")` plus the GET `/app/billing` HTML bounce. The source guard asserts both paths. A reviewer must still click Upgrade on the deployed app. |
| 2.1.2 Minor errors | **HUMAN** | Needs a logged-in Admin pass on `devmcflyads` / `mcfly-2`. |
| 2.1.3 Interactable UI | **PASS** | Embedded Polaris desk (Overview, Spend, Allocation, Goals, Settings). |
| 2.1.4 Data sync | **PASS** | Sales from GraphQL Admin; spend merchant-entered. SAMPLE desk must be **OFF** for live review. |
| 2.2.1 Shopify APIs | **PASS** | GraphQL Admin (`read_orders`, `read_customers`). PCD source guard limits customer selections to opaque `id` + `numberOfOrders`; no name/email/phone/address fields. |
| 2.2.2 Embedded experience | **PASS** | Off-platform features (plans) exit to Admin top frame, then return. |
| 2.2.3 Latest App Bridge | **PASS** | Source guard asserts `app-bridge.js` is in `<head>` and precedes all other scripts, `<Links>`, and `<Scripts>` when `loadAppBridge`. |
| 2.2.4 GraphQL Admin API | **PASS** | Runtime-source scan rejects Admin REST imports, `admin.rest`, and `/admin/api/*.json`; tests and `app/CHANGELOG.md` are not treated as runtime usage. |
| 2.2.5–2.2.7 Admin extensions | **N/A** | No admin UI blocks / actions / max-modal product. |
| 2.2.8–2.2.9 Sidekick | **N/A** | No Sidekick extension. |
| 2.3.1 Install from Shopify | **PASS** | Source guard asserts `auth.login` has no shop-domain input or myshopify-domain collection prompt. |
| 2.3.2–2.3.4 OAuth immediately | **PASS** | Shopify app template OAuth before UI. Reinstall re-auths. |

## 3. Security

| ID | Result | Evidence |
| --- | --- | --- |
| 3.1.1 TLS | **PASS** | Fly `force_https`; live `/health` is HTTPS 200. |
| 3.2.1 `read_all_orders` | **N/A / PASS** | Both public TOMLs are automatically pinned to `read_orders,read_customers`; `read_all_orders` is rejected. Live Fly scopes still require human confirmation. |
| 3.2.2–3.2.5 special scopes | **N/A** | Not requested. |

## 4. App Store listing

| ID | Result | Evidence |
| --- | --- | --- |
| 4.1.1–4.1.2 Name | **PASS** | `Mcfly Analytics` in TOML + listing paste. HUMAN: Dashboard name matches. |
| 4.2.1 Accurate pricing | **HUMAN** | Partner **Pricing details** = one plan, $39/store/mo, 7-day free trial. Docs tell the human to set it and to remove the Free plan. |
| 4.2.2 No pricing in images | **PASS (docs + generator)** / **HUMAN (upload)** | `04-free-pro-pricing.png` is banned. `listing-shot-04.py` refuses to regenerate it. Recapture Allocation for shot 4. |
| 4.2.3 No pricing elsewhere in listing | **PASS (paste blocks)** / **HUMAN (Partner form)** | Short / long / features marked `APP_STORE_PASTE` with no `$39`. Do not paste reviewer notes into the public listing. |
| 4.3.1 Online Store required | **PASS (docs)** / **HUMAN** | Checklist: leave “Merchant must have online store” **unchecked**. |
| 4.3.2 Languages | **PASS** | English only. |
| 4.3.3–4.3.4 No stats / “best/only” | **PASS (paste + captions)** | Listing test rejects quantified outcome claims, guarantees, and “the first/best/only”; captions no longer say “the only formula”. |
| 4.3.5 Tags | **HUMAN** | Marketing analytics / advertising — human picks in Partner. |
| 4.3.6–4.3.7 No testimonials | **PASS** | Listing paste has none. |
| 4.3.8 Geographic requirements | **N/A** | None. |
| 4.4.1–4.4.2 Subtitle / details | **PASS (draft)** / **HUMAN (paste)** | Tagline + long description in `APP_STORE_LISTING.md`. |
| 4.4.3 Shopify brand in graphics | **HUMAN** | Icon is M-only; screenshots must stay app UI, no Shopify trademark misuse. |
| 4.4.4–4.4.5 Unique product shots | **HUMAN** | Founder pack: replace pricing shot; recapture Allocation; SAMPLE OFF after. |
| 4.5.1–4.5.2 Sales channel category | **PASS** | Regular embedded app. No channel config. |
| 4.5.3 Demo screencast | **HUMAN** | English (or English subtitles). Must show Spend → Upgrade **top-frame** (not iframe refuse). |
| 4.5.4–4.5.5 Test credentials | **PASS (paste pack)** / **HUMAN (Partner form)** | Form: Username/Password **empty**, checkbox **checked**. Testing instructions include `Username: none` / `Password: none` plus how to reach Pro (Upgrade). Never submit blank fields with the box off. Never paste `<PASTE…>` or a 2FA store-owner password. |
| 4.5.6 Emergency developer contact | **HUMAN** | Partner account settings. |

## 5. Category-specific

| Category | Result |
| --- | --- |
| 5.1 Online store / theme app extensions | **N/A** — source/config guard finds no theme app extension configuration |
| 5.2–5.3 Payments | **N/A** — source/config guard finds no Payments API or payment extension |
| 5.4 Purchase options / subscriptions | **N/A** |
| 5.5 Product sourcing | **N/A** |
| 5.6 Checkout customization | **N/A** — source/config guard finds no checkout UI extension |
| 5.7 Sales channel | **N/A** — source/config guard finds no channel configuration |
| 5.8 Post purchase | **N/A** |
| 5.9 Mobile app builders | **N/A** |
| 5.10 Donation | **N/A** |
| 5.11 Blockchain | **N/A** |

## What this environment can and cannot test

| Surface | Connected? |
| --- | --- |
| Fly.io (`mcfly-analytics`) | **Yes** — deploy + secrets + `/health` |
| App Shopify API key/secret | **On Fly only** (not in this cloud agent’s shell) |
| Shopify Partner CLI (`shopify app deploy`) | **No** — no Partner login / MFA |
| Merchant Admin (`admin.shopify.com`) | **No** — cannot click Spend → Upgrade as a reviewer |
| Gmail | **Yes** — pause email 2026-08-24 ref 127166 |
| Unit / listing scans | **Yes** — no Shopify session required |

## Human Submit gate

1. Partner Pricing = Shopify App Pricing **one plan, $39/store/mo, 7-day free trial** — remove the Free plan.
2. Paste short / long / features from `APP_STORE_LISTING.md` paste markers — **not** reviewer notes.
3. Do **not** upload `04-free-pro-pricing.png`. Recapture Allocation.
4. Testing form: Username/Password empty, **check** “My app doesn't require an account”; paste the TEST ACCOUNT block from `PARTNER_TESTING_INSTRUCTIONS.md`.
5. Screencast: install → Settings → Start 7-day trial → top-frame plans (no “refused to connect”).
6. SAMPLE desk **OFF** on the review store.
7. Emergency contact on the Partner account.
8. Publish updated `site/` trust pages to mcflyads.com (Pages is `main`).
9. Submit.
