# Overnight orchestrator — enterprise autonomous loop

Mcfly runs **without you prompting** via three surfaces that share one brain:

| Surface | Runs where | Schedule |
| --- | --- | --- |
| **GitHub Actions** | `.github/workflows/overnight.yml` | Daily 07:00 UTC + manual |
| **Node worker** | `npm run overnight` | Railway/Fly cron or `crontab` |
| **Google Sheets** | `sheets/Orchestrator.gs` | Hourly + daily triggers |

Your Black Clover example was a single MER Dashboard web app. Mcfly’s Sheets companion is **multi-tab, phased, and self-healing**:

- **Executive Summary** — cash MER vs break-even at a glance
- **MER Dashboard** — append-only history with conditional formatting
- **Allocation** — live action cards from `@mcfly/mer-core`
- **Ops Log** — auditable phase trail (preflight → fetch → recon → snapshot → alert)
- **Email + Slack** on recon breach or below break-even

---

## 1. Server overnight worker

### Run locally

```bash
docker compose up -d db
cd app && cp .env.example .env
# set DATABASE_URL=postgresql://mcfly:mcfly@localhost:5432/mcfly
npx prisma migrate deploy
node scripts/seed-sample-data.mjs
cd .. && npm run overnight
```

Reports land in `reports/overnight_*.json` and `.md`.

### Phases

```text
preflight → sync → recon → snapshot → allocate → report
```

- **Preflight:** `npm test` + package builds
- **Sync:** Meta + Google daily spend via `@mcfly/connectors` (mock until `MCFLY_LIVE_META=1`)
- **Recon:** compares spend to prior `MerSnapshot`; breach if delta >5%
- **Snapshot:** upserts `MerSnapshot` with channel mix + allocation JSON
- **Report:** markdown summary; process exits `1` on kill criteria

### Production cron (Railway example)

Add a cron service:

```text
0 7 * * * cd /repo && DATABASE_URL=... node app/scripts/overnight-run.mjs
```

---

## 2. REST API (Sheets + external clients)

After deploy, issue a token:

```bash
cd app
node scripts/mint-api-token.mjs your-store.myshopify.com
```

Set on host:

```text
MCFLY_API_TOKEN=...   # optional global token
```

Endpoints (Bearer auth):

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/v1/mer?from&to` | Cash MER snapshot |
| GET | `/v1/allocation?from&to` | Allocation card |
| POST | `/v1/spend` | Manual spend ingest |

Header: `X-Mcfly-Shop-Id: your-store.myshopify.com` (when using global token).

Contract: `packages/api-contract/openapi.yaml`

---

## 3. Google Sheets enterprise setup

1. Create a Google Sheet
2. **Extensions → Apps Script** — add every file from `/sheets/`:
   - `Code.gs`, `Api.gs`, `Orchestrator.gs`, `Dashboard.gs`, `Alerts.gs`, `appsscript.json`
3. **Script properties:**

| Key | Example |
| --- | --- |
| `MCFLY_API_BASE` | `https://app.mcflyads.com/v1` |
| `MCFLY_API_TOKEN` | from `mint-api-token.mjs` |
| `MCFLY_SHOP_ID` | `your-store.myshopify.com` |
| `MCFLY_ALERT_EMAIL` | `you@domain.com` |
| `MCFLY_SLACK_WEBHOOK` | optional |
| `MCFLY_RECON_THRESHOLD` | `0.05` |

4. Reload sheet → **Mcfly Analytics → Install overnight triggers**
5. Hourly passes run unattended; daily digest emails at ~1am sheet TZ

### Manual run

**Mcfly Analytics → Run once (full pass)**

---

## 4. Cursor Automation (runs all night in cloud)

1. Open [cursor.com/automations](https://cursor.com/automations)
2. New automation → schedule **every night**
3. Paste prompt from [`docs/AGENTS.md`](./AGENTS.md)
4. Point at this repo, branch `cursor/mcfly-master-plan-eb36`

The agent will test, run overnight worker logic, fix build breaks, and open PRs on recon failures.

---

## 5. Database tables

| Table | Purpose |
| --- | --- |
| `SyncRun` | Phase audit log per overnight run |
| `MerSnapshot` | Daily MER + allocation JSON |
| `ApiToken` | Per-shop bearer tokens for Sheets |

---

## Kill criteria (MASTER_PLAN §11)

Exit non-zero / send alerts when:

- Spend recon fails ±5% for 14 days
- Below break-even with no allocation actions despite spend
- Preflight tests fail

---

## What this is not

- Not MTA / pixel sync
- Not a SyncWith connector catalog
- Not unattended Shopify Partner login (human gate remains)

Next human step after API is live: [SHIP_NOW.md](./SHIP_NOW.md) → first install → mint token → Sheets triggers.
