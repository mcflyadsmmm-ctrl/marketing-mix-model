# CSV craft pack — fill spend without Mcfly OAuth

**Audience:** Merchants and agencies who already close MER in a sheet (or want to).  
**Product:** [Mcfly Analytics](https://apps.shopify.com/mcfly-analytics-public) — 7-day trial, then **$39**/store/month.  
**Religion:** Total ROAS = Shopify Total Sales ÷ spend you enter. No pixels, no MTA, no Meta/Google login inside Mcfly.

This pack is **docs + in-app templates only**. Mcfly never asks for an ad-network OAuth. Reviews stay honest (do not invent counts).

---

## Pick a path (cheapest first)

| Path | When | OAuth owner |
| --- | --- | --- |
| **A — Paste / upload once** | Monday close, few channels | Nobody |
| **B — SyncWith → Sheet → CSV** | Want daily refresh without Mcfly connectors | You pay SyncWith / Coupler / Supermetrics / Coefficient |
| **C — Apps Script reshape (optional)** | Ads Manager export shape ≠ Mcfly headers | Nobody — paste lives in *your* Sheet |
| **D — Concierge** | Design partner will not CSV yet | Nobody — ops paste — see [`CONCIERGE_SPEND_FILL.md`](./CONCIERGE_SPEND_FILL.md) |

Ladder detail: [`../../research/SPEND_INGEST_LADDER.md`](../../research/SPEND_INGEST_LADDER.md) · pipe doctrine: [`../../PIPE_AUTOMATION_WEDGE.md`](../../PIPE_AUTOMATION_WEDGE.md).

---

## In-app templates (source of truth)

Open **Spend** in Admin, then download. There is **no Automate tab** — the downloads *are* the pipe surface.

| Shape | Blank | Example rows | Headers |
| --- | --- | --- | --- |
| **Long** (one row per day × channel) | `/app/spend/template?pipe=long&blank=1` | `/app/spend/template?pipe=long&example=1` | `date,channel,amount` |
| **Wide** (one row per day) | `/app/spend/template?pipe=wide&blank=1` | `/app/spend/template?pipe=wide&example=1` | `Day` + one column per channel |

In Spend UI: **Pipe templates — automate the fill (optional)** (`#mcfly-spend-pipe`).

Public mirrors (same headers): `site/assets/mcfly-pipe-spend-{long\|wide}-{blank\|example}.csv`.

### Channel strings (long `channel` column = wide header text)

Use these labels **verbatim** so import maps cleanly:

`Meta Ads` · `Google Ads` · `Microsoft Ads` · `TikTok Ads` · `Pinterest Ads` · `Snapchat Ads` · `Reddit Ads` · `X Ads` · `LinkedIn Ads` · `Amazon Ads` · `Apple Search Ads` · `Affiliate Ads` · `Email Cost` · `Other`

- **Dates:** prefer `YYYY-MM-DD` (also accepts common US forms).  
- **Amounts:** spend dollars for that day only — no sales columns. Blank / `0` = no spend.  
- **Replace rule:** same day + channel **replaces**, never doubles.

---

## Path A — Manual (always enough)

1. Ads Manager (or invoice) → daily spend by platform for closed days.  
2. Download blank long or wide template → fill → **Paste** or **Import** on Spend.  
3. Overview → confirm Total ROAS for that period (SAMPLE off, margin set).

Offline / retainers / billboards → type under **Other** (or the named channel) the same way.

---

## Path B — SyncWith → Sheet → pipe (hands-off fill)

Nominative tools only — you pay them; Mcfly is **not** “Works with” SyncWith / Coupler / Supermetrics / Coefficient.

```text
Pipe tool (SyncWith / Coupler / …)
        → schedules Meta / Google / TikTok / … spend into a Google Sheet
        → Sheet columns match a Mcfly template (long or wide)
Merchant File → Download → CSV
        → Spend → Paste / Import
        → Overview Total ROAS
```

### Setup checklist

1. Subscribe to a spreadsheet pipe you already trust. **It** owns the ad login.  
2. In Mcfly Spend, download **blank long** (most pipe tools default to long) or **blank wide**.  
3. Create a Sheet whose **header row matches exactly** (copy from the CSV).  
4. Map each platform’s “amount spent” (or cost) field → `amount` (long) or the matching wide column. Map date → `date` / `Day`. Map platform name → exact channel string above (or map into wide columns).  
5. Schedule daily (or weekday) refresh into that Sheet.  
6. Export CSV → Spend import. Same day + channel replaces.

**Do not** put Shopify sales into the pipe Sheet — sales stay in Shopify; Mcfly already reads the till.

---

## Path C — Optional Apps Script paste (reshape only)

Use this when you already have a Sheet of daily spend but columns are messy (Ads Manager export, agency dump). This script does **not** call Meta, Mcfly, or any OAuth — it only reshapes rows in *your* spreadsheet into Mcfly **long** CSV shape.

### Install

1. Google Sheet → **Extensions → Apps Script**.  
2. Paste the function below → Save.  
3. Put source data on a tab named `Raw` with columns `date | platform | spend` (any header names in row 1; script uses column index A/B/C).  
4. Run `exportMcflyLongCsv` → creates/overwrites tab `McflyLong` with `date,channel,amount`.  
5. File → Download → CSV of `McflyLong` → Spend import.

Optional: map platform nicknames → Mcfly channel labels in `CHANNEL_MAP`.

```javascript
/**
 * Mcfly Analytics — optional Sheet reshape (merchant paste).
 * No ad OAuth. No Mcfly API. Output = long pipe: date,channel,amount
 */
var CHANNEL_MAP = {
  meta: "Meta Ads",
  facebook: "Meta Ads",
  fb: "Meta Ads",
  instagram: "Meta Ads",
  google: "Google Ads",
  bing: "Microsoft Ads",
  microsoft: "Microsoft Ads",
  tiktok: "TikTok Ads",
  pinterest: "Pinterest Ads",
  snapchat: "Snapchat Ads",
  reddit: "Reddit Ads",
  twitter: "X Ads",
  x: "X Ads",
  linkedin: "LinkedIn Ads",
  amazon: "Amazon Ads",
  apple: "Apple Search Ads",
  affiliate: "Affiliate Ads",
  email: "Email Cost",
  klaviyo: "Email Cost",
  other: "Other",
};

function normalizeChannel_(raw) {
  var key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/ads?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")[0];
  return CHANNEL_MAP[key] || "Other";
}

function formatYmd_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    var y = value.getFullYear();
    var m = ("0" + (value.getMonth() + 1)).slice(-2);
    var d = ("0" + value.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  var s = String(value || "").trim();
  var mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    return mdy[3] + "-" + ("0" + mdy[1]).slice(-2) + "-" + ("0" + mdy[2]).slice(-2);
  }
  return s;
}

/** Raw!A:C → McflyLong with header date,channel,amount */
function exportMcflyLongCsv() {
  var ss = SpreadsheetApp.getActive();
  var raw = ss.getSheetByName("Raw");
  if (!raw) throw new Error('Create a tab named "Raw" with date | platform | spend.');
  var values = raw.getDataRange().getValues();
  if (values.length < 2) throw new Error("Raw needs a header row + at least one data row.");

  var out = [["date", "channel", "amount"]];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var date = formatYmd_(row[0]);
    var channel = normalizeChannel_(row[1]);
    var amount = row[2];
    if (!date) continue;
    if (amount === "" || amount === null || amount === undefined) continue;
    out.push([date, channel, amount]);
  }

  var dest = ss.getSheetByName("McflyLong");
  if (!dest) dest = ss.insertSheet("McflyLong");
  dest.clearContents();
  dest.getRange(1, 1, out.length, 3).setValues(out);
}
```

**Not this pack:** the internal `sheets/` overnight MER companion (API token). That is founder/ops tooling, not the merchant spend-fill path.

---

## Path D — Concierge pointer

If the merchant will not CSV yet (outbound / interview design partners), ops can paste closed-day totals for them — still no Meta OAuth. Playbook: [`CONCIERGE_SPEND_FILL.md`](./CONCIERGE_SPEND_FILL.md). Push them to Path A or B after first trusted Total ROAS.

---

## Reply snippet (support / outbound)

```text
To fill spend without connecting Meta or Google to Mcfly:

1. In Admin → Spend → “Pipe templates — automate the fill (optional)”
2. Download long or wide: /app/spend/template?pipe=long or ?pipe=wide
3. Optional: SyncWith / Coupler / Supermetrics / Coefficient → Sheet matching those headers → export CSV → Spend import
4. Or paste by hand — always enough. Flat $39/store/mo after the 7-day trial.

Craft pack (full steps): docs/ops/money/CSV_CRAFT_PACK.md
```

---

## Refuse

- Meta / Google / TikTok OAuth inside Mcfly  
- Fake “Works with” logos for pipe vendors  
- Putting pixels or platform ROAS into the desk  
- Inventing reviews or install counts  
- Selling freelancers as the fill service (Shopify 1.1.14) — concierge is design-partner only
