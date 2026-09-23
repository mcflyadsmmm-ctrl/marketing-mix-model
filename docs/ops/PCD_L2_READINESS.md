# PCD Level 2 readiness — Mcfly Analytics (2026-09-23)

**Status:** **Approved** — Public app, fields **Name, Email, Phone, Address**. This ship adds `read_reports` and sets `SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE = true`. SAMPLE still does not paint QL day totals as Live. `MCFLY_SAMPLE_ONLY` stays `true`. `MCFLY_LIVE_STAGE` stays `parked`. Cursor does **not** Fly deploy, Partner Submit, or unpark.

**Product truth:** Core desk works at **L1** (order totals + opaque `customer.id` / `numberOfOrders`). L2 is requested **only** because Shopify’s `shopifyqlQuery` field requires Level 2 fields even for aggregate `FROM sales` totals. We will **not** store, display, export, or email name / address / phone / email.

**SoT policies:** [`PCD_L2_INCIDENT_RESPONSE.md`](./PCD_L2_INCIDENT_RESPONSE.md) · [`PCD_L2_ACCESS_DLP.md`](./PCD_L2_ACCESS_DLP.md)  
**Privacy:** Fly `/privacy` + listing URL `https://mcflyads.com/privacy`  
**Compliance webhooks:** `customers/data_request`, `customers/redact`, `shop/redact` (toml) · Level-1 opaque export already in Settings

---

## Marty Partner Dashboard steps

1. Apps → **mcfly-analytics-public** → **API access requests** → Protected customer data → Request / Manage  
2. Keep **Protected customer data** (L1) approved  
3. Select fields: **Name, Address, Email, Phone** — paste reasons below each  
4. Complete **Data protection details** using answers in § Questionnaire  
5. Confirm privacy URL is live and matches  
6. **Submit for review** (Marty only)  
7. After **Approved**: Conductor adds `read_reports` + flips `SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE`. **Done in git.** Do **not** add GraphQL selections for name/email/phone/address. Fly deploy and merchant re-auth stay Marty.

---

## Field reasons (paste)

### Protected customer data (already L1 — keep)

> Mcfly Analytics is a Shopify order-book and cash Total ROAS desk ($39/mo). We read order totals and dates, plus opaque customer id and numberOfOrders, to show typical order value, returning vs new dollars, and early LTV windows. We do not run pixels or multi-touch attribution.

### Name

> Shopify’s Admin `shopifyqlQuery` API requires Level 2 access to name, address, phone, and email fields even when the ShopifyQL query returns only aggregate sales metrics (no customer rows). We request Name solely to satisfy that API gate so we can show Analytics-aligned daily Total Sales for Total ROAS (sales ÷ entered spend). We do not store, display, export, or use customer first/last names in the product UI or databases.

### Address

> Same as Name: required by Shopify for `shopifyqlQuery` aggregate sales access. We do not store or display billing/shipping addresses, geolocation, or postal codes.

### Email

> Same as Name: required by Shopify for `shopifyqlQuery` aggregate sales access. We do not store, display, export, or message customers by email. Merchant support uses the store owner’s Partner/support email only.

### Phone

> Same as Name: required by Shopify for `shopifyqlQuery` aggregate sales access. We do not store, display, or call customer phone numbers.

---

## Questionnaire — suggested answers (Marty edits if untrue)

### Level 1 (confirm still true)

| Topic | Answer |
| --- | --- |
| Minimum data | Order money + dates; opaque customer id + numberOfOrders for new/returning $. No CRM. |
| Inform merchants | Privacy policy at mcflyads.com/privacy and Fly /privacy |
| Purpose limit | Analytics / Total ROAS desk only — no ads OAuth, no resale of data |
| Consent / opt-out | We do not run storefront tracking or sell personal data. GDPR webhooks honored |
| Automated decisions | No automated decisions with legal effects on customers |
| Agreements | Privacy policy + Shopify Partner / API terms |
| Retention | Shop data deleted on uninstall and shop/redact. OrderFacts follow commercial windows (trial 90d / paid ≤24mo). ComplianceDataExport TTL 60 days |
| Encrypt transit/rest | HTTPS (Fly) · Postgres on Fly with encrypted volumes/backups per Fly platform |

### Level 2

| Topic | Answer / evidence |
| --- | --- |
| Encrypt backups | Fly managed Postgres backups / volume encryption; app does not keep separate unencrypted PII dumps. We do not persist L2 identity fields. |
| Test ≠ production | SAMPLE / Snowdevil is synthetic demo data. Live merchant OrderFacts never copied into SAMPLE. Dev stores use Partner org only. |
| DLP strategy | See `PCD_L2_ACCESS_DLP.md` — no L2 fields in DB; staff access limited; no production dumps to laptops |
| Limit staff access | Solo founder (Marty) + automated Fly deploy; no customer-support team with PII access |
| Strong passwords | Founder accounts use strong unique passwords + 2FA where available (Shopify Partner, GitHub, Fly, Google) |
| Access log | App logs shop + compliance topic + counts only (no amount/PII dumps). See Access DLP doc. We do not query L2 identity fields. |
| Incident response | See `PCD_L2_INCIDENT_RESPONSE.md` |

If a question asks “do you log access to personal data?” → **Yes** for shop-scoped compliance/ops logs (shop id, topic, counts). **No** L2 identity field access because we never select those fields.

---

## Code locks (L2 Approved + this ship)

- [x] No `name` / `email` / `phone` / `address` in OrderFact GraphQL (tests enforce)  
- [x] Compliance webhooks registered  
- [x] Level-1 data_request package (opaque)  
- [x] `read_reports` in `shopify.app.toml`, `shopify.app.public.toml`, `shopify.app.custom.toml`, and Fly `SCOPES` — `read_orders,read_customers,read_all_orders,read_reports`  
- [x] `SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE = true` — SAMPLE stays false via `deskAnalyticsDayTotalsLive(true)`  

---

## Reviewer Admin view

SAMPLE desk on Fly **455+**: Home · Customers · Spend, SAMPLE watermark, Spend cash chips. Live path parked (`SAMPLE_ONLY`). Privacy live on Fly `/privacy` + mcflyads.com/privacy (L2 gate honesty). Site aesthetic ops held.

---

## Refuse

Inventing that we “need email for support” · storing L2 fields “just in case” · Partner Submit by Cursor · Fly deploy or unpark from this ship · claiming Analytics parity because the flag is on (Accuracy F stays HOLD until a measured compare)
