# Wave 1 — Ops gate card

**Lane:** Ops · **Stamped:** 2026-09-09T04:19:39Z (UTC)  
**Ads at $20/day:** **NO / NOT SAFE** — four-gate lock incomplete.

Do not invent funnel numbers or reviews. Curl proves reachability only.

---

## Curl probes (this run)

```text
$ curl -sS -o /dev/null -w "%{http_code}\n" https://apps.shopify.com/mcfly-analytics-public
200

$ curl -sS https://mcfly-analytics.fly.dev/health
{"ok":true,"service":"mcfly-analytics","db":"up","ts":"2026-09-09T04:19:39.427Z"}
```

---

## Four-gate ads lock (all must be GREEN)

| Gate | Color | Evidence |
| --- | --- | --- |
| **1. Cold smoke PASS** | **RED** | [`SMOKE_APP_STORE_ADS.md`](./SMOKE_APP_STORE_ADS.md) Record template is blank — no Marty PASS stamped. Listing/health curls ≠ smoke PASS. |
| **2. ≥3 honest reviews** | **RED** | Workspace launch facts: **0 reviews**. Do not invent. |
| **3. FUNNEL organic week** | **RED** | [`FUNNEL_WEEKLY.md`](./FUNNEL_WEEKLY.md) week of 2026-09-08 row is blank — awaiting Marty Partner paste. |
| **4. P0 image on Fly** | **RED** | [`README.md`](./README.md): Fly still needs a deploy of P0 (#41+#42). Health `ok:true` proves service up, **not** that the P0 image is live. |

**Verdict:** App Store Ads stay **OFF**. Do not buy. Do not set $20/day.

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
