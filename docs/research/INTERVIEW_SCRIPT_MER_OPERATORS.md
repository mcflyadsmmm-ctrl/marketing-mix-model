# Interview script — MER spreadsheet operators (R1)

**Lane:** Research R1 · **Do not commit quotes as evidence.** Reviews stay **0** until honest App Store reviews exist.

**ICP primary:** DTC operators ($1–20M) who already close ad spend against Shopify sales in Sheets / Notion / Airtable.  
**ICP secondary:** Agency strategists who run weekly MER closes for clients and reconcile Ads Manager vs till.

**Duration:** 25–40 minutes (screening 3–5 min · core 23–36 min · close 4–7 min).  
**Format:** Zoom / phone / async Loom reply. One interviewer. Record only with consent.

**Sources absorbed:** [`DEEP_RESEARCH_BACKLOG.md`](../DEEP_RESEARCH_BACKLOG.md) · [`VALUE_THESIS.md`](../VALUE_THESIS.md) · [`NICHE_PAIN_BANK.md`](./NICHE_PAIN_BANK.md) · [`ops/money/OUTBOUND_MER_OPERATORS.md`](../ops/money/OUTBOUND_MER_OPERATORS.md) · [`APP_STORE_LISTING.md`](../APP_STORE_LISTING.md) (skim).

**Listing (for context only — do not cite install/review counts):** https://apps.shopify.com/mcfly-analytics-public · $39/store/mo · 7-day trial · **Reviews: 0**.

---

## Before you start

### Consent note (read verbatim)

> Thanks for making time. I'm Marty from Mcfly Analytics — we're building a Shopify cash desk for spend vs till, not attribution. This is research, not a sales call. I'd like to ask about how you already work — your MER sheet, Monday ritual, what you trust and what you don't.
>
> **May I record this call** for my notes only? I won't share your name or store publicly without written permission. You can skip any question. If we demo Mcfly later, that's separate — today is about your workflow.

If no consent to record: take handwritten notes; mark capture sheet **Recording: N**.

### Interviewer prep

- Have a blank [capture sheet](#capture-sheet-fields) open (Notion row, Sheet row, or paper).
- Do **not** lead with Mcfly features until the **refuse / fit** block (~minute 31+).
- Do **not** invent quotes, review counts, customer logos, or results claims.
- If they haven't installed Mcfly: skip live TTFV; ask hypothetical TTFV only.
- Tag each note: `[OPERATOR]` or `[AGENCY]` + revenue band if known.

---

## Screening (3–5 min)

**Goal:** Confirm ICP fit. Politely exit if they are pixel-first, suite-only, or never touch spend totals.

| # | Question | Pass signal | Exit signal |
| --- | --- | --- | --- |
| S1 | Walk me through your role and who owns the weekly ad-spend vs sales check. | Founder, head of growth, finance-adjacent ops, or agency strategist on the client call | Junior media buyer with no till access; pure creative role |
| S2 | Do you already track **MER**, **Total ROAS**, or **sales ÷ ad spend** somewhere outside Ads Manager? | Yes — Sheet, Notion, Looker tab, agency template | No; only platform ROAS dashboards |
| S3 | Rough store scale: annual Shopify revenue band? | ~$500K–$20M DTC (flexible) | Pre-revenue or enterprise BI-only with no weekly close |
| S4 | What stack touches this today? (Shopify, ad platforms, TW/Northbeam/Polar, Triple Whale, etc.) | Names 1–3 tools; may include a suite **and** a side spreadsheet | Expects one suite to replace all math; refuses any manual spend |
| S5 | Are you open to a **25–30 minute** workflow interview? No pitch unless you ask. | Yes | No → thank and exit |

**Screen-out script:**  
"Sounds like you're deeper in [attribution / enterprise BI] than our research slice — I don't want to waste your time. If you ever maintain a MER sheet for Shopify, I'd love a follow-up."

---

## Core interview (~23–36 min)

Read questions conversationally. Follow the thread; don't rush the list.

### A. Monday ritual (8–10 min)

**Goal:** Map the recurring cash-close job — not campaign optimization trivia.

1. **Walk me through last Monday** (or your usual weekly close). What time? Who's in the room / on Slack?
2. What **three numbers** do you need before you'll change spend?
3. Where do you pull **Shopify sales** from — Admin, Analytics, export, agency report? Net or gross? Do you care?
4. Where do you pull **ad spend** — platform exports, credit card, finance, agency invoice?
5. When Ads Manager ROAS and your till disagree, **which number wins** for the spend decision? Why?
6. Do you have a **break-even ROAS / MER** or margin hurdle documented? Where does it live?
7. After the close, what's the **output** — Slack message, budget shift, client deck, board update?
8. What happens when you **skip** a week?

**Probes:** "Show me that tab if you're on screen share." · "What's the formula in plain English?" · "Who do you not trust in that chain?"

### B. Top-12 niche pressure (5–8 min)

**Goal:** Pressure-test ranked pains from [`NICHE_PAIN_BANK.md`](./NICHE_PAIN_BANK.md) **P01–P12**. Do not read pain IDs aloud. Capture **their** words only — **never invent quotes.**

Skip any row they already covered deeply in Monday ritual. Force at least **six** of the twelve before moving on.

| ID | Force question | Rich signal |
| --- | --- | --- |
| **P01** | When **Ads Manager ROAS** and **Shopify till** disagree, which number do you **act on** for spend? What would have to change for you to trust till-side math in under 10 minutes? | Till, bank, or sheet wins — not platform ROAS alone |
| **P02** | Walk me through the **Monday tax** on your sheet or CSV: exports, VLOOKUP, missing days, currencies, timezones. What breaks most often? | Rebuild steps named — not "it's automatic" |
| **P03** | Does spend in Ads Manager ever feel **higher or fresher** than what attribution suites show? Which number do you paste into MER? | Lag / "true spend" anxiety between platform and suite |
| **P04** | Gut check: analytics priced on **GMV** — do you feel **punished for growing**, or is it fine? What would **flat $39/mo** change in your stack? | GMV-tax resentment or explicit pricing story |
| **P05** | Do you know your **break-even ROAS / MER** (contribution-margin math)? Where does it live — doc, sheet tab, founder's head? | Documented hurdle vs vague gut feel |
| **P06** | For MER, which **Shopify sales basis** — total, net, demand? Do **January returns** or **tax** ever make you rewrite the week? | Basis choice + seasonal or returns rewrite |
| **P07** | What **offline / influencer / agency / retainer** spend is in blended MER but **not** in ad platforms? | Named non-platform spend lines |
| **P08** | If a till desk only took **CSV/paste** spend — dealbreaker, relief, or "I'll paste Monday"? What makes CSV feel like a **broken app**? | Auto-sync expectation vs honest manual |
| **P09** | Day one after install: **coverage holes** before a full week of spend — acceptable or punished? | TTFV / empty-state tolerance |
| **P10** | Would you **pay $39** before you trusted Total ROAS, or does trial length matter more? | Trust clock vs price |
| **P11** | Do you need Monday MER on **phone** — widget, screenshot, Slack — or Admin-on-desktop is enough? | Mobile ritual signal |
| **P12** | **[AGENCY]** Multi-client weekly close — same template, snowflake, or export pack per client? | Multi-store ritual |

**Five-star till desk at $39 — force last (even if block E repeats):**

1. Complete: "I'd leave **five stars** for a till desk if it ______." (Probe: honest Monday close, flat price, no GMV tax.)
2. Complete: "I'd **one-star or uninstall** if it ______." (Probe: fake auto-sync promise, wrong sales basis, attribution theater.)

**Probes (prompt vocabulary — not quotes to attribute):** platforms claim the same sale · phantom purchases · VLOOKUP hell · missing days · why won't it connect Meta · don't MER on total sales in January · billboards · retainers · punished for growing

Tag validated IDs on the capture sheet (`niche_pain_ids`).

### C. Suite anxiety (6–8 min)

**Goal:** Where attribution suites create clarity vs theater (per DEEP_RESEARCH_BACKLOG P0).

1. Do you pay for **Triple Whale, Northbeam, Polar**, or similar? What job did you buy it for?
2. What do you **open every week** in the suite vs what gathers dust?
3. Where does the suite make you **more anxious** than before you had it?
4. Have you ever made a **spend move** from a pixel/path number that **didn't match the bank**? What happened?
5. If you dropped the suite tomorrow, what would you **actually miss** vs what is CYA for stakeholders?
6. **Agency variant (A1):** On client calls, do you show platform ROAS, suite MER, and your own sheet? Which one do clients **act** on?
7. **Agency variant (A2):** Billing — is the suite cost passed through, bundled, or a margin hit?

**Probes:** "I don't trust ROAS anymore" — have you said or heard that? · DNS / pixel install — did that delay value?

### D. Time to first trusted number — TTFV (5–7 min)

**Goal:** Benchmark Mcfly's "<10 min to trusted Total ROAS" claim against their real onboarding memory.

1. When you **last adopted** a marketing analytics tool, how long until you trusted one headline metric?
2. What were the **setup steps** — pixels, DNS, COGS, integrations, training?
3. What almost made you **churn in week one**?
4. For your MER sheet today: if you handed it to a new hire, how long until they could run Monday close **without you**?
5. **If Mcfly installed (optional):** Settings → margin → CSV spend → Overview — where did you stall? What would "trusted" mean for you?
6. **If not installed:** Imagine Shopify Admin showed Total Sales ÷ CSV spend + break-even in one screen — what would make you trust it in **under 10 minutes**? What would break trust instantly?

**Probes:** SAMPLE/demo data — helpful or annoying? · Freshness / "last updated" — do you need it?

### E. Spend entry pain (5–7 min)

**Goal:** Validate CSV/paste wedge vs OAuth / connector zoo (VALUE_THESIS §2).

1. How many **ad channels** do you roll into MER today? (Meta, Google, TikTok, email, affiliate, Amazon, etc.)
2. Walk me through **getting spend into the sheet** — exports, Supermetrics, manual copy, agency paste.
3. Which channel is the **biggest pain**? How often do you update — daily, weekly, monthly?
4. Have you tried **SyncWith / Coupler / Supermetrics / Coefficient** or similar? Worth it?
5. Would you **paste CSV weekly** if the till math was instant and honest? What would feel insulting at $39/mo?
6. **Agency variant (A3):** Per-client spend ingestion — same template or snowflake every time?

**Probes:** TikTok / Microsoft / Pinterest — included or "Other"? · Combined export vs per-platform?

### F. Five-star review bar (4–5 min)

**Goal:** Honest App Store review criteria — **do not ask them to review.** Learn what would earn *their* five stars. If P09/P10 and five-star lines were captured in block B, shorten here.

1. Think about the last Shopify app you **loved**. What did it do in week one?
2. What would make you leave a **public** App Store review for a cash desk app — vs just churn quietly?
3. **Five-star:** Complete this: "I'd leave five stars if it ______."
4. **One-star:** "I'd one-star or uninstall if it ______."
5. Flat **$39/mo** vs GMV-scaled pricing — gut reaction?
6. **Agency variant (A4):** Would you standardize one desk across clients, or only recommend for spreadsheet-native founders?

**Reminder to interviewer:** Never write their review for them. Never promise incentives for reviews.

### G. Refuse list / fit check (3–5 min)

**Goal:** Confirm Mcfly religion aligns with their job — or learn mismatch early.

Read calmly:

> Mcfly deliberately **does not** ship pixels, multi-touch attribution, path credit, or "true ROAS." Spend comes in via **CSV/paste** (optional merchant-paid pipes). One flat **$39/mo** desk. Coexists with suites — doesn't replace CYA decks.

1. **Reaction?** Dealbreaker, fine, or relief?
2. Anything you **wish** we shipped that violates that — OAuth spend sync, pixel, channel ROAS, LLM coach?
3. Would "no pixels" make you **more** or **less** likely to try it for the Monday close?
4. **Agency variant (A5):** Would "complements your attribution stack" help you recommend it, or sound weak?

---

## Agency variant prompt pack

Use when `[AGENCY]` tagged at screening. Swap or add these prompts in blocks C–G.

| Block | Agency prompt |
| --- | --- |
| Open | "How many Shopify DTC clients run a **MER sheet** you touch vs platform-only reporting?" |
| B | Force **P12** row; add: "Same MER template across clients, or snowflake every time?" |
| C | "When the client's suite says one thing and Shopify says another, **what do you put in the slide**?" |
| D | "Client onboarding — hours to first **client-trusted** MER close?" |
| E | "Do you maintain a **master spend template** or per-client exports?" |
| F | "Would you white-label or co-brand a cash desk, or only point founders to install?" |
| G | "Does 'no pixels' help you sell **speed**, or hurt vs suite partners?" |

---

## Close (4–7 min)

1. **Anything I should have asked** about MER, break-even, or spend vs till?
2. **May I follow up** once if we ship something shaped by this conversation? (Y/N + best channel)
3. **Intro referral:** One other operator or agency who lives in spreadsheets for MER? (Optional — no pressure)
4. If they want a look: send listing link + [`OUTBOUND_MER_OPERATORS.md`](../ops/money/OUTBOUND_MER_OPERATORS.md) variant B or C — **no review ask until they trust Total ROAS.**

**Thank-you:**  
"Really helpful — this goes straight into how we phrase the desk and what we refuse to build."

---

## Capture sheet fields

Copy one row per interview. Store in `docs/research/interviews/` or ops tracker — **not** in listing copy.

| Field | Values / notes |
| --- | --- |
| `interview_id` | `INT-YYYY-MM-DD-##` |
| `date` | ISO date |
| `segment` | `operator` \| `agency` |
| `recording` | `Y` \| `N` |
| `consent_public_quote` | `Y` \| `N` |
| `name` | First + last (optional) |
| `company` | Store or agency name |
| `role` | e.g. founder, head of growth, media strategist |
| `revenue_band` | `<500K` \| `500K-1M` \| `1-5M` \| `5-20M` \| `20M+` \| `unknown` |
| `mer_tooling` | Sheet / Notion / Airtable / Looker / other |
| `suite_stack` | TW, NB, Polar, none, etc. |
| `channel_count` | Integer estimate |
| `monday_ritual_summary` | 1–3 sentences |
| `trusted_number` | What metric wins spend decisions |
| `break_even_awareness` | `Y-documented` \| `Y-in-head` \| `N` |
| `suite_anxiety_quote` | Verbatim if consented — tag `[QUOTE]` |
| `ttfv_story` | Minutes/days to trust; blockers |
| `spend_entry_pain` | Top pain channel + frequency |
| `automation_appetite` | CSV-only OK? Wants OAuth? |
| `five_star_bar` | Their words for 5★ |
| `one_star_bar` | Their words for 1★ |
| `refuse_list_reaction` | `dealbreaker` \| `neutral` \| `positive` |
| `price_gut` | $39 flat reaction |
| `mcfly_installed` | `Y` \| `N` \| `demo` |
| `follow_up_ok` | `Y` \| `N` |
| `referral` | Name/handle if given |
| `hypothesis_tags` | See [`MERCHANT_LOVE_JTBD.md`](./MERCHANT_LOVE_JTBD.md) IDs to validate |
| `niche_pain_ids` | [`NICHE_PAIN_BANK.md`](./NICHE_PAIN_BANK.md) P01–P12 validated (e.g. `P01,P06,P08`) |
| `interviewer_notes` | Freeform |

---

## Timing cheat sheet

| Segment | Min | Cumulative |
| --- | --- | --- |
| Consent + screening | 3–5 | 5 |
| Monday ritual | 8–10 | 15 |
| Top-12 niche pressure | 5–8 | 23 |
| Suite anxiety | 6–8 | 31 |
| TTFV | 5–7 | 38 |
| Spend entry pain | 5–7 | 45 |
| Five-star bar + refuse | 7–10 | 55* |

\*Target **25–40 min** by shortening probes in niche + suite + spend blocks; full run is ~45 min with demo.

---

## After the call

1. Fill capture sheet within 24h while memory is fresh.
2. Pull 1–3 `[QUOTE]` lines **only** if `consent_public_quote=Y`.
3. Map insights to hypothesis IDs in [`MERCHANT_LOVE_JTBD.md`](./MERCHANT_LOVE_JTBD.md) and pain IDs in [`NICHE_PAIN_BANK.md`](./NICHE_PAIN_BANK.md).
4. **Do not** paste interview lines into App Store listing, site, or ads as social proof.
5. Reviews stay **0** until real merchants leave honest App Store reviews.

---

## Handoff

Research-only. Absorb into site authority and desk copy — **do not expand app scope** unless [`MASTER_PLAN.md`](../MASTER_PLAN.md) is amended. Say: "Site authority only — absorb into `/site`, do not expand app scope."
