# Religion challenge — optional spend connectors

**Date:** 2026-09-09  
**Decision owner:** Founder  
**Scope:** Research only. No app code, pixel, MTA, path credit, or platform-attributed revenue.  
**Verdict:** **DEFER** (Mcfly first-party OAuth). Founder addendum 2026-09-09: prefer **SyncWith/Sheet partner pipes + manual/concierge day import** — see [`SPEND_INGEST_LADDER.md`](./SPEND_INGEST_LADDER.md).

## Executive decision

Do **not** revive Meta, Google, or TikTok spend OAuth now.

There is a real problem: entering spend is Mcfly's only recurring merchant chore, and the internal friction audit scores that tax **20/25**. But there is no merchant-interview or funnel evidence yet showing that a first-party connector would add enough paid $39 shops to repay its build, approval, security, and truth-maintenance burden. The current evidence supports fixing CSV craft and discoverability first, then measuring demand.

This is a **DEFER**, not a permanent refusal. Reopen only when the evidence gates in §8 pass. If they pass, ship one requested platform as a reversible, read-only import. CSV/manual spend remains the source of truth. Pixels, conversion events, platform revenue, MTA, and path credit remain refused.

---

## 1. Question and boundary

Should Mcfly let a merchant authorize an ad platform so Mcfly can pull **spend only**, avoiding repeated CSV work?

An allowed connector may import:

- daily spend/cost;
- ad account identity needed to select the source;
- account currency and timezone needed to normalize the spend ledger;
- sync status and freshness.

It must not import or display platform-attributed sales, conversions, view-through results, paths, audiences, customer identifiers, or pixel events. Mcfly's action metric remains:

> **Total ROAS = Shopify Total Sales ÷ merchant-entered/confirmed spend for the same period.**

The connector changes transport, not measurement religion.

---

## 2. Evidence already available

### Evidence for reducing the CSV tax

- [`FRICTION_AUTOPSY.md`](./FRICTION_AUTOPSY.md) identifies spend entry as the only recurring merchant chore and scores it **20/25** for uninstall risk × frequency. It also identifies an auto-sync expectation risk at **16/25**.
- [`COMMUNITY_SIGNALS_2026-09.md`](./COMMUNITY_SIGNALS_2026-09.md) records public language around a Monday sheet pulling Shopify plus Meta, Google, and TikTok. It explicitly labels those signals as hypotheses, not Mcfly interviews.
- [`COMPETITORS.md`](../COMPETITORS.md) shows that automated pipes are table stakes in connector and suite products, while also warning that operating a connector zoo is expensive surface area rather than proprietary science.

### Evidence against building now

- [`LOVE_SCORECARD.md`](./LOVE_SCORECARD.md) scores Meta/Google OAuth **10/25**, marks it **Refuse** under the current religion, and requires at least five operator interviews before expanding beyond P0 honesty/friction work.
- Mcfly has **0 reviews** and no documented connector-specific interview evidence, install cohort, trial conversion baseline, or churn reason count. Therefore no observed incremental-paid-shop claim is available.
- [`VALUE_THESIS.md`](../VALUE_THESIS.md), [`RETIRED_SURFACES.md`](../RETIRED_SURFACES.md), and [`PIPE_AUTOMATION_WEDGE.md`](../PIPE_AUTOMATION_WEDGE.md) intentionally assign OAuth breakage to customer-paid pipe vendors.
- [`ULTRA_LEAD_ENGINEER.md`](../ops/ULTRA_LEAD_ENGINEER.md) requires a paid EV model, churn risk, build cost, reversible wedge, and kill criteria before the founder may accept a religion change. A written model is necessary, but hypothetical upside is not sufficient evidence.

**Evidence grade:** the pain is credible but indirect. The paid conversion effect is unmeasured.

---

## 3. Paid EV model — 90-day incremental paid shops

Everything in this section is a **HYPOTHESIS**, not a live Mcfly metric.

Define:

```text
Incremental paid shops over 90 days
  = eligible trial starts
  × share materially blocked by recurring CSV
  × connector completion rate
  × paid-conversion rescue rate
```

“Rescue rate” means the incremental probability of becoming a paid shop because the connector exists, not the total trial-to-paid conversion rate.

| Scenario | Eligible trials / 90d | CSV-blocked share | Complete OAuth | Conversion rescue | Incremental paid shops | Exit MRR at $39 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Conservative **HYPOTHESIS** | 25 | 20% | 45% | 10% | **0.2** | **$9** |
| Base **HYPOTHESIS** | 75 | 30% | 55% | 20% | **2.5** | **$97** |
| Upside **HYPOTHESIS** | 150 | 40% | 65% | 30% | **11.7** | **$456** |

If incremental paid shops arrive evenly through the window and each contributes about 1.5 paid months within the first 90 days after a 7-day trial—also a **HYPOTHESIS**—incremental 90-day subscription revenue is approximately:

- conservative: **$13**;
- base: **$145**;
- upside: **$684**.

These figures are sensitivity arithmetic, not forecasts. The model exposes the decision: at a flat $39, OAuth only wins quickly if Mcfly has both meaningful trial volume and a large, proven CSV-blocked segment. Neither input is currently observed.

### Required measurement before acceptance

Record, without inventing values:

1. eligible trial starts over a complete organic period;
2. first-spend completion rate and median time to first trusted Total ROAS;
3. trial-to-paid conversion by “used CSV/paste” versus “never entered spend”;
4. uninstall reasons mentioning manual entry, CSV, sync, Meta, Google, or TikTok;
5. interview willingness to authorize the requested platform—not merely preference for “automation.”

---

## 4. Churn, uninstall, and TTFV

### CSV tax

- **Activation:** a merchant must understand the template or paste shape before seeing value.
- **Recurring use:** spend entry repeats weekly or daily, so the tax can erode habit after activation.
- **Expectation:** merchants accustomed to suites can interpret manual spend as a missing feature.
- **Truth advantage:** the merchant can hand-check exactly what entered the denominator, include offline spend and fees, and repair a day without depending on an API.

### OAuth tax

- **Before value:** account authorization, consent, account selection, and permission uncertainty add steps to the under-10-minute TTFV target.
- **Partial setup:** agencies and multi-account merchants must choose the correct customer/ad account, currency, and timezone.
- **Breakage:** expired or revoked tokens, provider review changes, rate limits, disabled ad accounts, manager-account hierarchy, and API errors create “connected but stale” states.
- **Trust:** a connection badge can falsely imply completeness. “Connected” is not the same as “all spend for this period is present.”

### Honesty risk if sync lies

A stale or partial denominator inflates Total ROAS. That is more damaging than a clearly incomplete CSV because automation borrows trust from the word “connected.”

Any future connector must therefore fail closed:

- never label a period trusted solely because OAuth succeeded;
- show last successful sync, covered through date, account, currency, and timezone;
- surface missing/failed days and never coerce them to zero;
- detect material differences against a merchant-uploaded CSV;
- withhold action verdicts and exports when spend coverage is incomplete;
- never silently rewrite merchant-confirmed ledger rows.

**Net TTFV judgment:** OAuth can reduce recurring TTFV after setup, but may worsen first-session TTFV. No evidence currently quantifies which effect dominates for Mcfly's ICP.

---

## 5. Build and compliance cost

The ranges below are **planning hypotheses**, not completed estimates.

### Product and engineering

| Work | One platform, read-only spend | Meta + Google |
| --- | ---: | ---: |
| OAuth, callbacks, account picker, revoke | 4–8 engineer-days | 8–16 |
| Spend query, paging, currency/timezone normalization | 4–8 | 8–16 |
| Staging, preview, confirm, overlap/recon, idempotency | 4–7 | 5–9 shared |
| Jobs, retries, freshness, failure UX, support diagnostics | 4–8 | 7–14 |
| Security, privacy, deletion, tests, reviewer evidence | 4–8 | 7–14 |
| **Total HYPOTHESIS** | **20–39 engineer-days** | **35–69 engineer-days** |

This excludes calendar time waiting for provider approvals and ongoing maintenance. A planning allowance of **1–3 engineer-days/platform/month** for API drift, token failures, support, and review renewals is also a **HYPOTHESIS**.

### Meta

- Read-only reporting uses `ads_read`; Meta's permission reference allows it for dashboards and analytics.
- Accessing ad accounts belonging to other businesses requires Advanced Access through App Review. Meta's authorization documentation also requires business verification for sensitive business access.
- Meta's Tech Provider documentation says Access Verification is independent of App Review and includes `ads_read`.
- Review requires a working login flow, permission justification, and a screencast demonstrating the data in-product.
- Meta requires an accessible privacy policy describing collected data, purposes, and deletion instructions. Platform-data deletion requests must be honored.

This is not “just one API call”; it creates a second approval and policy surface beside Shopify.

### Google Ads

- Google requires both OAuth credentials and a Google Ads developer token.
- The only Google Ads API OAuth scope is `https://www.googleapis.com/auth/adwords`; Google classifies it as restricted.
- Multi-user reporting normally requires offline access, which means storing refresh tokens.
- Google's production guidance calls for OAuth verification; storing or transmitting restricted-scope data on a server can require a third-party security assessment.
- Developer-token access level separately controls production use and quota.
- Google's credential guidance requires secure handling of client secrets, developer tokens, and user refresh tokens, and graceful handling of revoked/expired credentials.

The broad `adwords` scope creates consent friction even if Mcfly's own code promises to call reporting endpoints only.

### TikTok

TikTok's official materials confirm developer registration, app authorization, access tokens, and reporting APIs. The public evidence gathered for this brief is insufficient to price its production approval and ongoing policy burden confidently. **Do not include TikTok in a first wedge.** Research it only after observed customers name it and the selected Meta/Google pilot succeeds.

### Shopify App Store

- Shopify requires apps to remain secure, truthful, and privacy-safe.
- Shopify's best-practices documentation says third-party integrations submitted for review need test credentials, setup instructions, and a complete screencast.
- Shopify says an app that no longer reflects the original core functionality can be re-evaluated and require a full review.

An optional spend import should not change Shopify API scopes, but it would require listing/support/privacy truth updates and reviewer-ready credentials. Whether the published listing must be resubmitted should be confirmed with Shopify before launch; this brief does not assume either outcome.

### Minimum token/data controls

If accepted later:

- encrypt refresh/access tokens at rest; never log or expose them;
- keep app secrets in a managed secret store;
- request the least provider access available and make authorization incremental;
- separate provider identity from Shopify shop identity;
- support explicit disconnect, token revocation, uninstall purge, and data deletion;
- retain only fields needed for spend reconciliation;
- audit sync attempts without storing sensitive response bodies;
- document incident response and key rotation;
- make the product fully usable when every connector is disconnected.

---

## 6. Reversible wedge

The only acceptable architecture is an **optional import**, not a live truth layer:

```text
Provider spend API
  → staged CSV-shaped batch: date | channel | amount | currency | source account
  → merchant previews account, period, currency, timezone, overlaps, and total
  → merchant confirms import
  → canonical spend ledger
```

Rules:

1. **CSV/manual remains source of truth.** A connector produces a candidate import; it does not own the ledger.
2. Existing CSV, paste, backfill, export, and offline-channel paths remain first-class.
3. Imported rows are source-labeled and reversible by batch.
4. Re-sync never silently overwrites merchant-confirmed or manually corrected rows.
5. One platform ships first, selected by observed demand. No generic connector framework and no TikTok in v1.
6. Spend only. No pixels, conversions, attributed revenue, audiences, CAPI, or path data.
7. The feature can be disabled without breaking Total ROAS or deleting the canonical spend ledger.

This wedge is operationally safer than resurrecting the retired Connections surface as a connector hub, but it still carries provider approval and token custody.

---

## 7. Lower-risk alternative — CSV craft only

Ship [`SHIP_BACKLOG_FROM_LOVE.md`](./SHIP_BACKLOG_FROM_LOVE.md) **Love-5 — Automate / pipe discoverability** before any OAuth work:

- link the existing long/wide pipe templates directly from Spend;
- remove instructions that point to a missing Automate tab;
- make multi-day paste, backdating, overlap behavior, and source labels obvious;
- let a merchant-paid SyncWith/Coupler/Supermetrics/Coefficient-class tool own provider OAuth;
- preserve a direct CSV path for every platform and offline spend.

| Criterion | CSV craft + Love-5 | Mcfly-owned OAuth |
| --- | --- | --- |
| Time to ship | Small, already specified | **HYPOTHESIS:** 20–39 days/platform |
| Provider approval | None | Meta/Google review surfaces |
| Token custody | None | Refresh/access tokens and secrets |
| First-session TTFV | Fewer steps | Consent + account selection |
| Recurring effort | Merchant/export tax remains | Lower after a healthy connection |
| Failure legibility | Missing file/rows are visible | Stale sync can look complete |
| Platform coverage | Any CSV/offline source | One API at a time |
| Reversibility | Immediate | Migration, revocation, support burden |

CSV craft does not eliminate the recurring tax. It is the correct lower-risk move because it improves the known problem while preserving measurement honesty and buying time to collect paid evidence.

---

## 8. Acceptance gates and kill criteria

### Do not start a connector build until all are true

1. At least **5 operator interviews** are complete, as required by the Love research gate.
2. At least **3 interviewed operators** independently identify recurring spend import—not pixels or attribution—as a reason they would not pay or retain at $39.
3. A complete organic funnel period establishes actual trial starts, first-spend completion, paid conversion, and relevant uninstall reasons.
4. The measured cohort supports a written 90-day model with at least **5 incremental paid shops** in the base case. This threshold is a decision rule, not a claim that five will occur.
5. At least **3 design partners** agree to authorize the same platform and test disconnect, stale-token, wrong-account, overlap, and CSV-reconciliation cases.
6. Love-5 CSV craft is live and measured first; connector demand persists after the cheaper fix.
7. Provider approval prerequisites, security-assessment exposure, and Shopify review implications are confirmed in writing.

### Pilot kill criteria

Stop or roll back the pilot if any occurs:

- fewer than 60% of invited design partners complete authorization and first import;
- median connector path is not faster than the measured CSV path after initial setup;
- any stale/partial sync is presented as complete or produces an inflated trusted Total ROAS;
- more than 5% of scheduled sync-days fail silently; visible, fail-closed errors do not count as silent;
- more than 10% of confirmed batches require manual correction for account, currency, timezone, duplicate, or overlap errors;
- connector users do not show a paid-conversion or 30-day retention improvement after a predeclared cohort window;
- support/maintenance exceeds 3 engineer-days/platform/month for two consecutive months;
- provider approval requires pixels, event uploads, conversion data, or functionality outside spend-only reporting;
- CSV/manual becomes second-class or the canonical ledger can no longer operate without OAuth;
- the team is asked to add a second platform before the first meets its cohort gate.

Thresholds are predeclared operating rules, not observed performance.

---

## 9. Recommendation

**DEFER.**

Ship and measure CSV craft—especially Love-5—then interview operators and establish the organic funnel baseline. Current evidence proves recurring manual-spend friction exists; it does **not** prove first-party OAuth will create enough incremental paid shops to justify 20–39 engineer-days for one platform, provider verification, restricted-token custody, and a new class of “sync says complete but spend is missing” honesty failures.

If the acceptance gates pass, the founder can accept a narrowly amended religion:

> One optional, spend-only, merchant-confirmed import; CSV/manual remains canonical; no pixels, conversions, MTA, or path credit.

Until the founder explicitly accepts that amendment, [`RETIRED_SURFACES.md`](../RETIRED_SURFACES.md) remains controlling and Mcfly-owned ads OAuth remains retired.

---

## Sources

Internal:

- [`VALUE_THESIS.md`](../VALUE_THESIS.md)
- [`COMPETITORS.md`](../COMPETITORS.md)
- [`RETIRED_SURFACES.md`](../RETIRED_SURFACES.md)
- [`PIPE_AUTOMATION_WEDGE.md`](../PIPE_AUTOMATION_WEDGE.md)
- [`ULTRA_LEAD_ENGINEER.md`](../ops/ULTRA_LEAD_ENGINEER.md)
- [`LOVE_SCORECARD.md`](./LOVE_SCORECARD.md)
- [`FRICTION_AUTOPSY.md`](./FRICTION_AUTOPSY.md)
- [`COMMUNITY_SIGNALS_2026-09.md`](./COMMUNITY_SIGNALS_2026-09.md)
- [`SHIP_BACKLOG_FROM_LOVE.md`](./SHIP_BACKLOG_FROM_LOVE.md)

Primary public documentation, accessed 2026-09-09:

- [Shopify App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Shopify App Store best practices](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices)
- [Meta Marketing API authorization](https://developers.facebook.com/docs/marketing-api/get-started/authorization/)
- [Meta permissions reference (`ads_read`)](https://developers.facebook.com/docs/permissions)
- [Meta Tech Provider verification](https://developers.facebook.com/docs/development/release/tech-providers/)
- [Meta privacy-policy expectations](https://developers.facebook.com/docs/development/terms-and-policies/privacy-policy/)
- [Google Ads API multi-user authentication](https://developers.google.com/google-ads/api/docs/oauth/multi-user-authentication)
- [Google Ads API authorization](https://developers.google.com/google-ads/api/rest/auth)
- [Google Ads API developer token](https://developers.google.com/google-ads/api/docs/api-policy/developer-token)
- [Google Ads API credential security](https://developers.google.com/google-ads/api/docs/productionize/secure-credentials)
- [Google restricted-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)
- [TikTok API for Business overview](https://ads.tiktok.com/resources/help/article/marketing-api?lang=en)
- [TikTok Business API SDK](https://github.com/tiktok/tiktok-business-api-sdk)
