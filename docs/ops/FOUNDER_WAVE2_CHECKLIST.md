# Founder Wave 2 — Human checklist (organic + AI GEO)

**From:** [`MAJOR_IMPROVEMENT_PLAN.md`](../MAJOR_IMPROVEMENT_PLAN.md) Wave 2  
**Agents cannot do these.** ~20–40 minutes total.

## Must do once

- [ ] **Google Search Console** — verify `mcflyads.com` · Sitemaps → submit `https://mcflyads.com/sitemap.xml` · ([`GSC_HUMAN_GATE.md`](./GSC_HUMAN_GATE.md))
- [ ] **Cloudflare AI Crawl Control** — **Allow** (not hard Block): OAI-SearchBot, ChatGPT-User, Claude-SearchBot / Claude-User, PerplexityBot · leave GPTBot/ClaudeBot/Google-Extended blocked for training · ([`AI_CRAWLER_POLICY.md`](./AI_CRAWLER_POLICY.md))
- [ ] **Markdown for Agents** — enable if the zone toggle exists (CF dashboard)
- [ ] Confirm live robots shows origin `ai-input=yes`: `curl -s https://mcflyads.com/robots.txt | grep ai-input`

## This week

- [ ] **Save** Cursor Automation from [`SEO_GEO_WEEKLY_PROMPT.md`](./SEO_GEO_WEEKLY_PROMPT.md) (weekly tick)
- [ ] **Send 5** emails from [`OUTREACH_DRAFTS_20260729.md`](./OUTREACH_DRAFTS_20260729.md)
- [ ] **Post 1** LinkedIn/X draft from the same file

## Optional

- [ ] Bing Webmaster import from GSC
- [ ] Reply in Cursor when done: `Wave 2 human done` so agents can log the MIP progress row

## Wave 1 still human

- [ ] Listing screenshots + Partner **Distribution → Submit** — start at [`SUBMIT_HANDOFF.md`](./SUBMIT_HANDOFF.md) · full runbook [`SUBMIT_NOW.md`](../SUBMIT_NOW.md) · testing paste [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md)
