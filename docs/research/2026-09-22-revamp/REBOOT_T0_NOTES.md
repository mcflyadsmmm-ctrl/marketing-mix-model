# Desk reboot Ship T0 — pending kill

**Branch:** `cursor/reboot-t0-pending`  
**Scope:** Live empty/loading Overview only — not three-tab IA (T1).

## Shipped

- **One pending banner on Home** — `CashTrustBanners` + `homePendingBannerMessage()` with `singlePendingSurface` on `app._index.tsx`. No stack of sales-facts + order-history + today.
- **Merchant copy** — removed engineer phrases (`reports scope`, `sales totals ingest`, `orders crawl`) from banners and YoY pending strings.
- **No $0 lie** — hero shows **—** when pending with $0 sales; chart + YoY beat hidden until ≥1 closed day on file (SAMPLE unchanged).
- **Chart** — `OverviewSalesChart` returns `null` when `salesPending`; Home does not mount chart/YoY when `!showOverviewChartBeat`.

## Marty gate

Screenshot Live Admin empty book: one banner, hero —, no chart, no triple stack.

## Next

Ship T1 — three-tab nav per `DESK_REBOOT_PLAN.md`.
