# Site craft — next distiller brief

**Critic #9 (Grok)** · 2026-07-22 ~21:46 MT · parent idle overnight while 8m frontier loop kept waking (100+ ticks queued, not executed). Docs-only: local rescore + live `curl`. **No `site/**` HTML rewrite** — local `?v=` already unified at `q`; no broken-link / version inconsistency on disk.

**Prior:** Critic #8 mean ~4.9; peak local `20260722q`; live lag + `why-pixels-fail` 404.

## Rubric scores (local only · 1–5)

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Brand first | **5** | Hero `brand-hero` = M mark + `Mcfly Ads`; chrome/footer/manifest Ads; survives remove-nav. |
| Thesis clarity | **5** | Lede `Cash MER is sales ÷ spend` + formula underline; digest eq + Monday close — ≤3s. |
| Hero budget | **5** | One primary CTA + intentional proof strike (KEEP). Desk-defer ≤859px intact. No cards/stats clutter. |
| Mobile conversion | **4.5** | Candidate B dock (`waitlist-dock` @ `q`); peek ≤720px; sheet + mailto; auto-hide at `#waitlist`. Soft: no screenshot verifier this pass. |
| Non-slop craft | **5** | Cyan/navy; Bricolage/Figtree/Plex Mono; mesh/rise/desk-enter + reduced-motion; claim-strike. All HTML `?v=` = **`q`**. |
| Authority honesty | **5** | Home lie/contrast + deep page local. Soft: **unshipped live (404)** — deploy, not craft. |
| Product religion | **5** | Pass — CTA = waitlist / cash desk; proof names cash MER; SyncWith/MMM/forever-free only as refuse / time-box. |

**Mean: ~4.9** · ship-eligible locally. Religion pass. Unchanged vs Critic #8. Soft dock screenshot still open (−0.5 mobile).

## Live status (`curl` 2026-07-22 ~21:46 MT)

| URL | HTTP | Notes |
| --- | ---: | --- |
| `https://mcflyads.com/` | **200** | ~0.18s · ~18.8KB · Cloudflare Pages |
| `https://mcflyads.com/why-pixels-fail` | **404** | Analytics 404 shell @ `?v=20260721b` |
| `…/why-pixels-fail.html` | **404** | Same |
| `…/product.html` → follow | **200** | Stale short product shell @ `20260721b` |
| `…/pricing.html` → follow | **200** | Stale @ `20260721b` |

Home live signals (still stale vs local):

| Signal | Live | Local |
| --- | --- | --- |
| Asset `?v=` | `20260721b` | Peak **`20260722q`** |
| Brand | Mcfly **Analytics** · text-only “Mcfly” hero | Mcfly **Ads** · M mark + Ads |
| Lede / thesis | Suites / plumbing (no `sales ÷ spend` in first signals) | `Cash MER is sales ÷ spend` |
| Hero CTAs | “Join free launch” | “Get early access” + intentional proof strike |
| Waitlist mobile | No dock | Candidate B dock @ `q` |
| Authority deep page | **404** | Full ITP/LTP/CNAME/CAPI page |

**Deploy remains human P0.** Do not treat live screenshots as craft truth until Pages publish. Local curriculum 1–5 are closed; step 6 cannot advance without publish.

## Loop intensity — IDLE until deploy (or Candidate C only)

Overnight the parent sat idle while an **8m frontier loop** kept waking and **queued 100+ ticks that never executed**. Spawning six generators every 8 minutes while live lags is **anti-craft**: it burns frontier budget, queues dead work, and cannot close curriculum step 6.

| Mode | When | What |
| --- | --- | --- |
| **IDLE (default)** | Until human Pages deploy lands | No site generators. Orient-only ticks OK (curl live, confirm lag). Do **not** spawn 6× Generator/Critic every 8m. |
| **Candidate C only (optional)** | If humans want local craft while waiting | **One** isolated prototype lane in `docs/SITE_CRAFT_CANDIDATES.md` (Candidate C — reconciliation receipt). Do **not** rewrite live-bound `site/index.html` hero on taste alone. |
| **Post-deploy verify** | After publish | **Grok** verifier: live `?v=` ≥ `20260722q`, Ads brand, `sales ÷ spend`, waitlist-dock, `/why-pixels-fail.html` = **200**. Then dock screenshot. |

**Hard rule for orchestrators:** while live ≤ `20260721b` / Analytics / why-pixels **404**, recommend **IDLE** or **Candidate C prototype only** — never a multi-generator mega-tick every 8 minutes.

## Sonnet / secondary status

| Item | Status |
| --- | --- |
| `product.html` / `support.html` | Landed locally @ `q` — hold until post-deploy |
| Primary CTAs | index / product / why-pixels = “Get early access” |
| Forced Sonnet re-spawn | **No** |

## Religion flags (unchanged)

| Check | Verdict |
| --- | --- |
| MMM as product | **Clean** |
| SyncWith / connector zoo | **Clean** |
| Forever-free marketing | **Clean** |
| Pixel as Mcfly product | **Clean** |

## Curriculum position

| Step | Status (local) |
| --- | --- |
| 1 Thesis | Done |
| 2 Sticky waitlist | Done (Candidate B @ `q`) |
| 3 Proof before CTA | Done — intentional strike (**KEEP**) |
| 4 Motion + reduced-motion | Done |
| 5 Secondary parity | Done — all HTML `?v=` = **`q`** |
| 6 Live deploy verify | **Fail** — live `20260721b` / Analytics; `why-pixels-fail` **404** |

## Next — file-locked opportunities

Priority order. One lane; do not broaden.

### 1. Deploy (curriculum 6) — **Human gate P0** → verify **Grok**
- Push / Pages publish `site/**` so live `?v=` ≥ **`20260722q`** and `/why-pixels-fail.html` = **200**.
- Verify: `curl -sS https://mcflyads.com | rg 'Ads|\?v=20260722q|sales ÷ spend|waitlist-dock|Get early access|proof-claim'`; `curl -sS -o /dev/null -w '%{http_code}\n' https://mcflyads.com/why-pixels-fail.html`.

### 2. Optional while waiting — Candidate C prototype only · **Fable**
- Isolate in candidates doc / worktree. Do not thrash shipped local hero. Advance only after live catches up **or** explicit human taste compare.

### 3. Post-deploy — dock screenshot verifier · **Grok**
- Mobile ≤720px: peek after hero exit; sheet; auto-hide at `#waitlist`; reduced-motion OK.

### 4. CTA copy unify · **Hold until deploy green** · Fable
- Only if chrome/nav still says “Join free launch” vs primary “Get early access”.

**Dropped:** Multi-generator 8m swarm while live lags.  
**Hold:** Best-of-N hero redesign on primary files — mean ~4.9 locally.  
**Hold:** Second Sonnet on product/support.  
**No HTML rewrite this tick:** local links + `?v=q` consistent; breakage is publish, not disk.

**Critic → generator:** Local mean **~4.9**. Live still Analytics @ `20260721b` + **404** on why-pixels — **deploy first (human P0)**. Loop intensity: **IDLE** (or Candidate C only). Never invent attribution theater.
