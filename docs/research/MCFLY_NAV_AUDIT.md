# Mcfly Analytics — primary nav audit

**Lane:** RESEARCH (docs only) · **Written:** 2026-09-09 · **Tree:** `mcfly-analytics/`  
**Method:** Read-only pass over `app/app/routes/app.tsx`, `app/app/lib/desk-nav.ts`, `install-stickiness.ts` (`firstOpenRedirect`), Settings/Billing routes, and companion route inventory in [`CAPABILITY_MAP.md`](./CAPABILITY_MAP.md).  
**Scope:** Map every primary nav label → route; cold-path reachability; in-page tabs; Settings/Billing placement. **No** `app/**` TSX edits. Reviews live = **0** — invent nothing.

**Companions (may still be writing):**

- [`BEST_SHOPIFY_APP_UX.md`](./BEST_SHOPIFY_APP_UX.md) — peer UX patterns / love signals for Shopify Admin apps  
- [`PEER_APP_IA_SKETCHES.md`](./PEER_APP_IA_SKETCHES.md) — information-architecture sketches vs peers  

Cross-check friction: [`FRICTION_AUTOPSY.md`](./FRICTION_AUTOPSY.md) (F1 cold Overview bounce, F10 retired redirects). Capability grades: [`CAPABILITY_MAP.md`](./CAPABILITY_MAP.md).

---

## 1. Where nav is defined

| Piece | File | Behavior |
| --- | --- | --- |
| Item list | `app/app/lib/desk-nav.ts` → `DESK_NAV_ITEMS` / `deskNavItems()` | Seven items; `later: true` = depth after first trusted Total ROAS, still always listed |
| Shell render | `app/app/routes/app.tsx` | Always renders `<s-app-nav>` → `<s-link>` per item; comment: do **not** hide tabs when SAMPLE is off |
| Shot mode | `listingCaptureHref(item.href, shotMode)` | Preserves listing-capture params on nav hrefs |
| Global chrome (not nav) | `DataModeBar` under nav (hidden when `?shot=1`) | Sample \| Real store + first-session guide |

Nav is never filtered by SAMPLE, billing, or entitlements. Depth pages soft-gate with `FirstTrustedRoasGate` (“First get Total ROAS”) instead of disappearing.

---

## 2. Primary nav: label → route

Source order in `DESK_NAV_ITEMS` (this is the Admin tab order):

| # | Label (merchant-facing) | `id` | `href` | `later` |
| --- | --- | --- | --- | --- |
| 1 | Overview | `overview` | `/app?stay=1` | no (core) |
| 2 | Spend | `spend` | `/app/spend` | no (core) |
| 3 | Settings | `settings` | `/app/settings` | no (core) |
| 4 | Goals | `goals` | `/app/goals` | yes |
| 5 | Spend Allocation | `allocation` | `/app/allocation` | yes |
| 6 | LTV | `ltv` | `/app/ltv` | yes |
| 7 | Advanced | `advanced` | `/app/advanced` | yes |

Notes:

- Overview **must** use `?stay=1` so the cold empty / scoreboard is reachable without `firstOpenRedirect` (see §3). Bare `/app` is a different path.
- Allocation label comes from `PRODUCT_NOUN.spendAllocation` (“Spend Allocation”). LTV nav is short “LTV”; page chrome elsewhere uses “LTV / Acquisition”.
- Core ritual comment in `desk-nav.ts`: Overview · Spend · Settings.

---

## 3. Cold-path reachability

### 3.1 `firstOpenRedirect` (Overview loader)

Defined in `app/app/lib/install-stickiness.ts`. Overview loader (`app._index.tsx`) redirects when it returns a path.

| Condition | Bounce? | Destination |
| --- | --- | --- |
| `shotMode` | No | Stay on `/app` |
| SAMPLE on (`useSampleDesk`) | No | Stay on `/app` (practice desk) |
| Pathname ≠ `/app` | No | N/A |
| `?stay=1` | No | Stay — cold empty / scoreboard |
| No live spend (non-sample rows = 0) | **Yes** | `/app/spend?activate=1` (+ preserved search, `stay` stripped) |
| Has live spend | No | Stay on desk |

Important: this is **not** a one-shot “first open ever” flag. Every bare `/app` load without live spend (and without SAMPLE / shot / `stay=1`) re-bounces to Spend. That is why the Overview **nav** href hard-codes `stay=1`.

### 3.2 SAMPLE

- SAMPLE **suppresses** the Overview → Spend bounce.
- `DataModeBar` + Settings “More” control Sample \| Real; POST target is `/app/data-mode` (not a nav item).
- `/app/demo` is a SAMPLE / listing-ops surface — **not** in primary nav; reachable from upsell / trust banners / deep links.

### 3.3 Spend bounce & return

- Activation teach: `/app/spend?activate=1` (Spend empty teaching copy via `spendEmptyTeach`).
- Return to Overview from Spend CTAs uses `/app?stay=1` (and period variants) so merchants are not immediately bounced back.
- Spend itself is always cold-reachable from primary nav (`/app/spend`) with no Overview redirect in front.

### 3.4 How to reach Overview cold empty

| Entry | Reaches cold empty? |
| --- | --- |
| Primary nav **Overview** (`/app?stay=1`) | **Yes** |
| Spend “Open Total ROAS” / post-save links with `stay=1` | **Yes** |
| Bare install / App Bridge home → `/app` (no stay, no SAMPLE, no spend) | **No** — lands Spend `activate=1` |
| `/app/close` (retired) → `/app` (period only; **no** `stay`) | **No** if still no live spend — re-enters bounce |
| Retry / some in-page `/app?period=…` without `stay` | **Risk** — same bounce if still cold |

---

## 4. In-page Tabs

**No Shopify Polaris / web-component page Tabs** (`Tabs`, `s-tabs`, etc.) were found under `app/app/routes` or desk components.

What exists instead:

| Pattern | Where | Role |
| --- | --- | --- |
| `PeriodControl` segmented buttons | Overview (and period-aware surfaces that mount it) | MTD / LM / QTD / YTD / L12M (shot adds 3 yr) — URL `period`, not a route change |
| Spend Explorer segmented controls | `SpendExplorer` | Chart range / series UI, not primary IA |
| Settings `<details>` “More — sample desk, billing, privacy” | `/app/settings` | Collapsed secondary jobs, not tabs |
| `FirstTrustedRoasGate` | Goals, Allocation, LTV, Advanced | Soft gate overlay when Total ROAS not yet trusted — not tabs |

Primary IA is **flat top nav + long single pages**, not nested tab strips.

---

## 5. Settings & Billing placement

| Surface | In primary nav? | How merchants reach it |
| --- | --- | --- |
| **Settings** (`/app/settings`) | **Yes** — core tab #3 | Margin, target Total ROAS, primary setup |
| **Billing UI** (plan copy + `ProUpgradeButton`) | **No** | Nested under Settings → `<details>` summary **“More — sample desk, billing, privacy”** → section “Plan and billing” |
| **Billing action** (`/app/billing`) | **No** | POST-only; starts Shopify subscription confirmation (top-frame). Comment in Settings: keep Start $39 off the main Settings form |
| Return after charge | — | Billing helper returns merchant to `/app/settings` |

Upsell CTAs elsewhere (`ProUpsellBlock`, Advanced, etc.) link Settings and/or Demo; they do not add a Billing tab.

---

## 6. Surface map (required table)

| Surface | Route | In primary nav? | Reachable cold? | Notes |
| --- | --- | --- | --- | --- |
| Overview | `/app` (+ `?stay=1` from nav) | **Yes** — “Overview” | **Yes via nav** (`stay=1`); bare `/app` **bounces** to Spend if no live spend / SAMPLE / shot | Cold empty + scoreboard + ReviewAsk live here |
| Spend | `/app/spend` | **Yes** — “Spend” | **Yes** | First-open bounce target (`?activate=1`); typed day / CSV / paste |
| Settings | `/app/settings` | **Yes** — “Settings” | **Yes** | Core; margin + target; billing buried in More |
| Goals | `/app/goals` | **Yes** — “Goals” (`later`) | **Yes** (nav always shown) | Soft-gated until trusted Total ROAS |
| Spend Allocation | `/app/allocation` | **Yes** — “Spend Allocation” (`later`) | **Yes** (nav always shown) | Soft-gated; label from `PRODUCT_NOUN` |
| LTV | `/app/ltv` | **Yes** — “LTV” (`later`) | **Yes** (nav always shown) | Soft-gated; page title longer than nav |
| Advanced | `/app/advanced` | **Yes** — “Advanced” (`later`) | **Yes** (nav always shown) | Soft-gated MDS lab |
| Sample \| Real bar | `/app/data-mode` (POST) | No | N/A (chrome) | Always under nav except `shot=1` |
| Demo / SAMPLE ops | `/app/demo` | **No** | Deep link / banners | Not a primary tab |
| Billing confirm | `/app/billing` | **No** | Via Settings More / upgrade button | POST → Shopify confirmation URL |
| Period ledger CSV | `/app/period-ledger.csv` | **No** | From Overview/Spend controls | Export; honesty-gated |
| Spend CSV template | `/app/spend/template` | **No** | From Spend empty / teach | Hidden helper |
| Close (retired) | `/app/close` → `/app` | **No** | Redirect only | Drops `stay` → can re-bounce cold |
| Connections (retired) | `/app/connections` → `/app/spend` | **No** | Redirect only | OAuth UI retired; CSV is SoT |

---

## 7. Five sharp gaps vs best Shopify apps *(hyp)*

Marked **(hyp)** — hypotheses for Desk / UX lanes; validate against companions when those docs land. Not product commitments. Do not treat as review or install claims.

1. **Home is two URLs, not one (hyp).** Best Admin apps treat the first nav item as a stable home. Mcfly’s Overview tab needs `/app?stay=1` while bare `/app` still forever-bounces cold live shops to Spend. Peers rarely require a secret query to make the Home tab work.

2. **Seven always-on tabs including soft-gated depth (hyp).** Top apps progressive-disclose secondary jobs (More menu, post-activation unlock, or nested nav). Mcfly keeps Goals / Spend Allocation / LTV / Advanced visible from install with “First get Total ROAS” walls — honest, but denser and noisier than a cash-desk ritual of three.

3. **Billing is not a first-class Account surface (hyp).** Shopify’s own billing patterns and high-trust apps put plan / trial / manage subscription where merchants expect it (Account, Settings top section, or Pricing). Mcfly nests Start $39 under a collapsed Settings “More…” block plus a POST-only `/app/billing`.

4. **No in-page Tabs for multi-job pages (hyp).** Peers often split Settings (General / Billing / Data) or Analytics (Overview / Channels) with Polaris Tabs. Mcfly uses one scroll + `<details>` + period segments — fine for a thin religion, weak when Settings already mixes margin, SAMPLE, privacy, and billing.

5. **SAMPLE / Real lives in chrome, Demo lives off-nav (hyp).** Best apps pick one demo story (tour toggle **or** Demo page). Mcfly has global `DataModeBar`, Settings SAMPLE controls, and a separate `/app/demo` — three mental models for “practice numbers,” which peers usually collapse to one labeled Preview mode.

---

## 8. Source anchors (for the next pass)

```26:46:mcfly-analytics/app/app/lib/desk-nav.ts
export const DESK_NAV_ITEMS: readonly DeskNavItem[] = [
  // stay=1: Overview tab must reach cold empty / scoreboard without the
  // activation bounce that firstOpenRedirect applies to bare /app.
  { id: "overview", href: "/app?stay=1", label: "Overview", later: false },
  { id: "spend", href: "/app/spend", label: "Spend", later: false },
  { id: "settings", href: "/app/settings", label: "Settings", later: false },
  { id: "goals", href: "/app/goals", label: "Goals", later: true },
  // ... allocation, ltv, advanced
];
```

```84:90:mcfly-analytics/app/app/routes/app.tsx
      <s-app-nav>
        {deskNavItems().map((item) => (
          <s-link key={item.id} href={listingCaptureHref(item.href, shotMode)}>
            {item.label}
          </s-link>
        ))}
      </s-app-nav>
```

```108:120:mcfly-analytics/app/app/lib/install-stickiness.ts
export function firstOpenRedirect(input: FirstOpenRedirectInput): string | null {
  if (input.shotMode || input.useSampleDesk) return null;
  if (input.pathname !== "/app") return null;
  const params = searchParams(input.search);
  if (params.get("stay") === "1") return null;
  // … spend → /app/spend?activate=1
}
```

---

## 9. Out of scope / honesty

- No Fly deploy, no commit, no Partner Submit from this lane.  
- Reviews remain **0** until honest; this audit does not invent social proof.  
- Religion unchanged: Total ROAS = Shopify sales ÷ entered spend; flat $39 after trial.
