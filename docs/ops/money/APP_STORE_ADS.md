# Shopify App Store search ads — after four gates

**Lane:** Ops. Brief only. **Do not start campaigns. Do not set a budget. Do not buy ads.**

Significant ad spend is **illegal for this workspace until all four gates below are green.** Ads inherit the listing. Tiny paid search on a **0-review** listing without a funnel baseline just burns cash.

**Creative = the listing.** Shopify does **not** let you customize App Store ad copy. If the listing is weak, ads will not save it — fix listing/onboarding first (see funnel diagnosis in [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md)).

---

## Four gates (checklist)

Status **2026-09-23** (PCD L2 Approved · Phase G in git · site v45 curl PASS). Full founder order: [`../AD_READY_GO.md`](../AD_READY_GO.md). Ops/Cursor still do **not** `fly deploy`, open Admin, paste Partner numbers, or buy ads.

| # | Gate | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Marty **Admin smoke PASS** (SAMPLE + one live spend day) | **AMBER → Marty** | Site + Fly `/health` + `/demo` curl PASS 2026-09-23. **Live spend day + trial CTA still Marty.** |
| 2 | **≥3 honest** App Store reviews | **RED** | Listing still **0** reviews (do not invent). Founder may accept cash-burn risk; Cursor still will not start campaigns. |
| 3 | One **organic week** of Partner listing visits / installs / trials pasted in [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md) | **RED** | Rows empty until Marty pastes. Do not fill zeros. |
| 4 | **P0 desk on Fly** | **GREEN*** | `/health` 200. *Redeploy tip with `read_reports` still Marty (AD_READY_GO step 3). |

**Start campaigns?** **NO** until Marty clears 1 (+ prefers 2–3). Product finalize is no longer the blocker — founder taps are.

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
