# Desk reboot — start over from Live uninstall face

**Written:** 2026-09-23 ~00:05 MT  
**Trigger:** Marty Admin screenshots (`devmcflyads`) — triple trust banners, `$0` chart while loading, pill IA that feels like a marketing suite, not Shopify Analytics.  
**Verdict:** Ship R/S densified the **SAMPLE** desk. The **Live empty/loading** face is still an uninstall. We stop stacking craft on a bad IA and reboot the desk product.

## Honest autopsy

| What we shipped | What merchants actually opened |
| --- | --- |
| SAMPLE Snowdevil with `$68,457` and folded depth | Live Overview with **three** stacked banners + dashes + a `$0` chart |
| Five pill tabs (Overview · Orders · Customers · Spend · Goals) | Feels like five half-apps, not one morning report |
| “Not $0” honesty copy | Reads as engineering notes (“reports scope / sales totals ingest”) |
| Dual range + granularity chrome | Two remote controls fighting one empty chart |

Craft density without a **pending religion** and a **tab religion** is lipstick. Enterprise readiness (~48%) already said unpark NO — these shots are why.

## Religion (unchanged)

- Total ROAS = sales ÷ entered spend; empty spend = **—** (never 0×)
- Morning number = **From orders**; no Analytics Total Sales clocks until PCD L2 + Marty
- Flat **$39** / 7-day · SAMPLE_ONLY until Marty unparks · no inventing reviews
- No pixels / MTA / OAuth zoo / SSO / GMV pricing

## New locks (this reboot)

### 1. Tab religion — three jobs only

| Tab | Job | Absorbs |
| --- | --- | --- |
| **Home** | Morning sales | Today’s Overview + Orders chart / typical order peek |
| **Customers** | Returning $ | Existing Customers first fold |
| **Spend** | Entered spend → Total ROAS | Existing Spend first fold |

- **Goals** → Settings subsection or Home “Targets” fold (`rank="more"`). Not a top tab.
- **Settings** → Shopify Admin app menu / gear only (Polaris pattern). Not a sixth pill.
- Kill `DeskPanelRail` jump chips on Home until Home is boringly clear.
- Public `/demo` mirrors the same three tabs.

### 2. Pending religion — one breath, never a farm

When order history or sales facts are not ready:

1. **One** status surface (Polaris empty-state / single `s-banner`). Never stack three.
2. Hero shows **—** or a quiet “Loading orders…” — **never `$0`** on sales, typical day, or chart Y-axis `$0–$1`.
3. Chart / YoY cards **do not mount** until ≥1 closed day exists (or SAMPLE lock).
4. Merchant copy only. Ban: “reports scope”, “sales totals ingest”, “orders crawl”, “not an orders crawl”.
5. Footer may keep one mute line (`N of M days · refresh soon`). No essay.

### 3. Chrome religion

- One period control row max on Home (range **or** from/to — not both fighting).
- Granularity (Day/Week) lives **inside** the chart section, not a second global strip.
- Prefer native Admin frame + Polaris structure; no pill cluster that looks like a consumer app.

## What we keep (do not throw away)

- Order-fact pipeline, webhooks, billing $39, SAMPLE Snowdevil lock numbers
- Spend ledger honesty (— not 0×), pair coverage, import/backfill
- `mcfly-app-craft` skill + Shopify Dev MCP Polaris patterns
- Site v45 / fly.dev → 301 (marketing host truth)
- Religion + SAMPLE_ONLY gates

## What we delete or demote

- Five-pill + Goals as peer tabs
- `CashTrustBanners` multi-stack on Home (replace with one pending component)
- Painting sales chart at `$0` while `salesPending` / `0 days on file`
- MorningHabitStrip duplicate pill chrome
- Essay trust copy that explains the pipeline to engineers

## Program (four ships — then stop)

### Ship T0 — Spec + pending kill (tonight / next)

**Exclusive:** `CashTrustBanners.tsx`, `cash-trust-copy.ts`, Overview chart empty path, tests, this plan.  
**Do:** One pending component; Overview never mounts `$0` chart when 0 days on file; ban phrases above.  
**Done:** Live Overview with empty book shows **one** status + hero — / no chart / no triple banners. Screenshot gate.  
**Model:** Composer → Opus once.

### Ship T1 — Three-tab nav

**Exclusive:** `desk-nav.ts`, `DeskTopTabs.tsx`, routes redirects (`/app/orders` → Home hash or Customers peek), demo nav, tests.  
**Do:** Home · Customers · Spend only. Goals → settings/targets. Update listing paste pack IA line (Marty Save later).  
**Done:** `rg` five-pill labels = 0 on desk chrome; redirects 308/replace.

### Ship T2 — Home = morning report

**Exclusive:** Home route (ex-Overview), first viewport, YoY, one chart, CSS.  
**Do:** Hero → vs last year → one sales chart. Orders-specific depth stays off first two scrolls.  
**Done:** Matches SAMPLE craft density **and** Live pending religion.

### Ship T3 — Customers + Spend re-home only

No new features. Re-skin first folds to match Home chrome. Fold everything else.

**Stop.** No Goals craft. No ads. No unpark. No research fleet.

## Marty-only (unchanged)

Partner listing Save · `support@` MX · review emails · FUNNEL · unpark · `read_reports` / L2.

## Refuse

Another aesthetic-only pass on five tabs · downloading random Shopify skills · claiming Live is fine because SAMPLE looks good · inventing reviews · App Store Ads.

## Success bar

A cold Admin open on an empty/loading shop in **10 seconds** reads as:
> “We’re loading your orders. This is not $0.”  
One status. Three tabs. No chart lie.

A SAMPLE open still shows Snowdevil `$68,457` and is worth a screenshot.

Canvas: `desk-reboot.canvas.tsx`.
