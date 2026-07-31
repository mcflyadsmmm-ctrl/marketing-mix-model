# Design-partner smoke — Total ROAS desk evidence

**Purpose:** Prove cold merchants can trust Total ROAS on real spend (CSV) and would pay ~$39–$79 flat — not Sheets-only.  
**Religion:** cash Total ROAS (Shopify sales ÷ spend); sample desk **OFF** for live judgment.  
**Retired:** Monday Close lock UI and Meta/Google spend OAuth — [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md).  
**Agent cannot:** store access, Partner MFA.

Reply in Cursor after each store: **`partner desk N done`** (N = 1…5).

---

## Per-store checklist (copy per shop)

| Step | Action | Pass? |
| --- | --- | --- |
| 0 | Install Mcfly Analytics on partner store | |
| 1 | Demo → **Turn sample desk OFF** | |
| 2 | Settings → save contribution margin % (break-even updates) | |
| 3 | Spend → CSV or manual for the period (coverage ≥70%; recon ok if declared) | |
| 4 | Overview → trusted Total ROAS visible; break-even known | |
| 5 | Optional: Share Overview (Email) opens mailto with period cards | |
| 6 | Allocation → recommendation when spend > 0 | |
| 7 | Note wall-clock minutes (target &lt;10 once spend is in) | |
| 8 | Ask: “Would you pay ~$39–$79/mo flat for this desk?” Y / N / maybe | |

### Evidence to capture (share with agent)

- Shop domain (ok to redact in public docs)
- Period + Total ROAS vs break-even
- Minutes to first trusted number
- WTP answer
- Blockers (CSV pain, coverage holes, confusion)

---

## Fleet gate (kill / keep)

| Signal | Keep building | Kill / rethink |
| --- | --- | --- |
| ≥3/5 complete ritual without Slack hand-holding | Yes | — |
| ≥2/5 say yes to flat fee after four weeks | Billing announce path | Soften price or deepen desk craft |
| Paste churn kills return visits | Pipe templates + export guides | — |
| “Sheets is enough” after four weeks | Strengthen Overview craft + Share | Sheets companion sooner |

---

## Related

- [`INSTALL_SMOKE.md`](./INSTALL_SMOKE.md) — agent install path  
- [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) — App Store human gates  
- [`BILLING_TIERS.md`](./BILLING_TIERS.md) — Free → Pro ~$39  
- [`VALUE_THESIS.md`](./VALUE_THESIS.md) — cash desk WTP  
- [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md) — Close / ads OAuth out  
