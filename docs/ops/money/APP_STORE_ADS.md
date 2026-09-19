# Shopify App Store search ads — after four gates

**Lane:** Ops. Brief only. **Do not start campaigns. Do not set a budget. Do not buy ads.**

Significant ad spend is **illegal for this workspace until all four gates below are green.** Ads inherit the listing. Tiny paid search on a **0-review** listing without a funnel baseline just burns cash.

**Creative = the listing.** Shopify does **not** let you customize App Store ad copy. If the listing is weak, ads will not save it — fix listing/onboarding first (see funnel diagnosis in [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md)).

---

## Four gates (checklist)

Status as of Ops smoke **2026-09-18** ([`../journal/STATUS_20260918_ops_smoke.md`](../journal/STATUS_20260918_ops_smoke.md)). Ops did not `fly deploy`, did not open Admin, and did not paste Partner numbers.

| # | Gate | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Marty **Admin smoke PASS** (SAMPLE + one live spend day) | **AMBER** | Ops curl smoke **PASS** 2026-09-18 (site v19, `/health` 200, listing 200). SAMPLE greeting **PASS** 2026-09-15. **Live spend day skipped. Trial CTA skipped.** Gate stays amber until those two lines PASS. |
| 2 | **≥3 honest** App Store reviews | **RED** | Listing HTML 2026-09-18: **0.0/5**, **(0 Reviews)**, **No reviews yet**. Keep **0**. Do not invent. |
| 3 | One **organic week** of Partner listing visits / installs / trials pasted in [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md) | **RED** | 2026-09-08 / 2026-09-15 / 2026-09-22 rows **empty**. Marty has not pasted. Do not fill zeros. |
| 4 | **P0 desk on Fly** | **GREEN** | Live `/health` 200 (`ok` + `db:up`). Living Board: Fly **331** @ `6c8a86b`. Ops did not deploy this row. |

**Start campaigns?** **NO.** Gate 1 amber, gates 2–3 red.

---

## What to buy (later, founder — only when all four are green)

**Shopify App Store search ads only** — inside Partner / App Store ads.

| Do | Do not |
| --- | --- |
| Search ads against the **live listing** | Homepage ads, category ads (those come **later**) |
| Land on https://apps.shopify.com/mcfly-analytics-public | Land on https://mcflyads.com as the ad destination |
| Tiny **daily cap** (founder sets the number — Ops must not) | “Test” spend with no cap |
| Kill any keyword with **clicks and zero installs** | Let vanity clicks run |

---

## Bid these (when all four gates are green)

Intent that matches the desk:

- ad spend
- billboard
- marketing spend
- ROAS

## Do not bid

Words that sell a different product and attract 1-stars:

- Triple Whale
- pixel
- true profit
- (same family: true ROAS, auto-sync Meta, MTA, attribution suite)

Those merchants want connectors Mcfly does not ship. Clicks with zero honest installs are the kill rule.

---

## Later, not this phase

1. **Homepage / category App Store ads** — after search ads have a week of install data.
2. **External Meta / Google ads** — after App Store search is understood. Different landing rules; still land paid traffic on the listing, not a pending or mismatched homepage.

---

## Confirmation (2026-09-18)

**Ops did not start campaigns. Ops did not set an ads budget. Do not buy ads yet.**

Founder leftover when (and only when) all four gates are green: open App Store search ads, cap tiny, bid the four phrases above, land on the listing URL, watch install-per-click, kill zeros.
