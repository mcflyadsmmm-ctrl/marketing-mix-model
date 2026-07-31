# AI crawler + organic discovery policy — Mcfly Ads

**Goal:** Show up in Google/Bing **and** get cited in AI answers — without inviting scrapers that only train models.  
**Live check:** `curl -s https://mcflyads.com/robots.txt`  
**Related:** [`SEO_AI_GEO_RUNBOOK.md`](../SEO_AI_GEO_RUNBOOK.md) · [`GSC_HUMAN_GATE.md`](./GSC_HUMAN_GATE.md)

---

## What “best practice” means here (2026)

| Layer | Job |
| --- | --- |
| **Classic SEO** | Googlebot / Bingbot `Allow: /` + sitemap + real pages |
| **AI GEO (citations)** | Allow **retrieval** bots + signal `ai-input=yes` |
| **Training** | Prefer `ai-train=no` + CF Disallow on GPTBot / ClaudeBot / Google-Extended / CCBot |
| **llms.txt** | Map for agents once they already fetch you — not a lock |

**Do not** block OAI-SearchBot / ChatGPT-User / Claude-SearchBot / PerplexityBot if you want ChatGPT / Claude / Perplexity answers to cite mcflyads.com.

**Do not** confuse “block all AI” with “rank organically.” Blocking retrieval bots removes you from AI answers.

---

## What we ship at origin (`site/robots.txt`)

After Cloudflare’s managed prepend, origin declares:

```text
Content-Signal: search=yes, ai-input=yes, ai-train=no, use=reference
```

Plus explicit `Allow: /` for Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User.

We **do not** re-Disallow GPTBot etc. — Cloudflare Managed Content already does.

Machine maps:

- https://mcflyads.com/llms.txt  
- https://mcflyads.com/llms-full.txt  

---

## HUMAN_GATE — Cloudflare dashboard (5 minutes)

Live `robots.txt` currently shows Cloudflare Managed Content with `search=yes,ai-train=no,use=reference` and **no `ai-input`**. Origin now adds `ai-input=yes`. Still confirm WAF/AI Crawl Control does not **Block** citation bots.

1. Cloudflare → domain **mcflyads.com** (or Pages custom domain zone).
2. **AI Crawl Control** → **Crawlers**
3. Set **Allow** (or “Enforce robots.txt” only — not hard Block) for:
   - OAI-SearchBot / ChatGPT-User  
   - Claude-SearchBot / Claude-User  
   - PerplexityBot / Perplexity-User  
   - Googlebot / Bingbot (if listed)
4. Leave **Block** or robots Disallow for training: GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Applebot-Extended, meta-externalagent.
5. **AI Crawl Control** → **Robots.txt** tab — confirm Content Signals show search + **ai-input** after deploy.
6. Optional: enable **Markdown for Agents** (Cloudflare) so agents can fetch markdown variants of HTML — [docs](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).

If Managed robots.txt fights your GEO goals, you may later turn managed robots **off** and rely on origin-only — only after you understand you will own training Disallows yourself.

---

## Content that wins citations (already in flight)

Answer-first formulas, FAQ schema, refuse list, calculators, dual-pillar About — see SEO runbook. Crawlers without quotable pages still will not cite you.

---

## Verify after every Pages deploy

```bash
curl -s https://mcflyads.com/robots.txt | head -80
curl -sI https://mcflyads.com/llms.txt | head -5
curl -s https://mcflyads.com/sitemap.xml | head -5
```

Expect: CF managed block (training Disallows) **plus** origin `ai-input=yes` and retrieval `Allow`s + Sitemap + no accidental sitewide Disallow.
