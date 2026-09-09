# Wave 1 — Ops gate card

**Lane:** Ops · **Stamped:** 2026-09-09T04:54:00Z (UTC) · Conductor **Wave 5**  
**Wave 4 note:** Fly **v193** · `deployment-01M2282WCKY8YVYFFF8D10WHC3` (spend-first) is live — see [`SMOKE_APP_STORE_ADS.md`](./SMOKE_APP_STORE_ADS.md) Record pre-fill.  
**Wave 5 ops:** Root + `app/` `.dockerignore` exclude Finder duplicates (`**/* 2.*`) so Fly build cannot pick up `faq 2.tsx` / `terms 2.tsx`-style routes (Wave 4 deploy break).  
**Ads at $20/day:** **NO / NOT SAFE** — four-gate lock incomplete. All ads gates stay **RED** until Marty Admin smoke.

Do not invent funnel numbers or reviews. Curl proves reachability only. Curl is not Admin smoke PASS.

---

## Curl probes (this run)

```text
$ curl -sS -o /dev/null -w "%{http_code}\n" https://apps.shopify.com/mcfly-analytics-public
200

$ curl -sS https://mcfly-analytics.fly.dev/health
{"ok":true,"service":"mcfly-analytics","db":"up","ts":"2026-09-09T04:19:39.427Z"}
```

*(Wave 5 did not re-curl; reachability rows below unchanged from prior stamp. Not a smoke PASS.)*

---

## Four-gate ads lock (all must be GREEN)

| Gate | Color | Evidence |
| --- | --- | --- |
| **1. Cold smoke PASS** | **RED** | [`SMOKE_APP_STORE_ADS.md`](./SMOKE_APP_STORE_ADS.md) Record **Result** still blank — no Marty Admin PASS stamped. Listing/health curls ≠ smoke PASS. |
| **2. ≥3 honest reviews** | **RED** | Workspace launch facts: **0 reviews**. Do not invent. |
| **3. FUNNEL organic week** | **RED** | [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md) week of 2026-09-08 row is blank — awaiting Marty Partner paste. |
| **4. P0 image on Fly** | **RED** | Wave 4 deployed Fly **v193** (spend-first), but this gate stays **RED** until Admin smoke **Record PASS** (not curl / not version string alone). |

**Verdict:** App Store Ads stay **OFF**. Do not buy. Do not set $20/day. **NOT SAFE.**

---

## Reachability (not ads gates)

| Check | Color | Evidence |
| --- | --- | --- |
| Listing HTTP | **GREEN** | `https://apps.shopify.com/mcfly-analytics-public` → **200** |
| Fly `/health` | **GREEN** | `ok:true`, `db:up` |

---

## Related

- Doctrine: [`APP_STORE_ADS.md`](./APP_STORE_ADS.md) · Go-live: [`APP_STORE_ADS_GO_LIVE.md`](./APP_STORE_ADS_GO_LIVE.md)
- Conductor: [`../CONDUCTOR_LANES.md`](../CONDUCTOR_LANES.md) · Support MX: [`../SUPPORT_MX.md`](../SUPPORT_MX.md) (DNS = human gate)
