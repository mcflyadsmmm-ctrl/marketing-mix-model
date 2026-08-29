# McFly Living Board

**This is the always-on memory.** Every Cursor agent on this repo reads this file **first**, every turn — before chat history. Update it when live version, locks, or open gates change.

**Founder goal archive:** [`FOUNDER_PROMPT_HISTORY.md`](./FOUNDER_PROMPT_HISTORY.md) — mined Jul–Aug 2026 prompts.  
**Master directive (sales + craft law):** [`MASTER_DIRECTIVE.md`](./MASTER_DIRECTIVE.md) · teardown [`ops/TEARDOWN_20260828.md`](./ops/TEARDOWN_20260828.md)

| Field | Value |
| --- | --- |
| **Updated** | 2026-08-28 · America/Denver |
| **North star** | Make money via McFly: **custom data science they keep** ($15–40K) proved by world-class SAMPLE desks; Shopify **$39** app = frozen wedge |
| **Live site** | https://mcflyads.com · `mcfly-version` **v7** (Pages `5aa2e910`) · git `183b3e9` · PR [#27](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/27) |
| **Next site ship** | Package rename (Close Memo / Pipeline Desk) · audit→MDS credit · booking URL when pasted |
| **Repo** | https://github.com/mcflyadsmmm-ctrl/marketing-mix-model |
| **Pages** | Cloudflare `mcflyads` · Direct Upload · `martysmithson04@gmail.com` · merge ≠ live · **deploy from a non-git dir** |
| **App** | **FROZEN** code · **important wedge** on site (spend beside sales → Custom when books disagree) · no `app/**` / Fly |
| **Conductor** | One Cursor chat · [`ops/CURSOR_OS.md`](./ops/CURSOR_OS.md) · not a Grok fleet |

---

## Product lock (do not freestyle)

1. Sell **custom data science they keep** — any company. Marketing is **one** module.
2. MDS ~$15–25K = exec desks + signed-in portals + pipelines + handoff files.
3. Packages on site: Audit **$5–8K** · Lead gen **$8–15K** · MDS **$15–25K**.
4. App wedge: **Mcfly Analytics** solves a real Shopify problem and routes owners to Custom when books disagree · 7-day then **$39** · demo while listing pending · freeze `app/**` / Fly until unfreeze.
5. SAMPLE only — Northline: invoice **$98,500** · cash Total ROAS **4.19×** · variance **−$1,450**. No fake logos. No `$84,200` on site.
6. Voice: no “Monday” / “cash desk” / “two books” branding. Seat copy = **2 of 4**, never “500-seat” theater.
7. Refuse: pixels, MTA, path credit, “true ROAS,” TW clones.

---

## Live truth (probe before claiming ship)

| URL | Must |
| --- | --- |
| `/` | H1 = Custom data science they keep |
| `/lab` | Hired desk first paint · A. Chen · seat 2 of 4 · **never** redirect away |
| `/custom-analytics` | Packages + short inquire + SAMPLE |
| `/custom` `/proposal` `/desk-setup` | → `/custom-analytics` (301) |
| Fly `/demo` `/pricing` `/privacy` `/support` `/terms` | 200 · untouched during freeze |

Deploy (production — Direct Upload). **Do not run Wrangler inside a git checkout** (auto branch → Access-gated Preview). Copy `site/` (+ `functions/` if needed) to a temp dir, then:

```bash
npx wrangler@3 pages deploy site --project-name=mcflyads --commit-dirty=true
```

Never pass `--branch` for a production ship.
---

## Magic phrases

| You say | Effect |
| --- | --- |
| `status` | Refresh this board + live probes |
| `go site` | One hostile-CFO site ship → PR → Pages when granted |
| `go money` | Cap-3 drafts / comments · do not send unless approved |
| `stop fleet` | Idle · no deploy · no mail · cancel agents |
| `shopify app unfreeze` | Only then touch `app/**` / Fly |

---

## Open gates (human)

**You own first:** Google Appointment schedule (20 min + Meet) → paste URL here / in chat. Then send or approve Mon T1s.

- [ ] **FIRST:** Google Appointment schedule URL → on `/custom-analytics`
- [ ] Paste comments: `docs/ops/money/COMMENTS_1_4_PASTE.md`
- [ ] Approve Mon T1s: `docs/ops/money/T1_WEEK_OF_2026-08-31.md` (Scott / Chris / Abhinav)
- [ ] Namecheap MX → Cloudflare for `support@`
- [ ] Watch Sicard / Crowe / Ulery replies (already mailed Fri)
- [x] **v7 live** — Trust P0 + app→custom bridge · Pages `5aa2e910` · PR [#27](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/27)
- [ ] Merge PR [#27](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/27) when convenient
- [ ] **Next Conductor ship:** package rename + audit→MDS credit (MASTER_DIRECTIVE)
---

## Anti-amnesia rules for agents

1. **Chat is disposable. This file is not.** If chat contradicts this board, **board wins** (unless founder explicitly overrides in the latest message).
2. After every production Pages deploy: bump `mcfly-version`, note Pages id here, one line in `docs/ops/journal/`.
3. Do not spawn Grok fleets. Do not parallel `dist/` sites. Do not ask questions already answered here.
4. Autopsy of what failed: [`ops/GROK_BOT_AUTOPSY_20260828.md`](./ops/GROK_BOT_AUTOPSY_20260828.md)
5. Full OS: [`ops/CURSOR_OS.md`](./ops/CURSOR_OS.md)

---

## Version ledger

| Ver | When | Pages | What |
| --- | --- | --- | --- |
| v1 | 2026-08-28 ~10:02 | `0f6c733d` | `/lab` 200 Northline |
| v2 | ~11:48 | `0356a7d5` | Custom H1 · A. Chen chrome |
| v4 | ~13:21 | `94e460fc` | First paint = hired desk |
| v5 | afternoon | `d77b276d` | Self-hosted fonts |
| v6 | evening | `6a5dc354` | `/proposal` `/desk-setup` 301 · short inquire · seat 2 of 4 · home lede/LCP · git `588ffd8` |
| v7 | evening | `5aa2e910` | Trust P0 · app→custom bridge · Harbor app SAMPLE · seat 2 of 4 on MDS · privacy inquire · About entity · git `183b3e9` |
