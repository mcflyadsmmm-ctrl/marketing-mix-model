# Design-partner smoke — Monday Close evidence

**Purpose:** Prove four completed Monday Closes → paid WTP (~$79), not Sheets-only.  
**Religion:** cash close (net sales ÷ spend); sample desk **OFF** for live judgment.  
**Agent cannot:** store access, Partner MFA, Meta/Google App Review credentials.

Reply in Cursor after each store: **`partner close N done`** (N = 1…5).

---

## Per-store checklist (copy per shop)

| Step | Action | Pass? |
| --- | --- | --- |
| 0 | Install Mcfly Analytics on partner store | |
| 1 | Demo → **Turn sample desk OFF** | |
| 2 | Settings → save contribution margin % | |
| 3 | Spend → CSV or manual for MTD (coverage ≥70%; recon ok if declared) | |
| 4 | Desk → trusted Total ROAS (net) visible; BE known | |
| 5 | **Monday Close** `/app/close` → exceptions → **Lock** → variance → decision → CSV download | |
| 6 | Note wall-clock minutes (target &lt;10 once spend is in) | |
| 7 | Ask: “Would you pay ~$79/mo flat for this ritual?” Y / N / maybe | |

### Evidence to capture (share with agent)

- Shop domain (ok to redact in public docs)
- Period locked + decision (`hold` / `reduce` / `step_test`)
- Minutes to close
- WTP answer
- Blockers (paste pain, coverage holes, confusion)

---

## Fleet gate (kill / keep)

| Signal | Keep building | Kill / rethink |
| --- | --- | --- |
| ≥3/5 complete a lock without Slack hand-holding | Yes | — |
| ≥2/5 say yes to ~$79 after four Mondays | Billing announce path | Soften price or deepen ritual |
| Paste churn kills return visits | Prioritize live Meta/Google OAuth | — |
| “Sheets is enough” after four closes | Strengthen Close craft + OAuth | Sheets companion sooner |

---

## Agent instrumentation (shipped / next)

| Item | Status |
| --- | --- |
| `CashClose` row per lock (period, decision, cut %, lockedAt) | Shipped |
| CSV export of locked close | Shipped |
| Settings: partner can download compliance exports | Shipped |
| Optional: time-to-lock analytics dashboard | Later (not needed for 5-store smoke) |

---

## Related

- [`INSTALL_SMOKE.md`](./INSTALL_SMOKE.md) — agent install path  
- [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) — App Store human gates  
- [`BILLING_TIERS.md`](./BILLING_TIERS.md) — Free → Pro ~$79  
- [`VALUE_THESIS.md`](./VALUE_THESIS.md) — cash-close WTP  
