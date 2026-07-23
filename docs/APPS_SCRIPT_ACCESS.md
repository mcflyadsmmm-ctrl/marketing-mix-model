# Give Cursor access to the MER Apps Script (optimal)

**Script:** [MER Dashboard](https://script.google.com/home/projects/1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS/settings)  
**Script ID:** `1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS`

Cursor cannot sign into Google for you. Optimal access = **clasp pull** of the source onto disk (gitignored), then tell the agent the folder path.

---

## What we already have

A prior clasp clone lives at:

```text
/tmp/mcfly-mer-script2
```

Same script ID. Good enough to start porting UI craft **today**.  
`/tmp` can vanish on reboot — use the durable path below for ongoing sync.

**Never commit:** `*SeedData.js`, spreadsheet IDs, OAuth tokens, proprietary BCUSA dumps.

---

## Best path (do this once — ~3 minutes)

### 1. Install clasp (if needed)

```bash
npm install -g @google/clasp
```

### 2. Log in (human browser — Cursor cannot finish this)

```bash
clasp login
```

Sign in as the Google account that owns the script (`martysmithson04@gmail.com` or whichever has edit access).

When done, reply in chat: **`clasp logged in`**

### 3. Pull into a gitignored folder in this repo

```bash
cd /Users/martysmithson/marketing-mix-model
mkdir -p vendor/mer-apps-script
cd vendor/mer-apps-script
npx @google/clasp clone 1Ws8OibDzYP4HQR8q04TP_PU5zytokIcz6y8eRQuRidzWY9VyzUARINfS --rootDir .
```

Or if the folder already has `.clasp.json`:

```bash
cd /Users/martysmithson/marketing-mix-model/vendor/mer-apps-script
npx @google/clasp pull
```

Reply: **`script pulled`**

### 4. (Optional but gold) Deployed web app URL

If the script is deployed as a web app:

1. Apps Script → **Deploy** → **Manage deployments**  
2. Copy the **/exec** URL  
3. Paste it here as: **`webapp: https://script.google.com/macros/s/…/exec`**

That lets Cursor open the live UI (fonts, decision strip, KPI grid) for visual QA — source alone is CSS/HTML, the URL is the look.

### 5. (Optional) Screenshots of Overview

If the web app needs Google SSO Cursor can’t pass:

1. Open Overview on desktop  
2. Drop 2–3 PNGs in chat (topbar + decision + KPI grid + channel stack)

---

## What Cursor will read (and ignore)

| Read hard | Skip / never port |
| --- | --- |
| `Stylesheet.html` | `*SeedData.js` |
| `Index.html` (Overview structure) | Domo / multi-brand portfolio |
| `JavaScript.html` (KPI + decision renderers only) | LTV / Klaviyo / Meta Trends as product |
| Cash MER math in `Code.js` | Asana / Gmail archives |

Mcfly religion still wins: cash MER = sales ÷ spend; no pixels/MTA.

---

## Refresh later

```bash
cd /Users/martysmithson/marketing-mix-model/vendor/mer-apps-script && npx @google/clasp pull
```

Then say **`script refreshed`**.

---

## Minimal chat replies that unblock me

| You say | I do |
| --- | --- |
| `clasp logged in` | Run clone/pull into `vendor/mer-apps-script` |
| `script pulled` | Diff vs Mcfly desk; port craft |
| `webapp: <url>` | Open + visual compare |
| *(drop screenshots)* | Match hierarchy/spacing/type |
