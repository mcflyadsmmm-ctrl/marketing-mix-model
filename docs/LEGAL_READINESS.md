# Legal / privacy readiness — founder checklist

**Honest bar:** Stronger privacy, retention automation, and disclaimers **reduce** avoidable risk. Nothing here makes Mcfly “unsueable.” Have a lawyer review before you treat policies as final.

**SoT product religion:** PCD Level 1 only — [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)  
**Compliance skill:** [`.cursor/skills/mcfly-shopify-compliance/SKILL.md`](../.cursor/skills/mcfly-shopify-compliance/SKILL.md)

## Already in product (agent-verified)

| Control | Status |
| --- | --- |
| Shopify GDPR webhooks (data_request / redact / shop redact) + HMAC | Live |
| Uninstall cascade delete | Live |
| Level 1 diet (no name/email/phone/address for store customers) | Live |
| ComplianceDataExport **scheduled** 60-day purge (job tick) | Shipped |
| Waitlist KV **180-day TTL** | Shipped |
| Privacy: processors, lawful basis, CCPA stub, transfers, cookies link | Shipped |
| Terms: AS IS, indemnity, liability, termination, severability | Shipped |
| `/cookies` `/security` `/dpa` (draft) | Shipped |
| Compliance spot-check script | `bash scripts/mcfly-compliance-spotcheck.sh` |

## HUMAN — lawyer (do before you claim “fully compliant”)

1. Review & sign-ready **Privacy + Terms** (Utah venue / liability caps / EU consumers).  
2. Turn **`/dpa` draft** into a signed DPA + SCCs for EU/UK merchants.  
3. Confirm CCPA “sale/share” language for Resend / FormSubmit.  
4. Optional: cyber insurance; entity structure (solo operator named on privacy).  
5. Decide whether to **self-host fonts** to shrink Google Fonts third-party requests.

## HUMAN — Shopify Partner

1. Request **PCD Level 1** (leave Level 2 unchecked) — paste from [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
2. Distribution = App Store · emergency contact · install smoke sample OFF · screenshots · Submit  

## Agent commands before claiming hygiene green

```bash
bash scripts/mcfly-compliance-spotcheck.sh
bash scripts/agent-ship-gate.sh
```
