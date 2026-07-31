# Load-test matrix — enterprise desk SLOs

**SoT:** [`ENTERPRISE_SCALE_RUNBOOK.md`](./ENTERPRISE_SCALE_RUNBOOK.md) · [`docs/superpowers/specs/2026-07-26-enterprise-redesign-design.md`](../superpowers/specs/2026-07-26-enterprise-redesign-design.md) §5–§6 · [`docs/ENTERPRISE_REDESIGN.md`](../ENTERPRISE_REDESIGN.md)  
**Path:** facts-first desk (`SalesDayFact` + period SQL); no live GraphQL crawl on nav.

---

## SLO targets

| SLO | Metric | Target | Window | Notes |
| --- | --- | --- | --- | --- |
| **Desk (facts)** | Cash MER loader p95 | **&lt;2–3s** | Per request | `/app` (index), period change, Goals/Allocation when facts cover range |
| **Desk (facts)** | Cash MER loader p99 | **&lt;5s** | Per request | Alert only; not a ship gate |
| **Ingest lag** | Webhook → `SalesDayFact` dirty-day closed p95 | **&lt;15m** | Rolling 24h | Order create/update/cancel → queue → reconcile |
| **Ingest lag** | CSV spend upsert p95 | **&lt;10s** | Per upload | Wide + long combine; batched upsert |
| **Overnight** | Shops with successful snapshot | **≥99%** | Daily fan-out | DLQ &lt;1% of enqueued shops |
| **API** | `/v1/*` without shop hint | **401/403** | 100% | No first-shop fallback |

---

## LT1–LT8 scenarios

| ID | Profile | Data setup | Load pattern | Primary assertion |
| --- | --- | --- | --- | --- |
| **LT1** | Small shop (baseline) | Fresh install; 0–7 `SalesDayFact` rows; margin unconfirmed | 1 user, cold `/app` | p95 desk **&lt;2s**; empty states; no GraphQL page-loops |
| **LT2** | Small shop (steady) | 60 closed days facts + 60d spend (8 channels); margin confirmed | 1 user; period toggle 7d ↔ 30d ↔ 60d | p95 desk **&lt;2–3s**; MER matches `@mcfly/mer-core` |
| **LT3** | Medium shop | ~10k orders / 60d via facts seed (~60 rows); spend wide template | 1 user; Spend Explorer expand | p95 desk **&lt;3s**; explorer SQL bounded |
| **LT4** | High-volume shop | ~100k orders / 60d via facts seed; multi-channel spend | 1 user; L12M label shows facts-only honesty | p95 desk **&lt;3s**; **0** live order pagination on nav |
| **LT5** | 1M orders (simulated) | **Facts table seed only** — ~365–1,095 daily rows totaling 1M `orderCount`; no Shopify crawl | 1 user; 60d + 90d period loads | p95 desk **&lt;3s**; query plans use `(shopId, day)` index |
| **LT6** | Large CSV ingest | Wide 3yr (~1,095 rows × 8 cols) or long combine (≥8k rows); bill→daily path | 1 upload burst + immediate `/app` reload | CSV p95 **&lt;10s**; desk p95 **&lt;3s** post-ingest |
| **LT7** | Concurrent shops (modest) | 25 shops × LT2 profile; isolated tenants | 25 parallel sessions; each hits `/app` + period change | Per-shop p95 **&lt;3s**; no cross-tenant bleed |
| **LT8** | Concurrent shops (scale) | 500 shops × LT2 profile; shared Postgres | 50 rps mixed `/app` + 10 concurrent CSV (LT6 subset) + overnight fan-out | Desk p95 **&lt;3s** at P50 shops; overnight **≥99%**; ingest p95 **&lt;15m** under queue load |

---

## Pass gates (W6–8 ship)

| Gate | LT coverage | Pass when |
| --- | --- | --- |
| Facts hot path | LT1–LT5, LT7–LT8 | Desk p95 **&lt;2–3s**; GraphQL loops **≤1** (prefer **0**) on facts-complete windows |
| Ingest honesty | LT2, LT6, LT8 | Ingest lag p95 **&lt;15m**; webhook ACK **&lt;5s** |
| Multi-tenant | LT7–LT8 | Shop hint enforced; no first-shop fallback |
| CSV spine | LT6 | Upload completes; MER spend aggregate matches seed ±0 |
| Overnight ops | LT8 | ≥99% shops snapshotted; DLQ triaged |

---

## Measurement (no code in this doc)

| Signal | Source |
| --- | --- |
| Desk latency | App loader timing (`shopId`, route, period, `factsComplete`) |
| Ingest lag | `WebhookDelivery` → `SalesDayFact.asOf` delta |
| CSV duration | Upload action → upsert commit |
| Overnight | `SyncRun` / snapshot row counts vs installed shops |
| DB | `EXPLAIN` on period aggregate + `(shopId, day)` lookups |

**Scale ladder (infra):** 0–50 → current Fly+Neon · 50–500 → paid DB + 2nd machine · 500–5k → worker isolate — see [`docs/SHIP_BUILD_PLAN.md`](../SHIP_BUILD_PLAN.md) §2.4.
