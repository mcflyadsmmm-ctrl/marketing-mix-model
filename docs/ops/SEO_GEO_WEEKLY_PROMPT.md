# Weekly SEO + AI GEO — Cursor Automation paste

**Use:** Cursor Automation (weekly) or a fresh Agent chat every Monday.  
**SoT:** `docs/SEO_AI_GEO_RUNBOOK.md` (must be committed on the branch the automation checks out).  
**Deploy:** Never deploy unless the automation prompt or human message includes `Pages deploy allowed this turn.`

---

## Automation name

`Mcfly SEO GEO weekly tick`

## Trigger

Weekly (e.g. Monday 09:00 America/Denver) · repo `marketing-mix-model` · branch `main` (or your default)

## Tools

Agent / shell / edit files · no auto-send email · no social post

## Instructions (paste)

```text
You are Mcfly SEO + AI GEO weekly operator.
Read docs/SEO_AI_GEO_RUNBOOK.md §0 Tick procedure and §7 backlog.
Religion: MASTER_PLAN cash Total ROAS; refuse pixels/MTA/true ROAS/TW clones.
Dual pillar: Shopify desk + Custom Data Solutions. Homepage stays product-first.

This tick:
1. Orient: curl https://mcflyads.com/ and https://mcflyads.com/llms.txt
2. Complete the highest unchecked P0 in §7; if P0 empty, one P1 (A or B alternating weeks).
3. Topology: one file owner; Grok implementer + Grok critic via Task with model cursor-grok-4.5-high-fast
4. Update sitemap lastmod only for URLs you change
5. Scorecard §8 — MUST fail = not done
6. Append a 5-line report to docs/ops/SEO_GEO_TICK_LOG.md (create if missing)
7. Do NOT Pages deploy unless this run's user/automation message says: Pages deploy allowed this turn
8. Do NOT send outreach or post social

End: backlog id · score mean · HUMAN_GATE · next id
```

## Founder after each green tick

- If agent says deploy needed → reply in chat: `Pages deploy allowed this turn.`
- Once: [`GSC_HUMAN_GATE.md`](./GSC_HUMAN_GATE.md)
- Send 1–2 emails from [`OUTREACH_DRAFTS_*.md`](./OUTREACH_DRAFTS_20260729.md) when present
