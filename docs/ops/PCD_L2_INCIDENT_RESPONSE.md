# Security incident response policy — Mcfly Analytics (PCD L2)

**Owner:** Marty Smithson (founder) · **Firm:** Mcfly Ads · **App:** Mcfly Analytics  
**Effective:** 2026-09-23 · **Applies to:** production Fly app `mcfly-analytics`, Postgres, Partner Dashboard, GitHub

This is the written policy for Shopify protected customer data Level 2 questionnaires. It is operational for a solo-founder app.

## 1. Scope

Incidents include: unauthorized access to merchant or customer data, leaked credentials, ransomware, accidental production data in logs/exports, or a confirmed GDPR/compliance webhook failure that leaves data undeleted after a valid redact request.

## 2. Severity

| Level | Examples | Response target |
| --- | --- | --- |
| Sev-1 | Confirmed exfiltration of merchant/customer data; open admin credentials | Contain within **4 hours**; notify affected merchants ASAP and Shopify if required |
| Sev-2 | Suspected breach; secrets exposed in a private repo; failed redact for one shop | Investigate within **24 hours** |
| Sev-3 | Misconfiguration with no evidence of access; SAMPLE/demo only | Fix in next ship; document |

## 3. Roles

| Role | Person |
| --- | --- |
| Incident lead | Marty Smithson |
| Engineering / Fly | Marty (or Conductor under Marty direction) |
| Merchant contact | support / `mcflyadsmmm@gmail.com` |

No other staff have production database access.

## 4. Escalation path

1. Detect (Fly alerts, GitHub secret scan, merchant report, Partner notice)  
2. Lead confirms severity  
3. **Contain:** rotate secrets (Shopify API, Fly, DB), revoke sessions, block deploy if needed  
4. **Eradicate:** patch, rotate, revoke tokens  
5. **Recover:** verify `/health`, compliance webhooks, SAMPLE_ONLY posture  
6. **Notify:** affected merchants by email; Shopify Partner Support if customer data was involved  
7. **Postmortem:** written notes within 7 days; update this policy if gaps found  

## 5. Evidence

Preserve Fly logs, deploy versions, and compliance webhook logs (shop + topic + counts). Do not download production OrderFacts to personal devices for “debugging” — use Fly/remote tools.

## 6. Customer / merchant rights

Honor `customers/data_request`, `customers/redact`, and `shop/redact`. Level-1 opaque export packages auto-purge after 60 days.

## 7. Review

Re-read this policy when requesting or renewing PCD Level 2, or after any Sev-1/2 incident.
