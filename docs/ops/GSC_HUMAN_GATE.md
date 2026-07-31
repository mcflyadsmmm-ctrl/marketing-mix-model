# Google Search Console — founder 5 minutes (HUMAN_GATE)

Agents cannot verify GSC. Do this once after Pages deploy of the SEO/GEO slice.

1. Open [Google Search Console](https://search.google.com/search-console) → property `mcflyads.com` (add URL-prefix or Domain if missing).
2. **Sitemaps** → submit `https://mcflyads.com/sitemap.xml` → wait for Success.
3. **URL inspection** → test:
   - `https://mcflyads.com/`
   - `https://mcflyads.com/llms.txt`
   - `https://mcflyads.com/custom-analytics`
   - `https://mcflyads.com/monday-close`
   - `https://mcflyads.com/mer-calculator`
4. Request indexing on any “Discovered / not indexed” money URL (cap polite — don’t spam).
5. Optional: [Bing Webmaster](https://www.bing.com/webmasters) → Import from GSC.
6. **AI crawlers:** follow [`AI_CRAWLER_POLICY.md`](./AI_CRAWLER_POLICY.md) — Cloudflare AI Crawl Control must **Allow** OAI-SearchBot / Claude-SearchBot / PerplexityBot; enable Markdown for Agents if available.

**Done when:** Sitemap shows Success; home + custom + one calculator are Indexed or Pending without Soft-404.

Related: [`docs/SEO_AI_GEO_RUNBOOK.md`](../SEO_AI_GEO_RUNBOOK.md)
