# Protected Customer Data (PCD) + LTV — Mcfly plain English

**SoT for first Free submit:** request **Level 1 only**.  
**Official Shopify:** [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data)

---

## Level 1 vs Level 2 (one table)

| | **Level 1** | **Level 2** |
| --- | --- | --- |
| **What it is** | Customer/order data **without** name, address, phone, email | Same **plus** those PII fields |
| **Partner checkbox** | “Protected customer data” | Plus individual fields: name / address / email / phone |
| **Extra requirements** | Minimize data, privacy policy, retention, encrypt, DPA-ish honesty | + backups encrypted, env separation, access logs, staff limits, incident policy, possible **data protection review** |
| **Review friction** | Normal for public apps using orders | Higher — Shopify scrutinizes “why do you need identity?” |
| **Mcfly first submit** | **Yes — request this** | **No — leave unchecked** |
| **Needed for till LTV?** | **Yes (enough)** | **No** |

**Important:** Even order totals (no customer name) sit under protected customer data. That is why Free Mcfly still needs a **Level 1** request — not “opt out of PCD.”

---

## What Mcfly uses today (matches Level 1)

| Scope / field | Why | Level |
| --- | --- | --- |
| `read_orders` → order totals, counts, `createdAt` | Cash MER, AOV | 1 |
| `read_customers` → opaque `customer.id` + `numberOfOrders` | New vs returning | 1 |
| `OrderFact` / `CohortFact` (Postgres) | Till LTV cohorts — opaque customerKey + amounts/dates only | 1 |
| `read_all_orders` | Deep order history beyond ~60 days for till LTV backfill | Same PCD level; **separate** Partner approval |
| Name / email / phone / address | **Never queried or stored** | Would be 2 — refuse for v1 |

Partner paste answers: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) §PCD.

### OrderFact live + `read_all_orders` (Partner justification paste)

```text
Why read_all_orders?
Mcfly computes cash MER and till LTV from Shopify order totals and opaque customer ids
(order amount + createdAt + customer.id only — never name, email, phone, or address).
Without read_all_orders, Admin API order history is limited to ~60 days, so cohort LTV
(30/90/365) and long period desks underclaim. We store OrderFact / CohortFact rows for
chunked backfill (no CRM). We do not use orders for marketing outreach or identity graphs.
```

**Live ingest:** `runOrderFactsBackfill` writes `OrderFact` (`source = shopify_order_v1`), then `recomputeCohortFacts`. Sample desk seeds CohortFacts separately for the Demo toggle — never mixed into live backfill.

---

## LTV you want vs what Level 2 buys

### Till LTV (Mcfly religion) — **Level 1 is enough**

Real LTV for a cash desk:

- Opaque customer id (hash ok)
- Order dates + amounts from Shopify till
- Cohorts: first order month → revenue at 30/90/365 days
- Compare to cash ad spend in the same windows

That is **not** Lifetimely email CRM. It does **not** need name/email/phone/address.

**Also needed later (not PCD level):**

| Gate | Why |
| --- | --- |
| Chunked backfill + `OrderFact` / `CohortFact` storage | Persist history safely (no CRM table of emails) |
| Background jobs / queue | Avoid timeouts on deep history |
| Partner-approved **`read_all_orders`** | Orders older than ~60 days (separate from PCD L1/L2) |

### Suite / CRM LTV — **Level 2**

Email, name, address for profiles, outreach, “customer 360,” identity graphs. That is Lifetimely-class, harder PCD, listing honesty change, and **not** required for Mcfly’s till LTV. Religion prefers till LTV.

---

## Can you get Level 2 **after** launch?

**Yes.** After the app is live / not mid-first-review:

1. Partner → API access → Protected customer data  
2. Request additional fields (name/email/…) **only if** the product truly needs them  
3. Update privacy + listing to match  
4. Shopify typically reviews the expanded access (another review cycle)

**Do not** request Level 2 “just in case” on first submit — it slows approval and invites a data-protection review you don’t need for cash MER or till LTV.

**Also:** You **cannot** apply for PCD while the app is **already under review**. Finish Level 1 **before** first Submit.

---

## Recommended path (LTV without slowing launch)

| When | PCD / scopes | Product |
| --- | --- | --- |
| **Now (Free submit)** | Level 1 only; no PII fields; declare `read_all_orders` in TOML when ready for Partner approve | Cash MER, new/returning, till LTV backfill (historyLimited until approved) |
| **Post-approve + design partners** | Still Level 1 | Till LTV panel from `CohortFact` (opaque cohorts) |
| **When Partner approves `read_all_orders`** | Level 1 + deep history | Multi-year OrderFact backfill; clear historyLimited |
| **Only if product pulls for CRM/email LTV** | Then consider Level 2 + privacy rewrite | Optional Scale tier — not the wedge |

---

## Partner UI cheat sheet (first submit)

1. Distribution = **Shopify App Store** (required before PCD request)  
2. API access → Protected customer data → **Request access**  
3. Check **Protected customer data** (Level 1)  
4. Leave **name / address / email / phone unchecked**  
5. Paste reasons from listing §PCD  
6. Complete data-protection details honestly (minimize, privacy URL, retention on uninstall/redact)  
7. Then continue listing → Submit  

Reply in chat: **`pcd done`** when Level 1 is submitted without Level 2 fields.

---

## Sources

- [Work with protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data)  
- [Privacy law compliance / mandatory webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)  
- Submit runbook: [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)
