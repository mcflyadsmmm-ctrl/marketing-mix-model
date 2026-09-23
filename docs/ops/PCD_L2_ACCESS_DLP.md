# Access control, logging, and DLP — Mcfly Analytics (PCD L2)

**Owner:** Marty Smithson · **Effective:** 2026-09-23

## Data we keep (production)

| Data | Purpose | PII fields |
| --- | --- | --- |
| OrderFact (amounts, dates, opaque customerKey) | Desk metrics, Total ROAS denom | No name/email/phone/address |
| CohortFact / LTV aggregates | Returning $ / early LTV | Opaque keys only |
| Spend ledger (merchant-entered) | Total ROAS | Merchant business data, not Shopify customer PII |
| Shop settings / sessions | Auth + preferences | Shop domain; Shopify session tokens |
| ComplianceDataExport | GDPR data_request | Opaque order package; TTL **60 days** |

**L2 identity fields (name, address, email, phone):** not selected in GraphQL; not stored. Requested in Partner Dashboard only to unlock `shopifyqlQuery` aggregates after approval.

## Staff access (limit)

| System | Who | Notes |
| --- | --- | --- |
| Fly production | Marty only | `flyctl` on founder Mac; no shared team |
| Postgres | via Fly | No public DB port; no prod dumps to laptops |
| GitHub | Marty (+ Cursor under direction) | No production secrets in git |
| Shopify Partner | Marty | App ownership |

Contractors/AI do not receive production DB credentials.

## Strong passwords / 2FA

Founder accounts (Shopify Partner, GitHub, Fly, Google Workspace/email) use unique strong passwords and 2FA where offered.

## Access logging

- Compliance webhook handler logs **shop + topic + counts** (not order amounts, not customer names).  
- Application logs on Fly are retained per Fly defaults and used for incident review.  
- Settings Level-1 export actions are merchant-initiated and scoped to their shop.  
- We do **not** operate a support tool that browses customer email/phone.

## Data loss prevention (DLP)

1. **Minimize** — never select L2 identity fields in app code (enforced by tests).  
2. **No prod → laptop dumps** of OrderFacts for casual debug.  
3. **SAMPLE isolated** — Snowdevil/Harbor SAMPLE is synthetic; not a copy of Live merchant books.  
4. **Secrets** — Fly secrets / env only; never commit `.env`.  
5. **Exports** — ComplianceDataExport auto-purge 60d; erased on redact/uninstall.  
6. **Retention** — trial/paid commercial windows; uninstall and shop/redact wipe shop data.

## Test vs production

- Development stores and SAMPLE desk never receive another merchant’s Live OrderFacts.  
- CI uses fixtures/tests, not production databases.

## Backups

Production data lives on Fly Postgres. Backups/snapshots are platform-managed and encrypted at rest with the volume. We do not maintain a second unencrypted PII archive. Because we do not store L2 identity fields, backup risk for those fields is null by design.
